import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";
import { EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Toast configuration with closeOnClick enabled
const toastConfig = {
  duration: 3000,
  position: 'top-center',
  closeOnClick: true,
  pauseOnHover: true,
  style: {
    background: '#fff',
    color: '#333',
    padding: '12px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
};

function Register({ formData, handleChange, handleSubmit, setShowLoginModal }) {
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const firstNameRef = useRef(null);

  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'firstName':
        if (!value.trim()) newErrors.firstName = 'First name is required';
        else delete newErrors.firstName;
        break;
      case 'lastName':
        if (!value.trim()) newErrors.lastName = 'Last name is required';
        else delete newErrors.lastName;
        break;
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email';
        } else {
          delete newErrors.email;
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters long';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        } else {
          delete newErrors.password;
        }
        // Validate password match if confirmPassword exists
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else if (formData.confirmPassword) {
          delete newErrors.confirmPassword;
        }
        break;
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      case 'phone':
        if (!value.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!/^\d{10,15}$/.test(value)) {
          newErrors.phone = 'Please enter a valid phone number (10-15 digits)';
        } else {
          delete newErrors.phone;
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    Object.keys(formData).forEach(key => {
      if (key !== 'middleName') { // Skip middleName as it's optional
        validateField(key, formData[key]);
      }
    });

    // Check if there are any errors
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the errors in the form', toastConfig);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await handleSubmit(e);
      if (response?.data?.success) {
        toast.success('Account created successfully! Please login.', toastConfig);
        setShowLoginModal();
      } else {
        toast.error(response?.data?.message || 'Failed to create account', toastConfig);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'An error occurred during registration', toastConfig);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-6rem)]">
      <div className="max-w-4xl w-full mx-6 p-8 rounded-2xl bg-white/10 backdrop-blur-sm">
        <h2 className="text-4xl font-bold mb-8 text-white text-center">Create Visitor Account</h2>
        
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">First Name *</label>
              <input
                type="text"
                name="firstName"
                ref={firstNameRef}
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-3 rounded-lg bg-gray-50 text-gray-800 border ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500`}
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
            </div>

            {/* Middle Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-50 text-gray-800 border border-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-3 rounded-lg bg-gray-50 text-gray-800 border ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500`}
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-3 rounded-lg bg-gray-50 text-gray-800 border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full p-3 rounded-lg bg-gray-50 text-gray-800 border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full p-3 rounded-lg bg-gray-50 text-gray-800 border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-3 rounded-lg bg-gray-50 text-gray-800 border ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500`}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="terms"
              required
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="terms" className="text-gray-700 text-sm">
              I agree to the terms and conditions *
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || Object.keys(errors).length > 0}
            className={`w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg transition-colors duration-300 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            } ${
              Object.keys(errors).length > 0 ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>

          {/* Login Link */}
          <p className="mt-4 text-center text-gray-600">
            Already have an account?{" "}
            <button
              type="button"
              onClick={setShowLoginModal}
              className="text-teal-600 hover:text-teal-700 font-semibold"
            >
              Login here
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;