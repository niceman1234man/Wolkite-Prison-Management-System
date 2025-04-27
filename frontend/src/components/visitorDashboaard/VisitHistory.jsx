import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";
import { format, parseISO, isAfter, isPast, differenceInDays } from "date-fns";
import { useSelector } from "react-redux";
import { FaDownload, FaPrint, FaTimes, FaCalendarAlt, FaClock, FaCheck, FaTimesCircle, FaArrowRight, FaUser, FaFilter, FaHistory, FaSync, FaSearch, FaSort, FaSortUp, FaSortDown, FaEye, FaChevronDown, FaFileExcel, FaFilePdf, FaChevronLeft, FaChevronRight, FaClipboardCheck, FaCommentDots, FaUserFriends } from "react-icons/fa";
import ScheduleDetailModal from "./partials/ScheduleDetailModal";
import CancelConfirmationModal from "./partials/CancelConfirmationModal";
import '../../styles/table.css';
import '../../styles/responsive.css';

function VisitHistory() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, approved, completed, cancelled
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("visitDate");
  const [sortDirection, setSortDirection] = useState("desc"); // asc or desc
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [dateRange, setDateRange] = useState("all"); // all, upcoming, past, recent
  const [displayMode, setDisplayMode] = useState('card'); // card or table
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [inmates, setInmates] = useState([]);
  const [inmatesLoading, setInmatesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Add state for cancel confirmation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [scheduleToCancel, setScheduleToCancel] = useState(null);

  useEffect(() => {
    fetchSchedules();
    fetchInmates();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/visitor/schedule/schedules");
      if (response.data.success) {
        console.log("Fetched schedules:", response.data.data.length);
        setSchedules(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Failed to fetch visit history");
    } finally {
      setLoading(false);
    }
  };

  const fetchInmates = async () => {
    setInmatesLoading(true);
    try {
      const response = await axiosInstance.get("/inmates/allInmates");
      console.log("Inmates API Response:", response.data);

      const inmatesData = response.data?.inmates || response.data || [];
      
      if (Array.isArray(inmatesData)) {
        const formattedData = inmatesData.map((inmate) => {
          const fullName = [inmate.firstName, inmate.middleName, inmate.lastName]
            .filter(Boolean)
            .join(" ");
            
          return {
            _id: inmate._id,
            inmate_name: fullName || "Not available",
            firstName: inmate.firstName,
            middleName: inmate.middleName,
            lastName: inmate.lastName,
            fullName: fullName
          };
        });

        setInmates(formattedData);
        console.log("Processed inmates data:", formattedData.length);
      } else {
        console.error("Invalid inmates API response structure:", response.data);
        toast.error("Invalid inmate data response from server");
      }
    } catch (error) {
      console.error("Error fetching inmates:", error);
      toast.error(error.response?.data?.error || "Failed to fetch inmate data");
    } finally {
      setInmatesLoading(false);
    }
  };

  // Function to open the cancel confirmation modal
  const openCancelModal = (schedule) => {
    setScheduleToCancel(schedule);
    setShowCancelModal(true);
  };

  const handleCancelVisit = async (scheduleId) => {
    try {
      // Get user ID from localStorage
      let userId = null;
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        userId = userData.id || userData._id;
      }

      console.log("Cancelling visit with schedule ID:", scheduleId, "and user ID:", userId);
      
      const loadingToast = toast.loading("Cancelling visit...");
      
      // Include userId as query parameter for authorization
      const response = await axiosInstance.put(
        `/visitor/schedule/${scheduleId}/cancel${userId ? `?userId=${userId}` : ''}`
      );
      
      toast.dismiss(loadingToast);
      
      if (response.data.success) {
        toast.success("Visit cancelled successfully");
        fetchSchedules(); // Refresh the list
        setShowDetailModal(false);
        setShowCancelModal(false);
        setScheduleToCancel(null);
      }
    } catch (error) {
      console.error("Error cancelling visit:", error);
      toast.error(error.response?.data?.message || "Failed to cancel visit");
    }
  };

  const handleDownloadHistory = () => {
    try {
      // Format data for CSV export
      const csvData = filteredSchedules.map(schedule => {
        return {
          'Visit ID': schedule._id,
          'Inmate Name': schedule.inmateId?.fullName || 'Unknown',
          'Visit Date': schedule.visitDate ? format(new Date(schedule.visitDate), "MMM d, yyyy") : 'Not specified',
          'Visit Time': schedule.visitTime || 'Not specified',
          'Duration': `${schedule.visitDuration || "30"} minutes`,
          'Purpose': schedule.purpose || 'Not specified',
          'Relationship': schedule.relationship || 'Not specified',
          'Status': schedule.status || 'Unknown',
          'Visitor Name': `${schedule.firstName || ''} ${schedule.middleName || ''} ${schedule.lastName || ''}`.trim() || 'Unknown',
          'Created At': schedule.createdAt ? format(new Date(schedule.createdAt), "MMM d, yyyy 'at' h:mm a") : 'Unknown',
        };
      });

      // Convert data to CSV string
      const headers = Object.keys(csvData[0] || {});
      
      // Format CSV string with proper escaping of fields
      const formatCSVField = (field) => {
        if (field === null || field === undefined) return '';
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      };
      
      // Generate CSV content
      const csvContent = [
        headers.map(formatCSVField).join(','),
        ...csvData.map(row => 
          headers.map(header => formatCSVField(row[header])).join(',')
        )
      ].join('\n');
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visit-history-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Visit history exported to CSV successfully");
    } catch (error) {
      console.error("Error preparing download:", error);
      toast.error("Failed to download visit history");
    }
  };

  const handlePrintHistory = () => {
    window.print();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "cancelled":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  // Sort schedules
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to desc for date, asc for others
      setSortField(field);
      setSortDirection(field === "visitDate" ? "desc" : "asc");
    }
  };

  // Filter by date range
  const filterByDateRange = (schedule) => {
    if (!schedule.visitDate) return false;
    
    try {
      const visitDate = parseISO(schedule.visitDate);
      const today = new Date();
      
      switch(dateRange) {
        case "upcoming":
          return isAfter(visitDate, today);
        case "past":
          return isPast(visitDate);
        case "recent":
          // Last 30 days
          return Math.abs(differenceInDays(today, visitDate)) <= 30;
        default:
          return true;
      }
    } catch (error) {
      console.error("Date filtering error:", error);
      return true;
    }
  };

  // Apply all filters and sorting
  const getFilteredAndSortedSchedules = () => {
    return schedules
      .filter(schedule => {
        // Status filter
        const statusMatch = filter === "all" || schedule.status?.toLowerCase() === filter;
        
        // Date range filter
        const dateMatch = filterByDateRange(schedule);
        
        // Search query filter
        const query = searchQuery.toLowerCase();
        const searchMatch = !searchQuery || 
          (schedule.inmateId?.fullName?.toLowerCase()?.includes(query)) ||
          (schedule.purpose?.toLowerCase()?.includes(query)) || 
          (schedule.relationship?.toLowerCase()?.includes(query)) ||
          (schedule.status?.toLowerCase()?.includes(query));
          
        return statusMatch && dateMatch && searchMatch;
      })
      .sort((a, b) => {
        // Handle different sort fields
        let valueA, valueB;
        
        switch(sortField) {
          case "inmateId":
            valueA = a.inmateId?.fullName || "";
            valueB = b.inmateId?.fullName || "";
            break;
          case "purpose":
            valueA = a.purpose || "";
            valueB = b.purpose || "";
            break;
          case "relationship":
            valueA = a.relationship || "";
            valueB = b.relationship || "";
            break;
          case "status":
            valueA = a.status || "";
            valueB = b.status || "";
            break;
          case "visitDate":
          default:
            // Default to date sorting
            try {
              valueA = a.visitDate ? new Date(a.visitDate) : new Date(0);
              valueB = b.visitDate ? new Date(b.visitDate) : new Date(0);
            } catch (e) {
              valueA = 0;
              valueB = 0;
            }
            break;
        }
        
        // Apply sort direction
        if (sortDirection === "asc") {
          if (valueA < valueB) return -1;
          if (valueA > valueB) return 1;
          return 0;
        } else {
          if (valueA > valueB) return -1;
          if (valueA < valueB) return 1;
          return 0;
        }
      });
  };

  const filteredSchedules = getFilteredAndSortedSchedules();
  
  // Calculate pagination
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
  }, [filter, searchQuery, dateRange, sortField, sortDirection]);

  // Pagination component
  const PaginationBar = ({ currentPage, totalPages, goToPage, goToPreviousPage, goToNextPage }) => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="fixed bottom-0 left-0 right-0 py-4 bg-white shadow-md border-t border-gray-200 z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
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
        </div>
      </div>
    );
  };

  const handleViewDetails = (schedule) => {
    // Create a copy of the schedule to avoid mutating the original data
    const enhancedSchedule = {
      ...schedule,
    };
    
    // If this is a rejected visit with a reason, make sure it's prominently displayed
    if (schedule.status?.toLowerCase() === 'rejected' && schedule.rejectionReason) {
      // Add a formatted rejection reason that will be displayed in a special section
      enhancedSchedule.formattedRejectionInfo = schedule.rejectionReason;
      
      // Also include it in notes for backward compatibility
      enhancedSchedule.notes = schedule.notes 
        ? `${schedule.notes}\n\n--- REJECTION REASON ---\n${schedule.rejectionReason}`
        : `--- REJECTION REASON ---\n${schedule.rejectionReason}`;
    }
    
    setSelectedSchedule(enhancedSchedule);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedSchedule(null);
  };

  // Component to display sort icons
  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaSort className="ml-1 text-gray-400" />;
    if (sortDirection === "asc") return <FaSortUp className="ml-1 text-blue-600" />;
    return <FaSortDown className="ml-1 text-blue-600" />;
  };

  // Format status with icon
  const StatusBadge = ({ status }) => {
    let icon;
    switch(status?.toLowerCase()) {
      case "pending":
        icon = <FaClock className="mr-1" />;
        break;
      case "approved":
        icon = <FaCheck className="mr-1" />;
        break;
      case "rejected":
      case "cancelled":
        icon = <FaTimesCircle className="mr-1" />;
        break;
      default:
        icon = <FaCheck className="mr-1" />;
    }
    
    return (
      <span className={`visitor-badge ${getStatusColor(status)}`}>
        {icon}
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  // Add a small version of the StatusBadge - this will be added to our CSS on load
  const smallBadgeStyle = document.createElement('style');
  smallBadgeStyle.textContent = `
    .visitor-badge-sm {
      display: inline-flex;
      align-items: center;
      font-size: 0.6rem;
      padding: 0.12rem 0.5rem;
      border-radius: 9999px;
      font-weight: 500;
      line-height: 1.2;
      border-width: 1px;
    }
  `;
  document.head.appendChild(smallBadgeStyle);

  const renderHistoryCard = (visit, index) => {
    // Find the inmate in the inmates array using the inmateId
    const inmate = inmates.find(i => i._id === (visit.inmateId?._id || visit.inmateId));
    const inmateName = inmate ? inmate.inmate_name : (visit.inmateId?.fullName || "Unknown Inmate");
    
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
    switch(visit.status?.toLowerCase()) {
      case 'completed':
        statusColors = {
          bg: "from-green-50 to-white",
          badge: "bg-green-100 text-green-800",
          icon: "text-green-600",
          accent: "border-green-200"
        };
        break;
      case 'missed':
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
      
    // Check if the visit was rejected
    const isRejected = visit.status?.toLowerCase() === 'rejected';
    
    return (
      <div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden transform hover:-translate-y-1 border ${statusColors.accent}`}>
        {/* Card header with gradient */}
        <div className={`relative border-b border-gray-100 bg-gradient-to-r ${statusColors.bg} p-3`}>
          {/* Number badge in left */}
          <div className={`absolute top-2.5 left-2.5 flex items-center justify-center w-7 h-7 rounded-full ${statusColors.badge} text-sm font-bold shadow-sm`}>
            {displayIndex}
        </div>
        
          <div className="flex flex-col items-start ml-10">
            <h3 className="font-semibold text-gray-900 text-base">{inmateName}</h3>
            <div className="flex items-center mt-1">
              <StatusBadge status={visit.status} />
            </div>
          </div>
        </div>
        
        {/* Card body with information - more compact */}
        <div className="p-3 text-sm">
          <div className="text-gray-600 space-y-2.5">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors.badge} mr-2.5`}>
                <FaCalendarAlt className={statusColors.icon} size={14} />
          </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Visit Date</p>
                <p className="font-semibold text-gray-800">{new Date(visit.visitDate).toLocaleDateString()}</p>
              </div>
        </div>
        
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors.badge} mr-2.5`}>
                <FaClock className={statusColors.icon} size={14} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Visit Time</p>
                <p className="font-semibold text-gray-800">{visit.visitTime}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors.badge} mr-2.5`}>
                <FaClipboardCheck className={statusColors.icon} size={14} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Purpose</p>
                <p className="font-semibold text-gray-800 truncate max-w-[180px]" title={visit.purpose}>
                  {visit.purpose}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors.badge} mr-2.5`}>
                <FaUserFriends className={statusColors.icon} size={14} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Relationship</p>
                <p className="font-semibold text-gray-800">{visit.relationship || 'Not specified'}</p>
              </div>
            </div>
          </div>
          
          {/* Display rejection reason if rejected */}
          {isRejected && visit.rejectionReason && (
            <div className="mt-3 p-2 bg-red-50 rounded-md border border-red-100">
              <p className="text-xs font-semibold text-red-800 mb-1">Rejection Reason:</p>
              <p className="text-sm text-red-700">{visit.rejectionReason}</p>
            </div>
          )}
        </div>
        
        {/* Card footer with actions */}
        <div className="bg-gray-50 p-2.5 flex flex-wrap justify-end gap-2 border-t border-gray-200">
          <button 
            onClick={() => handleViewDetails(visit)}
            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors shadow-sm"
          >
            <FaEye className="mr-1.5 text-blue-600" size={12} /> View
          </button>
          
          {visit.status?.toLowerCase() === 'pending' && (
            <button 
              onClick={() => openCancelModal(visit)}
              className="inline-flex items-center px-2.5 py-1.5 border border-red-300 text-sm font-medium rounded-md bg-red-50 text-red-700 hover:bg-red-100 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors shadow-sm"
            >
              <FaTimes className="mr-1.5 text-red-600" size={12} /> Cancel
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderTableView = () => {
    return (
      <div className="pb-20"> {/* Add padding to bottom for fixed pagination */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden w-full">
          {loading || inmatesLoading ? (
            <div className="p-4 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading visit history...</p>
            </div>
          ) : (
            <div className="w-full" style={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>
              <table className="w-full table-fixed divide-y divide-gray-200 shadow-sm border border-gray-200">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-800 text-white sticky top-0 z-10 shadow-md">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[5%]">
                      #
                    </th>
                    <th 
                      onClick={() => handleSort("inmateId")}
                      className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[20%] cursor-pointer"
                    >
                      <div className="flex items-center">
                        Inmate <SortIcon field="inmateId" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("visitDate")}
                      className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[20%] cursor-pointer hidden sm:table-cell"
                    >
                      <div className="flex items-center">
                        Visit Date <SortIcon field="visitDate" />
                      </div>
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[15%] hidden md:table-cell">
                      Time
                    </th>
                    <th 
                      onClick={() => handleSort("purpose")}
                      className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[15%] cursor-pointer hidden md:table-cell"
                    >
                      <div className="flex items-center">
                        Purpose <SortIcon field="purpose" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("status")}
                      className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[15%] cursor-pointer"
                    >
                      <div className="flex items-center">
                        Status <SortIcon field="status" />
                      </div>
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[15%] hidden lg:table-cell">
                      Reason
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-[10%]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((schedule, index) => {
                    // Find the inmate in the inmates array using the inmateId
                    const inmate = inmates.find(i => i._id === (schedule.inmateId?._id || schedule.inmateId));
                    const inmateName = inmate ? inmate.inmate_name : (schedule.inmateId?.fullName || "Unknown Inmate");
                    
                    const canCancel = ["pending", "approved"].includes(schedule.status?.toLowerCase());
                    
                    return (
                      <tr 
                        key={schedule._id} 
                        className="hover:bg-blue-50 transition-colors duration-150 group cursor-pointer"
                        onClick={() => handleViewDetails(schedule)}
                      >
                        <td className="px-2 sm:px-4 py-3 sm:py-4 group-hover:bg-blue-100 transition-colors duration-150 text-center">
                          <div className="text-sm text-gray-700">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 group-hover:bg-blue-100 transition-colors duration-150">
                          <div className="text-sm text-gray-900 font-medium group-hover:text-blue-700 transition-colors duration-150">
                            {inmateName}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 group-hover:bg-blue-100 transition-colors duration-150 hidden sm:table-cell">
                          <div className="text-sm text-gray-900">
                            {schedule.visitDate ? format(new Date(schedule.visitDate), "MMM d, yyyy") : "N/A"}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 group-hover:bg-blue-100 transition-colors duration-150 hidden md:table-cell">
                          <div className="text-sm text-gray-500">
                            {schedule.visitTime || "N/A"}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 group-hover:bg-blue-100 transition-colors duration-150 hidden md:table-cell">
                          <div className="text-sm text-gray-900">
                            {schedule.purpose || "Not specified"}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 group-hover:bg-blue-100 transition-colors duration-150">
                          <span className={`px-1 sm:px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm ${getStatusColor(schedule.status)}`}>
                            {schedule.status?.charAt(0).toUpperCase() + schedule.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 group-hover:bg-blue-100 transition-colors duration-150 hidden lg:table-cell">
                          {schedule.status?.toLowerCase() === 'rejected' && schedule.rejectionReason ? (
                            <div 
                              className="text-sm text-red-600 max-w-xs truncate"
                              title={schedule.rejectionReason}
                            >
                              {schedule.rejectionReason}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              {schedule.status?.toLowerCase() === 'rejected' ? 'No reason provided' : '-'}
                            </div>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm font-medium text-center group-hover:bg-blue-100 transition-colors duration-150" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(schedule);
                              }}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-1 sm:p-1.5 rounded-full transition-all duration-150 hover:shadow-md transform hover:-translate-y-1"
                              title="View Details"
                            >
                              <FaEye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </button>
                            {canCancel && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCancelModal(schedule);
                                }}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-1 sm:p-1.5 rounded-full transition-all duration-150 hover:shadow-md transform hover:-translate-y-1"
                                title="Cancel Visit"
                              >
                                <FaTimes className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {filteredSchedules.length === 0 && !loading && (
                    <tr>
                      <td colSpan="7" className="px-4 py-10 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <FaHistory className="h-10 w-10 text-gray-300" />
                          <p className="text-lg font-medium">No visits found</p>
                          <p className="text-sm">{searchQuery ? "Try a different search term." : "No visits matching your filters."}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan="7" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Total Records: {filteredSchedules.length}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
        {filteredSchedules.length > itemsPerPage && (
          <PaginationBar 
            currentPage={currentPage} 
            totalPages={totalPages} 
            goToPage={goToPage} 
            goToPreviousPage={goToPreviousPage} 
            goToNextPage={goToNextPage} 
          />
        )}
      </div>
    );
  };

  const renderCardView = () => {
    return (
      <div className="pb-20"> {/* Add padding to bottom for fixed pagination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentItems.map((schedule, index) => (
            <div key={schedule._id} className="w-full">
              {renderHistoryCard(schedule, index)}
            </div>
          ))}
        </div>
        {filteredSchedules.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredSchedules.length)} of {filteredSchedules.length} records
          </div>
        )}
        {filteredSchedules.length > itemsPerPage && (
          <PaginationBar 
            currentPage={currentPage} 
            totalPages={totalPages} 
            goToPage={goToPage} 
            goToPreviousPage={goToPreviousPage} 
            goToNextPage={goToNextPage} 
          />
        )}
      </div>
    );
  };

  return (
    <div className={`visitor-container ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
      {/* Fixed Header Section */}
      <div className={`bg-white shadow-md p-4 fixed top-14 z-20 transition-all duration-300 ${
        isCollapsed ? "left-16 w-[calc(100%-4rem)]" : "left-64 w-[calc(100%-16rem)]"
      }`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="flex items-center mb-3 lg:mb-0">
            <FaHistory className="mr-2 text-blue-600 text-xl" />
            <h2 className="text-2xl font-bold text-gray-800">Visit History</h2>
          </div>

          {/* Controls - Filter, Display Toggle and Export */}
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {/* Filter Controls */}
            <div className="flex flex-1 lg:flex-none gap-2">
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Filter by status"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <FaChevronDown className="h-3 w-3" />
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="relative">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Filter by date range"
                >
                  <option value="all">All Dates</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                  <option value="recent">Last 30 Days</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <FaChevronDown className="h-3 w-3" />
                </div>
              </div>

              {/* Search */}
              <div className="relative flex-1 lg:w-60">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search visits..."
                  className="w-full border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FaSearch className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* View Toggle */}
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                onClick={() => setDisplayMode('card')}
                className={`px-3 py-2 text-xs font-medium rounded-l-lg border ${
                  displayMode === 'card' 
                    ? 'bg-gray-200 text-gray-800 border-gray-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setDisplayMode('table')}
                className={`px-3 py-2 text-xs font-medium rounded-r-lg border-t border-r border-b ${
                  displayMode === 'table' 
                    ? 'bg-gray-200 text-gray-800 border-gray-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Table
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchSchedules}
              className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
              title="Refresh Data"
            >
              <FaSync className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Export Button */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
                title="Export Visit History"
              >
                <FaDownload className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">Export</span>
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200 py-2">
                  <button
                    onClick={() => {
                      handlePrintHistory();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                  >
                    <FaPrint className="mr-2 text-blue-600" /> Print History
                  </button>
                  <button
                    onClick={() => {
                      handleDownloadHistory();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                  >
                    <FaFileExcel className="mr-2 text-green-600" /> Export to CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Push content down to prevent overlap with fixed header */}
      <div className="pt-32">
        {/* Visit History List */}
        {loading ? (
          <div className="visitor-loading">
            <div className="visitor-spinner"></div>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="visitor-empty-state">
            <FaHistory className="visitor-empty-icon" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No visits found</h3>
            <p className="visitor-empty-text">
              No visits match your current filters. Try changing your search criteria or create a new visit schedule.
            </p>
          </div>
        ) : (
          displayMode === 'table' ? renderTableView() : renderCardView()
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedSchedule && (
          <ScheduleDetailModal
            isOpen={showDetailModal}
            onClose={closeDetailModal}
            schedule={selectedSchedule}
            onCancel={openCancelModal}
          >
            {/* Rejection reason is now handled in the notes field for better integration with the modal */}
          </ScheduleDetailModal>
        )}

        {/* Cancel Confirmation Modal */}
        <CancelConfirmationModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          schedule={scheduleToCancel}
          onConfirm={() => scheduleToCancel && handleCancelVisit(scheduleToCancel._id)}
        />

        {/* Mobile bottom spacing */}
        <div className="visitor-page-bottom-space"></div>
      </div>
    </div>
  );
}

export default VisitHistory; 