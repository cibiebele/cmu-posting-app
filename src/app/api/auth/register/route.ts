import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Branch from "@/models/Branch";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Basic same-origin protection
    const origin = request.headers.get("origin");

    if (origin && new URL(origin).host !== request.headers.get("host")) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();

    const name = String(body.name || "").trim();
    const membershipNumber = String(
      body.membershipNumber || ""
    ).trim().toUpperCase();

    const gender = String(body.gender || "").toLowerCase();
    const address = String(body.address || "").trim();
    const branchId = String(body.branch || "");

    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");

    // Required fields
    if (
      !name ||
      !membershipNumber ||
      !gender ||
      !address ||
      !branchId ||
      !password ||
      !confirmPassword
    ) {
      return NextResponse.json(
        { error: "Please complete all required fields." },
        { status: 400 }
      );
    }

    // Membership number validation
    if (!/^[A-Z0-9-]{3,30}$/.test(membershipNumber)) {
      return NextResponse.json(
        { error: "Enter a valid membership number." },
        { status: 400 }
      );
    }

    if (!["male", "female"].includes(gender)) {
      return NextResponse.json(
        { error: "Select a valid gender." },
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(branchId)) {
      return NextResponse.json(
        { error: "Select a valid branch." },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must contain at least 8 characters." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    // Verify branch
    const branch = await Branch.findById(branchId);

    if (!branch || branch.status !== "active") {
      return NextResponse.json(
        { error: "Selected branch is unavailable." },
        { status: 400 }
      );
    }

    // Check membership number uniqueness
    const existingUser = await User.findOne({
      membershipNumber,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "This membership number has already been registered.",
        },
        { status: 409 }
      );
    }

    // Securely hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Always assign member role on the server.
    // Ignore any role supplied by the browser.
    const user = await User.create({
      name,
      membershipNumber,
      gender,
      address,
      branch: branch._id,
      passwordHash,
      role: "member",
      status: "active",
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Your CMU One registration has been completed successfully. Thank you for registering. You may now close this page.",
        registration: {
          membershipNumber: user.membershipNumber,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Handle duplicate-key race conditions
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          error:
            "This membership number has already been registered.",
        },
        { status: 409 }
      );
    }

    console.error("Public registration error:", error);

    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}