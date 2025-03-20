import mongoose from "mongoose";

// Define the Transfer schema
const transferSchema = new mongoose.Schema(
  {
    prisoner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prisoner",
      required: [true, "Prisoner ID is required"],
    },
    fromPrison: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prison",
      required: [true, "From prison ID is required"],
    },
    toPrison: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prison",
      required: [true, "To prison ID is required"],
    },
    escortStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: [true, "Escort staff ID is required"],
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle ID is required"],
    },
    transferDate: {
      type: Date,
      required: [true, "Transfer date is required"],
    },
    actualTransferDate: {
      type: Date,
    },
    reason: {
      type: String,
      required: [true, "Reason for transfer is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "In Progress", "Completed", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Create the Transfer model
const Transfer = mongoose.model("Transfer", transferSchema);

export default Transfer;