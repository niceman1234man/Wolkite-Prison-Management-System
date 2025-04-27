import React, { useEffect, useContext, useState, useMemo, useCallback } from "react";
import { FaBook, FaClipboardCheck, FaSave, FaEye, FaExclamationTriangle, FaSync, FaEdit, FaTimes, FaTable, FaThLarge, FaTrash, FaChevronDown, FaSearch, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaClock, FaUser, FaTimesCircle } from "react-icons/fa";
import Loader from "../common/Loader";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import ScheduleForm from "./partials/ScheduleForm";
import ScheduleDetailModal from "./partials/ScheduleDetailModal";
import CancelConfirmationModal from "./partials/CancelConfirmationModal";
import useVisitScheduleData from "../../hooks/useVisitScheduleData";
import VisitorField from "../Visitor/RegisterVisitor";
import { VisitorCapacityContext } from "../Visitor/VisitorList";
import axiosInstance from "../../utils/axiosInstance";
import { parseISO, isAfter, isPast, format, addDays } from "date-fns";
import '../../styles/table.css'; // Import the table styles
import '../../styles/responsive.css'; // Import the responsive utility classes
import LanguageSelector from "../common/LanguageSelector";
import { T } from "../common/TranslatedText";
import TranslatedText from "../common/TranslatedText";

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Add new state for inmates
  const [inmates, setInmates] = useState([]);
  const [inmatesLoading, setInmatesLoading] = useState(false);

  // Add this new state for the cancel confirmation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [scheduleToCancel, setScheduleToCancel] = useState(null);

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
    
    // Get today's date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to beginning of day for proper comparison
    
    return schedules.filter(schedule => {
      // First check that schedule and its necessary properties exist
      if (!schedule) return false;
      
      // Check if the visit is upcoming (today or future)
      let isUpcoming = false;
      if (schedule.visitDate) {
        try {
          // Use parseISO if the date is in ISO format string
          const visitDate = typeof schedule.visitDate === 'string' 
            ? parseISO(schedule.visitDate) 
            : new Date(schedule.visitDate);
            
          visitDate.setHours(0, 0, 0, 0); // Reset time for comparison
          
          // A visit is upcoming if it's today or in the future
          isUpcoming = visitDate >= today;
        } catch (error) {
          console.error("Error parsing date:", error);
          isUpcoming = false;
        }
      }
      
      // Keep the visit if it's upcoming, regardless of status
      // Or if it's pending (since those should always show)
      const isPending = schedule.status?.toLowerCase() === 'pending';
      const keepVisit = isUpcoming || isPending;
      
      if (!keepVisit) return false;
      
      // Check if schedule matches search query
      const matchesSearch = !searchQuery || searchQuery.trim() === '' || (
        (schedule.visitorId?.firstName && schedule.visitorId.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (schedule.visitorId?.lastName && schedule.visitorId.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (schedule.userId?.firstName && schedule.userId.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (schedule.userId?.lastName && schedule.userId.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (schedule.purpose && schedule.purpose.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      // Check if schedule matches status filter (if not "all")
      const matchesStatus = statusFilter === "all" || 
        (schedule.status && schedule.status.toLowerCase() === statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      // Sort by date (most recent first)
      const dateA = new Date(a.visitDate);
      const dateB = new Date(b.visitDate);
      return dateA - dateB; // Ascending order (earliest first)
    });
  }, [schedules, searchQuery, statusFilter, version]);

  // Calculate pagination - MOVED AFTER filteredSchedules is defined
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSchedules.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);

  // Handle page changes
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

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
      return `${schedule.visitorId.firstName || ''} ${schedule.visitorId.middleName || ''} ${schedule.visitorId.lastName || ''}`.trim() || 'Unknown Visitor';
    } else if (schedule.firstName || schedule.middleName || schedule.lastName) {
      return `${schedule.firstName || ''} ${schedule.middleName || ''} ${schedule.lastName || ''}`.trim() || 'Unknown Visitor';
    }
    return 'Unknown Visitor';
  }, []);

  const viewScheduleDetails = useCallback((schedule) => {
    // Log the raw schedule data to see what's available
    console.log("Raw schedule data:", schedule);
    
    // Check if this is a rejected schedule with a reason
    const isRejected = schedule.status?.toLowerCase() === 'rejected';
    
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
      approvedAt: schedule.approvedAt || schedule.updatedAt,
      // Add full name for easy access
      fullName: `${schedule.visitorId?.firstName || schedule.firstName || ''} ${schedule.visitorId?.middleName || schedule.middleName || ''} ${schedule.visitorId?.lastName || schedule.lastName || ''}`.trim(),
      // Include photo URLs - Ensure these are properly extracted
      idPhoto: schedule.idPhoto || null,
      visitorPhoto: schedule.visitorPhoto || null,
      // Include inmate data with ID
      inmateId: schedule.inmateId ? {
        ...schedule.inmateId,
        prisonerId: schedule.inmateId.prisonerId || schedule.inmateId.inmateId || schedule.inmateId._id || null,
        _id: schedule.inmateId._id || null,
        fullName: schedule.inmateId.fullName || 
                 `${schedule.inmateId.firstName || ''} ${schedule.inmateId.middleName || ''} ${schedule.inmateId.lastName || ''}`.trim() || 
                 'Unknown'
      } : null,
      // Add formatted rejection info for easier display in the modal
      rejectionStatus: isRejected,
      formattedRejectionInfo: isRejected && schedule.rejectionReason ? schedule.rejectionReason : null
    };
    
    console.log("Enriched schedule for detail modal:", enrichedSchedule);
    console.log("Photo paths - ID Photo:", enrichedSchedule.idPhoto, "Visitor Photo:", enrichedSchedule.visitorPhoto);
    
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
      inmateId: schedule.inmateId?._id ? { _id: schedule.inmateId._id } : schedule.inmateId,
      // Add full name for easy access
      fullName: `${schedule.visitorId?.firstName || schedule.firstName || ''} ${schedule.visitorId?.middleName || schedule.middleName || ''} ${schedule.visitorId?.lastName || schedule.lastName || ''}`.trim()
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
      middleName: schedule.visitorId?.middleName || schedule.middleName || "",
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
      
      // Add full name for easy access
      fullName: `${schedule.visitorId?.firstName || schedule.firstName || ''} ${schedule.visitorId?.middleName || schedule.middleName || ''} ${schedule.visitorId?.lastName || schedule.lastName || ''}`.trim()
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
      const loadingToast = toast.loading("Cancelling visit...");
      
      // Get user ID from localStorage
      let userId = null;
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          userId = userData.id || userData._id;
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }

      // Make direct API call with userId as query parameter
      axiosInstance.put(`/visitor/schedule/${scheduleId}/cancel${userId ? `?userId=${userId}` : ''}`)
        .then(response => {
          toast.dismiss(loadingToast);
          if (response.data.success) {
            // If modal is open, close it
            if (showDetailModal) {
              setShowDetailModal(false);
            }
          // Close the cancel modal too
          setShowCancelModal(false);
          setScheduleToCancel(null);
          
            toast.success("Visit cancelled successfully");
            // Refresh data after cancellation
            fetchSchedules();
          } else {
            toast.error(response.data.message || "Failed to cancel visit");
          }
        })
        .catch(error => {
          toast.dismiss(loadingToast);
          console.error("Error cancelling visit:", error);
          toast.error(error.response?.data?.message || "Failed to cancel visit");
        });
  }, [showDetailModal, fetchSchedules]);
  
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

  // Handle rescheduling a visit
  const handleRescheduleVisit = useCallback((schedule) => {
    // First check if the user has any pending schedules
    const hasPending = schedules.some(s => s.status?.toLowerCase() === 'pending');
    
    if (hasPending) {
      toast.error("You already have a pending visit schedule. Please wait for approval or cancel your existing pending schedule before rescheduling.");
      return;
    }
    
    // Create a copy of the schedule with reset status for rescheduling
    const scheduleForReschedule = {
      // Do NOT include all properties from the original schedule
      // Only copy specific fields we need
      
      // Explicitly mark this as a reschedule
      isReschedule: true,
      
      // Keep visitor and inmate information
      firstName: schedule.visitorId?.firstName || schedule.firstName || "",
      middleName: schedule.visitorId?.middleName || schedule.middleName || "",
      lastName: schedule.visitorId?.lastName || schedule.lastName || "",
      phone: schedule.visitorId?.phone || schedule.phone || "",
      idType: schedule.idType || schedule.visitorId?.idType || "",
      idNumber: schedule.idNumber || schedule.visitorId?.idNumber || "",
      
      // Reset visit date to make it clear it needs to be changed
      visitDate: "",
      visitTime: "",
      
      // Keep other details for convenience
      purpose: `Rescheduled: ${schedule.purpose || "Visit"}`,
      relationship: schedule.relationship || "",
      visitDuration: schedule.visitDuration || schedule.duration || 30,
      
      // Ensure inmate ID is in the right format
      inmateId: schedule.inmateId?._id || schedule.inmateId || "",
      
      // Include reference to original schedule
      originalScheduleId: schedule._id,
      notes: `Rescheduled from previous visit on ${new Date(schedule.visitDate).toLocaleDateString()} at ${schedule.visitTime}`,
      
      // Set default status
      status: "Pending",
      
      // Add full name for easy access
      fullName: `${schedule.visitorId?.firstName || schedule.firstName || ''} ${schedule.visitorId?.middleName || schedule.middleName || ''} ${schedule.visitorId?.lastName || schedule.lastName || ''}`.trim()
    };
    
    console.log("Rescheduling visit with data:", scheduleForReschedule);
    
    // Set the schedule to edit and open the form
    setScheduleToEdit(scheduleForReschedule);
    setShowScheduleForm(true);
    toast.info("Please select a new date and time for this visit");
  }, [schedules]);

  // Add this function to open the cancel confirmation modal
  const openCancelModal = useCallback((schedule) => {
    setScheduleToCancel(schedule);
    setShowCancelModal(true);
  }, []);

  // Render functions for different card states
  const renderLoading = () => (
    <div className="flex justify-center items-center py-12 bg-white rounded-lg shadow-md w-full my-4">
      <Loader size="lg" message="Loading schedules..." />
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow-md w-full my-4 border border-gray-200">
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
      <p className="mt-1 text-sm text-gray-500 text-center max-w-md px-4">
        {statusFilter !== "all" || searchQuery
          ? "Try changing your filters or search criteria."
          : "Get started by creating a new visit schedule."}
      </p>
      {!isCapacityReached && !hasPendingSchedule && (
        <div className="mt-6">
          <button
            onClick={openScheduleForm}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <FaBook className="-ml-1 mr-2 h-5 w-5" />
            Schedule New Visit
          </button>
        </div>
      )}
      {hasPendingSchedule && (
        <div className="mt-6 text-sm text-yellow-600 bg-yellow-50 p-4 rounded-md border border-yellow-200 max-w-md">
          <div className="flex">
            <FaExclamationTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
            <p>You already have a pending visit schedule. You cannot create a new schedule until your current one is approved, rejected, or canceled.</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderScheduleCard = (schedule, index) => {
    const visitorName = getVisitorName(schedule);
    // Find the inmate in the inmates array using the inmateId
    const inmate = inmates.find(i => i._id === schedule.inmateId?._id);
    const inmateName = inmate ? inmate.inmate_name : "Unknown Inmate";
    const canEdit = schedule.status?.toLowerCase() === 'pending';
    // Can reschedule if it's not pending (handled separately) and it's upcoming
    const canReschedule = schedule.status?.toLowerCase() !== 'pending';

    // Calculate the actual display index based on pagination
    const displayIndex = indexOfFirstItem + index + 1;
    
    // Color theme based on status
    let statusColors = {
      bg: "from-blue-50 to-white",
      badge: "bg-blue-100 text-blue-800",
      icon: "text-blue-500",
      accent: "border-blue-200"
    };
    
    // Set colors based on status
    switch(schedule.status?.toLowerCase()) {
      case 'pending':
        statusColors = {
          bg: "from-yellow-50 to-white",
          badge: "bg-yellow-100 text-yellow-800",
          icon: "text-yellow-600",
          accent: "border-yellow-200"
        };
        break;
      case 'approved':
        statusColors = {
          bg: "from-green-50 to-white",
          badge: "bg-green-100 text-green-800",
          icon: "text-green-600",
          accent: "border-green-200"
        };
        break;
      case 'rejected':
        statusColors = {
          bg: "from-red-50 to-white",
          badge: "bg-red-100 text-red-800",
          icon: "text-red-500",
          accent: "border-red-200"
        };
        break;
      case 'cancelled':
        statusColors = {
          bg: "from-gray-50 to-white",
          badge: "bg-gray-100 text-gray-700",
          icon: "text-gray-500",
          accent: "border-gray-200"
        };
        break;
    }

    // Add the rejection message if status is rejected
    const isRejected = schedule.status?.toLowerCase() === 'rejected';

    return (
      <div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden transform hover:-translate-y-1 border ${statusColors.accent}`}>
        {/* Card header with gradient */}
        <div className={`relative border-b border-gray-100 bg-gradient-to-r ${statusColors.bg} p-3`}>
          {/* Number badge in left */}
          <div className={`absolute top-2.5 left-2.5 flex items-center justify-center w-7 h-7 rounded-full ${statusColors.badge} text-xs font-bold shadow-sm`}>
            {displayIndex}
          </div>
          
          <div className="flex flex-col items-start ml-10">
            <h3 className="font-semibold text-gray-900 text-base">{visitorName}</h3>
            <div className="flex items-center mt-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                schedule.status?.toLowerCase() === 'pending' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 
                schedule.status?.toLowerCase() === 'approved' ? 'bg-green-50 text-green-800 border-green-200' : 
                schedule.status?.toLowerCase() === 'cancelled' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                schedule.status?.toLowerCase() === 'rejected' ? 'bg-red-50 text-red-800 border-red-200' :
                'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              {schedule.status}
            </span>
            </div>
          </div>
        </div>
        
        {/* Card body with information */}
        <div className="p-3 text-sm">
          <div className="text-gray-600 space-y-2.5">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors.badge} mr-2.5`}>
                <FaCalendarAlt className={statusColors.icon} size={14} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Visit Date</p>
                <p className="font-semibold text-gray-800">{new Date(schedule.visitDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors.badge} mr-2.5`}>
                <FaClock className={statusColors.icon} size={14} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Visit Time</p>
                <p className="font-semibold text-gray-800">{schedule.visitTime}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors.badge} mr-2.5`}>
                <FaUser className={statusColors.icon} size={14} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Inmate</p>
                <p className="font-semibold text-gray-800 truncate max-w-[180px]">{inmateName}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors.badge} mr-2.5`}>
                <FaClipboardCheck className={statusColors.icon} size={14} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Purpose</p>
                <p className="font-semibold text-gray-800 truncate max-w-[180px]" title={schedule.purpose}>
                {schedule.purpose}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card footer with actions */}
        <div className="bg-gray-50 p-2.5 flex flex-wrap justify-end gap-2 border-t border-gray-200">
          <button 
            onClick={() => viewScheduleDetails(schedule)}
            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors shadow-sm"
          >
            <FaEye className="mr-1.5 text-blue-600" size={12} /> View
          </button>
          
          {canEdit && (
            <button 
              onClick={() => editSchedule(schedule)}
              className="inline-flex items-center px-2.5 py-1.5 border border-green-300 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors shadow-sm"
            >
              <FaEdit className="mr-1.5 text-green-600" size={12} /> Edit
            </button>
          )}
          
          {schedule.status?.toLowerCase() === 'pending' && (
            <button 
              onClick={() => openCancelModal(schedule)}
              className="inline-flex items-center px-2.5 py-1.5 border border-red-300 text-xs font-medium rounded-md bg-red-50 text-red-700 hover:bg-red-100 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors shadow-sm"
            >
              <FaTimes className="mr-1.5 text-red-600" size={12} /> Cancel
            </button>
          )}
          
          {canReschedule && (
            <button 
              onClick={() => handleRescheduleVisit(schedule)}
              className="inline-flex items-center px-2.5 py-1.5 border border-purple-300 text-xs font-medium rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors shadow-sm"
            >
              <FaCalendarAlt className="mr-1.5 text-purple-600" size={12} /> Reschedule
            </button>
          )}
        </div>
        
        {/* Display rejection reason if rejected */}
        {isRejected && schedule.formattedRejectionInfo && (
          <div className="mt-3 p-2 bg-red-50 rounded-md border border-red-100">
            <p className="text-xs font-semibold text-red-800 mb-1">Rejection Reason:</p>
            <p className="text-sm text-red-700">{schedule.formattedRejectionInfo}</p>
          </div>
        )}
      </div>
    );
  };

  const renderTableView = (schedules) => {
    return (
      <div className="w-full bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {loading && (
          <div className="p-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading schedules...</p>
          </div>
        )}
        
        <div className="w-full overflow-x-auto" style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
          <table className="w-full table-fixed divide-y divide-gray-200 shadow-sm border border-gray-200">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-800 text-white sticky top-0 z-10 shadow-md">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[5%]">
                  #
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[15%]">
                  Visitor
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[15%]">
                  Inmate
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[15%] hidden sm:table-cell">
                  Visit Date & Time
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[10%] hidden md:table-cell">
                  Duration
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[15%] hidden lg:table-cell">
                  Purpose
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[10%]">
                  Status
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell w-[15%]">
                  Reason
                </th>
                <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-[10%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-4 text-center text-gray-500 italic">
                    No visits scheduled
                  </td>
                </tr>
              ) : (
                schedules.map((schedule, index) => {
                const visitorName = getVisitorName(schedule);
                const inmate = inmates.find(i => i._id === schedule.inmateId?._id);
                const inmateName = inmate ? inmate.inmate_name : "Unknown Inmate";
                  const isPending = schedule.status?.toLowerCase() === 'pending';
                
                return (
                  <tr 
                    key={schedule._id}
                      className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => viewScheduleDetails(schedule)}
                  >
                      <td className="px-2 sm:px-4 py-3 text-sm">
                        {indexOfFirstItem + index + 1}
                    </td>
                      <td className="px-2 sm:px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">{visitorName || "Unknown"}</div>
                        <div className="text-gray-500 text-xs truncate">
                          {schedule.phone || "No phone"}
                      </div>
                    </td>
                      <td className="px-2 sm:px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">{inmateName}</div>
                        <div className="text-gray-500 text-xs capitalize">
                          {schedule.relationship || "Not specified"}
                      </div>
                    </td>
                      <td className="px-2 sm:px-4 py-3 text-sm hidden sm:table-cell">
                        <div className="font-medium text-gray-900">
                        {new Date(schedule.visitDate).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {schedule.visitTime || "Not specified"}
                      </div>
                    </td>
                      <td className="px-2 sm:px-4 py-3 text-sm hidden md:table-cell">
                        <div className="text-gray-900 font-medium">
                          {schedule.visitDuration ? `${schedule.visitDuration} minutes` : "30 minutes"}
                      </div>
                    </td>
                      <td className="px-2 sm:px-4 py-3 text-sm hidden lg:table-cell">
                        <div className="max-w-xs truncate">
                          {schedule.purpose || "Not specified"}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-sm">
                        <span
                          className={getStatusBadge(schedule.status)}
                        >
                        {schedule.status}
                      </span>
                    </td>
                      <td className="px-2 sm:px-4 py-3 text-sm hidden md:table-cell">
                        {schedule.status?.toLowerCase() === 'rejected' && schedule.formattedRejectionInfo ? (
                          <div 
                            className="text-sm text-red-600 max-w-xs truncate"
                            title={schedule.formattedRejectionInfo}
                          >
                            {schedule.formattedRejectionInfo}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            {schedule.status?.toLowerCase() === 'rejected' ? 'No reason provided' : '-'}
                          </div>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-sm text-right">
                        <div 
                          className="flex justify-end gap-1 sm:gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                        <button 
                            title="View details"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewScheduleDetails(schedule);
                          }}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-1 sm:p-1.5 rounded-full transition-all duration-150 hover:shadow-md transform hover:-translate-y-1"
                        >
                            <FaEye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        
                          {isPending && (
                            <>
                          <button
                                title="Edit visit"
                            onClick={(e) => {
                              e.stopPropagation();
                              editSchedule(schedule);
                            }}
                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-1 sm:p-1.5 rounded-full transition-all duration-150 hover:shadow-md transform hover:-translate-y-1"
                          >
                                <FaEdit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        
                          <button
                                title="Cancel visit"
                            onClick={(e) => {
                              e.stopPropagation();
                                  openCancelModal(schedule);
                            }}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-1 sm:p-1.5 rounded-full transition-all duration-150 hover:shadow-md transform hover:-translate-y-1"
                          >
                                <FaTimes className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                            </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan="8" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredSchedules.length)} of {filteredSchedules.length} records
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {filteredSchedules.length > itemsPerPage && (
          <div className="flex justify-center p-4 border-t border-gray-200">
            <nav className="flex items-center">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-l-md border ${
                  currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-blue-600 hover:bg-blue-50'
                } focus:outline-none`}
              >
                <FaChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show current page, first page, last page, and 1 page on either side of current
                  return page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 1;
                })
                .map((page, index, array) => {
                  // If there's a gap in sequence, show ellipsis
                  const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                  
                  return (
                    <React.Fragment key={page}>
                      {showEllipsisBefore && (
                        <span className="px-3 py-1 border-t border-b bg-gray-50 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1 border-t border-b ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-600 hover:bg-blue-50'
                        } focus:outline-none`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-r-md border ${
                  currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
                } focus:outline-none`}
              >
                <FaChevronRight className="w-4 h-4" />
              </button>
            </nav>
          </div>
        )}
      </div>
    );
  };

  const renderCardView = (schedules) => {
    return (
      <div className="w-full mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {schedules.map((schedule, index) => (
            <div key={schedule._id} className="w-full">
              {renderScheduleCard(schedule, index)}
        </div>
          ))}
        </div>
        {schedules.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredSchedules.length)} of {filteredSchedules.length} records
          </div>
        )}
        
        {/* Pagination Controls */}
        {filteredSchedules.length > itemsPerPage && (
          <div className="flex justify-center mt-4">
            <nav className="flex items-center shadow-sm">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-l-md border ${
                  currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-blue-600 hover:bg-blue-50'
                } focus:outline-none`}
              >
                <FaChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show current page, first page, last page, and 1 page on either side of current
                  return page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 1;
                })
                .map((page, index, array) => {
                  // If there's a gap in sequence, show ellipsis
                  const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                  
                  return (
                    <React.Fragment key={page}>
                      {showEllipsisBefore && (
                        <span className="px-3 py-1 border-t border-b bg-gray-50 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1 border-t border-b ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-600 hover:bg-blue-50'
                        } focus:outline-none`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-r-md border ${
                  currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
                } focus:outline-none`}
              >
                <FaChevronRight className="w-4 h-4" />
              </button>
            </nav>
          </div>
        )}
      </div>
    );
  };

  const renderScheduleList = () => {
    if (loading) {
      return renderLoading();
    }

    if (!filteredSchedules.length) {
      return renderEmptyState();
    }

    return displayMode === 'table' ? renderTableView(currentItems) : renderCardView(currentItems);
  };

  return (
    <div className={`visitor-container ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
      {/* Fixed Header Section */}
      <div className={`bg-white shadow-md fixed top-14 z-20 transition-all duration-300 ${
        isCollapsed ? "left-16 w-[calc(100%-4rem)]" : "left-64 w-[calc(100%-16rem)]"
      }`}>
        {/* Main header */}
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FaClipboardCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Upcoming Visits</h2>
            </div>
            
            {/* Primary actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                title="Refresh Data"
              >
                <FaSync className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              
              <button
                onClick={openScheduleForm}
                disabled={loading || isCapacityReached || hasPendingSchedule}
                className={`px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1 shadow-sm ${
                  (loading || isCapacityReached || hasPendingSchedule) ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title="Create New Schedule"
              >
                <FaSave className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">Schedule Visit</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Filter controls section */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            {/* Left side filters */}
            <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
              {/* Status Filter */}
              <div className="relative">
                <select
                  id="statusFilter"
                  name="statusFilter"
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Filter by status"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <FaChevronDown className="h-3 w-3" />
                </div>
              </div>

              {/* Items per page selector */}
              <div className="relative">
                <select
                  id="itemsPerPage"
                  name="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Items per page"
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <FaChevronDown className="h-3 w-3" />
                </div>
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FaSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search visits..."
                  className="w-full bg-white border border-gray-300 rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchQuery && (
                  <button 
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={() => handleSearchChange("")}
                  >
                    <FaTimes className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Right side display controls */}
            <div className="flex items-center space-x-2">
              {/* View Toggle */}
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  onClick={setCardMode}
                  className={`px-3 py-1.5 text-xs font-medium rounded-l-md border ${
                    displayMode === 'card' 
                      ? 'bg-blue-50 text-blue-700 border-blue-300' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FaThLarge className="mr-1 inline-block" /> Cards
                </button>
                <button
                  onClick={setTableMode}
                  className={`px-3 py-1.5 text-xs font-medium rounded-r-md border-t border-r border-b ${
                    displayMode === 'table' 
                      ? 'bg-blue-50 text-blue-700 border-blue-300' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FaTable className="mr-1 inline-block" /> Table
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Capacity Warning - show directly below header if capacity is reached */}
        {isCapacityReached && (
          <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-center">
              <FaExclamationTriangle className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-yellow-700">
                <T>The prison has reached its visitor capacity for today. Please schedule a visit for another day.</T>
              </p>
            </div>
          </div>
        )}
        
      </div>
      
      {/* Push content down to prevent overlap with fixed header - adjust based on warnings */}
      <div className={`pt-${isCapacityReached || hasPendingSchedule ? "44" : "36"} px-4 mt-40`}>
        {/* Display the schedules */}
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
            onClose={() => setShowDetailModal(false)}
            schedule={selectedSchedule}
            onEdit={handleUpdateFromDetail}
            onCancel={openCancelModal}
          >
            {/* Add Rejection Reason Banner */}
            {selectedSchedule.status?.toLowerCase() === 'rejected' && selectedSchedule.rejectionReason && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-red-800 font-semibold mb-1 flex items-center">
                  <FaTimesCircle className="mr-2" /> Rejection Reason
                </h3>
                <p className="text-red-700 text-sm whitespace-pre-wrap">{selectedSchedule.rejectionReason}</p>
              </div>
            )}
          </ScheduleDetailModal>
        )}
      
        {/* Cancel Confirmation Modal */}
        <CancelConfirmationModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          schedule={scheduleToCancel}
          onConfirm={() => scheduleToCancel && handleCancelSchedule(scheduleToCancel._id)}
        />
      
        {/* Mobile bottom spacing */}
        <div className="pb-6"></div>
      </div>
    </div>
  );
});

export default VisitSchedules;