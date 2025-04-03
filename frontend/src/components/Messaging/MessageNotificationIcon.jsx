import React, { useState, useEffect } from 'react';
import { FiMessageCircle } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import axiosInstance from '../../utils/axiosInstance';

const MessageNotificationIcon = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [animated, setAnimated] = useState(false);
  const user = useSelector((state) => state.user.user);

  useEffect(() => {
    if (user?._id) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);
  
  // Add animation when unread count increases
  useEffect(() => {
    if (unreadCount > 0) {
      setAnimated(true);
      const timer = setTimeout(() => setAnimated(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const fetchUnreadCount = async () => {
    if (!user?._id) return;
    
    try {
      setIsLoading(true);
      // Let the interceptor handle adding the user ID
      const response = await axiosInstance.get(`/messages/unread/count`);
      
      // Handle different response formats
      let newCount = 0;
      if (response.data) {
        if (response.data.count !== undefined) {
          newCount = response.data.count;
        } else if (response.data.bySender) {
          newCount = Object.values(response.data.bySender).reduce((sum, count) => sum + count, 0);
        } else if (typeof response.data === 'object') {
          newCount = Object.values(response.data).reduce((sum, count) => sum + count, 0);
        }
        
        // Trigger animation if count increases
        if (newCount > unreadCount) {
          setAnimated(true);
          setTimeout(() => setAnimated(false), 2000);
        }
        
        setUnreadCount(newCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread message count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
      aria-label="Messages"
    >
      <FiMessageCircle 
        size={22} 
        className={`${unreadCount > 0 ? 'text-blue-600' : 'text-gray-600'} ${animated ? 'animate-slight-bounce' : ''}`}
      />
      
      {/* Animated loading indicator */}
      {isLoading && (
        <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-blue-400 rounded-full animate-pulse-dot"></span>
      )}
      
      {/* Unread count badge */}
      {unreadCount > 0 && !isLoading && (
        <span 
          className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center ${animated ? 'animate-appear' : ''}`}
          style={{ boxShadow: '0 0 0 2px white' }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default MessageNotificationIcon; 