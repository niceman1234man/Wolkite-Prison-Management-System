import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import TransferDialog from "./TransferDialog";
import PrintButton from "./PrintButton";
import { FaUser, FaArrowLeft, FaExchangeAlt, FaFileAlt, FaPrint, FaTimes, FaEdit, FaSave } from "react-icons/fa";
import { toast } from "react-toastify";

export default function ViewWoredaInmate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inmate, setInmate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [prisonName, setPrisonName] = useState("");
  const [modalOpen, setModalOpen] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedInmate, setEditedInmate] = useState(null);
  const [savingChanges, setSavingChanges] = useState(false);

  useEffect(() => {
    const fetchInmateDetails = async () => {
      try {
        const response = await axiosInstance.get(
          `/woreda-inmate/get-inmate/${id}`
        );
        if (response.data?.success) {
          // Format dates consistently for both display and editing
          const inmateData = response.data.inmate;
          
          console.log("Original inmate data:", JSON.stringify(inmateData));
          
          // Ensure gender is always lowercase to match backend enum
          if (inmateData.gender) {
            inmateData.gender = inmateData.gender.toLowerCase();
          }
          
          // Explicitly parse all date strings into Date objects
          // This ensures consistent date handling throughout the component
          if (inmateData.dateOfBirth) {
            try {
              const dateOfBirth = new Date(inmateData.dateOfBirth);
              if (!isNaN(dateOfBirth.getTime())) {
                inmateData.dateOfBirth = dateOfBirth;
              }
            } catch (e) {
              console.warn("Invalid date of birth format:", inmateData.dateOfBirth);
            }
          }
          
          if (inmateData.sentenceStart) {
            try {
              const sentenceStart = new Date(inmateData.sentenceStart);
              if (!isNaN(sentenceStart.getTime())) {
                inmateData.sentenceStart = sentenceStart;
              }
            } catch (e) {
              console.warn("Invalid sentence start date format:", inmateData.sentenceStart);
            }
          }
          
          if (inmateData.sentenceEnd) {
            try {
              const sentenceEnd = new Date(inmateData.sentenceEnd);
              if (!isNaN(sentenceEnd.getTime())) {
                inmateData.sentenceEnd = sentenceEnd;
              }
            } catch (e) {
              console.warn("Invalid sentence end date format:", inmateData.sentenceEnd);
            }
          }
          
          if (inmateData.intakeDate) {
            try {
              const intakeDate = new Date(inmateData.intakeDate);
              if (!isNaN(intakeDate.getTime())) {
                inmateData.intakeDate = intakeDate;
              }
            } catch (e) {
              console.warn("Invalid intake date format:", inmateData.intakeDate);
            }
          }
          
          console.log("Parsed inmate data with dates:", inmateData);
          
          setInmate(inmateData);
          setEditedInmate({...inmateData});
          
          // Fetch prison name if assigned
          if (inmateData.assignedPrison) {
            fetchPrisonName(inmateData.assignedPrison);
          }
        } else {
          throw new Error(
            response.data?.error || "Failed to fetch inmate details"
          );
        }
      } catch (error) {
        console.error("Error fetching inmate details:", error);
        setError(
          error.response?.data?.error || "Failed to fetch inmate details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInmateDetails();
  }, [id]);

  // Add a helper function to fetch prison name
  const fetchPrisonName = async (prisonId) => {
    try {
      const prisonResponse = await axiosInstance.get(`/prison/${prisonId}`);
      if (prisonResponse.data?.success) {
        setPrisonName(prisonResponse.data.prison.prison_name);
      } else {
        setPrisonName("Unknown Prison");
      }
    } catch (error) {
      console.error("Error fetching prison name:", error);
      setPrisonName("Error Loading Prison");
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    navigate("/woreda-dashboard/inmates");
  };

  // Calculate sentence duration in years, months, and days
  const calculateSentenceDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";
    
    // Create date objects and normalize to UTC to avoid timezone issues
    // Use the date parts only (year, month, day) to avoid time portion issues
    let start, end;
    
    try {
      const startObj = new Date(startDate);
      const endObj = new Date(endDate);
      
      if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
        return "Invalid dates";
      }
      
      // Create UTC dates using only the date components (year, month, day)
      start = new Date(Date.UTC(
        startObj.getUTCFullYear(),
        startObj.getUTCMonth(),
        startObj.getUTCDate()
      ));
      
      end = new Date(Date.UTC(
        endObj.getUTCFullYear(),
        endObj.getUTCMonth(),
        endObj.getUTCDate()
      ));
      
      // Ensure end date is not before start date
      if (end < start) {
        console.warn("End date is before start date in sentence calculation");
        return "Invalid date range";
      }
    } catch (error) {
      console.error("Error creating date objects for sentence calculation:", error);
      return "Error calculating duration";
    }
    
    // Calculate years, months, days
    let years = 0;
    let months = 0;
    let days = 0;
    
    // Use a copy of start date to iterate
    let tempDate = new Date(start);
    
    // Count years
    while (tempDate <= end) {
      const nextYear = new Date(tempDate);
      nextYear.setUTCFullYear(nextYear.getUTCFullYear() + 1);
      
      if (nextYear <= end) {
        years++;
        tempDate = nextYear;
      } else {
        break;
      }
    }
    
    // Count months
    while (tempDate <= end) {
      const nextMonth = new Date(tempDate);
      nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
      
      if (nextMonth <= end) {
        months++;
        tempDate = nextMonth;
      } else {
        break;
      }
    }
    
    // Count days
    while (tempDate < end) {
      const nextDay = new Date(tempDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      
      if (nextDay <= end) {
        days++;
        tempDate = nextDay;
      } else {
        break;
      }
    }
    
    // Create readable string
    let result = [];
    if (years > 0) {
      result.push(`${years} ${years === 1 ? 'year' : 'years'}`);
    }
    if (months > 0) {
      result.push(`${months} ${months === 1 ? 'month' : 'months'}`);
    }
    if (days > 0 || (years === 0 && months === 0)) {
      result.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    }
    
    return result.join(', ');
  };

  // Handle input change in edit mode
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for numeric fields
    if (name === "holdingCell" && value !== "") {
      const numericValue = value.replace(/\D/g, '');
      setEditedInmate(prev => ({
        ...prev,
        [name]: numericValue
      }));
      return;
    }
    
    // Special handling for gender to ensure lowercase (matching backend enum)
    if (name === "gender") {
      setEditedInmate(prev => ({
        ...prev,
        [name]: value.toLowerCase()
      }));
      return;
    }
    
    // Special handling for date fields - convert string dates to Date objects
    if (name === "dateOfBirth" || name === "sentenceStart" || name === "sentenceEnd" || name === "intakeDate") {
      if (value) {
        try {
          // For date inputs, use the value directly (browser returns YYYY-MM-DD format)
          const dateObj = new Date(value);
          console.log(`Setting ${name} date: ${value} -> ${dateObj}`);
          
          if (!isNaN(dateObj.getTime())) {
            setEditedInmate(prev => ({
              ...prev,
              [name]: dateObj
            }));
          }
        } catch (error) {
          console.error(`Error setting date for ${name}:`, error);
        }
      } else {
        setEditedInmate(prev => ({
          ...prev,
          [name]: null
        }));
      }
      return;
    }
    
    // Default handling for other fields
    setEditedInmate(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (editMode) {
      // If exiting edit mode, reset changes
      setEditedInmate(inmate);
    }
    setEditMode(!editMode);
  };

  // Save changes
  const saveChanges = async () => {
    try {
      setSavingChanges(true);
      
      // Create a copy of the data to prepare for submission
      const submitData = { ...editedInmate };
      
      // Ensure gender is lowercase to match backend enum
      if (submitData.gender) {
        submitData.gender = submitData.gender.toLowerCase();
      }
      
      // Format dates correctly for API
      if (submitData.dateOfBirth) {
        submitData.dateOfBirth = new Date(submitData.dateOfBirth).toISOString();
      }
      if (submitData.sentenceStart) {
        submitData.sentenceStart = new Date(submitData.sentenceStart).toISOString();
      }
      if (submitData.sentenceEnd) {
        submitData.sentenceEnd = new Date(submitData.sentenceEnd).toISOString();
      }
      if (submitData.intakeDate) {
        submitData.intakeDate = new Date(submitData.intakeDate).toISOString();
      }
      
      // Remove any fields that should not be modified
      delete submitData._id;
      delete submitData.createdAt;
      delete submitData.updatedAt;
      delete submitData.__v;
      
      // Log the data being sent to the server for debugging
      console.log("Sending data to update inmate:", submitData);
      
      const response = await axiosInstance.put(
        `/woreda-inmate/update-inmate/${id}`,
        submitData
      );
      
      if (response.data?.success) {
        // Update the local state with the edited data
        setInmate({...editedInmate});
        setEditMode(false);
        toast.success("Inmate information updated successfully", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        throw new Error(
          response.data?.error || "Failed to update inmate details"
        );
      }
    } catch (error) {
      console.error("Error updating inmate details:", error);
      
      // More detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error data:", error.response.data);
        console.error("Error status:", error.response.status);
        console.error("Error headers:", error.response.headers);
        
        toast.error(`Failed to update inmate details: ${error.response.data?.error || error.response.status}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        toast.error("Failed to update inmate details: No response from server", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message);
        toast.error(`Failed to update inmate details: ${error.message}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } finally {
      setSavingChanges(false);
    }
  };

  // Helper function to format dates consistently
  const formatDate = (date) => {
    if (!date) return "Not specified";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "Invalid date";
      
      // Create a more readable date format (Month Day, Year)
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Intl.DateTimeFormat('en-US', options).format(d);
    } catch (e) {
      console.warn("Error formatting date:", e);
      return "Invalid date";
    }
  };

  // Helper function to get ISO date string for form inputs
  const getISODateString = (date) => {
    if (!date) return "";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      // Format as YYYY-MM-DD for the date input
      return d.toISOString().split('T')[0];
    } catch (e) {
      console.warn("Error getting ISO date:", e);
      return "";
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-6 lg:p-8 ml-0 md:ml-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 md:p-6 lg:p-8 ml-0 md:ml-64">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate("/woreda-dashboard/inmates")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  if (!inmate) {
    return (
      <div className="flex-1 p-4 md:p-6 lg:p-8 ml-0 md:ml-64">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-gray-600 mb-4">Inmate not found</div>
          <button
            onClick={() => navigate("/woreda-dashboard/inmates")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 ml-0 md:ml-64 mt-8">
      {/* Modal Background */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          {/* Modal Container - Fixed width with consistent sizing */}
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            {/* Modal Header with Photo */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-lg p-6 text-white">
              <div className="flex flex-row items-start gap-6">
                {/* Photo in header - consistent size */}
                <div className="relative w-28 h-28 flex-shrink-0">
                  {inmate?.documents?.length > 0 ? (
                    <img
                      src={inmate.documents[0]}
                      alt={`${inmate.firstName} ${inmate.lastName}`}
                      className="w-full h-full rounded-lg object-cover border-2 border-white shadow-lg"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/200?text=No+Photo";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-gray-200 border-2 border-white shadow-lg flex items-center justify-center">
                      <FaUser className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Inmate details - standardized format */}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold">
                    {inmate?.firstName} {inmate?.middleName} {inmate?.lastName}
                  </h1>
                  <div className="flex flex-col sm:flex-row gap-4 mt-2">
                    <p className="text-blue-100 flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-full bg-green-400"></span>
                      Status: {inmate.status || "Active"}
                    </p>
                    <p className="text-blue-100">
                      Prison: {prisonName || "Not assigned"}
                    </p>
                    {inmate.registrationNumber && (
                      <p className="text-blue-100">
                        Reg #: {inmate.registrationNumber}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Close button */}
                <button 
                  onClick={closeModal}
                  className="text-white hover:text-red-200 transition-colors self-start p-2"
                  aria-label="Close modal"
                >
                  <FaTimes size={24} />
                </button>
              </div>
            </div>
            
            {/* Modal Body - Standard layout with consistent padding */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Detailed Information Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-blue-800">
                      Personal Information
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          First Name
                        </label>
                        {editMode ? (
                          <input
                            type="text"
                            name="firstName"
                            value={editedInmate.firstName}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">
                            {inmate.firstName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Middle Name
                        </label>
                        {editMode ? (
                          <input
                            type="text"
                            name="middleName"
                            value={editedInmate.middleName}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">
                            {inmate.middleName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Last Name
                        </label>
                        {editMode ? (
                          <input
                            type="text"
                            name="lastName"
                            value={editedInmate.lastName}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">
                            {inmate.lastName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Date of Birth
                        </label>
                        {editMode ? (
                          <input
                            type="date"
                            name="dateOfBirth"
                            value={editedInmate.dateOfBirth ? getISODateString(editedInmate.dateOfBirth) : ''}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">
                            {formatDate(inmate.dateOfBirth)}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Gender
                        </label>
                        {editMode ? (
                          <select
                            name="gender"
                            value={editedInmate.gender}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">
                            {inmate.gender === 'male' ? 'Male' : 'Female'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Criminal Information */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-blue-800">
                      Criminal Information
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Crime
                        </label>
                        {editMode ? (
                          <input
                            type="text"
                            name="crime"
                            value={editedInmate.crime}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">{inmate.crime}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Risk Level
                        </label>
                        {editMode ? (
                          <select
                            name="riskLevel"
                            value={editedInmate.riskLevel}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">{inmate.riskLevel}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Sentence Start
                        </label>
                        {editMode ? (
                          <input
                            type="date"
                            name="sentenceStart"
                            value={editedInmate.sentenceStart ? getISODateString(editedInmate.sentenceStart) : ''}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">
                            {formatDate(inmate.sentenceStart)}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Sentence End
                        </label>
                        {editMode ? (
                          <input
                            type="date"
                            name="sentenceEnd"
                            value={editedInmate.sentenceEnd ? getISODateString(editedInmate.sentenceEnd) : ''}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">
                            {formatDate(inmate.sentenceEnd)}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-600">
                          Sentence Duration
                        </label>
                        <p className="mt-1 text-gray-900 font-medium bg-gray-50 p-2 rounded-md">
                          {calculateSentenceDuration(
                            editMode ? editedInmate.sentenceStart : inmate.sentenceStart, 
                            editMode ? editedInmate.sentenceEnd : inmate.sentenceEnd
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-blue-800">
                      Medical Information
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Medical Conditions
                        </label>
                        {editMode ? (
                          <textarea
                            name="medicalConditions"
                            value={editedInmate.medicalConditions || ''}
                            onChange={handleInputChange}
                            rows="3"
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          ></textarea>
                        ) : (
                          <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded-md min-h-[60px]">
                            {inmate.medicalConditions || "None specified"}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Special Requirements
                        </label>
                        {editMode ? (
                          <textarea
                            name="specialRequirements"
                            value={editedInmate.specialRequirements || ''}
                            onChange={handleInputChange}
                            rows="3"
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          ></textarea>
                        ) : (
                          <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded-md min-h-[60px]">
                            {inmate.specialRequirements || "None specified"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Administrative Information */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-blue-800">
                      Administrative Information
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Assigned Prison
                        </label>
                        <p className="mt-1 text-gray-900 font-medium">{prisonName || "Not assigned"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Holding Cell
                        </label>
                        {editMode ? (
                          <input
                            type="text"
                            name="holdingCell"
                            value={editedInmate.holdingCell || ''}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">{inmate.holdingCell || "Not specified"}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Arresting Officer
                        </label>
                        {editMode ? (
                          <input
                            type="text"
                            name="arrestingOfficer"
                            value={editedInmate.arrestingOfficer || ''}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">{inmate.arrestingOfficer || "Not specified"}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Intake Date
                        </label>
                        {editMode ? (
                          <input
                            type="date"
                            name="intakeDate"
                            value={editedInmate.intakeDate ? getISODateString(editedInmate.intakeDate) : ''}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">
                            {formatDate(inmate.intakeDate)}
                          </p>
                        )}
                      </div>
                      {inmate.status === "Released" && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-600">
                            Release Reason
                          </label>
                          <p className="mt-1 text-gray-900 font-medium bg-green-50 p-2 rounded-md border border-green-100">
                            {inmate.releaseReason || "Not specified"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Documents - Fixed document display */}
                {inmate.documents && inmate.documents.length > 0 && (
                  <div className="col-span-1 lg:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-blue-800">
                        Documents & Photos ({inmate.documents.length})
                      </h2>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {inmate.documents.map((doc, index) => {
                          // Ensure we have proper URL access
                          const documentUrl = typeof doc === 'string' ? doc : doc.url;
                          const isImage = typeof doc === 'string' ? 
                            doc.match(/\.(jpeg|jpg|gif|png)$/i) : 
                            (doc.type === 'image' || (doc.url && doc.url.match(/\.(jpeg|jpg|gif|png)$/i)));
                          
                          return (
                            <div
                              key={index}
                              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => window.open(documentUrl, "_blank")}
                            >
                              <div className="aspect-w-16 aspect-h-9 bg-gray-100 relative">
                                {isImage ? (
                                  <>
                                    <div className="absolute top-0 left-0 bg-blue-500 text-white px-2 py-1 text-xs font-bold rounded-br z-10">
                                      #{index + 1}
                                    </div>
                                    <img
                                      src={documentUrl}
                                      alt={`Document ${index + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.src = "https://via.placeholder.com/200?text=Image+Error";
                                      }}
                                    />
                                  </>
                                ) : (
                                  <>
                                    <div className="absolute top-0 left-0 bg-blue-500 text-white px-2 py-1 text-xs font-bold rounded-br z-10">
                                      #{index + 1}
                                    </div>
                                    <div className="w-full h-full flex items-center justify-center">
                                      <FaFileAlt className="w-12 h-12 text-gray-400" />
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="p-3 bg-white">
                                <p className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm transition-colors">
                                  <FaFileAlt className="w-4 h-4" />
                                  {isImage ? `View Photo ${index + 1}` : `View Document ${index + 1}`}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg flex justify-between items-center">
              <button
                onClick={closeModal}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors text-white"
              >
                <FaArrowLeft /> Back to List
              </button>
              
              <div className="flex gap-3">
                {/* Only show these buttons when not in edit mode */}
                {!editMode && (
                  <>
                    <button
                      onClick={toggleEditMode}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors text-white"
                    >
                      <FaEdit /> Edit
                    </button>
                    <PrintButton
                      inmate={inmate}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md transition-colors text-white"
                      buttonContent={<><FaPrint /> Print</>}
                      title="Inmate Details Report"
                      additionalData={{
                        "Personal Information": {
                          "Full Name": `${inmate?.firstName} ${inmate?.middleName} ${inmate?.lastName}`,
                          "Registration Number": inmate.registrationNumber || "N/A",
                          "Date of Birth": formatDate(inmate?.dateOfBirth),
                          "Gender": inmate.gender === 'male' ? 'Male' : 'Female',
                        },
                        "Criminal Information": {
                          "Crime": inmate?.crime,
                          "Risk Level": inmate?.riskLevel,
                          "Sentence Start": formatDate(inmate?.sentenceStart),
                          "Sentence End": formatDate(inmate?.sentenceEnd),
                          "Sentence Duration": calculateSentenceDuration(inmate.sentenceStart, inmate.sentenceEnd),
                        },
                        "Medical Information": {
                          "Medical Conditions": inmate?.medicalConditions || "None",
                          "Special Requirements": inmate?.specialRequirements || "None",
                        },
                        "Administrative Information": {
                          "Assigned Prison": prisonName || "Not assigned",
                          "Holding Cell": inmate?.holdingCell || "N/A",
                          "Arresting Officer": inmate?.arrestingOfficer || "N/A",
                          "Intake Date": formatDate(inmate?.intakeDate),
                          "Status": inmate?.status || "Active",
                          "Release Reason": inmate.status === "Released" ? (inmate.releaseReason || "Not specified") : "N/A",
                        },
                      }}
                    />
                    <button
                      onClick={() => setIsTransferDialogOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors text-white"
                    >
                      <FaExchangeAlt /> Transfer
                    </button>
                  </>
                )}
                {editMode && (
                  <>
                    <button
                      onClick={saveChanges}
                      disabled={savingChanges}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors text-white disabled:opacity-50"
                    >
                      {savingChanges ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> 
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave /> Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={toggleEditMode}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md transition-colors text-white"
                    >
                      <FaTimes /> Cancel Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Dialog */}
      <TransferDialog
        isOpen={isTransferDialogOpen}
        onClose={() => setIsTransferDialogOpen(false)}
        inmate={inmate}
        onTransferComplete={() => {
          navigate("/woreda-dashboard/inmates");
        }}
      />
    </div>
  );
}
