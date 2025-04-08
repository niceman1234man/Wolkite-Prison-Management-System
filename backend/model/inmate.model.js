import mongoose from 'mongoose'

const InmateSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    middleName: { type: String, required: true },
    lastName: { type: String, required: true },
    birthDate: { type: Date, required: true },
    age: { type: Number, required: true },
    motherName: { type: String },
    gender: { type: String, enum: ["male", "female"], required: true },
    photo: { type: String }, // URL to the stored photo

    // Birth Place
    birthRegion: { type: String },
    birthZone: { type: String },
    birthWereda: { type: String },
    birthKebele: { type: String },

    // Current Living Place
    currentRegion: { type: String },
    currentZone: { type: String },
    currentWereda: { type: String },
    currentKebele: { type: String },

    // Personal Details
    degreeLevel: { type: String },
    work: { type: String },
    nationality: { type: String },
    religion: { type: String },
    maritalStatus: {
      type: String,
      enum: ["single", "married", "divorced", "widowed"],
    },
    height: { type: Number },

    // Physical Features
    hairType: { type: String },
    face: { type: String },
    foreHead: { type: String },
    nose: { type: String },
    eyeColor: { type: String },
    teeth: { type: String },
    lip: { type: String },
    ear: { type: String },
    specialSymbol: { type: String },

    // Contact Information
    contactName: { type: String },
    contactRegion: { type: String },
    contactZone: { type: String },
    contactWereda: { type: String },
    contactKebele: { type: String },
    phoneNumber: { type: String },

    // Case Details
    caseType: { type: String },
    startDate: { type: Date },
    sentenceReason: { type: String },
    releasedDate: { type: Date },
    sentenceYear: { type: Number },
    paroleDate: { type: Date },
    durationToParole: { type: String },
    durationFromParoleToEnd: { type: String },
    status: {
      type: String,
      enum: ["pending","active","paroled"],
      default: "pending",
      required: true,
    },
    // Timestamps for createdAt and updatedAt
  },
  { timestamps: true }
);

export const Inmate = mongoose.model("Inmate", InmateSchema);
