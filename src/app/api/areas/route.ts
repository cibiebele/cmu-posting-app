import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireApiUser, isSameOrigin } from "@/lib/auth";
import Area from "@/models/Area";

export async function GET() {
  try {
    await connectDB();

    const areas = await Area.find()
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ areas });
  } catch (error) {
    console.error("Get areas error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve areas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 }
    );
  }

  const { user, response } = await requireApiUser([
    "admin",
    "super_admin",
  ]);

  if (response) return response;

  try {
    await connectDB();

    const body = await request.json();

    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Area name is required" },
        { status: 400 }
      );
    }

    const normalizedName = name.toLowerCase();

    const existing = await Area.findOne({ normalizedName });

    if (existing) {
      return NextResponse.json(
        { error: "An area with this name already exists" },
        { status: 409 }
      );
    }

    const area = await Area.create({
      name,
      normalizedName,
      description,
      status: "active",
      createdBy: user?.id,
    });

    return NextResponse.json(
      { message: "Area created successfully", area },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create area error:", error);

    return NextResponse.json(
      { error: "Unable to create area" },
      { status: 500 }
    );
  }
}