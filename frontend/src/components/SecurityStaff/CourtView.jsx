import React, { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaCalendarAlt, FaGavel, FaFileAlt, FaCheck, FaBuilding, FaSignature, FaArrowLeft, FaUserPlus, FaUser, FaMapMarkerAlt, FaBirthdayCake, FaIdCard } from "react-icons/fa";

// Helper function to calculate age from birthdate
const calculateAge = (birthdate) => {
  if (!birthdate) return "N/A";
  
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

// Format date to localized string
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

const CourtView = ({ id }) => {
  const navigate = useNavigate();
  const [instruction, setInstruction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
  useEffect(() => {
    const fetchInstruction = async () => {
      try {
        const response = await axiosInstance.get(`/instruction/get-instruct/${id}`);
        if (response.data && response.data.instruction) {
          setInstruction(response.data.instruction);
        } else {
          setError("Instruction details not found.");
        }
      } catch (error) {
        console.error("Error fetching instruction details:", error);
        setError(error.response?.data?.error || "An error occurred while fetching instruction details.");
      } finally {
        setLoading(false);
      }
    };

    fetchInstruction();
  }, [id]);
 
  const handleAddToInmate = () => {
    const initialData = {
      fullName: `${instruction.firstName} ${instruction.middleName} ${instruction.lastName}`, 
      gender: instruction.gender,
      age: calculateAge(instruction.birthdate),
      birthdate: instruction.birthdate,
      nationality: instruction.nationality,
      maritalStatus: instruction.maritalStatus,
      educationLevel: instruction.educationLevel,
      occupation: instruction.occupation,
      // Address information can also be included
      birthRegion: instruction.birthRegion,
      birthZone: instruction.birthZone,
      birthWoreda: instruction.birthWoreda,
      birthKebele: instruction.birthKebele,
      currentRegion: instruction.currentRegion,
      currentZone: instruction.currentZone,
      currentWoreda: instruction.currentWoreda,
      currentKebele: instruction.currentKebele,
    };
    navigate("/securityStaff-dashboard/add-inmate", { state: { initialData } });
    toast.success("Inmate details prepared for adding");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-10 bg-red-50 p-6 rounded-lg border border-red-200 text-center">
        <div className="text-red-600 font-semibold mb-4">{error}</div>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          <FaArrowLeft className="inline mr-2" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-6 mb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-t-lg shadow-md">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 bg-white bg-opacity-20 text-white p-2 rounded-full hover:bg-opacity-30 transition-colors"
            >
              <FaArrowLeft />
            </button>
            <h2 className="text-xl font-bold text-white">Court Instruction Details</h2>
          </div>
          
          <button
            onClick={handleAddToInmate}
            className="bg-white text-blue-600 font-medium py-1.5 px-4 rounded-md hover:bg-blue-50 transition-colors flex items-center"
          >
            <FaUserPlus className="mr-2" /> Add To Inmate
          </button>
        </div>
        
        {/* Case Number Banner */}
        <div className="bg-white bg-opacity-10 text-white px-6 py-2 text-sm font-medium">
          <span className="mr-2">Case Number:</span>
          <span className="font-bold">{instruction.courtCaseNumber}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-white rounded-b-lg shadow-md p-6 border border-gray-200">
        {/* Personal Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center border-b pb-2">
            <FaUser className="mr-2 text-indigo-600" /> Personal Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Full Name</h4>
              <p className="text-base font-medium text-gray-800">
                {instruction.firstName} {instruction.middleName} {instruction.lastName}
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center">
                <FaBirthdayCake className="mr-1 text-indigo-500" size={12} /> Birth Date
              </h4>
              <p className="text-base font-medium text-gray-800">
                {formatDate(instruction.birthdate)}
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center">
                <FaIdCard className="mr-1 text-indigo-500" size={12} /> Age
              </h4>
              <p className="text-base font-medium text-gray-800">
                {calculateAge(instruction.birthdate)}
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Gender</h4>
              <p className="text-base font-medium text-gray-800">
                {instruction.gender ? instruction.gender.charAt(0).toUpperCase() + instruction.gender.slice(1) : "N/A"}
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Nationality</h4>
              <p className="text-base font-medium text-gray-800">
                {instruction.nationality || "N/A"}
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Marital Status</h4>
              <p className="text-base font-medium text-gray-800">
                {instruction.maritalStatus ? instruction.maritalStatus.charAt(0).toUpperCase() + instruction.maritalStatus.slice(1) : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Address Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center border-b pb-2">
            <FaMapMarkerAlt className="mr-2 text-green-600" /> Address Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h4 className="text-sm font-semibold text-green-800 mb-2">Birth Address</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Region</p>
                  <p className="font-medium">{instruction.birthRegion || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Zone</p>
                  <p className="font-medium">{instruction.birthZone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Woreda</p>
                  <p className="font-medium">{instruction.birthWoreda || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Kebele</p>
                  <p className="font-medium">{instruction.birthKebele || "N/A"}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <h4 className="text-sm font-semibold text-amber-800 mb-2">Current Address</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Region</p>
                  <p className="font-medium">{instruction.currentRegion || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Zone</p>
                  <p className="font-medium">{instruction.currentZone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Woreda</p>
                  <p className="font-medium">{instruction.currentWoreda || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Kebele</p>
                  <p className="font-medium">{instruction.currentKebele || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Case Information Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center border-b pb-2">
            <FaFileAlt className="mr-2 text-blue-600" /> Case Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Information Cards */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center">
                <FaBuilding className="mr-2 text-blue-500" /> Prison Name
              </h3>
              <p className="text-lg font-medium text-gray-800">{instruction.prisonName}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center">
                <FaGavel className="mr-2 text-blue-500" /> Judge Name
              </h3>
              <p className="text-lg font-medium text-gray-800">{instruction.judgeName}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center">
                <FaCheck className="mr-2 text-blue-500" /> Verdict
              </h3>
              <p className={`text-lg font-medium ${
                instruction.verdict === "guilty" ? "text-red-600" : 
                instruction.verdict === "not_guilty" ? "text-green-600" : "text-gray-800"
              }`}>
                {instruction.verdict === "guilty" ? "Guilty" : 
                instruction.verdict === "not_guilty" ? "Not Guilty" : instruction.verdict}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center">
                <FaCalendarAlt className="mr-2 text-blue-500" /> Hearing Date
              </h3>
              <p className="text-lg font-medium text-gray-800">
                {formatDate(instruction.hearingDate)}
              </p>
            </div>

            {/* Full width instruction text */}
            <div className="md:col-span-2 bg-blue-50 p-5 rounded-lg border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-800 uppercase mb-3 flex items-center">
                <FaFileAlt className="mr-2 text-blue-500" /> Instructions
              </h3>
              <p className="text-gray-800 whitespace-pre-line">{instruction.instructions}</p>
            </div>

            {/* Additional dates */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center">
                <FaCalendarAlt className="mr-2 text-blue-500" /> Effective Date
              </h3>
              <p className="text-lg font-medium text-gray-800">
                {formatDate(instruction.effectiveDate)}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center">
                <FaCalendarAlt className="mr-2 text-blue-500" /> Send Date
              </h3>
              <p className="text-lg font-medium text-gray-800">
                {formatDate(instruction.sendDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Document section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center">
              <FaFileAlt className="mr-2 text-blue-500" /> Attachment
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-center">
              <img
                src={`https://localhost:4000/uploads/${instruction.attachment}`}
                alt="Attachment"
                className="max-h-[300px] object-contain"
              />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center">
              <FaSignature className="mr-2 text-blue-500" /> Signature
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-center">
              <img
                src={`https://localhost:4000/uploads/${instruction.signature}`}
                alt="Signature"
                className="max-h-[200px] object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourtView;
