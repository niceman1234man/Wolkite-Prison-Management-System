import axios from "axios";

const BASE_URL = "http://localhost:5001/api";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Only skip authentication for public routes
    const publicRoutes = ["/user/login", "/user/register"];
    const isPublicRoute = publicRoutes.some((route) =>
      config.url.startsWith(route)
    );

    console.log("Request URL:", config.url);
    console.log("Is public route:", isPublicRoute);

    if (!isPublicRoute) {
      const token = localStorage.getItem("token");
      console.log("Token found:", !!token);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("Authorization header set:", config.headers.Authorization);
      } else {
        console.log("No token found in localStorage");
      }
    }

    // Handle FormData
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
      config.timeout = 60000;
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Response error:", error);
    console.error("Response error details:", {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });

    // Handle 401 for all routes except public ones
    if (
      error.response?.status === 401 &&
      !error.config.url.startsWith("/user/login") &&
      !error.config.url.startsWith("/user/register")
    ) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
