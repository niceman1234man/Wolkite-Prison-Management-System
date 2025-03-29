import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { TiArrowBack } from "react-icons/ti";
import { useSelector } from "react-redux";

const AddInmate = ({setOpen}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const inmateData = location.state?.inmateData || {};
  const isTransferApproval = location.state?.isTransferApproval || false;
  const transferId = location.state?.transferId;

  const [formData, setFormData] = useState({
    firstName: inmateData.firstName || "",
    middleName: inmateData.middleName || "",
    lastName: inmateData.lastName || "",
    birthDate: inmateData.birthDate || "",
    age: inmateData.age || "",
    motherName: inmateData.motherName || "",
    gender: inmateData.gender || "",
    birthRegion: inmateData.birthRegion || "",
    birthZone: inmateData.birthZone || "",
    birthWereda: inmateData.birthWereda || "",
    birthKebele: inmateData.birthKebele || "",
    currentRegion: inmateData.currentRegion || "",
    currentZone: inmateData.currentZone || "",
    currentWereda: inmateData.currentWereda || "",
    currentKebele: inmateData.currentKebele || "",
    degreeLevel: inmateData.degreeLevel || "",
    work: inmateData.work || "",
    nationality: inmateData.nationality || "",
    religion: inmateData.religion || "",
    maritalStatus: inmateData.maritalStatus || "",
    height: inmateData.height || "",
    hairType: inmateData.hairType || "",
    face: inmateData.face || "",
    foreHead: inmateData.foreHead || "",
    nose: inmateData.nose || "",
    eyeColor: inmateData.eyeColor || "",
    teeth: inmateData.teeth || "",
    lip: inmateData.lip || "",
    ear: inmateData.ear || "",
    specialSymbol: inmateData.specialSymbol || "",
    contactName: inmateData.contactName || "",
    contactRegion: inmateData.contactRegion || "",
    contactZone: inmateData.contactZone || "",
    contactWereda: inmateData.contactWereda || "",
    contactKebele: inmateData.contactKebele || "",
    phoneNumber: inmateData.phoneNumber || "",
    registrarWorkerName: inmateData.registrarWorkerName || "",
    caseType: inmateData.caseType || "",
    startDate: inmateData.startDate || "",
    sentenceYear: inmateData.sentenceYear || "",
    releaseReason: inmateData.releaseReason || "",
    releasedDate: inmateData.releasedDate || "",
    assignedPrison: inmateData.assignedPrison || "",
    documents: inmateData.documents || []
  });

  const [signature, setSignature] = useState(null);
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

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "signature") {
      setSignature(files[0]);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
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
         setFormData(false);
        toast.success("Inmate Registered Successfully!");
      } else {
        alert("Failed to add inmate.");
      }
    } catch (error) {
      console.error("Error adding inmate:", error);
      alert(error.response?.data?.error || "An error occurred while adding the inmate.");
    }
  };

  return (
    <div className={`p-4 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            {isTransferApproval ? "Register Transferred Inmate" : "Add New Inmate"}
          </h2>
          <button
            onClick={() => navigate("/inmates")}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <TiArrowBack className="mr-2" />
            Back to List
          </button>
        </div>

        {isTransferApproval && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  This form is pre-filled with the transferred inmate's information. Please review and complete any missing fields.
                </p>
              </div>
            </div>
          </div>
        )}

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  placeholder="Enter Middle name"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  placeholder="Enter Last name"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  placeholder="Enter age"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
                <input
                  type="text"
                  name="motherName"
                  placeholder="Enter mother's name"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
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
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select Marital Status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                    <input
                      type="text"
                      name="birthZone"
                      placeholder="Enter birth zone"
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wereda</label>
                    <input
                      type="text"
                      name="birthWereda"
                      placeholder="Enter birth wereda"
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kebele</label>
                    <input
                      type="text"
                      name="birthKebele"
                      placeholder="Enter birth kebele"
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                    <input
                      type="text"
                      name="currentZone"
                      placeholder="Enter current zone"
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wereda</label>
                    <input
                      type="text"
                      name="currentWereda"
                      placeholder="Enter current wereda"
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kebele</label>
                    <input
                      type="text"
                      name="currentKebele"
                      placeholder="Enter current kebele"
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hair Type</label>
                <input
                  type="text"
                  name="hairType"
                  placeholder="Enter hair type"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Face</label>
                <input
                  type="text"
                  name="face"
                  placeholder="Describe face features"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forehead</label>
                <input
                  type="text"
                  name="foreHead"
                  placeholder="Describe forehead"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nose</label>
                <input
                  type="text"
                  name="nose"
                  placeholder="Describe nose"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Eye Color</label>
                <input
                  type="text"
                  name="eyeColor"
                  placeholder="Enter eye color"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teeth</label>
                <input
                  type="text"
                  name="teeth"
                  placeholder="Describe teeth"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lip</label>
                <input
                  type="text"
                  name="lip"
                  placeholder="Describe lip"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ear</label>
                <input
                  type="text"
                  name="ear"
                  placeholder="Describe ear"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Symbol</label>
                <input
                  type="text"
                  name="specialSymbol"
                  placeholder="Enter special symbol"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Region</label>
                <input
                  type="text"
                  name="contactRegion"
                  placeholder="Enter contact region"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Zone</label>
                <input
                  type="text"
                  name="contactZone"
                  placeholder="Enter contact zone"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Wereda</label>
                <input
                  type="text"
                  name="contactWereda"
                  placeholder="Enter contact wereda"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Kebele</label>
                <input
                  type="text"
                  name="contactKebele"
                  placeholder="Enter contact kebele"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  placeholder="Enter phone number"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sentence Year</label>
                <input
                  type="number"
                  name="sentenceYear"
                  value={formData.sentenceYear}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  step="0.5" // Allow decimal values (e.g., 1.5 for 1 year and 6 months)
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Released Date</label>
                <input
                  type="date"
                  name="releasedDate"
                  value={formData.releasedDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  readOnly
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Sentence Reason</label>
                <textarea
                  name="sentenceReason"
                  placeholder="Enter sentence reason"
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
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
              onClick={() => navigate("/inmates")}
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
    </div>
  );
};

export default AddInmate;
