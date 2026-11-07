import mongoose, { Schema, models, model } from "mongoose";

const LocationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    area: {
      type: Schema.Types.ObjectId,
      ref: "Area",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

LocationSchema.index(
  { area: 1, normalizedName: 1 },
  { unique: true }
);

LocationSchema.pre("validate", function () {
  if (this.name) {
    this.normalizedName = this.name.trim().toLowerCase();
  }
});

export default models.Location || model("Location", LocationSchema);