import express from 'express';
import { getMessages, sendMessage, getUnreadCount, markAsRead, checkAuth } from '../controller/messageController.js';
import { authenticateToken } from '../utilities.js';
import { upload } from '../controller/messageController.js';

const router = express.Router();

// Add a debug endpoint
router.get('/debug/check-auth', checkAuth);

// Apply authentication middleware to protected routes, but make it optional
// This means it will set req.user if token is valid, but won't fail if token is missing
const optionalAuth = (req, res, next) => {
  try {
    authenticateToken(req, res, next);
  } catch (error) {
    // Continue even if authentication fails
    console.log('Optional auth failed, continuing without authentication');
    next();
  }
};

// Get messages between two users - make auth optional
router.get('/:userId', optionalAuth, getMessages);

// Send a new message with optional file attachment - make auth optional
router.post('/send', optionalAuth, upload.single('file'), sendMessage);

// Get unread message count - make auth optional
router.get('/unread/count', optionalAuth, getUnreadCount);

// Mark messages as read - make auth optional
router.put('/read/:senderId', optionalAuth, markAsRead);

export default router; 