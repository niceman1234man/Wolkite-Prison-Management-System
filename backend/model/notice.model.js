import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    roles: {
      type: [String], // Example: ["Visitor", "Police Officer", "Security Staff"]
      required: true,
    },
    date: {
      type: Date,
      required: true,  
    },
    priority: {
      type: String,
      enum: ["Low", "Normal", "High", "Urgent"], 
      default: "Normal", 
    },
    isPosted:{
      type:Boolean,
      default:false,
    }
   
  },
  { timestamps: true }
);

export const Notice = mongoose.model("Notice", noticeSchema);
