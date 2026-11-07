import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Branch from "@/models/Branch";
import Invitation from "@/models/Invitation";

export default async function DashboardPage() {
  await connectDB();
  const [members, active, inactive, branches, pending] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "active" }),
    User.countDocuments({ status: "inactive" }),
    Branch.countDocuments({ status: "active" }),
    Invitation.countDocuments({
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }),
  ]);
  const stats = [
    ["Total members", members],
    ["Active members", active],
    ["Inactive / pending activation", inactive],
    ["Active branches", branches],
    ["Pending invitations", pending],
  ];
  return (
    <div>
      <p className="text-sm text-blue-700 font-semibold">ADMINISTRATION</p>
      <h1 className="text-3xl font-bold mt-2">Dashboard</h1>
      <p className="text-slate-500 mt-1">
        Membership overview and administration.
      </p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-white border rounded-xl p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 bg-white border rounded-xl p-6">
        <h2 className="font-semibold">Getting started</h2>
        <p className="text-sm text-slate-500 mt-2">
          Add branches first, then register members and share their invitation
          links.
        </p>
      </div>
    </div>
  );
}
