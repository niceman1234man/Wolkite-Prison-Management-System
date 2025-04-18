import express from 'express';
import { 
  getActivityLogs, 
  getActivitySummary, 
  getUserActivityLogs,
  logActivity,
  logLogin,
  logLogout
} from '../controller/activityLog.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware
router.use(authenticateToken);

// Activity log routes
router.get('/logs', getActivityLogs);
router.get('/summary', getActivitySummary);
router.get('/user/:userId', getUserActivityLogs);

// Direct route to create an activity log (for testing)
router.post('/create', async (req, res) => {
  try {
    const logData = req.body;
    
    // Add IP and user agent if not provided
    if (!logData.ipAddress) {
      logData.ipAddress = req.ip;
    }
    if (!logData.userAgent) {
      logData.userAgent = req.headers['user-agent'];
    }
    
    const savedLog = await logActivity(logData);
    
    res.status(200).json({
      success: true,
      message: 'Activity log created successfully',
      log: savedLog
    });
  } catch (error) {
    console.error('Error creating activity log via direct API:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating activity log',
      error: error.message
    });
  }
});

// Direct route to create a login log (for testing)
router.post('/login-log', async (req, res) => {
  try {
    const { userId, status = 'success' } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const savedLog = await logLogin(
      userId.toString(),
      req.ip,
      req.headers['user-agent'],
      status
    );
    
    res.status(200).json({
      success: true,
      message: 'Login activity log created successfully',
      log: savedLog
    });
  } catch (error) {
    console.error('Error creating login log via direct API:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating login log',
      error: error.message
    });
  }
});

// Direct route to create a logout log (for testing)
router.post('/logout-log', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const savedLog = await logLogout(
      userId.toString(),
      req.ip,
      req.headers['user-agent']
    );
    
    res.status(200).json({
      success: true,
      message: 'Logout activity log created successfully',
      log: savedLog
    });
  } catch (error) {
    console.error('Error creating logout log via direct API:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating logout log',
      error: error.message
    });
  }
});

export default router; 