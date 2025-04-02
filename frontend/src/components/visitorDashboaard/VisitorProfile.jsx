import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { FaUser, FaSave, FaKey, FaSpinner } from "react-icons/fa";
import { updateUser } from "../../redux/userSlice";
import '../../styles/responsive.css';

function VisitorProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [fieldErrors, setFieldErrors] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    setFieldErrors({
      firstName: "",
      middleName: "",
      lastName: "",
      phone: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    
    try {
      // Get data from redux store
      if (user) {
        // Remove console logs in production
        // console.log("Using user data from Redux:", user);
        // console.log("Middle name from Redux:", user.middleName);
        
        setFormData(prev => ({
          ...prev,
          firstName: user.firstName || "",
          middleName: user.middleName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: user.phone || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        
        // Show success message when form is reset
        toast.success("Form has been reset to original values");
      } else {
        setError("No user data found. Please log in again.");
        toast.error("No user data found. Please log in again.");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load profile information");
      toast.error("Failed to load profile information");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear the error for this field when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validatePassword = () => {
    // Only validate if the user is trying to change password
    if (!formData.currentPassword && !formData.newPassword && !formData.confirmPassword) {
      return true;
    }
    
    // If any password field is filled, all must be filled
    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        setFieldErrors(prev => ({...prev, currentPassword: "Current password is required"}));
        return false;
      }
      if (!formData.newPassword) {
        setFieldErrors(prev => ({...prev, newPassword: "New password is required"}));
        return false;
      }
      if (!formData.confirmPassword) {
        setFieldErrors(prev => ({...prev, confirmPassword: "Please confirm your new password"}));
        return false;
      }
    }
    
    if (formData.newPassword && formData.newPassword.length < 8) {
      setFieldErrors(prev => ({...prev, newPassword: "Password must be at least 8 characters long"}));
      return false;
    }
    if (formData.newPassword && !/[A-Z]/.test(formData.newPassword)) {
      setFieldErrors(prev => ({...prev, newPassword: "Password must contain at least one uppercase letter"}));
      return false;
    }
    if (formData.newPassword && !/[a-z]/.test(formData.newPassword)) {
      setFieldErrors(prev => ({...prev, newPassword: "Password must contain at least one lowercase letter"}));
      return false;
    }
    if (formData.newPassword && !/[0-9]/.test(formData.newPassword)) {
      setFieldErrors(prev => ({...prev, newPassword: "Password must contain at least one number"}));
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setFieldErrors(prev => ({...prev, confirmPassword: "Passwords do not match"}));
      return false;
    }
    return true;
  };
  
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      firstName: "",
      middleName: "",
      lastName: "",
      phone: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
    
    // Validate first name
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
      isValid = false;
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
      isValid = false;
    } else if (!/^[A-Za-z\s'-]+$/.test(formData.firstName)) {
      newErrors.firstName = "First name can only contain letters, spaces, hyphens and apostrophes";
      isValid = false;
    }
    
    // Validate middle name (optional)
    if (formData.middleName && !/^[A-Za-z\s'-]+$/.test(formData.middleName)) {
      newErrors.middleName = "Middle name can only contain letters, spaces, hyphens and apostrophes";
      isValid = false;
    }
    
    // Validate last name
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
      isValid = false;
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
      isValid = false;
    } else if (!/^[A-Za-z\s'-]+$/.test(formData.lastName)) {
      newErrors.lastName = "Last name can only contain letters, spaces, hyphens and apostrophes";
      isValid = false;
    }
    
    // Validate phone number
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    } else if (!/^\+?\d{10,15}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = "Please enter a valid phone number (10-15 digits)";
      isValid = false;
    }
    
    // Set all errors at once
    setFieldErrors(newErrors);
    
    // Validate password fields if any are filled
    const isPasswordValid = validatePassword();
    
    return isValid && isPasswordValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields first
    if (!validateForm()) {
      toast.error("Please correct the errors in the form");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Check if user is trying to change password
      if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
        // Temporarily disable password changes 
        toast("Password changes require server connection. Profile information will be updated locally.", {
          icon: 'ℹ️',
          style: {
            background: '#3b82f6',
            color: '#fff',
          },
        });
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      }

      // Update profile information in Redux only
      const profileData = {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        phone: formData.phone,
      };
      
      // Update redux state
      if (user) {
        dispatch(updateUser({
          ...user,
          ...profileData
        }));
        
        // Store in localStorage to persist changes
        const updatedUser = {
          ...user,
          ...profileData
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        toast.success("Profile updated locally");
      } else {
        toast.error("No user data found. Please log in again.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile");
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Fixed Header */}
      <div className={`fixed top-0 right-0 left-0 ${isCollapsed ? 'pl-16' : 'pl-64'} bg-white z-20 shadow-md transition-all duration-300`}>
        {/* Header Section */}
        <div className="bg-white p-3 sm:p-4 mt-0 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 mt-16 w-full justify-center sm:justify-start sm:w-auto mb-3 sm:mb-0">
              <FaUser className="text-xl sm:text-2xl text-teal-600" />
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Profile Settings</h2>
            </div>
            <div className="flex flex-wrap sm:pt-12 gap-2 w-full sm:w-auto">
              <button
                onClick={fetchProfile}
                disabled={loading || saving}
                className={`flex-1 sm:flex-none text-sm bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center ${
                  (loading || saving) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Form
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area with top padding to account for fixed header */}
      <div className={`flex-1 overflow-y-auto transition-all mt-16 duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'} pt-24 sm:pt-28 p-3 md:p-6`}>
        {/* Current Form Data */}
        <div className="bg-gray-50 border border-gray-200 p-3 mb-4 sm:mb-6 mt-20 rounded-md text-xs sm:text-sm">
          <details>
            <summary className="cursor-pointer font-medium text-gray-700">Show Current Form Data</summary>
            <pre className="mt-2 bg-white p-2 rounded border overflow-auto max-h-40 text-xs">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </details>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md mb-4 text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-48 sm:h-64">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-gray-700 text-xs sm:text-sm font-bold mb-1 sm:mb-2" htmlFor="firstName">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      className={`shadow appearance-none border ${fieldErrors.firstName ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm`}
                      id="firstName"
                      type="text"
                      placeholder="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                    {fieldErrors.firstName && <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs sm:text-sm font-bold mb-1 sm:mb-2" htmlFor="middleName">
                      Middle Name
                    </label>
                    <input
                      className={`shadow appearance-none border ${fieldErrors.middleName ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm`}
                      id="middleName"
                      type="text"
                      placeholder="Middle Name"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleChange}
                    />
                    {fieldErrors.middleName && <p className="text-red-500 text-xs mt-1">{fieldErrors.middleName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-gray-700 text-xs sm:text-sm font-bold mb-1 sm:mb-2" htmlFor="lastName">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      className={`shadow appearance-none border ${fieldErrors.lastName ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm`}
                      id="lastName"
                      type="text"
                      placeholder="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                    {fieldErrors.lastName && <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs sm:text-sm font-bold mb-1 sm:mb-2" htmlFor="email">
                      Email
                    </label>
                    <input
                      className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 bg-gray-100 text-gray-600 leading-tight focus:outline-none text-sm"
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-xs sm:text-sm font-bold mb-1 sm:mb-2" htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={`shadow appearance-none border ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm`}
                    id="phone"
                    type="tel"
                    placeholder="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
                </div>

                <div className="mt-4 sm:mt-6">
                  <hr className="my-3 sm:my-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Change Password (Optional)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-gray-700 text-xs sm:text-sm font-bold mb-1 sm:mb-2" htmlFor="currentPassword">
                        Current Password
                      </label>
                      <input
                        className={`shadow appearance-none border ${fieldErrors.currentPassword ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm`}
                        id="currentPassword"
                        type="password"
                        placeholder="Current Password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                      />
                      {fieldErrors.currentPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.currentPassword}</p>}
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs sm:text-sm font-bold mb-1 sm:mb-2" htmlFor="newPassword">
                        New Password
                      </label>
                      <input
                        className={`shadow appearance-none border ${fieldErrors.newPassword ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm`}
                        id="newPassword"
                        type="password"
                        placeholder="New Password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                      />
                      {fieldErrors.newPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.newPassword}</p>}
                    </div>
                    <div className="sm:col-span-2 md:col-span-1">
                      <label className="block text-gray-700 text-xs sm:text-sm font-bold mb-1 sm:mb-2" htmlFor="confirmPassword">
                        Confirm New Password
                      </label>
                      <input
                        className={`shadow appearance-none border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm`}
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm New Password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                      {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center sm:justify-end mt-4 sm:mt-6">
                <button 
                  type="submit" 
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 sm:px-6 rounded focus:outline-none focus:shadow-outline flex items-center justify-center transition-colors duration-200 disabled:bg-teal-400 disabled:cursor-not-allowed text-sm sm:text-base"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2 text-xs sm:text-sm" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        <div className="h-16"></div> {/* Bottom spacing for mobile */}
      </div>
    </div>
  );
}

export default VisitorProfile; 