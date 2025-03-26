import mongoose from "mongoose";

const prisonSchema = new mongoose.Schema(
  {
    prison_name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 0,
    },
    current_population: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "under_maintenance"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Prison = mongoose.model("Prison", prisonSchema);

export default Prison;
