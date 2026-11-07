import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Invitation from "@/models/Invitation";
import { requireApiUser, isSameOrigin } from "@/lib/auth";
import { jsonError } from "@/lib/http";
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const auth = await requireApiUser(["super_admin", "admin"]);
  if (auth.response) return auth.response;
  try {
    const body = await request.json();
    const userId = String(body.userId || "");
    await connectDB();
    const user = await User.findById(userId);
    if (!user || user.invitationAcceptedAt)
      return jsonError("Member not found or invitation already accepted", 404);
    await Invitation.updateMany(
      { user: user._id, acceptedAt: null, revokedAt: null },
      { revokedAt: new Date() },
    );
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const hours = Math.min(
      168,
      Math.max(1, Number(process.env.INVITATION_TTL_HOURS || 48)),
    );
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    await Invitation.create({
      user: user._id,
      tokenHash,
      expiresAt,
      createdBy: auth.user!.id,
    });
    return NextResponse.json({
      invitationUrl: `${process.env.APP_URL || request.nextUrl.origin}/invite/${rawToken}`,
      expiresAt,
    });
  } catch (error) {
    console.error(error);
    return jsonError("Unable to resend invitation", 500);
  }
}
