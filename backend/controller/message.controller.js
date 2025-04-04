import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

export const sendMessage = async (req, res) => {
  try {
    const { content, receiverId } = req.body;
    const senderId = req.user ? req.user.id : req.body.senderId;
    
    console.log(`Sending message from ${senderId} to ${receiverId}`);
    
    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ 
        success: false, 
        message: "Sender ID, receiver ID and content are required" 
      });
    }

    // Verify that both sender and receiver exist
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId)
    ]);

    if (!sender) {
      console.log(`Sender with ID ${senderId} not found`);
      return res.status(404).json({ 
        success: false, 
        message: "Sender not found" 
      });
    }

    if (!receiver) {
      console.log(`Receiver with ID ${receiverId} not found`);
      return res.status(404).json({ 
        success: false, 
        message: "Receiver not found" 
      });
    }

    console.log(`Sending message from ${sender.email || sender.username} to ${receiver.email || receiver.username}`);

    // Create the message
    const newMessage = new Message({
      senderId,
      receiverId,
      content,
      read: false,
    });

    await newMessage.save();
    
    console.log(`Message sent successfully: ${newMessage._id}`);

    res.status(201).json({ 
      success: true, 
      message: "Message sent successfully",
      data: newMessage
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error sending message",
      error: error.message 
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user ? req.user.id : req.query.currentUserId;
    
    console.log(`Getting messages between ${currentUserId} and ${userId}`);
    
    if (!userId || !currentUserId) {
      return res.status(400).json({ 
        success: false, 
        message: "User IDs are required" 
      });
    }

    // Verify that both users exist
    const [user1, user2] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);

    if (!user1) {
      console.log(`Current user with ID ${currentUserId} not found`);
      return res.status(404).json({ 
        success: false, 
        message: "Current user not found" 
      });
    }

    if (!user2) {
      console.log(`Target user with ID ${userId} not found`);
      return res.status(404).json({ 
        success: false, 
        message: "Target user not found" 
      });
    }

    console.log(`Getting messages between ${user1.email || user1.username} and ${user2.email || user2.username}`);

    // Get all messages between the two users
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    console.log(`Found ${messages.length} messages`);

    res.status(200).json({ 
      success: true, 
      data: messages 
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error getting messages",
      error: error.message 
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;
    const currentUserId = req.user ? req.user.id : req.query.currentUserId;
    
    console.log(`Marking messages from ${senderId} to ${currentUserId} as read`);
    
    if (!senderId || !currentUserId) {
      return res.status(400).json({ 
        success: false, 
        message: "Sender ID and current user ID are required" 
      });
    }

    // Verify that both users exist
    const [sender, currentUser] = await Promise.all([
      User.findById(senderId),
      User.findById(currentUserId)
    ]);

    if (!sender) {
      console.log(`Sender with ID ${senderId} not found`);
      return res.status(404).json({ 
        success: false, 
        message: "Sender not found" 
      });
    }

    if (!currentUser) {
      console.log(`Current user with ID ${currentUserId} not found`);
      return res.status(404).json({ 
        success: false, 
        message: "Current user not found" 
      });
    }

    console.log(`Marking messages from ${sender.email || sender.username} to ${currentUser.email || currentUser.username} as read`);

    // Mark all messages from senderId to currentUserId as read
    const result = await Message.updateMany(
      { 
        senderId: senderId, 
        receiverId: currentUserId, 
        read: false 
      },
      { 
        $set: { read: true } 
      }
    );

    console.log(`Marked ${result.modifiedCount} messages as read`);

    res.status(200).json({ 
      success: true, 
      message: "Messages marked as read",
      count: result.modifiedCount 
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error marking messages as read",
      error: error.message 
    });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : req.query.userId;
    
    console.log(`Getting unread count for user ${currentUserId}`);
    
    if (!currentUserId) {
      return res.status(400).json({ 
        success: false, 
        message: "User ID is required" 
      });
    }

    // Verify that the user exists
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      console.log(`User with ID ${currentUserId} not found`);
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    console.log(`Getting unread count for ${currentUser.email || currentUser.username}`);

    // Get the total count of unread messages for the user
    const totalCount = await Message.countDocuments({
      receiverId: currentUserId,
      read: false
    });

    // Get the count of unread messages by sender
    const bySenderAggregation = await Message.aggregate([
      {
        $match: {
          receiverId: mongoose.Types.ObjectId.isValid(currentUserId) 
            ? new mongoose.Types.ObjectId(currentUserId) 
            : currentUserId,
          read: false
        }
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert the aggregation result to a more user-friendly format
    const bySender = {};
    bySenderAggregation.forEach(item => {
      bySender[item._id.toString()] = item.count;
    });

    console.log(`Found ${totalCount} total unread messages and ${Object.keys(bySender).length} senders`);

    res.status(200).json({ 
      success: true, 
      totalCount,
      bySender
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error getting unread count",
      error: error.message 
    });
  }
}; 