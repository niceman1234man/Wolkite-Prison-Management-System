import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  FaArrowLeft, FaUserCircle, FaTable, FaThLarge, FaEye, FaEdit, 
  FaTrash, FaFilter, FaSearch, FaSort, FaUsers, FaTimes
} from "react-icons/fa";
import DataTable from "react-data-table-component";
import { columns } from "../../utils/InmateHelper.jsx";
import axiosInstance from "../../utils/axiosInstance";
import axios from "axios"; // Import axios directly for fallback requests
import { useSelector, useDispatch } from "react-redux";
import { setInmate } from "../../redux/prisonSlice.js";
import AddInmate from "./Add";
import AddModal from "../Modals/AddModal";
import ConfirmModal from "../Modals/ConfirmModal";
import { toast } from "react-hot-toast";
import useWindowSize from "../../hooks/useWindowSize";
import '../../styles/table.css'; // Import the table styles if available
import ViewInmate from "./ViewInmate";
import UpdateInmate from "./UpdateInmate";
import { logActivity, ACTIONS, RESOURCES, STATUS } from "../../utils/activityLogger";

// Photo component to avoid issues with hooks in DataTable cells
const InmatePhoto = ({ photoPath, name }) => {
  const [hasError, setHasError] = useState(false);
  
  // Base URL for API images
  const baseUrl = window.location.origin.includes('localhost') ? 'http://localhost:5001' : '';
  
  // Handle image load error
  const handleError = () => {
    setHasError(true);
  };
  
  return (
    <div className="w-10 h-10 relative rounded-full overflow-hidden">
      {photoPath && !hasError ? (
        <img 
          src={`${baseUrl}${photoPath}`}
          alt={name || "Inmate photo"}
          className="w-full h-full object-cover"
          onError={handleError}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200">
          <FaUserCircle className="text-gray-400 text-xl" />
        </div>
      )}
    </div>
  );
};

// Create a new consistent buttons component for both table and card views
const InmateActionButtons = ({ inmate, onDelete, isCardView = false }) => {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  const handleDeleteClick = () => {
    setConfirmOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    try {
      // First, archive the inmate record before deletion
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData._id || userData.id;
      const userRole = userData.role || 'unknown';
      const token = localStorage.getItem('token');
      
      try {
        // Create archive entry first
        console.log("Creating archive for inmate before deletion:", inmate);
        
        // Create the archive payload
        const archivePayload = {
          entityType: "inmate",
          originalId: inmate._id,
          data: {
            ...inmate,
            _id: inmate._id,
            inmateName: inmate.inmate_name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          deletedBy: userId,
          deletionReason: "User initiated deletion",
          metadata: {
            deletedAt: new Date().toISOString(),
            deletedByRole: userRole,
            inmateId: inmate._id,
            inmateName: inmate.inmate_name
          }
        };
        
        console.log("Sending archive payload:", JSON.stringify(archivePayload, null, 2));
        
        // Try both methods for archiving - direct fetch and axiosInstance
        let archiveSuccess = false;
        let archiveId = null;
        
        try {
          // Method 1: Using fetch with direct URL (most reliable)
          const response = await fetch('http://localhost:5001/api/manual-archive/no-auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(archivePayload)
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log("Archive created successfully via direct fetch:", data);
            archiveSuccess = true;
            archiveId = data.archiveId;
          } else {
            console.error("Failed to create archive via direct fetch:", await response.text());
            // Will try the next method
          }
        } catch (fetchError) {
          console.error("Error using direct fetch for archive:", fetchError);
          // Will try the next method
        }
        
        if (!archiveSuccess) {
          try {
            // Method 2: Using axios without /api prefix
            const axiosResponse = await axios.post('http://localhost:5001/manual-archive/no-auth', archivePayload);
            console.log("Archive created successfully via axios:", axiosResponse.data);
            archiveSuccess = true;
            archiveId = axiosResponse.data.archiveId;
          } catch (axiosError) {
            console.error("Error using axios for archive:", axiosError);
            throw new Error("Failed to create archive using both methods");
          }
        }
        
        // Now proceed with deletion
      const response = await axiosInstance.delete(`/inmates/delete-inmate/${inmate._id}`);
      if (response.data) {
        // Log activity for successful deletion
        try {
          await logActivity(
            ACTIONS.DELETE,
            `Deleted inmate record for ${inmate.inmate_name}`,
            RESOURCES.INMATE,
            inmate._id,
            STATUS.SUCCESS
          );
        } catch (logError) {
          console.error('Failed to log delete activity:', logError);
        }
        
          toast.success("Inmate deleted and archived successfully");
          if (onDelete) onDelete();
        }
      } catch (archiveError) {
        console.error("Error archiving inmate:", archiveError);
        console.error("Archive error details:", archiveError.response?.data || archiveError.message);
        
        // If archiving fails, ask user if they want to proceed with deletion anyway
        if (window.confirm("Could not archive this inmate. Would you like to delete it anyway? (Data will be permanently lost)")) {
          const response = await axiosInstance.delete(`/inmates/delete-inmate/${inmate._id}`);
          if (response.data) {
            toast.success("Inmate deleted (without archiving)!");
        if (onDelete) onDelete();
            
            // Log activity for successful deletion without archiving
            try {
              await logActivity(
                ACTIONS.DELETE,
                `Deleted inmate record for ${inmate.inmate_name} (without archiving)`,
                RESOURCES.INMATE,
                inmate._id,
                STATUS.SUCCESS
              );
            } catch (logError) {
              console.error('Failed to log delete activity:', logError);
            }
          }
        } else {
          toast.info("Deletion cancelled");
        }
      }
    } catch (error) {
      console.error("Error deleting inmate:", error);
      
      // Log failed deletion attempt
      try {
        await logActivity(
          ACTIONS.DELETE,
          `Failed to delete inmate: ${error.response?.data?.message || error.message}`,
          RESOURCES.INMATE,
          inmate._id,
          STATUS.FAILURE
        );
      } catch (logError) {
        console.error('Failed to log delete failure activity:', logError);
      }
      
      if (error.response?.status === 401) {
        toast.error("Please login to continue");
        navigate("/login");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to delete this inmate");
      } else {
        toast.error(error.response?.data?.error || "Failed to delete inmate");
      }
    } finally {
      setConfirmOpen(false);
    }
  };
  
  // Return different button styles based on context (card view or table view)
  if (isCardView) {
    return (
      <>
        <button 
          onClick={() => setViewOpen(true)}
          className="flex-1 py-2 text-center text-blue-600 hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center"
        >
          <FaEye className="mr-1" /> View
        </button>
        <button 
          onClick={() => setEditOpen(true)}
          className="flex-1 py-2 text-center text-blue-600 hover:bg-blue-50 border-l border-gray-200 transition-colors duration-200 flex items-center justify-center"
        >
          <FaEdit className="mr-1" /> Edit
        </button>
        <button 
          onClick={handleDeleteClick}
          className="flex-1 py-2 text-center text-red-600 hover:bg-red-50 border-l border-gray-200 transition-colors duration-200 flex items-center justify-center"
        >
          <FaTrash className="mr-1" /> Delete
        </button>
        
        {/* View Inmate Modal */}
        <AddModal open={viewOpen} setOpen={setViewOpen}>
          <div className="p-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Inmate Details</h2>
              <button 
                onClick={() => setViewOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            {/* Using the same ViewInmate component as the table buttons */}
            <ViewInmate 
              _id={inmate._id} 
              onEdit={() => {
                setViewOpen(false);
                setEditOpen(true);
              }} 
            />
          </div>
        </AddModal>
        
        {/* Edit Inmate Modal */}
        <AddModal open={editOpen} setOpen={setEditOpen}>
          <div className="p-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-gray-800">Edit Inmate</h2>
              <button 
                onClick={() => setEditOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            {/* Using UpdateInmate component instead of AddInmate for editing */}
            <UpdateInmate _id={inmate._id} setOpen={setEditOpen} />
          </div>
        </AddModal>
        
        {/* Confirm Delete Modal */}
        <ConfirmModal 
          open={confirmOpen} 
          message={`Are you sure you want to delete ${inmate.inmate_name}? This action will archive the inmate record and it can be restored from the archive system if needed.`}
          title="Delete and Archive Inmate"
          confirmText="Delete and Archive"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmOpen(false)}
          confirmButtonColor="bg-red-600 hover:bg-red-700"
        />
      </>
    );
  }
  
  // Table view buttons
  return (
    <div className="flex space-x-2">
      <button
        onClick={() => setEditOpen(true)}
        className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
        title="Edit Inmate"
      >
        <FaEdit size={18} />
      </button>
      <AddModal open={editOpen} setOpen={setEditOpen}>
        <div className="p-4 max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold text-gray-800">Edit Inmate</h2>
            <button 
              onClick={() => setEditOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={20} />
            </button>
          </div>
          <UpdateInmate _id={inmate._id} setOpen={setEditOpen} />
        </div>
      </AddModal>
      <button
        onClick={handleDeleteClick}
        className="p-2 text-red-600 hover:text-red-800 transition-colors"
        title="Delete Inmate"
      >
        <FaTrash size={18} />
      </button>
      <button
        onClick={() => setViewOpen(true)}
        className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
        title="View Inmate"
      >
        <FaEye size={18} />
      </button>
      <AddModal open={viewOpen} setOpen={setViewOpen}>
        <div className="p-4 max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Inmate Details</h2>
            <button 
              onClick={() => setViewOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={20} />
            </button>
          </div>
          <ViewInmate _id={inmate._id} />
        </div>
      </AddModal>
      
      {/* Confirm Delete Modal */}
      <ConfirmModal 
        open={confirmOpen} 
        message={`Are you sure you want to delete ${inmate.inmate_name}? This action will archive the inmate record and it can be restored from the archive system if needed.`}
        title="Delete and Archive Inmate"
        confirmText="Delete and Archive"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
        confirmButtonColor="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

// Inmate Card component for mobile/card view
const InmateCard = ({ inmate, onDelete, showPhoto }) => {
  // Function to determine case type badge color
  const getCaseTypeColor = (caseType) => {
    switch(caseType?.toLowerCase()) {
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
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      <div className="p-4">
        <div className="flex items-center mb-4">
          {showPhoto && (
            <div className="mr-3">
              <InmatePhoto photoPath={inmate.photo} name={inmate.inmate_name} />
            </div>
          )}
          <div>
            <h3 className="font-medium text-lg text-gray-800">{inmate.inmate_name}</h3>
            <div className="text-sm text-gray-600">{inmate.age} years • <span className="capitalize">{inmate.gender}</span></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <span className="text-xs font-medium text-gray-500">Case Type</span>
            <div className={`mt-1 px-2 py-1 rounded-full text-xs font-medium inline-block ${getCaseTypeColor(inmate.case_type)}`}>
              {inmate.case_type}
            </div>
          </div>
          
          <div>
            <span className="text-xs font-medium text-gray-500">Sentence</span>
            <div className="text-sm">{inmate.sentence}</div>
          </div>
        </div>
        
        {inmate.reason && (
          <div className="mb-3">
            <span className="text-xs font-medium text-gray-500">Reason</span>
            <div className="text-sm truncate" title={inmate.reason}>{inmate.reason}</div>
          </div>
        )}
        
        <div className="mb-2">
          <span className="text-xs font-medium text-gray-500">Location</span>
          <div className="text-sm truncate" title={inmate.current_location}>
            {inmate.current_location}
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 flex justify-around">
        <InmateActionButtons inmate={inmate} onDelete={onDelete} isCardView={true} />
      </div>
    </div>
  );
};

const InmatesList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  
  // States
  const [open, setOpen] = useState(false);
  const [inmates, setInmates] = useState([]);
  const [filteredInmates, setFilteredInmates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [viewMode, setViewMode] = useState(width < 768 ? 'card' : 'table');
  const [searchQuery, setSearchQuery] = useState("");
  const [caseTypeFilter, setCaseTypeFilter] = useState("all");
  
  // Redux state
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const inmate = useSelector((state) => state.inmate.inmate);
  
  // Update view mode when window size changes
  useEffect(() => {
    if (width < 768 && viewMode === 'table') {
      setViewMode('card');
    }
  }, [width, viewMode]);

  // Fetch inmates data
  const fetchInmates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/inmates/allInmates");

      // Check if response.data has an inmates array
      const inmatesData = response.data?.inmates || response.data || [];
      
      if (Array.isArray(inmatesData)) {
        dispatch(setInmate(inmatesData));
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
          };
        });

        setInmates(formattedData);
        applyFilters(formattedData, searchQuery, caseTypeFilter);
        
        // Log the list view activity
        try {
          await logActivity(
            ACTIONS.VIEW,
            `Viewed list of ${formattedData.length} inmates`,
            RESOURCES.INMATE,
            null,
            STATUS.SUCCESS
          );
        } catch (logError) {
          console.error('Failed to log inmates list view activity:', logError);
        }
      } else {
        toast.error("Invalid response structure from server");
      }
    } catch (error) {
      console.error("Error fetching inmates:", error);
      
      // Log failure to view inmates list
      try {
        await logActivity(
          ACTIONS.VIEW,
          `Failed to view inmates list: ${error.response?.data?.message || error.message}`,
          RESOURCES.INMATE,
          null,
          STATUS.FAILURE
        );
      } catch (logError) {
        console.error('Failed to log view failure activity:', logError);
      }
      
      if (error.response?.status === 401) {
        toast.error("Please login to continue");
        navigate("/login");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to access this resource");
      } else {
        toast.error(error.response?.data?.error || "Failed to fetch inmate data");
      }
    } finally {
      setLoading(false);
    }
  };

  // Column config for the table
  const getColumns = () => {
    const baseColumns = [
      {
        name: "#",
        selector: row => row.sno,
        sortable: true,
        width: "70px",
      },
      {
        name: "Name",
        selector: row => row.inmate_name,
        sortable: true,
        grow: 2,
        cell: row => (
          <div className="font-medium">{row.inmate_name}</div>
        ),
      },
      {
        name: "Age",
        selector: row => row.age,
        sortable: true,
        width: "80px",
      },
      {
        name: "Gender",
        selector: row => row.gender,
        sortable: true,
        width: "100px",
        cell: row => <div className="capitalize">{row.gender}</div>,
      },
      {
        name: "Case Type",
        selector: row => row.case_type,
        sortable: true,
        cell: row => {
          const getCaseTypeColor = (caseType) => {
            switch(caseType?.toLowerCase()) {
              case 'criminal': return 'bg-red-100 text-red-800';
              case 'civil': return 'bg-blue-100 text-blue-800';
              case 'administrative': return 'bg-green-100 text-green-800';
              default: return 'bg-gray-100 text-gray-800';
            }
          };
          
          return (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCaseTypeColor(row.case_type)}`}>
              {row.case_type}
            </div>
          );
        },
      },
      {
        name: "Reason",
        selector: row => row.reason,
        sortable: true,
        cell: row => (
          <div className="truncate max-w-[150px]" title={row.reason}>
            {row.reason || "Not specified"}
          </div>
        ),
      },
      {
        name: "Sentence",
        selector: row => row.sentence,
        sortable: true,
      },
      {
        name: "Location",
        selector: row => row.current_location,
        sortable: true,
        cell: row => (
          <div className="truncate max-w-[150px]" title={row.current_location}>
            {row.current_location === ", " ? "Not specified" : row.current_location}
          </div>
        ),
      },
      {
        name: "Actions",
        cell: row => <InmateActionButtons inmate={row} onDelete={fetchInmates} />,
        right: true,
      }
    ];
    
    // For small screens, only show essential columns
    if (width < 1024) {
      return baseColumns.filter(col => 
        ['S.No', 'Name', 'Case Type', 'Sentence', 'Actions'].includes(col.name));
    }
    
    if (showPhotos) {
      baseColumns.splice(1, 0, {
        name: "Photo",
        width: "80px",
        cell: row => <InmatePhoto photoPath={row.photo} name={row.inmate_name} />
      });
    }
    
    return baseColumns;
  };

  // Load data on component mount
  useEffect(() => {
    fetchInmates();
  }, []);

  // Apply filters function
  const applyFilters = (data, query, caseType) => {
    let filtered = [...data];
    let filterDescription = [];
    
    // Apply search query filter
    if (query && query.trim() !== "") {
      const lowercasedQuery = query.toLowerCase();
      filtered = filtered.filter((inmate) =>
        inmate.inmate_name.toLowerCase().includes(lowercasedQuery) ||
        inmate.case_type.toLowerCase().includes(lowercasedQuery) ||
        (inmate.reason && inmate.reason.toLowerCase().includes(lowercasedQuery)) ||
        (inmate.sentence && inmate.sentence.toLowerCase().includes(lowercasedQuery))
      );
      filterDescription.push(`search query: "${query}"`);
    }
    
    // Apply case type filter
    if (caseType && caseType !== "all") {
      filtered = filtered.filter(inmate => 
        inmate.case_type.toLowerCase() === caseType.toLowerCase()
      );
      filterDescription.push(`case type: ${caseType}`);
    }
    
    setFilteredInmates(filtered);
    
    // Log activity for search and filter operations
    if (filterDescription.length > 0) {
      try {
        logActivity(
          ACTIONS.SEARCH,
          `Searched inmates with ${filterDescription.join(", ")} (${filtered.length} results)`,
          RESOURCES.INMATE,
          null,
          STATUS.SUCCESS
        );
      } catch (logError) {
        console.error('Failed to log search activity:', logError);
      }
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    applyFilters(inmates, query, caseTypeFilter);
  };

  // Handle case type filter change
  const handleCaseTypeChange = (e) => {
    const caseType = e.target.value;
    setCaseTypeFilter(caseType);
    applyFilters(inmates, searchQuery, caseType);
  };

  // Toggle between table and card view
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'table' ? 'card' : 'table');
  };

  // Render loading state
  const renderLoading = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="text-center py-8 bg-white rounded-lg shadow-md">
      <FaUsers className="h-16 w-16 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-500">No inmates found</h3>
      <p className="text-gray-400 mt-2">
        Try adjusting your search or filter criteria
      </p>
    </div>
  );

  // Custom styles for DataTable
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#1e40af',
        color: 'white',
        fontSize: '0.875rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
      },
    },
    headCells: {
      style: {
        padding: '0.75rem 1rem',
        color: 'white',
      },
    },
    rows: {
      style: {
        '&:hover': {
          backgroundColor: '#f1f5f9',
          cursor: 'pointer',
        },
      },
    },
    cells: {
      style: {
        padding: '0.75rem 1rem',
      },
    },
  };

  return (
    <div className={`p-6 mt-5 transition-all duration-300 ${
      isCollapsed ? "ml-16 w-[calc(100%-4rem)]" : "ml-64 w-[calc(100%-16rem)]"
    }`}>
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Inmates Management</h1>
            <p className="text-blue-100 mt-1">View and manage all inmates in the system</p>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <span className="bg-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              <span className="font-semibold">{inmates.length}</span> Inmates Total
            </span>
          </div>
        </div>
      </div>

      {/* Control panel */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-2/3">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search inmates..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-40">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaFilter className="text-gray-400" />
                </div>
                <select
                  value={caseTypeFilter}
                  onChange={handleCaseTypeChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Case Types</option>
                  <option value="criminal">Criminal</option>
                  <option value="civil">Civil</option>
                  <option value="administrative">Administrative</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPhotos(!showPhotos)}
                  className={`px-3 py-2 border rounded-lg transition-colors ${
                    showPhotos 
                      ? 'bg-blue-100 border-blue-300 text-blue-700' 
                      : 'bg-gray-100 border-gray-300 text-gray-700'
                  }`}
                  title={showPhotos ? "Hide inmate photos" : "Show inmate photos"}
                >
                  <FaUserCircle className="text-lg" />
                </button>
                
                <button
                  onClick={toggleViewMode}
                  className={`px-3 py-2 border rounded-lg transition-colors ${
                    viewMode === 'card'
                      ? 'bg-blue-100 border-blue-300 text-blue-700' 
                      : 'bg-gray-100 border-gray-300 text-gray-700'
                  }`}
                  title={viewMode === 'table' ? "Switch to card view" : "Switch to table view"}
                >
                  {viewMode === 'table' ? <FaThLarge /> : <FaTable />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="w-full md:w-auto">
            <button
              onClick={() => setOpen(true)}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow-md transition duration-300 flex items-center justify-center"
            >
              + Add New Inmate
            </button>
          </div>
        </div>
      </div>

      {/* Inmate List View (Table or Cards) */}
      {loading ? (
        renderLoading()
      ) : filteredInmates.length === 0 ? (
        renderEmptyState()
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <DataTable 
            columns={getColumns()} 
            data={filteredInmates} 
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            responsive
            striped
            highlightOnHover
            customStyles={customStyles}
            noDataComponent={renderEmptyState()}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredInmates.map(inmate => (
            <InmateCard 
              key={inmate._id} 
              inmate={inmate} 
              onDelete={fetchInmates}
              showPhoto={showPhotos}
            />
          ))}
        </div>
      )}
      
      {/* Add Inmate Modal */}
      <AddModal open={open} setOpen={setOpen}>
        <AddInmate setOpen={setOpen} onSuccess={fetchInmates} />
      </AddModal>
    </div>
  );
};

export default InmatesList;
