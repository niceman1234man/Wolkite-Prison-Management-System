import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token"); // Check if token exists
  const location = useLocation();
  
  // If no token, redirect to login with the current path as the redirect URL
  if (!token) {
    const redirectUrl = `/login?redirect=${encodeURIComponent(location.pathname)}`;
    return <Navigate to={redirectUrl} replace />;
  }

  // If there are allowedRoles, check if the user has the required role
  if (allowedRoles) {
    try {
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem("user"));
      
      if (!userData || !userData.role) {
        console.error("User data or role not found");
        return <Navigate to="/login" replace />;
      }
      
      const userRole = userData.role.toLowerCase().replace('-', '');
      
      // Check if the user's role is included in the allowed roles
      const hasPermission = allowedRoles.some(role => 
        userRole === role || 
        userRole === role.toLowerCase() ||
        userRole === role.toLowerCase().replace('-', '')
      );
      
      if (!hasPermission) {
        console.log("User role not authorized: ", userRole, allowedRoles);
        return <Navigate to="/admin-dashboard" replace />;
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      return <Navigate to="/login" replace />;
    }
  }

  // If children are provided, return them, otherwise return the Outlet
  return children || <Outlet />;
};

export default PrivateRoute;
