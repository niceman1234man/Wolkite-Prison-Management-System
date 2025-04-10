const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    getMessages,
    sendMessage,
    markAsRead,
    getUnreadCount
} = require('../controllers/messageController');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get messages between two users
router.get('/:userId', getMessages);

// Send a new message
router.post('/send', sendMessage);

// Mark messages as read
router.put('/read/:senderId', markAsRead);

// Get unread message count
router.get('/unread/count', getUnreadCount);

module.exports = router; 