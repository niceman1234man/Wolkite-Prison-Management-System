import { archiveItem } from '../controllers/archive.controller.js';

/**
 * Archive middleware - archives an entity before deletion
 * @param {String} entityType - The type of entity (prison, inmate, etc.)
 * @returns {Function} - Express middleware function
 */
export const archiveMiddleware = (entityType) => {
  return async (req, res, next) => {
    try {
      console.log(`Archive middleware running for ${entityType}...`);
      console.log("Request headers:", req.headers);
      console.log("Request user object:", req.user);
      
      // Only proceed if we have an item ID
      if (req.params.id) {
        console.log(`Item ID found: ${req.params.id}`);
        // Get user ID from request
        const userId = req.user?.id;
        
        if (!userId) {
          console.error('User ID not found in request for archiving');
          console.log('Full req.user object:', req.user);
          console.log('Auth header:', req.headers.authorization);
          return next();
        }
        
        console.log(`User ID found: ${userId}`);
        
        // Get reason if provided in request body
        const reason = req.body.reason || `${entityType} deleted by user`;
        console.log(`Reason for deletion: ${reason}`);
        
        try {
          // Archive the item before deletion
          console.log(`Attempting to archive ${entityType} with ID ${req.params.id}...`);
          const archiveResult = await archiveItem(entityType, req.params.id, userId, reason);
          console.log(`Archive result:`, archiveResult);
          
          // Set a flag to indicate this item has been archived
          req.archived = true;
          
          console.log(`Successfully archived ${entityType} with ID ${req.params.id}`);
        } catch (archiveError) {
          console.error(`Failed to archive ${entityType}:`, archiveError);
        }
      } else {
        console.log('No item ID found in request params');
      }
    } catch (error) {
      console.error(`Error in archive middleware for ${entityType}:`, error);
      // Continue even if archiving fails - the controller may handle it
    }
    
    next();
  };
};

/**
 * Modify a controller's delete method to include archiving
 * @param {Object} controller - The controller object
 * @param {String} methodName - The delete method name to modify
 * @param {String} entityType - The type of entity (prison, inmate, etc.)
 * @param {Function} getItemId - Function to extract item ID from req (defaults to req.params.id)
 */
export const enhanceControllerWithArchiving = (controller, methodName, entityType, getItemId = req => req.params.id) => {
  // Store the original method
  const originalMethod = controller[methodName];
  
  // Replace with enhanced version
  controller[methodName] = async (req, res) => {
    try {
      // Get the item ID
      const itemId = getItemId(req);
      
      // Get user ID from request
      const userId = req.user.id;
      
      // Get reason if provided
      const reason = req.body.reason || '';
      
      // Archive the item before deletion
      await archiveItem(entityType, itemId, userId, reason);
      
      // Set a flag to indicate this item has been archived
      req.archived = true;
      
      // Call the original delete method
      return originalMethod(req, res);
    } catch (error) {
      console.error(`Error in enhanced ${methodName} for ${entityType}:`, error);
      
      // If archiving fails but it's just because the item doesn't exist,
      // proceed with deletion anyway
      if (error.message && error.message.includes('not found')) {
        return originalMethod(req, res);
      }
      
      // Otherwise return error
      return res.status(500).json({
        success: false,
        message: `Error archiving ${entityType} before deletion`,
        error: error.message
      });
    }
  };
};

export default {
  archiveMiddleware,
  enhanceControllerWithArchiving
}; 