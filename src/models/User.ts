import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    membershipNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },

    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    role: {
      type: String,
      enum: [
        "super_admin",
        "admin",
        "coordinator",
        "assistant_coordinator",
        "posting_officer",
        "member",
      ],
      default: "member",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },

    passwordHash: {
      type: String,
      select: false,
    },

    lastAttendanceAt: {
      type: Date,
      default: null,
    },

    invitationAcceptedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export default models.User || mongoose.model("User", UserSchema);
