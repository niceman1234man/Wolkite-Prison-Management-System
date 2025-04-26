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
    const response = await axiosInstance.post(`/archive/${id}/restore`);
    return response.data;
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
    const response = await axiosInstance.delete(`/archive/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error permanently deleting archived item:', error);
    throw error;
  }
};

export default {
  getArchivedItems,
  getArchivedItemDetails,
  restoreArchivedItem,
  permanentlyDeleteArchivedItem
}; 