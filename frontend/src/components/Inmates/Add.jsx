import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { TiArrowBack } from "react-icons/ti";
import { validateInmateField, validateInmateForm } from "../../utils/formValidation";
import { FaUser, FaMapMarkerAlt, FaIdCard, FaPhone, FaGavel } from "react-icons/fa";

// CSS for animations
const styles = {
  fadeIn: `
    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(10px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out forwards;
    }
  `,
};

const AddInmate = ({setOpen}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialData = location.state?.initialData || {};

  const [formData, setFormData] = useState({
    firstName: initialData.firstName || "",
    middleName: initialData.middleName || "",
    lastName: initialData.lastName || "",
    birthDate: initialData.birthDate || "",
    age: initialData.age || "",
    motherName: initialData.motherName || "",
    gender: initialData.gender || "",
    birthRegion: initialData.birthRegion || "",
    birthZone: initialData.birthZone || "",
    birthWereda: initialData.birthWereda || "",
    birthKebele: initialData.birthKebele || "",
    currentRegion: initialData.currentRegion || "",
    currentZone: initialData.currentZone || "",
    currentWereda: initialData.currentWereda || "",
    currentKebele: initialData.currentKebele || "",
    degreeLevel: initialData.degreeLevel || "",
    work: initialData.work || "",
    nationality: initialData.nationality || "",
    religion: initialData.religion || "",
    maritalStatus: initialData.maritalStatus || "",
    height: initialData.height || "",
    hairType: initialData.hairType || "",
    face: initialData.face || "",
    foreHead: initialData.foreHead || "",
    nose: initialData.nose || "",
    eyeColor: initialData.eyeColor || "",
    teeth: initialData.teeth || "",
    lip: initialData.lip || "",
    ear: initialData.ear || "",
    specialSymbol: initialData.specialSymbol || "",
    contactName: initialData.contactName || "",
    contactRegion: initialData.contactRegion || "",
    contactZone: initialData.contactZone || "",
    contactWereda: initialData.contactWereda || "",
    contactKebele: initialData.contactKebele || "",
    phoneNumber: initialData.phoneNumber || "",
    registrarWorkerName: initialData.registrarWorkerName || "",
    caseType: initialData.caseType || "",
    startDate: initialData.startDate || "",
    sentenceYear: initialData.sentenceYear || "",
    sentenceReason: initialData.sentenceReason || "",
    releasedDate: initialData.releasedDate || "",
    paroleDate: initialData.paroleDate || "",
    durationToParole: initialData.durationToParole || "",
    durationFromParoleToEnd: initialData.durationFromParoleToEnd || ""
  });

  const [activeSection, setActiveSection] = useState("personal");
  const [signature, setSignature] = useState(null);
  const [inmatePhoto, setInmatePhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to calculate age from birthdate
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();

    // Adjust age if the birthday hasn't occurred yet this year
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Update age when birthDate changes
  useEffect(() => {
    if (formData.birthDate) {
      const age = calculateAge(formData.birthDate);
      setFormData((prevData) => ({
        ...prevData,
        age: age.toString(),
      }));
    }
  }, [formData.birthDate]);

  // Function to calculate parole date
  const calculateParoleDate = (startDate, sentenceYear) => {
    if (!startDate || !sentenceYear) return null;
    
    const start = new Date(startDate);
    const twoThirdsYears = (parseFloat(sentenceYear) * 2) / 3;
    
    // Split the two-thirds years into full years and months
    const fullYears = Math.floor(twoThirdsYears);
    const fractionalYear = twoThirdsYears - fullYears;
    const months = Math.round(fractionalYear * 12);
    
    // Add full years and months to the start date
    start.setFullYear(start.getFullYear() + fullYears);
    start.setMonth(start.getMonth() + months);
    
    return start.toISOString().split('T')[0];
  };

  // Function to calculate duration between two dates in years and months
  const calculateDuration = (date1, date2) => {
    if (!date1 || !date2) return null;
    
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // Calculate years
    let years = d2.getFullYear() - d1.getFullYear();
    let months = d2.getMonth() - d1.getMonth();
    
    // Adjust for negative months
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // If months is 0, just return years
    if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    
    return `${years} year${years !== 1 ? 's' : ''} and ${months} month${months !== 1 ? 's' : ''}`;
  };

  // Calculate parole and release dates when start date or sentence year changes
  useEffect(() => {
    if (formData.startDate && formData.sentenceYear) {
      const startDate = new Date(formData.startDate);
      const sentenceYears = parseFloat(formData.sentenceYear);

      // Calculate parole date (2/3 of sentence)
      const paroleDate = calculateParoleDate(formData.startDate, formData.sentenceYear);
      
      // Calculate release date
      const fullYears = Math.floor(sentenceYears);
      const fractionalYear = sentenceYears - fullYears;
      const months = Math.round(fractionalYear * 12);
      startDate.setFullYear(startDate.getFullYear() + fullYears);
      startDate.setMonth(startDate.getMonth() + months);
      const releaseDate = startDate.toISOString().split('T')[0];

      // Calculate durations
      const durationToParole = calculateDuration(formData.startDate, paroleDate);
      const durationFromParoleToEnd = calculateDuration(paroleDate, releaseDate);

      setFormData(prevData => ({
        ...prevData,
        releasedDate: releaseDate,
        paroleDate: paroleDate,
        durationToParole: durationToParole,
        durationFromParoleToEnd: durationFromParoleToEnd
      }));
    }
  }, [formData.startDate, formData.sentenceYear]);

  // Handle form input changes with validation
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "signature") {
      setSignature(files[0]);
    } else if (name === "inmatePhoto") {
      setInmatePhoto(files[0]);
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
      
      // Mark field as touched
      if (!touched[name]) {
        setTouched(prev => ({
          ...prev,
          [name]: true
        }));
      }
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

  // Handle form submission with validation
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
      
      // Navigate to the section with the first error
      const firstErrorField = Object.keys(formErrors)[0];
      const sectionMap = {
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
      
      // Switch to the section containing the error
      const sectionWithError = sectionMap[firstErrorField] || "personal";
      setActiveSection(sectionWithError);
      
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
    
    // Set submitting state to show loading indicator
    setIsSubmitting(true);
    
    try {
      // Create an object with the exact structure expected by the backend
      const inmateData = {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        birthDate: formData.birthDate,
        age: parseInt(formData.age, 10),
        motherName: formData.motherName || "",
        gender: formData.gender,
        birthRegion: formData.birthRegion || "",
        birthZone: formData.birthZone || "",
        birthWereda: formData.birthWereda || "",
        birthKebele: formData.birthKebele || "",
        currentRegion: formData.currentRegion || "",
        currentZone: formData.currentZone || "",
        currentWereda: formData.currentWereda || "",
        currentKebele: formData.currentKebele || "",
        degreeLevel: formData.degreeLevel || "",
        work: formData.work || "",
        nationality: formData.nationality || "",
        religion: formData.religion || "",
        maritalStatus: formData.maritalStatus || "",
        height: formData.height ? parseFloat(formData.height) : 0,
        hairType: formData.hairType || "",
        face: formData.face || "",
        foreHead: formData.foreHead || "",
        nose: formData.nose || "",
        eyeColor: formData.eyeColor || "",
        teeth: formData.teeth || "",
        lip: formData.lip || "",
        ear: formData.ear || "",
        specialSymbol: formData.specialSymbol || "",
        contactName: formData.contactName || "",
        contactRegion: formData.contactRegion || "",
        contactZone: formData.contactZone || "",
        contactWereda: formData.contactWereda || "",
        contactKebele: formData.contactKebele || "",
        phoneNumber: formData.phoneNumber || "",
        caseType: formData.caseType || "",
        startDate: formData.startDate || "",
        sentenceYear: formData.sentenceYear ? parseFloat(formData.sentenceYear) : 0,
        sentenceReason: formData.sentenceReason || "",
        releasedDate: formData.releasedDate || "",
        paroleDate: formData.paroleDate || "",
        durationToParole: formData.durationToParole || "",
        durationFromParoleToEnd: formData.durationFromParoleToEnd || ""
      };
      
      console.log("Submitting inmate data:", inmateData);
      
      // If we have a photo, use FormData to send both JSON and file
      if (inmatePhoto) {
        const formDataToSend = new FormData();
        
        // Add all the JSON data as a single field
        formDataToSend.append('inmateData', JSON.stringify(inmateData));
        
        // Add the photo
        formDataToSend.append('inmatePhoto', inmatePhoto);
        
        // Add signature if available
        if (signature) {
          formDataToSend.append('signature', signature);
        }
        
        const response = await axiosInstance.post("/inmates/new-inmate", formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data) {
          toast.success("Inmate Registered Successfully!");
          
          // If in a modal, close it
          if (setOpen) {
            setOpen(false);
          } else {
            // Otherwise navigate to inmates list
            navigate("/securityStaff-dashboard/inmates");
          }
        } else {
          toast.error("Failed to add inmate.");
        }
      } else {
        // No photo, just send JSON data
        const response = await axiosInstance.post("/inmates/new-inmate", inmateData);
        
        if (response.data) {
          toast.success("Inmate Registered Successfully!");
          
          // If in a modal, close it
          if (setOpen) {
            setOpen(false);
          } else {
            // Otherwise navigate to inmates list
            navigate("/securityStaff-dashboard/inmates");
          }
        } else {
          toast.error("Failed to add inmate.");
        }
      }
    } catch (error) {
      console.error("Error adding inmate:", error);
      
      if (error.response) {
        console.error("Server response:", error.response.status, error.response.data);
        toast.error(typeof error.response.data === 'string' 
          ? error.response.data 
          : (error.response.data?.error || "Server error"));
      } else if (error.request) {
        console.error("No response received:", error.request);
        toast.error("No response from server. Please try again.");
      } else {
        console.error("Request error:", error.message);
        toast.error("Request failed: " + error.message);
      }
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
        <h2 className="text-3xl font-bold text-gray-800">Add New Inmate</h2>
        <button
          onClick={() => navigate("/securityStaff-dashboard/inmates")}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <TiArrowBack className="mr-2" />
          Back to List
        </button>
      </div>

      {/* Form Tabs Navigation */}
      <div className="mb-8 border-b">
        <nav className="flex -mb-px">
          <button 
            onClick={() => setActiveSection("personal")}
            className={`mr-4 py-2 px-4 text-sm font-medium border-b-2 ${
              activeSection === "personal" 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } flex items-center`}
          >
            <FaUser className="mr-2" />
            Personal Information
          </button>
          <button 
            onClick={() => setActiveSection("location")}
            className={`mr-4 py-2 px-4 text-sm font-medium border-b-2 ${
              activeSection === "location" 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } flex items-center`}
          >
            <FaMapMarkerAlt className="mr-2" />
            Location
          </button>
          <button 
            onClick={() => setActiveSection("physical")}
            className={`mr-4 py-2 px-4 text-sm font-medium border-b-2 ${
              activeSection === "physical" 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } flex items-center`}
          >
            <FaIdCard className="mr-2" />
            Physical Characteristics
          </button>
          <button 
            onClick={() => setActiveSection("contact")}
            className={`mr-4 py-2 px-4 text-sm font-medium border-b-2 ${
              activeSection === "contact" 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } flex items-center`}
          >
            <FaPhone className="mr-2" />
            Contact
          </button>
          <button 
            onClick={() => setActiveSection("case")}
            className={`mr-4 py-2 px-4 text-sm font-medium border-b-2 ${
              activeSection === "case" 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } flex items-center`}
          >
            <FaGavel className="mr-2" />
            Case & Parole
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information Section */}
        {activeSection === "personal" && (
          <div className="bg-gray-50 p-6 rounded-lg animate-fadeIn">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center">
              <FaUser className="mr-2 text-blue-500" />
              Personal Information
            </h3>
            
            {/* Photo Upload Section */}
            <div className="mb-6 flex flex-col items-center p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">Inmate Photo</label>
              <div className="w-32 h-32 bg-gray-200 rounded-full mb-3 flex items-center justify-center overflow-hidden">
                {inmatePhoto ? (
                  <img 
                    src={URL.createObjectURL(inmatePhoto)} 
                    alt="Inmate preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUser className="text-gray-400 text-4xl" />
                )}
              </div>
              <input
                type="file"
                id="inmatePhoto"
                name="inmatePhoto"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
              />
              <label
                htmlFor="inmatePhoto"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
              >
                {inmatePhoto ? "Change Photo" : "Upload Photo"}
              </label>
              {inmatePhoto && (
                <button
                  type="button"
                  onClick={() => setInmatePhoto(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Remove Photo
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age (Calculated)</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  placeholder="Auto-calculated"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-100 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-not-allowed"
                  readOnly
                />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
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
                <input
                  type="text"
                  name="religion"
                  value={formData.religion}
                  placeholder="Enter religion"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 border ${errors.religion ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                />
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
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
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
                  <option value="None">None</option>
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor">Bachelor's Degree</option>
                  <option value="Masters">Master's Degree</option>
                  <option value="PhD">PhD</option>
                </select>
                {renderError('degreeLevel')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                <input
                  type="text"
                  name="work"
                  value={formData.work}
                  placeholder="Enter occupation"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 border ${errors.work ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                />
                {renderError('work')}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button 
                type="button" 
                onClick={() => setActiveSection("location")}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center"
              >
                Next <FaMapMarkerAlt className="ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Location Section */}
        {activeSection === "location" && (
          <div className="bg-gray-50 p-6 rounded-lg animate-fadeIn">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-blue-500" />
              Location Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-medium mb-4 text-gray-700 flex items-center">
                  <span className="inline-block h-3 w-3 rounded-full bg-blue-500 mr-2"></span>
                  Birth Place
                </h4>
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
                  <h4 className="text-xl font-medium mb-4 text-gray-700 flex items-center">
                    <span className="inline-block h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                    Current Address
                  </h4>
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
            <div className="flex justify-between mt-6">
              <button 
                type="button" 
                onClick={() => setActiveSection("personal")}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center"
              >
                <FaUser className="mr-2" /> Previous
              </button>
              <button 
                type="button" 
                onClick={() => setActiveSection("physical")}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center"
              >
                Next <FaIdCard className="ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Physical Characteristics Section */}
        {activeSection === "physical" && (
          <div className="bg-gray-50 p-6 rounded-lg animate-fadeIn">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center">
              <FaIdCard className="mr-2 text-blue-500" />
              Physical Characteristics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  placeholder="Enter height"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 border ${errors.height ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                />
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
                  <option value="">Select hair type</option>
                  <option value="Straight">Straight</option>
                  <option value="Wavy">Wavy</option>
                  <option value="Curly">Curly</option>
                  <option value="Coily">Coily</option>
                  <option value="Bald">Bald</option>
                  <option value="Thin">Thin</option>
                  <option value="Thick">Thick</option>
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
                  <option value="">Select face shape</option>
                  <option value="Oval">Oval</option>
                  <option value="Round">Round</option>
                  <option value="Square">Square</option>
                  <option value="Heart">Heart</option>
                  <option value="Diamond">Diamond</option>
                  <option value="Rectangle">Rectangle</option>
                  <option value="Triangle">Triangle</option>
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
                  <option value="">Select forehead type</option>
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Broad">Broad</option>
                  <option value="Prominent">Prominent</option>
                  <option value="High">High</option>
                  <option value="Low">Low</option>
                  <option value="Sloping">Sloping</option>
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
                  <option value="">Select nose type</option>
                  <option value="Straight">Straight</option>
                  <option value="Aquiline">Aquiline</option>
                  <option value="Button">Button</option>
                  <option value="Bulbous">Bulbous</option>
                  <option value="Roman">Roman</option>
                  <option value="Snub">Snub</option>
                  <option value="Hawk">Hawk</option>
                  <option value="Greek">Greek</option>
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
                  <option value="">Select eye color</option>
                  <option value="Brown">Brown</option>
                  <option value="Blue">Blue</option>
                  <option value="Green">Green</option>
                  <option value="Gray">Gray</option>
                  <option value="Hazel">Hazel</option>
                  <option value="Gray">Gray</option>
                  <option value="Blue">Blue</option>
                  <option value="Gray">Gray</option>
                </select>
                {renderError('eyeColor')}
              </div>
            </div>
          </div>
        )}

        {/* Contact Section */}
        {activeSection === "contact" && (
          <div className="bg-gray-50 p-6 rounded-lg animate-fadeIn">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center">
              <FaPhone className="mr-2 text-blue-500" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
        )}

        {/* Case Section */}
        {activeSection === "case" && (
          <div className="bg-gray-50 p-6 rounded-lg animate-fadeIn">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center">
              <FaGavel className="mr-2 text-blue-500" />
              Case Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
                <select
                  name="caseType"
                  value={formData.caseType}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 border ${errors.caseType ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                >
                  <option value="">Select case type</option>
                  <option value="Criminal">Criminal</option>
                  <option value="Civil">Civil</option>
                  <option value="Administrative">Administrative</option>
                </select>
                {renderError('caseType')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sentence Year</label>
                <input
                  type="number"
                  name="sentenceYear"
                  value={formData.sentenceYear}
                  placeholder="Enter sentence year"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 border ${errors.sentenceYear ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                />
                {renderError('sentenceYear')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sentence Reason</label>
                <input
                  type="text"
                  name="sentenceReason"
                  value={formData.sentenceReason}
                  placeholder="Enter sentence reason"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 border ${errors.sentenceReason ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                />
                {renderError('sentenceReason')}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Released Date</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Parole Date</label>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration to Parole</label>
                <input
                  type="text"
                  name="durationToParole"
                  value={formData.durationToParole}
                  placeholder="Enter duration to parole"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 border ${errors.durationToParole ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                />
                {renderError('durationToParole')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration from Parole to End</label>
                <input
                  type="text"
                  name="durationFromParoleToEnd"
                  value={formData.durationFromParoleToEnd}
                  placeholder="Enter duration from parole to end"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 border ${errors.durationFromParoleToEnd ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                />
                {renderError('durationFromParoleToEnd')}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddInmate;