import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";
import { FaBell, FaExclamationTriangle, FaCheck, FaEye, FaExclamationCircle } from "react-icons/fa";
import { format } from 'date-fns';
import { useSelector } from "react-redux";

const priorityColors = {
  Low: "bg-blue-100 text-blue-800 border-blue-200",
  Normal: "bg-green-100 text-green-800 border-green-200",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  High: "bg-red-100 text-red-800 border-red-200",
};

const NoticeWidget = ({ 
  maxNotices = 3, 
  showViewAll = true, 
  showMarkAsRead = true, 
  compact = false,
  variant = "default", // "default", "card", "inline", "sidebar"
  dashboardType = "visitor", // "visitor", "police", "admin", "inspector", etc.
  onNoticeClick = null, // Added callback for clicking on a notice
  linkToNoticePage = true, // Whether to link to the notice page
  hideWhenUnauthenticated = false // Whether to hide the component entirely when user is not authenticated
}) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  // Add user authentication state
  const user = useSelector((state) => state.user);
  
  // Authentication check effect
  useEffect(() => {
    if (!user || !user.id) {
      console.log("NoticeWidget: No authenticated user found");
      // Don't immediately set error if we have a token - could be that Redux store is still loading
      if (!localStorage.getItem("token")) {
        setError("Authentication required");
      }
      setLoading(false);
    } else {
      // Clear error if user is authenticated
      setError("");
    }
  }, [user]);

  useEffect(() => {
    // Only fetch notices if user is authenticated or if we have a token
    if ((user && user.id) || localStorage.getItem("token")) {
      fetchNotices();
    }
  }, [user?.id]);

  const fetchNotices = async () => {
    // Still try to fetch if we have a token, even if user state is not loaded yet
    const hasToken = !!localStorage.getItem("token");
    
    if (!hasToken && (!user || !user.id)) {
      console.log("Cannot fetch notices - user not authenticated");
      setError("Authentication required");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await axiosInstance.get("/notice/getAllNotices");
      
      // Check if response has the expected structure
      if (response.data && (
        (Array.isArray(response.data.notices) && response.data.notices.length > 0) || 
        (Array.isArray(response.data.data) && response.data.data.length > 0)
      )) {
        // Use notices array or data array depending on what's available
        const noticesArray = response.data.notices || response.data.data;
        
        // Filter notices based on dashboard type and other criteria
        const filteredNotices = noticesArray.filter(notice => {
          // Make sure notice exists and is valid
          if (!notice || !notice._id) return false;
          
          // Check if the notice is posted and active
          if (notice.isPosted === false) return false;
          
          // Filter based on target audience if specified
          if (notice.targetAudience && notice.targetAudience !== 'all') {
            if (dashboardType === 'visitor' && notice.targetAudience !== 'visitors') return false;
            if (dashboardType === 'police' && notice.targetAudience !== 'staff') return false;
            if (dashboardType === 'admin' && notice.targetAudience !== 'admin') return false;
            // Add more conditions as needed
          }
          
          return true;
        });
        
        // Sort by date (newest first) and priority
        const sortedNotices = filteredNotices.sort((a, b) => {
          // Sort by priority first (High > Medium > Normal > Low)
          const priorityOrder = { High: 3, Medium: 2, Normal: 1, Low: 0 };
          const priorityDiff = 
            (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then sort by date (newest first)
          return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
        });
        
        // Limit to maxNotices
        setNotices(sortedNotices.slice(0, maxNotices));
        setError("");
      } else {
        setNotices([]);
        setError("No notices available");
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
      if (error.response?.status === 401) {
        setError("Authentication required");
      } else {
        setError("Failed to fetch notices");
      }
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (noticeId) => {
    // Don't attempt to mark as read if user is not authenticated
    if (!user || !user.id) {
      console.error("Cannot mark notice as read - user not authenticated");
      toast.error("Authentication required to mark notices as read");
      return;
    }
    
    try {
      await axiosInstance.patch(`/notice/mark-as-read/${noticeId}`);
      setNotices(prev => 
        prev.map(notice => 
          notice._id === noticeId 
            ? {...notice, isRead: true} 
            : notice
        )
      );
      toast.success("Notice marked as read");
    } catch (error) {
      console.error("Error marking notice as read:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication required to mark notice as read");
      } else {
        toast.error("Failed to mark notice as read");
      }
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "";
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  // Function to handle notice click based on role
  const handleNoticeClick = (notice) => {
    // Check for token first, as Redux user state might not be loaded yet
    const hasToken = !!localStorage.getItem("token");
    
    // Don't navigate if user is not authenticated
    if (!hasToken && (!user || !user.id)) {
      toast.error("Please log in to view notice details");
      // Redirect to login page with return URL
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    if (onNoticeClick) {
      // Use provided callback if available
      onNoticeClick(notice);
    } else if (linkToNoticePage) {
      // Navigate to appropriate page based on role
      if (dashboardType === 'inspector') {
        navigate(`/Inspector-dashboard/view-notice/${notice._id}`);
      } else if (dashboardType === 'police') {
        navigate(`/policeOfficer-dashboard/notices/view/${notice._id}`);
      } else if (dashboardType === 'admin') {
        navigate(`/admin-dashboard/notices/view/${notice._id}`);
      } else if (dashboardType === 'visitor') {
        navigate(`/visitor-dashboard/notices/view/${notice._id}`);
      } else if (dashboardType === 'court') {
        navigate(`/court-dashboard/notices/view/${notice._id}`);
      } else if (dashboardType === 'security') {
        navigate(`/securityStaff-dashboard/notices/view/${notice._id}`);
      } else if (dashboardType === 'woreda') {
        navigate(`/woreda-dashboard/notices/view/${notice._id}`);
      } else {
        navigate(`/notices/${notice._id}`);
      }
    }
  };

  // Function to handle view all click based on role
  const handleViewAllClick = () => {
    // Check for token first, as Redux user state might not be loaded yet
    const hasToken = !!localStorage.getItem("token");
    
    // Don't navigate if user is not authenticated
    if (!hasToken && (!user || !user.id)) {
      toast.error("Please log in to view all notices");
      // Redirect to login page with return URL
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    if (dashboardType === 'inspector') {
      navigate('/Inspector-dashboard/notices');
    } else if (dashboardType === 'police') {
      navigate('/policeOfficer-dashboard/notices');
    } else if (dashboardType === 'admin') {
      navigate('/admin-dashboard/notices');
    } else if (dashboardType === 'visitor') {
      navigate('/visitor-dashboard/notices');
    } else if (dashboardType === 'court') {
      navigate('/court-dashboard/notices');
    } else if (dashboardType === 'security') {
      navigate('/securityStaff-dashboard/notices');
    } else if (dashboardType === 'woreda') {
      navigate('/woreda-dashboard/notices');
    } else {
      navigate('/notices');
    }
  };

  // If hideWhenUnauthenticated is true and the user is not authenticated, return null
  if (hideWhenUnauthenticated && (!user || !user.id)) {
    return null;
  }

  // Render authentication error
  if (error === "Authentication required") {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-teal-600 text-white p-3 flex justify-between items-center">
          <h3 className="font-semibold flex items-center">
            <FaBell className="mr-2" /> Notices
          </h3>
        </div>
        <div className="p-4 text-center">
          <FaExclamationCircle className="mx-auto text-red-500 text-xl mb-2" />
          <p className="text-gray-600 text-sm">Authentication required to view notices</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse">Loading notices...</div>
      </div>
    );
  }

  if (error && error !== "Authentication required" && notices.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        {error}
      </div>
    );
  }

  // Render different variants
  if (variant === "card") {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-teal-600 text-white p-3 flex justify-between items-center">
          <h3 className="font-semibold flex items-center">
            <FaBell className="mr-2" /> Notices
          </h3>
          {showViewAll && user && user.id && (
            <button 
              onClick={handleViewAllClick}
              className="text-xs bg-white text-teal-700 px-2 py-1 rounded hover:bg-teal-50"
            >
              View All
            </button>
          )}
        </div>
        
        <div className="divide-y">
          {notices.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No notices available</div>
          ) : (
            notices.map((notice) => (
              <div 
                key={notice._id} 
                className="p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleNoticeClick(notice)}
              >
                <div className="flex justify-between items-start">
                  <h4 className={`font-medium ${notice.isRead ? 'text-gray-700' : 'text-teal-700'}`}>
                    {notice.title}
                  </h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[notice.priority] || priorityColors.Normal}`}>
                    {notice.priority}
                  </span>
                </div>
                
                {!compact && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {notice.description}
                  </p>
                )}
                
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>{formatDate(notice.date || notice.createdAt)}</span>
                  
                  {showMarkAsRead && !notice.isRead && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent parent onClick from firing
                        markAsRead(notice._id);
                      }}
                      className="flex items-center text-teal-600 hover:text-teal-800"
                    >
                      <FaCheck className="mr-1" /> Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
  
  if (variant === "inline") {
    return (
      <div className="bg-gray-50 border rounded-md p-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium flex items-center">
            <FaBell className="mr-1 text-teal-600" /> Latest Notices
          </h3>
          {showViewAll && user && user.id && (
            <button 
              onClick={handleViewAllClick}
              className="text-xs text-teal-600 hover:underline"
            >
              View All
            </button>
          )}
        </div>
        
        {notices.length === 0 ? (
          <div className="text-center text-xs text-gray-500 py-1">No notices</div>
        ) : (
          <div className="space-y-1">
            {notices.map((notice) => (
              <div 
                key={notice._id} 
                className="flex items-center text-xs py-1 px-1 hover:bg-gray-100 rounded cursor-pointer"
                onClick={() => handleNoticeClick(notice)}
              >
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  notice.priority === "High" ? "bg-red-500" : 
                  notice.priority === "Medium" ? "bg-yellow-500" : 
                  notice.priority === "Low" ? "bg-blue-500" : "bg-green-500"
                }`}></span>
                <span className={`flex-1 truncate ${notice.isRead ? "text-gray-500" : "font-medium"}`}>
                  {notice.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  if (variant === "sidebar") {
    return (
      <div className="mt-2 mb-4">
        <h3 className="text-sm font-medium px-4 py-2 flex items-center">
          <FaBell className="mr-2" /> Recent Notices
        </h3>
        
        {error === "Authentication required" ? (
          <div className="px-4 py-2 text-sm text-red-500 flex items-center">
            <FaExclamationCircle className="mr-1" /> Login required
          </div>
        ) : notices.length === 0 ? (
          <div className="px-4 py-2 text-sm text-gray-500">No notices</div>
        ) : (
          <div className="space-y-1">
            {notices.map((notice) => (
              <div 
                key={notice._id} 
                className={`px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer ${
                  notice.isRead ? "text-gray-600" : "text-gray-900 font-medium"
                }`}
                onClick={() => handleNoticeClick(notice)}
              >
                <div className="flex items-center">
                  {notice.priority === "High" && (
                    <FaExclamationTriangle className="text-red-500 mr-2" />
                  )}
                  <span className="truncate">{notice.title}</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {formatDate(notice.date || notice.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showViewAll && !error && user && user.id && (
          <div className="px-4 py-2">
            <button 
              onClick={handleViewAllClick}
              className="text-xs text-teal-600 hover:underline flex items-center"
            >
              <FaEye className="mr-1" /> View All Notices
            </button>
          </div>
        )}
      </div>
    );
  }
  
  // Default variant
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium flex items-center">
          <FaBell className="mr-2 text-teal-600" /> Notices
        </h3>
        {showViewAll && user && user.id && (
          <button 
            onClick={handleViewAllClick}
            className="text-sm text-teal-600 hover:underline"
          >
            View All
          </button>
        )}
      </div>
      
      {error === "Authentication required" ? (
        <div className="p-4 text-center bg-red-50 border border-red-200 rounded-md">
          <FaExclamationCircle className="mx-auto text-red-500 text-xl mb-2" />
          <p className="text-red-600">Authentication required to view notices</p>
        </div>
      ) : notices.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No notices available</div>
      ) : (
        <div className="space-y-2">
          {notices.map((notice) => (
            <div 
              key={notice._id} 
              className={`p-3 border rounded-md cursor-pointer ${
                notice.priority === "High" ? "border-red-200 bg-red-50" :
                notice.priority === "Medium" ? "border-yellow-200 bg-yellow-50" :
                notice.priority === "Low" ? "border-blue-200 bg-blue-50" :
                "border-gray-200 bg-gray-50"
              }`}
              onClick={() => handleNoticeClick(notice)}
            >
              <div className="flex justify-between items-start">
                <h4 className={`font-medium ${notice.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                  {notice.title}
                </h4>
                
                <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[notice.priority] || priorityColors.Normal}`}>
                  {notice.priority}
                </span>
              </div>
              
              {!compact && (
                <p className="text-sm text-gray-600 mt-1">
                  {notice.description}
                </p>
              )}
              
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>{formatDate(notice.date || notice.createdAt)}</span>
                
                {showMarkAsRead && !notice.isRead && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent parent onClick from firing
                      markAsRead(notice._id);
                    }}
                    className="flex items-center text-teal-600 hover:text-teal-800"
                  >
                    <FaCheck className="mr-1" /> Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoticeWidget; 