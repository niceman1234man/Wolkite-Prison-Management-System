import VisitorAccount from "../model/visitorAccount.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

// Utility function to generate JWT token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "24h" }
  );
};

// Register new visitor account
export const registerVisitor = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const { firstName, middleName, lastName, email, password, phone } = req.body;

    // Check if visitor already exists
    const existingVisitor = await VisitorAccount.findOne({ email });
    if (existingVisitor) {
      return res.status(409).json({  // 409 Conflict is more appropriate
        success: false,
        message: "Email already registered",
      });
    }

    // Create new visitor account
    const visitor = await VisitorAccount.create({
      firstName,
      middleName,
      lastName,
      email,
      password, // Password will be hashed by pre-save hook in model
      phone,
      role: "visitor",
    });

    // Generate JWT token
    const token = generateToken(visitor._id, visitor.role);

    // Set secure HTTP-only cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Omit sensitive data from response
    const visitorData = {
      id: visitor._id,
      firstName: visitor.firstName,
      lastName: visitor.lastName,
      email: visitor.email,
      phone: visitor.phone,
      role: visitor.role,
      createdAt: visitor.createdAt,
    };

    res.status(201).json({
      success: true,
      message: "Visitor account created successfully",
      data: visitorData,
      token, // Also send token in response for mobile clients
    });
  } catch (error) {
    console.error("Error in registerVisitor:", error);
    res.status(500).json({
      success: false,
      message: "Error creating visitor account",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Login visitor
export const loginVisitor = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const { email, password } = req.body;

    // Find visitor and select password field explicitly
    const visitor = await VisitorAccount.findOne({ email }).select("+password");
    if (!visitor) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials", // Generic message for security
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, visitor.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    visitor.lastLogin = new Date();
    await visitor.save();

    // Generate JWT token
    const token = generateToken(visitor._id, visitor.role);

    // Set secure HTTP-only cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Omit sensitive data from response
    const visitorData = {
      id: visitor._id,
      firstName: visitor.firstName,
      lastName: visitor.lastName,
      email: visitor.email,
      phone: visitor.phone,
      role: visitor.role,
      lastLogin: visitor.lastLogin,
    };

    res.json({
      success: true,
      message: "Login successful",
      data: visitorData,
      token, // Also send token in response for mobile clients
    });
  } catch (error) {
    console.error("Error in loginVisitor:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get visitor profile
export const getVisitorProfile = async (req, res) => {
  try {
    const visitor = await VisitorAccount.findById(req.user.id).select("-password -__v");
    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    res.json({
      success: true,
      data: visitor,
    });
  } catch (error) {
    console.error("Error in getVisitorProfile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching visitor profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update visitor profile
export const updateVisitorProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const { firstName, middleName, lastName, email, phone } = req.body;
    
    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (middleName !== undefined) updates.middleName = middleName;
    if (lastName) updates.lastName = lastName;
    if (phone) updates.phone = phone;
    
    // If email is being updated, check if it's already in use
    if (email) {
      // First get the current user to check if email is actually changing
      const currentUser = await VisitorAccount.findById(req.user.id);
      if (currentUser.email !== email) {
        // Check if email is already in use by another account
        const existingUser = await VisitorAccount.findOne({ email, _id: { $ne: req.user.id } });
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: "Email already in use",
            field: "email"
          });
        }
        // If email is not in use, add it to updates
        updates.email = email;
      }
    }

    const visitor = await VisitorAccount.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: visitor,
    });
  } catch (error) {
    console.error("Error in updateVisitorProfile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    const visitor = await VisitorAccount.findById(req.user.id).select("+password");

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, visitor.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password (hashing will be handled by pre-save hook)
    visitor.password = newPassword;
    await visitor.save();

    // Generate new token
    const token = generateToken(visitor._id, visitor.role);

    // Update cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Password changed successfully",
      token,
    });
  } catch (error) {
    console.error("Error in changePassword:", error);
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Logout visitor
export const logoutVisitor = async (req, res) => {
  try {
    // Clear the HTTP-only cookie
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error in logoutVisitor:", error);
    res.status(500).json({
      success: false,
      message: "Error logging out",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Find user by email
    const visitor = await VisitorAccount.findOne({ email });
    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "No account found with that email",
      });
    }

    // 2. Generate reset token
    const resetToken = visitor.createPasswordResetToken();
    await visitor.save({ validateBeforeSave: false });

    // 3. Send email with reset token (implementation depends on your email service)
    // For now, we'll just return the token (in production, send via email)
    res.status(200).json({
      success: true,
      message: "Password reset token sent to email",
      token: resetToken, // Remove this in production - only for testing
    });

  } catch (error) {
    // Reset token and expiry if error occurs
    visitor.passwordResetToken = undefined;
    visitor.passwordResetExpires = undefined;
    await visitor.save({ validateBeforeSave: false });

    console.error("Error in forgotPassword:", error);
    res.status(500).json({
      success: false,
      message: "Error processing password reset",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // 1. Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // 2. Find user by token and check expiry
    const visitor = await VisitorAccount.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!visitor) {
      return res.status(400).json({
        success: false,
        message: "Token is invalid or has expired",
      });
    }

    // 3. Update password
    visitor.password = password;
    visitor.passwordResetToken = undefined;
    visitor.passwordResetExpires = undefined;
    visitor.passwordChangedAt = Date.now();
    await visitor.save();

    // 4. Log the user in (optional)
    const authToken = jwt.sign(
      { id: visitor._id, role: visitor.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
      token: authToken,
    });

  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};







