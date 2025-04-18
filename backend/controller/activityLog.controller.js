import { ActivityLog } from '../model/activityLog.model.js';
import { User } from '../model/user.model.js';
import mongoose from 'mongoose';

// Create a new activity log entry
export const logActivity = async (data) => {
  try {
    console.log('Creating activity log with data:', JSON.stringify(data, null, 2));
    
    const { 
      user, userEmail, userName, userRole, 
      action, description, resourceType, resourceId, 
      ipAddress, userAgent, status 
    } = data;

    const newLog = new ActivityLog({
      user,
      userEmail,
      userName,
      userRole,
      action,
      description,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      status: status || 'success'
    });

    const savedLog = await newLog.save();
    console.log(`Activity log created successfully with ID: ${savedLog._id}`);
    return savedLog;
  } catch (error) {
    console.error('Error creating activity log:', error);
    // Try to identify specific validation errors
    if (error.name === 'ValidationError') {
      Object.keys(error.errors).forEach(field => {
        console.error(`Validation error on field ${field}: ${error.errors[field].message}`);
      });
    }
    throw error;
  }
};

// Helper to log login activity
export const logLogin = async (userId, ipAddress, userAgent, status = 'success') => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found for login activity log');
      return null;
    }

    // Get user details
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    
    // Log the activity without modifying the user
    return await logActivity({
      user: userId,
      userEmail: user.email,
      userName,
      userRole: user.role,
      action: 'login',
      description: `User logged in ${status === 'success' ? 'successfully' : 'unsuccessfully'}`,
      resourceType: 'system',
      ipAddress,
      userAgent,
      status
    });
  } catch (error) {
    console.error('Error logging login activity:', error);
    return null;
  }
};

// Helper to log logout activity
export const logLogout = async (userId, ipAddress, userAgent) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found for logout activity log');
      return null;
    }

    // Get user details
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    
    return await logActivity({
      user: userId,
      userEmail: user.email,
      userName,
      userRole: user.role,
      action: 'logout',
      description: 'User logged out',
      resourceType: 'system',
      ipAddress,
      userAgent,
      status: 'success'
    });
  } catch (error) {
    console.error('Error logging logout activity:', error);
    return null;
  }
};

// Get activity logs with pagination and filtering
export const getActivityLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      user, 
      action, 
      resourceType, 
      startDate, 
      endDate,
      status
    } = req.query;

    // Build filter query
    const query = {};
    
    // Handle user filter - check if it's an email or an ID
    if (user) {
      // Check if user input is an email
      if (user.includes('@')) {
        // Find user by email first
        try {
          const userDoc = await User.findOne({ email: user });
          if (userDoc) {
            query.user = userDoc._id;
          } else {
            // If no user found with this email, use userEmail field instead
            query.userEmail = user;
          }
        } catch (err) {
          console.error('Error finding user by email:', err);
          query.userEmail = user; // Fallback to searching by email in the logs
        }
      } else if (user.match(/^[0-9a-fA-F]{24}$/)) {
        // Valid ObjectId format
        query.user = user;
      } else {
        // Neither valid email nor ObjectId, search by userName containing this string
        query.$or = [
          { userName: { $regex: user, $options: 'i' } },
          { userEmail: { $regex: user, $options: 'i' } }
        ];
      }
    }

    // Add condition for action filter
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (status) query.status = status;
    
    // Date range filtering
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.timestamp.$lte = endOfDay;
      }
    }

    console.log('Activity log query:', JSON.stringify(query, null, 2));

    // Execute query with pagination
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { timestamp: -1 }, // Sort by timestamp, newest first
      lean: true, // Use lean for better performance
      populate: { 
        path: 'user',
        select: 'firstName lastName email role',
        options: { lean: true }
      }
    };

    const logs = await ActivityLog.paginate(query, options);
    
    // Process logs to ensure all fields are correctly populated
    const processedLogs = logs.docs.map(log => {
      // If user details are available from populate, use them
      if (log.user && typeof log.user === 'object') {
        if (!log.userName && log.user.firstName) {
          log.userName = `${log.user.firstName} ${log.user.lastName || ''}`.trim();
        }
        if (!log.userEmail && log.user.email) {
          log.userEmail = log.user.email;
        }
        if (!log.userRole && log.user.role) {
          log.userRole = log.user.role;
        }
      }
      return log;
    });

    // Return processed logs
    logs.docs = processedLogs;

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activity logs',
      error: error.message
    });
  }
};

// Get a summary of recent activity
export const getActivitySummary = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfYesterday = new Date(today);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    
    // Get counts for different time periods
    const todayCount = await ActivityLog.countDocuments({
      timestamp: { $gte: startOfToday }
    });
    
    const yesterdayCount = await ActivityLog.countDocuments({
      timestamp: { $gte: startOfYesterday, $lt: startOfToday }
    });
    
    const weekCount = await ActivityLog.countDocuments({
      timestamp: { $gte: startOfWeek }
    });
    
    // Get login activity
    const loginToday = await ActivityLog.countDocuments({
      action: 'login',
      status: 'success',
      timestamp: { $gte: startOfToday }
    });
    
    // Get top users by activity - handling both ObjectId and non-ObjectId user identifiers
    let topUsers = [];
    try {
      // First try to get top users by using the stored userEmail field instead of user ID
      topUsers = await ActivityLog.aggregate([
        { $match: { timestamp: { $gte: startOfWeek } } },
        { $group: { 
            _id: { 
              user: '$user', 
              email: '$userEmail', 
              name: '$userName' 
            }, 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { 
          $project: { 
            _id: 0,
            userId: '$_id.user',
            email: '$_id.email',
            name: '$_id.name',
            count: 1
          } 
        }
      ]);
      
      // For each result, try to enrich with user details if possible
      for (let i = 0; i < topUsers.length; i++) {
        if (topUsers[i].userId && mongoose.Types.ObjectId.isValid(topUsers[i].userId)) {
          const userDetails = await User.findById(topUsers[i].userId)
            .select('firstName lastName email role')
            .lean();
          
          if (userDetails) {
            topUsers[i].name = `${userDetails.firstName} ${userDetails.lastName}`;
            topUsers[i].email = userDetails.email;
            topUsers[i].role = userDetails.role;
          }
        }
      }
    } catch (error) {
      console.error('Error getting top users:', error);
      // Return empty array if there's an error
      topUsers = [];
    }
    
    // Get activity type distribution
    const activityDistribution = await ActivityLog.aggregate([
      { $match: { timestamp: { $gte: startOfWeek } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        counts: {
          today: todayCount,
          yesterday: yesterdayCount,
          week: weekCount,
          loginToday
        },
        topUsers,
        activityDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activity summary',
      error: error.message
    });
  }
};

// Get logs for a specific user
export const getUserActivityLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    // Handle user filter - check if it's an email or an ID
    if (userId) {
      // Check if userId is an email
      if (userId.includes('@')) {
        // Find user by email first
        try {
          const userDoc = await User.findOne({ email: userId });
          if (userDoc) {
            query.user = userDoc._id;
          } else {
            // If no user found with this email, use userEmail field instead
            query.userEmail = userId;
          }
        } catch (err) {
          console.error('Error finding user by email:', err);
          query.userEmail = userId; // Fallback to searching by email in the logs
        }
      } else if (userId.match(/^[0-9a-fA-F]{24}$/)) {
        // Valid ObjectId format
        query.user = userId;
      } else {
        // Neither valid email nor ObjectId, search by userName containing this string
        query.$or = [
          { userName: { $regex: userId, $options: 'i' } },
          { userEmail: { $regex: userId, $options: 'i' } }
        ];
      }
    }
    
    console.log('User activity log query:', JSON.stringify(query, null, 2));
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { timestamp: -1 }
    };
    
    const logs = await ActivityLog.paginate(query, options);
    
    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching user activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user activity logs',
      error: error.message
    });
  }
}; 