import { archiveItem } from '../controllers/archive.controller.js';

/**
 * Archive middleware - adds archiving functionality to existing controllers
 * @param {String} entityType - The type of entity (prison, inmate, etc.)
 * @returns {Function} - Express middleware function
 */
export const archiveMiddleware = (entityType) => {
  return async (req, res, next) => {
    // Store the original delete method
    const originalDelete = res.json;
    
    // Overwrite the json method to intercept delete responses
    res.json = function (data) {
      // If it's a successful deletion and we have an item ID, archive it
      if (data.success && data.message && data.message.includes('deleted') && req.params.id) {
        try {
          // Get user ID from request
          const userId = req.user.id;
          
          // Get reason if provided in request body
          const reason = req.body.reason || '';
          
          // Archive the item
          archiveItem(entityType, req.params.id, userId, reason)
            .then(() => {
              console.log(`Successfully archived ${entityType} with ID ${req.params.id}`);
            })
            .catch(err => {
              console.error(`Error archiving ${entityType}:`, err);
            });
        } catch (error) {
          console.error(`Error in archive middleware for ${entityType}:`, error);
        }
      }
      
      // Call the original json method
      return originalDelete.call(this, data);
    };
    
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