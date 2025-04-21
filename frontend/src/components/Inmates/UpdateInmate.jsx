import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from 'react-toastify'; // Import toast
import 'react-toastify/dist/ReactToastify.css'; // Import toast CS

import { CloudCog } from "lucide-react";
import { FaUser, FaMapMarkerAlt, FaIdCard, FaPhone, FaGavel, FaArrowLeft, FaArrowRight, FaSave } from "react-icons/fa";
import { validateInmateField, validateInmateForm } from "../../utils/formValidation";
import { logActivity, ACTIONS, RESOURCES, STATUS } from "../../utils/activityLogger";

// CSS for animations
const styles = {
  fadeIn: `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-fadeIn {
      animation: fadeIn 0.5s ease-out forwards;
    }
  `,
  hideScrollbar: `
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `
};

const UpdateInmate = ({setOpen, _id}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    birthDate: "",
    age: "",
    motherName: "",
    gender: "",
    birthRegion: "",
    birthZone: "",
    birthWereda: "",
    birthKebele: "",
    currentRegion: "",
    currentZone: "",
    currentWereda: "",
    currentKebele: "",
    degreeLevel: "",
    work: "",
    nationality: "",
    religion: "",
    maritalStatus: "",
    height: "",
    hairType: "",
    face: "",
    foreHead: "",
    nose: "",
    eyeColor: "",
    teeth: "",
    lip: "",
    ear: "",
    specialSymbol: "",
    contactName: "",
    contactRegion: "",
    contactZone: "",
    contactWereda: "",
    contactKebele: "",
    phoneNumber: "",
    registrarWorkerName: "",
    caseType: "",
    startDate: "",
    sentenceYear: "",
    releaseReason: "",
    releasedDate: ""
  });

  // Add validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Separate state for file uploads
  const [signature, setSignature] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  // Define tabs for navigation
  const tabs = [
    { id: "personal", label: "Personal Info", icon: <FaUser className="mr-2" /> },
    { id: "location", label: "Location", icon: <FaMapMarkerAlt className="mr-2" /> },
    { id: "physical", label: "Physical", icon: <FaIdCard className="mr-2" /> },
    { id: "contact", label: "Contact", icon: <FaPhone className="mr-2" /> },
    { id: "case", label: "Case Details", icon: <FaGavel className="mr-2" /> },
  ];

  // Navigate between tabs
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Navigate to next/previous tab
  const navigateTab = (direction) => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (direction === 'next' && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    } else if (direction === 'prev' && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  // Calculate age based on birth date
  const calculateAge = (birthDate) => {
    if (!birthDate) return "";
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age.toString();
  };

  // Fetch the inmate details to populate the form
  useEffect(() => {
    const fetchInmateData = async () => {
      if (!_id) {
        console.error("No inmate ID provided");
        toast.error("Missing inmate ID");
        return;
      }

      try {
        const response = await axiosInstance.get(`/inmates/get-inmate/${_id}`);
        const inmateData = response.data.inmate;
        
        if (!inmateData) {
          toast.error("No inmate data found.");
          return;
        }

        console.log("Fetched inmate data:", inmateData);

        // Format dates with null checks
        const formattedBirthDate = inmateData.birthDate ? inmateData.birthDate.split('T')[0] : '';
        const formattedStartDate = inmateData.startDate ? inmateData.startDate.split('T')[0] : '';
        const formattedReleasedDate = inmateData.releasedDate ? inmateData.releasedDate.split('T')[0] : '';
        const formattedParoleDate = inmateData.paroleDate ? inmateData.paroleDate.split('T')[0] : '';

        // Ensure all required fields have values
        const updatedFormData = {
          ...inmateData,
          firstName: inmateData.firstName || "",
          lastName: inmateData.lastName || "",
          gender: inmateData.gender || "",
          birthDate: formattedBirthDate,
          startDate: formattedStartDate,
          caseType: inmateData.caseType || "",
          sentenceYear: inmateData.sentenceYear || "",
          releasedDate: formattedReleasedDate,
          paroleDate: formattedParoleDate,
          // Ensure other potential undefined fields are initialized
          age: inmateData.age || calculateAge(formattedBirthDate) || "",
          motherName: inmateData.motherName || "",
          phoneNumber: inmateData.phoneNumber || ""
        };
        
        console.log("Updated form data:", updatedFormData);
        setFormData(updatedFormData);
        
        // Validate the initial form data
        const initialErrors = validateInmateForm(updatedFormData);
        setErrors(initialErrors);
        
        // Log any validation errors found
        if (Object.keys(initialErrors).length > 0) {
          console.warn("Initial validation errors:", initialErrors);
        }
        
        // Log activity for viewing inmate details
        try {
          await logActivity(
            ACTIONS.VIEW,
            `Viewed inmate details for ${updatedFormData.firstName} ${updatedFormData.lastName}`,
            RESOURCES.INMATE,
            _id,
            STATUS.SUCCESS
          );
        } catch (logError) {
          console.error('Failed to log view activity:', logError);
        }
      } catch (error) {
        console.error("Error fetching inmate data:", error);
        toast.error("Failed to fetch inmate data.");
        
        // Log failed attempt to view inmate
        try {
          await logActivity(
            ACTIONS.VIEW,
            `Failed to view inmate details: ${error.response?.data?.message || error.message}`,
            RESOURCES.INMATE,
            _id,
            STATUS.FAILURE
          );
        } catch (logError) {
          console.error('Failed to log view failure activity:', logError);
        }
      }
    };
    fetchInmateData();
  }, [_id]);

  // Add styles to document head
  useEffect(() => {
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles.fadeIn + styles.hideScrollbar;
    document.head.appendChild(styleElement);
    
    // Clean up
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Handle changes for both text and file inputs
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "signature") {
      setSignature(files[0]);
    } else if (name === "profileImage") {
      setProfileImage(files[0]);
    } else if (name === "birthDate") {
      // Update age when birth date changes
      const age = calculateAge(value);
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
        age: age
      }));
      
      // Validate the field as user types
      const error = validateInmateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      
      // Validate the field as user types
      const error = validateInmateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
    
    // Mark field as touched
    if (!touched[name]) {
      setTouched(prev => ({
        ...prev,
        [name]: true
      }));
    }
  };

  // Handle field blur for validation
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate the field
    const error = validateInmateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Handle form submission with multipart/form-data
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const formErrors = validateInmateForm(formData);
    setErrors(formErrors);
    
    // Set all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    // If there are errors, prevent submission
    if (Object.keys(formErrors).length > 0) {
      toast.error("Please fix the errors in the form");
      
      // Navigate to the tab with the first error
      const firstErrorField = Object.keys(formErrors)[0];
      const tabMap = {
        firstName: "personal", middleName: "personal", lastName: "personal", birthDate: "personal", 
        age: "personal", motherName: "personal", gender: "personal", nationality: "personal",
        religion: "personal", maritalStatus: "personal", degreeLevel: "personal", work: "personal",
        
        birthRegion: "location", birthZone: "location", birthWereda: "location", birthKebele: "location",
        currentRegion: "location", currentZone: "location", currentWereda: "location", currentKebele: "location",
        
        height: "physical", hairType: "physical", face: "physical", foreHead: "physical",
        nose: "physical", eyeColor: "physical", teeth: "physical", lip: "physical",
        ear: "physical", specialSymbol: "physical",
        
        contactName: "contact", contactRegion: "contact", contactZone: "contact",
        contactWereda: "contact", contactKebele: "contact", phoneNumber: "contact",
        
        caseType: "case", startDate: "case", sentenceYear: "case", sentenceReason: "case",
        releasedDate: "case", paroleDate: "case"
      };
      
      // Switch to the tab containing the error
      const tabWithError = tabMap[firstErrorField] || "personal";
      setActiveTab(tabWithError);
      
      // Scroll to first error
      setTimeout(() => {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }, 100);
      
      return;
    }
    
    setIsSubmitting(true);
    const data = new FormData();
    
    // Log the form data before submission to debug
    console.log("Form data before submission:", formData);
    
    // Check explicitly if required fields are present
    const requiredFields = ['firstName', 'lastName', 'gender', 'birthDate', 'caseType', 'startDate', 'sentenceYear'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      toast.error(`Missing required fields: ${missingFields.join(', ')}`);
      setIsSubmitting(false);
      return;
    }
    
    // Add all form data directly without combining names
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });
    
    if (signature) {
      data.append("signature", signature);
    }
    
    if (profileImage) {
      data.append("profileImage", profileImage);
    }

    try {
      // For debugging
      const formDataObj = {};
      data.forEach((value, key) => {
        formDataObj[key] = value;
      });
      console.log("FormData being sent:", formDataObj);
      
      // Try with JSON instead of FormData if there are issues with FormData
      const jsonData = {};
      Object.keys(formData).forEach(key => {
        jsonData[key] = formData[key];
      });
      
      console.log("Sending request to:", `/inmates/update-inmate/${_id}`);
      
      // Try with application/json content type
      const response = await axiosInstance.put(
        `/inmates/update-inmate/${_id}`,
        jsonData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        // Log activity for successful inmate update
        try {
          await logActivity(
            ACTIONS.UPDATE,
            `Updated inmate information for ${formData.firstName} ${formData.lastName}`,
            RESOURCES.INMATE,
            _id,
            STATUS.SUCCESS
          );
          console.log('Activity logged: Inmate update');
        } catch (logError) {
          console.error('Failed to log activity:', logError);
        }
        
        navigate("/securityStaff-dashboard/inmates");
        setOpen && setOpen(false);
        toast.success("Inmate updated successfully!");
      } else {
        toast.error("Failed to update inmate.");
      }
    } catch (error) {
      console.error("Error updating inmate:", error);
      console.error("Error response:", error.response?.data);
      
      // Log activity for failed inmate update
      try {
        await logActivity(
          ACTIONS.UPDATE,
          `Failed to update inmate: ${error.response?.data?.message || error.message}`,
          RESOURCES.INMATE,
          _id,
          STATUS.FAILURE
        );
        console.log('Activity logged: Inmate update failure');
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }
      
      toast.error(error.response?.data?.message || "An error occurred while updating the inmate.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to display error message
  const renderError = (fieldName) => {
    if (touched[fieldName] && errors[fieldName]) {
      return (
        <p className="text-red-500 text-xs mt-1">{errors[fieldName]}</p>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header with title and close button */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Update Inmate Information</h2>
        {setOpen && (
          <button 
            onClick={() => setOpen(false)}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* Tabs Navigation - Modern Style */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="flex flex-wrap -mb-px" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex items-center py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Form Content based on active tab */}
        <div className="space-y-8">
          {/* Profile Image Section - Always visible */}
          {activeTab === "personal" && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center space-x-6">
                <div className="shrink-0">
                  {profileImage ? (
                    <img className="h-24 w-24 object-cover rounded-full border-4 border-blue-100" 
                        src={URL.createObjectURL(profileImage)} 
                        alt="Profile preview" />
                  ) : (
                    formData.profileImageUrl ? (
                      <img className="h-24 w-24 object-cover rounded-full border-4 border-blue-100" 
                          src={formData.profileImageUrl} 
                          alt="Current profile" />
                    ) : (
                      <div className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center border-4 border-blue-100">
                        <FaUser className="text-blue-300 text-4xl" />
                      </div>
                    )
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Photo</h3>
                  <label className="inline-block cursor-pointer">
                    <span className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Choose new photo
                    </span>
                    <input 
                      type="file" 
                      name="profileImage"
                      onChange={handleChange}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended: Square image, at least 300x300 pixels
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Personal Information Tab */}
          {activeTab === "personal" && (
            <div className="animate-fadeIn bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center">
                <FaUser className="mr-2 text-blue-600" />
                Personal Information
                <span className="ml-2 text-xs text-red-500">* Required fields</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    placeholder="Enter First Name"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    required
                  />
                  {renderError('firstName')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    placeholder="Enter Middle name"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.middleName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  />
                  {renderError('middleName')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    placeholder="Enter Last name"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    required
                  />
                  {renderError('lastName')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.birthDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    required
                  />
                  {renderError('birthDate')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age (Calculated)
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.gender ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  {renderError('gender')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mother's Name
                  </label>
                  <input
                    type="text"
                    name="motherName"
                    value={formData.motherName}
                    placeholder="Enter mother's name"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.motherName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  />
                  {renderError('motherName')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nationality
                  </label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    placeholder="Enter nationality"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.nationality ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  />
                  {renderError('nationality')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Religion
                  </label>
                  <select
                    name="religion"
                    value={formData.religion}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.religion ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  >
                    <option value="">Select Religion</option>
                    <option value="Orthodox">Orthodox</option>
                    <option value="Muslim">Muslim</option>
                    <option value="Protestant">Protestant</option>
                    <option value="Catholic">Catholic</option>
                    <option value="Other">Other</option>
                  </select>
                  {renderError('religion')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marital Status
                  </label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.maritalStatus ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  >
                    <option value="">Select Marital Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                  {renderError('maritalStatus')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Education Level
                  </label>
                  <select
                    name="degreeLevel"
                    value={formData.degreeLevel}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.degreeLevel ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  >
                    <option value="">Select Education Level</option>
                    <option value="No Education">No Education</option>
                    <option value="Primary">Primary</option>
                    <option value="Secondary">Secondary</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Masters">Masters</option>
                    <option value="PhD">PhD</option>
                  </select>
                  {renderError('degreeLevel')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work/Occupation
                  </label>
                  <input
                    type="text"
                    name="work"
                    value={formData.work}
                    placeholder="Enter previous occupation"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.work ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  />
                  {renderError('work')}
                </div>
              </div>
            </div>
          )}

          {/* Location Information Tab */}
          {activeTab === "location" && (
            <div className="animate-fadeIn bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-blue-600" />
                Location Information
              </h3>
              
              <div className="space-y-8">
                {/* Birth Address Section */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-blue-800 mb-4">Birth Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Region
                      </label>
                      <input
                        type="text"
                        name="birthRegion"
                        value={formData.birthRegion}
                        placeholder="Enter birth region"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2 border ${errors.birthRegion ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white`}
                      />
                      {renderError('birthRegion')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Zone
                      </label>
                      <input
                        type="text"
                        name="birthZone"
                        value={formData.birthZone}
                        placeholder="Enter birth zone"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2 border ${errors.birthZone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white`}
                      />
                      {renderError('birthZone')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wereda
                      </label>
                      <input
                        type="text"
                        name="birthWereda"
                        value={formData.birthWereda}
                        placeholder="Enter birth wereda"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2 border ${errors.birthWereda ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white`}
                      />
                      {renderError('birthWereda')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kebele
                      </label>
                      <input
                        type="text"
                        name="birthKebele"
                        value={formData.birthKebele}
                        placeholder="Enter birth kebele"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2 border ${errors.birthKebele ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white`}
                      />
                      {renderError('birthKebele')}
                    </div>
                  </div>
                </div>
                
                {/* Current Address Section */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-green-800 mb-4">Current Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Region
                      </label>
                      <input
                        type="text"
                        name="currentRegion"
                        value={formData.currentRegion}
                        placeholder="Enter current region"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2 border ${errors.currentRegion ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white`}
                      />
                      {renderError('currentRegion')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Zone
                      </label>
                      <input
                        type="text"
                        name="currentZone"
                        value={formData.currentZone}
                        placeholder="Enter current zone"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2 border ${errors.currentZone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white`}
                      />
                      {renderError('currentZone')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wereda
                      </label>
                      <input
                        type="text"
                        name="currentWereda"
                        value={formData.currentWereda}
                        placeholder="Enter current wereda"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2 border ${errors.currentWereda ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white`}
                      />
                      {renderError('currentWereda')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kebele
                      </label>
                      <input
                        type="text"
                        name="currentKebele"
                        value={formData.currentKebele}
                        placeholder="Enter current kebele"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2 border ${errors.currentKebele ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white`}
                      />
                      {renderError('currentKebele')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Physical Characteristics Tab */}
          {activeTab === "physical" && (
            <div className="animate-fadeIn bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center">
                <FaIdCard className="mr-2 text-blue-600" />
                Physical Characteristics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    placeholder="Enter height in cm"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.height ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  />
                  {renderError('height')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hair Type
                  </label>
                  <select
                    name="hairType"
                    value={formData.hairType || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.hairType ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  >
                    <option value="">Select hair type</option>
                    {['Straight', 'Wavy', 'Curly', 'Coily', 'Bald', 'Thin', 'Thick', 'Other'].map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {renderError('hairType')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Face Shape
                  </label>
                  <select
                    name="face"
                    value={formData.face || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.face ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  >
                    <option value="">Select face shape</option>
                    {['Oval', 'Round', 'Square', 'Rectangle', 'Heart', 'Diamond', 'Triangle', 'Other'].map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {renderError('face')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forehead
                  </label>
                  <select
                    name="foreHead"
                    value={formData.foreHead || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.foreHead ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  >
                    <option value="">Select forehead type</option>
                    {['Narrow', 'Average', 'Wide', 'High', 'Low', 'Prominent', 'Other'].map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {renderError('foreHead')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nose
                  </label>
                  <select
                    name="nose"
                    value={formData.nose || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.nose ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  >
                    <option value="">Select nose type</option>
                    {['Straight', 'Roman', 'Button', 'Nubian', 'Hawk', 'Snub', 'Greek', 'Other'].map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {renderError('nose')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Eye Color
                  </label>
                  <select
                    name="eyeColor"
                    value={formData.eyeColor || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.eyeColor ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  >
                    <option value="">Select eye color</option>
                    {['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Black', 'Other'].map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {renderError('eyeColor')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teeth
                  </label>
                  <select
                    name="teeth"
                    value={formData.teeth || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.teeth ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  >
                    <option value="">Select teeth type</option>
                    {['Straight', 'Crowded', 'Gapped', 'Overbite', 'Underbite', 'Crooked', 'Other'].map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {renderError('teeth')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lips
                  </label>
                  <select
                    name="lip"
                    value={formData.lip || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.lip ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  >
                    <option value="">Select lip type</option>
                    {['Thin', 'Medium', 'Full', 'Wide', 'Narrow', 'Heart-shaped', 'Bow-shaped', 'Other'].map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {renderError('lip')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ears
                  </label>
                  <select
                    name="ear"
                    value={formData.ear || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.ear ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  >
                    <option value="">Select ear type</option>
                    {['Attached', 'Detached', 'Small', 'Large', 'Round', 'Pointed', 'Other'].map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {renderError('ear')}
                </div>
                
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Marks/Symbols
                  </label>
                  <textarea
                    name="specialSymbol"
                    value={formData.specialSymbol}
                    placeholder="Enter any distinguishing marks, scars, tattoos or other identifying features"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows="3"
                    className={`w-full px-4 py-2 border ${errors.specialSymbol ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  />
                  {renderError('specialSymbol')}
                </div>
              </div>
            </div>
          )}

          {/* Contact Information Tab */}
          {activeTab === "contact" && (
            <div className="animate-fadeIn bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center">
                <FaPhone className="mr-2 text-blue-600" />
                Contact Information
              </h3>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-yellow-800 mb-4">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      placeholder="Enter contact name"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2 border ${errors.contactName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white`}
                    />
                    {renderError('contactName')}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      placeholder="Enter phone number"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white`}
                    />
                    {renderError('phoneNumber')}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region
                    </label>
                    <input
                      type="text"
                      name="contactRegion"
                      value={formData.contactRegion}
                      placeholder="Enter contact region"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2 border ${errors.contactRegion ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white`}
                    />
                    {renderError('contactRegion')}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zone
                    </label>
                    <input
                      type="text"
                      name="contactZone"
                      value={formData.contactZone}
                      placeholder="Enter contact zone"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2 border ${errors.contactZone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white`}
                    />
                    {renderError('contactZone')}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wereda
                    </label>
                    <input
                      type="text"
                      name="contactWereda"
                      value={formData.contactWereda}
                      placeholder="Enter contact wereda"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2 border ${errors.contactWereda ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white`}
                    />
                    {renderError('contactWereda')}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kebele
                    </label>
                    <input
                      type="text"
                      name="contactKebele"
                      value={formData.contactKebele}
                      placeholder="Enter contact kebele"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2 border ${errors.contactKebele ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white`}
                    />
                    {renderError('contactKebele')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Case Information Tab */}
          {activeTab === "case" && (
            <div className="animate-fadeIn bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center">
                <FaGavel className="mr-2 text-blue-600" />
                Case Information
                <span className="ml-2 text-xs text-red-500">* Required fields</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Case Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="caseType"
                    value={formData.caseType}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.caseType ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    required
                  >
                    <option value="">Select Case Type</option>
                    <option value="Murder">Murder</option>
                    <option value="Assault">Assault</option>
                    <option value="Theft">Theft</option>
                    <option value="Robbery">Robbery</option>
                    <option value="Fraud">Fraud</option>
                    <option value="Drug Offense">Drug Offense</option>
                    <option value="Other">Other</option>
                  </select>
                  {renderError('caseType')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.startDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    required
                  />
                  {renderError('startDate')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sentence (Years) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="sentenceYear"
                    value={formData.sentenceYear}
                    placeholder="Enter sentence duration in years"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.sentenceYear ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    required
                    step="0.1"
                  />
                  {renderError('sentenceYear')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Release Date
                  </label>
                  <input
                    type="date"
                    name="releasedDate"
                    value={formData.releasedDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.releasedDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  />
                  {renderError('releasedDate')}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parole Date
                  </label>
                  <input
                    type="date"
                    name="paroleDate"
                    value={formData.paroleDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.paroleDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  />
                  {renderError('paroleDate')}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sentence Reason
                  </label>
                  <textarea
                    name="sentenceReason"
                    value={formData.sentenceReason}
                    placeholder="Enter details about the reason for sentence"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows="3"
                    className={`w-full px-4 py-2 border ${errors.sentenceReason ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  />
                  {renderError('sentenceReason')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Signature Upload */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Signature</h3>
          <div className="flex items-center space-x-6">
            <div className="shrink-0">
              {signature ? (
                <img className="h-16 w-32 object-contain border border-gray-300 p-1" 
                     src={URL.createObjectURL(signature)} 
                     alt="Signature preview" />
              ) : (
                formData.signatureUrl ? (
                  <img className="h-16 w-32 object-contain border border-gray-300 p-1" 
                       src={formData.signatureUrl} 
                       alt="Current signature" />
                ) : (
                  <div className="h-16 w-32 bg-gray-100 border border-gray-300 p-1 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No signature</span>
                  </div>
                )
              )}
            </div>
            <label className="block">
              <span className="sr-only">Choose signature</span>
              <input 
                type="file" 
                name="signature"
                onChange={handleChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <p className="mt-1 text-xs text-gray-500">Upload a scanned image of the inmate's signature</p>
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between items-center mt-10 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="text-red-500">*</span> Required fields
          </div>
          
          <div className="flex space-x-4">
            {setOpen && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              className="px-8 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-md flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Update Inmate
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UpdateInmate;
