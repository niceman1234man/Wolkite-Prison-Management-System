import jwt from "jsonwebtoken";
import VisitorAccount from "../model/visitorAccount.model.js";

// Main authentication middleware
const protect = async (req, res, next) => {
  try {
    // 1. Get token from header or cookie
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authorized - no token provided"
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check if user exists
    const currentUser = await VisitorAccount.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        error: "User belonging to this token no longer exists"
      });
    }

    // 4. Check if user changed password after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        error: "Password recently changed - please log in again"
      });
    }

    // Grant access
    req.user = currentUser;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({
      success: false,
      error: "Not authorized - invalid token"
    });
  }
};

// Role-based authorization middleware
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to perform this action"
      });
    }
    next();
  };
};

// Named exports
export { protect, restrictTo };