import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const PrivateRoute = () => {
  const token = localStorage.getItem("token"); // Check if token exists
  const location = useLocation();
  
  // If no token, redirect to login with the current path as the redirect URL
  if (!token) {
    const redirectUrl = `/login?redirect=${encodeURIComponent(location.pathname)}`;
    return <Navigate to={redirectUrl} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
