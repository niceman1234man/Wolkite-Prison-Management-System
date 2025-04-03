import Message from '../model/Message.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/messages';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

export const upload = multer({ storage: storage });

// Get all messages between two users
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    // Check for user ID in multiple possible locations
    const currentUserId = req.user?._id || req.query.currentUserId || req.body.currentUserId;
    
    console.log('Request query params:', req.query);
    console.log('Request body:', req.body);
    console.log('Current user from req.user:', req.user?._id);
    console.log('Current user ID from params/body:', currentUserId);
    
    if (!currentUserId) {
      return res.status(400).json({ message: 'Current user ID is required' });
    }
    
    const sinceTimestamp = req.query.since ? new Date(parseInt(req.query.since)) : null;
    
    console.log(`Fetching messages between ${currentUserId} and ${userId}${sinceTimestamp ? ` since ${sinceTimestamp}` : ''}`);
    
    // Build the query
    const query = {
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ]
    };
    
    // If requesting only messages since a specific time
    if (sinceTimestamp) {
      query.createdAt = { $gt: sinceTimestamp };
    }

    console.log('Query:', JSON.stringify(query));

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .populate('senderId', 'firstName middleName photo')
      .populate('receiverId', 'firstName middleName photo');

    console.log(`Found ${messages.length} messages`);

    // Mark messages as read and update status to 'delivered'
    const updatePromises = [
      // Mark received messages as read
      Message.updateMany(
        {
          senderId: userId,
          receiverId: currentUserId,
          read: false
        },
        { read: true, status: 'read' }
      ),
      
      // Update status of sent messages to 'delivered'
      Message.updateMany(
        {
          senderId: currentUserId,
          receiverId: userId,
          status: { $nin: ['delivered', 'read'] }
        },
        { status: 'delivered' }
      )
    ];
    
    await Promise.all(updatePromises);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, senderId: bodySenderId } = req.body;
    // Use req.user._id if available, otherwise use the senderId from request body or query
    const senderId = req.user?._id || bodySenderId || req.query.currentUserId;
    
    console.log('Send message request:', {
      body: req.body,
      query: req.query,
      authUser: req.user?._id
    });
    
    console.log('Sending message from', senderId, 'to', receiverId, 'content:', content?.substring(0, 30));
    
    if (!senderId) {
      return res.status(400).json({ message: 'Sender ID is required' });
    }
    
    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }
    
    if (!content && !req.file) {
      return res.status(400).json({ message: 'Message content or file is required' });
    }
    
    let fileUrl = null;

    // Handle file upload if present
    if (req.file) {
      fileUrl = `/uploads/messages/${req.file.filename}`;
      console.log('File uploaded to:', fileUrl);
    }

    const message = new Message({
      senderId,
      receiverId,
      content: content || '(attachment)',
      file: fileUrl,
      status: 'sent'  // Initial status is 'sent'
    });

    await message.save();
    console.log('Message saved with ID:', message._id);

    // Populate sender and receiver details
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'firstName middleName photo')
      .populate('receiverId', 'firstName middleName photo');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    // Check for user ID in multiple possible locations
    const userId = req.user?._id || req.query.currentUserId || req.body.currentUserId;
    
    console.log('Unread count request query params:', req.query);
    console.log('Unread count user ID:', userId);
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    console.log(`Getting unread count for user ${userId}`);
    
    // First get a simple count for each sender
    const totalCount = await Message.countDocuments({
      receiverId: userId,
      read: false
    });
    
    // If we have unread messages, get the breakdown by sender
    let unreadCounts = {};
    if (totalCount > 0) {
      try {
        // Get counts per sender
        const messages = await Message.find({
          receiverId: userId,
          read: false
        });
        
        // Group by sender ID
        messages.forEach(msg => {
          const senderId = msg.senderId.toString();
          if (!unreadCounts[senderId]) {
            unreadCounts[senderId] = 0;
          }
          unreadCounts[senderId]++;
        });
      } catch (err) {
        console.error('Error grouping unread messages:', err);
      }
    }
    
    console.log(`Found ${totalCount} total unread messages, breakdown:`, unreadCounts);
    
    res.json({ 
      count: totalCount,
      bySender: unreadCounts
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Error getting unread count', error: error.message });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;
    // Check for user ID in multiple possible locations
    const receiverId = req.user?._id || req.query.currentUserId || req.body.currentUserId;
    
    console.log('Mark as read request query params:', req.query);
    console.log('Mark as read user ID:', receiverId);
    
    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }
    
    if (!senderId) {
      return res.status(400).json({ message: 'Sender ID is required' });
    }
    
    console.log(`Marking messages from ${senderId} to ${receiverId} as read`);

    // Ensure we're only updating messages from this specific sender to this receiver
    const result = await Message.updateMany(
      {
        senderId,
        receiverId,
        read: false
      },
      { read: true, status: 'read' }
    );

    console.log(`Updated ${result.modifiedCount} messages to read status`);
    res.json({ message: 'Messages marked as read', updatedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
};

// Debug endpoint to check user authentication
export const checkAuth = async (req, res) => {
  try {
    // Log all potential user identifiers
    console.log('Authentication debug info:');
    console.log('- Headers:', req.headers);
    console.log('- Auth user object:', req.user);
    console.log('- Query params:', req.query);
    console.log('- Body params:', req.body);
    
    // Check for user info from different sources
    const userIdFromAuth = req.user?._id;
    const userIdFromQuery = req.query.currentUserId;
    const userIdFromBody = req.body.currentUserId;
    
    // Respond with detailed debug info
    res.json({
      authenticated: !!userIdFromAuth,
      userIdFromAuth: userIdFromAuth || null,
      userIdFromQuery: userIdFromQuery || null,
      userIdFromBody: userIdFromBody || null,
      hasToken: !!req.headers.authorization,
      tokenValue: req.headers.authorization ? 'PRESENT (not shown for security)' : 'MISSING',
      message: userIdFromAuth 
        ? 'User is properly authenticated'
        : (userIdFromQuery || userIdFromBody)
          ? 'User ID provided via query/body but not authenticated via token'
          : 'No user ID available from any source'
    });
  } catch (error) {
    console.error('Error in auth check endpoint:', error);
    res.status(500).json({ message: 'Error checking authentication', error: error.message });
  }
}; 