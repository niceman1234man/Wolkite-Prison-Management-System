// Get visitor capacity information
exports.getVisitorCapacity = async (req, res) => {
  try {
    // Get capacity settings from database or env vars
    const maxCapacity = process.env.MAX_VISITOR_CAPACITY || 50;
    
    // Count approved visitors for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const approvedVisitors = await VisitorSchedule.countDocuments({
      status: "Approved",
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    const pendingVisitors = await VisitorSchedule.countDocuments({
      status: "Pending",
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    res.status(200).json({
      success: true,
      maxCapacity: parseInt(maxCapacity),
      approvedCount: approvedVisitors,
      pendingCount: pendingVisitors,
      message: "Visitor capacity information fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching visitor capacity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch visitor capacity information",
      error: error.message
    });
  }
};

// Update visitor capacity
exports.updateVisitorCapacity = async (req, res) => {
  try {
    const { maxCapacity } = req.body;
    
    if (!maxCapacity || isNaN(parseInt(maxCapacity)) || parseInt(maxCapacity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid maximum capacity value"
      });
    }
    
    // In a real application, you would update this in a database settings collection
    // For this example, we'll assume it's stored in an environment variable
    process.env.MAX_VISITOR_CAPACITY = parseInt(maxCapacity);
    
    res.status(200).json({
      success: true,
      maxCapacity: parseInt(maxCapacity),
      message: "Visitor capacity updated successfully"
    });
  } catch (error) {
    console.error("Error updating visitor capacity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update visitor capacity",
      error: error.message
    });
  }
}; 