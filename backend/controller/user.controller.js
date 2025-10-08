import { User } from "../model/user.model.js";
import Message from '../model/Message.js';

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from 'bcrypt'
import nodemailer from 'nodemailer'
import { logActivity, logLogin, logLogout } from "../controller/activityLog.controller.js";
import { archiveItem } from '../controllers/archive.controller.js';
dotenv.config();
export const createAccount = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      gender,
      prison,
      role,
      password, 
  
    } = req.body;
    
    const photo = req.file ? req.file.filename : 'default-avatar.png';

    if (!firstName || !email) {
      return res.status(400).json({ error: true, message: "All fields required" });
    }
    const isUser = await User.findOne({ email });
    if (isUser) {
      return res.status(400).json({ error: true, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
   
    const newUser = new User({
      firstName,
      middleName,
      lastName,
      email,
      gender,
      prison,
      role,
      photo,
      password: hashedPassword,
      passwordChanged: false, // Force password change on first login
      passwordSent: false, // Flag to indicate if password has been sent via email
     
    });

    await newUser.save();
    const accessToken = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "10h" } 
    );

    return res.status(201).json({
      error: false,
      accessToken,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};



export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: true, message: "Please fill all fields" });
    }
    const userInfo = await User.findOne({ email });
    if (!userInfo) {
      return res.status(404).json({ error: true, message: "User does not exist" });
    }
    const isMatch = await bcrypt.compare(password, userInfo.password);
    if (!isMatch) {
      // Log failed login attempt
      try {
        await logLogin(
          userInfo._id.toString(), // Convert ObjectId to string to avoid serialization issues
          req.ip,
          req.headers['user-agent'],
          'failure'
        );
      } catch (logError) {
        console.error('Error logging failed login activity:', logError);
        // Continue with login process despite logging error
      }
      
      return res.status(401).json({ error: true, message: "Invalid password" });
    }
    
    // Update user's last login timestamp and increment login count
    try {
      // Use findByIdAndUpdate to avoid validation issues with required fields
      await User.findByIdAndUpdate(
        userInfo._id,
        { 
          lastLogin: new Date(),
          $inc: { loginCount: 1 }
        },
        { 
          runValidators: false,
          new: false
        }
      );
    } catch (updateError) {
      console.error('Error updating login stats:', updateError);
      // Continue with login despite the error
    }
    
    const accessToken = jwt.sign(
      { id: userInfo._id.toString(), userId: userInfo._id.toString(), email: userInfo.email, role: userInfo.role },
      process.env.TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "2h" } 
    );

    console.log(`User ${userInfo.email} logged in with ID: ${userInfo._id}`);
    
    // Log successful login
    try {
      await logLogin(
        userInfo._id.toString(), // Convert ObjectId to string to avoid serialization issues
        req.ip,
        req.headers['user-agent'],
        'success'
      );
    } catch (logError) {
      console.error('Error logging successful login activity:', logError);
      // Continue with login process despite logging error
    }

    // After successful authentication, check for unread messages
    const unreadMessages = await Message.countDocuments({
      receiverId: userInfo._id,
      read: false
    });

    res.status(200).json({
      error: false,
      userInfo,
      accessToken,
      message: "Login successful",
      unreadMessages: unreadMessages
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};

export const getUser = async (req, res) => {
  try {
    const {id}=req.params;
    const userInfo = await User.findOne({ _id: id });
    if (!userInfo) {
      return res.status(400).json({ message: "User does not exist" });
    }

    res.status(200).json({ user: userInfo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // Get all users without filtering by role
    // This ensures that admin users are visible to visitors for messaging
    const userInfo = await User.find();

    if (!userInfo) {
      return res.status(400).json({ message: "No users found" });
    }

    console.log(`Returning ${userInfo.length} users for messaging, including admins and visitors`);
    res.status(200).json({ user: userInfo });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      middleName,
      lastName,
      email,
      prison,
      gender,
      role,
    } = req.body;
    
    // Get existing user to access current photo
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Use existing photo if no new one is uploaded
    const photo = req.file ? req.file.filename : existingUser.photo;

    if (!firstName || !email) {
      return res.status(400).json({ message: "First name and email are required" });
    }

    const updateduser = await User.findByIdAndUpdate(
      id,
      {
        firstName,
        middleName,
        lastName,
        email,
        gender,
        role,
        prison,
        photo,
      },
      { new: true }
    );

    res.status(200).json({ data: updateduser, message: "User information updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



export const updatePassword = async (req, res) => {
  try {
    const user = req.user; 
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Please confirm correctly!" });
    }
    const existingUser = await User.findById(user.userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(oldPassword, existingUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect old password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    existingUser.password = hashedPassword;
    await existingUser.save();

    res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isactivated } = req.body;
    if (isactivated === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const updateduser = await User.findByIdAndUpdate(
      id,
      { isactivated },
      { new: true }
    );

    if (!updateduser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ data: updateduser, message: "User activation status updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get existing user to access current photo
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Extract data from request
    const {
      firstName,
      middleName,
      lastName,
      email,
      gender,
      // Include any other fields you need
    } = req.body;
    
    // Use existing photo if no new one is uploaded
    const photo = req.file ? req.file.filename : existingUser.photo;
    
    // Prepare update data
    const updateData = {
      firstName,
      middleName,
      lastName,
      email,
      gender,
      photo,
      // Include any other fields you need
    };
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({
      success: true,
      data: updatedUser,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find user first to ensure it exists
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Archive the user before deletion
    try {
      await archiveItem('user', id, req.user.id, 'User deleted by admin');
      console.log(`User "${user.firstName} ${user.lastName}" archived successfully`);
    } catch (archiveError) {
      console.error("Error archiving user:", archiveError);
      // Continue with deletion even if archiving fails
    }
    
    // Delete the user
    await User.findByIdAndDelete(id);
    
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


// Function to generate a secure random password
function generatePassword() {
  const length = 10;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// Send password email route
export const sendPassword = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const newPassword = generatePassword();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password fields and set passwordSent to true
    user.password = hashedPassword;
    user.passwordChanged = false;
    user.passwordSent = true; // Flag to indicate password has been sent

    // ✅ Skip validation
    await user.save({ validateBeforeSave: false });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.USER_EMAIL,
      to: user.email,
      subject: "Your Account Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Prison Management System</h2>
          <p>Hello ${user.firstName},</p>
          <p>Your account has been created in the Prison Management System. Here are your login credentials:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Password:</strong> ${newPassword}</p>
          </div>
          <p>Please log in at <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a> and change your password immediately.</p>
          <p>For security reasons, we recommend changing this password as soon as you log in.</p>
          <p style="margin-top: 20px;">Thank you,<br>Prison Management System Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Log the password send activity
    try {
      await logActivity({
        user: userId,
        action: 'password_change',
        description: 'Password sent to user',
        resourceType: 'user',
        resourceId: userId,
        status: 'success'
      });
    } catch (logError) {
      console.error('Error logging password send activity:', logError);
    }

    return res.status(200).json({
      success: true,
      message: "Password email sent successfully",
    });

  } catch (error) {
    console.error("Error sending password email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send password email",
      error: error.message,
    });
  }
};





export const ForgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(200).json({ success: true, message: "If the email exists, a reset link will be sent." });
      }

      console.log(`Password reset requested for: ${email}`);

      // Ensure the secret is available
      if (! process.env.ACCESS_TOKEN_SECRET) {
          console.error("Access token secret is not defined.");
          return res.status(500).json({ success: false, message: "Internal server error." });
      }

      const accessToken = jwt.sign(
          { userId: user._id },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "3d" }
      );

      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.USER_EMAIL,
              pass: process.env.PASSWORD,
          },
      });

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${user._id}/${accessToken}`;
      const mailOptions = {
          from: process.env.USER_EMAIL,
          to: user.email,
          subject: 'Reset Your Password',
          text: `Click the link below to reset your password:\n\n${resetUrl}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.error("Error sending email:", error);
              return res.status(500).json({ success: false, message: "Error sending email. Please try again later." });
          }
          console.log(`Password reset email sent: ${info.response}`);
          res.status(200).json({ success: true, message: "Password reset link sent to your email." });
      });

  } catch (error) {
      console.error("Internal server error:", error);
      res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
  }
};
export const ResetPassword = async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;
   console.log("id of :",id);
   console.log("token :",token);
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decoded.userId !== id) {
      return res.status(400).json({ success: false, message: "Invalid token or user ID mismatch." });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ success: false, message: "Invalid token." });
    }

    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: "User ID is required for logout" 
      });
    }

    console.log(`Processing logout for user ID: ${userId}`);

    // Log the logout activity
    try {
      const logResult = await logLogout(
        userId.toString(),
        req.ip,
        req.headers['user-agent']
      );
      console.log(`User with ID ${userId} logged out successfully. Log ID: ${logResult?._id || 'No log created'}`);
    } catch (logError) {
      console.error('Error logging logout activity:', logError);
      // Continue with logout despite logging error
    }

    res.status(200).json({
      success: true,
      message: "Logout successful and activity logged"
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error processing logout" 
    });
  }
};