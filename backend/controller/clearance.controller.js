// import { Clearance } from "../model/clearance.model.js";


// export const addClearance = async (req, res) => {
//   try {
//     const { date, inmate, reason, remark, } = req.body;
//     const sign=req.file.filename;
//     // Validate required fields
//     if (!date || !inmate || !reason || !remark) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const newClearance = new Clearance({
//       date,
//       inmate,
//       reason,
//       remark,
//       sign: sign || "", // Default to empty string if not provided
//     });

//     await newClearance.save();
//     res.status(201).json({ success: true, message: "Clearance added successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to add the clearance", error: error.message });
//   }
// };


// export const getAllClearance = async (req, res) => {
//   try {
//     const clearances = await Clearance.find();
//     if (!clearances) {
//       return res.status(400).json({ message: "Clearance does not exist" });
//     }

//     res.status(200).json({ clearances: clearances });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// export const updateClearance = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {  date,
//         inmate,
//         reason,
//         remark,
//         sign} = req.body;

//         if (!date || !inmate || !reason|| !remark) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const updatedClearance = await Clearance.findByIdAndUpdate(
//       id,
//       {    date,
//         inmate,
//         reason,
//         remark,
//         sign},
//       { new: true} 
//     );

//     if (!updatedClearance) {
//       return res.status(404).json({ message: "Clearance not found" });
//     }

//     res.status(200).json({ data: updatedClearance, message: "Clearance updated successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// export const deleteClearance = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deletedClearance = await Clearance.findByIdAndDelete(id);

//     if (!deletedClearance) {
//       return res.status(404).json({ message: "Clearance not found" });
//     }

//     res.status(200).json({ message: "Clearance deleted successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

//  export const getClearance = async (req, res) => {
//    try {
//      const { id } = req.params;
//      const clearanceInfo = await Clearance.findOne({ _id: id });
//      if (!clearanceInfo) {
//        return res.status(400).json({ message: "Clearance does not exist" });
//      }
 
//      res.status(200).json({ clearance: clearanceInfo });
//    } catch (error) {
//      console.error(error);
//      res.status(500).json({ message: "Server error" });
//    }
//  };
 

import { Clearance } from "../model/clearance.model.js";
import { archiveItem } from '../controllers/archive.controller.js';

// Get all clearances
export const getAllClearances = async (req, res) => {
  try {
    const clearances = await Clearance.find();
    res.status(200).json({ success: true, clearances });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get a single clearance by ID
export const getClearanceById = async (req, res) => {
  try {
    const clearance = await Clearance.findById(req.params.id);
    if (!clearance) {
      return res.status(404).json({ success: false, message: "Clearance not found" });
    }
    res.status(200).json({ success: true, clearance });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create a new clearance
export const createClearance = async (req, res) => {
  try {
    const { 
      date, 
      inmate, 
      reason, 
      remark, 
      sign, 
      registrar, 
      clearanceId, 
      propertyStatus, 
      fineStatus, 
      medicalStatus, 
      notes 
    } = req.body;
    console.log( date, 
      inmate, 
      reason, 
      remark, 
      sign, 
      registrar, 
      clearanceId, 
      propertyStatus, 
      fineStatus, 
      medicalStatus, 
      notes )
    
    // Check for required fields
    if (!date || !inmate || !reason || !remark || !registrar || !clearanceId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields. Date, inmate, reason, remark, registrar, and clearanceId are required." 
      });
    }
    
    // Create new clearance with all fields
    const newClearance = new Clearance({ 
      date, 
      inmate, 
      reason, 
      remark, 
      sign, 
      registrar, 
      clearanceId,
      propertyStatus: propertyStatus || "Returned",
      fineStatus: fineStatus || "No Outstanding",
      medicalStatus: medicalStatus || "Cleared",
      notes: notes || ""
    });
    
    await newClearance.save();
    res.status(201).json({ 
      success: true, 
      message: "Clearance created successfully", 
      newClearance 
    });
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error (for unique clearanceId)
      return res.status(400).json({ 
        success: false, 
        message: "Clearance ID already exists. Please generate a new one." 
      });
    }
    console.error("Error creating clearance:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create clearance",
      error: error.message 
    });
  }
};

// Update a clearance
export const updateClearance = async (req, res) => {
  try {
    const { 
      date, 
      inmate, 
      reason, 
      remark, 
      sign, 
      registrar, 
      clearanceId, 
      propertyStatus, 
      fineStatus, 
      medicalStatus, 
      notes 
    } = req.body;
    
    console.log( date, 
      inmate, 
      reason, 
      remark, 
      sign, 
      registrar, 
      clearanceId, 
      propertyStatus, 
      fineStatus, 
      medicalStatus, 
      notes )
    // Prepare update data
    const updateData = {};
    
    if (date) updateData.date = date;
    if (inmate) updateData.inmate = inmate;
    if (reason) updateData.reason = reason;
    if (remark) updateData.remark = remark;
    if (sign) updateData.sign = sign;
    if (registrar) updateData.registrar = registrar;
    if (clearanceId) updateData.clearanceId = clearanceId;
    if (propertyStatus) updateData.propertyStatus = propertyStatus;
    if (fineStatus) updateData.fineStatus = fineStatus;
    if (medicalStatus) updateData.medicalStatus = medicalStatus;
    if (notes !== undefined) updateData.notes = notes;
    
    const updatedClearance = await Clearance.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedClearance) {
      return res.status(404).json({ 
        success: false, 
        message: "Clearance not found" 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Clearance updated successfully", 
      updatedClearance 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Clearance ID already exists. Please use a different ID." 
      });
    }
    console.error("Error updating clearance:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update clearance",
      error: error.message
    });
  }
};

// Delete a clearance
export const deleteClearance = async (req, res) => {
  try {
    const deletedClearance = await Clearance.findById(req.params.id);
    
    if (!deletedClearance) {
      return res.status(404).json({ 
        success: false, 
        message: "Clearance not found" 
      });
    }
    
    // Manual archive before deletion
    try {
      const reason = req.body.reason || 'Clearance deleted by user';
      await archiveItem('clearance', deletedClearance._id, req.user.id, reason);
      console.log(`Clearance ${deletedClearance.clearanceId} archived successfully`);
    } catch (archiveError) {
      console.error("Error archiving clearance:", archiveError);
      // Continue with deletion even if archiving fails
    }
    
    // Delete the clearance
    await Clearance.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ 
      success: true, 
      message: "Clearance deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting clearance:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete clearance",
      error: error.message
    });
  }
};

// Get clearances for a specific inmate
export const getInmateClearances = async (req, res) => {
  try {
    const { inmateId } = req.params;
    const clearances = await Clearance.find({ inmate: inmateId });
    
    res.status(200).json({ 
      success: true, 
      count: clearances.length,
      clearances 
    });
  } catch (error) {
    console.error("Error fetching inmate clearances:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch inmate clearances",
      error: error.message
    });
  }
};

// Get clearance statistics
export const getClearanceStats = async (req, res) => {
  try {
    const totalClearances = await Clearance.countDocuments();
    
    // Get clearance counts by property status
    const propertyStatusStats = await Clearance.aggregate([
      { $group: { _id: "$propertyStatus", count: { $sum: 1 } } }
    ]);
    
    // Get clearance counts by fine status
    const fineStatusStats = await Clearance.aggregate([
      { $group: { _id: "$fineStatus", count: { $sum: 1 } } }
    ]);
    
    // Get clearance counts by medical status
    const medicalStatusStats = await Clearance.aggregate([
      { $group: { _id: "$medicalStatus", count: { $sum: 1 } } }
    ]);
    
    // Get recent clearances (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentClearances = await Clearance.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    res.status(200).json({
      success: true,
      stats: {
        total: totalClearances,
        recent: recentClearances,
        propertyStatus: propertyStatusStats,
        fineStatus: fineStatusStats,
        medicalStatus: medicalStatusStats
      }
    });
  } catch (error) {
    console.error("Error fetching clearance statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch clearance statistics",
      error: error.message
    });
  }
};
