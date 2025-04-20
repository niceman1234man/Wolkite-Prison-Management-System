import mongoose from "mongoose";

const woredaInmateSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    crime: {
      type: String,
      required: true,
      trim: true,
    },
    sentenceStart: {
      type: Date,
      required: true,
    },
    sentenceEnd: {
      type: Date,
      required: true,
    },
    paroleEligibility: {
      type: Boolean,
      default: false,
    },
    medicalConditions: {
      type: String,
      trim: true,
    },
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true,
    },
    specialRequirements: {
      type: String,
      trim: true,
    },
    intakeDate: {
      type: Date,
      required: true,
    },
    arrestingOfficer: {
      type: String,
      required: true,
      trim: true,
    },
    holdingCell: {
      type: String,
      required: true,
      trim: true,
    },
    assignedPrison: {
      type: String,
      required: false,
      trim: true,
    },
    documents: [
      {
        type: String,
        required: false,
      },
    ],
    status: {
      type: String,
      enum: ["Active", "TransferRequested", "Transferred", "Released"],
      default: "Active",
    },
    woredaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Woreda",
      required: false,
    },
    releaseDate: {
      type: Date,
      required: false,
    },
    releaseReason: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const WoredaInmate = mongoose.model("WoredaInmate", woredaInmateSchema);
