import React, { useState, useEffect } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FiSend, FiFile, FiFileText, FiCalendar, FiCheckCircle, FiUpload, FiUser, FiMapPin, FiBookOpen, FiBriefcase } from "react-icons/fi";
import { validateCourtInstructionForm } from "../../../utils/formValidation";

// Helper function to calculate age from birthdate
const calculateAge = (birthdate) => {
  if (!birthdate) return "";
  
  const birthDate = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const CourtInstructions = ({ setOpen }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Case information
    courtCaseNumber: "",

    judgeName: "",
    prisonName: "",
    verdict: "",
    instructions: "",
    hearingDate: new Date().toISOString().substring(0, 10),
    effectiveDate: new Date().toISOString().substring(0, 10),
    sendDate: new Date().toISOString().substring(0, 10),
    
    // Personal information
    firstName: "",
    middleName: "",
    lastName: "",
    age: "",
    gender: "",
    birthdate: "",
    maritalStatus: "",
    nationality: "Ethiopian",
    educationLevel: "",
    occupation: "",
    
    // Birth address
    birthRegion: "",
    birthZone: "",
    birthWoreda: "",
    birthKebele: "",
    
    // Current address
    currentRegion: "",
    currentZone: "",
    currentWoreda: "",
    currentKebele: "",
    
    // Case details
    caseType: "",
    sentenceYear: "",
  });
  const [signature, setSignature] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Generate automatic case number on component mount
  useEffect(() => {
    generateCaseNumber();
  }, []);

  // Update prisoner name when first, middle, and last names change
  useEffect(() => {
    if (formData.firstName || formData.middleName || formData.lastName) {
      const fullName = [formData.firstName, formData.middleName, formData.lastName]
        .filter(Boolean)
        .join(" ");
      setFormData(prev => ({
        ...prev,
        prisonerName: fullName
      }));
    }
  }, [formData.firstName, formData.middleName, formData.lastName]);

  const generateCaseNumber = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const caseNumber = `CASE-${year}${month}${day}-${random}`;
    
    setFormData(prev => ({
      ...prev,
      courtCaseNumber: caseNumber
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // When birthdate changes, calculate age automatically
    if (name === "birthdate" && value) {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
        age: calculateAge(value)
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === "signature") {
      setSignature(file);
      const reader = new FileReader();
      reader.onload = () => {
        setSignaturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setAttachment(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAttachmentPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate the form data
    const validationErrors = validateCourtInstructionForm({
      ...formData,
      attachment: attachment
    });
    
    // If there are validation errors, set them and prevent form submission
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      
      // Scroll to the first error
      const firstErrorField = Object.keys(validationErrors)[0];
      const errorElement = document.getElementById(firstErrorField);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      
      // Display error toast
      toast.error("Please correct the errors in the form");
      return;
    }
    
    // Clear previous errors if form is valid
    setErrors({});
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("token");
      const formdata = new FormData();
      
      // Case information
    
      formdata.append("courtCaseNumber", formData.courtCaseNumber);
      formdata.append("judgeName", formData.judgeName);
      formdata.append("prisonName", formData.prisonName);
      formdata.append("verdict", formData.verdict);
      formdata.append("instructions", formData.instructions);
      formdata.append("hearingDate", formData.hearingDate);
      formdata.append("effectiveDate", formData.effectiveDate);
      formdata.append("sendDate", formData.sendDate);
      formdata.append("caseType", formData.caseType);
      formdata.append("sentenceYear", formData.sentenceYear);
      
      // Personal information
      formdata.append("firstName", formData.firstName);
      formdata.append("middleName", formData.middleName);
      formdata.append("lastName", formData.lastName);
      formdata.append("age", formData.age);
      formdata.append("gender", formData.gender);
      formdata.append("birthdate", formData.birthdate);
      formdata.append("maritalStatus", formData.maritalStatus);
      formdata.append("nationality", formData.nationality);
      formdata.append("educationLevel", formData.educationLevel);
      formdata.append("occupation", formData.occupation);
      
      // Birth address
      formdata.append("birthRegion", formData.birthRegion);
      formdata.append("birthZone", formData.birthZone);
      formdata.append("birthWoreda", formData.birthWoreda);
      formdata.append("birthKebele", formData.birthKebele);
      
      // Current address
      formdata.append("currentRegion", formData.currentRegion);
      formdata.append("currentZone", formData.currentZone);
      formdata.append("currentWoreda", formData.currentWoreda);
      formdata.append("currentKebele", formData.currentKebele);
      
      // Files
      if (signature) formdata.append("signature", signature);
      if (attachment) formdata.append("attachment", attachment);

      const response = await axiosInstance.post("/instruction/add-new", formdata, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        toast.success("Instruction sent successfully!");
        setOpen(false);
        setFormData({
          // Case information
         
          courtCaseNumber: "",
          judgeName: "",
          prisonName: "",
          verdict: "",
          instructions: "",
          hearingDate: new Date().toISOString().substring(0, 10),
          effectiveDate: new Date().toISOString().substring(0, 10),
          sendDate: new Date().toISOString().substring(0, 10),
          caseType: "",
          sentenceYear: "",
          
          // Personal information
          firstName: "",
          middleName: "",
          lastName: "",
          age: "",
          gender: "",
          birthdate: "",
          maritalStatus: "",
          nationality: "Ethiopian",
          educationLevel: "",
          occupation: "",
          
          // Birth address
          birthRegion: "",
          birthZone: "",
          birthWoreda: "",
          birthKebele: "",
          
          // Current address
          currentRegion: "",
          currentZone: "",
          currentWoreda: "",
          currentKebele: "",
        });
        setSignature(null);
        setSignaturePreview(null);
        setAttachment(null);
        setAttachmentPreview(null);
        navigate("/court-dashboard/list");
      } else {
        toast.error("Failed to send instruction.");
      }
    } catch (error) {
      console.error("Error sending instruction:", error);
      toast.error("An error occurred while sending instruction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render error message
  const renderError = (fieldName) => {
    return errors[fieldName] ? (
      <p className="text-red-500 text-xs mt-1">{errors[fieldName]}</p>
    ) : null;
  };

  return (
    <div className="p-6 w-full mx-auto bg-white shadow-lg rounded-lg border border-gray-100">
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 -mx-6 -mt-6 px-6 py-4 rounded-t-lg mb-6">
        <h2 className="text-2xl font-bold text-white text-center">Court Instruction</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information Section */}
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6">
          <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center">
            <FiUser className="mr-2" /> Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                required
              />
              {renderError('firstName')}
            </div>

            {/* Middle Name */}
            <div>
              <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">
                Middle Name
              </label>
              <input
                type="text"
                id="middleName"
                name="middleName"
                placeholder="Enter middle name"
                value={formData.middleName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.middleName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                required
              />
              {renderError('middleName')}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                required
              />
              {renderError('lastName')}
            </div>

            {/* Age */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                Age <span className="text-xs text-gray-500">(Auto-calculated)</span>
              </label>
              <input
                type="number"
                id="age"
                name="age"
                placeholder="Auto-calculated from birthdate"
                value={formData.age}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                readOnly
              />
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.gender ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {renderError('gender')}
            </div>

            {/* Birthdate */}
            <div>
              <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
                Birth Date
              </label>
              <input
                type="date"
                id="birthdate"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.birthdate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                required
              />
              {renderError('birthdate')}
            </div>

            {/* Marital Status */}
            <div>
              <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 mb-1">
                Marital Status
              </label>
              <select
                id="maritalStatus"
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.maritalStatus ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                required
              >
                <option value="">Select Marital Status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
              {renderError('maritalStatus')}
            </div>

            {/* Nationality */}
            <div>
              <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
                Nationality
              </label>
              <input
                type="text"
                id="nationality"
                name="nationality"
                placeholder="Enter nationality"
                value={formData.nationality}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.nationality ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                required
              />
              {renderError('nationality')}
            </div>

            {/* Education Level */}
            <div>
              <label htmlFor="educationLevel" className="block text-sm font-medium text-gray-700 mb-1">
                Education Level
              </label>
              <select
                id="educationLevel"
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.educationLevel ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                required
              >
                <option value="">Select Education Level</option>
                <option value="none">None</option>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="diploma">Diploma</option>
                <option value="degree">Bachelor's Degree</option>
                <option value="masters">Master's Degree</option>
                <option value="doctorate">Doctorate</option>
              </select>
              {renderError('educationLevel')}
            </div>

            {/* Occupation */}
            <div>
              <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
                Occupation
              </label>
              <input
                type="text"
                id="occupation"
                name="occupation"
                placeholder="Enter occupation"
                value={formData.occupation}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.occupation ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                required
              />
              {renderError('occupation')}
            </div>
          </div>
        </div>

        {/* Birth Address Section */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-6">
          <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
            <FiMapPin className="mr-2" /> Birth Address
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Birth Region */}
            <div>
              <label htmlFor="birthRegion" className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <input
                type="text"
                id="birthRegion"
                name="birthRegion"
                placeholder="Enter region"
                value={formData.birthRegion}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.birthRegion ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                required
              />
              {renderError('birthRegion')}
            </div>

            {/* Birth Zone */}
            <div>
              <label htmlFor="birthZone" className="block text-sm font-medium text-gray-700 mb-1">
                Zone
              </label>
              <input
                type="text"
                id="birthZone"
                name="birthZone"
                placeholder="Enter zone"
                value={formData.birthZone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.birthZone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                required
              />
              {renderError('birthZone')}
            </div>

            {/* Birth Woreda */}
            <div>
              <label htmlFor="birthWoreda" className="block text-sm font-medium text-gray-700 mb-1">
                Woreda
              </label>
              <input
                type="text"
                id="birthWoreda"
                name="birthWoreda"
                placeholder="Enter woreda"
                value={formData.birthWoreda}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.birthWoreda ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                required
              />
              {renderError('birthWoreda')}
            </div>

            {/* Birth Kebele */}
            <div>
              <label htmlFor="birthKebele" className="block text-sm font-medium text-gray-700 mb-1">
                Kebele
              </label>
              <input
                type="text"
                id="birthKebele"
                name="birthKebele"
                placeholder="Enter kebele"
                value={formData.birthKebele}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.birthKebele ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                required
              />
              {renderError('birthKebele')}
            </div>
          </div>
        </div>

        {/* Current Address Section */}
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mb-6">
          <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center">
            <FiMapPin className="mr-2" /> Current Address
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Current Region */}
            <div>
              <label htmlFor="currentRegion" className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <input
                type="text"
                id="currentRegion"
                name="currentRegion"
                placeholder="Enter region"
                value={formData.currentRegion}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.currentRegion ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
                required
              />
              {renderError('currentRegion')}
            </div>

            {/* Current Zone */}
            <div>
              <label htmlFor="currentZone" className="block text-sm font-medium text-gray-700 mb-1">
                Zone
              </label>
              <input
                type="text"
                id="currentZone"
                name="currentZone"
                placeholder="Enter zone"
                value={formData.currentZone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.currentZone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
                required
              />
              {renderError('currentZone')}
            </div>

            {/* Current Woreda */}
            <div>
              <label htmlFor="currentWoreda" className="block text-sm font-medium text-gray-700 mb-1">
                Woreda
              </label>
              <input
                type="text"
                id="currentWoreda"
                name="currentWoreda"
                placeholder="Enter woreda"
                value={formData.currentWoreda}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.currentWoreda ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
                required
              />
              {renderError('currentWoreda')}
            </div>

            {/* Current Kebele */}
            <div>
              <label htmlFor="currentKebele" className="block text-sm font-medium text-gray-700 mb-1">
                Kebele
              </label>
              <input
                type="text"
                id="currentKebele"
                name="currentKebele"
                placeholder="Enter kebele"
                value={formData.currentKebele}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.currentKebele ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
                required
              />
              {renderError('currentKebele')}
            </div>
          </div>
        </div>

        {/* Case Information Section */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
            <FiFileText className="mr-2" /> Case Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Auto-generated Court Case Number */}
            <div>
              <label htmlFor="courtCaseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Court Case Number (Auto-generated)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="courtCaseNumber"
                  name="courtCaseNumber"
                  value={formData.courtCaseNumber}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-md focus:outline-none cursor-not-allowed"
                />
                <button 
                  type="button"
                  onClick={generateCaseNumber}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
                >
                  Regenerate
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Case number is automatically generated</p>
            </div>

            {/* Case Type */}
            <div>
              <label htmlFor="caseType" className="block text-sm font-medium text-gray-700 mb-1">
                Case Type
              </label>
              <input
                type="text"
                id="caseType"
                name="caseType"
                placeholder="Enter case type"
                value={formData.caseType}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.caseType ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              />
              {renderError('caseType')}
            </div>

            {/* Judge Name */}
            <div>
              <label htmlFor="judgeName" className="block text-sm font-medium text-gray-700 mb-1">
                Judge Name
              </label>
              <input
                type="text"
                id="judgeName"
                name="judgeName"
                placeholder="Enter judge name"
                value={formData.judgeName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.judgeName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              />
              {renderError('judgeName')}
            </div>

            {/* Prison Name */}
            <div>
              <label htmlFor="prisonName" className="block text-sm font-medium text-gray-700 mb-1">
                Prison Name
              </label>
              <input
                type="text"
                id="prisonName"
                name="prisonName"
                placeholder="Enter prison name"
                value={formData.prisonName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.prisonName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              />
              {renderError('prisonName')}
            </div>

            {/* Sentence Year */}
            <div>
              <label htmlFor="sentenceYear" className="block text-sm font-medium text-gray-700 mb-1">
                Sentence Year
              </label>
              <input
                type="number"
                id="sentenceYear"
                name="sentenceYear"
                placeholder="Enter sentence year"
                value={formData.sentenceYear}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.sentenceYear ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
                min="0"
                step="0.1"
              />
              {renderError('sentenceYear')}
            </div>

            {/* Verdict Selection */}
            <div>
              <label htmlFor="verdict" className="block text-sm font-medium text-gray-700 mb-1">
                Verdict
              </label>
              <select
                id="verdict"
                name="verdict"
                value={formData.verdict}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.verdict ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              >
                <option value="">Select Verdict</option>
                <option value="guilty">Guilty</option>
                <option value="not_guilty">Not Guilty</option>
              </select>
              {renderError('verdict')}
            </div>
          </div>
        </div>

        {/* Verdict and Dates Section */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
            <FiCalendar className="mr-2" /> Verdict & Dates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Hearing Date */}
            <div>
              <label htmlFor="hearingDate" className="block text-sm font-medium text-gray-700 mb-1">
                Hearing Date
              </label>
              <input
                type="date"
                id="hearingDate"
                name="hearingDate"
                value={formData.hearingDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.hearingDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              />
              {renderError('hearingDate')}
            </div>

            {/* Effective Date */}
            <div>
              <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700 mb-1">
                Effective Date
              </label>
              <input
                type="date"
                id="effectiveDate"
                name="effectiveDate"
                value={formData.effectiveDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.effectiveDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              />
              {renderError('effectiveDate')}
            </div>

            {/* Send Date */}
            <div>
              <label htmlFor="sendDate" className="block text-sm font-medium text-gray-700 mb-1">
                Send Date
              </label>
              <input
                type="date"
                id="sendDate"
                name="sendDate"
                value={formData.sendDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.sendDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              />
              {renderError('sendDate')}
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
            <FiCheckCircle className="mr-2" /> Instruction Details
          </h3>
          <div>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows="4"
              className={`w-full px-3 py-2 border ${errors.instructions ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter details regarding the verdict or instructions to the prison"
              required
            ></textarea>
            {renderError('instructions')}
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-6">
          <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
            <FiFile className="mr-2" /> Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Reporter Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reporter Signature</label>
              <div className="flex items-center space-x-2">
                <label className="flex-1 cursor-pointer">
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 flex items-center justify-center">
                    <FiUpload className="mr-2" />
                    <span className="text-sm">Upload Signature</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    name="signature"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "signature")}
                  />
                </label>
              </div>
              {signaturePreview && (
                <div className="mt-2 p-2 border border-gray-200 rounded bg-white">
                  <img src={signaturePreview} alt="Signature Preview" className="h-20 mx-auto" />
                </div>
              )}
            </div>

            {/* Attachment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
              <div className="flex items-center space-x-2">
                <label className="flex-1 cursor-pointer">
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 flex items-center justify-center">
                    <FiUpload className="mr-2" />
                    <span className="text-sm">Upload Attachment</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    name="attachment"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, "attachment")}
                    required
                  />
                </label>
              </div>
              {attachmentPreview && (
                <div className="mt-2 p-2 border border-gray-200 rounded bg-white">
                  <div className="text-xs text-gray-500 truncate">{attachment?.name}</div>
                  {attachment?.type.startsWith("image/") && (
                    <img src={attachmentPreview} alt="Attachment Preview" className="h-20 mx-auto mt-1" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mr-3 px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 transition shadow-md disabled:opacity-70 flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <FiSend className="mr-2" /> Send Instruction
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourtInstructions;