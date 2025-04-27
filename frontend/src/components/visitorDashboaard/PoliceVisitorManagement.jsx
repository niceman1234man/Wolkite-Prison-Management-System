import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaCheck, 
  FaTimes, 
  FaCalendarAlt,
  FaUser,
  FaIdCard,
  FaPhone,
  FaMapMarkerAlt,
  FaClipboard,
  FaThLarge,
  FaTable,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaDownload,
  FaPrint,
  FaHistory,
  FaSync,
  FaTrash,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
  FaArchive
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";
import ConfirmModal from "../Modals/ConfirmModal";
import '../../styles/table.css';
import '../../styles/responsive.css';
import { format, parseISO, isAfter, isPast, differenceInDays } from 'date-fns';
import { useSelector } from "react-redux";

const PoliceVisitorManagement = () => {
  // State management
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [displayMode, setDisplayMode] = useState('card');
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sortField, setSortField] = useState("visitDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [dateRange, setDateRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    status: "all",
    dateRange: "all",
    searchQuery: ""
  });
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3; // Total number of slides
  
  // Get current user from Redux
  const currentUser = useSelector(state => state.auth?.user || null);
  
  // Confirm Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [visitorToDelete, setVisitorToDelete] = useState(null);

  // Fetch visitors data
  const fetchVisitors = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching visitors...');
      
      // Fetch schedules for police officers
      const schedulesResponse = await axiosInstance.get("/visitor/schedule/schedules", {
        params: {
          role: "police-officer",
          status: "all"
        }
      });
      console.log('Schedules response:', schedulesResponse.data);
      
      // Get the schedules array from the response
      const schedules = Array.isArray(schedulesResponse.data) ? schedulesResponse.data : 
                       Array.isArray(schedulesResponse.data.data) ? schedulesResponse.data.data : [];
      
      // Transform the data to include formatted dates and visitor details
      const formattedData = schedules.map(schedule => ({
        ...schedule,
        formattedDate: format(new Date(schedule.visitDate), 'MMM dd, yyyy'),
        formattedTime: format(new Date(schedule.visitDate), 'hh:mm a'),
        isPastVisit: new Date(schedule.visitDate) < new Date(),
        visitorDetails: {
          firstName: schedule.firstName || schedule.userId?.firstName,
          middleName: schedule.middleName || schedule.userId?.middleName,
          lastName: schedule.lastName || schedule.userId?.lastName,
          phone: schedule.phone || schedule.userId?.phone,
          email: schedule.userId?.email,
          idType: schedule.idType,
          idNumber: schedule.idNumber,
          address: schedule.address
        },
        inmate: schedule.inmate || {
          firstName: schedule.inmate?.firstName,
          middleName: schedule.inmate?.middleName,
          lastName: schedule.inmate?.lastName,
          inmateId: schedule.inmate?.inmateId,
          cellBlock: schedule.inmate?.cellBlock
        }
      }));
      
      console.log('Formatted data:', formattedData);
      setVisitors(formattedData);
      setError(null);
    } catch (error) {
      console.error("Error fetching visitors:", error);
      setError(error.response?.data?.message || "Failed to load visitor data");
      toast.error(error.response?.data?.message || "Failed to load visitor data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  // Add this effect to handle clicking outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.status-dropdown')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ml-1" />;
    return sortDirection === "asc" ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />;
  };

  // Filter visitors based on search query, status, and date range
  const filteredVisitors = useMemo(() => {
    if (!visitors || visitors.length === 0) return [];
    
    let filtered = visitors.filter(visitor => {
      if (!visitor) return false;
      
      // Search filter
      const matchesSearch = !searchQuery || searchQuery.trim() === '' || (
        (visitor.visitorDetails.firstName && visitor.visitorDetails.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (visitor.visitorDetails.lastName && visitor.visitorDetails.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (visitor.visitorDetails.phone && visitor.visitorDetails.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (visitor.purpose && visitor.purpose.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (visitor.visitorDetails.idNumber && visitor.visitorDetails.idNumber.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      // Status filter
      const matchesStatus = statusFilter === "all" || 
        (visitor.status && visitor.status.toLowerCase() === statusFilter.toLowerCase());

      // Date range filter
      const visitDate = new Date(visitor.visitDate);
      const today = new Date();
      let matchesDateRange = true;

      switch (dateRange) {
        case "today":
          matchesDateRange = visitDate.toDateString() === today.toDateString();
          break;
        case "upcoming":
          matchesDateRange = isAfter(visitDate, today);
          break;
        case "past":
          matchesDateRange = isPast(visitDate);
          break;
        case "recent":
          matchesDateRange = differenceInDays(today, visitDate) <= 7;
          break;
        default:
          matchesDateRange = true;
      }

      return matchesSearch && matchesStatus && matchesDateRange;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortField === "visitDate") {
        return sortDirection === "asc" 
          ? new Date(aValue) - new Date(bValue)
          : new Date(bValue) - new Date(aValue);
      }
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [visitors, searchQuery, statusFilter, dateRange, sortField, sortDirection]);

  // Handle status update
  const handleStatusUpdate = async (visitorId, newStatus) => {
    try {
      let endpoint;
      if (newStatus === "approved") {
        endpoint = `/visitor/schedule/${visitorId}/approve`;
      } else if (newStatus === "rejected") {
        endpoint = `/visitor/schedule/${visitorId}/reject`;
      } else if (newStatus === "pending") {
        // For pending status, we'll update the schedule directly
        endpoint = `/visitor/schedule/${visitorId}`;
        const response = await axiosInstance.put(endpoint, { status: "pending" });
        if (response.data.success) {
          toast.success("Schedule status updated to pending");
          fetchVisitors(); // Refresh the list
          setOpenDropdownId(null); // Close the dropdown
          return;
        }
      } else {
        throw new Error("Invalid status update");
      }

      const response = await axiosInstance.put(endpoint);
      if (response.data.success) {
        toast.success(`Schedule status updated to ${newStatus}`);
        fetchVisitors(); // Refresh the list
        setOpenDropdownId(null); // Close the dropdown
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    let bgColor, textColor, icon;
    
    switch(status?.toLowerCase()) {
      case 'approved':
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        icon = <FaCheck className="mr-1" />;
        break;
      case 'rejected':
        bgColor = "bg-red-100";
        textColor = "text-red-800";
        icon = <FaTimes className="mr-1" />;
        break;
      case 'pending':
      default:
        bgColor = "bg-yellow-100";
        textColor = "text-yellow-800";
        icon = <FaCalendarAlt className="mr-1" />;
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor}`}>
        {icon}
        {status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Pending'}
      </span>
    );
  };

  // Export data
  const exportData = () => {
    const data = filteredVisitors.map(visitor => ({
      Name: `${visitor.visitorDetails.firstName} ${visitor.visitorDetails.lastName}`,
      Phone: visitor.visitorDetails.phone,
      ID: visitor.visitorDetails.idNumber,
      Purpose: visitor.purpose,
      'Visit Date': formatDate(visitor.visitDate),
      Status: visitor.status
    }));

    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `visitors_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // Print data
  const printData = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Visitor Management Report</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Visitor Management Report</h1>
          <p>Generated on: ${format(new Date(), 'PPP')}</p>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>ID</th>
                <th>Purpose</th>
                <th>Visit Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredVisitors.map(visitor => `
                <tr>
                  <td>${visitor.visitorDetails.firstName} ${visitor.visitorDetails.lastName}</td>
                  <td>${visitor.visitorDetails.phone}</td>
                  <td>${visitor.visitorDetails.idNumber}</td>
                  <td>${visitor.purpose}</td>
                  <td>${formatDate(visitor.visitDate)}</td>
                  <td>${visitor.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Helper function for direct manual archiving
  const manuallyArchiveVisitor = async (visitor) => {
    try {
      console.log('Manually archiving visitor before deletion:', visitor);
      
      // We need to get the user ID from localStorage
      let userId = null;
      try {
        const userString = localStorage.getItem('user');
        if (userString) {
          const userData = JSON.parse(userString);
          userId = userData.id || userData._id;
          console.log('Found user ID in localStorage:', userId);
        }
      } catch (e) {
        console.error('Error getting user data from localStorage:', e);
      }
      
      if (!userId) {
        console.warn('No user ID found for archiving, using fallback ID');
        // Use a fallback ID if no user ID is found
        userId = '000000000000000000000000';
      }
      
      // Create the archive object directly using Archive model schema format
      const archiveData = {
        entityType: 'visitor',
        originalId: visitor._id,
        data: visitor,
        deletedBy: userId,
        deletionReason: 'Manually archived before deletion',
        metadata: {
          archivedAt: new Date().toISOString(),
          archivedBy: 'police-officer'
        }
      };
      
      // Send directly to the manual archive endpoint with the correct API path
      const response = await axiosInstance.post('/manual-archive', archiveData);
      
      console.log('Manual archive response:', response.data);
      return { 
        success: true, 
        message: 'Successfully created archive record'
      };
    } catch (error) {
      console.error('Failed to manually archive visitor:', error);
      return { 
        success: false, 
        message: 'Failed to create archive record',
        error
      };
    }
  };

  const handleDelete = async (visitorId) => {
    try {
      // Find the visitor in our local state
      const visitorToArchive = visitors.find(visitor => visitor._id === visitorId);
      
      if (visitorToArchive) {
        console.log('Found visitor to delete:', visitorToArchive);
        
        // Step 1: First manually create an archive
        let archiveSuccess = false;
        let archiveMessage = '';
        
        try {
          // Manually create an archive record
          const archiveResult = await manuallyArchiveVisitor(visitorToArchive);
          if (archiveResult.success) {
            archiveSuccess = true;
            archiveMessage = 'Archive created successfully';
            console.log('Visitor successfully archived before deletion');
          } else {
            archiveMessage = archiveResult.message;
            console.warn('Failed to archive visitor:', archiveResult.message);
          }
        } catch (archiveError) {
          archiveMessage = 'Archive error: ' + (archiveError.message || 'Unknown error');
          console.error('Error during archive process:', archiveError);
        }
        
        // Step 2: Then delete the visitor schedule
        try {
          console.log('Deleting visitor schedule:', visitorId);
          const deleteResponse = await axiosInstance.delete(`/visitor/schedule/${visitorId}`);
          
          console.log('Delete API response:', deleteResponse.data);
          
          if (deleteResponse.data.success) {
            if (archiveSuccess) {
              toast.success('Visitor deleted and archived successfully');
            } else {
              toast.success('Visitor deleted successfully (archive may not be available)');
              console.warn('Archive status:', archiveMessage);
            }
            
          fetchVisitors();
            setVisitorToDelete(null);
        } else {
            console.error('Delete API returned success:false', deleteResponse.data);
            toast.error(deleteResponse.data.message || 'Failed to delete visitor schedule');
          }
        } catch (deleteError) {
          console.error('Error deleting visitor:', deleteError);
          
          if (deleteError.response) {
            toast.error(`Delete error (${deleteError.response.status}): ${deleteError.response.data?.message || deleteError.message}`);
          } else {
            toast.error('Delete error: ' + deleteError.message);
          }
        }
      } else {
        toast.error('Visitor data not found. Cannot delete.');
        }
      } catch (error) {
      console.error('Error in delete process:', error);
      toast.error('An unexpected error occurred during the delete process');
    }
  };

  // New function to handle delete button click
  const handleDeleteClick = (visitorId) => {
    setVisitorToDelete(visitorId);
    setShowConfirmModal(true);
  };
  
  // Function to handle confirmation
  const handleConfirmDelete = () => {
    if (visitorToDelete) {
      handleDelete(visitorToDelete);
      }
    setShowConfirmModal(false);
  };
  
  // Function to handle cancellation
  const handleCancelDelete = () => {
    setVisitorToDelete(null);
    setShowConfirmModal(false);
  };

  // Add getStatusColor function
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      case 'completed':
        return 'text-blue-600';
      case 'cancelled':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  // Add slide navigation functions
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchVisitors}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 mr-4">
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Visitor Management</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDisplayMode('card')}
                className={`p-2 rounded-lg ${displayMode === 'card' ? 'bg-teal-100 text-teal-600' : 'text-gray-500 hover:bg-gray-100'}`}
                title="Card View"
              >
                <FaThLarge />
              </button>
              <button
                onClick={() => setDisplayMode('table')}
                className={`p-2 rounded-lg ${displayMode === 'table' ? 'bg-teal-100 text-teal-600' : 'text-gray-500 hover:bg-gray-100'}`}
                title="Table View"
              >
                <FaTable />
              </button>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
              title="Export to CSV"
            >
              <FaDownload className="mr-1" /> Export
            </button>
            <button
              onClick={printData}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
              title="Print Report"
            >
              <FaPrint className="mr-1" /> Print
            </button>
            <button
              onClick={fetchVisitors}
              className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
              title="Refresh Data"
            >
              <FaSync className="mr-1" /> Refresh
            </button>
            <a
              href="/police-officer/archive"
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
              title="View Archive"
            >
              <FaArchive className="mr-1" /> Archives
            </a>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search visitors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="recent">Last 7 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {displayMode === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredVisitors.map((visitor) => (
              <div key={visitor._id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {`${visitor.visitorDetails.firstName || ''} ${visitor.visitorDetails.middleName || ''} ${visitor.visitorDetails.lastName || ''}`}
                    </h3>
                    <p className="text-gray-600">{visitor.visitorDetails.phone || 'N/A'}</p>
                  </div>
                  <StatusBadge status={visitor.status || 'Pending'} />
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-gray-700">
                    <span className="font-medium">Purpose:</span> {visitor.purpose || 'N/A'}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Visit Date:</span> {formatDate(visitor.visitDate)}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">ID:</span> {visitor.visitorDetails.idNumber || 'N/A'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedVisitor(visitor);
                      setShowDetailModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
                  >
                    <FaEye className="mr-1" /> View
                  </button>
                  {visitor.status?.toLowerCase() === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(visitor._id, 'approved')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
                      >
                        <FaCheck className="mr-1" /> Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(visitor._id, 'rejected')}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
                      >
                        <FaTimes className="mr-1" /> Reject
                      </button>
                    </>
                  ) : (
                    <div className="relative status-dropdown">
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === visitor._id ? null : visitor._id)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
                      >
                        <FaSync className="mr-1" /> Change
                      </button>
                      {openDropdownId === visitor._id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                          <button
                            onClick={() => handleStatusUpdate(visitor._id, 'pending')}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Set as Pending
                          </button>
                          {visitor.status?.toLowerCase() !== 'approved' && (
                            <button
                              onClick={() => handleStatusUpdate(visitor._id, 'approved')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Set as Approved
                            </button>
                          )}
                          {visitor.status?.toLowerCase() !== 'rejected' && (
                            <button
                              onClick={() => handleStatusUpdate(visitor._id, 'rejected')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Set as Rejected
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => handleDeleteClick(visitor._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
                    title="Delete Visit"
                  >
                    <FaTrash className="mr-1" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[1000px] bg-white rounded-lg shadow-md border border-gray-200">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" style={{ width: '30%' }} onClick={() => handleSort("visitorDetails.firstName")}>
                      Name {getSortIcon("visitorDetails.firstName")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" style={{ width: '20%' }} onClick={() => handleSort("visitorDetails.phone")}>
                      Phone {getSortIcon("visitorDetails.phone")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" style={{ width: '20%' }} onClick={() => handleSort("visitDate")}>
                      Visit Date {getSortIcon("visitDate")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" style={{ width: '15%' }} onClick={() => handleSort("status")}>
                      Status {getSortIcon("status")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '15%', minWidth: '150px' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVisitors.map((visitor) => (
                    <tr key={visitor._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap" style={{ width: '30%' }}>
                        <div className="text-sm font-medium text-gray-900">
                          {`${visitor.visitorDetails.firstName || ''} ${visitor.visitorDetails.middleName || ''} ${visitor.visitorDetails.lastName || ''}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {visitor.visitorDetails.idNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ width: '20%' }}>
                        <div className="text-sm text-gray-500">{visitor.visitorDetails.phone || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ width: '20%' }}>
                        <div className="text-sm text-gray-500">{formatDate(visitor.visitDate)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ width: '15%' }}>
                        <StatusBadge status={visitor.status || 'Pending'} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center" style={{ width: '15%', minWidth: '150px' }}>
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedVisitor(visitor);
                              setShowDetailModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
                            title="View Details"
                          >
                            <FaEye className="mr-1" /> View
                          </button>
                          {visitor.status?.toLowerCase() === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(visitor._id, 'approved')}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
                                title="Approve Visit"
                              >
                                <FaCheck className="mr-1" /> Approve
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(visitor._id, 'rejected')}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
                                title="Reject Visit"
                              >
                                <FaTimes className="mr-1" /> Reject
                              </button>
                            </>
                          ) : (
                            <div className="relative status-dropdown">
                              <button
                                onClick={() => setOpenDropdownId(openDropdownId === visitor._id ? null : visitor._id)}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
                                title="Change Status"
                              >
                                <FaSync className="mr-1" /> Change
                              </button>
                              {openDropdownId === visitor._id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                                  <button
                                    onClick={() => handleStatusUpdate(visitor._id, 'pending')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    Set as Pending
                                  </button>
                                  {visitor.status?.toLowerCase() !== 'approved' && (
                                    <button
                                      onClick={() => handleStatusUpdate(visitor._id, 'approved')}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      Set as Approved
                                    </button>
                                  )}
                                  {visitor.status?.toLowerCase() !== 'rejected' && (
                                    <button
                                      onClick={() => handleStatusUpdate(visitor._id, 'rejected')}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      Set as Rejected
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          <button
                            onClick={() => handleDeleteClick(visitor._id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
                            title="Delete Visit"
                          >
                            <FaTrash className="mr-1" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedVisitor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Fixed Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Visitor Details</h2>
                  <button
                    onClick={() => setSelectedVisitor(null)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto p-6">
                {/* Slide Navigation */}
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={prevSlide}
                    className="flex items-center text-gray-600 hover:text-gray-800"
                  >
                    <FaChevronLeft className="mr-2" />
                    Previous
                  </button>
                  <div className="flex space-x-2">
                    {[...Array(totalSlides)].map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full ${
                          currentSlide === index ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={nextSlide}
                    className="flex items-center text-gray-600 hover:text-gray-800"
                  >
                    Next
                    <FaChevronRight className="ml-2" />
                  </button>
                </div>

                {/* Slides */}
                <div className="relative">
                  {/* Slide 1: Basic Information */}
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${currentSlide === 0 ? 'block' : 'hidden'}`}>
                    {/* Visitor Photos */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Visitor Photos</h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-2">Profile Photo</p>
                            <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                              {selectedVisitor.visitorPhoto ? (
                                <img 
                                  src={`${import.meta.env.VITE_API_URL}${selectedVisitor.visitorPhoto}`} 
                                  alt="Profile" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <FaUser size={48} />
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-2">ID Photo</p>
                            <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                              {selectedVisitor.idPhoto ? (
                                <img 
                                  src={`${import.meta.env.VITE_API_URL}${selectedVisitor.idPhoto}`} 
                                  alt="ID" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <FaIdCard size={48} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <FaUser className="mt-1 mr-3 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Full Name</p>
                              <p className="font-medium text-gray-900">
                                {`${selectedVisitor.firstName || ''} ${selectedVisitor.middleName || ''} ${selectedVisitor.lastName || ''}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <FaIdCard className="mt-1 mr-3 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">ID Information</p>
                              <p className="font-medium text-gray-900">
                                {selectedVisitor.idType || 'N/A'} - {selectedVisitor.idNumber || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <FaPhone className="mt-1 mr-3 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Contact</p>
                              <p className="font-medium text-gray-900">{selectedVisitor.phone || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <FaClipboard className="mt-1 mr-3 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Purpose</p>
                              <p className="font-medium text-gray-900">{selectedVisitor.purpose || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Slide 2: Visit & Inmate Information */}
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${currentSlide === 1 ? 'block' : 'hidden'}`}>
                    {/* Visit Information */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Visit Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <FaCalendarAlt className="mt-1 mr-3 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Visit Date & Time</p>
                              <p className="font-medium text-gray-900">{formatDate(selectedVisitor.visitDate)}</p>
                              <p className="text-sm text-gray-600">{selectedVisitor.visitTime}</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <FaClock className="mt-1 mr-3 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Duration</p>
                              <p className="font-medium text-gray-900">{selectedVisitor.visitDuration} minutes</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <FaClipboard className="mt-1 mr-3 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Status</p>
                              <StatusBadge status={selectedVisitor.status || 'Pending'} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Inmate Information */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Inmate Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <FaUser className="mt-1 mr-3 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Inmate Name</p>
                              <p className="font-medium text-gray-900">
                                {`${selectedVisitor.inmate?.firstName || ''} ${selectedVisitor.inmate?.middleName || ''} ${selectedVisitor.inmate?.lastName || ''}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <FaIdCard className="mt-1 mr-3 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Inmate ID</p>
                              <p className="font-medium text-gray-900">{selectedVisitor.inmateId || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <FaMapMarkerAlt className="mt-1 mr-3 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Cell Block</p>
                              <p className="font-medium text-gray-900">{selectedVisitor.inmate?.cellBlock || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <FaClipboard className="mt-1 mr-3 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Relationship</p>
                              <p className="font-medium text-gray-900 capitalize">{selectedVisitor.relationship || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Slide 3: Approval & Additional Information */}
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${currentSlide === 2 ? 'block' : 'hidden'}`}>
                    {/* Approval Information */}
                    {selectedVisitor.status?.toLowerCase() !== 'pending' && (
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Approval Details</h3>
                          <div className="space-y-3">
                            {selectedVisitor.approvedBy && (
                              <div className="flex items-start">
                                <FaUser className="mt-1 mr-3 text-gray-500" />
                                <div>
                                  <p className="text-sm text-gray-500">Approved By</p>
                                  <p className="font-medium text-gray-900">{selectedVisitor.approvedBy?.name || 'Unknown'}</p>
                                </div>
                              </div>
                            )}
                            {selectedVisitor.approvedAt && (
                              <div className="flex items-start">
                                <FaCalendarAlt className="mt-1 mr-3 text-gray-500" />
                                <div>
                                  <p className="text-sm text-gray-500">Approval Date</p>
                                  <p className="font-medium text-gray-900">{formatDate(selectedVisitor.approvedAt)}</p>
                                </div>
                              </div>
                            )}
                            {selectedVisitor.status?.toLowerCase() === 'rejected' && selectedVisitor.rejectionReason && (
                              <div className="flex items-start">
                                <FaTimes className="mt-1 mr-3 text-red-500" />
                                <div>
                                  <p className="text-sm text-gray-500">Rejection Reason</p>
                                  <p className="font-medium text-red-600">{selectedVisitor.rejectionReason}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Information */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
                        <div className="space-y-3">
                          {selectedVisitor.notes && (
                            <div className="flex items-start">
                              <FaClipboard className="mt-1 mr-3 text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-500">Notes</p>
                                <p className="font-medium text-gray-900">{selectedVisitor.notes}</p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-start">
                            <FaHistory className="mt-1 mr-3 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Last Updated</p>
                              <p className="font-medium text-gray-900">{formatDate(selectedVisitor.updatedAt)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end gap-4">
                  {selectedVisitor.status?.toLowerCase() === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(selectedVisitor._id, 'approved')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                      >
                        <FaCheck className="mr-2" /> Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedVisitor._id, 'rejected')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                      >
                        <FaTimes className="mr-2" /> Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedVisitor(null)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={showConfirmModal}
        message="Are you sure you want to delete this visitor schedule? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default PoliceVisitorManagement; 