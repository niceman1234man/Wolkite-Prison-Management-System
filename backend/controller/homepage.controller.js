// import { image } from "framer-motion/client";
import { HomepageMessage } from "../model/homepage.model.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/messages";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload an image."), false);
  }
};

export const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Get all messages
export const getMessages = async (req, res) => {
  try {
    const messages = await HomepageMessage.find().sort({ createdAt: -1 });
    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

export const getSidemMessage = async(req,res) =>{
  try {
    const messages = await HomepageMessage.find().sort({ createdAt: -1 });
    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching side messages:", error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
}

// Add a new message
export const addMessage = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    console.log("Received file:", req.file);

    const text = req.body.text;
    let imagePath = null;

    if (req.file) {
      imagePath = `/uploads/messages/${req.file.filename}`;
    }

    if (!text) {
      return res.status(400).json({ error: "Message text is required" });
    }

    const newMessage = new HomepageMessage({
      text,
      image: imagePath
    });

    await newMessage.save();
    res.status(201).json({ message: "Message added successfully", data: newMessage });
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({ error: "Failed to add message", details: error.message });
  }
};

// Update a message
export const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const text = req.body.text;
    let imagePath = null;

    // Get the existing message
    const existingMessage = await HomepageMessage.findById(id);
    if (!existingMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Handle image update
    if (req.file) {
      // Delete old image if it exists
      if (existingMessage.image) {
        const oldImagePath = path.join(process.cwd(), existingMessage.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imagePath = `/uploads/messages/${req.file.filename}`;
    }

    // Update message
    const updatedMessage = await HomepageMessage.findByIdAndUpdate(
      id,
      {
        text,
        ...(imagePath && { image: imagePath })
      },
      { new: true }
    );

    res.status(200).json({ message: "Message updated successfully", data: updatedMessage });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ error: "Failed to update message", details: error.message });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the message to check for image
    const message = await HomepageMessage.findById(id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Delete associated image file if it exists
    if (message.image) {
      const imagePath = path.join(process.cwd(), message.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await HomepageMessage.findByIdAndDelete(id);
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message", details: error.message });
  }
};
