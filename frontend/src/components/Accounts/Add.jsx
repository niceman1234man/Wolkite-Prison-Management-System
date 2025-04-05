import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import { useNavigate } from "react-router-dom";
import { TiArrowBack } from "react-icons/ti";
import { validateUserForm } from "../../utils/formValidation";
import { 
  FaUser, FaEnvelope, FaLock, FaUserTag, FaBuilding, 
  FaIdCard, FaUserPlus, FaUpload, FaSpinner, FaMars, FaVenus
} from "react-icons/fa";

const AddUser = ({setOpen}) => {
  const [photo, setPhoto] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prisons, setPrisons] = useState([]);
  const [activeTab, setActiveTab] = useState("basic");

  // Initial user state
  const initialUser = {
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    gender: "",
    role: "",
    password: "",
    prison: "",
  };

  const [user, setUsers] = useState(initialUser);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUsers({ ...user, [name]: value });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchPrisons = async () => {
    try {
      const response = await axiosInstance.get("/prison/getall-prisons");
      if (response.data?.success) {
        setPrisons(response.data.prisons);
      }
    } catch (error) {
      console.error("Error fetching prisons:", error);
      toast.error("Failed to fetch prison data");
    } 
  };

  useEffect(() => {
    fetchPrisons();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateUserForm(user);
    setErrors(validationErrors);
    
    // Check if there are any errors
    if (Object.keys(validationErrors).length > 0) {
      // Display error toast for the first error
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError);
      return;
    }
    
    setIsSubmitting(true);
  
    const formData = new FormData();
    formData.append("firstName", user.firstName);
    formData.append("middleName", user.middleName || "");
    formData.append("lastName", user.lastName);
    formData.append("email", user.email);
    formData.append("role", user.role);
    formData.append("gender", user.gender);
    formData.append("password", user.password);
    formData.append("prison", user.prison);
    
    if (photo) {
    formData.append("photo", photo);
    }
  
    try {
      const response = await axiosInstance.post("/user/create-account", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      if (response.data && response.data.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        toast.success("User Registered Successfully!");
        setOpen(false);
        navigate("/admin-dashboard/users");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check completion percentage
  const getCompletionPercentage = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'gender', 'role', 'password', 'prison'];
    const filledFields = requiredFields.filter(field => user[field]);
    return Math.round((filledFields.length / requiredFields.length) * 100);
  };

  // Get percentage width style for progress bar
  const getProgressWidth = () => {
    return { width: `${getCompletionPercentage()}%` };
  };
  
  return (
    <div className="w-full mx-auto bg-white p-6 rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaUserPlus className="mr-3 text-teal-600" />
          Add New System User
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Register a new user by filling in the information below
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-teal-600">
            {getCompletionPercentage()}% Complete
          </span>
          <div className="flex items-center">
            <button 
              type="button"
              onClick={() => setActiveTab("basic")}
              className={`text-xs px-3 py-1 mr-1 rounded-t-md ${activeTab === "basic" ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              Basic Info
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab("access")}
              className={`text-xs px-3 py-1 mr-1 rounded-t-md ${activeTab === "access" ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              Access Info
            </button>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-teal-600 h-2 rounded-full transition-all duration-500 ease-in-out" 
            style={getProgressWidth()}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {/* User Profile Photo */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-teal-600 flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile Preview" className="w-full h-full object-cover" />
              ) : (
                <FaUser className="text-gray-400 text-4xl" />
              )}
            </div>
            <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-teal-600 rounded-full p-1.5 cursor-pointer shadow-md">
              <FaUpload className="text-white text-sm" />
              <input 
                id="photo-upload" 
                type="file" 
                className="hidden" 
                name="photo"
                onChange={handlePhotoChange}
                accept="image/*"
              />
            </label>
          </div>
        </div>

        {activeTab === "basic" && (
          <div className="bg-gray-50 p-5 rounded-lg shadow-sm mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
              <FaIdCard className="mr-2 text-teal-600" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* First Name */}
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
            <input
              type="text"
              name="firstName"
              placeholder="Enter First name"
                    value={user.firstName}
              onChange={handleChange}
                    className={`pl-10 p-2.5 block w-full border ${errors.firstName ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-teal-500 focus:border-teal-500`}
              required
            />
                </div>
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                )}
          </div>

          {/* Middle Name */}
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Middle Name <span className="text-gray-400">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
            <input
              type="text"
              name="middleName"
              placeholder="Enter Middle name"
                    value={user.middleName}
              onChange={handleChange}
                    className="pl-10 p-2.5 block w-full border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
            />
                </div>
          </div>

          {/* Last Name */}
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
            <input
              type="text"
              name="lastName"
              placeholder="Enter Last name"
                    value={user.lastName}
              onChange={handleChange}
                    className={`pl-10 p-2.5 block w-full border ${errors.lastName ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-teal-500 focus:border-teal-500`}
              required
            />
                </div>
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
          </div>

          {/* Email */}
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400" />
                  </div>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
                    value={user.email}
              onChange={handleChange}
                    className={`pl-10 p-2.5 block w-full border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-teal-500 focus:border-teal-500`}
              required
            />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
          </div>

          {/* Gender */}
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-4">
                  <label className={`flex items-center p-2.5 border ${user.gender === 'male' ? 'border-teal-500 bg-teal-50' : 'border-gray-300'} rounded-md cursor-pointer flex-1`}>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={user.gender === 'male'}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <FaMars className={`mr-2 ${user.gender === 'male' ? 'text-teal-500' : 'text-gray-400'}`} />
                    <span className={user.gender === 'male' ? 'text-teal-700' : 'text-gray-700'}>Male</span>
                  </label>
                  <label className={`flex items-center p-2.5 border ${user.gender === 'female' ? 'border-teal-500 bg-teal-50' : 'border-gray-300'} rounded-md cursor-pointer flex-1`}>
                    <input
                      type="radio"
              name="gender"
                      value="female"
                      checked={user.gender === 'female'}
              onChange={handleChange}
                      className="hidden"
                    />
                    <FaVenus className={`mr-2 ${user.gender === 'female' ? 'text-teal-500' : 'text-gray-400'}`} />
                    <span className={user.gender === 'female' ? 'text-teal-700' : 'text-gray-700'}>Female</span>
                  </label>
                </div>
                {errors.gender && (
                  <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "access" && (
          <div className="bg-gray-50 p-5 rounded-lg shadow-sm mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
              <FaLock className="mr-2 text-teal-600" />
              Access Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Password */}
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>
            <input
              type="password"
              name="password"
                    placeholder="••••••••"
                    value={user.password}
              onChange={handleChange}
                    className={`pl-10 p-2.5 block w-full border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-teal-500 focus:border-teal-500`}
              required
            />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Password must be at least 8 characters and include uppercase, lowercase, and number
                </p>
          </div>

          {/* Role Selection */}
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUserTag className="text-gray-400" />
                  </div>
            <select
              name="role"
                    value={user.role}
              onChange={handleChange}
                    className={`pl-10 p-2.5 block w-full border ${errors.role ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-teal-500 focus:border-teal-500`}
              required
            >
              <option value="">Select Role</option>
              <option value="security">Security Staff</option>
              <option value="police-officer">Police Officer</option>
              <option value="inspector">Inspector</option>
              <option value="court">Court</option>
                    <option value="woreda">Woreda</option>
                  </select>
                </div>
                {errors.role && (
                  <p className="text-red-500 text-xs mt-1">{errors.role}</p>
                )}
              </div>

              {/* Prison Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Prison <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaBuilding className="text-gray-400" />
                  </div>
                  <select
                    name="prison"
                    value={user.prison}
                    onChange={handleChange}
                    className={`pl-10 p-2.5 block w-full border ${errors.prison ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-teal-500 focus:border-teal-500`}
                    required
                  >
                    <option value="">Select Prison</option>
                    {prisons.map((prison) => (
                      <option key={prison._id} value={prison._id}>
                        {prison.prison_name}
                      </option>
                    ))}
            </select>
                </div>
                {errors.prison && (
                  <p className="text-red-500 text-xs mt-1">{errors.prison}</p>
                )}
          </div>

              {/* Brief user role description based on selection */}
              {user.role && (
                <div className="bg-teal-50 p-3 rounded-md border border-teal-200 md:col-span-2">
                  <h4 className="font-medium text-teal-700 mb-1">Role Description:</h4>
                  <p className="text-sm text-gray-600">
                    {user.role === 'security' && 'Security staff are responsible for maintaining order and safety within the facility.'}
                    {user.role === 'police-officer' && 'Police officers handle case management and coordinate with external law enforcement.'}
                    {user.role === 'inspector' && 'Inspectors perform regular audits and ensure compliance with regulations.'}
                    {user.role === 'court' && 'Court users manage legal documentation and hearing schedules.'}
                    {user.role === 'woreda' && 'Woreda administrators coordinate with local government entities.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mt-6 pt-4 border-t">
          {activeTab === "access" && (
            <button
              type="button"
              onClick={() => setActiveTab("basic")}
              className="sm:w-auto w-full py-2.5 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-200 flex items-center justify-center"
            >
              <TiArrowBack className="mr-2" />
              Previous
            </button>
          )}
          
          {activeTab === "basic" && (
            <button
              type="button"
              onClick={() => setActiveTab("access")}
              className="sm:w-auto w-full py-2.5 px-6 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition duration-200 flex items-center justify-center"
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          {activeTab === "access" && (
            <button
              type="submit"
              disabled={isSubmitting}
              className={`sm:w-auto w-full py-2.5 px-6 rounded-md text-white font-medium flex items-center justify-center transition duration-200 ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Creating User...
                </>
              ) : (
                <>
                  <FaUserPlus className="mr-2" />
                  Create User
                </>
              )}
            </button>
          )}
          
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="sm:w-auto w-full py-2.5 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition duration-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUser;
