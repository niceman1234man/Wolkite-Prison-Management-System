import React, { useState, useEffect } from "react";
import { FaUser, FaMapMarkerAlt, FaIdCard, FaPhone, FaGavel, FaSpinner, FaEdit } from "react-icons/fa";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from 'react-toastify';

const ViewInmate = ({ inmateId, onEdit }) => {
  const [inmate, setInmate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("personal");
  const [error, setError] = useState(null);

  // Function to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fetch inmate data
  useEffect(() => {
    const fetchInmateData = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/inmates/inmate/${inmateId}`);
        if (response.data) {
          setInmate(response.data);
        } else {
          setError("No inmate data found");
        }
      } catch (error) {
        console.error("Error fetching inmate:", error);
        setError(error.response?.data?.message || "Error fetching inmate data");
        toast.error("Failed to load inmate details");
      } finally {
        setLoading(false);
      }
    };

    if (inmateId) {
      fetchInmateData();
    }
  }, [inmateId]);

  // Function to determine case type badge color
  const getCaseTypeColor = (caseType) => {
    switch (caseType?.toLowerCase()) {
      case 'criminal':
        return 'bg-red-100 text-red-800';
      case 'civil':
        return 'bg-blue-100 text-blue-800';
      case 'administrative':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <FaSpinner className="animate-spin text-blue-600 text-3xl" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">⚠️ {error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // No data state
  if (!inmate) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No inmate data available</p>
      </div>
    );
  }

  // Format name for display
  const fullName = [inmate.firstName, inmate.middleName, inmate.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Inmate Photo */}
      {inmate.photo && (
        <div className="flex justify-center my-4">
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-blue-500">
            <img 
              src={inmate.photo.startsWith('http') ? inmate.photo : `http://localhost:5001${inmate.photo}`} 
              alt={fullName} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/150?text=No+Image";
              }}
            />
          </div>
        </div>
      )}

      {/* Name and Edit Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{fullName}</h2>
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <FaEdit className="mr-2" /> Edit
          </button>
        )}
      </div>

      {/* Quick Info Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Age</span>
          <span className="font-medium">{inmate.age} years</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Gender</span>
          <span className="font-medium capitalize">{inmate.gender}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Case Type</span>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCaseTypeColor(inmate.caseType)}`}>
            {inmate.caseType || "Not specified"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Sentence</span>
          <span className="font-medium">
            {inmate.sentenceYear ? `${inmate.sentenceYear} years` : "Not specified"}
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 border-b">
        <nav className="flex -mb-px overflow-x-auto">
          <button
            onClick={() => setActiveSection("personal")}
            className={`mr-4 py-2 px-4 text-sm font-medium border-b-2 whitespace-nowrap ${
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
            className={`mr-4 py-2 px-4 text-sm font-medium border-b-2 whitespace-nowrap ${
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
            className={`mr-4 py-2 px-4 text-sm font-medium border-b-2 whitespace-nowrap ${
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
            className={`mr-4 py-2 px-4 text-sm font-medium border-b-2 whitespace-nowrap ${
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
            className={`mr-4 py-2 px-4 text-sm font-medium border-b-2 whitespace-nowrap ${
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

      {/* Content Sections */}
      {activeSection === "personal" && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center">
            <FaUser className="mr-2 text-blue-500" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500 block">First Name</span>
              <span className="font-medium">{inmate.firstName || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Middle Name</span>
              <span className="font-medium">{inmate.middleName || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Last Name</span>
              <span className="font-medium">{inmate.lastName || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Birth Date</span>
              <span className="font-medium">{formatDate(inmate.birthDate)}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Age</span>
              <span className="font-medium">{inmate.age} years</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Mother's Name</span>
              <span className="font-medium">{inmate.motherName || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Gender</span>
              <span className="font-medium capitalize">{inmate.gender || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Nationality</span>
              <span className="font-medium">{inmate.nationality || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Religion</span>
              <span className="font-medium">{inmate.religion || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Marital Status</span>
              <span className="font-medium capitalize">{inmate.maritalStatus || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Education Level</span>
              <span className="font-medium">{inmate.degreeLevel || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Occupation</span>
              <span className="font-medium">{inmate.work || "Not specified"}</span>
            </div>
          </div>
        </div>
      )}

      {activeSection === "location" && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center">
            <FaMapMarkerAlt className="mr-2 text-blue-500" />
            Location Information
          </h3>
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div>
              <h4 className="text-lg font-medium mb-3 text-gray-700 flex items-center">
                <span className="inline-block h-3 w-3 rounded-full bg-blue-500 mr-2"></span>
                Birth Place
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-5">
                <div>
                  <span className="text-sm text-gray-500 block">Region</span>
                  <span className="font-medium">{inmate.birthRegion || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">Zone</span>
                  <span className="font-medium">{inmate.birthZone || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">Wereda</span>
                  <span className="font-medium">{inmate.birthWereda || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">Kebele</span>
                  <span className="font-medium">{inmate.birthKebele || "Not specified"}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-3 text-gray-700 flex items-center">
                <span className="inline-block h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                Current Address
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-5">
                <div>
                  <span className="text-sm text-gray-500 block">Region</span>
                  <span className="font-medium">{inmate.currentRegion || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">Zone</span>
                  <span className="font-medium">{inmate.currentZone || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">Wereda</span>
                  <span className="font-medium">{inmate.currentWereda || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">Kebele</span>
                  <span className="font-medium">{inmate.currentKebele || "Not specified"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === "physical" && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center">
            <FaIdCard className="mr-2 text-blue-500" />
            Physical Characteristics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-500 block">Height</span>
              <span className="font-medium">{inmate.height ? `${inmate.height} cm` : "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Hair Type</span>
              <span className="font-medium">{inmate.hairType || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Face</span>
              <span className="font-medium">{inmate.face || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Forehead</span>
              <span className="font-medium">{inmate.foreHead || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Nose</span>
              <span className="font-medium">{inmate.nose || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Eye Color</span>
              <span className="font-medium">{inmate.eyeColor || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Teeth</span>
              <span className="font-medium">{inmate.teeth || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Lip</span>
              <span className="font-medium">{inmate.lip || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Ear</span>
              <span className="font-medium">{inmate.ear || "Not specified"}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm text-gray-500 block">Special Symbol</span>
              <span className="font-medium">{inmate.specialSymbol || "None"}</span>
            </div>
          </div>
        </div>
      )}

      {activeSection === "contact" && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center">
            <FaPhone className="mr-2 text-blue-500" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500 block">Contact Name</span>
              <span className="font-medium">{inmate.contactName || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Phone Number</span>
              <span className="font-medium">{inmate.phoneNumber || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Contact Region</span>
              <span className="font-medium">{inmate.contactRegion || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Contact Zone</span>
              <span className="font-medium">{inmate.contactZone || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Contact Wereda</span>
              <span className="font-medium">{inmate.contactWereda || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Contact Kebele</span>
              <span className="font-medium">{inmate.contactKebele || "Not specified"}</span>
            </div>
          </div>
        </div>
      )}

      {activeSection === "case" && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center">
            <FaGavel className="mr-2 text-blue-500" />
            Case Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500 block">Case Type</span>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCaseTypeColor(inmate.caseType)}`}>
                {inmate.caseType || "Not specified"}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Sentence Year</span>
              <span className="font-medium">
                {inmate.sentenceYear ? `${inmate.sentenceYear} years` : "Not specified"}
              </span>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm text-gray-500 block">Sentence Reason</span>
              <span className="font-medium">{inmate.sentenceReason || "Not specified"}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Start Date</span>
              <span className="font-medium">{formatDate(inmate.startDate)}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Release Date</span>
              <span className="font-medium">{formatDate(inmate.releasedDate)}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Parole Date</span>
              <span className="font-medium">{formatDate(inmate.paroleDate)}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Duration to Parole</span>
              <span className="font-medium">{inmate.durationToParole || "Not specified"}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm text-gray-500 block">Duration from Parole to End</span>
              <span className="font-medium">{inmate.durationFromParoleToEnd || "Not specified"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewInmate; 