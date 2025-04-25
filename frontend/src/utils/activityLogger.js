import axiosInstance from './axiosInstance';

/**
 * Log user activity to the system
 * @param {string} action - The action type (create, update, delete, view, etc.)
 * @param {string} description - Description of what happened
 * @param {string} resourceType - Type of resource affected (inmate, visitor, document, etc.)
 * @param {string} resourceId - ID of the resource
 * @param {string} status - Status of the action (success, failure, warning, info)
 * @param {object} additionalData - Optional additional data to log
 * @returns {Promise} - The axios response or error
 */
export const logActivity = async (
  action, 
  description, 
  resourceType, 
  resourceId = null, 
  status = 'success',
  additionalData = {}
) => {
  try {
    // Get current user from localStorage if needed
    // This is just in case the backend doesn't extract user from token
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Prepare the log data
    const logData = {
      action,
      description,
      resourceType,
      resourceId,
      status,
      ...additionalData
    };
    
    // Make sure user ID is set if available
    if (!logData.user && userData && userData._id) {
      logData.user = userData._id;
      
      // Also add other user details if not already provided
      if (!logData.userEmail && userData.email) {
        logData.userEmail = userData.email;
      }
      
      if (!logData.userName && userData.name) {
        logData.userName = userData.name;
      } else if (!logData.userName && userData.firstName) {
        logData.userName = `${userData.firstName} ${userData.lastName || ''}`.trim();
      }
      
      if (!logData.userRole && userData.role) {
        logData.userRole = userData.role;
      }
    }
    
    console.log(`Logging activity: ${action} - ${description}`, logData);
    
    // Send the log to the server
    const response = await axiosInstance.post('/activity/log', logData);
    
    if (!response.data.success) {
      console.error('Activity logging server error:', response.data.message);
    }
    
    return response.data;
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw the error - we don't want logging failures to break main functionality
    return { success: false, error: error.message };
  }
};

/**
 * Action types for consistency across the application
 */
export const ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  LOGIN: 'login',
  LOGOUT: 'logout',
  DOWNLOAD: 'download',
  UPLOAD: 'upload',
  BACKUP: 'backup',
  RESTORE: 'restore',
  PASSWORD_CHANGE: 'password_change',
  ACCOUNT_ACTIVATION: 'account_activation',
  ACCOUNT_DEACTIVATION: 'account_deactivation'
};

/**
 * Resource types for consistency across the application
 */
export const RESOURCES = {
  INMATE: 'inmate',
  VISITOR: 'visitor',
  USER: 'user',
  PRISON: 'prison',
  INCIDENT: 'incident',
  CLEARANCE: 'clearance',
  NOTICE: 'notice',
  TRANSFER: 'transfer',
  PAROLE: 'parole',
  INSTRUCTION: 'instruction',
  REPORT: 'report',
  SYSTEM: 'system'
};

/**
 * Status types for consistency
 */
export const STATUS = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  WARNING: 'warning',
  INFO: 'info'
};

export default logActivity; 