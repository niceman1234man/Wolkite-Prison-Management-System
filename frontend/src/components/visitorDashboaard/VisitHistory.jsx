import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";
import { format, parseISO, isAfter, isPast, differenceInDays } from "date-fns";
import { useSelector } from "react-redux";
import { FaDownload, FaPrint, FaTimes, FaCalendarAlt, FaClock, FaCheck, FaTimesCircle, FaArrowRight, FaUser, FaFilter, FaHistory, FaSync, FaSearch, FaSort, FaSortUp, FaSortDown, FaEye } from "react-icons/fa";
import ScheduleDetailModal from "./partials/ScheduleDetailModal";
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

  useEffect(() => {
    fetchSchedules();
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

  const handleCancelVisit = async (scheduleId) => {
    if (!window.confirm("Are you sure you want to cancel this visit?")) {
      return;
    }

    try {
      // Get user ID from localStorage
      let userId = null;
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        userId = userData.id || userData._id;
      }

      console.log("Cancelling visit with schedule ID:", scheduleId, "and user ID:", userId);
      
      // Include userId as query parameter for authorization
      const response = await axiosInstance.put(
        `/visitor/schedule/${scheduleId}/cancel${userId ? `?userId=${userId}` : ''}`
      );
      
      if (response.data.success) {
        toast.success("Visit cancelled successfully");
        fetchSchedules(); // Refresh the list
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error("Error cancelling visit:", error);
      toast.error(error.response?.data?.message || "Failed to cancel visit");
    }
  };

  const handleDownloadHistory = () => {
    try {
      // Format data for download
      const formattedData = filteredSchedules.map(schedule => {
        return {
          visitId: schedule._id,
          inmateName: schedule.inmateId?.fullName || 'Unknown',
          visitDate: schedule.visitDate ? format(new Date(schedule.visitDate), "MMM d, yyyy") : 'Not specified',
          visitTime: schedule.visitTime || 'Not specified',
          duration: `${schedule.visitDuration || "30"} minutes`,
          purpose: schedule.purpose || 'Not specified',
          relationship: schedule.relationship || 'Not specified',
          status: schedule.status || 'Unknown',
          visitorName: `${schedule.firstName || ''} ${schedule.middleName || ''} ${schedule.lastName || ''}`.trim() || 'Unknown',
          createdAt: schedule.createdAt ? format(new Date(schedule.createdAt), "MMM d, yyyy 'at' h:mm a") : 'Unknown',
        };
      });

      // Create dropdown for download options
      const downloadOptions = document.createElement('div');
      downloadOptions.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
      downloadOptions.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-5 max-w-md w-full">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Download Visit History</h3>
          <div class="space-y-3">
            <button id="download-json" class="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <div class="flex items-center">
                <span class="bg-blue-100 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </span>
                <span class="ml-3 font-medium text-gray-700">Download as JSON</span>
              </div>
              <span class="text-xs text-gray-500">Detailed data format</span>
            </button>
            
            <button id="download-csv" class="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <div class="flex items-center">
                <span class="bg-green-100 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
                  </svg>
                </span>
                <span class="ml-3 font-medium text-gray-700">Download as CSV</span>
              </div>
              <span class="text-xs text-gray-500">Spreadsheet compatible</span>
            </button>
          </div>
          <div class="flex justify-end mt-5">
            <button id="cancel-download" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(downloadOptions);
      
      // Download as JSON
      document.getElementById('download-json').addEventListener('click', () => {
        const dataStr = JSON.stringify(formattedData, null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
        
        const exportLink = document.createElement('a');
        exportLink.setAttribute('href', dataUri);
        exportLink.setAttribute('download', `visit-history-${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(exportLink);
        exportLink.click();
        document.body.removeChild(exportLink);
        document.body.removeChild(downloadOptions);
      });
      
      // Download as CSV
      document.getElementById('download-csv').addEventListener('click', () => {
        // Create headers
        const headers = Object.keys(formattedData[0] || {});
        
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
          ...formattedData.map(row => 
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
        document.body.removeChild(downloadOptions);
      });
      
      // Cancel download
      document.getElementById('cancel-download').addEventListener('click', () => {
        document.body.removeChild(downloadOptions);
      });
      
      // Close when clicking outside
      downloadOptions.addEventListener('click', (e) => {
        if (e.target === downloadOptions) {
          document.body.removeChild(downloadOptions);
        }
      });
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

  const handleViewDetails = (schedule) => {
    setSelectedSchedule(schedule);
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

  const renderHistoryCard = (schedule) => {
    const inmateName = schedule.inmateId?.fullName || "Unknown Inmate";
    const formattedDate = schedule.visitDate 
      ? format(new Date(schedule.visitDate), "MMM d, yyyy")
      : "No date";
    const canCancel = ["pending", "approved"].includes(schedule.status?.toLowerCase());
      
    return (
      <div key={schedule._id} className="visitor-item-card">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-sm">{inmateName}</h3>
          <StatusBadge status={schedule.status} />
        </div>
        
        <div className="text-xs text-gray-600 mb-3">
          <div className="flex items-center mb-1">
            <FaCalendarAlt className="mr-1 text-gray-400" /> 
            <span>{formattedDate} • {schedule.visitTime || "No time"}</span>
          </div>
          <p><span className="font-medium">Purpose:</span> {schedule.purpose || "Not specified"}</p>
          <p><span className="font-medium">Relationship:</span> {schedule.relationship || "Not specified"}</p>
        </div>
        
        <div className="flex justify-end gap-1 mt-2">
          <button 
            onClick={() => handleViewDetails(schedule)}
            className="visitor-button visitor-button-light text-xs"
          >
            <FaEye className="mr-1" /> View
          </button>
          {canCancel && (
            <button 
              onClick={() => handleCancelVisit(schedule._id)}
              className="visitor-button visitor-button-danger text-xs"
            >
              <FaTimes className="mr-1" /> Cancel
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderTableView = () => {
    return (
      <div className="visitor-table-container">
        <table className="visitor-table">
          <thead className="bg-gray-50">
            <tr>
              <th 
                onClick={() => handleSort("inmateId")} 
                className="cursor-pointer"
              >
                <div className="flex items-center">
                  Inmate <SortIcon field="inmateId" />
                </div>
              </th>
              <th 
                onClick={() => handleSort("visitDate")}
                className="cursor-pointer hidden sm:table-cell"
              >
                <div className="flex items-center">
                  Visit Date <SortIcon field="visitDate" />
                </div>
              </th>
              <th className="hidden md:table-cell">Time</th>
              <th 
                onClick={() => handleSort("purpose")}
                className="cursor-pointer hidden md:table-cell"
              >
                <div className="flex items-center">
                  Purpose <SortIcon field="purpose" />
                </div>
              </th>
              <th 
                onClick={() => handleSort("status")}
                className="cursor-pointer"
              >
                <div className="flex items-center">
                  Status <SortIcon field="status" />
                </div>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchedules.map(schedule => {
              const inmateName = schedule.inmateId?.fullName || "Unknown Inmate";
              const canCancel = ["pending", "approved"].includes(schedule.status?.toLowerCase());
              
              return (
                <tr key={schedule._id} className="hover:bg-gray-50">
                  <td>{inmateName}</td>
                  <td className="hidden sm:table-cell">
                    {schedule.visitDate ? format(new Date(schedule.visitDate), "MMM d, yyyy") : "N/A"}
                  </td>
                  <td className="hidden md:table-cell">{schedule.visitTime || "N/A"}</td>
                  <td className="hidden md:table-cell">{schedule.purpose || "Not specified"}</td>
                  <td><StatusBadge status={schedule.status} /></td>
                  <td>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleViewDetails(schedule)}
                        className="visitor-button visitor-button-light text-xs"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      {canCancel && (
                        <button 
                          onClick={() => handleCancelVisit(schedule._id)}
                          className="visitor-button visitor-button-danger text-xs"
                          title="Cancel Visit"
                        >
                          <FaTimes />
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

  const renderCardView = () => {
    return (
      <div className="visitor-card-grid">
        {filteredSchedules.map(renderHistoryCard)}
      </div>
    );
  };

  const renderVisitSummary = () => {
    const totalVisits = schedules.length;
    const pendingVisits = schedules.filter(s => s.status?.toLowerCase() === "pending").length;
    const completedVisits = schedules.filter(s => s.status?.toLowerCase() === "completed").length;
    const cancelledVisits = schedules.filter(s => s.status?.toLowerCase() === "cancelled").length;
    const upcomingVisits = schedules.filter(s => {
      try {
        return s.visitDate && isAfter(parseISO(s.visitDate), new Date());
      } catch (e) {
        return false;
      }
    }).length;
    
    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <div className="visitor-item-card flex flex-col items-center justify-center p-3 text-center">
          <span className="text-xl font-bold text-teal-600">{totalVisits}</span>
          <span className="text-xs font-medium text-gray-500">Total</span>
        </div>
        <div className="visitor-item-card flex flex-col items-center justify-center p-3 text-center">
          <span className="text-xl font-bold text-yellow-500">{pendingVisits}</span>
          <span className="text-xs font-medium text-gray-500">Pending</span>
        </div>
        <div className="visitor-item-card flex flex-col items-center justify-center p-3 text-center">
          <span className="text-xl font-bold text-green-600">{upcomingVisits}</span>
          <span className="text-xs font-medium text-gray-500">Upcoming</span>
        </div>
        <div className="visitor-item-card flex flex-col items-center justify-center p-3 text-center">
          <span className="text-xl font-bold text-blue-600">{completedVisits}</span>
          <span className="text-xs font-medium text-gray-500">Completed</span>
        </div>
        <div className="visitor-item-card flex flex-col items-center justify-center p-3 text-center sm:col-span-1 col-span-2">
          <span className="text-xl font-bold text-gray-500">{cancelledVisits}</span>
          <span className="text-xs font-medium text-gray-500">Cancelled</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`visitor-container ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
      {/* Header Section */}
      <div className="visitor-card">
        <div className="visitor-header mt-10 flex justify-end">
          <div className="visitor-title">
            <FaHistory className="visitor-title-icon" />
            <h2 className="visitor-title-text">Visit History</h2>
          </div>
            
          <div className="visitor-actions">
            <button
              onClick={handleDownloadHistory}
              className="visitor-button visitor-button-primary"
            >
              <FaDownload className="mr-1" /> Download
            </button>
            <button
              onClick={handlePrintHistory}
              className="visitor-button visitor-button-secondary"
            >
              <FaPrint className="mr-1" /> Print
            </button>
            <button
              onClick={fetchSchedules}
              className="visitor-button visitor-button-light"
            >
              <FaSync className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Visit Summary Cards */}
      {!loading && renderVisitSummary()}

      {/* Filters Section */}
      <div className="visitor-controls">
        <div className="visitor-control-group">
          {/* Status Filter */}
          <div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="visitor-select"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          {/* Date Range Filter */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="visitor-select"
              aria-label="Filter by date range"
            >
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="recent">Last 30 Days</option>
            </select>
          </div>
          
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visits..."
                className="visitor-input"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        
        {/* View Toggle */}
        <div className="flex justify-end">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => setDisplayMode('card')}
              className={`px-3 py-1.5 text-xs font-medium rounded-l-lg border ${
                displayMode === 'card' 
                  ? 'bg-gray-200 text-gray-800 border-gray-300' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setDisplayMode('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-r-lg border-t border-r border-b ${
                displayMode === 'table' 
                  ? 'bg-gray-200 text-gray-800 border-gray-300' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

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
          schedule={selectedSchedule}
          onClose={closeDetailModal}
          onCancel={handleCancelVisit}
        />
      )}

      {/* Mobile bottom spacing */}
      <div className="visitor-page-bottom-space"></div>
    </div>
  );
}

export default VisitHistory; 