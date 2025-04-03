import axiosInstance from "../../utils/axiosInstance";
import React, { useState, useEffect } from "react";
import ParoleRequestForm from "@/parole/ParoleRequestForm";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCalendarAlt, FaUser, FaBalanceScale, FaClock, FaCalendarCheck, 
  FaUserCheck, FaCheckCircle, FaTimesCircle, FaSpinner, FaPaperPlane } from "react-icons/fa";

const ViewParole = ({ id }) => {
  const [inmates, setInmates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openAccept, setOpenAccept] = useState(false);

  // Fetch parole details
  const fetchInmates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/parole-tracking/${id}`);

      if (response.data && response.data.parole) {
        setInmates(response.data.parole);
      } else {
        console.error("Invalid API response:", response.data);
        setInmates(null);
      }
    } catch (error) {
      console.error("Error fetching parole:", error);
      setInmates(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInmates();
  }, [id]);

  // Handle parole request
  const requestHandle = async () => {
    try {
      await axiosInstance.post(`/parole-request`, { inmateId: id });
      toast.success("Parole request submitted successfully!");
      setOpenAccept(false);
    } catch (error) {
      console.error("Error submitting parole request:", error);
      toast.error(error.response?.data?.message || "Failed to submit parole request.");
    }
  };

  // Calculate duration between two dates
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "Not available";
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start) || isNaN(end)) return "Invalid Date";

    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    
    const totalMonths = (yearDiff * 12) + monthDiff;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    return years && months ? `${years} years and ${months} months` : years ? `${years} years` : `${months} months`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid Date";
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  // Prepare parole object
  const parole = inmates
    ? {
        inmateId: id,
        name: inmates.fullName,
        case: inmates.caseType,
        start: inmates.startDate ? formatDate(inmates.startDate) : "N/A",
        paroleDate: inmates.paroleDate ? formatDate(inmates.paroleDate) : "N/A",
        end: inmates.releasedDate ? formatDate(inmates.releasedDate) : "N/A",
        point: inmates.totalPoints,
        year: inmates.sentenceYear,
        durationToParole: calculateDuration(inmates.startDate, inmates.paroleDate),
        durationFromParoleToEnd: calculateDuration(inmates.paroleDate, inmates.releasedDate),
      }
    : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <FaSpinner className="animate-spin text-teal-600 text-3xl mx-auto mb-4" />
          <p className="text-gray-600">Loading parole details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {inmates ? (
        <>
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center">
                  <FaUser className="mr-3" />
                  {inmates.fullName}
                </h1>
                <p className="text-teal-100 mt-1">Parole Eligibility Details</p>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  inmates.paroleEligible 
                    ? 'bg-teal-800 bg-opacity-50 text-white' 
                    : 'bg-red-800 bg-opacity-50 text-white'
                }`}>
                  {inmates.paroleEligible ? 'Eligible for Parole' : 'Not Eligible'}
                </span>
                
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  getStatusBadgeClass(inmates.status)
                }`}>
                  {inmates.status || "Not Processed"}
                </span>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information Card */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FaUser className="mr-2 text-teal-600" />
                    Personal Information
                  </h2>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex border-b border-gray-100 pb-3">
                    <div className="w-1/2 text-gray-600">Name</div>
                    <div className="w-1/2 font-medium text-gray-800">{inmates.fullName}</div>
                  </div>
                  
                  <div className="flex border-b border-gray-100 pb-3">
                    <div className="w-1/2 text-gray-600">Age</div>
                    <div className="w-1/2 font-medium text-gray-800">{inmates.age || "N/A"}</div>
                  </div>
                  
                  <div className="flex border-b border-gray-100 pb-3">
                    <div className="w-1/2 text-gray-600">Gender</div>
                    <div className="w-1/2 font-medium text-gray-800">{inmates.gender || "N/A"}</div>
                  </div>
                  
                  <div className="flex border-b border-gray-100 pb-3">
                    <div className="w-1/2 text-gray-600">Case Type</div>
                    <div className="w-1/2 font-medium text-gray-800">{inmates.caseType || "N/A"}</div>
                  </div>
                  
                  <div className="flex">
                    <div className="w-1/2 text-gray-600">Total Points</div>
                    <div className="w-1/2 font-medium text-gray-800">
                      <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-sm">
                        {inmates.totalPoints || "0"} points
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sentence Timeline Card */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FaBalanceScale className="mr-2 text-teal-600" />
                    Sentence Information
                  </h2>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex border-b border-gray-100 pb-3">
                    <div className="w-1/2 text-gray-600">Sentence Duration</div>
                    <div className="w-1/2 font-medium text-gray-800">{inmates.sentenceYear || "N/A"}</div>
                  </div>
                  
                  <div className="flex border-b border-gray-100 pb-3">
                    <div className="w-1/2 text-gray-600">Start Date</div>
                    <div className="w-1/2 font-medium text-gray-800 flex items-center">
                      <FaCalendarAlt className="mr-2 text-gray-400" />
                      {parole?.start}
                    </div>
                  </div>
                  
                  <div className="flex border-b border-gray-100 pb-3">
                    <div className="w-1/2 text-gray-600">Parole Date</div>
                    <div className="w-1/2 font-medium text-gray-800 flex items-center">
                      <FaCalendarCheck className="mr-2 text-gray-400" />
                      {parole?.paroleDate}
                    </div>
                  </div>
                  
                  <div className="flex border-b border-gray-100 pb-3">
                    <div className="w-1/2 text-gray-600">Release Date</div>
                    <div className="w-1/2 font-medium text-gray-800 flex items-center">
                      <FaCalendarAlt className="mr-2 text-gray-400" />
                      {parole?.end}
                    </div>
                  </div>
                  
                  <div className="flex border-b border-gray-100 pb-3">
                    <div className="w-1/2 text-gray-600">Time Until Parole</div>
                    <div className="w-1/2 font-medium text-gray-800 flex items-center">
                      <FaClock className="mr-2 text-gray-400" />
                      {parole?.durationToParole}
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="w-1/2 text-gray-600">Remaining After Parole</div>
                    <div className="w-1/2 font-medium text-gray-800 flex items-center">
                      <FaClock className="mr-2 text-gray-400" />
                      {parole?.durationFromParoleToEnd}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Parole Status Card */}
            <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <FaUserCheck className="mr-2 text-teal-600" />
                Parole Status
              </h3>
              
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  {inmates.status === "accepted" && (
                    <div className="flex items-center text-green-600">
                      <FaCheckCircle className="mr-2" />
                      <span>Parole request has been approved</span>
                    </div>
                  )}
                  
                  {inmates.status === "rejected" && (
                    <div className="flex items-center text-red-600">
                      <FaTimesCircle className="mr-2" />
                      <span>Parole request has been denied</span>
                    </div>
                  )}
                  
                  {inmates.status === "pending" && (
                    <div className="flex items-center text-yellow-600">
                      <FaClock className="mr-2" />
                      <span>Parole request is being reviewed</span>
                    </div>
                  )}
                  
                  {!inmates.status && (
                    <div className="flex items-center text-gray-600">
                      <FaUserCheck className="mr-2" />
                      <span>No parole request has been submitted yet</span>
                    </div>
                  )}
                </div>
                
                <button
                  className={`py-2.5 px-5 rounded-lg font-medium flex items-center ${
                    inmates.status === "accepted" || inmates.status === "rejected"
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                  }`}
                  onClick={() => {
                    if (inmates.status === "accepted" || inmates.status === "rejected") {
                      toast.info(`This parole request has already been ${inmates.status}`, {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                      });
                    } else {
                      setOpenAccept(true);
                    }
                  }}
                >
                  <FaPaperPlane className="mr-2" />
                  {inmates.status === "pending" 
                    ? "View Request" 
                    : inmates.status === "accepted" || inmates.status === "rejected"
                      ? `Request ${inmates.status}`
                      : "Request Parole"}
                </button>
              </div>
            </div>
          </div>

          {/* Parole Request Form */}
          <ParoleRequestForm
            isOpen={openAccept}
            parole={parole}
            onClose={() => setOpenAccept(false)}
            onSubmit={requestHandle}
          />
        </>
      ) : (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUser className="text-gray-400 text-xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Parole Data Available</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            The requested inmate's parole information could not be found or is not accessible.
          </p>
        </div>
      )}
    </div>
  );
};

export default ViewParole;
