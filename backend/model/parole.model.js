import mongoose from "mongoose";

const ParoleTrackingSchema = new mongoose.Schema(
  {
    inmateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inmate", 
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
    isReported:{
     type:Boolean,
     default:false,
    },
    request:{
      isRequested:Boolean,
      number:String,
      date: Date,
      receiverName:{ type:String,
        default:"wolkite"

        
      },
      referenceNumber: String,
    }
    ,
    response:
      { data:Date,
        reason:String,  
      }
    ,
    releasedDate: {
      type: Date,
      required: true,
    },
    paroleDate: {
      type: Date,
      required: false,
    },
    durationToParole: {
      type: String,
    },
    durationFromParoleToEnd: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'] ,
      default: 'pending'
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
    committeeData: [{
      name: {
        type: String,
        required: true
      },
      position: {
        type: String,
        required: true
      },
      signature: {
        type: String,
        required: false
      },
      signatureType: {
        type: String,
        required: false
      }
    }],
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