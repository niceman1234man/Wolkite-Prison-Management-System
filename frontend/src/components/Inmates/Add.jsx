import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { TiArrowBack } from "react-icons/ti";
import { validateInmateField, validateInmateForm } from "../../utils/formValidation";

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
    releaseReason: initialData.releaseReason || "",
    releasedDate: initialData.releasedDate || "",
    paroleDate: initialData.paroleDate || "",
    durationToParole: initialData.durationToParole || "",
    durationFromParoleToEnd: initialData.durationFromParoleToEnd || ""
  });

  const [signature, setSignature] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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

  // Handle form input changes with validation
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "signature") {
      setSignature(files[0]);
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
      
      // Scroll to first error
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return;
    }
    
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });
    if (signature) {
      data.append("signature", signature);
    }

    try {
      const response = await axiosInstance.post("/inmates/new-inmate", data);
      if (response.data) {
        setOpen && setOpen(false);
        toast.success("Inmate Registered Successfully!");
        navigate("/securityStaff-dashboard/inmates");
      } else {
        toast.error("Failed to add inmate.");
      }
    } catch (error) {
      console.error("Error adding inmate:", error);
      toast.error(error.response?.data?.error || "An error occurred while adding the inmate.");
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

      <form onSubmit={handleSubmit} className="space-y-8">
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
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Marital Status
            </label>
            <select
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.maritalStatus ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select Marital Status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
            {renderError('maritalStatus')}
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
            <input
              type="number"
              name="height"
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
              onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.eyeColor ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              >
                <option value="">Select eye color</option>
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
              onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.teeth ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              >
                <option value="">Select teeth description</option>
                <option value="Straight">Straight</option>
                <option value="Crooked">Crooked</option>
                <option value="Gapped">Gapped</option>
                <option value="Missing">Missing</option>
                <option value="Gold">Gold/Metal</option>
                <option value="Discolored">Discolored</option>
                <option value="Large">Large</option>
                <option value="Small">Small</option>
              </select>
              {renderError('teeth')}
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lip</label>
              <select
              name="lip"
              onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.lip ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              >
                <option value="">Select lip type</option>
                <option value="Thin">Thin</option>
                <option value="Medium">Medium</option>
                <option value="Full">Full</option>
                <option value="Heart-shaped">Heart-shaped</option>
                <option value="Wide">Wide</option>
                <option value="Narrow">Narrow</option>
                <option value="Asymmetric">Asymmetric</option>
              </select>
              {renderError('lip')}
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ear</label>
              <select
              name="ear"
              onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.ear ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              >
                <option value="">Select ear type</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
                <option value="Attached">Attached</option>
                <option value="Detached">Detached</option>
                <option value="Round">Round</option>
                <option value="Pointed">Pointed</option>
                <option value="Asymmetric">Asymmetric</option>
              </select>
              {renderError('ear')}
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Symbol</label>
            <input
              type="text"
              name="specialSymbol"
              placeholder="Enter special symbol"
              onChange={handleChange}
                onBlur={handleBlur}
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
                placeholder="Enter phone number (e.g., 0912345678)"
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
            <input
              type="text"
              name="caseType"
              placeholder="Enter case type"
              onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border ${errors.caseType ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
            />
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
              step="0.5" // Allow decimal values (e.g., 1.5 for 1 year and 6 months)
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

        {/* Parole Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Parole Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-700">Parole Date (2/3 of sentence)</h4>
              <p className="text-gray-900">{formData.paroleDate || 'Not available'}</p>
          </div>
          
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-700">Duration Until Parole</h4>
              <p className="text-gray-900">{formData.durationToParole || 'Not available'}</p>
            </div>
          
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-700">Duration From Parole to Release</h4>
              <p className="text-gray-900">{formData.durationFromParoleToEnd || 'Not available'}</p>
            </div>
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
          >
            Add Inmate
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddInmate;
