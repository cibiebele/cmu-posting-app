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
        { error: "Invalid area ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const area = await Area.findById(id);

    if (!area) {
      return NextResponse.json(
        { error: "Area not found" },
        { status: 404 }
      );
    }

    if (body.name !== undefined) {
      const name = String(body.name).trim();

      if (!name) {
        return NextResponse.json(
          { error: "Area name is required" },
          { status: 400 }
        );
      }

      const normalizedName = name.toLowerCase();

      const duplicate = await Area.findOne({
        normalizedName,
        _id: { $ne: id },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Another area already uses this name" },
          { status: 409 }
        );
      }

      area.name = name;
      area.normalizedName = normalizedName;
    }

    if (body.description !== undefined) {
      area.description = String(body.description).trim();
    }

    if (body.status !== undefined) {
      if (!["active", "inactive"].includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid area status" },
          { status: 400 }
        );
      }

      if (body.status === "inactive") {
        const activeLocations = await Location.countDocuments({
          area: id,
          status: "active",
        });

        if (activeLocations > 0) {
          return NextResponse.json(
            {
              error:
                "Deactivate or reassign this area's active locations first.",
            },
            { status: 409 }
          );
        }
      }

      area.status = body.status;
    }

    await area.save();

    return NextResponse.json({
      message: "Area updated successfully",
      area,
    });
  } catch (error) {
    console.error("Update area error:", error);

    return NextResponse.json(
      { error: "Unable to update area" },
      { status: 500 }
    );
  }
}

// Archive an area rather than permanently deleting it.
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
        { error: "Invalid area ID" },
        { status: 400 }
      );
    }

    const area = await Area.findById(id);

    if (!area) {
      return NextResponse.json(
        { error: "Area not found" },
        { status: 404 }
      );
    }

    const locations = await Location.countDocuments({
      area: id,
    });

    if (locations > 0) {
      return NextResponse.json(
        {
          error:
            "This area contains locations. Reassign or archive those locations before archiving the area.",
        },
        { status: 409 }
      );
    }

    area.status = "inactive";
    await area.save();

    return NextResponse.json({
      message: "Area archived successfully",
    });
  } catch (error) {
    console.error("Archive area error:", error);

    return NextResponse.json(
      { error: "Unable to archive area" },
      { status: 500 }
    );
  }
}