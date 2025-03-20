import mongoose from "mongoose";

// Define the DailyIntake schema
const dailyIntakeSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Date is required"],
      unique: true, // Ensure each date is unique
    },
    intakeCount: {
      type: Number,
      required: [true, "Intake count is required"],
      min: 0, // Ensure the count is non-negative
    },
    transferCount: {
      type: Number,
      required: [true, "Transfer count is required"],
      min: 0, // Ensure the count is non-negative
    },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Define the TransferStats schema
const transferStatsSchema = new mongoose.Schema(
  {
    successRate: {
      type: Number,
      required: [true, "Success rate is required"],
      min: 0,
      max: 100, // Success rate is a percentage
    },
    averageDelay: {
      type: Number,
      required: [true, "Average delay is required"],
      min: 0, // Delay cannot be negative
    },
    totalTransfers: {
      type: Number,
      required: [true, "Total transfers is required"],
      min: 0, // Total transfers cannot be negative
    },
    complianceStatus: {
      type: String,
      required: [true, "Compliance status is required"],
      enum: ["Compliant", "Non-compliant"], // Only allow these values
    },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Create the DailyIntake model
const DailyIntake = mongoose.model("DailyIntake", dailyIntakeSchema);

// Create the TransferStats model
const TransferStats = mongoose.model("TransferStats", transferStatsSchema);

// Export the models
export { DailyIntake, TransferStats };