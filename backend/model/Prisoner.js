import mongoose from "mongoose";

// Define the Prisoner schema
const prisonerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "Gender is required"],
    },
    crime: {
      type: String,
      required: [true, "Crime is required"],
      trim: true,
    },
    sentenceStart: {
      type: Date,
      required: [true, "Sentence start date is required"],
    },
    sentenceEnd: {
      type: Date,
      required: [true, "Sentence end date is required"],
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
      default: "Low",
    },
    specialRequirements: {
      type: String,
      trim: true,
    },
    cell: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cell",
      required: [true, "Cell ID is required"],
    },
    intakeDate: {
      type: Date,
      default: Date.now,
    },
    arrestingOfficer: {
      type: String,
      trim: true,
    },
    documents: [
      {
        type: String, // Store file paths or URLs for uploaded documents
      },
    ],
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Create the Prisoner model
const Prisoner = mongoose.model("Prisoner", prisonerSchema);

export default Prisoner;