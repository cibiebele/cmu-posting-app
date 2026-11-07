import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Branch from "@/models/Branch";
import { requireApiUser, isSameOrigin } from "@/lib/auth";
import { branchSchema } from "@/lib/validators";
import { isDuplicateKey, jsonError } from "@/lib/http";
export async function GET() {
  const auth = await requireApiUser(["super_admin", "admin"]);
  if (auth.response) return auth.response;
  try {
    await connectDB();
    const branches = await Branch.find().sort({ name: 1 }).lean();
    return NextResponse.json({ branches });
  } catch (error) {
    console.error(error);
    return jsonError("Unable to load branches", 500);
  }
}
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const auth = await requireApiUser(["super_admin", "admin"]);
  if (auth.response) return auth.response;
  try {
    const parsed = branchSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Enter a valid branch name");
    await connectDB();
    const branch = await Branch.create(parsed.data);
    return NextResponse.json({ branch }, { status: 201 });
  } catch (error) {
    if (isDuplicateKey(error))
      return jsonError("A branch with this name already exists", 409);
    console.error(error);
    return jsonError("Unable to create branch", 500);
  }
}
