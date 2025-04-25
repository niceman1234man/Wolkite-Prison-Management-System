import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { 
  FaArrowLeft, 
  FaSearch, 
  FaTimes, 
  FaTrash, 
  FaUndo, 
  FaFilter, 
  FaCalendarAlt,
  FaFileAlt,
  FaUserShield,
  FaBriefcase,
  FaBuilding,
  FaUsers,
  FaBell,
  FaExchangeAlt,
  FaExclamationTriangle,
  FaUserCircle,
  FaArchive
} from 'react-icons/fa';
import axiosInstance from '../../utils/axiosInstance';
import { getArchivedItems, restoreArchivedItem, permanentlyDeleteArchivedItem } from '../../utils/archiveService';

// Icons for different entity types
const entityIcons = {
  'prison': <FaBuilding className="text-blue-600" />,
  'inmate': <FaUsers className="text-green-600" />,
  'notice': <FaBell className="text-yellow-600" />,
  'clearance': <FaUserShield className="text-purple-600" />,
  'visitor': <FaUsers className="text-orange-600" />,
  'report': <FaFileAlt className="text-red-600" />,
  'transfer': <FaExchangeAlt className="text-cyan-600" />,
  'incident': <FaExclamationTriangle className="text-red-600" />,
  'user': <FaUserCircle className="text-gray-600" />
};

// Format entity types for display
const formatEntityType = (type) => {
  if (!type) return '';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const ArchiveList = () => {
  console.log("ArchiveList component rendering");
  const navigate = useNavigate();
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  
  // State
  const [archivedItems, setArchivedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [filters, setFilters] = useState({
    entityType: '',
    startDate: '',
    endDate: '',
    isRestored: '',
    searchTerm: '',
    deletedBy: ''  // Filter by who deleted the item
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [itemToRestore, setItemToRestore] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

  // Role-based entity type mapping
  const roleEntityTypeMap = {
    'admin': ['user', 'prison', 'inmate', 'notice', 'clearance', 'visitor', 'report', 'transfer', 'incident'],
    'inspector': ['prison', 'notice'],
    'police-officer': ['incident', 'visitor', 'transfer'],
    'court': ['clearance'],
    'woreda': ['inmate'],
    'security': ['inmate', 'clearance', 'visitor', 'transfer', 'report']
  };

  // Entity type options
  const getEntityTypeOptions = () => {
    const allTypes = [
      { value: '', label: 'All Types' },
      { value: 'prison', label: 'Prison' },
      { value: 'inmate', label: 'Inmate' },
      { value: 'notice', label: 'Notice' },
      { value: 'clearance', label: 'Clearance' },
      { value: 'visitor', label: 'Visitor' },
      { value: 'report', label: 'Report' },
      { value: 'transfer', label: 'Transfer' },
      { value: 'incident', label: 'Incident' },
      { value: 'user', label: 'User' }
    ];

    // Filter types based on user role
    if (userRole && userRole !== 'admin' && roleEntityTypeMap[userRole]) {
      const allowedTypes = roleEntityTypeMap[userRole];
      return [
        { value: '', label: 'All Types' },
        ...allTypes.filter(type => allowedTypes.includes(type.value) && type.value !== '')
      ];
    }

    return allTypes;
  };

  // Restoration status options
  const restorationStatuses = [
    { value: '', label: 'All Statuses' },
    { value: 'false', label: 'Not Restored' },
    { value: 'true', label: 'Restored' }
  ];

  // Check if API is available
  const checkApiAvailability = async () => {
    try {
      console.log("Checking archive endpoint availability...");
      // Try to get a small number of items to see if API is working
      const response = await axiosInstance.get('/archive', { 
        params: { limit: 1 } 
      });
      console.log("Archive API test response:", response);
      setApiAvailable(true);
      return true;
    } catch (error) {
      console.error("Archive API check failed:", error);
      setApiAvailable(false);
      setError("Unable to connect to the archive service. Please check your connection and try again.");
      return false;
    }
  };

  // Fetch archived items
  const fetchArchivedItems = async () => {
    console.log("Fetching archived items...");
    setLoading(true);
    setError(null); // Clear any previous errors
    
    try {
      const response = await getArchivedItems({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });
      
      console.log("Archive API response:", response);
      setApiAvailable(true); // API is available if we get here
      
      if (response && response.success) {
        setArchivedItems(response.data.items || []);
        setPagination(response.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 1
        });
        console.log("Successfully loaded archive items:", response.data.items?.length || 0, "items");
      } else {
        toast.error('Failed to fetch archived items');
        setError('Failed to fetch archived items. ' + (response?.message || ''));
        setArchivedItems([]);
      }
    } catch (error) {
      console.error('Error fetching archived items:', error);
      toast.error('Failed to fetch archived items');
      setError('Error connecting to archive service. Please try again later.');
      setApiAvailable(false);
      setArchivedItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    console.log("ArchiveList useEffect triggered");
    
    // Get user data and role
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      console.log("Current user data:", userData);
      const role = userData?.role || '';
      console.log("User role:", role);
      setUserRole(role);
      
      // Set initial entity type filter based on role
      if (role && role !== 'admin' && roleEntityTypeMap[role]) {
        const allowedTypes = roleEntityTypeMap[role];
        if (allowedTypes.length === 1) {
          // If role can only access one entity type, set it automatically
          setFilters(prev => ({
            ...prev,
            entityType: allowedTypes[0]
          }));
        }
      }
      
      // Special handling for security staff with clearance
      if (role === 'security') {
        // For security staff, we want to show all clearance items they can manage
        // without limiting to only ones they deleted
        const initialFilters = {
          ...filters,
          entityType: 'clearance'  // Focus on clearance items for security staff
        };
        
        setFilters(initialFilters);
        console.log("Set security staff filters:", initialFilters);
      }
      // For other non-admin users, add filter to only show items they deleted  
      else if (role && role !== 'admin') {
        setFilters(prev => ({
          ...prev,
          deletedBy: userData?.id || ''
        }));
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
    
    // Fetch archived items directly
    fetchArchivedItems();
  }, [pagination.page, pagination.limit]);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    // Reset to first page when filtering
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
    fetchArchivedItems();
    setFilterOpen(false);
  };

  // Reset filters
  const resetFilters = () => {
    const userData = JSON.parse(localStorage.getItem('user'));
    const userId = userData?.id || '';
    const role = userData?.role || '';
    
    let resetState = {
      entityType: '',
      startDate: '',
      endDate: '',
      isRestored: '',
      searchTerm: ''
    };
    
    // Special case for security staff - focus on clearance items
    if (role === 'security') {
      resetState.entityType = 'clearance';
      console.log("Reset filters for security staff");
    }
    // For other non-admin users, maintain the deletedBy filter
    else if (role && role !== 'admin') {
      resetState.deletedBy = userId;
    }
    
    setFilters(resetState);
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
    setFilterOpen(false);
    
    // Fetch with reset filters
    setTimeout(() => {
      fetchArchivedItems();
    }, 0);
  };

  // Handle search
  const handleSearch = (e) => {
    setFilters(prev => ({
      ...prev,
      searchTerm: e.target.value
    }));

    // Debounce search
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    window.searchTimeout = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchArchivedItems();
    }, 500);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Confirm deletion
  const confirmDelete = (item) => {
    setItemToDelete(item);
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  // Handle permanent deletion
  const handlePermanentDelete = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      toast.error('Please type "delete" to confirm');
      return;
    }

    setProcessingAction(true);
    try {
      const response = await permanentlyDeleteArchivedItem(itemToDelete._id);
      if (response.success) {
        toast.success('Item permanently deleted');
        fetchArchivedItems();
      } else {
        toast.error(response.message || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    } finally {
      setProcessingAction(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
      setDeleteConfirmText('');
    }
  };

  // Confirm restoration
  const confirmRestore = (item) => {
    setItemToRestore(item);
    setShowRestoreModal(true);
  };

  // Handle restoration
  const handleRestore = async () => {
    setProcessingAction(true);
    try {
      const response = await restoreArchivedItem(itemToRestore._id);
      if (response.success) {
        toast.success('Item restored successfully');
        fetchArchivedItems();
      } else {
        toast.error(response.message || 'Failed to restore item');
      }
    } catch (error) {
      console.error('Error restoring item:', error);
      toast.error('Failed to restore item');
    } finally {
      setProcessingAction(false);
      setShowRestoreModal(false);
      setItemToRestore(null);
    }
  };

  // View archive details
  const viewDetails = (item) => {
    // Check if we're in a specific dashboard and use the appropriate route pattern
    const userData = JSON.parse(localStorage.getItem('user'));
    const role = userData?.role || '';
    
    if (role === 'police-officer') {
      navigate(`/policeOfficer-dashboard/archive/${item._id}`);
    } else {
      navigate(`/archive/${item._id}`);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Check if user can manage this archive item
  const canManageItem = (item) => {
    if (!item) return false;
    
    const userData = JSON.parse(localStorage.getItem('user'));
    // Use _id instead of id since that's what appears in the user object
    const userId = userData?._id || userData?.id;
    const role = userData?.role;
    
    // Admin can manage all items
    if (role === 'admin') return true;
    
    // Special case for security staff with clearance items
    if (role === 'security' && item.entityType === 'clearance') {
      console.log("Security staff can manage clearance item:", item._id);
      return true; // Security staff can manage all clearance items
    }
    
    // Return false if deletedBy is missing
    if (!item.deletedBy) return false;
    
    // Get the deletedBy ID safely
    let deletedById;
    if (typeof item.deletedBy === 'object') {
      // Handle case when item.deletedBy is an object but might not have _id
      deletedById = item.deletedBy && item.deletedBy._id ? item.deletedBy._id : null;
    } else {
      // Handle case when item.deletedBy is a primitive value
      deletedById = item.deletedBy;
    }
    
    // If we couldn't get a valid ID, user can't manage this item
    if (!deletedById) return false;
    
    // Check if user is the one who deleted it - convert both to strings for comparison
    const isOwner = userId && (deletedById.toString() === userId.toString());
    
    // Inspectors can manage prisons and notices if they deleted them
    if (role === 'inspector' && ['prison', 'notice'].includes(item.entityType)) {
      return isOwner;
    }
    
    // Other roles need to check both entity type and ownership
    const isEntityAllowed = roleEntityTypeMap[role]?.includes(item.entityType) || false;
    return isEntityAllowed && isOwner;
  };
  
  // Check if this entity type is allowed for user role
  const isEntityAllowed = (entityType) => {
    if (!entityType || !userRole) return false;
    if (userRole === 'admin') return true;
    
    return roleEntityTypeMap[userRole]?.includes(entityType) || false;
  };

  return (
    <div className="flex">
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />
      <div className="flex-1 relative">
        {/* Header */}
        <div className={`bg-white shadow-md p-4 fixed top-14 z-20 flex flex-wrap items-center justify-between transition-all duration-300 ${
          isCollapsed ? "left-16 w-[calc(100%-4rem)]" : "left-64 w-[calc(100%-16rem)]"
        }`}>
          <div className="flex items-center">
            <button
              className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition duration-300 mr-4"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft className="mr-2 text-lg" /> Back
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Archive System</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-2.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search archived items..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64"
                value={filters.searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`p-2 rounded-md flex items-center gap-2 ${
                filterOpen || Object.values(filters).some(v => v !== '') 
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FaFilter /> Filters
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="p-6 mt-28">
          {userRole && userRole !== 'admin' && (
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow">
              <div className="flex">
                <div className="py-1"><FaUserShield className="h-5 w-5 text-blue-600" /></div>
                <div className="ml-4">
                  {userRole === 'security' ? (
                    <>
                      <p className="font-medium">Role-Based Access: {userRole}</p>
                      <p className="text-sm mt-1">As security staff, you can view and manage all clearance archive items, regardless of who created them.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">Role-Based Access: {userRole}</p>
                      <p className="text-sm mt-1">As a {userRole}, you can only view and manage archive items that you created, according to your role permissions.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
              <button 
                className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => fetchArchivedItems()}
              >
                Retry
              </button>
            </div>
          ) : !apiAvailable ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Service Unavailable: </strong>
              <span className="block sm:inline">The archive service is currently unavailable. Please try again later.</span>
              <button 
                className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => fetchArchivedItems()}
              >
                Retry Connection
              </button>
            </div>
          ) : archivedItems.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
              {console.log("No archived items found. Current filters:", filters)}
              {console.log("User role:", userRole)}
              <FaArchive className="mx-auto text-gray-400 text-5xl mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No Archived Items Found</h3>
              {userRole === 'security' ? (
                <p className="text-gray-500">
                  No clearance archives found. This could be because no clearances have been deleted yet.
                  Try deleting a clearance item first and then check this archive page.
                </p>
              ) : (
                <p className="text-gray-500">There are no archived items matching your criteria.</p>
              )}
              {Object.values(filters).some(v => v !== '') && (
                <button
                  onClick={resetFilters}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Filter panel */}
              {filterOpen && (
                <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
                  <div className="flex justify-between mb-4">
                    <h3 className="text-lg font-medium">Filter Archives</h3>
                    <button onClick={() => setFilterOpen(false)} className="text-gray-500 hover:text-gray-700">
                      <FaTimes />
                    </button>
                  </div>
                  
                  {userRole && userRole !== 'admin' && (
                    <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded relative">
                      {userRole === 'security' ? (
                        <>
                          <strong className="font-medium">Role-based access: </strong>
                          <span className="block sm:inline">
                            As security staff, you have access to all clearance archives in the system.
                          </span>
                        </>
                      ) : (
                        <>
                          <strong className="font-medium">Role-based access: </strong>
                          <span className="block sm:inline">
                            As a {userRole}, you can only manage archives for specific items you have created.
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entity Type
                      </label>
                      <select
                        name="entityType"
                        value={filters.entityType}
                        onChange={handleFilterChange}
                        className="w-full border border-gray-300 rounded-md p-2"
                      >
                        {getEntityTypeOptions().map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Start Date</div>
                          <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded-md p-2"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">End Date</div>
                          <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded-md p-2"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Restoration Status
                      </label>
                      <select
                        name="isRestored"
                        value={filters.isRestored}
                        onChange={handleFilterChange}
                        className="w-full border border-gray-300 rounded-md p-2"
                      >
                        {restorationStatuses.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={resetFilters}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        Reset
                      </button>
                      <button
                        onClick={applyFilters}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Archive items list */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivedItems.map(item => (
                  <div 
                    key={item._id} 
                    className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer ${
                      item.isRestored ? 'bg-green-50 border-green-200' : 'bg-white'
                    }`}
                    onClick={() => viewDetails(item)}
                  >
                    <div className="p-4">
                      <div className="flex items-center mb-2">
                        <div className="mr-3">
                          {entityIcons[item.entityType] || <FaFileAlt className="text-gray-500" />}
                        </div>
                        <div>
                          <div className="font-medium">{item.title || item.name || `Archived ${formatEntityType(item.entityType)}`}</div>
                          <div className="text-xs text-gray-500">{formatEntityType(item.entityType)}</div>
                        </div>
                        {item.isRestored && (
                          <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Restored
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {item.description || item.data?.description || 'No description available'}
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-1" />
                          {formatDate(item.archivedAt || item.createdAt)}
                        </div>
                        
                        <div className="flex space-x-2">
                          {!item.isRestored && item && canManageItem(item) && (
                            <>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmRestore(item);
                                }}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="Restore"
                              >
                                <FaUndo />
                              </button>
                              
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDelete(item);
                                }}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Delete Permanently"
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.page === 1}
                      className={`px-3 py-1 rounded ${
                        pagination.page === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      First
                    </button>
                    
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`px-3 py-1 rounded ${
                        pagination.page === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Previous
                    </button>
                    
                    <span className="px-3 py-1">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className={`px-3 py-1 rounded ${
                        pagination.page === pagination.pages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Next
                    </button>
                    
                    <button
                      onClick={() => handlePageChange(pagination.pages)}
                      disabled={pagination.page === pagination.pages}
                      className={`px-3 py-1 rounded ${
                        pagination.page === pagination.pages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 mb-4">Permanently Delete?</h3>
            <p className="mb-4 text-gray-700">
              This action <span className="font-bold">cannot be undone</span>. The item will be permanently removed from the system.
            </p>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Type <span className="font-bold">delete</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Type 'delete' here"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                disabled={processingAction}
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
                disabled={deleteConfirmText.toLowerCase() !== 'delete' || processingAction}
              >
                {processingAction ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-green-600 mb-4">Restore Item?</h3>
            <p className="mb-4 text-gray-700">
              Are you sure you want to restore this {itemToRestore?.entityType}? 
              It will be moved back to its original location.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                disabled={processingAction}
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
                disabled={processingAction}
              >
                {processingAction ? 'Restoring...' : 'Restore Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveList;