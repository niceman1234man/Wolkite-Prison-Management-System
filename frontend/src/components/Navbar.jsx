import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import MessageNotificationIcon from './Messaging/MessageNotificationIcon';
import MessagingSystem from './Messaging/MessagingSystem';
import axiosInstance from '../services/axiosInstance';

const Navbar = () => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const dropdownRef = useRef(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false); // For profile indicator
  const user = useSelector((state) => state.user.user);
  const [unreadCount, setUnreadCount] = useState(0);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle messaging popup
  const toggleMessaging = () => {
    setShowMessaging(!showMessaging);
  };

  // Function to fetch the number of unread messages
  const fetchUnreadCount = async () => {
    try {
      // Get the user ID from localStorage
      let userId = null;
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          userId = userData.id || userData._id;
        }
      } catch (err) {
        console.error('Error getting userId from localStorage:', err);
      }
      
      // Only make the API call if we have a user ID
      if (!userId) {
        console.log('No user ID available for unread message count');
        return;
      }
      
      console.log('Fetching unread messages count for user:', userId);
      
      // Include userId explicitly in the query parameters
      const response = await axiosInstance.get(`/messages/unread/count?userId=${userId}`);
      
      if (response.data && response.data.success) {
        setUnreadCount(response.data.unreadCount || 0);
      } else {
        console.error('Unexpected response format:', response.data);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  // Check if user is not a visitor (visitor role check)
  const isStaffUser = () => {
    if (!user) return false;
    // Check for visitor role
    return user.role !== 'visitor';
  };

  return (
    <>
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo and left side menu items */}
            <div className="flex items-center">
              <div className="text-lg font-semibold text-blue-600">PMS</div>
              {/* Add other menu items here if needed */}
            </div>
            
            {/* Right side icons */}
            <div className="flex items-center space-x-4">
              {/* Message notification icon - only show for non-visitor users */}
              {user && isStaffUser() && <MessageNotificationIcon onClick={toggleMessaging} />}
              
              {/* Profile dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 relative"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {/* Profile icon or image */}
                    {user?.photo ? (
                      <img 
                        src={`http://localhost:5001/uploads/${user.photo}`} 
                        alt="profile" 
                        className="w-full h-full object-cover rounded-full" 
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                        {user?.firstName?.[0] || 'U'}
                      </div>
                    )}
                    
                    {/* Notification indicator */}
                    {hasUnreadNotifications && (
                      <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  {/* Dropdown arrow that rotates */}
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showProfileDropdown ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.middleName}</p>
                      <p className="text-sm text-gray-500">{user?.email || 'No email'}</p>
                    </div>
                    <a
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Your Profile
                    </a>
                    <a
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </a>
                    <button
                      onClick={async () => {
                        // Get user information before logout
                        const user = JSON.parse(localStorage.getItem('user'));
                        
                        try {
                          if (user && user._id) {
                            // Call the logout endpoint to record activity
                            await axiosInstance.post('/user/logout', { 
                              userId: user._id 
                            });
                            console.log('Logout activity logged successfully');
                          }
                        } catch (error) {
                          console.error('Error logging logout activity:', error);
                        } finally {
                          // Handle logout (clear storage and redirect)
                          localStorage.removeItem('token');
                          localStorage.removeItem('user');
                          window.location.href = '/login';
                        }
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Messaging modal - only render for non-visitor users */}
      {showMessaging && isStaffUser() && <MessagingSystem isOpen={showMessaging} onClose={toggleMessaging} />}
    </>
  );
};

export default Navbar; 