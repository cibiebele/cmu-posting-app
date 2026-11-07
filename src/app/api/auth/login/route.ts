import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { createSession, isSameOrigin } from "@/lib/auth";
import { jsonError } from "@/lib/http";

const schema = z.object({
  membershipNumber: z.string().min(5).max(100),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success)
      return jsonError("Enter a valid membership number and password");
    await connectDB();
    const user = await User.findOne({
      membershipNumber: parsed.data.membershipNumber.toLowerCase(),
    }).select("+passwordHash");
    if (
      !user ||
      user.status !== "active" ||
      !user.passwordHash ||
      !(await bcrypt.compare(parsed.data.password, user.passwordHash))
    ) {
      return jsonError("Invalid membership number or password", 401);
    }
    await createSession({
      id: String(user._id),
      role: user.role,
      name: user.name,
      membershipNumber: user.membershipNumber,
    });
    return NextResponse.json({
      user: {
        id: String(user._id),
        name: user.name,
        membershipNumber: user.membershipNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error", error);
    return jsonError("Unable to sign in", 500);
  }
}
