import mongoose from "mongoose";

const visitorScheduleSchema = new mongoose.Schema(
  {
    visitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VisitorAccount",
      required: true,
    },
    inmateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inmate",
      required: true,
    },
    visitDate: {
      type: Date,
      required: true,
    },
    visitTime: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    relationship: {
      type: String,
      required: true,
      enum: ["family", "friend", "lawyer", "other"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    visitDuration: {
      type: Number, // in minutes
      default: 30,
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const VisitorSchedule = mongoose.model("VisitorSchedule", visitorScheduleSchema);

export default VisitorSchedule; 