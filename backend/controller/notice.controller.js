// import { Notice } from "../model/notice.model.js";


// export const addNotice = async (req, res) => {
//   try {
//     const { title, description, roles, date, priority } = req.body;
//     if (!title || !description || !roles.length || !date) {
//       return res.status(400).json({ message: "All fields are required" });
//     }
//     const noticeDate = new Date(date);
//     if (noticeDate < new Date()) {
//       return res.status(400).json({ message: "Date must be in the future" });
//     }

//     const newNotice = new Notice({
//       title,
//       description,
//       roles,
//       date,
//       priority: priority || "Normal",  
//     });

//     await newNotice.save();
//     res.status(201).json({ success: true, message: "Notice Added successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to post the notice", error: error.message });
//   }
// };


// export const getAllNotices = async (req, res) => {
//   try {
//     const notices = await Notice.find();
//     if (!notices) {
//       return res.status(400).json({ message: "Notice does not exist" });
//     }

//     res.status(200).json({ notices: notices });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// export const updateNotice = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {  title,
//       description,
//       roles,
//       date,
//       priority} = req.body;

//     if (!title || !description || !roles || !date || !priority) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const updateduser = await Notice.findByIdAndUpdate(
//       id,
//       {   title,
//         description,
//         roles,
//         date,
//         priority},
//       { new: true} 
//     );

//     if (!updateduser) {
//       return res.status(404).json({ message: "Notice not found" });
//     }

//     res.status(200).json({ data: updateduser, message: "Notice updated successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// export const deleteNotice = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deletedNotice = await Notice.findByIdAndDelete(id);

//     if (!deletedNotice) {
//       return res.status(404).json({ message: "Notice not found" });
//     }

//     res.status(200).json({ message: "Notice deleted successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

//  export const postNotice = async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { isPosted } = req.body;
//       if (isPosted === undefined) {
//         return res.status(400).json({ message: "All fields are required" });
//       }
  
//       const postNotice = await Notice.findByIdAndUpdate(
//         id,
//         { isPosted },
//         { new: true }
//       );
  
//       if (!postNotice) {
//         return res.status(404).json({ message: "Notice not found" });
//       }
  
//       res.status(200).json({ data: postNotice, message: "Notice Posted" });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: "Internal Server Error" });
//     }
//   };
// export const getNotice = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const noticeInfo = await Notice.findOne({ _id: id });
//     if (!noticeInfo) {
//       return res.status(400).json({ message: "Notice does not exist" });
//     }

//     res.status(200).json({ notice: noticeInfo });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

import { Notice } from "../model/notice.model.js";

// ✅ Add a New Notice
export const addNotice = async (req, res) => {
  try {
    const { title, description, roles, date, priority, isPosted, targetAudience } = req.body;
    if (!title || !description || !roles.length || !date) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const noticeDate = new Date(date);
    if (noticeDate < new Date()) {
      return res.status(400).json({ success: false, message: "Date must be in the future" });
    }

    const newNotice = new Notice({
      title,
      description,
      roles,
      date,
      priority: priority || "Normal",
      isPosted: isPosted || false, // Default to false if not provided
      targetAudience: targetAudience || "all" // Default to all if not provided
    });

    await newNotice.save();
    res.status(201).json({ success: true, message: "Notice added successfully", data: newNotice });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add notice", error: error.message });
  }
};

// ✅ Get All Notices
export const getAllNotices = async (req, res) => {
  try {
    // Get the user ID from the auth token
    const userId = req.user.id;
    console.log(`Getting all notices for user: ${userId}`);
    
    // Find all notices
    const notices = await Notice.find()
      .populate('readBy', 'id firstName lastName') // Populate readBy to get user details if needed
      .lean(); // Use lean() for better performance
    
    console.log(`Found ${notices.length} notices`);
    
    // For debugging, log the first notice's readBy array if it exists
    if (notices.length > 0 && notices[0].readBy) {
      console.log(`First notice readBy array: ${JSON.stringify(notices[0].readBy)}`);
    }
    
    res.status(200).json({ success: true, data: notices });
  } catch (error) {
    console.error("Error in getAllNotices:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Get a Single Notice by ID
export const getNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }
    res.status(200).json({ success: true, data: notice });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Update a Notice
export const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, roles, date, priority, targetAudience } = req.body;

    if (!title || !description || !roles || !date || !priority) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const updatedNotice = await Notice.findByIdAndUpdate(
      id,
      { title, description, roles, date, priority, targetAudience },
      { new: true }
    );

    if (!updatedNotice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    res.status(200).json({ success: true, message: "Notice updated successfully", data: updatedNotice });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

// ✅ Delete a Notice
export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNotice = await Notice.findByIdAndDelete(id);
    if (!deletedNotice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }
    res.status(200).json({ success: true, message: "Notice deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

// ✅ Post a Notice
export const postNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPosted } = req.body;

    const postedNotice = await Notice.findByIdAndUpdate(id, { isPosted }, { new: true });

    if (!postedNotice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    res.status(200).json({ success: true, message: "Notice posted", data: postedNotice });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

// ✅ Mark Notice as Read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if req.user exists
    if (!req.user || !req.user.id) {
      console.log(`User authentication issue - req.user:`, req.user);
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    const userId = req.user.id;
    console.log(`Marking notice ${id} as read for user ${userId}`);

    const notice = await Notice.findById(id);
    if (!notice) {
      console.log(`Notice ${id} not found`);
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    // Initialize readBy array if it doesn't exist
    if (!notice.readBy) {
      notice.readBy = [];
      console.log(`ReadBy array was undefined, initializing empty array`);
    }

    console.log(`Current readBy array: ${JSON.stringify(notice.readBy)}`);
    
    // Normalize user ID (ensure it's a string for comparison)
    const normalizedUserId = userId.toString();
    
    // Check if user ID is already in the readBy array (with better string comparison)
    const isAlreadyRead = notice.readBy.some(readerId => {
      if (!readerId) return false;
      
      try {
        // Handle both ObjectId and String cases
        const readerIdStr = typeof readerId === 'object' && readerId !== null ? 
          readerId.toString() : String(readerId);
        return readerIdStr === normalizedUserId;
      } catch (error) {
        console.error(`Error comparing reader IDs:`, error);
        return false;
      }
    });
    
    if (isAlreadyRead) {
      console.log(`Notice ${id} already read by user ${userId}`);
      return res.status(200).json({ 
        success: true, 
        message: "Already read",
        data: { 
          noticeId: id,
          readBy: notice.readBy
        }
      });
    }

    // Add user ID to the readBy array
    notice.readBy.push(userId);
    
    // Save the updated notice
    const updatedNotice = await notice.save();
    console.log(`Updated readBy array: ${JSON.stringify(updatedNotice.readBy)}`);

    res.status(200).json({ 
      success: true, 
      message: "Notice marked as read",
      data: { 
        noticeId: id,
        readBy: updatedNotice.readBy
      }
    });
  } catch (error) {
    console.error(`Error marking notice as read: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
