import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  // Allow access to woreda routes without authentication
  if (window.location.pathname.startsWith("/woreda-dashboard")) {
    return children;
  }

  // For all other routes, require authentication
  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
