import axios from "axios";

// Create an Axios instance with a base URL and default headers
const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api", // Replace with your backend API URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token in every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle specific error statuses
      switch (error.response.status) {
        case 401:
          console.error("Unauthorized: Please log in again.");
          break;
        case 403:
          console.error("Forbidden: You do not have permission to access this resource.");
          break;
        case 404:
          console.error("Resource not found.");
          break;
        case 500:
          console.error("Server error: Please try again later.");
          break;
        default:
          console.error("An error occurred:", error.message);
      }
    } else if (error.request) {
      console.error("No response received from the server.");
    } else {
      console.error("Error setting up the request:", error.message);
    }
    return Promise.reject(error);
  }
);

// API Functions

/**
 * Fetch all prisoners.
 * @returns {Promise} - Resolves with the list of prisoners.
 */
export const fetchPrisoners = async () => {
  try {
    const response = await axiosInstance.get("/prisoner/getall-prisoners");
    return response.data.prisoners;
  } catch (error) {
    throw error;
  }
};

/**
 * Register a new prisoner.
 * @param {Object} prisonerData - Prisoner data to register.
 * @returns {Promise} - Resolves with the created prisoner data.
 */
export const registerPrisoner = async (prisonerData) => {
  try {
    const response = await axiosInstance.post("/prisoner/new-prisoner", prisonerData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch all transfer requests.
 * @returns {Promise} - Resolves with the list of transfer requests.
 */
export const fetchTransfers = async () => {
  try {
    const response = await axiosInstance.get("/transfer/getall-transfers");
    return response.data.transfers;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new transfer request.
 * @param {Object} transferData - Transfer data to submit.
 * @returns {Promise} - Resolves with the created transfer data.
 */
export const createTransfer = async (transferData) => {
  try {
    const response = await axiosInstance.post("/transfer/new-transfer", transferData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch dashboard data.
 * @returns {Promise} - Resolves with the dashboard metrics.
 */
export const fetchDashboardData = async () => {
  try {
    const response = await axiosInstance.get("/dashboard/data");
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch all notifications.
 * @returns {Promise} - Resolves with the list of notifications.
 */
export const fetchNotifications = async () => {
  try {
    const response = await axiosInstance.get("/notifications/getall-notifications");
    return response.data.notifications;
  } catch (error) {
    throw error;
  }
};

/**
 * Dismiss a notification.
 * @param {string} notificationId - ID of the notification to dismiss.
 * @returns {Promise} - Resolves with the dismissed notification data.
 */
export const dismissNotification = async (notificationId) => {
  try {
    const response = await axiosInstance.delete(`/notifications/dismiss-notification/${notificationId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default axiosInstance;