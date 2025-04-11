import React, { useEffect, useContext, useState, useMemo, useCallback } from "react";
import { FaBook, FaClipboardCheck, FaSave, FaEye, FaExclamationTriangle, FaFilter, FaSync, FaEdit, FaTimes, FaTable, FaThLarge, FaTrash } from "react-icons/fa";
import Loader from "../common/Loader";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import ScheduleForm from "./partials/ScheduleForm";
import ScheduleDetailModal from "./partials/ScheduleDetailModal";
import useVisitScheduleData from "../../hooks/useVisitScheduleData";
import VisitorField from "../Visitor/RegisterVisitor";
import { VisitorCapacityContext } from "../Visitor/VisitorList";
import axiosInstance from "../../utils/axiosInstance";
import '../../styles/table.css'; // Import the table styles
import '../../styles/responsive.css'; // Import the responsive utility classes

const VisitSchedules = React.memo(({ isEmbedded = false, capacityReached = null, onRefreshCapacity = null }) => {
  // Get data from custom hook - include version for memoization
  const {
    schedules,
    visitors,
    loading,
    statusFilter,
    searchQuery,
    fetchVisitors,
    fetchSchedules,
    handleStatusFilterChange,
    handleSearchChange,
    cancelSchedule,
    version,
  } = useVisitScheduleData();

  // Try to use visitor capacity from context if available, or from props
  let visitorCapacityContext = null;
  try {
    visitorCapacityContext = useContext(VisitorCapacityContext);
  } catch (error) {
    // Context not available, will use props instead
    console.log("Visitor capacity context not available, using props");
  }

  // Determine if capacity is reached (from context or props)
  const isCapacityReached = visitorCapacityContext?.isCapacityReached ?? capacityReached;

  // Get sidebar state from Redux using useSelector (which has built-in memoization)
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  // Track active state for modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState(null);
  const [displayMode, setDisplayMode] = useState('card');
  // Track if user has pending schedule
  const [hasPendingSchedule, setHasPendingSchedule] = useState(false);

  // Add new state for inmates
  const [inmates, setInmates] = useState([]);
  const [inmatesLoading, setInmatesLoading] = useState(false);

  // Check if user has pending schedules
  const checkPendingSchedules = useCallback(() => {
    const userSchedules = schedules || [];
    const pendingSchedules = userSchedules.filter(
      schedule => schedule.status?.toLowerCase() === 'pending'
    );
    setHasPendingSchedule(pendingSchedules.length > 0);
    return pendingSchedules.length > 0;
  }, [schedules]);

  // Call check when schedules change
  useEffect(() => {
    checkPendingSchedules();
  }, [schedules, checkPendingSchedules]);

  // Memoize filtered schedules to prevent unnecessary re-renders
  const filteredSchedules = useMemo(() => {
    console.log(`Recalculating filteredSchedules, version: ${version}`);
    
    if (!schedules || schedules.length === 0) return [];
    
    return schedules.filter(schedule => {
      // First check that schedule and its necessary properties exist
      if (!schedule) return false;
      
      // Check if schedule matches search query
      const matchesSearch = !searchQuery || searchQuery.trim() === '' || (
        (schedule.visitorId?.firstName && schedule.visitorId.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (schedule.visitorId?.lastName && schedule.visitorId.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (schedule.userId?.firstName && schedule.userId.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (schedule.userId?.lastName && schedule.userId.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (schedule.purpose && schedule.purpose.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      // Check if schedule matches status filter
      const matchesStatus = statusFilter === "all" || 
        (schedule.status && schedule.status.toLowerCase() === statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [schedules, searchQuery, statusFilter, version]);

  // Fetch data on mount using useEffect with empty dependency array
  useEffect(() => {
    let isMounted = true;
    
    const initializeData = async () => {
      if (!isEmbedded && isMounted) {
        await fetchSchedules();
      }
    };
    
    initializeData();
    
    // Return cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [isEmbedded, fetchSchedules]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleScheduleSuccess = useCallback(async (data) => {
    toast.success("Schedule saved successfully!");
    setShowScheduleForm(false);
    setScheduleToEdit(null);
    
    // Give the server a moment to process the data
    setTimeout(async () => {
      await fetchVisitors();
      await fetchSchedules();
      
      if (visitorCapacityContext?.refreshCapacity) {
        visitorCapacityContext.refreshCapacity();
      } else if (onRefreshCapacity) {
        onRefreshCapacity();
      }
    }, 500);
  }, [fetchVisitors, fetchSchedules, visitorCapacityContext, onRefreshCapacity]);

  // Helper to get visitor name
  const getVisitorName = useCallback((schedule) => {
    if (!schedule) return 'Unknown Visitor';
    
    if (schedule.visitorId) {
      return `${schedule.visitorId.firstName || ''} ${schedule.visitorId.lastName || ''}`.trim() || 'Unknown Visitor';
    } else if (schedule.firstName || schedule.lastName) {
      return `${schedule.firstName || ''} ${schedule.lastName || ''}`.trim() || 'Unknown Visitor';
    }
    return 'Unknown Visitor';
  }, []);

  const viewScheduleDetails = useCallback((schedule) => {
    // Make sure the schedule is properly populated with all necessary data
    // Create a clean version of the schedule with all fields needed by the detail modal
    const enrichedSchedule = {
      ...schedule,
      // Get visitor name from either visitorId or directly from schedule
      firstName: schedule.visitorId?.firstName || schedule.firstName || '',
      middleName: schedule.visitorId?.middleName || schedule.middleName || '',
      lastName: schedule.visitorId?.lastName || schedule.lastName || '',
      // Get visitor phone from either visitorId or directly from schedule
      phone: schedule.visitorId?.phone || schedule.phone || '',
      // Get visitor address from either visitorId or directly from schedule
      address: schedule.visitorId?.address || schedule.address || '',
      // Ensure we have ID information
      idType: schedule.idType || schedule.visitorId?.idType || 'Not provided',
      idNumber: schedule.idNumber || schedule.visitorId?.idNumber || 'Not provided',
      idExpiryDate: schedule.idExpiryDate || schedule.visitorId?.idExpiryDate,
      // Format visit details consistently as in other places
      visitDuration: schedule.visitDuration || schedule.duration || "30",
      relationship: schedule.relationship || schedule.visitorId?.relation || 'Not specified',
      // Include date information
      createdAt: schedule.createdAt,
      approvedAt: schedule.approvedAt || schedule.updatedAt
    };
    
    setSelectedSchedule(enrichedSchedule);
    setShowDetailModal(true);
  }, []);

  const editSchedule = useCallback((schedule) => {
    // Only allow editing if this is the schedule being edited or there are no pending schedules
    const isPending = schedule.status?.toLowerCase() === 'pending';
    const hasPending = checkPendingSchedules();
    const canEdit = !hasPending || isPending;
    
    if (!canEdit && hasPending) {
      toast.error("You already have a pending visit schedule. You cannot create a new schedule until your current one is approved, rejected, or canceled.");
      return;
    }

    // Prepare the schedule data for editing by creating a complete object with all required fields
    const completeSchedule = {
      ...schedule,
      // Ensure we have visitor information - either from visitorId or directly from schedule
      firstName: schedule.visitorId?.firstName || schedule.firstName || '',
      middleName: schedule.visitorId?.middleName || schedule.middleName || '',
      lastName: schedule.visitorId?.lastName || schedule.lastName || '',
      phone: schedule.visitorId?.phone || schedule.phone || '',
      // Ensure we have ID information
      idType: schedule.idType || schedule.visitorId?.idType || '',
      idNumber: schedule.idNumber || schedule.visitorId?.idNumber || '',
      idExpiryDate: schedule.idExpiryDate || schedule.visitorId?.idExpiryDate,
      // Ensure we have visit details formatted correctly
      visitDate: schedule.visitDate || new Date().toISOString(),
      visitTime: schedule.visitTime || '',
      // Handle duration consistently - if it's stored as either visitDuration or duration
      visitDuration: schedule.visitDuration || schedule.duration || "30",
      purpose: schedule.purpose || '',
      relationship: schedule.relationship || schedule.visitorId?.relation || '',
      inmateId: schedule.inmateId?._id ? { _id: schedule.inmateId._id } : schedule.inmateId
    };
    
    console.log("Editing schedule with complete data:", completeSchedule);
    
    setScheduleToEdit(completeSchedule);
    setShowScheduleForm(true);
  }, [checkPendingSchedules]);

  // Handle opening the form for editing
  const handleUpdateFromDetail = useCallback((schedule) => {
    // Create a complete schedule object for editing that includes visitor details
    const completeSchedule = {
      ...schedule,
      // Ensure visitor information is populated
      firstName: schedule.visitorId?.firstName || schedule.firstName || "",
      lastName: schedule.visitorId?.lastName || schedule.lastName || "",
      phone: schedule.visitorId?.phone || schedule.phone || "",
      email: schedule.visitorId?.email || schedule.email || "",
      address: schedule.visitorId?.address || schedule.address || "",
      
      // ID information
      idType: schedule.visitorId?.idType || schedule.idType || "",
      idNumber: schedule.visitorId?.idNumber || schedule.idNumber || "",
      
      // Handle inmate ID properly - check if it's an object and get the _id
      inmateId: typeof schedule.inmateId === 'object' ? schedule.inmateId?._id : schedule.inmateId || null,
      
      // Visit details
      purpose: schedule.purpose || "",
      relationship: schedule.relationship || "",
      visitDate: schedule.visitDate 
        ? new Date(schedule.visitDate).toISOString().split('T')[0] 
        : "",
      visitTime: schedule.visitTime || "",
    };
    
    console.log("Prepared schedule for editing:", completeSchedule);
    
    setScheduleToEdit(completeSchedule);
    setShowDetailModal(false);
    setShowScheduleForm(true);
  }, []);

  const closeScheduleForm = useCallback(() => {
    setShowScheduleForm(false);
    setScheduleToEdit(null);
  }, []);

  // Format the date for display
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Date(dateString).toLocaleDateString('en-US', options);
  }, []);

  // Function to get the badge color based on status
  const getStatusBadge = useCallback((status) => {
    const statusLower = status?.toLowerCase() || "pending";
    let className = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (statusLower) {
      case "approved":
        className += " bg-green-100 text-green-800 border border-green-200";
        break;
      case "rejected":
        className += " bg-red-100 text-red-800 border border-red-200";
        break;
      case "pending":
        className += " bg-yellow-100 text-yellow-800 border border-yellow-200";
        break;
      case "postponed":
        className += " bg-purple-100 text-purple-800 border border-purple-200";
        break;
      case "completed":
        className += " bg-blue-100 text-blue-800 border border-blue-200";
        break;
      default:
        className += " bg-gray-100 text-gray-800 border border-gray-200";
    }
    
    return className;
  }, []);

  const handleCancelSchedule = useCallback((scheduleId) => {
    if (window.confirm("Are you sure you want to cancel this visit?")) {
      const loadingToast = toast.loading("Cancelling visit...");
      cancelSchedule(scheduleId)
        .then(success => {
          toast.dismiss(loadingToast);
          if (success) {
            // If modal is open, close it
            if (showDetailModal) {
              setShowDetailModal(false);
            }
            toast.success("Visit cancelled successfully");
            // Refresh data after cancellation
            fetchSchedules();
          } else {
            toast.error("Failed to cancel visit");
          }
        })
        .catch(err => {
          toast.dismiss(loadingToast);
          console.error("Error cancelling visit:", err);
          toast.error("Failed to cancel visit");
        });
    }
  }, [cancelSchedule, showDetailModal, fetchSchedules]);
  
  // Handle deleting a schedule
  const handleDeleteSchedule = useCallback((scheduleId) => {
    if (window.confirm("Are you sure you want to permanently delete this visit? This action cannot be undone.")) {
      const loadingToast = toast.loading("Deleting visit schedule...");
      
      axiosInstance.delete(`/visitor/schedule/${scheduleId}`)
        .then(response => {
          toast.dismiss(loadingToast);
          if (response.data.success) {
            toast.success("Visit schedule deleted successfully");
            // If detail modal is open, close it
            if (showDetailModal) {
              setShowDetailModal(false);
            }
            // Refresh schedules to update the list
            fetchSchedules();
          } else {
            toast.error(response.data.message || "Failed to delete schedule");
          }
        })
        .catch(error => {
          toast.dismiss(loadingToast);
          console.error("Error deleting schedule:", error);
          toast.error(error.response?.data?.message || "Failed to delete schedule");
        });
    }
  }, [fetchSchedules, showDetailModal]);

  // Memoized handler for refresh action
  const handleRefresh = useCallback(() => {
    const refreshToast = toast.loading("Refreshing data...");
    
    // Run both requests in parallel and then handle the result
    Promise.all([fetchVisitors(), fetchSchedules()])
      .then(() => {
        toast.dismiss(refreshToast);
        toast.success("Data refreshed successfully");
        
        // Refresh capacity if available
        if (visitorCapacityContext?.refreshCapacity) {
          visitorCapacityContext.refreshCapacity();
        } else if (onRefreshCapacity) {
          onRefreshCapacity();
        }
      })
      .catch(error => {
        toast.dismiss(refreshToast);
        toast.error("Failed to refresh data");
        console.error("Refresh error:", error);
      });
  }, [fetchVisitors, fetchSchedules, visitorCapacityContext, onRefreshCapacity]);

  // Memoized handlers for display mode
  const setCardMode = useCallback(() => setDisplayMode('card'), []);
  const setTableMode = useCallback(() => setDisplayMode('table'), []);
  const openScheduleForm = useCallback(() => {
    // Check if user already has a pending schedule
    if (hasPendingSchedule) {
      toast.error("You already have a pending visit schedule. You cannot create a new schedule until your current one is approved, rejected, or canceled.");
      return;
    }
    setShowScheduleForm(true);
  }, [hasPendingSchedule]);

  // Add function to fetch inmates
  const fetchInmates = useCallback(async () => {
    setInmatesLoading(true);
    try {
      const response = await axiosInstance.get("/inmates/allInmates");
      console.log("API Response:", response.data);

      // Check if response.data has an inmates array
      const inmatesData = response.data?.inmates || response.data || [];
      
      if (Array.isArray(inmatesData)) {
        let sno = 1;
        const formattedData = inmatesData.map((inmate) => {
          // Create full name from first, middle and last name
          const fullName = [inmate.firstName, inmate.middleName, inmate.lastName]
            .filter(Boolean)
            .join(" ");
            
          // Format the sentence information
          const sentenceInfo = inmate.sentenceYear ? 
            `${inmate.sentenceYear} ${inmate.sentenceYear === 1 ? 'year' : 'years'}` : 
            "Not specified";
            
          // Format location data
          const location = [inmate.currentWereda, inmate.currentZone]
            .filter(Boolean)
            .join(", ");
            
          return {
            _id: inmate._id,
            sno: sno++,
            inmate_name: fullName || "Not available",
            age: inmate.age || "N/A",
            gender: inmate.gender || "N/A",
            case_type: inmate.caseType || "Not specified",
            reason: inmate.sentenceReason || "",
            sentence: sentenceInfo,
            current_location: location || "Not specified",
            photo: inmate.photo,
            firstName: inmate.firstName,
            middleName: inmate.middleName,
            lastName: inmate.lastName,
            fullName: fullName
          };
        });

        setInmates(formattedData);
      } else {
        console.error("Invalid API response structure:", response.data);
        toast.error("Invalid response structure from server");
      }
    } catch (error) {
      console.error("Error fetching inmates:", error);
      toast.error(error.response?.data?.error || "Failed to fetch inmate data");
    } finally {
      setInmatesLoading(false);
    }
  }, []);

  // Fetch inmates on component mount
  useEffect(() => {
    fetchInmates();
  }, [fetchInmates]);

  // Render functions for different card states
  const renderLoading = () => (
    <div className="flex justify-center items-center py-12">
      <Loader size="lg" message="Loading schedules..." />
          </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules found</h3>
      <p className="mt-1 text-sm text-gray-500">
        {statusFilter !== "all" || searchQuery
          ? "Try changing your filters or search criteria."
          : "Get started by creating a new visit schedule."}
      </p>
      {!isCapacityReached && !hasPendingSchedule && (
        <div className="mt-6">
            <button
            onClick={openScheduleForm}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaBook className="-ml-1 mr-2 h-5 w-5" />
            Schedule New Visit
            </button>
          </div>
      )}
      {hasPendingSchedule && (
        <div className="mt-4 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md border border-yellow-200">
          <FaExclamationTriangle className="inline-block mr-1" />
          You already have a pending visit schedule. You cannot create a new schedule until your current one is approved, rejected, or canceled.
        </div>
      )}
      </div>
  );

  const renderScheduleCard = (schedule) => {
    const visitorName = getVisitorName(schedule);
    // Find the inmate in the inmates array using the inmateId
    const inmate = inmates.find(i => i._id === schedule.inmateId?._id);
    const inmateName = inmate ? inmate.inmate_name : "Unknown Inmate";
    const canEdit = schedule.status?.toLowerCase() === 'pending';

  return (
      <div key={schedule._id} className="visitor-item-card">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-sm">{visitorName}</h3>
          <span className={`visitor-badge ${schedule.status?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 
                                               schedule.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-800 border-green-300' : 
                                               schedule.status?.toLowerCase() === 'cancelled' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                                               schedule.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                                               'bg-blue-100 text-blue-800 border-blue-300'}`}>
            {schedule.status}
          </span>
        </div>
        
        <div className="text-xs text-gray-600 mb-3">
          <p><span className="font-medium">Visit Date:</span> {new Date(schedule.visitDate).toLocaleDateString()}</p>
          <p><span className="font-medium">Time:</span> {schedule.visitTime}</p>
          <p><span className="font-medium">Duration:</span> {schedule.visitDuration || schedule.duration || 30} minutes</p>
          <p><span className="font-medium">Inmate:</span> {inmateName}</p>
          <p><span className="font-medium">Purpose:</span> {schedule.purpose}</p>
        </div>
        
        <div className="flex justify-end gap-1 mt-2">
          <button 
            onClick={() => viewScheduleDetails(schedule)}
            className="visitor-button visitor-button-light text-xs"
          >
            <FaEye className="mr-1" /> View
          </button>
          {canEdit && (
            <button 
              onClick={() => editSchedule(schedule)}
              className="visitor-button visitor-button-primary text-xs"
            >
              <FaEdit className="mr-1" /> Edit
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderTableView = (schedules) => {
    return (
      <div className="visitor-table-container">
        <table className="visitor-table">
          <thead className="bg-gray-50">
            <tr>
              <th>Visitor</th>
              <th>Inmate</th>
              <th className="hidden sm:table-cell">Visit Date & Time</th>
              <th className="hidden md:table-cell">Duration</th>
              <th className="hidden md:table-cell">Purpose</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedules.map((schedule) => {
              const visitorName = getVisitorName(schedule);
              // Find the inmate in the inmates array using the inmateId
              const inmate = inmates.find(i => i._id === schedule.inmateId?._id);
              const inmateName = inmate ? inmate.inmate_name : "Unknown Inmate";
              const canEdit = schedule.status?.toLowerCase() === 'pending';
              
              return (
                <tr key={schedule._id}>
                  <td className="font-medium">{visitorName}</td>
                  <td>{inmateName}</td>
                  <td className="hidden sm:table-cell">
                    {new Date(schedule.visitDate).toLocaleDateString()} <br />
                    <span className="text-xs text-gray-500">{schedule.visitTime}</span>
                  </td>
                  <td className="hidden md:table-cell">{schedule.visitDuration || schedule.duration || 30} min</td>
                  <td className="hidden md:table-cell">{schedule.purpose}</td>
                  <td>
                    <span className={`visitor-badge ${schedule.status?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 
                                                    schedule.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-800 border-green-300' : 
                                                    schedule.status?.toLowerCase() === 'cancelled' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                                                    schedule.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                                                    'bg-blue-100 text-blue-800 border-blue-300'}`}>
                      {schedule.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => viewScheduleDetails(schedule)}
                        className="visitor-button visitor-button-light text-xs"
                      >
                        <FaEye />
                      </button>
                      {canEdit && (
                        <button 
                          onClick={() => editSchedule(schedule)}
                          className="visitor-button visitor-button-primary text-xs"
                        >
                          <FaEdit />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCardView = (schedules) => {
    return (
      <div className="visitor-card-grid">
        {schedules.map(renderScheduleCard)}
      </div>
    );
  };

  const renderScheduleList = () => {
    if (loading) {
      return (
        <div className="visitor-loading">
          <div className="visitor-spinner"></div>
        </div>
      );
    }

    if (!filteredSchedules.length) {
      return (
        <div className="visitor-empty-state">
          <FaBook className="visitor-empty-icon" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Visit Schedules</h3>
          <p className="visitor-empty-text">
            You don't have any visit schedules yet. Click the 'Create Schedule' button to start planning a visit.
          </p>
        </div>
      );
    }

    return displayMode === 'table' ? renderTableView(filteredSchedules) : renderCardView(filteredSchedules);
  };

  return (
    <div className={`visitor-container ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
      {/* Page Header */}
      <div className="visitor-card mb-4 p-3 h-32 mt-10">
        <div className="visitor-header">
          <div className="visitor-title">
            <FaClipboardCheck className="visitor-title-icon" />
            <h2 className="visitor-title-text">Visit Schedules</h2>
          </div>
          
          <div className="visitor-actions flex justify-end">
            <button
              onClick={() => {
                if (!checkPendingSchedules() || hasPendingSchedule === false) {
                  setShowScheduleForm(true);
                } else {
                  toast.error("You already have a pending visit schedule. You cannot create a new schedule until your current one is approved, rejected, or canceled.");
                }
              }}
              disabled={loading || isCapacityReached || hasPendingSchedule}
              className={`visitor-button visitor-button-primary ${(loading || isCapacityReached || hasPendingSchedule) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FaSave className="mr-1" /> Create Schedule
            </button>
            
            <button
              onClick={fetchSchedules}
              disabled={loading}
              className={`visitor-button visitor-button-secondary ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FaSync className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            
            <div className="flex gap-1 ml-1">
              <button
                onClick={() => setDisplayMode('card')}
                className={`visitor-button ${displayMode === 'card' ? 'visitor-button-light bg-gray-300' : 'visitor-button-light'}`}
                title="Card View"
              >
                <FaThLarge />
              </button>
              <button
                onClick={() => setDisplayMode('table')}
                className={`visitor-button ${displayMode === 'table' ? 'visitor-button-light bg-gray-300' : 'visitor-button-light'}`}
                title="Table View"
              >
                <FaTable />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity Warning */}
      {isCapacityReached && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 mb-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                The prison has reached its visitor capacity for today. Please schedule a visit for another day.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="visitor-controls">
        <div className="visitor-control-group">
                    <div>
            <label htmlFor="statusFilter" className="sr-only">Filter by Status</label>
            <div className="flex">
              <div className="flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                <FaFilter className="h-4 w-4" />
              </div>
              <select
                id="statusFilter"
                name="statusFilter"
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="visitor-select rounded-l-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search</label>
            <input
              type="text"
              name="search"
              id="search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="visitor-input"
              placeholder="Search by visitor name, inmate name, or purpose..."
            />
          </div>
        </div>
      </div>
      
      {/* Schedules Content */}
      {renderScheduleList()}
      
      {/* Modals */}
      {showScheduleForm && (
        <ScheduleForm
          isOpen={showScheduleForm}
          onClose={() => {
            setShowScheduleForm(false);
            setScheduleToEdit(null);
          }}
          onSuccess={handleScheduleSuccess}
          schedule={scheduleToEdit}
          inmates={inmates}
          inmatesLoading={inmatesLoading}
        />
      )}
      
      {showDetailModal && selectedSchedule && (
        <ScheduleDetailModal
          isOpen={showDetailModal}
          schedule={selectedSchedule}
          onClose={() => setShowDetailModal(false)}
          onCancel={handleCancelSchedule}
          onUpdate={handleUpdateFromDetail}
        />
      )}
      
      {/* Mobile bottom spacing */}
      <div className="visitor-page-bottom-space"></div>
    </div>
  );
});

export default VisitSchedules; 