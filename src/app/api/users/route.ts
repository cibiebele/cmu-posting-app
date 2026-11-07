import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Branch from "@/models/Branch";
import Invitation from "@/models/Invitation";
import { requireApiUser, isSameOrigin } from "@/lib/auth";
import { memberSchema } from "@/lib/validators";
import { isDuplicateKey, jsonError } from "@/lib/http";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(["super_admin", "admin"]);
  if (auth.response) return auth.response;
  try {
    await connectDB();
    const page = Math.max(
      1,
      Number(request.nextUrl.searchParams.get("page") || 1),
    );
    const limit = Math.min(
      100,
      Math.max(1, Number(request.nextUrl.searchParams.get("limit") || 20)),
    );
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { membershipNumber: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
          ],
        }
      : {};
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash")
        .populate("branch", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);
    return NextResponse.json({ users, total, page, limit });
  } catch (error) {
    console.error(error);
    return jsonError("Unable to load members", 500);
  }
}
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const auth = await requireApiUser(["super_admin", "admin"]);
  if (auth.response) return auth.response;
  try {
    const parsed = memberSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        {
          error: "Please check the member details",
          details: parsed.error.flatten(),
        },
        { status: 422 },
      );
    const data = parsed.data;
    if (
      ["super_admin", "admin"].includes(data.role) &&
      auth.user?.role !== "super_admin"
    )
      return jsonError(
        "Only a Super Admin can assign administrative roles",
        403,
      );
    await connectDB();
    const branch = await Branch.findOne({ _id: data.branch, status: "active" });
    if (!branch) return jsonError("Select an active branch");
    const existing = await User.findOne({ membershipNumber: data.membershipNumber });
    if (existing)
      return jsonError("A member with this membership number already exists", 409);
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const hours = Math.min(
      168,
      Math.max(1, Number(process.env.INVITATION_TTL_HOURS || 48)),
    );
    const user = await User.create({
      ...data,
      phone: data.phone || undefined,
      status: "inactive",
      branch: branch._id,
      createdBy: auth.user!.id,
    });
    await Invitation.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
      createdBy: auth.user!.id,
    });
    const invitationUrl = `${process.env.APP_URL || request.nextUrl.origin}/invite/${rawToken}`;
    return NextResponse.json(
      {
        message: "Member created. Share the invitation link securely.",
        user: {
          id: String(user._id),
          name: user.name,
          membershipNumber: user.membershipNumber,
          status: user.status,
        },
        invitationUrl,
        expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
      },
      { status: 201 },
    );
  } catch (error) {
    if (isDuplicateKey(error))
      return jsonError("Membership number or phone number is already registered", 409);
    console.error(error);
    return jsonError("Unable to create member", 500);
  }
}
