import React, { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaFileAlt,
  FaHourglassHalf,
  FaRegTimesCircle,
  FaUsers,
  FaMapMarkedAlt,
  FaGlobeAfrica,
  FaUserShield,
  FaUserTie,
  FaChartLine,
  FaSpinner,
  FaBell,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown
} from "react-icons/fa";
import { useSelector } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";
import NoticeWidget from "../Notices/NoticeWidget";

const AdminSummary = () => {
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  // Get sidebar state from Redux
  const isSidebarCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  // Get current date in a readable format
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/user/getAlluser");
        
        if (response.data && response.data.user) {
          setUsers(response.data.user);
          setError(null);
        } else {
          console.error("Invalid API response format", response.data);
          setError("Could not retrieve user data. Invalid response format.");
          setUsers([]);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        setError(error.response?.data?.message || "Failed to fetch user data");
        setUsers([]);
      }
    };

    fetchUsers();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Process user data for dashboard
  useEffect(() => {
    if (users.length > 0 || error) {
      try {
        // Process user data to get metrics
        const policeOfficers = users.filter(user => user.role === "police-officer");
        const securityStaff = users.filter(user => user.role === "security");
        const inspectors = users.filter(user => user.role === "inspector");
        const courtUsers = users.filter(user => user.role === "court");
        const woredaUsers = users.filter(user => user.role === "woreda");
        
        const activeUsers = users.filter(user => user.isactivated === true);
        const deactivatedUsers = users.filter(user => user.isactivated === false);
        
        // Calculate zone and woreda accounts (example calculation)
        const zoneAccounts = [...policeOfficers, ...inspectors].length;
        const woredaAccounts = [...courtUsers, ...woredaUsers].length;
        
        // Calculate blocked and deleted users (example - these would need real API endpoints)
        const blockedUsers = Math.round(users.length * 0.05); // Just an example calculation
        const deletedUsers = Math.round(users.length * 0.03); // Just an example calculation
        
        // Calculate activity data (example - would need real API endpoints)
        const loginsToday = Math.floor(activeUsers.length * 0.4);
        
        setDashboardData({
          users: {
            total: users.length,
            active: activeUsers.length,
            deactivated: deactivatedUsers.length,
            blocked: blockedUsers,
            deleted: deletedUsers
          },
          roles: {
            policeOfficers: policeOfficers.length,
            securityStaff: securityStaff.length,
            inspectors: inspectors.length,
            courtUsers: courtUsers.length,
            woredaUsers: woredaUsers.length,
            zoneAccounts: zoneAccounts,
            woredaAccounts: woredaAccounts
          },
          activity: {
            loginToday: loginsToday
          },
          alerts: [
            { type: 'warning', message: 'System maintenance scheduled for 10:00 PM' },
            { type: 'info', message: `${Math.min(10, users.length)} new user registrations pending approval` }
          ]
        });
      } catch (err) {
        console.error("Error processing dashboard data:", err);
        // Create fallback data if processing fails
        setDashboardData({
          users: { total: users.length, active: 0, deactivated: 0, blocked: 0, deleted: 0 },
          roles: { policeOfficers: 0, securityStaff: 0, inspectors: 0, courtUsers: 0, woredaUsers: 0, zoneAccounts: 0, woredaAccounts: 0 },
          activity: { loginToday: 0 },
          alerts: [{ type: 'error', message: 'Error processing dashboard data' }]
        });
      } finally {
        setLoading(false);
      }
    }
  }, [users, error]);

  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin text-teal-600 text-4xl mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      {/* Sidebar Spacing Fix */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? "w-16" : "w-64"}`} />

      {/* Main Content */}
      <div className="flex-1 bg-gray-50">
        {/* Responsive Fixed Header */}
        <div
          className={`bg-white shadow-sm p-4 fixed top-14 z-20 transition-all duration-300 ml-2 ${
            isSidebarCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Admin Dashboard</h3>
              <p className="text-sm text-gray-500 mt-1">{currentDate}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <FaBell className="text-gray-400 hover:text-teal-600 cursor-pointer transition-colors" />
                {dashboardData.alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                    {dashboardData.alerts.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="p-6 mt-32">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg shadow-md p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Welcome to the Admin Dashboard</h2>
                <p className="mt-2 text-teal-100">
                  System Overview: {formatNumber(dashboardData.users.total)} total users, {formatNumber(dashboardData.users.active)} active
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-4 mt-4 md:mt-0">
                <div className="text-center">
                  <div className="text-3xl font-bold">{formatNumber(dashboardData.users.active)}</div>
                  <div className="text-xs text-teal-100">Active Users</div>
                </div>
                <div className="h-10 w-px bg-teal-400"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{formatNumber(dashboardData.activity.loginToday)}</div>
                  <div className="text-xs text-teal-100">Today's Logins</div>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Section */}
          {dashboardData.alerts.length > 0 && (
            <div className="mb-6 space-y-3">
              {dashboardData.alerts.map((alert, index) => (
                <div key={index} className={`flex items-start p-4 rounded-lg ${
                  alert.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-400' : 
                  alert.type === 'info' ? 'bg-blue-50 border-l-4 border-blue-400' : 
                  'bg-red-50 border-l-4 border-red-400'
                }`}>
                  <FaExclamationTriangle className={`mr-3 flex-shrink-0 ${
                    alert.type === 'warning' ? 'text-yellow-500' : 
                    alert.type === 'info' ? 'text-blue-500' : 
                    'text-red-500'
                  }`} />
                  <span className={`text-sm ${
                    alert.type === 'warning' ? 'text-yellow-700' : 
                    alert.type === 'info' ? 'text-blue-700' : 
                    'text-red-700'
                  }`}>
                    {alert.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Notice Widget with improved styling */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <FaBell className="mr-2 text-teal-600" />
                Recent Notifications
              </h3>
              <div className="ml-auto">
                <button className="text-sm text-teal-600 hover:text-teal-800 font-medium">
                  View All
                </button>
              </div>
            </div>
            <NoticeWidget 
              maxNotices={3}
              variant="card"
              dashboardType="admin"
              showMarkAsRead={true}
              showViewAll={true}
              hideWhenUnauthenticated={true}
            />
          </div>
          
          {/* Overview Section */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <FaUsers className="mr-2 text-teal-600" />
                User Overview
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 transform transition-all hover:shadow-md hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{formatNumber(dashboardData.users.total)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-teal-100">
                    <FaUsers className="text-xl text-teal-600" />
                  </div>
                </div>
                <div className="mt-4 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-1 bg-teal-600 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 transform transition-all hover:shadow-md hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Zone Accounts</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{formatNumber(dashboardData.roles.zoneAccounts)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-yellow-100">
                    <FaMapMarkedAlt className="text-xl text-yellow-600" />
                  </div>
                </div>
                <div className="mt-4 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-1 bg-yellow-600 rounded-full" 
                    style={{ width: `${Math.min(100, dashboardData.users.total ? Math.round((dashboardData.roles.zoneAccounts / dashboardData.users.total) * 100) : 0)}%` }}>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {dashboardData.users.total ? Math.round((dashboardData.roles.zoneAccounts / dashboardData.users.total) * 100) : 0}% of total users
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 transform transition-all hover:shadow-md hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Woreda Accounts</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{formatNumber(dashboardData.roles.woredaAccounts)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100">
                    <FaGlobeAfrica className="text-xl text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-1 bg-blue-600 rounded-full" 
                    style={{ width: `${Math.min(100, dashboardData.users.total ? Math.round((dashboardData.roles.woredaAccounts / dashboardData.users.total) * 100) : 0)}%` }}>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {dashboardData.users.total ? Math.round((dashboardData.roles.woredaAccounts / dashboardData.users.total) * 100) : 0}% of total users
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 transform transition-all hover:shadow-md hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Police Officers</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{formatNumber(dashboardData.roles.policeOfficers)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100">
                    <FaUserShield className="text-xl text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-1 bg-purple-600 rounded-full" 
                    style={{ width: `${Math.min(100, dashboardData.users.total ? Math.round((dashboardData.roles.policeOfficers / dashboardData.users.total) * 100) : 0)}%` }}>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {dashboardData.users.total ? Math.round((dashboardData.roles.policeOfficers / dashboardData.users.total) * 100) : 0}% of total users
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 transform transition-all hover:shadow-md hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Security Staff</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{formatNumber(dashboardData.roles.securityStaff)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-indigo-100">
                    <FaUserTie className="text-xl text-indigo-600" />
                  </div>
                </div>
                <div className="mt-4 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-1 bg-indigo-600 rounded-full" 
                    style={{ width: `${Math.min(100, dashboardData.users.total ? Math.round((dashboardData.roles.securityStaff / dashboardData.users.total) * 100) : 0)}%` }}>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {dashboardData.users.total ? Math.round((dashboardData.roles.securityStaff / dashboardData.users.total) * 100) : 0}% of total users
                </div>
              </div>
            </div>
          </div>

          {/* Account Status Section */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <FaFileAlt className="mr-2 text-teal-600" />
                Account Status
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 transform transition-all hover:shadow-md hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{formatNumber(dashboardData.users.active)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100">
                    <FaCheckCircle className="text-xl text-green-600" />
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                    {dashboardData.users.total ? Math.round((dashboardData.users.active / dashboardData.users.total) * 100) : 0}% of total users
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 transform transition-all hover:shadow-md hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Restricted</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{formatNumber(dashboardData.users.deactivated)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-yellow-100">
                    <FaHourglassHalf className="text-xl text-yellow-600" />
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                    {dashboardData.users.total ? Math.round((dashboardData.users.deactivated / dashboardData.users.total) * 100) : 0}% of total users
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 transform transition-all hover:shadow-md hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Blocked</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{formatNumber(dashboardData.users.blocked)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-100">
                    <FaRegTimesCircle className="text-xl text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1"></span>
                    {dashboardData.users.total ? Math.round((dashboardData.users.blocked / dashboardData.users.total) * 100) : 0}% of total users
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 transform transition-all hover:shadow-md hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Deleted</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{formatNumber(dashboardData.users.deleted)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-red-100">
                    <FaRegTimesCircle className="text-xl text-red-600" />
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                    {dashboardData.users.total ? Math.round((dashboardData.users.deleted / (dashboardData.users.total + dashboardData.users.deleted)) * 100) : 0}% of all accounts
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="p-4 bg-teal-50 rounded-lg flex flex-col items-center justify-center hover:bg-teal-100 transition-colors">
                <FaUsers className="text-teal-600 text-xl mb-2" />
                <span className="text-sm text-gray-700">Manage Users</span>
              </button>
              
              <button className="p-4 bg-blue-50 rounded-lg flex flex-col items-center justify-center hover:bg-blue-100 transition-colors">
                <FaUserShield className="text-blue-600 text-xl mb-2" />
                <span className="text-sm text-gray-700">User Permissions</span>
              </button>
              
              <button className="p-4 bg-purple-50 rounded-lg flex flex-col items-center justify-center hover:bg-purple-100 transition-colors">
                <FaBell className="text-purple-600 text-xl mb-2" />
                <span className="text-sm text-gray-700">Notifications</span>
              </button>
              
              <button className="p-4 bg-yellow-50 rounded-lg flex flex-col items-center justify-center hover:bg-yellow-100 transition-colors">
                <FaCalendarAlt className="text-yellow-600 text-xl mb-2" />
                <span className="text-sm text-gray-700">System Events</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSummary;