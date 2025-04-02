import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";
import { FaSearch, FaFilter, FaBell, FaCheckCircle, FaEye, FaExclamationTriangle, FaSortAmountDown, FaSortAmountUp, FaExclamationCircle } from "react-icons/fa";
import { format } from 'date-fns';

const priorityColors = {
  High: "bg-red-100 text-red-800 border-red-200",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Normal: "bg-green-100 text-green-800 border-green-200",
  Low: "bg-blue-100 text-blue-800 border-blue-200",
};

const DashboardNoticeList = ({ dashboardType = "visitor" }) => {
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, read, unread
  const [sortOrder, setSortOrder] = useState("desc"); // desc, asc
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  // Authentication check at component level
  useEffect(() => {
    const hasToken = !!localStorage.getItem("token");
    
    if (!hasToken && (!user || !user.id)) {
      console.log("Unauthorized access attempt to notice dashboard");
      setError("Authentication required");
      setLoading(false);
      // Redirect to login immediately
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
    } else if (hasToken) {
      // We have a token, so we can proceed even if Redux hasn't loaded the user yet
      setError(""); // Clear any authentication errors
    }
  }, [user, navigate]);
  
  // Add user-specific localStorage for reading notice status
  const [locallyReadNotices, setLocallyReadNotices] = useState(() => {
    const hasToken = !!localStorage.getItem("token");
    
    // Only initialize if user is authenticated or we have a token
    if (!hasToken && (!user || !user.id)) return [];
    
    // Try to get user ID from localStorage as a fallback if redux state isn't loaded
    let userId = user?.id;
    if (!userId) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          userId = parsedUser.id || parsedUser._id;
        } catch (e) {
          console.error("Error parsing stored user:", e);
        }
      }
    }
    
    if (!userId) return [];
    
    // Initialize from user-specific localStorage key
    const localStorageKey = `readNotices_${userId}`;
    const saved = localStorage.getItem(localStorageKey);
    return saved ? JSON.parse(saved) : [];
  });

  // Update localStorage whenever locallyReadNotices changes
  useEffect(() => {
    // Get user ID from Redux or localStorage
    let userId = user?.id;
    if (!userId) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          userId = parsedUser.id || parsedUser._id;
        } catch (e) {
          console.error("Error parsing stored user:", e);
        }
      }
    }
    
    if (userId) {
      const localStorageKey = `readNotices_${userId}`;
      localStorage.setItem(localStorageKey, JSON.stringify(locallyReadNotices));
    }
  }, [locallyReadNotices, user]);

  // Combine server-side readBy and client-side localStorage to determine if a notice is read
  const isNoticeReadByUser = (notice) => {
    // Try to get user ID from Redux or localStorage
    let userId = user?.id;
    if (!userId) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          userId = parsedUser.id || parsedUser._id;
        } catch (e) {
          console.error("Error parsing stored user:", e);
        }
      }
    }
    
    // Ensure user is authenticated before checking
    if (!userId) return false;
    
    // Check if in readBy array from server
    const isInServerReadBy = notice?.readBy && 
                           Array.isArray(notice.readBy) && 
                           notice.readBy.some(reader => 
                             typeof reader === 'string' 
                               ? reader === userId 
                               : reader?.id === userId || reader?._id === userId);
    
    // Check if in our local backup
    const isInLocalReadBy = locallyReadNotices.includes(notice?._id);
    
    return isInServerReadBy || isInLocalReadBy;
  };

  useEffect(() => {
    const hasToken = !!localStorage.getItem("token");
    
    // Only fetch notices if user is authenticated or we have a token
    if ((user && user.id) || hasToken) {
      fetchNotices();
    }
  }, [user?.id]);

  const fetchNotices = async () => {
    const hasToken = !!localStorage.getItem("token");
    
    // Don't attempt to fetch if user is not authenticated and we have no token
    if (!hasToken && (!user || !user.id)) {
      console.log("Cannot fetch notices - user not authenticated");
      setError("Authentication required");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await axiosInstance.get("/notice/getAllNotices");
      
      if (response.data && (
        (Array.isArray(response.data.notices) && response.data.notices.length > 0) || 
        (Array.isArray(response.data.data) && response.data.data.length > 0)
      )) {
        // Use notices array or data array depending on what's available
        const noticesArray = response.data.notices || response.data.data;
        console.log(`Received ${noticesArray.length} notices from server`);
        console.log('Dashboard type:', dashboardType);
        
        // Debug first notice
        if (noticesArray.length > 0) {
          console.log(`First notice:`, {
            title: noticesArray[0].title,
            targetAudience: noticesArray[0].targetAudience,
            isPosted: noticesArray[0].isPosted
          });
        }
        
        // Filter notices based on dashboard type
        const filteredByRole = noticesArray.filter(notice => {
          // Make sure notice exists and is valid
          if (!notice || !notice._id) return false;
          
          // Check if the notice is posted and active
          if (notice.isPosted === false) return false;
          
          // Filter based on target audience
          if (notice.targetAudience) {
            // If target audience is "all", show to everyone
            if (notice.targetAudience === "all") return true;
            
            // Otherwise check specific dashboard types
            if (dashboardType === 'visitor' && notice.targetAudience !== 'visitors') return false;
            if (dashboardType === 'police' && notice.targetAudience !== 'staff') return false;
            if (dashboardType === 'admin' && notice.targetAudience !== 'admin') return false;
            if (dashboardType === 'security' && notice.targetAudience !== 'security') return false;
            if (dashboardType === 'court' && notice.targetAudience !== 'court') return false;
            if (dashboardType === 'woreda' && notice.targetAudience !== 'woreda') return false;
            if (dashboardType === 'inspector' && notice.targetAudience !== 'staff') return false;
          }
          
          return true;
        });
        
        console.log(`Filtered to ${filteredByRole.length} notices for dashboard ${dashboardType}`);
        
        // Add isRead property based on readBy array
        const noticesWithReadStatus = filteredByRole.map(notice => ({
          ...notice,
          isRead: isNoticeReadByUser(notice)
        }));
        
        setNotices(noticesWithReadStatus);
        setFilteredNotices(noticesWithReadStatus);
        setError("");
      } else {
        setNotices([]);
        setFilteredNotices([]);
        setError("No notices available");
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
      
      if (error.response?.status === 401) {
        setError("Authentication required to view notices");
      } else {
        setError("Failed to fetch notices");
        toast.error("Error loading notices");
      }
      
      setNotices([]);
      setFilteredNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply filters and search when notices, searchTerm, filterType, or sortOrder changes
    let filtered = [...notices];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(notice => 
        notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply read/unread filter
    if (filterType === "read") {
      filtered = filtered.filter(notice => notice.isRead);
    } else if (filterType === "unread") {
      filtered = filtered.filter(notice => !notice.isRead);
    }
    
    // Apply sorting (by date)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt);
      const dateB = new Date(b.date || b.createdAt);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredNotices(filtered);
  }, [notices, searchTerm, filterType, sortOrder]);

  const markAsRead = async (noticeId) => {
    // Try to get user ID from Redux or localStorage
    let userId = user?.id;
    if (!userId) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          userId = parsedUser.id || parsedUser._id;
        } catch (e) {
          console.error("Error parsing stored user:", e);
        }
      }
    }
    
    if (!userId) {
      console.log("Cannot mark notice as read - user not authenticated");
      return;
    }
    
    try {
      console.log(`Marking notice ${noticeId} as read for user ${userId}`);
      
      // Fix the endpoint to match the backend route definition
      const response = await axiosInstance.patch(`/notice/mark-as-read/${noticeId}`);
      
      // Debug the response
      console.log("Mark as read response:", response.data);
      
      if (response.data && response.data.success) {
        // Get the updated readBy array from the response if available
        let updatedReadBy = [];
        const currentNotice = notices.find(n => n._id === noticeId);
        
        if (response.data.data && response.data.data.readBy) {
          updatedReadBy = response.data.data.readBy;
          console.log('Updated readBy array from server:', updatedReadBy);
        } else {
          // If server didn't return updated readBy, use the existing one
          updatedReadBy = currentNotice?.readBy || [];
          if (!updatedReadBy.some(id => id === userId || id?._id === userId)) {
            updatedReadBy = [...updatedReadBy, userId];
          }
        }
        
        // Update local state for UI immediate feedback
        setNotices(prevNotices => 
          prevNotices.map(notice => 
            notice._id === noticeId 
              ? { ...notice, isRead: true, readBy: updatedReadBy } 
              : notice
          )
        );
        
        // Also update filtered notices to keep UI in sync
        setFilteredNotices(prevNotices => 
          prevNotices.map(notice => 
            notice._id === noticeId 
              ? { ...notice, isRead: true, readBy: updatedReadBy } 
              : notice
          )
        );
        
        // Also store in local storage as backup
        if (!locallyReadNotices.includes(noticeId)) {
          setLocallyReadNotices(prev => [...prev, noticeId]);
        }
        
        toast.success("Notice marked as read");
        
        // Force a refresh of notices to ensure we get the latest server data
        setTimeout(() => {
          fetchNotices();
        }, 1000);
      } else {
        console.error("Error in response:", response.data);
        toast.error("Failed to mark notice as read: " + (response.data?.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error marking notice as read:", error);
      const errorMessage = error.response?.data?.message || error.message || "Unknown error";
      console.error(`Error details: ${errorMessage}`);
      toast.error("Failed to mark notice as read");
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return dateString || "N/A";
    }
  };

  const getNoticeDetailsPath = (noticeId) => {
    if (dashboardType === 'inspector') {
      return `/Inspector-dashboard/view-notice/${noticeId}`;
    } else if (dashboardType === 'police') {
      return `/policeOfficer-dashboard/notices/view/${noticeId}`;
    } else if (dashboardType === 'admin') {
      return `/admin-dashboard/notices/view/${noticeId}`;
    } else if (dashboardType === 'visitor') {
      return `/visitor-dashboard/notices/view/${noticeId}`;
    } else if (dashboardType === 'court') {
      return `/court-dashboard/notices/view/${noticeId}`;
    } else if (dashboardType === 'security') {
      return `/securityStaff-dashboard/notices/view/${noticeId}`;
    } else if (dashboardType === 'woreda') {
      return `/woreda-dashboard/notices/view/${noticeId}`;
    } else {
      return `/notices/${noticeId}`;
    }
  };

  return (
    <div className={`flex-1 p-4 ${isCollapsed ? "ml-16" : "ml-64"} transition-all duration-300`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Notices</h1>
        
        {/* Authentication Error */}
        {error === "Authentication required" ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FaExclamationCircle className="mx-auto text-red-500 text-5xl mb-4" />
            <h2 className="text-xl font-medium text-gray-700 mb-2">Authentication Required</h2>
            <p className="text-gray-500 mb-6">You must be logged in to view notices.</p>
            <button
              onClick={() => navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}
              className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <>
            {/* Search and Filter Bar - only show if authenticated */}
            {user && user.id && (
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search notices by title or content..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {/* Filter Buttons */}
                  <div className="flex gap-2">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                    >
                      <option value="all">All Notices</option>
                      <option value="read">Read</option>
                      <option value="unread">Unread</option>
                    </select>
                    
                    <button
                      onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                      className="px-4 py-2 border border-gray-300 rounded-lg flex items-center hover:bg-gray-50"
                    >
                      {sortOrder === "desc" ? (
                        <>
                          <FaSortAmountDown className="mr-2" /> Newest
                        </>
                      ) : (
                        <>
                          <FaSortAmountUp className="mr-2" /> Oldest
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Notice List */}
            {loading ? (
              <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                  <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 w-64 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : error && filteredNotices.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <FaBell className="mx-auto text-gray-400 text-5xl mb-4" />
                <h2 className="text-xl font-medium text-gray-700 mb-2">No Notices Available</h2>
                <p className="text-gray-500">{error}</p>
              </div>
            ) : filteredNotices.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <FaSearch className="mx-auto text-gray-400 text-5xl mb-4" />
                <h2 className="text-xl font-medium text-gray-700 mb-2">No Results Found</h2>
                <p className="text-gray-500">No notices match your search criteria. Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotices.map((notice) => (
                  <div 
                    key={notice._id} 
                    className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
                      notice.priority === "High" ? "border-red-500" :
                      notice.priority === "Medium" ? "border-yellow-500" :
                      notice.priority === "Low" ? "border-blue-500" :
                      "border-green-500"
                    } ${
                      notice.isRead ? "opacity-80" : ""
                    }`}
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                        <div className="flex-1">
                          <h2 className={`text-lg font-semibold hover:text-teal-600 cursor-pointer ${
                            notice.isRead ? "text-gray-700" : "text-gray-900"
                          }`} onClick={() => navigate(getNoticeDetailsPath(notice._id))}>
                            {notice.title}
                          </h2>
                          
                          <div className="flex flex-wrap items-center mt-2 text-sm text-gray-500 space-x-4">
                            <span>{formatDate(notice.date || notice.createdAt)}</span>
                            
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              priorityColors[notice.priority] || "bg-gray-100 text-gray-800"
                            }`}>
                              {notice.priority || "Normal"}
                            </span>
                            
                            <span className="inline-flex items-center">
                              {notice.isRead ? (
                                <FaCheckCircle className="text-green-500 mr-1" />
                              ) : (
                                <FaExclamationTriangle className="text-yellow-500 mr-1" />
                              )}
                              {notice.isRead ? "Read" : "Unread"}
                            </span>
                          </div>
                          
                          <p className="mt-2 text-gray-600 line-clamp-2">
                            {notice.description}
                          </p>
                        </div>
                        
                        <div className="mt-4 sm:mt-0 sm:ml-4 flex flex-row sm:flex-col gap-2 justify-end">
                          <button
                            onClick={() => navigate(getNoticeDetailsPath(notice._id))}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                          >
                            <FaEye className="mr-1.5" /> View
                          </button>
                          
                          {!notice.isRead && (
                            <button
                              onClick={() => markAsRead(notice._id)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                            >
                              <FaCheckCircle className="mr-1.5" /> Mark as Read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardNoticeList;