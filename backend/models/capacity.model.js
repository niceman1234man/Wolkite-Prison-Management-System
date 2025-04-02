const mongoose = require('mongoose');

/**
 * Capacity model - Stores various capacity settings for the system
 */
const capacitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['visitor', 'inmate', 'cell', 'other'],
      default: 'visitor'
    },
    maxCapacity: {
      type: Number,
      required: true,
      min: 1,
      default: 50
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: String,
      required: true,
      default: 'system'
    },
    description: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: 'capacities'
  }
);

// Add index for faster lookups
capacitySchema.index({ type: 1 });

// Virtual for current usage percentage
capacitySchema.virtual('usagePercentage').get(function() {
  if (!this.metadata || !this.metadata.currentCount) return 0;
  return Math.min(100, Math.round((this.metadata.currentCount / this.maxCapacity) * 100));
});

// Add static method to get capacity for a specific type
capacitySchema.statics.getCapacityForType = async function(type) {
  const capacity = await this.findOne({ type, isActive: true });
  if (!capacity) {
    // Create default capacity if it doesn't exist
    return this.create({
      type,
      maxCapacity: type === 'visitor' ? 50 : 100,
      updatedBy: 'system',
      description: `Default ${type} capacity setting`
    });
  }
  return capacity;
};

// Export the model
module.exports = mongoose.model('Capacity', capacitySchema); 