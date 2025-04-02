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
  "/visitor/schedule/schedule",
  "/visitor/schedule/schedules",
  "/visitor/schedule/schedule/"
];

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const isPublicRoute = PUBLIC_ROUTES.some(route => {
      // Handle both full paths and relative paths
      const requestUrl = config.url.startsWith('http') ? 
        new URL(config.url).pathname : 
        config.url;
      return requestUrl.includes(route);
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