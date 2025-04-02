import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";
import { format } from 'date-fns';
import { FaArrowLeft, FaBell, FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, FaCalendarAlt, FaUser, FaTags } from "react-icons/fa";
import { useSelector } from "react-redux";

const priorityColors = {
  High: "text-red-600 bg-red-100 border-red-300",
  Medium: "text-yellow-600 bg-yellow-100 border-yellow-300",
  Normal: "text-green-600 bg-green-100 border-green-300",
  Low: "text-blue-600 bg-blue-100 border-blue-300",
};

const priorityIcons = {
  High: <FaExclamationTriangle className="text-red-600" />,
  Medium: <FaExclamationCircle className="text-yellow-600" />,
  Normal: <FaCheckCircle className="text-green-600" />,
  Low: <FaBell className="text-blue-600" />,
};

const NoticeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const user = useSelector((state) => state.user);

  // Add authentication check at component level
  useEffect(() => {
    // Check if user is authenticated or has a token
    const hasToken = !!localStorage.getItem("token");
    
    if (!hasToken && (!user || !user.id)) {
      console.log("Unauthorized access attempt to notice view");
      setError("Authentication required");
      setLoading(false);
      // Redirect to login immediately
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    } else if (hasToken) {
      // We have a token, so we can proceed even if Redux hasn't loaded the user yet
      setError(""); // Clear any authentication errors
    }
  }, [user, navigate]);

  // Store locally read notices in user-specific localStorage
  const [locallyReadNotices, setLocallyReadNotices] = useState(() => {
    // Check if we have a token, even if user state isn't loaded yet
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

  // Update localStorage whenever a notice is marked as read
  useEffect(() => {
    if (user && user.id) {
      const localStorageKey = `readNotices_${user.id}`;
      localStorage.setItem(localStorageKey, JSON.stringify(locallyReadNotices));
    }
  }, [locallyReadNotices, user]);

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
    const fetchNotice = async () => {
      setLoading(true);
      try {
        // Get token and user information
        const hasToken = !!localStorage.getItem("token");
        
        // Ensure user is authenticated before fetching
        if (!hasToken && (!user || !user.id)) {
          setError("Authentication required");
          setLoading(false);
          return;
        }
        
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
        
        console.log(`Fetching notice with ID: ${id} for user: ${userId || 'unknown'}`);
        const response = await axiosInstance.get(`/notice/get-notice/${id}`);
        
        console.log("API Response:", response.data);
        
        if (response.data && (response.data.notice || response.data.data)) {
          const noticeData = response.data.notice || response.data.data;
          
          console.log(`Notice readBy array:`, noticeData.readBy || []);
          
          // Add isRead property based on readBy array
          const noticeWithReadStatus = {
            ...noticeData,
            isRead: isNoticeReadByUser(noticeData)
          };
          
          setNotice(noticeWithReadStatus);
          
          // Mark notice as read if it's not already read
          if (!noticeWithReadStatus.isRead && (userId || user?.id)) {
            await markNoticeAsRead(id);
          }
        } else {
          setError("Notice not found");
        }
      } catch (error) {
        console.error("Error fetching notice:", error);
        if (error.response?.status === 401) {
          setError("You must be logged in to view this notice");
        } else {
          setError("Failed to fetch notice details");
          toast.error("Error loading notice details");
        }
      } finally {
        setLoading(false);
      }
    };

    // Check if we have an ID and either a user or a token
    const hasToken = !!localStorage.getItem("token");
    if (id && (user?.id || hasToken)) {
      fetchNotice();
    }
  }, [id, user?.id]);

  const markNoticeAsRead = async (noticeId) => {
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
      return false;
    }
    
    try {
      console.log(`Marking notice ${noticeId} as read for user ${userId}`);
      
      const response = await axiosInstance.patch(`/notice/mark-as-read/${noticeId}`);
      
      // Debug the response
      console.log("Mark as read response:", response.data);
      
      if (response.data && response.data.success) {
        console.log("Notice marked as read successfully");
        
        // Also store in local storage as backup with user-specific key
        if (!locallyReadNotices.includes(noticeId)) {
          setLocallyReadNotices(prev => [...prev, noticeId]);
        }
        
        // Update the notice state with the latest readBy array from the response
        if (response.data.data && response.data.data.readBy) {
          console.log("Updated readBy array:", response.data.data.readBy);
          
          setNotice(prev => {
            if (!prev) return null;
            return {
              ...prev,
              isRead: true,
              readBy: response.data.data.readBy
            };
          });
        } else {
          // Fallback to simple isRead update
          setNotice(prev => prev ? { ...prev, isRead: true } : null);
        }
        
        // Force a refetch to ensure we have the latest data
        setTimeout(() => {
          const fetchAndUpdateNotice = async () => {
            try {
              const refreshResponse = await axiosInstance.get(`/notice/get-notice/${noticeId}`);
              if (refreshResponse.data && (refreshResponse.data.notice || refreshResponse.data.data)) {
                const refreshedData = refreshResponse.data.notice || refreshResponse.data.data;
                setNotice({
                  ...refreshedData,
                  isRead: true // Force true even if backend hasn't updated yet
                });
                console.log("Notice refreshed with latest data");
              }
            } catch (error) {
              console.error("Error refreshing notice:", error);
            }
          };
          
          fetchAndUpdateNotice();
        }, 1000);
        
        return true;
      } else {
        console.warn("Failed to mark notice as read:", response.data);
        return false;
      }
    } catch (error) {
      console.error("Error marking notice as read:", error);
      const errorMessage = error.response?.data?.message || error.message || "Unknown error";
      console.error(`Error details: ${errorMessage}`);
      return false;
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy h:mm a");
    } catch (e) {
      return dateString || "N/A";
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (error === "Authentication required") {
    return (
      <div className={`flex-1 p-8 ${isCollapsed ? "ml-16" : "ml-64"} transition-all duration-300`}>
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <FaExclamationCircle className="mx-auto text-red-500 text-4xl mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-6">You must be logged in to view this notice.</p>
            <button
              onClick={() => navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}
              className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex-1 p-8 ${isCollapsed ? "ml-16" : "ml-64"} transition-all duration-300`}>
        <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
            <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className={`flex-1 p-8 ${isCollapsed ? "ml-16" : "ml-64"} transition-all duration-300`}>
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <FaExclamationCircle className="mx-auto text-red-500 text-4xl mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Notice Not Found</h2>
            <p className="text-gray-600 mb-6">{error || "The notice you're looking for doesn't exist or has been removed."}</p>
            <button
              onClick={handleGoBack}
              className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 p-4 md:p-8 ${isCollapsed ? "ml-16" : "ml-64"} transition-all duration-300`}>
      {/* Back button */}
      <button
        onClick={handleGoBack}
        className="mb-4 flex items-center text-teal-600 hover:text-teal-800 transition-colors"
      >
        <FaArrowLeft className="mr-2" /> Back
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white">
          <div className="flex items-start">
            <div className="bg-white/20 p-3 rounded-full mr-4">
              {priorityIcons[notice.priority] || <FaBell />}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{notice.title}</h1>
              <div className="flex flex-wrap items-center mt-2 text-white/80 text-sm">
                <span className="flex items-center mr-4 mb-2">
                  <FaCalendarAlt className="mr-1" /> Posted: {formatDate(notice.createdAt || notice.date)}
                </span>
                {notice.postedBy && (
                  <span className="flex items-center mr-4 mb-2">
                    <FaUser className="mr-1" /> By: {notice.postedBy.firstName || "Admin"}
                  </span>
                )}
                <span className={`flex items-center px-3 py-1 rounded-full text-xs font-medium mb-2 ${priorityColors[notice.priority] || "bg-gray-100 text-gray-800"}`}>
                  Priority: {notice.priority || "Normal"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="prose max-w-none">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
              <p className="text-gray-800 whitespace-pre-wrap">{notice.description}</p>
            </div>

            {notice.attachments && notice.attachments.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <FaCalendarAlt className="mr-2 text-teal-600" /> Attachments
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notice.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="bg-teal-100 p-2 rounded-full mr-3">
                        <FaCalendarAlt className="text-teal-600" />
                      </div>
                      <span className="text-teal-600 hover:underline">{attachment.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {notice.tags && notice.tags.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center">
                  <FaTags className="text-gray-400 mr-2" />
                  <div className="flex flex-wrap gap-2">
                    {notice.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 text-sm text-gray-500 flex justify-between items-center">
          <div>
            <span className="font-medium">ID:</span> {notice._id}
          </div>
          <div>
            <span className="font-medium">Last Updated:</span> {formatDate(notice.updatedAt || notice.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeView; 