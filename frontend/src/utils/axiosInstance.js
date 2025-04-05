import axios from "axios";

const BASE_URL = "http://localhost:5001/api";

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
  // Keep these for backward compatibility
  "/visitorSchedule/schedule",
  "/visitorSchedule/schedules",
  "/visitorSchedule/schedule/",
  "/visitorSchedule/inmates",
  "/visitorSchedule/capacity",
  "/visitorSchedule/daily-visits",
  "/visitorSchedule/check-pending",
  // Add visitor routes
  "/visitor/schedule",
  "/visitor/schedule/",
  "/visitor/schedules",
  "/visitor/schedule/inmates",
  "/visitor/schedule/capacity",
  "/visitor/schedule/daily-visits",
  "/visitor/schedule/check-pending"
];

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Map old endpoints to new endpoints
    // This helps maintain backward compatibility while transitioning APIs
    const endpointMappings = {
      '/visitorSchedule/schedule': '/visitor/schedule',
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
    if (token) {
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
    const originalRequest = error.config;
    
    // Handle network errors (server not responding)
    if (error.code === "ERR_NETWORK") {
      console.error("Network Error:", error);
      throw new Error("Network error. Please check your internet connection.");
    }

    // Handle timeouts
    if (error.code === "ECONNABORTED") {
      console.error("Request timeout:", originalRequest.url);
      throw new Error("Request timeout. Please try again.");
    }

    // Handle HTTP errors
    if (error.response) {
      const { status, data } = error.response;
      console.error(`API Error (${status}):`, originalRequest.url, data);

      // Handle 401 Unauthorized - but check if it's a login attempt or token expiration
      if (status === 401) {
        // Check if this is a login attempt
        const isLoginAttempt = originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/user/login');
        
        if (isLoginAttempt) {
          // For login attempts, just return the error to be handled by the login component
          console.error(`Authentication failed for ${originalRequest.url} with email: ${originalRequest.data?.email || 'unknown'}`);
          console.error("Error response:", data);
          return Promise.reject(error);
        } else {
          // For other requests, it means the token has expired or is invalid
          console.error("Token expired or invalid, logging out user");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          
          // Check if we're in the visitor area
          if (window.location.pathname.includes('visitor-dashboard')) {
            window.location.href = "/";
          } else {
            window.location.href = "/login?session_expired=true";
          }
          return Promise.reject(error);
        }
      }

      // Handle 403 Forbidden
      if (status === 403) {
        console.error("Forbidden access to:", originalRequest.url);
        throw new Error("You don't have permission to access this resource.");
      }

      // Handle 404 Not Found
      if (status === 404) {
        console.error("Resource not found:", originalRequest.url);
        throw new Error("The requested resource was not found.");
      }

      // Handle 409 Conflict (e.g., duplicate email)
      if (status === 409) {
        throw new Error(data.message || "Resource conflict occurred.");
      }

      // Handle 500 Server Error
      if (status >= 500) {
        console.error("Server error:", status, data);
        throw new Error("Server error. Please try again later.");
      }

      // For other 4xx errors, use the server's error message if available
      if (data && data.message) {
        throw new Error(data.message);
      }
    }

    // For all other errors
    console.error("Unhandled API error:", error);
    throw new Error("An unexpected error occurred. Please try again.");
  }
);

export default axiosInstance;