const VisitorSchedule = require('../models/visitorSchedule.model');
const Capacity = require('../models/capacity.model');
const { format } = require('date-fns');

// Get visitor capacity
exports.getVisitorCapacity = async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Get current capacity settings
    const capacity = await Capacity.getCapacityForType('visitor');
    
    // Count approved and pending visitors for today
    const todayVisitors = await VisitorSchedule.countDocuments({
      visitDate: today,
      status: { $in: ['approved', 'pending'] }
    });

    // Count approved visitors for future dates
    const futureVisitors = await VisitorSchedule.countDocuments({
      visitDate: { $gt: today },
      status: 'approved'
    });

    res.json({
      success: true,
      data: {
        maxCapacity: capacity.maxCapacity,
        currentCount: todayVisitors,
        futureCount: futureVisitors,
        availableSlots: Math.max(0, capacity.maxCapacity - todayVisitors)
      }
    });
  } catch (error) {
    console.error('Error getting visitor capacity:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting visitor capacity',
      error: error.message
    });
  }
};

// Update visitor capacity
exports.updateVisitorCapacity = async (req, res) => {
  try {
    const { maxCapacity, description } = req.body;
    const updatedBy = req.user?.username || 'system';

    if (!maxCapacity || typeof maxCapacity !== 'number' || maxCapacity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid capacity value'
      });
    }

    const capacity = await Capacity.findOneAndUpdate(
      { type: 'visitor', isActive: true },
      {
        maxCapacity,
        description,
        updatedBy,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Visitor capacity updated successfully',
      data: capacity
    });
  } catch (error) {
    console.error('Error updating visitor capacity:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating visitor capacity',
      error: error.message
    });
  }
};

// Check capacity before approving a schedule
exports.checkCapacityForDate = async (req, res) => {
  try {
    const { visitDate } = req.params;
    
    // Count approved visitors for the date
    const visitorCount = await VisitorSchedule.countDocuments({
      visitDate,
      status: 'approved'
    });

    // Check if capacity is available
    const hasCapacity = await Capacity.checkCapacityForDate('visitor', visitDate, visitorCount);
    const availableSlots = await Capacity.getAvailableSlots('visitor', visitDate, visitorCount);

    res.json({
      success: true,
      data: {
        hasCapacity,
        availableSlots,
        currentCount: visitorCount
      }
    });
  } catch (error) {
    console.error('Error checking capacity:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking capacity',
      error: error.message
    });
  }
}; 