import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Branch from "@/models/Branch";
import { requireApiUser, isSameOrigin } from "@/lib/auth";
import { memberSchema } from "@/lib/validators";
import { isDuplicateKey, jsonError } from "@/lib/http";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, context: Context) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const auth = await requireApiUser(["super_admin", "admin"]);
  if (auth.response) return auth.response;
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return jsonError("Invalid member ID");
    const parsed = memberSchema.partial().safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid member details");
    if (
      parsed.data.role &&
      ["super_admin", "admin"].includes(parsed.data.role) &&
      auth.user?.role !== "super_admin"
    )
      return jsonError(
        "Only a Super Admin can assign administrative roles",
        403,
      );
    await connectDB();
    if (parsed.data.branch) {
      const b = await Branch.exists({
        _id: parsed.data.branch,
        status: "active",
      });
      if (!b) return jsonError("Select an active branch");
    }
    const target = await User.findById(id);
    if (!target) return jsonError("Member not found", 404);
    if (target.role === "super_admin" && auth.user?.role !== "super_admin")
      return jsonError("Only a Super Admin can modify this account", 403);
    if (
      target.role === "super_admin" &&
      parsed.data.role &&
      parsed.data.role !== "super_admin"
    )
      return jsonError("Super Admin role changes require a Super Admin", 403);
    Object.assign(target, parsed.data);
    if (parsed.data.phone === "") target.phone = undefined;
    await target.save();
    return NextResponse.json({
      user: {
        id: String(target._id),
        name: target.name,
        membershipNumber: target.membershipNumber,
        phone: target.phone,
        address: target.address,
        gender: target.gender,
        branch: target.branch,
        role: target.role,
        status: target.status,
      },
    });
  } catch (error) {
    if (isDuplicateKey(error))
      return jsonError("Membership number or phone number already exists", 409);
    console.error(error);
    return jsonError("Unable to update member", 500);
  }
}
