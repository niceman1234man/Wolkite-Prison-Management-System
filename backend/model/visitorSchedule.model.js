import mongoose from "mongoose";

const visitorScheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    inmateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inmate",
      required: false,
      default: null,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          // Ethiopian phone number regex pattern with more flexibility
          return v && v.length > 0;
        },
        message: "Please provide a phone number"
      }
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
      enum: ["parent", "spouse", "child", "sibling", "relative", "friend", "legal", "other"],
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed", "Cancelled", "pending", "approved", "rejected", "completed", "cancelled"],
      default: "Pending",
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
    idType: {
      type: String,
      required: true,
      enum: ["passport", "national_id", "drivers_license", "other"],
    },
    idNumber: {
      type: String,
      required: true,
      trim: true,
    },
    idExpiryDate: {
      type: Date,
      required: false,
    },
    idPhoto: {
      type: String,
      required: false,
    },
    visitorPhoto: {
      type: String,
      required: false,
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