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
  FaTrash
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";
import '../../styles/table.css';
import '../../styles/responsive.css';
import { format, parseISO, isAfter, isPast, differenceInDays } from 'date-fns';

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

  const handleDelete = async (visitorId) => {
    if (window.confirm('Are you sure you want to delete this visitor schedule?')) {
      try {
        const response = await axiosInstance.delete(`/visitor/schedule/${visitorId}`);
        if (response.data.success) {
          toast.success('Visitor schedule deleted successfully');
          fetchVisitors();
        } else {
          toast.error(response.data.message || 'Failed to delete visitor schedule');
        }
      } catch (error) {
        console.error('Error deleting visitor schedule:', error);
        toast.error(error.response?.data?.message || 'Failed to delete visitor schedule');
      }
    }
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
                    onClick={() => handleDelete(visitor._id)}
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
                            onClick={() => handleDelete(visitor._id)}
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
        {showDetailModal && selectedVisitor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Visitor Details</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Personal Information</h3>
                      <div className="space-y-2">
                        <p className="flex items-center text-gray-700">
                          <FaUser className="mr-2 text-gray-500" />
                          <span className="font-medium">Name:</span> {`${selectedVisitor.visitorDetails.firstName || ''} ${selectedVisitor.visitorDetails.middleName || ''} ${selectedVisitor.visitorDetails.lastName || ''}`}
                        </p>
                        <p className="flex items-center text-gray-700">
                          <FaIdCard className="mr-2 text-gray-500" />
                          <span className="font-medium">ID Type:</span> {selectedVisitor.visitorDetails.idType || 'N/A'}
                        </p>
                        <p className="flex items-center text-gray-700">
                          <FaIdCard className="mr-2 text-gray-500" />
                          <span className="font-medium">ID Number:</span> {selectedVisitor.visitorDetails.idNumber || 'N/A'}
                        </p>
                        <p className="flex items-center text-gray-700">
                          <FaPhone className="mr-2 text-gray-500" />
                          <span className="font-medium">Phone:</span> {selectedVisitor.visitorDetails.phone || 'N/A'}
                        </p>
                        <p className="flex items-center text-gray-700">
                          <FaMapMarkerAlt className="mr-2 text-gray-500" />
                          <span className="font-medium">Address:</span> {selectedVisitor.visitorDetails.address || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Visit Information</h3>
                      <div className="space-y-2">
                        <p className="flex items-center text-gray-700">
                          <FaCalendarAlt className="mr-2 text-gray-500" />
                          <span className="font-medium">Visit Date:</span> {formatDate(selectedVisitor.visitDate)}
                        </p>
                        <p className="flex items-center text-gray-700">
                          <FaClipboard className="mr-2 text-gray-500" />
                          <span className="font-medium">Purpose:</span> {selectedVisitor.purpose || 'N/A'}
                        </p>
                        <p className="flex items-center text-gray-700">
                          <FaUser className="mr-2 text-gray-500" />
                          <span className="font-medium">Relationship:</span> {selectedVisitor.visitorDetails.relationship || 'N/A'}
                        </p>
                        <p className="flex items-center text-gray-700">
                          <FaClipboard className="mr-2 text-gray-500" />
                          <span className="font-medium">Status:</span> <StatusBadge status={selectedVisitor.status || 'Pending'} />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-4">
                  {selectedVisitor.status?.toLowerCase() === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedVisitor._id, 'approved');
                          setShowDetailModal(false);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
                      >
                        <FaCheck className="mr-2" /> Approve
                      </button>
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedVisitor._id, 'rejected');
                          setShowDetailModal(false);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center"
                      >
                        <FaTimes className="mr-2" /> Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoliceVisitorManagement; 