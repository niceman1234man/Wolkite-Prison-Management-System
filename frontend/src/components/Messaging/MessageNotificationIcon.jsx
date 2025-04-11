import React, { useState, useEffect } from 'react';
import { FiMessageCircle } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-hot-toast';

const MessageNotificationIcon = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [animated, setAnimated] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());
  const userState = useSelector((state) => state.user);
  const user = userState?.user;

  // Helper function to get user ID consistently
  const getUserId = () => {
    if (!user) return null;
    return user._id || user.id || (user.user && (user.user._id || user.user.id));
  };

  useEffect(() => {
    const userId = getUserId();
    if (userId) {
      console.log(`MessageNotificationIcon: Initializing for user ${userId}`);
      fetchUnreadCount();
      
      // Check every 15 seconds instead of 30 for more responsive updates
      const interval = setInterval(fetchUnreadCount, 15000);
      
      // Listen for custom events from MessagingSystem about read messages
      window.addEventListener('messagesMarkedAsRead', handleMessagesRead);
      
      // Listen for updated count events
      window.addEventListener('unreadCountUpdated', handleCountUpdated);
      
      // Listen for user changes in the messaging system
      window.addEventListener('messagingUsersLoaded', () => {
        console.log('MessageNotificationIcon: User list changed, refreshing count');
        fetchUnreadCount();
      });
      
      // Listen for admin message sent events
      window.addEventListener('adminMessageSent', (event) => {
        console.log('MessageNotificationIcon: Admin sent a message, refreshing count');
        // Add a small delay to ensure the server has processed the message
        setTimeout(fetchUnreadCount, 1000);
      });
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('messagesMarkedAsRead', handleMessagesRead);
        window.removeEventListener('unreadCountUpdated', handleCountUpdated);
        window.removeEventListener('messagingUsersLoaded', fetchUnreadCount);
        window.removeEventListener('adminMessageSent', fetchUnreadCount);
      };
    }
  }, [user]);
  
  // Handler for the unreadCountUpdated event
  const handleCountUpdated = (event) => {
    if (event.detail) {
      console.log(`MessageNotificationIcon: Unread count updated event received`, event.detail);
      
      // Update the count based on the event data
      if (event.detail.totalCount !== undefined) {
        setUnreadCount(event.detail.totalCount);
      }
    }
  };
  
  // Handler for the custom event when messages are marked as read
  const handleMessagesRead = (event) => {
    if (event.detail) {
      console.log(`MessageNotificationIcon: Messages marked as read event received`, event.detail);
      
      // Immediately fetch updated count instead of waiting for the interval
      fetchUnreadCount();
    }
  };
  
  // Handle manual reset (double-click)
  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!unreadCount) return;
    
    console.log('MessageNotificationIcon: Manual reset initiated');
    setUnreadCount(0);
    toast.success('Notification count reset', { duration: 2000 });
  };

  // Add animation when unread count changes
  useEffect(() => {
    if (unreadCount > 0) {
      setAnimated(true);
      const timer = setTimeout(() => setAnimated(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const fetchUnreadCount = async () => {
    const userId = getUserId();
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      // Get token for authenticated request
      const token = localStorage.getItem('token');
      
      // Make API call with user ID in query params and authorization header
      const response = await axiosInstance.get(`/messages/unread/count?userId=${userId}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });
      
      console.log('MessageNotificationIcon: Unread count response:', response.data);
      
      // Handle different response formats
      let newCount = 0;
      if (response.data) {
        if (response.data.totalCount !== undefined) {
          newCount = response.data.totalCount;
        } else if (response.data.count !== undefined) {
          newCount = response.data.count;
        } else if (response.data.bySender) {
          // Sum up unread counts from all senders
          newCount = Object.values(response.data.bySender).reduce((sum, count) => sum + count, 0);
        } else if (typeof response.data === 'number') {
          newCount = response.data;
        } else if (typeof response.data === 'object') {
          // Try to extract count from any object format
          newCount = Object.values(response.data).reduce((sum, val) => {
            if (typeof val === 'number') return sum + val;
            return sum;
          }, 0);
        }
        
        // Provide visual feedback when count changes
        if (newCount !== unreadCount) {
          console.log(`MessageNotificationIcon: Count changed from ${unreadCount} to ${newCount}`);
          
          if (newCount > unreadCount) {
            // New messages arrived
            setAnimated(true);
            setTimeout(() => setAnimated(false), 2000);
          }
          
          setUnreadCount(newCount);
        }
      }
      
      setLastFetchTime(Date.now());
    } catch (error) {
      console.error('Failed to fetch unread message count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle direct message read (for sync with messaging system)
  const markMessageAsRead = (senderId) => {
    // Update the local count immediately for better user experience
    setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    
    // Force refresh the actual count from server
    fetchUnreadCount();
  };

  // Expose the markMessageAsRead function globally for other components to use
  useEffect(() => {
    window.markMessageAsRead = markMessageAsRead;
    return () => {
      delete window.markMessageAsRead;
    };
  }, []);

  return (
    <button 
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      className="relative p-2.5 text-gray-700 hover:bg-blue-50 rounded-full transition-all duration-300"
      aria-label="Messages"
      title="Click to open messages. Double-click to reset notification count."
    >
      <FiMessageCircle 
        size={24} 
        className={`${unreadCount > 0 ? 'text-blue-600' : 'text-gray-700'} ${animated ? 'animate-slight-bounce' : ''}`}
      />
      
      {/* Animated loading indicator */}
      {isLoading && (
        <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse-dot"></span>
      )}
      
      {/* Unread count badge */}
      {unreadCount > 0 && !isLoading && (
        <span 
          className={`absolute -top-1 -right-1 bg-red-500 text-white font-semibold text-xs rounded-full min-w-[20px] h-[20px] flex items-center justify-center ${animated ? 'animate-appear' : ''}`}
          style={{ boxShadow: '0 0 0 2px white' }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default MessageNotificationIcon;