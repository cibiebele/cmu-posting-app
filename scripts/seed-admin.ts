import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../src/lib/db";
import User from "../src/models/User";
import Branch from "../src/models/Branch";

async function main() {
  const name = process.env.INITIAL_ADMIN_MEMBERSHIP_NO,
    membershipNumber = process.env.INITIAL_ADMIN_M,
    password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!name || !membershipNumber || !password || password.length < 12)
    throw new Error(
      "Set INITIAL_ADMIN_NAME, INITIAL_ADMIN_MEMBERSHIP_NO and a password of at least 12 characters.",
    );
  await connectDB();
  const existing = await User.findOne({ role: "super_admin" });
  if (existing)
    throw new Error("A Super Admin already exists. Seed operation stopped.");
  let branch = await Branch.findOne({ name: "Headquarters" });
  if (!branch)
    branch = await Branch.create({ name: "Headquarters", code: "HQ" });
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    name,
    membershipNumber: membershipNumber.toLowerCase(),
    address: "Headquarters",
    gender: "Male",
    branch: branch._id,
    role: "super_admin",
    status: "active",
    passwordHash,
    invitationAcceptedAt: new Date(),
  });
  console.log(`Initial Super Admin created: ${membershipNumber}`);
  await import("mongoose").then((m) => m.default.disconnect());
}
main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
