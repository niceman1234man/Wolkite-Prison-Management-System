import Archive from '../model/archive.model.js';
import mongoose from 'mongoose';
import { User } from '../model/user.model.js';
import Prison from '../model/prison.model.js';
import { Inmate } from '../model/inmate.model.js';
import { Notice } from '../model/notice.model.js';
import { Clearance } from '../model/clearance.model.js';
import VisitorAccount from '../model/visitorAccount.model.js';
import { DailyIntake, TransferStats } from '../model/report.js';
import { Transfer } from '../model/transfer.model.js';
import { Incident } from '../model/Incident.model.js';
import { WoredaInmate } from '../model/woredaInmate.model.js';

// Map of entity types to their corresponding models
const entityModels = {
  'prison': Prison,
  'inmate': Inmate,
  'woredaInmate': WoredaInmate,
  'notice': Notice,
  'clearance': Clearance,
  'visitor': VisitorAccount,
  'report': DailyIntake, // Using DailyIntake as default for report
  'transfer': Transfer,
  'incident': Incident,
  'user': User
};

/**
 * Archive an item before deletion
 * @param {String} entityType - Type of entity (prison, inmate, etc.)
 * @param {ObjectId} itemId - ID of the item being deleted
 * @param {ObjectId} userId - ID of the user performing the deletion
 * @param {String} reason - Reason for deletion
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} - The archived item
 */
export const archiveItem = async (entityType, itemId, userId, reason = '', metadata = {}) => {
  try {
    // Check if entity type is supported
    if (!entityModels[entityType]) {
      throw new Error(`Unsupported entity type: ${entityType}`);
    }

    // Find the item to archive
    const Model = entityModels[entityType];
    const item = await Model.findById(itemId);
    
    if (!item) {
      throw new Error(`${entityType} with ID ${itemId} not found`);
    }

    // Create archive record
    const archive = new Archive({
      entityType,
      originalId: itemId,
      data: item.toObject ? item.toObject() : item,
      deletedBy: userId,
      deletionReason: reason,
      metadata
    });

    // Save the archive
    await archive.save();
    
    return archive;
  } catch (error) {
    console.error(`Error archiving ${entityType}:`, error);
    throw error;
  }
};

/**
 * Get archived items with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getArchivedItems = async (req, res) => {
  try {
    const {
      entityType,
      page = 1,
      limit = 10,
      startDate,
      endDate,
      isRestored,
      searchTerm,
      deletedBy
    } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by entity type if provided
    if (entityType) {
      query.entityType = entityType;
    }
    
    // Filter by restoration status if provided
    if (isRestored !== undefined) {
      query.isRestored = isRestored === 'true';
    }
    
    // Filter by date range if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Filter by who deleted the item
    if (deletedBy) {
      query.deletedBy = new mongoose.Types.ObjectId(deletedBy);
    }
    
    // Search functionality
    if (searchTerm) {
      // Search in the data field - this is a simple example and might need optimization
      query.$or = [
        { 'data.name': { $regex: searchTerm, $options: 'i' } },
        { 'data.prison_name': { $regex: searchTerm, $options: 'i' } },
        { 'data.title': { $regex: searchTerm, $options: 'i' } },
        { 'entityType': { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    // Role-based filtering
    const userRole = req.user.role;
    
    // Special case for security staff - show clearance, inmate, visitor, and transfer items
    if (userRole === 'security') {
      console.log('Security staff requesting archives');
      
      // Check if a specific entity type was requested
      if (entityType) {
        // Allow security staff to view these specific entity types
        const securityAllowedTypes = ['clearance', 'inmate', 'visitor', 'transfer', 'report'];
        if (!securityAllowedTypes.includes(entityType)) {
          console.log(`Security staff not allowed to view ${entityType} archives`);
          return res.status(403).json({
            success: false,
            message: `Security staff cannot access ${entityType} archives`
          });
        }
        
        // Keep the requested entity type filter
        console.log(`Security staff requesting ${entityType} archives - allowing access`);
      }
      else {
        // If no entity type specified, limit to allowed types
        console.log('Security staff requesting all archives - limiting to allowed types');
        query.entityType = { $in: ['clearance', 'inmate', 'visitor', 'transfer', 'report'] };
      }
      
      // Don't restrict by deletedBy for security staff - they can see all of their allowed entity types
      // Remove any existing deletedBy filter
      delete query.deletedBy;
    }
    // Non-admin users can only see specific entity types and their own archives
    else if (userRole && userRole !== 'admin') {
      // Entity types by role mapping
      const roleEntityTypeMap = {
        'inspector': ['prison', 'notice'],
        'police-officer': ['incident', 'visitor', 'transfer'],
        'court': ['clearance'],
        'woreda': ['woredaInmate']
      };
      
      // If role has restrictions and no entityType is specified in query
      if (roleEntityTypeMap[userRole] && !entityType) {
        query.entityType = { $in: roleEntityTypeMap[userRole] };
      }
      
      // Non-admin users can only see items they deleted (if not already filtered)
      if (!deletedBy) {
        query.deletedBy = new mongoose.Types.ObjectId(req.user.id);
      }
    }
    
    // Count total documents for pagination
    const total = await Archive.countDocuments(query);
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get archived items
    const archivedItems = await Archive.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('deletedBy', 'username name')
      .populate('restoredBy', 'username name');
    
    // Send response
    res.status(200).json({
      success: true,
      data: {
        items: archivedItems,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting archived items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get archived items',
      error: error.message
    });
  }
};

/**
 * Get details of a single archived item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getArchivedItemDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the archived item
    const archivedItem = await Archive.findById(id)
      .populate('deletedBy', 'username name')
      .populate('restoredBy', 'username name');
    
    if (!archivedItem) {
      return res.status(404).json({
        success: false,
        message: 'Archived item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: archivedItem
    });
  } catch (error) {
    console.error('Error getting archived item details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get archived item details',
      error: error.message
    });
  }
};

/**
 * Restore an archived item back to its original collection
 */
export const restoreArchivedItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the archived item
    const archivedItem = await Archive.findById(id);
    
    if (!archivedItem) {
      return res.status(404).json({
        success: false,
        message: 'Archived item not found'
      });
    }
    
    // Check if already restored
    if (archivedItem.isRestored) {
      return res.status(400).json({
        success: false,
        message: 'Item has already been restored'
      });
    }
    
    // Get the appropriate model
    const entityType = archivedItem.entityType;
    const Model = entityModels[entityType];
    
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: `Unsupported entity type: ${entityType}`
      });
    }
    
    // Get the data to restore
    let dataToRestore = { ...archivedItem.data };
    
    // Special handling for user entity
    if (entityType === 'user') {
      // Remove _id if present to avoid duplicate key error
      delete dataToRestore._id;
      
      // Ensure prison field is present to avoid validation error
      if (!dataToRestore.prison) {
        dataToRestore.prison = null;
      }
      
      // Ensure required fields have at least default values
      if (!dataToRestore.photo) {
        dataToRestore.photo = 'default-avatar.png';
      }
      
      // If there's no password, generate a random one
      if (!dataToRestore.password) {
        const tempPassword = Math.random().toString(36).substring(2, 10);
        // This will be hashed by the pre-save hook
        dataToRestore.password = tempPassword;
      }
    }
    
    // Create a new document with the restored data
    const restoredItem = new Model(dataToRestore);
    
    // Save the restored item
    await restoredItem.save();
    
    // Update the archived item to mark as restored
    archivedItem.isRestored = true;
    archivedItem.restoredAt = new Date();
    archivedItem.restoredBy = req.user.id;
    await archivedItem.save();
    
    return res.status(200).json({
      success: true,
      message: `${entityType} restored successfully`,
      restoredItem
    });
  } catch (error) {
    console.error('Error restoring item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to restore archived item',
      error: error.message
    });
  }
};

/**
 * Permanently delete an archived item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const permanentlyDeleteArchivedItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Get the archived item
    const archivedItem = await Archive.findById(id);
    
    if (!archivedItem) {
      return res.status(404).json({
        success: false,
        message: 'Archived item not found'
      });
    }
    
    // Check if already restored
    if (archivedItem.isRestored) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a restored item'
      });
    }
    
    // Role-based permission check
    if (userRole !== 'admin') {
      // Entity types by role mapping
      const roleEntityTypeMap = {
        'inspector': ['prison', 'notice'],
        'police-officer': ['incident', 'visitor', 'transfer'],
        'court': ['clearance'],
        'woreda': ['woredaInmate'],
        'security': ['inmate', 'clearance', 'visitor', 'transfer', 'report']
      };
      
      // Check if this user role can access this entity type
      const canAccessEntityType = roleEntityTypeMap[userRole]?.includes(archivedItem.entityType);
      
      // Special case for security staff - they can delete inmate and clearance archives even if not the owner
      if (userRole === 'security' && ['inmate', 'clearance'].includes(archivedItem.entityType)) {
        console.log(`Security staff deleting ${archivedItem.entityType} archive.`);
        // Allow security staff to delete these types
      }
      // Check if the user is the one who deleted it
      else {
        const isOwner = archivedItem.deletedBy.toString() === userId;
        
        // Inspectors should be able to delete any prison or notice they have archived
        // Other roles can only delete items they archived if they have permission for that entity type
        if (userRole === 'inspector' && ['prison', 'notice'].includes(archivedItem.entityType)) {
          if (!isOwner) {
            return res.status(403).json({
              success: false,
              message: 'You can only delete items that you archived'
            });
          }
        } else if (!canAccessEntityType || !isOwner) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to delete this item'
          });
        }
      }
    }
    
    // Delete the archived item
    await Archive.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Archive item permanently deleted'
    });
  } catch (error) {
    console.error('Error permanently deleting archived item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete archived item',
      error: error.message
    });
  }
};

export default {
  archiveItem,
  getArchivedItems,
  getArchivedItemDetails,
  restoreArchivedItem,
  permanentlyDeleteArchivedItem
}; 