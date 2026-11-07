import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { requireApiUser, isSameOrigin } from "@/lib/auth";
import Area from "@/models/Area";
import Location from "@/models/Location";

export async function GET() {
  try {
    await connectDB();

    const locations = await Location.find()
      .populate("area", "name status")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Get locations error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve locations" },
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

  const { response } = await requireApiUser([
    "admin",
    "super_admin",
  ]);

  if (response) return response;

  try {
    await connectDB();

    const body = await request.json();

    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const areaId = String(body.area || "");

    if (!name || !areaId) {
      return NextResponse.json(
        { error: "Location name and area are required" },
        { status: 400 }
      );
    }

    const area = await Area.findById(areaId);

    if (!area || area.status !== "active") {
      return NextResponse.json(
        { error: "Select an active area" },
        { status: 400 }
      );
    }

    const normalizedName = name.toLowerCase();

    const existing = await Location.findOne({
      area: areaId,
      normalizedName,
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "A location with this name already exists in this area",
        },
        { status: 409 }
      );
    }

    const location = await Location.create({
      name,
      normalizedName,
      description,
      area: areaId,
      status: "active",
    });

    await location.populate("area", "name status");

    return NextResponse.json(
      {
        message: "Location created successfully",
        location,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create location error:", error);

    return NextResponse.json(
      { error: "Unable to create location" },
      { status: 500 }
    );
  }
}