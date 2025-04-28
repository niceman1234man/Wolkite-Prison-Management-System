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

const ArchiveList = ({ standalone = true, initialFilters = null }) => {
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
      { value: 'woredaInmate', label: 'Woreda Inmate' },
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
    console.log("ArchiveList useEffect triggered with initialFilters:", initialFilters);
    
    // Get user data and role
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      console.log("Current user data:", userData);
      const role = userData?.role || '';
      console.log("User role:", role);
      setUserRole(role);
      
      // Apply initial filters if provided
      if (initialFilters) {
        console.log("Applying initial filters:", initialFilters);
        // Use initialFilters as the source of truth
        setFilters(prev => ({
          ...prev,
          ...initialFilters
        }));
        
        // Skip the default filter logic since we're using initialFilters
        // This ensures we don't override the entityType with security staff default
      }
      // Otherwise use default filter logic
      else {
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
        // ONLY APPLY THIS IF initialFilters IS NOT PROVIDED
        if (role === 'security' && !initialFilters) {
          // For security staff, we want to show all clearance items they can manage
          // without limiting to only ones they deleted
          const securityFilters = {
            ...filters,
            entityType: 'clearance'  // Focus on clearance items for security staff
          };
          
          setFilters(securityFilters);
          console.log("Set security staff filters:", securityFilters);
        }
        // For other non-admin users, add filter to only show items they deleted  
        else if (role && role !== 'admin') {
          setFilters(prev => ({
            ...prev,
            deletedBy: userData?.id || ''
          }));
        }
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
    
    // Fetch archived items after a small delay to allow filters to be set
    setTimeout(() => {
      fetchArchivedItems();
    }, 100);
  }, []);

  // Effect to refetch when pagination changes
  useEffect(() => {
    // Only fetch if this isn't the initial render
    if (!loading || archivedItems.length > 0) {
      fetchArchivedItems();
    }
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

  // Handle items per page change
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 1 // Reset to first page when changing the limit
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
    } else if (role === 'security') {
      navigate(`/securityStaff-dashboard/archive/${item._id}`);
    } else {
      navigate(`/policeOfficer-dashboard/archive/${item._id}`);
    }
    if (role === 'security') {
      navigate(`/securityStaff-dashboard/archive/${item._id}`);
    } else {
      navigate(`/securityStaff-dashboard/archive/${item._id}`);
    }

    if (role === 'woreda') {
      navigate(`/woreda-dashboard/archive/${item._id}`);
    } else {
      navigate(`/woreda-dashboard/archive/${item._id}`);
    }

    if (role === 'woreda') {
      navigate(`/court-dashboard/archive/${item._id}`);
    } else {
      navigate(`/court-dashboard/archive/${item._id}`);
    }

    if (role === 'admin') {
      navigate(`/admin-dashboard/archive/${item._id}`);
    } else {
      navigate(`/admin-dashboard/archive/${item._id}`);
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
    
    // Special case for security staff with allowed entity types
    if (role === 'security') {
      const securityAllowedTypes = ['clearance', 'inmate', 'visitor', 'transfer', 'report'];
      if (securityAllowedTypes.includes(item.entityType)) {
        console.log(`Security staff can manage ${item.entityType} item:`, item._id);
        return true; // Security staff can manage all clearance, inmate, etc. items
      }
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
    <div className={standalone ? "flex" : ""}>
      {standalone && <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />}
      <div className={standalone ? "flex-1 relative" : "w-full"}>
        {/* Header (only show if standalone) */}
        {standalone && (
        <div className={`bg-white shadow-md p-4 fixed top-14 z-20 flex flex-wrap items-center justify-between transition-all duration-300 ${
          isCollapsed ? "left-16 w-[calc(100%-4rem)]" : "left-64 w-[calc(100%-16rem)]"
        }`}>
          <div className="flex items-center">
            <button
                className="flex items-center text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg shadow-md transition duration-300 mr-4"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft className="mr-2 text-lg" /> Back
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Archive System</h1>
          </div>
          
            <div className="flex items-center gap-3 mt-2 sm:mt-0">
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
                    ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FaFilter /> Filters
            </button>
          </div>
        </div>
        )}
        
        {/* Main Content */}
        <div className={standalone ? "p-6 mt-24" : ""}>
          {/* Search and Filters (when not standalone) */}
          {!standalone && (
            <div className="flex flex-wrap justify-between items-center mb-6">
              <div className="relative mb-3 sm:mb-0">
                <FaSearch className="absolute left-3 top-2.5 text-gray-500" />
                <input
                  type="text"
                  name="searchTerm"
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
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <FaFilter /> Filters
              </button>
            </div>
          )}
          
          {/* Filters Panel */}
          {filterOpen && (
            <div className="bg-white p-4 mb-6 rounded-lg shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Entity Type Filter */}
                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                      <select
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500"
                        value={filters.entityType}
                    onChange={(e) => handleFilterChange('entityType', e.target.value)}
                  >
                    <option value="">All Types</option>
                    {userRole === 'admin' && <option value="user">Users</option>}
                    {(userRole === 'admin' || userRole === 'inspector') && <option value="prison">Prisons</option>}
                    {(userRole === 'admin' || userRole === 'woreda' || userRole === 'security') && <option value="inmate">Inmates</option>}
                    {(userRole === 'admin' || userRole === 'woreda') && <option value="woredaInmate">Woreda Inmates</option>}
                    {(userRole === 'admin' || userRole === 'inspector') && <option value="notice">Notices</option>}
                    {(userRole === 'admin' || userRole === 'court' || userRole === 'security') && <option value="clearance">Clearances</option>}
                    {(userRole === 'admin' || userRole === 'police-officer' || userRole === 'security') && <option value="visitor">Visitors</option>}
                    {(userRole === 'admin' || userRole === 'security') && <option value="report">Reports</option>}
                    {(userRole === 'admin' || userRole === 'police-officer' || userRole === 'security') && <option value="transfer">Transfers</option>}
                    {(userRole === 'admin' || userRole === 'police-officer') && <option value="incident">Incidents</option>}
                      </select>
                    </div>
                    
                {/* Date Range Filters */}
                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="date"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500"
                            value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                          />
                        </div>
                
                        <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                          <input
                            type="date"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500"
                            value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                          />
                    </div>
                    
                {/* Restoration Status */}
                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500"
                        value={filters.isRestored}
                    onChange={(e) => handleFilterChange('isRestored', e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="false">Archived Only</option>
                    <option value="true">Restored Only</option>
                      </select>
                    </div>
                    
                {/* Filter Actions */}
                <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2 mt-2">
                      <button
                        onClick={resetFilters}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                      >
                    Clear Filters
                      </button>
                      <button
                        onClick={applyFilters}
                    className="px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-md"
                      >
                    Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
          {/* Loading and Error States */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-red-500 mr-2" />
                <span>Error loading archived items: {error}</span>
              </div>
            </div>
          )}
          
          {!apiAvailable && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md mb-4">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-yellow-500 mr-2" />
                <span>Archive system is not available. Please try again later or contact the administrator.</span>
              </div>
            </div>
          )}
          
          {/* Content when data is loaded */}
          {!loading && !error && apiAvailable && (
            <>
              {archivedItems.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <FaArchive className="text-5xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No archived items found</h3>
                  <p className="text-gray-500">
                    {filters.entityType || filters.startDate || filters.endDate || filters.isRestored || filters.searchTerm
                      ? "Try changing your filters or search criteria"
                      : "When you delete items, they will appear here for potential restoration"}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">Found {pagination.total} archived item(s)</p>
                  
                  {/* Archive Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivedItems.map(item => (
                  <div 
                    key={item._id} 
                        className={`bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer ${
                          item.isRestored ? 'bg-green-50 border-green-200' : ''
                    }`}
                    onClick={() => viewDetails(item)}
                  >
                    <div className="p-4">
                      <div className="flex items-center mb-2">
                            <div className="mr-3 text-teal-600">
                              {entityIcons[item.entityType] || <FaFileAlt className="text-teal-500" />}
                        </div>
                            <div className="flex-1">
                              <div className="font-medium">{item.title || item.name || getItemTitle(item)}</div>
                          <div className="text-xs text-gray-500">{formatEntityType(item.entityType)}</div>
                        </div>
                        {item.isRestored && (
                          <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Restored
                          </span>
                        )}
                      </div>
                      
                          <div className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {getItemDescription(item)}
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
                    <div className="flex justify-between items-center mt-6">
                      <div className="text-sm text-gray-600">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} items
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <select 
                          value={pagination.limit} 
                          onChange={handleLimitChange}
                          className="border border-gray-300 rounded-md text-sm p-1"
                        >
                          <option value="10">10 per page</option>
                          <option value="25">25 per page</option>
                          <option value="50">50 per page</option>
                          <option value="100">100 per page</option>
                        </select>
                        
                        <div className="flex gap-1">
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
                            Prev
                    </button>
                    
                          <span className="px-3 py-1 bg-teal-600 text-white rounded">
                            {pagination.page}
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
                    </div>
                  )}
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

// Helper functions for better item display
const getItemTitle = (item) => {
  const data = item.data || {};
  
  if (item.entityType === 'woredaInmate') {
    return `${data.firstName || ''} ${data.lastName || ''}`.trim() || `Archived Inmate`;
  }
  
  if (item.entityType === 'prison') {
    return data.prison_name || 'Archived Prison';
  }
  
  return `Archived ${formatEntityType(item.entityType)}`;
};

const getItemDescription = (item) => {
  const data = item.data || {};
  
  if (item.entityType === 'woredaInmate') {
    const crime = data.crime || 'Unknown crime';
    return `Crime: ${crime}`;
  }
  
  if (item.entityType === 'prison') {
    return data.prison_location || 'No location information';
  }
  
  return item.description || data.description || item.deletionReason || 'No description available';
};

export default ArchiveList;