import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  userEmail: {
    type: String,
    required: false
  },
  userName: {
    type: String,
    required: false
  },
  userRole: {
    type: String,
    required: false
  },
  action: {
    type: String,
    required: true,
    enum: [
      "login", 
      "logout", 
      "create", 
      "update", 
      "delete", 
      "view", 
      "download", 
      "upload",
      "backup",
      "restore",
      "password_change",
      "account_activation",
      "account_deactivation"
    ]
  },
  description: {
    type: String,
    required: false
  },
  resourceType: {
    type: String,
    required: false,
    enum: [
      "user",
      "inmate",
      "visitor",
      "prison",
      "incident",
      "clearance",
      "notice",
      "transfer",
      "parole",
      "instruction",
      "report",
      "system"
    ]
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ["success", "failure", "warning", "info"],
    default: "success"
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add indexes for better query performance
activityLogSchema.index({ user: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ resourceType: 1, resourceId: 1 });

// Add pagination plugin
activityLogSchema.plugin(mongoosePaginate);

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema); 