import mongoose, { Schema, models } from "mongoose";

const InvitationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

InvitationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default models.Invitation ||
  mongoose.model("Invitation", InvitationSchema);