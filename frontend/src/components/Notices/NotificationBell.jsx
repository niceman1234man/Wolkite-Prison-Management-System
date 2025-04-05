import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';

const NotificationBell = ({ dashboardType }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recentNotices, setRecentNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const userState = useSelector((state) => state.user);
  const user = userState?.user; // Get the actual user object from the Redux state
  
  useEffect(() => {
    // Debug log to see the actual user object from Redux
    console.log("Redux user state:", userState);
    console.log("User object from Redux:", user);
  }, [userState, user]);
  
  // Get userId for consistent use - try all possible locations in user object
  const getUserId = () => {
    if (!user) return null;
    
    // First try known common patterns
    if (user._id) return user._id;
    if (user.id) return user.id;
    
    // Log the user object structure if we can't find the ID in the expected places
    console.log("User object structure for ID debugging:", user);
    
    // Check if ID is nested somewhere else
    if (typeof user === 'object') {
      // Look for any property that might be an ID
      for (const key in user) {
        if (key === '_id' || key === 'id' || key === 'userId' || key === 'user_id') {
          return user[key];
        }
      }
    }
    
    // If we still can't find it, try to get from localStorage directly as last resort
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        return userData._id || userData.id;
      }
    } catch (err) {
      console.error("Error retrieving user ID from localStorage:", err);
    }
    
    return null;
  };
  
  // Now initialize locallyReadNotices after user is defined
  const [locallyReadNotices, setLocallyReadNotices] = useState(() => {
    try {
      // Get user ID from all possible locations
      const userId = getUserId();
      
      if (userId) {
        // Try to get from user-specific localStorage using consistent key
        const localStorageKey = `readNotices_${userId}`;
    const saved = localStorage.getItem(localStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log(`Loaded ${parsed.length} read notices from localStorage for user ID ${userId}`);
          return parsed;
        }
      }
      
      // If no user ID or no saved data, initialize empty
      return [];
    } catch (err) {
      console.error("Error loading read notices from localStorage:", err);
      return [];
    }
  });

  // Helper function to check if a notice is read by the current user
  const isNoticeReadByUser = (notice) => {
    const userId = getUserId();
    
    if (!userId) {
      console.warn("No user ID available when checking if notice is read");
      return false;
    }
    
    // First check if it's explicitly marked as read in the readBy array from database
    if (notice.readBy && Array.isArray(notice.readBy)) {
      for (const readerId of notice.readBy) {
        try {
          // Handle different possible formats of readerId
          if (typeof readerId === 'string') {
            if (readerId === userId || readerId === userId.toString()) {
              return true;
            }
          } else if (readerId) {
            // Check object format with id or _id
            const readerIdStr = readerId._id ? 
              readerId._id.toString() : (readerId.id ? readerId.id.toString() : null);
            
            if (readerIdStr && (readerIdStr === userId || readerIdStr === userId.toString())) {
              return true;
            }
          }
        } catch (err) {
          console.error("Error comparing reader IDs:", err);
        }
      }
    }
    
    // Then check local storage as backup - this should only be a temporary backup
    // during the current session until the server syncs
    if (notice._id && locallyReadNotices.includes(notice._id)) {
      return true;
    }
    
    return false;
  };

  // Store locally read notices in user-specific localStorage
  useEffect(() => {
    // Get the actual user ID using our helper function
    const userId = getUserId();
    if (userId) {
      // Use a consistent key format that will be the same across logins
      const localStorageKey = `readNotices_${userId}`;
      localStorage.setItem(localStorageKey, JSON.stringify(locallyReadNotices));
      console.log(`Saved ${locallyReadNotices.length} read notices to localStorage for user ID ${userId}`);
    }
  }, [locallyReadNotices, user]);

  // Determine the appropriate route based on dashboard type
  const getNoticesPagePath = () => {
    if (dashboardType === 'inspector') {
      return '/Inspector-dashboard/notices';
    } else if (dashboardType === 'police') {
      return '/policeOfficer-dashboard/notices';
    } else if (dashboardType === 'admin') {
      return '/admin-dashboard/notices';
    } else if (dashboardType === 'visitor') {
      return '/visitor-dashboard/notices';
    } else if (dashboardType === 'court') {
      return '/court-dashboard/notices';
    } else if (dashboardType === 'security') {
      return '/securityStaff-dashboard/notices';
    } else if (dashboardType === 'woreda') {
      return '/woreda-dashboard/notices';
    } else {
      return '/notices';
    }
  };

  // Determine the appropriate route for viewing a specific notice
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

  // Fetch unread notices count and recent notices
  const fetchNotifications = async () => {
    if (loading) return; // Prevent multiple simultaneous fetches
    
    setLoading(true);
    try {
      console.log('Fetching notifications...');
      console.log('Dashboard type:', dashboardType);
      
      // Get the user ID
      const userId = getUserId();
      console.log(`Current user ID for notifications: ${userId || 'Not found'}`);
      
      if (!userId) {
        console.warn("No user ID available for fetching notifications");
        setLoading(false);
        return;
      }
      
      // Get authentication token
      const token = localStorage.getItem('token');
      
      // Fetch all notices - include user ID as query param for consistent handling
      const response = await axiosInstance.get(`/notice/getAllNotices?userId=${userId}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });
      
      if (response.data && response.data.success && (
        (Array.isArray(response.data.data) && response.data.data.length > 0)
      )) {
        // Use data array from response
        const noticesArray = response.data.data;
        console.log(`Received ${noticesArray.length} notices from server`);
        
        // Debug first notice
        if (noticesArray.length > 0) {
          console.log(`First notice details:`, {
            title: noticesArray[0].title,
            readBy: noticesArray[0].readBy ? 
              `Array with ${noticesArray[0].readBy.length} items` : 
              'No readBy array',
            firstReaderId: noticesArray[0].readBy && noticesArray[0].readBy.length > 0 ? 
              noticesArray[0].readBy[0] : 'None'
          });
        }
        
        // Filter notices based on dashboard type and targetAudience
        const filteredNotices = noticesArray.filter(notice => {
          // Make sure notice exists and is valid
          if (!notice || !notice._id) return false;
          
          // Check if the notice is posted
          if (notice.isPosted === false) return false;
          
          // Filter based on target audience if specified
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

        console.log(`Filtered to ${filteredNotices.length} notices for dashboard ${dashboardType}`);

        // Add isRead property based on readBy array and local storage
        const noticesWithReadStatus = filteredNotices.map(notice => {
          const isRead = isNoticeReadByUser(notice);
          console.log(`Notice ${notice._id}: isRead=${isRead}, title=${notice.title}`);
          return {
            ...notice,
            isRead
          };
        });

        // Count unread notices
        const unreadNotices = noticesWithReadStatus.filter(notice => !notice.isRead);
        console.log(`Unread notices count: ${unreadNotices.length}`);
        setUnreadCount(unreadNotices.length);
        
        // Get recent notices (last 5)
        const sortedNotices = noticesWithReadStatus.sort((a, b) => {
          return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
        });
        
        setRecentNotices(sortedNotices.slice(0, 5));
      } else {
        console.log('No notices found or invalid response format', response.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark a notice as read
  const markAsRead = async (noticeId, e) => {
    e.stopPropagation(); // Prevent dropdown from closing
    
    try {
      // Get the user ID using our helper function
      const userId = getUserId();
      
      // Get authentication token
      const token = localStorage.getItem('token');
      
      // If no user ID available, try to get it from localStorage as a fallback
      if (!userId) {
        console.warn("No user ID found for marking notice as read");
        toast.error("Cannot mark as read - unable to identify user");
        return;
      }
      
      console.log(`Marking notice ${noticeId} as read for user ${userId}`);
      
      // First, update the UI immediately to provide instant feedback
        setRecentNotices(prevNotices => 
          prevNotices.map(notice => 
            notice._id === noticeId ? { ...notice, isRead: true } : notice
          )
        );
        
      // Add to local storage immediately
        if (!locallyReadNotices.includes(noticeId)) {
          setLocallyReadNotices(prev => [...prev, noticeId]);
        }
        
      // Update unread count immediately
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      
      // Then call the backend API to mark notice as read with explicit userId param
      // and authentication token
      const response = await axiosInstance.patch(
        `/notice/mark-as-read/${noticeId}?userId=${userId}`,
        { userId }, // Also include in body as backup
        { 
          headers: token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } : {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Debug backend response
      console.log(`Backend response for marking notice ${noticeId} as read:`, response.data);
      
      if (response.data && response.data.success) {
        // Notice was successfully marked as read
        toast.success("Notice marked as read");
        
        // Update the readBy array from the response data if available
        if (response.data.data && response.data.data.readBy) {
          const updatedReadBy = response.data.data.readBy;
          console.log('Updated readBy array from server:', updatedReadBy);
          
          // Update the readBy array in our local notices data
          setRecentNotices(prevNotices => 
            prevNotices.map(notice => 
              notice._id === noticeId ? { ...notice, isRead: true, readBy: updatedReadBy } : notice
            )
          );
          
          // After successful server update, force a refresh after 1 second
          // This ensures our local state is fully synced with server
        setTimeout(() => {
          fetchNotifications();
        }, 1000);
        }
      } else {
        console.warn("Failed to mark notice as read:", response.data);
        toast.error("Failed to mark notice as read: " + (response.data?.message || "Unknown error"));
        
        // Revert UI changes on failure
        setRecentNotices(prevNotices => 
          prevNotices.map(notice => 
            notice._id === noticeId ? { ...notice, isRead: false } : notice
          )
        );
        
        // Remove from local storage if it failed
        if (locallyReadNotices.includes(noticeId)) {
          setLocallyReadNotices(prev => prev.filter(id => id !== noticeId));
        }
        
        // Reset unread count by fetching fresh data
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notice as read:', error);
      toast.error('Failed to mark notice as read: ' + (error.response?.data?.message || error.message));
      
      // Revert UI changes on error
      setRecentNotices(prevNotices => 
        prevNotices.map(notice => 
          notice._id === noticeId ? { ...notice, isRead: false } : notice
        )
      );
      
      // Remove from local storage if it failed
      if (locallyReadNotices.includes(noticeId)) {
        setLocallyReadNotices(prev => prev.filter(id => id !== noticeId));
      }
      
      // Reset unread count by fetching fresh data
      fetchNotifications();
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every minute instead of 30 seconds
    // This gives more time for server changes to propagate
    const intervalId = setInterval(fetchNotifications, 60000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [dashboardType, user?.id, user?.user?.id, user?._id, user?.user?._id, locallyReadNotices.length]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <FaBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 overflow-hidden border border-gray-200">
          <div className="bg-teal-600 px-4 py-2 text-white flex justify-between items-center">
            <h3 className="font-medium">Notifications</h3>
            <button
              onClick={() => navigate(getNoticesPagePath())}
              className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
            >
              View All
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-pulse">Loading notifications...</div>
              </div>
            ) : recentNotices.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications available
              </div>
            ) : (
              <div>
                {/* Unread Notifications */}
                {recentNotices.filter(notice => !notice.isRead).length > 0 && (
                  <>
                    <div className="px-3 py-2 bg-gray-100 text-xs font-medium text-gray-600">
                      Unread Notifications
                    </div>
              <div className="divide-y divide-gray-100">
                      {recentNotices
                        .filter(notice => !notice.isRead)
                        .map((notice) => (
                  <div
                    key={notice._id}
                            className="p-3 hover:bg-gray-50 cursor-pointer bg-teal-50"
                    onClick={() => navigate(getNoticeDetailsPath(notice._id))}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-teal-700">
                          {notice.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {notice.description.substring(0, 60)}
                          {notice.description.length > 60 ? '...' : ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(notice.date || notice.createdAt)}
                        </p>
                      </div>
                      
                        <button
                          onClick={(e) => markAsRead(notice._id, e)}
                          className="text-xs bg-teal-100 text-teal-600 hover:bg-teal-200 px-2 py-1 rounded-full ml-2 whitespace-nowrap"
                        >
                          Mark read
                        </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}
                
                {/* No unread notifications message */}
                {recentNotices.length > 0 && recentNotices.filter(notice => !notice.isRead).length === 0 && (
                  <div className="p-3 text-center text-sm text-gray-500 bg-green-50">
                    <span className="font-medium">All caught up!</span> You have no unread notifications.
                    <p className="mt-2 text-xs">
                      <button 
                        className="text-teal-600 hover:underline" 
                        onClick={() => navigate(getNoticesPagePath())}
                      >
                        View all notifications
                      </button>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-4 py-2 text-xs text-center text-gray-500 border-t border-gray-100">
            <span>Showing unread notifications only. </span>
            <button 
              onClick={() => navigate(getNoticesPagePath())} 
              className="text-teal-600 hover:underline"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 