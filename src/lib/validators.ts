import { z } from "zod";
export const memberSchema = z.object({
  name: z.string().trim().min(2).max(120),
  membershipNumber: z.string().trim().min(3).max(50),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().min(3).max(500),
  gender: z.enum(["Male", "Female"]),
  branch: z.string().min(1),
  role: z.enum([
    "super_admin",
    "admin",
    "coordinator",
    "assistant_coordinator",
    "posting_officer",
    "member",
  ]),
});
export const branchSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().max(20).optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).optional(),
});
