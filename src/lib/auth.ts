import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const COOKIE = "cmu_session";
function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32)
    throw new Error("AUTH_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(value);
}
export type SessionUser = {
  id: string;
  role: string;
  name: string;
  membershipNumber: string;
};
export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
export async function clearSession() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
export async function getSession(): Promise<SessionUser | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    if (!payload.id || !payload.role || !payload.name) {
      return null;
    }
    await connectDB();
    const user = await User.findById(String(payload.id))
      .select("_id role name membershipNumber status")
      .lean();
    if (!user || user.status !== "active" || user.role !== payload.role)
      return null;
    return {
      id: String(user._id),
      role: user.role,
      name: user.name,
      membershipNumber: user.membershipNumber || "",
    };
  } catch {
    return null;
  }
}
export async function requireApiUser(roles?: string[]) {
  const user = await getSession();
  if (!user)
    return {
      user: null,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  if (roles && !roles.includes(user.role))
    return {
      user: null,
      response: NextResponse.json(
        { error: "You do not have permission to perform this action" },
        { status: 403 },
      ),
    };
  return { user, response: null };
}
export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}
