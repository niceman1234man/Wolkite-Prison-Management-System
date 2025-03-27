import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    inmateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WoredaInmate",
      required: true,
    },
    inmateName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["CUSTODY_ALERT"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model("Notification", notificationSchema);
