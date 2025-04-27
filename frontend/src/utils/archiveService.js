import axiosInstance from './axiosInstance';

/**
 * Fetch archived items with pagination and filtering
 * @param {Object} params - Query parameters
 * @returns {Promise} - Archive items with pagination
 */
export const getArchivedItems = async (params = {}) => {
  try {
    console.log("Fetching archived items with params:", params);
    const response = await axiosInstance.get('/archive', { params });
    console.log("Archive API detailed response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching archived items:', error);
    throw error;
  }
};

/**
 * Get details of a specific archived item
 * @param {String} id - Archive item ID
 * @returns {Promise} - Archive item details
 */
export const getArchivedItemDetails = async (id) => {
  try {
    const response = await axiosInstance.get(`/archive/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching archived item details:', error);
    throw error;
  }
};

/**
 * Restore an archived item
 * @param {String} id - Archive item ID
 * @returns {Promise} - Result of restoration
 */
export const restoreArchivedItem = async (id) => {
  try {
    // Get the current user from localStorage to include in the restore request
    let userData = {};
    let userId = '000000000000000000000000'; // Default fallback ID
    let role = 'unknown';
    
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        userData = JSON.parse(userString);
        userId = userData._id || userData.id || userId;
        role = userData.role || role;
      }
    } catch (e) {
      console.error('Error parsing user data from localStorage:', e);
    }
    
    // Create a payload with user info to help with restoration
    const payload = {
      userId,
      role,
      restoredAt: new Date().toISOString()
    };
    
    console.log(`Attempting to restore archive ${id} with user ${userId} (${role})`);
    
    // First check the archive details to determine entity type
    let archiveDetails;
    try {
      archiveDetails = await getArchivedItemDetails(id);
      console.log('Archive details:', archiveDetails);
    } catch (detailsError) {
      console.warn('Could not fetch archive details:', detailsError.message);
    }
    
    // Special handling for inmate archives
    if (archiveDetails?.data?.entityType === 'inmate') {
      console.log('Restoring inmate archive, using manual-archive endpoint directly');
      try {
        const manualResponse = await axiosInstance.post(`/manual-archive/${id}/restore`, payload);
        console.log('Manual restore successful:', manualResponse.data);
        return manualResponse.data;
      } catch (error) {
        console.error('Failed to restore inmate:', error.message);
        throw error;
      }
    }
    
    // Standard restoration process for other entity types
    try {
      console.log('Trying standard archive restoration endpoint...');
      const response = await axiosInstance.post(`/archive/${id}/restore`, payload);
      console.log('Standard restore successful:', response.data);
      return response.data;
    } catch (standardError) {
      console.warn('Standard archive restoration failed:', standardError.message);
      console.log('Status:', standardError.response?.status);
      console.log('Response:', standardError.response?.data);
      console.log('Falling back to manual archive endpoint...');
      
      // Fall back to our manual archive endpoint
      try {
        const manualResponse = await axiosInstance.post(`/manual-archive/${id}/restore`, payload);
        console.log('Manual restore successful:', manualResponse.data);
        return manualResponse.data;
      } catch (manualError) {
        console.error('Manual archive restoration failed:', manualError.message);
        console.log('Status:', manualError.response?.status);
        console.log('Response:', manualError.response?.data);
        throw new Error('Both standard and manual restoration attempts failed');
      }
    }
  } catch (error) {
    console.error('Error restoring archived item:', error);
    throw error;
  }
};

/**
 * Permanently delete an archived item
 * @param {String} id - Archive item ID
 * @returns {Promise} - Result of deletion
 */
export const permanentlyDeleteArchivedItem = async (id) => {
  try {
    console.log(`Attempting to permanently delete archive item with ID: ${id}`);
    
    try {
      // First try the standard archive endpoint
      const response = await axiosInstance.delete(`/archive/${id}`);
      console.log('Archive item permanently deleted successfully via standard endpoint', response.data);
      return response.data;
    } catch (standardError) {
      console.warn('Standard archive delete failed, trying manual archive endpoint', standardError.message);
      
      // If standard endpoint fails, try the manual archive endpoint
      const manualResponse = await axiosInstance.delete(`/manual-archive/${id}`);
      console.log('Archive item permanently deleted successfully via manual endpoint', manualResponse.data);
      return manualResponse.data;
    }
  } catch (error) {
    console.error('Failed to permanently delete archive item:', error.response?.data || error.message);
    throw error;
  }
};

export default {
  getArchivedItems,
  getArchivedItemDetails,
  restoreArchivedItem,
  permanentlyDeleteArchivedItem
}; 