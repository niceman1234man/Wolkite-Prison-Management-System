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
    
    console.log(`Logging activity: ${action} - ${description}`);
    
    // Send the log to the server
    const response = await axiosInstance.post('/activity/log', logData);
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
  APPROVE: 'approve',
  REJECT: 'reject',
  TRANSFER: 'transfer',
  SEARCH: 'search',
  ASSIGN: 'assign',
  SCHEDULE: 'schedule',
  BACKUP: 'backup',
  RESTORE: 'restore',
  EXPORT: 'export',
  IMPORT: 'import'
};

/**
 * Resource types for consistency across the application
 */
export const RESOURCES = {
  INMATE: 'inmate',
  VISITOR: 'visitor',
  USER: 'user',
  SCHEDULE: 'schedule',
  DOCUMENT: 'document',
  INCIDENT: 'incident',
  REPORT: 'report',
  PAROLE: 'parole',
  CASE: 'case',
  SYSTEM: 'system',
  PRISON: 'prison',
  TRANSFER: 'transfer',
  MESSAGE: 'message',
  PROFILE: 'profile',
  BACKUP: 'backup'
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