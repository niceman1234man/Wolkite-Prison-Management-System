import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";
import { EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import FaceCapture from "../FaceCapture";
import SimpleFaceCapture from "../SimpleFaceCapture";

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
  const [faceData, setFaceData] = useState(null);
  const [isFaceChecking, setIsFaceChecking] = useState(false);
  const [faceRegistrationComplete, setFaceRegistrationComplete] = useState(false);
  const [useFallbackCapture, setUseFallbackCapture] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isFaceCaptureVisible, setIsFaceCaptureVisible] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [faceImage, setFaceImage] = useState(null);
  const [hasRegisteredFace, setHasRegisteredFace] = useState(false);

  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  // Add useEffect for cleanup and add forceStopCamera function

  // Force stop any running camera when component unmounts or registration completes
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      // Force stop any camera streams that might be active
      forceStopCamera();
    };
  }, []);

  // Also cleanup when face registration is complete
  useEffect(() => {
    if (faceRegistrationComplete) {
      // If the face registration is complete, force stop any camera 
      forceStopCamera();
    }
  }, [faceRegistrationComplete]);

  // Function to force stop any camera streams
  const forceStopCamera = () => {
    // Get all video streams and stop them
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        console.log("All camera streams have been forcibly stopped");
      })
      .catch((err) => {
        console.log("No active camera to stop");
      });
  };

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

  // Handle face detection error by switching to fallback capture
  const handleFaceError = (error) => {
    console.error("Face detection error:", error);
    toast.error(`Face detection failed. Using simplified capture instead.`, toastConfig);
    setUseFallbackCapture(true);
  };

  // Handle detected face from FaceCapture component
  const handleFaceDetected = async (faceData) => {
    console.log("Face detected:", faceData);
    
    // Check liveness detection result
    if (!faceData.isLive) {
      setError('Liveness check failed. Please ensure you are a real person, not a photo.');
      toast.error('Liveness check failed. Please ensure you are a real person.');
      return;
    }
    
    // Close face capture modal
    setIsFaceCaptureVisible(false);
    
    // Store face descriptor
    setFaceDescriptor(Array.from(faceData.descriptor));
    setFaceImage(faceData.imageSrc);
    
    // Set state to show face has been registered
    setHasRegisteredFace(true);
    
    // Make sure camera is stopped
    forceStopCamera();
    
    // Show success message
    toast.success('Face registered successfully!');
  };

  // Handle photos from SimpleFaceCapture (fallback without face recognition)
  const handlePhotoCapture = (photos) => {
    if (!photos || photos.length < 3) {
      toast.error('Failed to capture all required photos', toastConfig);
      return;
    }
    
    setCapturedPhotos(photos);
    setFaceRegistrationComplete(true);
    toast.success('Photos captured successfully!', toastConfig);
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

    // Check if face data is captured (using either method)
    if (!useFallbackCapture && !faceData) {
      toast.error('Please complete face registration before submitting', toastConfig);
      return;
    }
    
    if (useFallbackCapture && capturedPhotos.length < 3) {
      toast.error('Please capture all required photos before submitting', toastConfig);
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a new FormData object with face/photo data
      const formDataWithFace = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        formDataWithFace.append(key, formData[key]);
      });
      
      if (useFallbackCapture) {
        // Add photos from simple capture
        for (let i = 0; i < capturedPhotos.length; i++) {
          const base64Response = await fetch(capturedPhotos[i]);
          const blob = await base64Response.blob();
          formDataWithFace.append(`facePhoto${i+1}`, blob, `face-photo-${i+1}.jpg`);
        }
      } else {
        // Add face data
        formDataWithFace.append('faceDescriptor', JSON.stringify(faceData.descriptor));
        
        // Convert base64 image to Blob and append
        if (faceData.image) {
          const base64Response = await fetch(faceData.image);
          const blob = await base64Response.blob();
          formDataWithFace.append('faceImage', blob, 'face-image.jpg');
        }
      }
      
      // Submit with face data
      const response = await axiosInstance.post('/user/register', formDataWithFace, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        toast.success('Account created successfully! Please login.', toastConfig);
        setShowLoginModal();
      } else {
        toast.error(response.data.message || 'Failed to create account', toastConfig);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'An error occurred during registration', toastConfig);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-6rem)] py-12">
      <div className="max-w-4xl w-full mx-auto px-6 py-10 rounded-2xl bg-white shadow-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2 text-gray-800">Create Your Account</h2>
          <p className="text-gray-600">Join our community and manage your experience</p>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="firstName"
                ref={firstNameRef}
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-3 rounded-lg bg-gray-50 text-gray-800 border ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors`}
              />
              {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
            </div>

            {/* Middle Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-50 text-gray-800 border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Last Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-3 rounded-lg bg-gray-50 text-gray-800 border ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors`}
              />
              {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-3 rounded-lg bg-gray-50 text-gray-800 border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors`}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full p-3 pl-4 pr-10 rounded-lg bg-gray-50 text-gray-800 border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors`}
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              <div className="text-xs text-gray-500 mt-1">
                Must contain at least 8 characters, including uppercase, lowercase, and numbers
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full p-3 pl-4 pr-10 rounded-lg bg-gray-50 text-gray-800 border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors`}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:outline-none"
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
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-3 rounded-lg bg-gray-50 text-gray-800 border ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors`}
                placeholder="Enter your phone number"
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>
            
            {/* Face Registration */}
            <div className="col-span-1 md:col-span-2 bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 rounded-full p-2 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Face Registration <span className="text-red-500">*</span></h3>
              </div>
              
              <p className="mb-5 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                To ensure each visitor has only one account and enhance security, we need to register your face. This helps with faster authentication in the future.
              </p>
              
              {faceRegistrationComplete ? (
                <div className="flex items-center justify-center flex-col bg-green-50 p-5 rounded-lg border border-green-200">
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-3 border-4 border-green-300 shadow-lg">
                    {useFallbackCapture ? (
                      capturedPhotos.length > 0 && (
                        <img 
                          src={capturedPhotos[0]} 
                          alt="Registered Face" 
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      faceData?.image && (
                        <img 
                          src={faceData.image} 
                          alt="Registered Face" 
                          className="w-full h-full object-cover"
                        />
                      )
                    )}
                  </div>
                  <div className="flex items-center text-green-700 font-medium mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Face successfully registered!
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setFaceData(null);
                      setCapturedPhotos([]);
                      setFaceRegistrationComplete(false);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Re-capture face
                  </button>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {useFallbackCapture ? (
                    <SimpleFaceCapture 
                      onPhotoCapture={handlePhotoCapture}
                      onCancel={() => setUseFallbackCapture(false)}
                    />
                  ) : (
                    <FaceCapture 
                      onFaceDetected={handleFaceDetected}
                      onError={handleFaceError}
                    />
                  )}
                </div>
              )}
              
              {isFaceChecking && (
                <div className="mt-3 flex items-center justify-center bg-gray-50 p-2 rounded-lg">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Checking for duplicate faces...</span>
                </div>
              )}
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3 mt-6 bg-gray-50 p-4 rounded-lg">
            <input
              type="checkbox"
              id="terms"
              required
              className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <label htmlFor="terms" className="text-gray-700 font-medium">
                I agree to the Terms and Conditions <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                By creating an account, you agree to our <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and acknowledge our <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || Object.keys(errors).length > 0 || !faceRegistrationComplete}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-6 rounded-xl shadow-md transition-all duration-300 font-medium text-base ${
                isSubmitting || Object.keys(errors).length > 0 || !faceRegistrationComplete
                ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Your Account...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                  Create Account
                </span>
              )}
            </button>
            
            {/* Registration button status explanation */}
            {(Object.keys(errors).length > 0 || !faceRegistrationComplete) && (
              <div className="mt-2 text-center">
                <p className="text-xs text-amber-600 bg-amber-50 py-1.5 px-3 rounded-lg inline-block">
                  {!faceRegistrationComplete 
                    ? "Please complete face registration to continue" 
                    : "Please fix form errors to continue"}
                </p>
              </div>
            )}
          </div>

          {/* Login Link */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 mb-2">Already have an account?</p>
            <button
              type="button"
              onClick={setShowLoginModal}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center justify-center mx-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Login Instead
            </button>
          </div>
          
          {/* Security Notice */}
          <div className="mt-8 text-center text-xs text-gray-500 flex items-center justify-center space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Your data is secure and encrypted</span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;