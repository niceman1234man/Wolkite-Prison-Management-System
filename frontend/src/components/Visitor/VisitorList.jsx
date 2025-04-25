import React, { useState, useEffect, useContext, createContext, useCallback, useRef, useMemo } from "react";
import DataTable from "react-data-table-component";
import { useSelector } from "react-redux";
import { 
  FaArrowLeft, 
  FaSearch, 
  FaSync, 
  FaEye, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaCalendarAlt, 
  FaUserPlus, 
  FaUserMinus, 
  FaUsers, 
  FaTimes,
  FaEdit,
  FaFilter,
  FaChartBar,
  FaExclamationTriangle,
  FaExchangeAlt,
  FaInfoCircle,
  FaThLarge,
  FaTable
} from "react-icons/fa";
import { columns as defaultColumns } from "../../utils/VisitorHelper.jsx";
import UpdateVisitorModal from "./partials/UpdateVisitorModal";
import AddModal from "../Modals/AddModal.jsx";    
import RegisterVisitor from './RegisterVisitor.jsx';
import Register from '../welcome/Register.jsx'
import { toast } from "react-hot-toast";
import '../../styles/table.css';
import '../../styles/responsive.css';

// Import custom components and hooks
import StatusFilter from "./partials/StatusFilter";
import PostponeModal from "./partials/PostponeModal";
import VisitorDetailModal from "./partials/VisitorDetailModal";
import useVisitorListData from "../../hooks/useVisitorListData";
import useVisitorActions from "../../hooks/useVisitorActions";
import axiosInstance from "../../utils/axiosInstance.js";
import useVisitScheduleData from "../../hooks/useVisitScheduleData";
import ScheduleDetailModal from "../visitorDashboaard/partials/ScheduleDetailModal";

// Import the new update modals
import UpdateScheduleModal from "../Modals/UpdateScheduleModal";
import LanguageSelector from "../common/LanguageSelector";
import { T } from "../common/TranslatedText";

// Error Boundary component to catch rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-700 mb-4">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create context for sharing visitor capacity across components
export const VisitorCapacityContext = createContext({
  visitorCapacity: {
    maxCapacity: 50,
    currentCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    isLoading: true
  },
  updateVisitorCapacity: () => {},
  refreshCapacity: () => {},
  isCapacityReached: false
});

// Custom styles for the table
const customStyles = {
  headCells: {
    style: {
      backgroundColor: "#075985", // Dark blue header (sky-900)
      color: "white",
      fontWeight: "bold",
      fontSize: "14px",
      textTransform: "uppercase",
      padding: "16px",
      borderBottom: "1px solid #0c4a6e",
    },
  },
  rows: {
    style: {
      fontSize: "14px",
      minHeight: "60px",
      borderBottom: "1px solid #e5e7eb",
      "&:nth-of-type(odd)": {
        backgroundColor: "#f9fafb",
      },
      "&:hover": {
        backgroundColor: "#f0f9ff",
        cursor: "pointer",
        transition: "background-color 0.2s ease-in-out",
      },
    },
  },
  cells: {
    style: {
      padding: "16px",
    }
  },
  pagination: {
    style: {
      backgroundColor: "#f9fafb",
      color: "#374151",
      borderTop: "1px solid #e5e7eb",
      fontSize: "14px",
    },
    pageButtonsStyle: {
      backgroundColor: "white",
      border: "1px solid #d1d5db",
      borderRadius: "0.375rem",
      color: "#374151",
      fill: "#374151",
      "&:hover:not(:disabled)": {
        backgroundColor: "#f3f4f6",
      },
      "&:focus": {
        backgroundColor: "#e5e7eb",
      },
    },
  },
};

// Visitor capacity provider component
export const VisitorCapacityProvider = ({ children }) => {
  const [visitorCapacity, setVisitorCapacity] = useState({
    maxCapacity: 50,
    currentCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    isLoading: true
  });
  
  const refreshCapacity = async () => {
    try {
      setVisitorCapacity(prev => ({ ...prev, isLoading: true }));
      const response = await axiosInstance.get('/visitor/schedule/capacity');
      
      if (response.data && response.data.success) {
        setVisitorCapacity({
          maxCapacity: response.data.maxCapacity || 50,
          currentCount: response.data.approvedCount || 0,
          pendingCount: response.data.pendingCount || 0,
          approvedCount: response.data.approvedCount || 0,
          isLoading: false
        });
      }
    } catch (error) {
      console.error("Error fetching visitor capacity:", error);
      setVisitorCapacity(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  const updateVisitorCapacity = async (newCapacity) => {
    try {
      const response = await axiosInstance.put('/visitor/schedule/capacity', {
        maxCapacity: newCapacity
      });
      
      if (response.data && response.data.success) {
        setVisitorCapacity(prev => ({
          ...prev,
          maxCapacity: newCapacity
        }));
        toast.success("Visitor capacity updated successfully");
        return true;
      } else {
        toast.error("Failed to update visitor capacity");
        return false;
      }
    } catch (error) {
      console.error("Error updating visitor capacity:", error);
      toast.error("Failed to update visitor capacity");
      return false;
    }
  };
  
  // Check if capacity is reached
  const isCapacityReached = visitorCapacity.currentCount >= visitorCapacity.maxCapacity;
  
  // Fetch capacity on mount
  useEffect(() => {
    refreshCapacity();
    
    // Set up capacity polling (every 1 minute)
    const intervalId = setInterval(() => {
      refreshCapacity();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <VisitorCapacityContext.Provider value={{ 
      visitorCapacity, 
      updateVisitorCapacity, 
      refreshCapacity,
      isCapacityReached 
    }}>
      {children}
    </VisitorCapacityContext.Provider>
  );
};

const VisitorList = () => {
  // Get data and actions from custom hooks
  const {
    visitors,
    filteredVisitors,
    loading,
    error,
    filter,
    fetchVisitors,
    handleFilterChange,
    handleSearch,
    getStatusColor
  } = useVisitorListData();
  
  const {
    viewVisitor,
    showPostponeModal,
    handleApproveClick,
    handleRejectClick,
    handlePostponeClick,
    handlePostponeSubmit,
    handleViewDetails,
    closeDetailModal,
    closePostponeModal
  } = useVisitorActions(fetchVisitors);

  // Get visitor capacity from context
  const { 
    visitorCapacity, 
    updateVisitorCapacity, 
    refreshCapacity,
    isCapacityReached 
  } = useContext(VisitorCapacityContext);

  // Local state
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showVisitSchedules, setShowVisitSchedules] = useState(false);
  
  // Get sidebar state from Redux
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  // Additional state for pre-fetched schedules data
  const [pendingSchedulesData, setPendingSchedulesData] = useState(null);
  const [loadingPendingSchedules, setLoadingPendingSchedules] = useState(false);

  // Add a toggle timeout ref for debouncing
  const toggleTimeoutRef = useRef(null);

  // Update the state management to include the new update modal states
  const [showUpdateVisitorModal, setShowUpdateVisitorModal] = useState(false);
  const [showUpdateScheduleModal, setShowUpdateScheduleModal] = useState(false);

  // Add display mode state
  const [displayMode, setDisplayMode] = useState('card');
  const [showDetailModalState, setShowDetailModalState] = useState(false);

  // Memoize filtered visitors
  const filteredVisitorsMemo = useMemo(() => {
    if (!visitors || visitors.length === 0) return [];
    
    return visitors.filter(visitor => {
      if (!visitor) return false;
      
      const matchesSearch = !searchQuery || searchQuery.trim() === '' || (
        (visitor.firstName && visitor.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (visitor.lastName && visitor.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (visitor.phone && visitor.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (visitor.purpose && visitor.purpose.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      return matchesSearch;
    });
  }, [visitors, searchQuery]);

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Define status badge component
  const StatusBadge = ({ status }) => {
    let bgColor, textColor, icon;
    
    switch(status?.toLowerCase()) {
      case 'approved':
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        icon = <FaCheckCircle className="mr-1" />;
        break;
      case 'rejected':
        bgColor = "bg-red-100";
        textColor = "text-red-800";
        icon = <FaTimesCircle className="mr-1" />;
        break;
      case 'postponed':
        bgColor = "bg-yellow-100";
        textColor = "text-yellow-800";
        icon = <FaCalendarAlt className="mr-1" />;
        break;
      case 'completed':
        bgColor = "bg-blue-100";
        textColor = "text-blue-800";
        icon = <FaCheckCircle className="mr-1" />;
        break;
      case 'pending':
      default:
        bgColor = "bg-gray-100";
        textColor = "text-gray-800";
        icon = <FaSync className="mr-1" />;
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor} border border-${textColor.replace('text-', '')}`}>
        {icon}
        {status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Pending'}
      </span>
    );
  };

  // Define police officer columns inside the component
  const policeOfficerColumns = [
    {
      name: "No",
      selector: (row) => row.U_no,
      sortable: true,
      width: "60px",
      center: true,
    },
    {
      name: "Name",
      selector: (row) => `${row.firstName || ''} ${row.middleName || ''} ${row.lastName || ''}`,
      sortable: true,
      wrap: true,
      cell: (row) => (
        <div className="font-medium text-gray-900">
          {`${row.firstName || ''} ${row.middleName || ''} ${row.lastName || ''}`}
        </div>
      ),
    },
    {
      name: "Phone",
      selector: (row) => row.phone,
      sortable: true,
      wrap: true,
      cell: (row) => (
        <div className="text-gray-700">
          {row.phone || 'N/A'}
        </div>
      ),
    },
    {
      name: "Purpose",
      selector: (row) => row.purpose,
      sortable: true,
      wrap: true,
      cell: (row) => (
        <div className="text-gray-700">
          {row.purpose || 'N/A'}
        </div>
      ),
    },
    {
      name: "Visit Date",
      selector: (row) => row.date,
      sortable: true,
      cell: (row) => (
        <div className="text-gray-700">
          {formatDate(row.date)}
        </div>
      ),
    },
    {
      name: "Status",
      selector: (row) => row.status || 'Pending',
      sortable: true,
      center: true,
      cell: (row) => <StatusBadge status={row.status || 'Pending'} />,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => handleViewDetailsLocal(row)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
          >
            <FaEye className="mr-1" /> View
          </button>
          <button
            onClick={() => handleUpdate(row)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
          >
            <FaEdit className="mr-1" /> Update
          </button>
        </div>
      ),
      width: "180px",
    },
  ];

  // Handle approve with capacity check
  const handleApproveWithCheck = async (visitorId) => {
    // Check if capacity has been reached
    if (isCapacityReached) {
      toast.error("Maximum visitor capacity reached. Please increase capacity or wait for visits to complete.");
      // Show capacity modal for admins and police officers
      if (userData?.role === 'police-officer' || userData?.role === 'admin') {
        setShowCapacityModal(true);
      }
      return;
    }
    
    await handleApproveClick(visitorId);
    
    // Refresh capacity data after approval
    setTimeout(() => {
      refreshCapacity();
    }, 1000);
  };

  // Set up component on mount
  useEffect(() => {
    // Get user data from localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    setUserData(user);
    
    // Get saved schedule view preference
    try {
      const savedScheduleView = localStorage.getItem('showVisitSchedules');
      if (savedScheduleView !== null) {
        setShowVisitSchedules(JSON.parse(savedScheduleView));
      }
    } catch (error) {
      console.error('Error retrieving schedule view preference:', error);
    }
  }, []);

  // Refresh visitor data when capacity changes
  useEffect(() => {
    if (!visitorCapacity.isLoading) {
      fetchVisitors();
    }
  }, [visitorCapacity.maxCapacity]);

  // Pre-fetch pending schedules when component mounts
  useEffect(() => {
    const fetchPendingSchedules = async () => {
      try {
        setLoadingPendingSchedules(true);
        // Directly use axiosInstance instead of the hook to avoid dependency issues
        const response = await axiosInstance.get("/visitor/schedule/schedules?status=pending");
        if (response.data.success) {
          console.log("Pre-fetched pending schedules:", response.data.data.length);
          setPendingSchedulesData(response.data.data);
        }
      } catch (error) {
        console.error("Error pre-fetching pending schedules:", error);
      } finally {
        setLoadingPendingSchedules(false);
      }
    };

    fetchPendingSchedules();
  }, []);

  // Update the handleUpdate function to show the UpdateVisitorModal
  const handleUpdate = (visitor) => {
    console.log("Updating visitor:", visitor);
    setSelectedVisitor(visitor);
    setShowUpdateVisitorModal(true);
  };

  // Add a new function to handle schedule updates
  const handleUpdateSchedule = (schedule) => {
    console.log("Updating schedule:", schedule);
    setSelectedSchedule(schedule);
    setShowUpdateScheduleModal(true);
  };

  // Modify the toggle function to avoid rapid toggling
  const toggleVisitSchedules = useCallback(() => {
    // Set directly without timeout since we're now using pre-fetched data
    setShowVisitSchedules(prev => !prev);
    
    // Save the new value to localStorage
    try {
      const newState = !showVisitSchedules;
      localStorage.setItem('showVisitSchedules', JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving schedule view preference:', error);
    }
  }, [showVisitSchedules]);

  // Modal for capacity management
  const CapacityManagementModal = () => {
    const [newCapacity, setNewCapacity] = useState(visitorCapacity.maxCapacity);

    const handleSubmit = async () => {
      const success = await updateVisitorCapacity(newCapacity);
      if (success) {
        setShowCapacityModal(false);
      }
  };

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Manage Visitor Capacity</h2>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Maximum Capacity</label>
            <input
              type="number"
              value={newCapacity}
              onChange={(e) => setNewCapacity(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="1"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCapacityModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show capacity warning if near capacity
  const CapacityWarning = () => {
    if (visitorCapacity.isLoading) return null;
    
    const availableSlots = visitorCapacity.maxCapacity - visitorCapacity.approvedCount;
    const percentFull = (visitorCapacity.approvedCount / visitorCapacity.maxCapacity) * 100;
    
    if (percentFull < 80) return null;
    
    return (
      <div className={`mb-4 p-4 rounded-lg flex items-center
        ${percentFull >= 100 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`
      }>
        <FaExclamationTriangle className={percentFull >= 100 ? 'text-red-500' : 'text-yellow-500'} size={20} />
        <div className="ml-3">
          <p className={`text-sm font-medium ${percentFull >= 100 ? 'text-red-800' : 'text-yellow-800'}`}>
            {percentFull >= 100 ? 'Visitor capacity reached!' : 'Visitor capacity almost reached!'} 
          </p>
          <p className="text-sm mt-1">
            {availableSlots <= 0 
              ? 'No slots available. Increase capacity or wait for visits to complete.'
              : `Only ${availableSlots} slots available out of ${visitorCapacity.maxCapacity}.`
            }
          </p>
        </div>
        {(userData?.role === 'police-officer' || userData?.role === 'admin') && (
          <button
            onClick={() => setShowCapacityModal(true)}
            className={`ml-auto px-3 py-1 text-sm rounded
              ${percentFull >= 100 ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}
          >
            Manage Capacity
          </button>
        )}
      </div>
    );
  };

  // Update the memoized component to use the pre-fetched data
  const memoizedSchedulesComponent = useMemo(() => (
    <ErrorBoundary>
      <PendingSchedulesTable 
        scheduleData={pendingSchedulesData}
        isLoading={loadingPendingSchedules}
        refreshData={() => {
          setLoadingPendingSchedules(true);
          axiosInstance.get("/visitor/schedule/schedules?status=pending")
            .then(response => {
              if (response.data.success) {
                setPendingSchedulesData(response.data.data);
              }
            })
            .catch(error => console.error("Error refreshing pending schedules:", error))
            .finally(() => setLoadingPendingSchedules(false));
        }}
      />
    </ErrorBoundary>
  ), [pendingSchedulesData, loadingPendingSchedules]);

  // Update the handleViewDetails function to use the local state
  const handleViewDetailsLocal = (visitor) => {
    setSelectedVisitor(visitor);
    setShowDetailModalState(true);
  };

  // Update any other references to setShowDetailModal
  const handleCloseDetailModal = () => {
    setShowDetailModalState(false);
  };

  return (
    <ErrorBoundary>
      <div className="visitor-container">
        <div className="flex justify-between items-center mb-4 p-3 bg-white rounded-lg shadow-sm">
          <div className="flex items-center space-x-2">
            <h1 className="visitor-title text-2xl font-semibold text-gray-800">
              <T>Visitor Management</T>
            </h1>
            <LanguageSelector className="ml-4" />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setDisplayMode('card')}
              className={`p-2 rounded-lg ${displayMode === 'card' ? 'bg-teal-100 text-teal-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <FaThLarge />
            </button>
            <button
              onClick={() => setDisplayMode('table')}
              className={`p-2 rounded-lg ${displayMode === 'table' ? 'bg-teal-100 text-teal-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <FaTable />
            </button>
          </div>
        </div>

        <div className="flex-1 transition-all duration-300 ease-in-out">
          <div className="p-4 md:p-6 lg:p-8 ml-0 md:ml-16 lg:ml-64 mb-6 mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0">
                      <input
                        type="text"
                        placeholder="Search visitors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <button
                      onClick={() => setOpen(true)}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap"
                    >
                      <FaUserPlus /> Add Visitor
                    </button>
                  </div>
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                </div>
              ) : displayMode === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVisitorsMemo.map((visitor) => (
                    <div key={visitor._id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {`${visitor.firstName || ''} ${visitor.middleName || ''} ${visitor.lastName || ''}`}
                          </h3>
                          <p className="text-gray-600">{visitor.phone || 'N/A'}</p>
                        </div>
                        <StatusBadge status={visitor.status || 'Pending'} />
                      </div>
                      <div className="space-y-2 mb-4">
                        <p className="text-gray-700">
                          <span className="font-medium">Purpose:</span> {visitor.purpose || 'N/A'}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Visit Date:</span> {formatDate(visitor.date)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleViewDetailsLocal(visitor)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
                        >
                          <FaEye className="mr-1" /> View
                        </button>
                        <button
                          onClick={() => handleUpdate(visitor)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
                        >
                          <FaEdit className="mr-1" /> Update
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredVisitorsMemo.map((visitor) => (
                        <tr key={visitor._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {`${visitor.firstName || ''} ${visitor.middleName || ''} ${visitor.lastName || ''}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{visitor.phone || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{visitor.purpose || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(visitor.date)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={visitor.status || 'Pending'} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleViewDetailsLocal(visitor)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
                              >
                                <FaEye className="mr-1" /> View
                              </button>
                              <button
                                onClick={() => handleUpdate(visitor)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
                              >
                                <FaEdit className="mr-1" /> Update
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        <AddModal open={open} setOpen={setOpen} fetchVisitors={fetchVisitors} />
        <UpdateVisitorModal
          open={showUpdateVisitorModal}
          setOpen={setShowUpdateVisitorModal}
          visitor={selectedVisitor}
          fetchVisitors={fetchVisitors}
        />
        <VisitorDetailModal
          open={showDetailModalState}
          setOpen={setShowDetailModalState}
          visitor={selectedVisitor}
        />
      </div>
    </ErrorBoundary>
  );
};

// Create a simplified table component specifically for pending schedules
const PendingSchedulesTable = ({ scheduleData, isLoading, refreshData }) => {
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [scheduleToPostpone, setScheduleToPostpone] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showDetailModalState, setShowDetailModalState] = useState(false);
  
  // Add state for update modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  
  // Get visitor capacity from context
  const { isCapacityReached, refreshCapacity } = useContext(VisitorCapacityContext);
  
  // Get user data from localStorage when component mounts
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setUserData(user);
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
  
  // View schedule details
  const viewScheduleDetails = useCallback((schedule) => {
    setSelectedSchedule(schedule);
    setShowDetailModalState(true);
  }, []);
  
  // Handle update schedule
  const handleUpdateSchedule = useCallback((schedule) => {
    setSelectedSchedule(schedule);
    setShowUpdateModal(true);
  }, []);
  
  // Approve a schedule
  const approveSchedule = useCallback(async (scheduleId) => {
    // Check if capacity is reached
    if (isCapacityReached) {
      toast.error("Maximum visitor capacity reached. Please increase capacity or wait for visits to complete.");
      return false;
    }
    
    try {
      const loadingId = toast.loading("Approving visit...");
      const response = await axiosInstance.put(`/visitor/schedule/schedule/${scheduleId}/approve`);
      
      toast.dismiss(loadingId);
      
      if (response.data.success) {
        toast.success("Visit approved successfully");
        refreshData(); // Refresh the data after approval
        refreshCapacity(); // Refresh capacity data
        return true;
      } else {
        toast.error(response.data.message || "Failed to approve visit");
        return false;
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error approving schedule:", error);
      toast.error(error.response?.data?.message || "Failed to approve visit");
      return false;
    }
  }, [refreshData, isCapacityReached, refreshCapacity]);
  
  // Reject a schedule
  const rejectSchedule = useCallback(async (scheduleId) => {
    try {
      const loadingId = toast.loading("Rejecting visit...");
      const response = await axiosInstance.put(`/visitor/schedule/schedule/${scheduleId}/reject`);
      
      toast.dismiss(loadingId);
      
      if (response.data.success) {
        toast.success("Visit rejected successfully");
        refreshData(); // Refresh the data after rejection
        return true;
      } else {
        toast.error(response.data.message || "Failed to reject visit");
        return false;
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error rejecting schedule:", error);
      toast.error(error.response?.data?.message || "Failed to reject visit");
      return false;
    }
  }, [refreshData]);
  
  // Handle postpone click
  const handlePostponeClick = useCallback((scheduleId) => {
    setScheduleToPostpone(scheduleId);
    setShowPostponeModal(true);
  }, []);
  
  // Handle postpone submit
  const handlePostponeSubmit = useCallback(async (date) => {
    try {
      const loadingId = toast.loading("Postponing visit...");
      const response = await axiosInstance.put(`/visitor/schedule/schedule/${scheduleToPostpone}/postpone`, {
        newDate: date
      });
      
      toast.dismiss(loadingId);
      
      if (response.data.success) {
        toast.success("Visit postponed successfully");
        setShowPostponeModal(false);
        refreshData(); // Refresh the data after postponing
        return true;
      } else {
        toast.error(response.data.message || "Failed to postpone visit");
        return false;
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error postponing schedule:", error);
      toast.error(error.response?.data?.message || "Failed to postpone visit");
      return false;
    }
  }, [scheduleToPostpone, refreshData]);
  
  // Cancel a schedule
  const cancelSchedule = useCallback(async (scheduleId) => {
    try {
      const loadingId = toast.loading("Cancelling visit...");
      const response = await axiosInstance.put(`/visitor/schedule/schedule/${scheduleId}/cancel`);
      
      toast.dismiss(loadingId);
      
      if (response.data.success) {
        toast.success("Visit cancelled successfully");
        refreshData(); // Refresh the data after cancellation
        return true;
      } else {
        toast.error(response.data.message || "Failed to cancel visit");
        return false;
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error cancelling schedule:", error);
      toast.error(error.response?.data?.message || "Failed to cancel visit");
      return false;
    }
  }, [refreshData]);
  
  // Status badge component
  const ScheduleStatusBadge = useCallback(({ status }) => {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
        <FaSync className="mr-1" />
        Pending
      </span>
    );
  }, []);
  
  // Check if user is police officer or admin
  const isPoliceOrAdmin = userData?.role === 'police-officer' || userData?.role === 'admin';
  
  // Define columns
  const columns = useMemo(() => [
    {
      name: "Visitor Name",
      selector: (row) => row.visitorName || 'N/A',
      sortable: true,
      wrap: true,
      cell: (row) => (
        <div className="font-medium text-gray-900">
          {row.visitorName || 'N/A'}
        </div>
      ),
    },
    {
      name: "Purpose",
      selector: (row) => row.purpose,
      sortable: true,
      wrap: true,
      cell: (row) => (
        <div className="text-gray-700">
          {row.purpose || 'N/A'}
        </div>
      ),
    },
    {
      name: "Visit Date",
      selector: (row) => row.visitDate,
      sortable: true,
      cell: (row) => (
        <div className="text-gray-700">
          {formatDate(row.visitDate)}
        </div>
      ),
    },
    {
      name: "Status",
      selector: (row) => 'Pending',
      sortable: false,
      center: true,
      cell: (row) => <ScheduleStatusBadge status="pending" />,
    },
    {
      name: "Created At",
      selector: (row) => row.createdAt,
      sortable: true,
      cell: (row) => (
        <div className="text-gray-700">
          {formatDate(row.createdAt)}
        </div>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => viewScheduleDetails(row)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
          >
            <FaEye className="mr-1" /> View
          </button>
          <button
            onClick={() => handleUpdateSchedule(row)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
          >
            <FaEdit className="mr-1" /> Update
          </button>
        </div>
      ),
      width: "180px",
    },
  ], [formatDate, viewScheduleDetails, handleUpdateSchedule, ScheduleStatusBadge]);
  
  return (
    <>
      <div className="bg-indigo-50 p-4 mb-4 rounded-lg border border-indigo-100">
        <p className="text-indigo-800 flex items-center">
          <FaInfoCircle className="mr-2" />
          Viewing pending schedule requests. These are visits awaiting approval.
        </p>
      </div>
      
      <div className="flex justify-end mb-4">
        <button
          onClick={refreshData}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaSync className="mr-2" />
          Refresh
        </button>
      </div>
      
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <DataTable
          columns={columns}
          data={scheduleData || []}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 20, 30, 50]}
          highlightOnHover
          pointerOnHover
          responsive
          progressPending={isLoading}
          progressComponent={
            <div className="flex justify-center items-center p-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          }
          customStyles={customStyles}
          noDataComponent={
            <div className="flex flex-col items-center justify-center p-10">
              <FaCalendarAlt className="text-gray-300 text-5xl mb-4" />
              <p className="text-gray-500 text-lg">No pending schedules found</p>
              <p className="text-gray-400 text-sm mt-2">
                All schedule requests have been processed
              </p>
            </div>
          }
        />
      </div>
      
      {/* Schedule Detail Modal */}
      {showDetailModalState && selectedSchedule && (
        <ScheduleDetailModal
          isOpen={showDetailModalState}
          onClose={() => setShowDetailModalState(false)}
          schedule={selectedSchedule}
          onCancel={cancelSchedule}
          onUpdate={(schedule) => {
            setShowDetailModalState(false);
            // Add logic here to handle schedule updates if needed
            toast.success("Schedule update feature will be implemented soon");
          }}
          onApprove={approveSchedule}
          onReject={rejectSchedule}
          onPostpone={handlePostponeClick}
          capacityReached={isCapacityReached}
          userRole={userData?.role}
        />
      )}
      
      {/* Postpone Modal */}
      {showPostponeModal && (
        <PostponeModal
          isOpen={showPostponeModal}
          onClose={() => setShowPostponeModal(false)}
          onSubmit={handlePostponeSubmit}
        />
      )}

      {/* Update Modal */}
      {showUpdateModal && selectedSchedule && (
        <UpdateScheduleModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          schedule={selectedSchedule}
          onSuccess={() => {
            setShowUpdateModal(false);
            refreshData && refreshData();
            toast.success("Schedule updated successfully");
          }}
        />
      )}
    </>
  );
};

const VisitorListWithCapacity = () => {
  return (
    <VisitorCapacityProvider>
      <VisitorList />
    </VisitorCapacityProvider>
  );
};

export default VisitorListWithCapacity;
