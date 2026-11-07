import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireApiUser, isSameOrigin } from "@/lib/auth";
import Area from "@/models/Area";
import Location from "@/models/Location";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: NextRequest,
  { params }: Context
) {
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

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid location ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const location = await Location.findById(id);

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    if (body.name !== undefined) {
      const name = String(body.name).trim();

      if (!name) {
        return NextResponse.json(
          { error: "Location name is required" },
          { status: 400 }
        );
      }

      location.name = name;
      location.normalizedName = name.toLowerCase();
    }

    if (body.description !== undefined) {
      location.description = String(body.description).trim();
    }

    if (body.area !== undefined) {
      const area = await Area.findById(body.area);

      if (!area || area.status !== "active") {
        return NextResponse.json(
          { error: "Select an active area" },
          { status: 400 }
        );
      }

      location.area = area._id;
    }

    if (body.status !== undefined) {
      if (!["active", "inactive"].includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid location status" },
          { status: 400 }
        );
      }

      location.status = body.status;
    }

    await location.save();
    await location.populate("area", "name status");

    return NextResponse.json({
      message: "Location updated successfully",
      location,
    });
  } catch (error) {
    console.error("Update location error:", error);

    return NextResponse.json(
      { error: "Unable to update location. Check for duplicate names." },
      { status: 500 }
    );
  }
}

// Archive instead of permanently deleting posting history.
export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
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

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid location ID" },
        { status: 400 }
      );
    }

    const location = await Location.findById(id);

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    location.status = "inactive";
    await location.save();

    return NextResponse.json({
      message: "Location archived successfully",
    });
  } catch (error) {
    console.error("Archive location error:", error);

    return NextResponse.json(
      { error: "Unable to archive location" },
      { status: 500 }
    );
  }
}