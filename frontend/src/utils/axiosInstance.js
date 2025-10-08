import axios from "axios";

const BASE_URL = "https://wolkite-prison-management-system.onrender.com/api";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable credentials for cross-origin requests
});

// List of public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/auth/login",
  "/user/login",
  "/auth/register",
  "/auth/schedule",
  "/managemessages/get-messages",
  "/manageimages/get-side-images",
  "/inmates/allInmates",
  // Visitor schedule routes
  "/visitor/schedule/schedules",
  "/visitor/schedule/inmates",
  "/visitor/schedule/capacity",
  "/visitor/schedule/daily-visits",
  "/visitor/schedule/check-pending",
  // Backup routes
  "/backup/history",
  "/backup/create",
  "/backup/restore",
  "/backup/download",
  "/backup/schedule"
];

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Map old endpoints to new endpoints
    const endpointMappings = {
      '/visitorSchedule/schedules': '/visitor/schedule/schedules',
      '/visitorSchedule/inmates': '/visitor/schedule/inmates',
      '/visitorSchedule/capacity': '/visitor/schedule/capacity',
      '/visitorSchedule/daily-visits': '/visitor/schedule/daily-visits',
      '/visitorSchedule/check-pending': '/visitor/schedule/check-pending'
    };
    
    // Check if the current URL matches any old endpoint pattern
    const currentPath = config.url.replace(/\?.*$/, ''); // Remove query parameters for matching
    if (endpointMappings[currentPath]) {
      console.log(`Remapping old endpoint ${currentPath} to ${endpointMappings[currentPath]}`);
      
      // Keep the query parameters if any
      const queryString = config.url.includes('?') ? config.url.substring(config.url.indexOf('?')) : '';
      config.url = endpointMappings[currentPath] + queryString;
    }

    // Log all request URLs for debugging
    console.log(`Making API request to: ${config.url}`);
    
    const isPublicRoute = PUBLIC_ROUTES.some(route => {
      // Handle both full paths and relative paths
      const requestUrl = config.url.startsWith('http') ? 
        new URL(config.url).pathname : 
        config.url;
      // Use more flexible matching to handle subtle differences in endpoints
      return PUBLIC_ROUTES.some(route => requestUrl.includes(route));
    });
    
    // Special logging for login attempts
    if (config.url.includes('/auth/login') || config.url.includes('/user/login')) {
      console.log(`Making ${config.url} request with payload:`, 
        { ...config.data, password: config.data.password ? '***' : undefined });
    }

    // Always add token if available, regardless of route
    const token = localStorage.getItem("token");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Added authorization token to request");
    } else {
      console.log("No token available, proceeding without authorization");
    }

    // Special handling for VisitorSchedule routes
    if (config.url.includes('visitor/schedule') || config.url.includes('visitorSchedule')) {
      // Try to get user ID from localStorage
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          const userId = userData.id || userData._id;
          
          // For GET requests, add userId as query param
          if (config.method === 'get') {
            config.params = {
              ...config.params,
              userId: userId
            };
          }
          
          console.log("Added user ID to visitor schedule request:", userId);
        }
      } catch (err) {
        console.error('Error adding user ID to schedule request:', err);
      }
    }

    // Special handling for message-related endpoints that need userId
    if (config.url.includes('/messages')) {
      // Check specifically for the message send endpoint
      const isMessageSendEndpoint = config.url.includes('/messages/send');
      
      // Get the user from localStorage to ensure it's always available
      try {
        if (isMessageSendEndpoint) {
          console.log("Processing message send request...");
          
          // For FormData requests (message with attachments)
          if (config.data instanceof FormData) {
            // Check if senderId is already included
            let hasSenderId = false;
            for (let pair of config.data.entries()) {
              if (pair[0] === 'senderId') {
                hasSenderId = true;
                console.log("Found senderId in FormData:", pair[1]);
                break;
              }
            }
            
            // Add senderId to FormData if not present
            if (!hasSenderId) {
              const userStr = localStorage.getItem('user');
              if (userStr) {
                try {
                  const userData = JSON.parse(userStr);
                  const senderId = userData._id || userData.id;
                  
                  if (senderId) {
                    console.log("Adding senderId to FormData:", senderId);
                    config.data.append('senderId', senderId);
                  } else {
                    console.error("Failed to get senderId from user data", userData);
                  }
                } catch (e) {
                  console.error("Error parsing user data for message senderId:", e);
                }
              }
            }
          } 
          // For JSON requests
          else if (config.data && typeof config.data === 'object') {
            // Check if senderId is included
            if (!config.data.senderId) {
              const userStr = localStorage.getItem('user');
              if (userStr) {
                try {
                  const userData = JSON.parse(userStr);
                  const senderId = userData._id || userData.id;
                  
                  if (senderId) {
                    console.log("Adding senderId to JSON payload:", senderId);
                    config.data.senderId = senderId;
                  }
                } catch (e) {
                  console.error("Error parsing user data for message senderId:", e);
                }
              }
            }
          }
        } 
        else {
          // For other message-related endpoints
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const userData = JSON.parse(userStr);
            const userId = userData._id || userData.id;
            
            if (!userId) {
              console.warn('No user ID found in localStorage for messages endpoint');
            } else {
              // For GET requests, add userId as query param
              if (config.method === 'get') {
                config.params = {
                  ...config.params,
                  currentUserId: userId,
                  userId: userId
                };
              } 
              // For POST requests, include userId in the body
              else if (config.method === 'post') {
                if (typeof config.data === 'object' && config.data !== null) {
                  config.data = {
                    ...config.data,
                    userId: userId
                  };
                } else {
                  config.data = { userId: userId };
                }
              }
            }
          } else {
            console.warn('No user data found in localStorage for messages endpoint');
          }
        }
      } catch (err) {
        console.error('Error processing message request:', err);
      }
    }

    // Special handling for FormData
    if (config.data instanceof FormData) {
      // Remove the default Content-Type header for FormData
      delete config.headers["Content-Type"];
      config.timeout = 60000; // Longer timeout for file uploads
      
      // Log FormData contents for debugging
      const formDataContent = {};
      config.data.forEach((value, key) => {
        // Don't log file contents
        if (value instanceof File) {
          formDataContent[key] = `[File: ${value.name}, ${value.size} bytes]`;
        } else {
          formDataContent[key] = value;
        }
      });
      console.log("FormData content:", formDataContent);
      
      // Check for required fields in FormData
      const requiredFields = ['firstName', 'lastName', 'gender', 'birthDate', 'caseType', 'startDate', 'sentenceYear'];
      if (config.url.includes('/update-inmate/')) {
        const missingFields = requiredFields.filter(field => !config.data.get(field));
        if (missingFields.length > 0) {
          console.warn("FormData missing required fields:", missingFields);
        }
      }
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Special handling for login responses
    if (response.config.url.includes('/auth/login') || response.config.url.includes('/user/login')) {
      console.log(`Login success for ${response.config.url}:`, response.status);
      console.log("Response data structure:", Object.keys(response.data));
      
      // Log token presence (without revealing the actual token)
      if (response.data.token) {
        console.log("Visitor token received ✓");
      } else if (response.data.accessToken) {
        console.log("Staff token received ✓");
      } else {
        console.warn("No token found in response!");
      }
    }
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (!response) {
      console.error("Network error or server not responding");
      return Promise.reject(new Error("Network error. Please check your connection and try again."));
    }
    
    const status = response.status;
    const data = response.data;
    
    console.log(`API Error (${status}):`, response.config.url, data);
    
    // Handle specific error status codes
    switch (status) {
      case 400:
        // Bad request, usually validation error
        console.error("Bad request:", data);
        return Promise.reject(error);
        
      case 401:
        // Unauthorized, expired token or not authenticated
        console.error("Unauthorized:", data);
        // Redirect to login if needed
        // window.location.href = "/login";
        return Promise.reject(error);
        
      case 403:
        // Forbidden, authenticated but not allowed
        console.error("Forbidden:", data);
        return Promise.reject(error);
        
      case 404:
        // Not found
        console.error("Not found:", data);
        return Promise.reject(error);
        
      case 500:
        // Server error, log additional info for debugging
        console.error("Server error:", status, data);
        
        // For 500 errors, try to provide more informative error
        let errorMessage = "Server error. Please try again later.";
        if (data && data.error) {
          errorMessage = data.error;
        } else if (data && data.message) {
          errorMessage = data.message;
        } else if (typeof data === "string") {
          errorMessage = data;
        }
        
        // Create a custom error with more details
        const customError = new Error(errorMessage);
        customError.status = status;
        customError.originalError = error;
        customError.serverData = data;
        
        return Promise.reject(customError);
        
      default:
        // Generic error handling
        console.error("Unhandled error:", status, data);
        return Promise.reject(error);
    }
  }
);

// Add these utility functions
axiosInstance.updatePrisonPopulation = async (prisonId, change) => {
  if (!prisonId) {
    console.error("No prison ID provided for population update");
    return { success: false, error: "No prison ID provided" };
  }

  try {
    console.log(`Updating prison ${prisonId} population by ${change}`);
    
    const endpoint = change >= 0 
      ? "/prison/increment-population"
      : "/prison/decrement-population";
    
    const payload = change >= 0
      ? { prisonId, increment: Math.abs(change) }
      : { prisonId, decrement: Math.abs(change) };
    
    console.log(`Using endpoint ${endpoint} with payload:`, payload);
    
    const response = await axiosInstance.post(endpoint, payload);
    
    // Log response for debugging
    console.log(`Prison population update response:`, response.data);
    
    // Dispatch an event to notify components about the population change
    if (response.data?.success) {
      console.log(`Successfully updated prison ${prisonId} population by ${change}`);
      window.dispatchEvent(new Event('prisonPopulationChanged'));
    } else {
      console.error(`Failed to update prison ${prisonId} population:`, response.data?.error || 'Unknown error');
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error updating prison ${prisonId} population by ${change}:`, error);
    console.error("Error details:", error.response?.data || error.message);
    
    return {
      success: false,
      error: error.response?.data?.error || error.message || "Failed to update prison population"
    };
  }
};

// For transferring inmate between prisons and updating the population counts
axiosInstance.transferInmateBetweenPrisons = async (fromPrisonId, toPrisonId) => {
  if (!fromPrisonId || !toPrisonId) {
    console.error("Both source and destination prison IDs are required");
    return { success: false, error: "Both source and destination prison IDs are required" };
  }

  try {
    // Decrement the source prison population
    const decrementResponse = await axiosInstance.updatePrisonPopulation(fromPrisonId, -1);
    if (!decrementResponse.success) {
      return decrementResponse;
    }

    // Increment the destination prison population
    const incrementResponse = await axiosInstance.updatePrisonPopulation(toPrisonId, 1);
    if (!incrementResponse.success) {
      // Try to revert the decrement operation
      await axiosInstance.updatePrisonPopulation(fromPrisonId, 1);
      return incrementResponse;
    }

    // Dispatch event for prison population changes
    window.dispatchEvent(new Event('prisonPopulationChanged'));
    
    return {
      success: true,
      message: "Inmate transferred between prisons successfully"
    };
  } catch (error) {
    console.error("Error transferring inmate between prisons:", error);
    return {
      success: false,
      error: error.message || "Failed to transfer inmate between prisons"
    };
  }
};

export default axiosInstance;