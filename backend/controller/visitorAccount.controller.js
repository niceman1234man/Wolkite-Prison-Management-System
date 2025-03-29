import VisitorAccount from "../model/visitorAccount.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Register new visitor account
export const registerVisitor = async (req, res) => {
  try {
    const { firstName, middleName, lastName, email, password, phone } = req.body;

    // Check if visitor already exists
    const existingVisitor = await VisitorAccount.findOne({ email });
    if (existingVisitor) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new visitor account
    const visitor = new VisitorAccount({
      firstName,
      middleName,
      lastName,
      email,
      password: hashedPassword,
      phone,
    });

    await visitor.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: visitor._id, role: visitor.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      success: true,
      message: "Visitor account created successfully",
      data: {
        token,
        visitor: {
          id: visitor._id,
          firstName: visitor.firstName,
          lastName: visitor.lastName,
          email: visitor.email,
          role: visitor.role,
        },
      },
    });
  } catch (error) {
    console.error("Error in registerVisitor:", error);
    res.status(500).json({
      success: false,
      message: "Error creating visitor account",
      error: error.message,
    });
  }
};

// Login visitor
export const loginVisitor = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find visitor
    const visitor = await VisitorAccount.findOne({ email });
    if (!visitor) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, visitor.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login
    visitor.lastLogin = new Date();
    await visitor.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: visitor._id, role: visitor.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        visitor: {
          id: visitor._id,
          firstName: visitor.firstName,
          lastName: visitor.lastName,
          email: visitor.email,
          role: visitor.role,
        },
      },
    });
  } catch (error) {
    console.error("Error in loginVisitor:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
};

// Get visitor profile
export const getVisitorProfile = async (req, res) => {
  try {
    const visitor = await VisitorAccount.findById(req.user.id).select("-password");
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
      error: error.message,
    });
  }
};

// Update visitor profile
export const updateVisitorProfile = async (req, res) => {
  try {
    const { firstName, middleName, lastName, phone } = req.body;
    const visitor = await VisitorAccount.findById(req.user.id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    // Update fields
    visitor.firstName = firstName || visitor.firstName;
    visitor.middleName = middleName || visitor.middleName;
    visitor.lastName = lastName || visitor.lastName;
    visitor.phone = phone || visitor.phone;

    await visitor.save();

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
      error: error.message,
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const visitor = await VisitorAccount.findById(req.user.id);

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

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    visitor.password = await bcrypt.hash(newPassword, salt);

    await visitor.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error in changePassword:", error);
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: error.message,
    });
  }
}; 