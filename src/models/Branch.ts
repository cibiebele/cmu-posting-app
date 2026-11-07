import mongoose, { Schema, models } from "mongoose";

const BranchSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    address: {
      type: String
    }
  },
  { timestamps: true }
);

export default models.Branch ||
  mongoose.model("Branch", BranchSchema);