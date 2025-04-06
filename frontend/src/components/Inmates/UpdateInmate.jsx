import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from 'react-toastify'; // Import toast
import 'react-toastify/dist/ReactToastify.css'; // Import toast CS

import { CloudCog } from "lucide-react";
import { validateInmateField, validateInmateForm } from "../../utils/formValidation";

const UpdateInmate = ({setOpen, _id}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

        // Format dates with null checks
        const formattedBirthDate = inmateData.birthDate ? inmateData.birthDate.split('T')[0] : '';
        const formattedStartDate = inmateData.startDate ? inmateData.startDate.split('T')[0] : '';
        const formattedReleasedDate = inmateData.releasedDate ? inmateData.releasedDate.split('T')[0] : '';

        const updatedFormData = {
          ...inmateData,
          birthDate: formattedBirthDate,
          startDate: formattedStartDate,
          releasedDate: formattedReleasedDate
        };
        
        setFormData(updatedFormData);
        
        // Validate the initial form data
        const initialErrors = validateInmateForm(updatedFormData);
        setErrors(initialErrors);
      } catch (error) {
        console.error("Error fetching inmate data:", error);
        toast.error("Failed to fetch inmate data.");
      }
    };
    fetchInmateData();
  }, [_id]);

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
      
      // Scroll to first error
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return;
    }
    
    setIsSubmitting(true);
    const data = new FormData();
    
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
      const response = await axiosInstance.put(
        `/inmates/update-inmate/${_id}`,
        data,
      );

      if (response.data) {
        navigate("/securityStaff-dashboard/inmates");
        setOpen && setOpen(false);
        toast.success("Inmate updated successfully!");
      } else {
        toast.error("Failed to update inmate.");
      }
    } catch (error) {
      console.error("Error updating inmate:", error);
      toast.error(error.response?.data?.error || "An error occurred while updating the inmate.");
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
    <div className="max-w-5xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Update Inmate</h2>
        
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Image Upload */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Profile Image</h3>
          <div className="flex items-center space-x-6">
            <div className="shrink-0">
              {profileImage ? (
                <img className="h-16 w-16 object-cover rounded-full" 
                     src={URL.createObjectURL(profileImage)} 
                     alt="Profile preview" />
              ) : (
                formData.profileImageUrl ? (
                  <img className="h-16 w-16 object-cover rounded-full" 
                       src={formData.profileImageUrl} 
                       alt="Current profile" />
                ) : (
                  <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )
              )}
            </div>
            <label className="block">
              <span className="sr-only">Choose profile photo</span>
              <input 
                type="file" 
                name="profileImage"
                onChange={handleChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </label>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                placeholder="Enter Middle name"
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.middleName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                required
              />
              {renderError('middleName')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                placeholder="Enter age"
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.age ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                readOnly
              />
              {renderError('age')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Work/Occupation</label>
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

        {/* Location Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Location Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-medium mb-4 text-gray-700">Birth Place</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <input
                    type="text"
                    name="birthRegion"
                    value={formData.birthRegion}
                    placeholder="Enter birth region"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.birthRegion ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  />
                  {renderError('birthRegion')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                  <input
                    type="text"
                    name="birthZone"
                    value={formData.birthZone}
                    placeholder="Enter birth zone"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.birthZone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  />
                  {renderError('birthZone')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wereda</label>
                  <input
                    type="text"
                    name="birthWereda"
                    value={formData.birthWereda}
                    placeholder="Enter birth wereda"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.birthWereda ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  />
                  {renderError('birthWereda')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kebele</label>
                  <input
                    type="text"
                    name="birthKebele"
                    value={formData.birthKebele}
                    placeholder="Enter birth kebele"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.birthKebele ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  />
                  {renderError('birthKebele')}
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xl font-medium mb-4 text-gray-700">Current Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <input
                    type="text"
                    name="currentRegion"
                    value={formData.currentRegion}
                    placeholder="Enter current region"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.currentRegion ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  />
                  {renderError('currentRegion')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                  <input
                    type="text"
                    name="currentZone"
                    value={formData.currentZone}
                    placeholder="Enter current zone"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.currentZone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  />
                  {renderError('currentZone')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wereda</label>
                  <input
                    type="text"
                    name="currentWereda"
                    value={formData.currentWereda}
                    placeholder="Enter current wereda"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.currentWereda ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  />
                  {renderError('currentWereda')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kebele</label>
                  <input
                    type="text"
                    name="currentKebele"
                    value={formData.currentKebele}
                    placeholder="Enter current kebele"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 border ${errors.currentKebele ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  />
                  {renderError('currentKebele')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Characteristics Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Physical Characteristics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <select
                name="height"
                value={formData.height}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.height ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              >
                <option value="">Select Height</option>
                {Array.from({length: 81}, (_, i) => i + 150).map(height => (
                  <option key={height} value={height}>{height} cm</option>
                ))}
              </select>
              {renderError('height')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hair Type</label>
              <select
                name="hairType"
                value={formData.hairType}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.hairType ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              >
                <option value="">Select Hair Type</option>
                <option value="Straight">Straight</option>
                <option value="Wavy">Wavy</option>
                <option value="Curly">Curly</option>
                <option value="Coily">Coily</option>
                <option value="Bald">Bald</option>
              </select>
              {renderError('hairType')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Face</label>
              <select
                name="face"
                value={formData.face}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.face ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              >
                <option value="">Select Face Shape</option>
                <option value="Oval">Oval</option>
                <option value="Round">Round</option>
                <option value="Square">Square</option>
                <option value="Heart">Heart</option>
                <option value="Diamond">Diamond</option>
                <option value="Rectangular">Rectangular</option>
              </select>
              {renderError('face')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Forehead</label>
              <select
                name="foreHead"
                value={formData.foreHead}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.foreHead ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              >
                <option value="">Select Forehead Type</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
                <option value="Prominent">Prominent</option>
                <option value="Sloped">Sloped</option>
              </select>
              {renderError('foreHead')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nose</label>
              <select
                name="nose"
                value={formData.nose}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.nose ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              >
                <option value="">Select Nose Type</option>
                <option value="Straight">Straight</option>
                <option value="Roman">Roman</option>
                <option value="Button">Button</option>
                <option value="Nubian">Nubian</option>
                <option value="Hawk">Hawk</option>
                <option value="Snub">Snub</option>
              </select>
              {renderError('nose')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eye Color</label>
              <select
                name="eyeColor"
                value={formData.eyeColor}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.eyeColor ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              >
                <option value="">Select Eye Color</option>
                <option value="Brown">Brown</option>
                <option value="Black">Black</option>
                <option value="Blue">Blue</option>
                <option value="Green">Green</option>
                <option value="Gray">Gray</option>
                <option value="Hazel">Hazel</option>
                <option value="Amber">Amber</option>
              </select>
              {renderError('eyeColor')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teeth</label>
              <select
                name="teeth"
                value={formData.teeth}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.teeth ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              >
                <option value="">Select Teeth Characteristic</option>
                <option value="Straight">Straight</option>
                <option value="Crooked">Crooked</option>
                <option value="Gap">Gap-toothed</option>
                <option value="Missing">Missing teeth</option>
                <option value="Gold">Gold teeth</option>
                <option value="Other">Other</option>
              </select>
              {renderError('teeth')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lip</label>
              <select
                name="lip"
                value={formData.lip}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.lip ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              >
                <option value="">Select Lip Type</option>
                <option value="Thin">Thin</option>
                <option value="Medium">Medium</option>
                <option value="Full">Full</option>
                <option value="Asymmetric">Asymmetric</option>
                <option value="Heart-shaped">Heart-shaped</option>
              </select>
              {renderError('lip')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ear</label>
              <select
                name="ear"
                value={formData.ear}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.ear ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              >
                <option value="">Select Ear Type</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
                <option value="Attached">Attached</option>
                <option value="Detached">Detached</option>
                <option value="Pointed">Pointed</option>
              </select>
              {renderError('ear')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Symbol</label>
              <textarea
                name="specialSymbol"
                value={formData.specialSymbol}
                placeholder="Describe any tattoos, scars, birthmarks, or other distinguishing features"
                onChange={handleChange}
                onBlur={handleBlur}
                rows="2"
                className={`w-full px-4 py-2 border ${errors.specialSymbol ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              />
              {renderError('specialSymbol')}
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                placeholder="Enter contact name"
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.contactName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              />
              {renderError('contactName')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Region</label>
              <input
                type="text"
                name="contactRegion"
                value={formData.contactRegion}
                placeholder="Enter contact region"
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.contactRegion ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              />
              {renderError('contactRegion')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Zone</label>
              <input
                type="text"
                name="contactZone"
                value={formData.contactZone}
                placeholder="Enter contact zone"
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.contactZone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              />
              {renderError('contactZone')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Wereda</label>
              <input
                type="text"
                name="contactWereda"
                value={formData.contactWereda}
                placeholder="Enter contact wereda"
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.contactWereda ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              />
              {renderError('contactWereda')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Kebele</label>
              <input
                type="text"
                name="contactKebele"
                value={formData.contactKebele}
                placeholder="Enter contact kebele"
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.contactKebele ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              />
              {renderError('contactKebele')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                placeholder="Enter phone number"
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              />
              {renderError('phoneNumber')}
            </div>
          </div>
        </div>

        {/* Case Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Case Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
              <select
                name="caseType"
                value={formData.caseType}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.caseType ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              >
                <option value="">Select Case Type</option>
                <option value="Theft">Theft</option>
                <option value="Robbery">Robbery</option>
                <option value="Assault">Assault</option>
                <option value="Homicide">Homicide</option>
                <option value="Fraud">Fraud</option>
                <option value="DrugOffense">Drug Offense</option>
                <option value="SexualOffense">Sexual Offense</option>
                <option value="Kidnapping">Kidnapping</option>
                <option value="Other">Other</option>
              </select>
              {renderError('caseType')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.startDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              />
              {renderError('startDate')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sentence Year</label>
              <input
                type="number"
                name="sentenceYear"
                value={formData.sentenceYear}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.sentenceYear ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                step="0.5"
              />
              {renderError('sentenceYear')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Released Date</label>
              <input
                type="date"
                name="releasedDate"
                value={formData.releasedDate}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.releasedDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                readOnly
              />
              {renderError('releasedDate')}
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sentence Reason</label>
              <textarea
                name="sentenceReason"
                value={formData.sentenceReason}
                placeholder="Enter sentence reason"
                onChange={handleChange}
                onBlur={handleBlur}
                rows="3"
                className={`w-full px-4 py-2 border ${errors.sentenceReason ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              />
              {renderError('sentenceReason')}
            </div>
          </div>
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
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => navigate("/securityStaff-dashboard/inmates")}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                Updating...
              </>
            ) : (
              'Update Inmate'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateInmate;
