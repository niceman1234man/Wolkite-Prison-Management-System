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
          // Ethiopian phone number regex pattern
          const phoneRegex = /^(\+251|251|0)?[7-9][0-9]{8}$/;
          return phoneRegex.test(v);
        },
        message: "Please provide a valid Ethiopian phone number"
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
    idType: {
      type: String,
      required: true,
      enum: ["passport", "nationalId", "driversLicense", "other"],
    },
    idNumber: {
      type: String,
      required: true,
      trim: true,
    },
    idExpiryDate: {
      type: Date,
      required: true,
    },
    idPhoto: {
      type: String,
      required: true,
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