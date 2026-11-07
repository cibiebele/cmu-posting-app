import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import Invitation from '@/models/Invitation';
import User from '@/models/User';
import { isSameOrigin } from '@/lib/auth';
import { jsonError } from '@/lib/http';
const schema = z.object({token:z.string().min(32),password:z.string().min(10).max(128)});
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError('Invalid request origin',403);
  try {
    const parsed = schema.safeParse(await request.json()); if (!parsed.success) return jsonError('Use a valid invitation and a password of at least 10 characters');
    await connectDB();
    const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
    const invitation = await Invitation.findOne({tokenHash,acceptedAt:null,revokedAt:null,expiresAt:{$gt:new Date()}});
    if (!invitation) return jsonError('This invitation is invalid, expired or already used',410);
    const user = await User.findById(invitation.user);
    if (!user || user.invitationAcceptedAt || user.status !== 'inactive') return jsonError('This invitation can no longer be used',409);
    user.passwordHash = await bcrypt.hash(parsed.data.password,12);
    user.status = 'active'; user.invitationAcceptedAt = new Date();
    invitation.acceptedAt = new Date();
    await user.save(); await invitation.save();
    return NextResponse.json({message:'Your account is ready. You can now sign in.'});
  } catch (error) { console.error(error); return jsonError('Unable to complete registration',500); }
}
