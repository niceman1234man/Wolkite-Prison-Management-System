//log component for users login and logout 
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaUser, FaCalendarAlt, FaListAlt, FaFilter, FaFileDownload, FaSearch, FaSync, FaSignInAlt, FaSignOutAlt, FaEdit, FaTrash, FaPlus, FaEye } from 'react-icons/fa';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';

const ActivityLog = () => {
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    user: '',
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
    status: ''
  });
  const [filterOpen, setFilterOpen] = useState(false);

  // Fetch logs based on current filters and pagination
  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 50); // Increase limit to see more logs
      
      // Add filters if they exist
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const queryString = params.toString();
      console.log(`Fetching logs with query: /activity/logs?${queryString}`);
      
      const response = await axiosInstance.get(`/activity/logs?${queryString}`);
      console.log('Activity logs response:', response.data);
      
      if (response.data.success) {
        const logs = response.data.data.docs || [];
        setLogs(logs);
        setTotalPages(response.data.data.totalPages || 1);

        console.log(`Fetched ${logs.length} logs: `, 
          logs.map(log => `${log.action}:${log.timestamp}`).join(', '));
        
        // Enhanced debugging information about the types of logs
        const actionCounts = {};
        logs.forEach(log => {
          actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
        });
        console.log('Action types in logs:', actionCounts);
        
        // Log complete data for the first few logs to inspect
        if (logs.length > 0) {
          console.log('Sample log entries (first 3):', logs.slice(0, 3));
        }
        
        if (logs.length === 0) {
          console.log('No logs found. Current filters:', filters);
          toast.info('No logs found matching the criteria');
        }
      } else {
        console.error('Failed to fetch logs with error:', response.data.message);
        toast.error(`Failed to fetch activity logs: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast.error(`Error loading activity logs: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch activity summary
  const fetchSummary = async () => {
    try {
      console.log('Fetching activity summary');
      const response = await axiosInstance.get('/activity/summary');
      console.log('Activity summary response:', response.data);
      
      if (response.data.success) {
        setSummary(response.data.data);
      } else {
        console.error('Failed to fetch activity summary:', response.data.message);
        toast.error('Failed to load activity summary');
      }
    } catch (error) {
      console.error('Error fetching activity summary:', error);
      toast.error(`Error loading activity summary: ${error.message || 'Unknown error'}`);
    }
  };

  // Initial load
  useEffect(() => {
    console.log('Fetching activity logs due to change in page or filters');
    fetchLogs();
    fetchSummary();
  }, [currentPage]);

  // Separate effect for filter changes to prevent double fetching
  useEffect(() => {
    if (currentPage !== 1) {
      // Reset to page 1 when filters change
      setCurrentPage(1);
    } else {
      // Only fetch if we're already on page 1
      console.log('Fetching activity logs due to filter changes');
      fetchLogs();
    }
  }, [filters.user, filters.action, filters.resourceType, filters.startDate, filters.endDate, filters.status]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1); // Reset to first page
    fetchLogs();
    setFilterOpen(false);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      user: '',
      action: '',
      resourceType: '',
      startDate: '',
      endDate: '',
      status: ''
    });
    setCurrentPage(1);
    setFilterOpen(false);
    fetchLogs();
  };

  // View all activities (convenience function)
  const viewAllActivities = () => {
    setFilters({
      user: '',
      action: '',
      resourceType: '',
      startDate: '',
      endDate: '',
      status: ''
    });
    setCurrentPage(1);
    setTimeout(() => fetchLogs(), 100); // Small delay to ensure state is updated
  };

  // Export logs to CSV
  const exportToCSV = () => {
    // Build CSV content
    const headers = ['User', 'Email', 'Action', 'Description', 'Resource', 'Status', 'Timestamp'];
    
    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.userName || 'Unknown',
        `"${log.userEmail || ''}"`,
        log.action,
        `"${log.description || ''}"`, // Wrap in quotes to handle commas
        log.resourceType ? `${log.resourceType}${log.resourceId ? ` (${log.resourceId})` : ''}` : '',
        log.status,
        new Date(log.timestamp).toLocaleString()
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for pagination
  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 mx-1 rounded ${
            currentPage === i 
              ? 'bg-teal-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className="flex justify-center mt-6">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 mx-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 mx-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  };

  // Format date for display
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get icon for action type
  const getActionIcon = (action) => {
    switch (action) {
      case 'login': return <FaSignInAlt className="text-green-500" />;
      case 'logout': return <FaSignOutAlt className="text-blue-500" />;
      case 'create': return <FaPlus className="text-purple-500" />;
      case 'update': return <FaEdit className="text-yellow-500" />;
      case 'delete': return <FaTrash className="text-red-500" />;
      case 'view': return <FaEye className="text-blue-500" />;
      default: return <FaListAlt className="text-gray-500" />;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failure': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className={`p-4 md:p-6 transition-all duration-300 mt-10 bg-gray-50 min-h-screen ${
      isCollapsed ? "ml-16" : "ml-64"
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <FaListAlt className="mr-3 text-teal-600" />
                User Activity Logs
              </h1>
              <p className="text-gray-500 mt-1">
                Track and monitor user activities across the system
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={viewAllActivities}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors flex items-center"
              >
                <FaListAlt className="mr-2" />
                All Activities
              </button>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
              >
                <FaFilter className="mr-2" />
                Filters
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <FaFileDownload className="mr-2" />
                Export
              </button>
              <button
                onClick={() => {
                  fetchLogs();
                  fetchSummary();
                }}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
              >
                <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        {summary && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Activity Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-100">Today's Activities</p>
                    <p className="text-2xl font-bold">{summary.counts.today}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-full">
                    <FaListAlt className="text-white text-xl" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">Today's Logins</p>
                    <p className="text-2xl font-bold">{summary.counts.loginToday}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-full">
                    <FaSignInAlt className="text-white text-xl" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-100">Last 7 Days</p>
                    <p className="text-2xl font-bold">{summary.counts.week}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-full">
                    <FaCalendarAlt className="text-white text-xl" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-100">Yesterday</p>
                    <p className="text-2xl font-bold">{summary.counts.yesterday}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-full">
                    <FaCalendarAlt className="text-white text-xl" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Users */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Most Active Users (7 days)</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <ul className="divide-y divide-gray-200">
                    {summary.topUsers && summary.topUsers.map((user, index) => (
                      <li key={user._id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="bg-teal-100 text-teal-800 w-6 h-6 rounded-full flex items-center justify-center mr-3">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email} ({user.role})</p>
                          </div>
                        </div>
                        <span className="bg-teal-100 text-teal-800 px-2 py-1 text-xs rounded-full">
                          {user.count} activities
                        </span>
                      </li>
                    ))}
                    {(!summary.topUsers || summary.topUsers.length === 0) && (
                      <li className="py-3 text-center text-gray-500">No data available</li>
                    )}
                  </ul>
                </div>
              </div>
              
              {/* Activity Distribution */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Activity Distribution</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <ul className="divide-y divide-gray-200">
                    {summary.activityDistribution && summary.activityDistribution.map((activity) => (
                      <li key={activity._id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          {getActionIcon(activity._id)}
                          <span className="ml-3 capitalize">{activity._id}</span>
                        </div>
                        <span className="bg-gray-200 text-gray-800 px-2 py-1 text-xs rounded-full">
                          {activity.count} events
                        </span>
                      </li>
                    ))}
                    {(!summary.activityDistribution || summary.activityDistribution.length === 0) && (
                      <li className="py-3 text-center text-gray-500">No data available</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
          
        {/* Filter Panel */}
        {filterOpen && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaFilter className="mr-2 text-teal-600" />
              Filter Activity Logs
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Email/Name
                </label>
                <input
                  type="text"
                  name="user"
                  value={filters.user}
                  onChange={handleFilterChange}
                  placeholder="Search by user"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Type
                </label>
                <select
                  name="action"
                  value={filters.action}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">All Actions</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="view">View</option>
                  <option value="download">Download</option>
                  <option value="upload">Upload</option>
                  <option value="backup">Backup</option>
                  <option value="restore">Restore</option>
                  <option value="password_change">Password Change</option>
                  <option value="account_activation">Account Activation</option>
                  <option value="account_deactivation">Account Deactivation</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource Type
                </label>
                <select
                  name="resourceType"
                  value={filters.resourceType}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">All Resources</option>
                  <option value="user">User</option>
                  <option value="inmate">Inmate</option>
                  <option value="visitor">Visitor</option>
                  <option value="prison">Prison</option>
                  <option value="incident">Incident</option>
                  <option value="system">System</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="failure">Failure</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Reset Filters
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
          
        {/* Activity Log Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Activity Logs</h2>
          </div>
          
          {loading ? (
            <div className="p-6 flex justify-center">
              <FaSync className="animate-spin text-teal-600 text-2xl" />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No activity logs found matching the criteria.</p>
              <button
                onClick={resetFilters}
                className="mt-2 text-teal-600 hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <FaUser className="text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {log.userName || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.userEmail || 'No email'} • {log.userRole || 'Unknown role'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 truncate max-w-xs">
                          {log.userEmail || 'No email'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getActionIcon(log.action)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">{log.action}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 truncate max-w-xs">
                          {log.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.resourceType ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 capitalize">
                            {log.resourceType}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(log.status)} capitalize`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && renderPagination()}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog; 