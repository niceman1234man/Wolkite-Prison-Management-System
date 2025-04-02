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
  const user = useSelector((state) => state.user);
  
  // Now initialize locallyReadNotices after user is defined
  const [locallyReadNotices, setLocallyReadNotices] = useState(() => {
    // Initialize from user-specific localStorage key
    const localStorageKey = `readNotices_${user?.id || 'guest'}`;
    const saved = localStorage.getItem(localStorageKey);
    return saved ? JSON.parse(saved) : [];
  });

  // Helper function to check if a notice is read by the current user
  const isNoticeReadByUser = (notice) => {
    // Check if in readBy array from server
    const isInServerReadBy = notice?.readBy && 
                           Array.isArray(notice.readBy) && 
                           notice.readBy.some(reader => 
                             typeof reader === 'string' 
                               ? reader === user.id 
                               : reader?.id === user.id || reader?._id === user.id);
    
    // Check if in our local backup with user-specific key
    const isInLocalReadBy = locallyReadNotices.includes(notice?._id);
    
    return isInServerReadBy || isInLocalReadBy;
  };

  // Store locally read notices in user-specific localStorage
  useEffect(() => {
    if (user && user.id) {
      const localStorageKey = `readNotices_${user.id}`;
      localStorage.setItem(localStorageKey, JSON.stringify(locallyReadNotices));
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
      const response = await axiosInstance.get('/notice/getAllNotices');
      
      if (response.data && response.data.success && (
        (Array.isArray(response.data.data) && response.data.data.length > 0)
      )) {
        // Use data array from response
        const noticesArray = response.data.data;
        console.log(`Received ${noticesArray.length} notices from server`);
        
        // Debug first notice
        if (noticesArray.length > 0) {
          console.log(`First notice:`, {
            title: noticesArray[0].title,
            readBy: noticesArray[0].readBy,
            targetAudience: noticesArray[0].targetAudience,
            isPosted: noticesArray[0].isPosted
          });
          console.log(`User ID: ${user.id}`);
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
      console.log(`Marking notice as read: ${noticeId}`);
      
      // Call the backend API to mark notice as read
      const response = await axiosInstance.patch(`/notice/mark-as-read/${noticeId}`);
      
      // Debug backend response
      console.log(`Backend response for marking notice ${noticeId} as read:`, response.data);
      
      if (response.data && response.data.success) {
        // Update the UI to show the notice as read
        setRecentNotices(prevNotices => 
          prevNotices.map(notice => 
            notice._id === noticeId ? { ...notice, isRead: true } : notice
          )
        );
        
        // Add to local storage as well as a backup
        if (!locallyReadNotices.includes(noticeId)) {
          setLocallyReadNotices(prev => [...prev, noticeId]);
        }
        
        // Update unread count
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        toast.success("Notice marked as read");
        
        // Force refresh data to ensure we have the latest from the server
        setTimeout(() => {
          fetchNotifications();
        }, 1000);
      } else {
        console.warn("Failed to mark notice as read:", response.data);
        toast.error("Failed to mark notice as read: " + (response.data?.message || "Unknown error"));
      }
    } catch (error) {
      console.error('Error marking notice as read:', error);
      toast.error('Failed to mark notice as read: ' + (error.response?.data?.message || error.message));
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
    
    // Poll for new notifications every 30 seconds
    const intervalId = setInterval(fetchNotifications, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [dashboardType, user.id, locallyReadNotices.length]);

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
              <div className="divide-y divide-gray-100">
                {recentNotices.map((notice) => (
                  <div
                    key={notice._id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer ${!notice.isRead ? 'bg-teal-50' : ''}`}
                    onClick={() => navigate(getNoticeDetailsPath(notice._id))}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${notice.isRead ? 'text-gray-700' : 'text-teal-700'}`}>
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
                      
                      {!notice.isRead && (
                        <button
                          onClick={(e) => markAsRead(notice._id, e)}
                          className="text-xs bg-teal-100 text-teal-600 hover:bg-teal-200 px-2 py-1 rounded-full ml-2 whitespace-nowrap"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-4 py-2 text-xs text-center text-gray-500 border-t border-gray-100">
            Click on a notification to view details
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 