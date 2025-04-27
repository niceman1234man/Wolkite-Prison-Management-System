import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import ArchiveList from '../Archive/ArchiveList';
import { useSelector } from 'react-redux';
import { FaDatabase, FaUserSecret, FaBug, FaUserShield, FaUsers, FaExchangeAlt, FaFileAlt, FaArchive } from 'react-icons/fa';
import axiosInstance from '../../utils/axiosInstance';
import useWindowSize from '../../hooks/useWindowSize';

const SecurityArchivePage = () => {
  // Check user auth from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const { width } = useWindowSize();
  
  // Entity types for security staff
  const entityOptions = [
    { value: 'inmate', label: 'Inmates', icon: <FaUsers className="text-green-600" /> },
    { value: 'clearance', label: 'Clearances', icon: <FaUserShield className="text-purple-600" /> },
    { value: 'visitor', label: 'Visitors', icon: <FaUsers className="text-orange-600" /> },
    { value: 'transfer', label: 'Transfers', icon: <FaExchangeAlt className="text-cyan-600" /> },
    { value: 'report', label: 'Reports', icon: <FaFileAlt className="text-red-600" /> },
    { value: '', label: 'All Items', icon: <FaDatabase className="text-gray-600" /> }
  ];
  
  const [selectedEntity, setSelectedEntity] = useState('inmate');
  const [initialFilters, setInitialFilters] = useState({
    entityType: 'inmate',
    searchTerm: '',
    startDate: '',
    endDate: '',
    status: '',
    // Importantly, don't restrict by deletedBy for security staff
    deletedBy: ''
  });
  
  // Debug state
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  // Add key to force ArchiveList remounting when entity changes
  const [archiveKey, setArchiveKey] = useState(Date.now());

  // Effect to handle entity type changes
  useEffect(() => {
    console.log("Entity type changed to:", selectedEntity);
    
    // Update initialFilters
    setInitialFilters(prev => ({
      ...prev,
      entityType: selectedEntity,
      // Clear any previous filter restrictions
      deletedBy: ''
    }));
    
    // Force remount of ArchiveList component
    setArchiveKey(Date.now());
  }, [selectedEntity]);

  // Effect to log when component mounts
  useEffect(() => {
    console.log("SecurityArchivePage mounted with initial entity type:", selectedEntity);
    console.log("Initial filters:", initialFilters);
    
    // Check if the user has the correct role
    console.log("Current user role:", user?.role);
    
    // Verify security staff access to inmate archives
    const securityAllowedTypes = ['clearance', 'inmate', 'visitor', 'transfer', 'report'];
    console.log("Security staff allowed entity types:", securityAllowedTypes);
    console.log("Is inmate allowed for security:", securityAllowedTypes.includes('inmate'));
    
    // Debug API check
    checkArchiveAPI();
  }, []);

  // Handle entity type change
  const handleEntityChange = (value) => {
    console.log("Changing entity type from", selectedEntity, "to", value);
    setSelectedEntity(value);
  };
  
  // Debug function to directly check the archive API
  const checkArchiveAPI = async () => {
    try {
      console.log("Checking archive API for entity type:", selectedEntity);
      const response = await axiosInstance.get('/archive', {
        params: {
          entityType: selectedEntity || undefined,
          limit: 50 // Increase limit to see more results
        }
      });
      console.log("Archive API raw response:", response);
      setDebugInfo({
        success: response.data.success,
        totalArchives: response.data.data?.items?.length || 0,
        items: response.data.data?.items || [],
        message: 'Archive API call successful',
        timestamp: new Date().toLocaleTimeString(),
        queryParams: {
          entityType: selectedEntity || 'all'
        }
      });
    } catch (error) {
      console.error("Archive API error:", error);
      setDebugInfo({
        success: false,
        error: error.message,
        response: error.response?.data,
        message: 'Archive API call failed',
        timestamp: new Date().toLocaleTimeString()
      });
    }
  };
  
  // Only allow security staff to access this page
  if (!user || user.role !== 'security') {
    return <Navigate to="/login" />;
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Main Content with Sidebar-Aware Spacing */}
      <div 
        className={`transition-all duration-300 flex-1 ${
          isCollapsed 
            ? "ml-16" 
            : "ml-64"
        }`}
      >
        {/* Fixed Header */}
        <div
          className="bg-white shadow-md fixed top-0 right-0 left-0 z-20 p-4 mt-12 flex justify-between items-center"
          style={{ 
            left: isCollapsed ? "64px" : "256px" 
          }}
        >
          <div className="flex items-center">
            <FaArchive className="text-blue-600 text-2xl mr-3" />
            <h3 className={`font-bold text-gray-800 ${width < 640 ? "text-lg" : "text-2xl"}`}>
              {width < 500 ? "Archives" : "Security Staff Archive System"}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {width >= 640 && (
              <div className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-medium flex items-center">
                <FaUserSecret className="mr-1" />
                {selectedEntity ? `${selectedEntity.charAt(0).toUpperCase() + selectedEntity.slice(1)} Archives` : 'All Archives'}
              </div>
            )}
            
            <button
              onClick={() => {
                setShowDebug(!showDebug);
                if (!debugInfo || showDebug === false) checkArchiveAPI();
              }}
              className="bg-gray-100 text-gray-700 p-2 rounded-full"
              title="Debug Archive API"
            >
              <FaBug />
            </button>
          </div>
        </div>

        {/* Debug Panel */}
        {showDebug && (
          <div className="fixed bottom-5 right-5 z-50 bg-white shadow-lg border border-gray-300 rounded-lg p-4 max-w-xl w-full max-h-[50vh] overflow-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FaBug className="text-yellow-600" /> Archive API Debug
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={checkArchiveAPI}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
                >
                  Refresh
                </button>
                <button 
                  onClick={() => setShowDebug(false)}
                  className="bg-gray-200 px-2 py-1 rounded"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="text-xs bg-gray-100 p-2 rounded">
              <p><strong>Initial Filters:</strong> {JSON.stringify(initialFilters)}</p>
              {debugInfo ? (
                <div>
                  <p className="mt-2"><strong>API Response:</strong></p>
                  <p><strong>Success:</strong> {debugInfo.success ? 'Yes' : 'No'}</p>
                  <p><strong>Total Items:</strong> {debugInfo.totalArchives}</p>
                  <p><strong>Message:</strong> {debugInfo.message}</p>
                  <p><strong>Time:</strong> {debugInfo.timestamp}</p>
                  <p><strong>Query:</strong> {JSON.stringify(debugInfo.queryParams)}</p>
                  
                  {debugInfo.error && (
                    <div className="mt-2 text-red-600">
                      <p><strong>Error:</strong> {debugInfo.error}</p>
                      <p><strong>Response:</strong> {JSON.stringify(debugInfo.response)}</p>
                    </div>
                  )}
                  
                  {debugInfo.items && debugInfo.items.length > 0 ? (
                    <div className="mt-2">
                      <p><strong>Items Found:</strong></p>
                      <ul className="list-disc pl-4 mt-1">
                        {debugInfo.items.map((item, idx) => (
                          <li key={idx}>
                            {item.entityType}: {item.originalId} (Deleted by: {
                              typeof item.deletedBy === 'object' 
                                ? item.deletedBy?._id || 'Unknown' 
                                : item.deletedBy || 'Unknown'
                            })
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-2 text-orange-600">No items found in the archive.</p>
                  )}
                </div>
              ) : (
                <p className="italic">Loading debug information...</p>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area - with proper spacing for fixed header */}
        <div className="p-4 md:p-6 mt-20" style={{ marginTop: "76px" }}>
          {/* Entity type filters */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Archive Management</h2>
            <p className="text-sm text-blue-600 mb-3">
              This page displays all archived records that have been deleted from the system. 
              Security staff can view, restore, or permanently delete these records.
            </p>
            
            <div className="flex flex-wrap gap-2">
              {entityOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleEntityChange(option.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedEntity === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Help message when no items found */}
          {selectedEntity === 'inmate' && debugInfo && debugInfo.items?.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <h3 className="text-sm font-semibold text-yellow-800">No inmate archives found</h3>
              <p className="text-xs text-yellow-700 mt-1">
                Inmate records will appear here only after they are deleted with proper archiving.
                To create an archive:
              </p>
              <ol className="list-decimal text-xs text-yellow-700 ml-5 mt-1">
                <li>When deleting an inmate, make sure to use the delete button from the inmate list</li>
                <li>The system will automatically create an archive entry before deletion</li>
                <li>You can then view, restore, or permanently delete the archived record here</li>
              </ol>
            </div>
          )}
          
          {/* Archive List */}
          <ArchiveList 
            standalone={false}
            initialFilters={initialFilters}
            key={archiveKey} // Force re-render when entity type changes
          />
        </div>
      </div>
    </div>
  );
};

export default SecurityArchivePage; 