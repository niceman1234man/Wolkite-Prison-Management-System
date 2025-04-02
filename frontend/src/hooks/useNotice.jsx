import { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance.js";
import { useSelector } from "react-redux";

const useNotices = () => {
  const [notices, setNotices] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authError, setAuthError] = useState(null);
  const user = useSelector((state) => state.user);
  
  // Authentication verification
  useEffect(() => {
    if (!user || !user.id) {
      console.log("useNotices: No authenticated user found");
      setAuthError("Authentication required to access notices");
      setNotices([]);
    } else {
      setAuthError(null);
    }
  }, [user]);
  
  // Read from a user-specific localStorage key
  const [locallyReadNotices, setLocallyReadNotices] = useState(() => {
    // Only initialize if user is authenticated
    if (!user || !user.id) return [];
    
    const localStorageKey = `readNotices_${user.id}`;
    const saved = localStorage.getItem(localStorageKey);
    return saved ? JSON.parse(saved) : [];
  });

  // Check if a notice is read by the current user
  const isNoticeReadByUser = (notice) => {
    // Ensure user is authenticated before checking
    if (!user || !user.id) return false;
    
    // Check if in readBy array from server
    const isInServerReadBy = notice?.readBy && 
                           Array.isArray(notice.readBy) && 
                           notice.readBy.some(reader => 
                             typeof reader === 'string' 
                               ? reader === user.id 
                               : reader?.id === user.id || reader?._id === user.id);
    
    // Check if in our local backup with user-specific storage
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

  // Function to mark notice as read
  const markNoticeAsRead = async (notice) => {
    // Strict authentication check
    if (!user || !user.id) {
      console.error("Cannot mark notice as read - user not authenticated");
      setAuthError("Authentication required to mark notices as read");
      return false;
    }
    
    if (!notice.isRead) {
      try {
        console.log(`Marking notice ${notice._id} as read for user ${user.id}`);
        
        // Fix the endpoint to match the backend route definition
        const response = await axiosInstance.patch(`/notice/mark-as-read/${notice._id}`);
        
        // Debug response
        console.log("Mark as read response:", response.data);
        
        if (response.data && response.data.success) {
          console.log('Successfully marked notice as read:', response.data);
          
          // Also store in local storage as backup with user-specific key
          if (!locallyReadNotices.includes(notice._id)) {
            setLocallyReadNotices(prev => [...prev, notice._id]);
          }
          
          // Get the updated readBy array from the response if available
          let updatedReadBy = notice.readBy || [];
          if (response.data.data && response.data.data.readBy) {
            updatedReadBy = response.data.data.readBy;
            console.log('Updated readBy array from server:', updatedReadBy);
          }
          
          // Update the local state for immediate feedback
          setNotices((prev) =>
            prev.map((n) => (n._id === notice._id ? { 
              ...n, 
              isRead: true,
              readBy: updatedReadBy
            } : n))
          );
          
          // Refresh the notices data after a short delay
          setTimeout(() => {
            fetchNotices();
          }, 1000);
          
          return true;
        } else {
          console.warn("Failed to mark notice as read:", response.data);
          return false;
        }
      } catch (error) {
        console.error("Error marking notice as read:", error);
        if (error.response?.status === 401) {
          setAuthError("Authentication required to mark notices as read");
        }
        return false;
      }
    }
    setSelectedNotice(notice);
    return true;
  };
  
  // Extract fetchNotices as a named function to be able to call it after operations
  const fetchNotices = async () => {
    // Don't attempt to fetch if user is not authenticated
    if (!user || !user.id) {
      console.log("Cannot fetch notices - user not authenticated");
      setNotices([]);
      return;
    }
    
    try {
      console.log('Fetching notices in useNotice hook for user:', user.id);
      const response = await axiosInstance.get("/notice/getAllNotices");
      if (response.data && (response.data.notices || response.data.data)) {
        // Get notices from the response
        const noticesData = response.data.notices || response.data.data;
        
        // Debug first notice readBy array
        if (noticesData.length > 0) {
          console.log(`First notice title: ${noticesData[0].title}`);
          console.log(`First notice readBy: ${JSON.stringify(noticesData[0].readBy || [])}`);
          console.log(`User ID for comparison: ${user.id}`);
        }
        
        // Filter out any null/undefined notices and ensure isPosted exists
        const validNotices = noticesData.filter(n => n && typeof n.isPosted !== 'undefined');
        
        // Add a computed isRead property based on readBy array and local storage
        const noticesWithReadStatus = validNotices.map(notice => {
          const isRead = isNoticeReadByUser(notice);
          
          // Debug readBy status for a few notices
          if (Math.random() < 0.2) { // Only log ~20% of notices to avoid console spam
            console.log(`Notice ${notice._id}: isRead=${isRead}, title="${notice.title.substring(0, 20)}..."`);
            if (notice.readBy && notice.readBy.length > 0) {
              console.log(`  readBy=${JSON.stringify(notice.readBy)}`);
            }
          }
          
          return {
            ...notice,
            isRead
          };
        });
        
        setNotices(noticesWithReadStatus.filter(n => n.isPosted));
      } else {
        console.log("No notices found or invalid response format");
        setNotices([]);
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
      const errorMessage = error.response?.data?.message || error.message || "Unknown error";
      console.error(`Error details: ${errorMessage}`);
      
      if (error.response?.status === 401) {
        setAuthError("Authentication required to access notices");
      }
      
      setNotices([]);
    }
  };

  // Call fetchNotices when the component mounts or when dependencies change
  useEffect(() => {
    if (user && user.id) {
      fetchNotices();
    }
  }, [user?.id, locallyReadNotices.length]);

  return {
    notices,
    selectedNotice,
    isModalOpen,
    setIsModalOpen,
    setSelectedNotice,
    markNoticeAsRead,
    authError
  };
};

export default useNotices;
