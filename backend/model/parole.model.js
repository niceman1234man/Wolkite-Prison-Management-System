import mongoose from "mongoose";

const ParoleTrackingSchema = new mongoose.Schema(
  {
    inmateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inmate", // Reference to the inmate model
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    }, 
     age: {
      type: Number,
      required: true,
    },
    sentenceYear: {
      type: String,
      
    },
    caseType: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    releasedDate: {
      type: Date,
      required: true,
    },
    paroleDate: {
      type: Date,
      required: true,
    },
    durationToParole: {
      type: String,
    },
    durationFromParoleToEnd: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    behaviorLogs: [
      {
        rule: {
          type: String,
          required: true,
        },
        points: {
          type: Number,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    committeeNames: {
      type: [String], // Array of committee member names
      required: true,
    },
    signatures: {
      type: [String], // Array of file paths or URLs for signatures
      required: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    paroleEligible: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Method to calculate total points and parole eligibility
ParoleTrackingSchema.methods.calculatePoints = function () {
  this.totalPoints = this.behaviorLogs.reduce((sum, log) => sum + log.points, 0);
  this.paroleEligible = this.totalPoints >= 75; // Example threshold for parole
  return this.save();
};

export const ParoleTracking = mongoose.model("ParoleTracking", ParoleTrackingSchema);