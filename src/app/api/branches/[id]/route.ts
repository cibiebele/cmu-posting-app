import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Branch from "@/models/Branch";
import User from "@/models/User";
import { requireApiUser, isSameOrigin } from "@/lib/auth";
import { branchSchema } from "@/lib/validators";
import { isDuplicateKey, jsonError } from "@/lib/http";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, context: Context) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const auth = await requireApiUser(["super_admin", "admin"]);
  if (auth.response) return auth.response;
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return jsonError("Invalid branch ID");
    const parsed = branchSchema.partial().safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid branch details");
    await connectDB();
    const branch = await Branch.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true, runValidators: true },
    );
    if (!branch) return jsonError("Branch not found", 404);
    return NextResponse.json({ branch });
  } catch (error) {
    if (isDuplicateKey(error))
      return jsonError("A branch with this name already exists", 409);
    console.error(error);
    return jsonError("Unable to update branch", 500);
  }
}
export async function DELETE(request: NextRequest, context: Context) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const auth = await requireApiUser(["super_admin", "admin"]);
  if (auth.response) return auth.response;
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return jsonError("Invalid branch ID");
    await connectDB();
    const inUse = await User.exists({ branch: id });
    if (inUse)
      return jsonError(
        "This branch has members. Deactivate it instead of deleting it.",
        409,
      );
    const branch = await Branch.findByIdAndDelete(id);
    if (!branch) return jsonError("Branch not found", 404);
    return NextResponse.json({ message: "Branch deleted" });
  } catch (error) {
    console.error(error);
    return jsonError("Unable to delete branch", 500);
  }
}
