import mongoose from 'mongoose';
import Archive from '../model/archive.model.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Create a fallback VisitorSchedule model if needed
let VisitorSchedule;
try {
  // Try to import the existing model
  VisitorSchedule = (await import('../model/visitorSchedule.model.js')).default;
  console.log('Successfully imported VisitorSchedule model');
} catch (error) {
  console.error('Error importing VisitorSchedule model:', error);
  // Create a placeholder model
  const visitorScheduleSchema = new mongoose.Schema({}, { strict: false });
  VisitorSchedule = mongoose.models.VisitorSchedule || 
                   mongoose.model('VisitorSchedule', visitorScheduleSchema);
}

/**
 * Create a manual archive entry directly
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createManualArchive = async (req, res) => {
  try {
    console.log("Received manual archive request:", JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    const { entityType, data, originalId } = req.body;
    
    console.log(`Processing manual archive for ${entityType} with ID ${originalId}`);
    
    if (!entityType || !data || !originalId) {
      console.error("Missing required fields:", { entityType, originalId, dataExists: !!data });
      return res.status(400).json({
        success: false,
        message: "Missing required fields: entityType, data, and originalId are required"
      });
    }
    
    // Ensure we have a deletedBy field, either from the request or from the auth user
    let deletedBy = req.body.deletedBy || (req.user ? req.user.id : null);
    
    if (!deletedBy) {
      console.warn("No deletedBy ID provided for manual archive");
      // Use a default placeholder ID if none is provided
      deletedBy = new mongoose.Types.ObjectId('000000000000000000000000');
    }
    
    console.log(`Archive will be created with deletedBy: ${deletedBy}`);
    
    // Ensure the data is properly structured for restoration
    let archiveData = data;
    
    // Make sure we have the proper data structure for the visitor entityType
    if (entityType === 'visitor') {
      // Check if we need to convert the structure
      if (!archiveData.status || !archiveData.visitDate) {
        console.log('Converting visitor data to proper format for archive');
        
        // Ensure we have the right format for visitor schedule data
        archiveData = {
          ...archiveData,
          // Make sure these fields exist for restoration
          status: archiveData.status || 'deleted',
          visitDate: archiveData.visitDate || new Date().toISOString(),
          purpose: archiveData.purpose || 'Visit purpose',
          relationship: archiveData.relationship || 'Unknown',
          // These fields help with restoration
          _id: originalId,
          __v: 0,
          createdAt: archiveData.createdAt || new Date().toISOString(),
          updatedAt: archiveData.updatedAt || new Date().toISOString()
        };
      }
    }
    // For incident entity type
    else if (entityType === 'incident') {
      console.log('Processing incident data for archive');
      
      // Ensure we have the right format for incident data
      archiveData = {
        ...archiveData,
        // Make sure these fields exist for restoration
        _id: originalId,
        __v: 0,
        createdAt: archiveData.createdAt || new Date().toISOString(),
        updatedAt: archiveData.updatedAt || new Date().toISOString()
      };
      
      console.log('Archive data prepared for incident:', archiveData);
    }
    // For inmate entity type
    else if (entityType === 'inmate') {
      console.log('Processing inmate data for archive:', JSON.stringify(data, null, 2));
      
      // Log important fields for debugging
      console.log('Inmate data fields check:', {
        hasInmateName: !!archiveData.inmateName || !!archiveData.inmate_name,
        hasId: !!archiveData._id,
        id: archiveData._id || 'missing',
        originalId: originalId
      });
      
      // Add required fields for restoration later
      archiveData = {
        ...archiveData,
        _id: originalId,
        __v: 0,
        createdAt: archiveData.createdAt || new Date().toISOString(),
        updatedAt: archiveData.updatedAt || new Date().toISOString(),
        // Include formatted display name in case frontend only sends the formatted version
        inmateName: archiveData.inmate_name || archiveData.inmateName || 'Unknown Inmate'
      };
      
      console.log('Archive data prepared for inmate:', archiveData);
    }
    
    // Create a new archive record
    const archive = new Archive({
      entityType,
      originalId: originalId,
      data: archiveData,
      deletedBy,
      deletionReason: req.body.deletionReason || 'Manually archived',
      metadata: req.body.metadata || {},
      // Default to not restored
      isRestored: false,
      restoredAt: null,
      restoredBy: null
    });
    
    // Save the archive
    console.log("Attempting to save archive to database");
    await archive.save();
    
    console.log(`Manual archive created successfully for ${entityType} with ID ${originalId}`);
    
    return res.status(201).json({
      success: true,
      message: "Archive created successfully",
      archiveId: archive._id
    });
  } catch (error) {
    console.error("Error creating manual archive:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating manual archive",
      error: error.message
    });
  }
};

/**
 * Manually restore an archived item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const restoreManualArchive = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Attempting to restore archive with ID: ${id}`);
    
    // Find the archive record
    const archive = await Archive.findById(id);
    if (!archive) {
      return res.status(404).json({ 
        success: false, 
        message: "Archive record not found" 
      });
    }
    
    // Check if already restored
    if (archive.isRestored) {
      return res.status(400).json({ 
        success: false, 
        message: "Archive record has already been restored" 
      });
    }
    
    // Get user ID for restoration
    const userId = req.user?.id || req.body.userId || '000000000000000000000000';
    
    // Handle restoration based on entity type
    if (archive.entityType === 'visitor') {
      try {
        // We'll use direct mongoose operations instead of requiring the model
        // This avoids import issues
        let visitorData = {...archive.data};
        
        // Remove fields that might cause issues during recreation
        delete visitorData._id;
        delete visitorData.__v;
        
        // 1. Ensure userId exists (required field)
        if (!visitorData.userId) {
          visitorData.userId = userId;
        }
        
        // 2. Fix relationship enum values
        const relationshipMap = {
          'family': 'relative',
          'relative': 'relative',
          'friend': 'friend',
          'legal': 'legal',
          'parent': 'parent',
          'spouse': 'spouse',
          'child': 'child',
          'sibling': 'sibling'
        };
        
        if (!relationshipMap[visitorData.relationship?.toLowerCase()]) {
          visitorData.relationship = 'other';
        } else {
          visitorData.relationship = relationshipMap[visitorData.relationship?.toLowerCase()];
        }
        
        // 3. Fix idType enum values
        const idTypeMap = {
          'nationalId': 'national_id',
          'national_id': 'national_id',
          'passport': 'passport',
          'drivers_license': 'drivers_license',
          'driversLicense': 'drivers_license',
          'driver_license': 'drivers_license'
        };
        
        if (!idTypeMap[visitorData.idType?.toLowerCase()]) {
          visitorData.idType = 'other';
        } else {
          visitorData.idType = idTypeMap[visitorData.idType?.toLowerCase()];
        }
        
        // 4. Ensure other required fields have values
        if (!visitorData.firstName) visitorData.firstName = "Unknown";
        if (!visitorData.lastName) visitorData.lastName = "Visitor";
        if (!visitorData.phone) visitorData.phone = "000000000";
        if (!visitorData.visitDate) visitorData.visitDate = new Date();
        if (!visitorData.visitTime) visitorData.visitTime = "00:00";
        if (!visitorData.purpose) visitorData.purpose = "Restored visit";
        if (!visitorData.idNumber) visitorData.idNumber = "RESTORED-" + Date.now();
        
        // 5. Ensure status is valid
        const validStatus = ["Pending", "Approved", "Rejected", "Completed", "Cancelled", 
                           "pending", "approved", "rejected", "completed", "cancelled"];
        if (!validStatus.includes(visitorData.status)) {
          visitorData.status = "Pending";
        }
        
        console.log('Creating new visitor schedule with data:', visitorData);
        
        // Create directly using mongoose collection
        // This avoids the need for the specific model
        const db = mongoose.connection;
        const visitorScheduleCollection = db.collection('visitorschedules');
        
        // Add timestamps
        visitorData.createdAt = new Date();
        visitorData.updatedAt = new Date();
        
        // Insert the document
        const result = await visitorScheduleCollection.insertOne(visitorData);
        console.log('Visitor schedule created with ID:', result.insertedId);
        
        // Update the archive record to indicate restoration
        archive.isRestored = true;
        archive.restoredAt = new Date();
        archive.restoredBy = userId;
        await archive.save();
        
        return res.status(200).json({
          success: true,
          message: "Visitor schedule restored successfully",
          restoredItem: {
            _id: result.insertedId,
            ...visitorData
          }
        });
      } catch (error) {
        console.error('Error restoring visitor schedule:', error);
        return res.status(500).json({
          success: false,
          message: "Failed to restore visitor schedule",
          error: error.message
        });
      }
    } else if (archive.entityType === 'incident') {
      try {
        console.log('Attempting to restore incident');
        
        // For incidents, we need to create a new record in the incidents collection
        // This would require importing the Incident model and creating a new instance
        // For now, we'll just mark it as restored and leave the actual restoration for custom logic
        
        // Update the archive record to indicate restoration
        archive.isRestored = true;
        archive.restoredAt = new Date();
        archive.restoredBy = userId;
        await archive.save();
        
        // Return success with a note that manual intervention is required
        return res.status(200).json({
          success: true,
          message: "Incident marked as restored in archive system. Use the archive data to manually recreate the incident in the incidents system if needed.",
          archiveData: archive.data
        });
      } catch (error) {
        console.error('Error restoring incident:', error);
        return res.status(500).json({
          success: false,
          message: "Failed to restore incident",
          error: error.message
        });
      }
    } else if (archive.entityType === 'inmate') {
      try {
        console.log('Attempting to restore inmate');
        console.log('Archive data for inmate:', JSON.stringify(archive.data, null, 2));
        
        // Actually restore the inmate instead of just marking it
        let inmateData = {...archive.data};
        
        // Remove fields that might cause issues during recreation
        delete inmateData.__v;
        
        // Save the original ID to restore it exactly as it was
        const originalId = inmateData._id;
        
        console.log(`Restoring inmate with original ID: ${originalId}`);
        
        // Use direct MongoDB operations to ensure we can set the original ID
        const db = mongoose.connection;
        const inmateCollection = db.collection('inmates');
        
        // Check if inmate with this ID already exists
        const existingInmate = await inmateCollection.findOne({ _id: new mongoose.Types.ObjectId(originalId) });
        if (existingInmate) {
          console.log('Inmate with this ID already exists:', existingInmate._id);
          return res.status(400).json({ 
            success: false, 
            message: "An inmate with this ID already exists in the system" 
          });
        }
        
        // Ensure required fields exist
        if (!inmateData.firstName) inmateData.firstName = inmateData.inmateName || "Unknown";
        if (!inmateData.lastName) inmateData.lastName = "Restored";
        
        // Add appropriate timestamps
        inmateData.createdAt = inmateData.createdAt || new Date();
        inmateData.updatedAt = new Date();
        
        // Convert string ID to ObjectId if needed
        if (typeof inmateData._id === 'string') {
          inmateData._id = new mongoose.Types.ObjectId(inmateData._id);
        }
        
        // Insert the document with original ID
        console.log('Inserting inmate with data:', inmateData);
        const result = await inmateCollection.insertOne(inmateData);
        console.log('Inmate created with ID:', result.insertedId);
        
        // Update the archive record to indicate restoration
        archive.isRestored = true;
        archive.restoredAt = new Date();
        archive.restoredBy = userId;
        await archive.save();
        
        // Return success
        return res.status(200).json({
          success: true,
          message: "Inmate record restored successfully to the inmate management system",
          restoredItem: {
            _id: result.insertedId,
            ...inmateData
          }
        });
      } catch (error) {
        console.error('Error restoring inmate:', error);
        return res.status(500).json({
          success: false,
          message: "Failed to restore inmate record",
          error: error.message
        });
      }
    } else {
      // Generic handling for other entity types
      return res.status(400).json({
        success: false,
        message: `Restoration for entity type '${archive.entityType}' is not implemented`
      });
    }
  } catch (error) {
    console.error("Error restoring archive:", error);
    return res.status(500).json({
      success: false,
      message: "Error restoring archive",
      error: error.message
    });
  }
};

/**
 * Permanently delete an archived item - less strict version
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const permanentlyDeleteManualArchive = async (req, res) => {
  const { id } = req.params;
  console.log(`Attempting to permanently delete archive with ID: ${id}`);

  try {
    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid archive ID format: ${id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid archive ID format'
      });
    }

    // Find and delete the archive
    const deletedArchive = await Archive.findByIdAndDelete(id);

    if (!deletedArchive) {
      console.log(`Archive with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Archive not found'
      });
    }

    console.log(`Successfully deleted archive with ID: ${id}`);
    return res.status(200).json({
      success: true,
      message: 'Archive permanently deleted',
      deletedArchiveId: id
    });
  } catch (error) {
    console.error(`Error permanently deleting archive with ID ${id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Error permanently deleting archive',
      error: error.message
    });
  }
};

export default {
  createManualArchive,
  restoreManualArchive,
  permanentlyDeleteManualArchive
}; 