import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import { TiArrowBack } from "react-icons/ti";
import { FaLock, FaUnlock, FaEye, FaEyeSlash, FaCheckCircle, FaExclamationTriangle, FaShieldAlt, FaSpinner } from "react-icons/fa";

const SettingsPage = () => {
  const navigate = useNavigate();
  // const { user } = useAuth();
  const [setting, setSetting] = useState({
    // userId: user ? user._id : "",  // Ensure user is not undefined
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSetting({ ...setting, [name]: value });
    
    // Clear error when typing
    if (error) setError("");
    
    // Check password strength if newPassword field
    if (name === "newPassword") {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    // Simple password strength measurement
    let score = 0;
    let message = "";

    if (!password) {
      setPasswordStrength({ score: 0, message: "" });
      return;
    }

    // Length check
    if (password.length >= 8) score += 1;
    
    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;
    
    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;
    
    // Number check
    if (/[0-9]/.test(password)) score += 1;
    
    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 0:
      case 1:
        message = "Very Weak";
        break;
      case 2:
        message = "Weak";
        break;
      case 3:
        message = "Moderate";
        break;
      case 4:
        message = "Strong";
        break;
      case 5:
        message = "Very Strong";
        break;
      default:
        message = "";
    }

    setPasswordStrength({ score, message });
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-orange-500";
      case 3:
        return "bg-yellow-500";
      case 4:
        return "bg-green-400";
      case 5:
        return "bg-green-600";
      default:
        return "bg-gray-200";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (setting.newPassword !== setting.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (!setting.oldPassword || !setting.newPassword || !setting.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    // Additional validation
    if (setting.newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized: Please log in again.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await axiosInstance.put(
        "/user/update-password",
        setting,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
        toast.success("Password Changed Successfully!");
        setSetting({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        // Reset password strength
        setPasswordStrength({ score: 0, message: "" });
      } else {
        setError(response.data.error || "An error occurred");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setError(error.response?.data?.error || "Unauthorized request");
    } finally {
      setLoading(false);
    }
  };

  // if (!user) return <div>Loading...</div>;  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 mt-20">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="mr-4 bg-white bg-opacity-20 p-2 rounded-full text-white hover:bg-opacity-30 transition duration-200"
            >
              <TiArrowBack size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <FaShieldAlt className="mr-2" /> Security Settings
              </h2>
              <p className="text-teal-100 text-sm">Change your account password</p>
            </div>
          </div>
        </div>
        
        {/* Form Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded-md flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-6 p-3 bg-green-50 border-l-4 border-green-500 rounded-md flex items-center">
              <FaCheckCircle className="text-green-500 mr-2" />
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Old Password */}
            <div className="mb-6">
              <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type={showOldPassword ? "text" : "password"}
                  name="oldPassword"
                  id="oldPassword"
                  placeholder="Enter your current password"
                  value={setting.oldPassword}
                  onChange={handleChange}
                  className="pl-10 pr-10 py-2.5 block w-full border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  {showOldPassword ? (
                    <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FaEye className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Separator */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">New Password</span>
              </div>
            </div>

            {/* New Password */}
            <div className="mb-5">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUnlock className="text-gray-400" />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  id="newPassword"
                  placeholder="Create a new password"
                  value={setting.newPassword}
                  onChange={handleChange}
                  className="pl-10 pr-10 py-2.5 block w-full border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FaEye className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>

              {/* Password Strength Meter */}
              {setting.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`} 
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs ml-2 font-medium ${
                      passwordStrength.score <= 2 ? 'text-red-500' : 
                      passwordStrength.score === 3 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {passwordStrength.message}
                    </span>
                  </div>
                  <ul className="text-xs text-gray-500 mt-1 space-y-1">
                    <li className={`flex items-center ${setting.newPassword.length >= 8 ? 'text-green-500' : ''}`}>
                      <span className="mr-1">{setting.newPassword.length >= 8 ? '✓' : '○'}</span> At least 8 characters
                    </li>
                    <li className={`flex items-center ${/[A-Z]/.test(setting.newPassword) ? 'text-green-500' : ''}`}>
                      <span className="mr-1">{/[A-Z]/.test(setting.newPassword) ? '✓' : '○'}</span> At least one uppercase letter
                    </li>
                    <li className={`flex items-center ${/[0-9]/.test(setting.newPassword) ? 'text-green-500' : ''}`}>
                      <span className="mr-1">{/[0-9]/.test(setting.newPassword) ? '✓' : '○'}</span> At least one number
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  id="confirmPassword"
                  placeholder="Confirm your new password"
                  value={setting.confirmPassword}
                  onChange={handleChange}
                  className={`pl-10 pr-10 py-2.5 block w-full border ${
                    setting.confirmPassword && setting.newPassword !== setting.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md focus:ring-teal-500 focus:border-teal-500`}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FaEye className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {setting.confirmPassword && setting.newPassword !== setting.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                className={`w-full py-2.5 px-4 rounded-md text-white font-medium flex items-center justify-center transition duration-200 ${
                  !setting.newPassword || !setting.oldPassword || !setting.confirmPassword || loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-700"
                }`}
                disabled={!setting.newPassword || !setting.oldPassword || !setting.confirmPassword || loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <FaLock className="mr-2" />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </form>
          
          {/* Security Note */}
          <div className="mt-6 p-3 bg-blue-50 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>Security Tip:</strong> Choose a strong, unique password that you don't use for other accounts. 
              Consider using a password manager to keep track of your passwords securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
