import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { FaArrowLeft, FaUndo, FaTrash, FaTimes, FaLock } from 'react-icons/fa';
import { getArchivedItemDetails, restoreArchivedItem, permanentlyDeleteArchivedItem } from '../../utils/archiveService';

// Format entity types for display
const formatEntityType = (type) => {
  if (!type) return '';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

// Role-based entity type mapping
const roleEntityTypeMap = {
  'admin': ['user', 'prison', 'inmate', 'woredaInmate', 'notice', 'clearance', 'visitor', 'report', 'transfer', 'incident'],
  'inspector': ['prison', 'notice'],
  'police-officer': ['incident', 'visitor', 'transfer'],
  'court': ['clearance', 'verdict'],
  'woreda': ['woredaInmate', 'inmate', 'transfer'],
  'security': ['clearance', 'inmate', 'visitor', 'transfer', 'report']
};

const ArchiveDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  
  // Debug print
  console.log("Archive Detail Component rendering for ID:", id);
  
  // State
  const [archivedItem, setArchivedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [hasPermission, setHasPermission] = useState(false);

  // Check if user has permission for this archive item
  const checkPermission = (item) => {
    if (!item) return false;
    
    console.log("Checking permissions:", { 
      userRole, 
      userId, 
      itemType: item.entityType,
      deletedById: typeof item.deletedBy === 'object' ? item.deletedBy._id : item.deletedBy
    });
    
    // Admin can manage all items
    if (userRole === 'admin') {
      console.log("Admin has permission");
      return true;
    }
    
    // Special case for security staff with allowed entity types
    if (userRole === 'security') {
      const securityAllowedTypes = ['clearance', 'inmate', 'visitor', 'transfer', 'report'];
      if (securityAllowedTypes.includes(item.entityType)) {
        console.log(`Security staff can manage ${item.entityType} item`);
        return true; // Security staff can manage all these item types
      }
    }
    
    // Special case for police officers with allowed entity types
    if (userRole === 'police-officer') {
      const policeAllowedTypes = ['incident', 'visitor', 'transfer'];
      if (policeAllowedTypes.includes(item.entityType)) {
        console.log(`Police officer can view ${item.entityType} item`);
        return true;
      }
    }
    
    // Special case for inspector with ID 67ba63a1d53b256a864fa434
    if (userRole === 'inspector' && 
        userId === '67ba63a1d53b256a864fa434' && 
        item.entityType === 'prison') {
      console.log("Special inspector-prison permission granted");
      return true;
    }
    
    // Check if entity type is allowed for this role
    const isEntityAllowed = roleEntityTypeMap[userRole]?.includes(item.entityType) || false;
    
    // Check if user is the one who deleted it - careful with string/object comparison
    const deletedById = typeof item.deletedBy === 'object' 
      ? item.deletedBy._id 
      : item.deletedBy;
      
    // Convert both to strings for comparison
    const isOwner = deletedById && userId && 
      (deletedById.toString() === userId.toString());
    
    console.log("Permission check details:", { 
      isEntityAllowed, 
      isOwner,
      deletedById: deletedById?.toString(),
      userId: userId?.toString()
    });
    
    // Inspectors have special permissions for prisons and notices
    if (userRole === 'inspector' && ['prison', 'notice'].includes(item.entityType)) {
      const result = isOwner || userRole === 'inspector'; // All inspectors can view these
      console.log(`Inspector permission for ${item.entityType}: ${result}`);
      return result;
    }
    
    // Woreda staff can manage their inmates and transfers
    if (userRole === 'woreda' && ['woredaInmate', 'inmate', 'transfer'].includes(item.entityType)) {
      console.log(`Woreda permission for ${item.entityType}`);
      return true;
    }
    
    // Court staff can manage clearances and verdicts
    if (userRole === 'court' && ['clearance', 'verdict'].includes(item.entityType)) {
      console.log(`Court permission for ${item.entityType}`);
      return true;
    }
    
    // Other roles need both entity type permission and ownership
    const result = isEntityAllowed && isOwner;
    console.log(`Normal permission check result: ${result}`);
    return result;
  };

  // Fetch archived item details
  const fetchArchivedItemDetails = async () => {
    setLoading(true);
    try {
      const response = await getArchivedItemDetails(id);
      if (response.success) {
        const item = response.data;
        setArchivedItem(item);
        
        // Perform permission check after item is loaded
        const hasAccess = checkPermission(item);
        console.log("Permission check result:", hasAccess);
        setHasPermission(hasAccess);
      } else {
        toast.error('Failed to fetch archived item details');
        navigate('/archive');
      }
    } catch (error) {
      console.error('Error fetching archived item details:', error);
      toast.error('Failed to fetch archived item details');
      navigate('/archive');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    // Get user data
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      console.log("Full userData from localStorage:", userData);
      
      // Make sure to get the correct ID property - it might be _id instead of id
      const role = userData?.role || '';
      const uid = userData?._id || userData?.id || '';
      
      setUserRole(role);
      setUserId(uid);
      
      console.log("User data loaded:", { role, uid });
      
      // We need to set these first before fetching archived item
      // to properly check permissions
      fetchArchivedItemDetails();
    } catch (e) {
      console.error('Error parsing user data:', e);
      fetchArchivedItemDetails();
    }
  }, [id]);

  // Update permission check when role, userId or archivedItem changes
  useEffect(() => {
    if (archivedItem && userRole && userId) {
      const hasAccess = checkPermission(archivedItem);
      console.log("Permission updated:", { hasAccess, role: userRole, userId, itemType: archivedItem.entityType });
      setHasPermission(hasAccess);
      
      // Check for this specific inspector (ID: 67ba63a1d53b256a864fa434)
      if (userRole === 'inspector' && userId === '67ba63a1d53b256a864fa434' && archivedItem.entityType === 'prison') {
        console.log("*** Special case: Force permission for this inspector and prison");
        setHasPermission(true);
      }
    }
  }, [archivedItem, userRole, userId]);

  // Handle permanent deletion
  const handlePermanentDelete = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      toast.error('Please type "delete" to confirm');
      return;
    }

    setProcessingAction(true);
    try {
      const response = await permanentlyDeleteArchivedItem(id);
      if (response.success) {
        toast.success('Item permanently deleted');
        
        // Check user role for navigation
        const userData = JSON.parse(localStorage.getItem('user'));
        const role = userData?.role || '';
        
        if (role === 'police-officer') {
          navigate('/policeOfficer-dashboard/archive');
        } else if (role === 'admin') {
          navigate('/admin-dashboard/archive');
        } else if (role === 'security') {
          navigate('/securityStaff-dashboard/archive');
        } else if (role === 'inspector') {
          navigate('/inspector-dashboard/archive');
        } else if (role === 'woreda') {
          navigate('/woreda-dashboard/archive');
        } else if (role === 'court') {
          navigate('/court-dashboard/archive');
        } else {
          navigate('/archive');
        }
      } else {
        toast.error(response.message || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    } finally {
      setProcessingAction(false);
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    }
  };

  // Handle restoration
  const handleRestore = async () => {
    setProcessingAction(true);
    try {
      const response = await restoreArchivedItem(id);
      if (response.success) {
        toast.success('Item restored successfully');
        
        // Check user role for navigation
        const userData = JSON.parse(localStorage.getItem('user'));
        const role = userData?.role || '';
        
        if (role === 'police-officer') {
          navigate('/policeOfficer-dashboard/archive');
        } else if (role === 'admin') {
          navigate('/admin-dashboard/archive');
        } else if (role === 'security') {
          navigate('/securityStaff-dashboard/archive');
        } else if (role === 'inspector') {
          navigate('/inspector-dashboard/archive');
        } else if (role === 'woreda') {
          navigate('/woreda-dashboard/archive');
        } else if (role === 'court') {
          navigate('/court-dashboard/archive');
        } else {
          navigate('/archive');
        }
      } else {
        toast.error(response.message || 'Failed to restore item');
      }
    } catch (error) {
      console.error('Error restoring item:', error);
      toast.error('Failed to restore item');
    } finally {
      setProcessingAction(false);
      setShowRestoreModal(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Get item name or title
  const getItemTitle = () => {
    if (!archivedItem || !archivedItem.data) return 'Unknown Item';
    return archivedItem.data.name || 
           archivedItem.data.prison_name || 
           archivedItem.data.title || 
           `${formatEntityType(archivedItem.entityType)} ${archivedItem.originalId}`;
  };

  // Helper to render dynamic data fields
  const renderDataFields = () => {
    if (!archivedItem || !archivedItem.data) return null;
    
    const data = archivedItem.data;
    const fields = [];
    
    // Add common fields based on entity type
    switch (archivedItem.entityType) {
      case 'prison':
        if (data.prison_name) fields.push({ label: 'Name', value: data.prison_name });
        if (data.location) fields.push({ label: 'Location', value: data.location });
        if (data.capacity) fields.push({ label: 'Capacity', value: data.capacity });
        if (data.current_population) fields.push({ label: 'Population', value: data.current_population });
        if (data.status) fields.push({ label: 'Status', value: data.status });
        break;
        
      case 'inmate':
        if (data.name) fields.push({ label: 'Name', value: data.name });
        if (data.gender) fields.push({ label: 'Gender', value: data.gender });
        if (data.age) fields.push({ label: 'Age', value: data.age });
        if (data.crime) fields.push({ label: 'Crime', value: data.crime });
        if (data.sentence) fields.push({ label: 'Sentence', value: data.sentence });
        break;
        
      case 'notice':
        if (data.title) fields.push({ label: 'Title', value: data.title });
        if (data.content) fields.push({ label: 'Content', value: data.content });
        if (data.priority) fields.push({ label: 'Priority', value: data.priority });
        if (data.targetAudience) fields.push({ label: 'Target Audience', value: data.targetAudience });
        if (data.date) fields.push({ label: 'Date', value: formatDate(data.date) });
        break;
        
      // Add more cases for other entity types as needed
        
      default:
        // Generic handling for other entity types
        Object.entries(data).forEach(([key, value]) => {
          // Skip internal fields and complex objects
          if (key.startsWith('_') || typeof value === 'object') return;
          fields.push({
            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            value: typeof value === 'string' || typeof value === 'number' ? value : JSON.stringify(value)
          });
        });
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {fields.map((field, index) => (
          <div key={index} className="border-b border-gray-200 pb-2">
            <div className="text-sm text-gray-500">{field.label}</div>
            <div className="font-medium">{field.value}</div>
          </div>
        ))}
      </div>
    );
  };

  // Handle back button
  const handleBack = () => {
    // Check if we're in a specific dashboard and use the appropriate route pattern
    const userData = JSON.parse(localStorage.getItem('user'));
    const role = userData?.role || '';
    
    if (role === 'police-officer') {
      navigate('/policeOfficer-dashboard/archive');
    } else if (role === 'admin') {
      navigate('/admin-dashboard/archive');
    } else if (role === 'security') {
      navigate('/securityStaff-dashboard/archive');
    } else if (role === 'inspector') {
      navigate('/inspector-dashboard/archive');
    } else if (role === 'woreda') {
      navigate('/woreda-dashboard/archive');
    } else if (role === 'court') {
      navigate('/court-dashboard/archive');
    } else {
      navigate('/archive');
    }
  };

  return (
    <div className="flex">
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />
      <div className="flex-1 relative">
        {/* Header */}
        <div className={`bg-white shadow-md p-4 fixed top-14 z-20 flex items-center justify-between transition-all duration-300 ${
          isCollapsed ? "left-16 w-[calc(100%-4rem)]" : "left-64 w-[calc(100%-16rem)]"
        }`}>
          <div className="flex items-center">
            <button
              className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition duration-300 mr-4"
              onClick={handleBack}
            >
              <FaArrowLeft className="mr-2 text-lg" /> Back to Archive
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Archive Details</h1>
          </div>
          
          {archivedItem && !archivedItem.isRestored && hasPermission && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowRestoreModal(true)}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                <FaUndo className="mr-2" /> Restore
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                <FaTrash className="mr-2" /> Delete Permanently
              </button>
            </div>
          )}
        </div>
        
        {/* Main Content */}
        <div className="p-6 mt-28">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            </div>
          ) : !archivedItem ? (
            <div className="bg-red-50 p-4 rounded-lg text-red-700">
              Archive item not found or has been deleted
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Header with status */}
              <div className={`p-4 text-white ${archivedItem.isRestored ? 'bg-green-600' : 'bg-blue-600'}`}>
                <div className="text-sm uppercase font-semibold">
                  {archivedItem.isRestored ? 'Restored Item' : 'Archived Item'}
                </div>
                <h2 className="text-2xl font-bold mt-1">{getItemTitle()}</h2>
                <div className="text-sm mt-1 opacity-80">
                  {formatEntityType(archivedItem.entityType)} · ID: {archivedItem.originalId}
                </div>
              </div>
              
              {/* Timeline section */}
              <div className="border-b border-gray-200 p-4">
                <h3 className="text-lg font-semibold mb-3">Timeline</h3>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <FaTrash />
                    </div>
                    <div className="h-full w-0.5 bg-gray-200 my-1"></div>
                    {archivedItem.isRestored && (
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <FaUndo />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="mb-4">
                      <div className="text-sm font-semibold">Deleted</div>
                      <div className="text-sm text-gray-600">{formatDate(archivedItem.createdAt)}</div>
                      <div className="text-sm mt-1">
                        By: {
                          archivedItem.deletedBy ? (
                            typeof archivedItem.deletedBy === 'object' 
                              ? (archivedItem.deletedBy.name || archivedItem.deletedBy.username || 'User ID: ' + archivedItem.deletedBy._id)
                              : 'User ID: ' + archivedItem.deletedBy
                          ) : 'Unknown User'
                        }
                      </div>
                      {archivedItem.deletionReason && (
                        <div className="text-sm mt-1">
                          Reason: {archivedItem.deletionReason}
                        </div>
                      )}
                    </div>
                    
                    {archivedItem.isRestored && (
                      <div>
                        <div className="text-sm font-semibold">Restored</div>
                        <div className="text-sm text-gray-600">{formatDate(archivedItem.restoredAt)}</div>
                        <div className="text-sm mt-1">
                          By: {
                            archivedItem.restoredBy ? (
                              typeof archivedItem.restoredBy === 'object' 
                                ? (archivedItem.restoredBy.name || archivedItem.restoredBy.username || 'User ID: ' + archivedItem.restoredBy._id)
                                : 'User ID: ' + archivedItem.restoredBy
                            ) : 'Unknown User'
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {archivedItem && !archivedItem.isRestored && !hasPermission && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md flex items-center">
                    <FaLock className="mr-2" />
                    <span>
                      You don't have permission to restore or delete this item. Only the user who archived it or an administrator can perform these actions.
                    </span>
                  </div>
                )}
              </div>
              
              {/* Item data section */}
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-3">Item Details</h3>
                {renderDataFields()}
              </div>
              
              {/* Metadata section */}
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <h3 className="text-md font-semibold mb-2 text-gray-700">System Metadata</h3>
                <div className="text-sm text-gray-500">
                  <div>Archive ID: {archivedItem._id}</div>
                  <div>Entity Type: {formatEntityType(archivedItem.entityType)}</div>
                  <div>Original Item ID: {archivedItem.originalId}</div>
                  <div>Created At: {formatDate(archivedItem.createdAt)}</div>
                  <div>Updated At: {formatDate(archivedItem.updatedAt)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Confirm Permanent Deletion</h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <div className="mb-6">
                <p className="text-red-600 font-semibold mb-2">
                  Warning: This action cannot be undone.
                </p>
                <p className="text-gray-600 mb-4">
                  This will permanently delete the archived {archivedItem?.entityType} '{getItemTitle()}' from the system. 
                  To confirm deletion, please type <strong>delete</strong> below:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Type 'delete' to confirm"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePermanentDelete}
                  disabled={deleteConfirmText.toLowerCase() !== 'delete' || processingAction}
                  className={`px-4 py-2 bg-red-600 text-white rounded-lg font-medium flex items-center ${
                    deleteConfirmText.toLowerCase() !== 'delete' || processingAction
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-red-700'
                  }`}
                >
                  {processingAction ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaTrash className="mr-2" />
                      Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Confirm Restoration</h3>
                <button
                  onClick={() => setShowRestoreModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  This will restore the {archivedItem?.entityType} "{getItemTitle()}" to the system. Are you sure you want to continue?
                </p>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowRestoreModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestore}
                  disabled={processingAction}
                  className={`px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center ${
                    processingAction ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                  }`}
                >
                  {processingAction ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaUndo className="mr-2" />
                      Restore
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveDetail; 