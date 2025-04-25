import mongoose from 'mongoose';

const archiveSchema = new mongoose.Schema(
  {
    // The original model/collection name (prison, inmate, notice, etc.)
    entityType: {
      type: String,
      required: true,
      enum: ['prison', 'inmate', 'notice', 'clearance', 'visitor', 'report', 'transfer', 'incident', 'user'],
      index: true
    },
    
    // Original item ID
    originalId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    
    // Full JSON data of the item
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    
    // Who deleted the item
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Reason for deletion
    deletionReason: {
      type: String,
      default: ''
    },
    
    // Metadata for tracking
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    
    // Whether the item has been restored
    isRestored: {
      type: Boolean,
      default: false,
      index: true
    },
    
    // When the item was restored (if applicable)
    restoredAt: {
      type: Date,
      default: null
    },
    
    // Who restored the item (if applicable)
    restoredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt fields
  }
);

// Indexes for faster queries
archiveSchema.index({ entityType: 1, createdAt: -1 });
archiveSchema.index({ isRestored: 1, entityType: 1 });

const Archive = mongoose.model('Archive', archiveSchema);

export default Archive; 