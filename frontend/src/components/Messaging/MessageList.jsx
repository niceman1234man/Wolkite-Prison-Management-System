import React from 'react';
import { FiUser, FiSearch, FiUsers, FiX } from 'react-icons/fi';

const MessageList = ({ 
  users = [], // Add default empty array to prevent null/undefined issues
  selectedUserId, 
  onSelectUser, 
  searchQuery = "", // Add default empty string
  setSearchQuery,
  unreadCounts = {} // Add default empty object
}) => {
  console.log("MessageList users count:", users.length, users);

  // Sort users by unread count (descending) and then by name
  const sortedUsers = [...(Array.isArray(users) ? users : [])].sort((a, b) => {
    // First by unread count (descending)
    const aUnread = unreadCounts[a?._id] || 0;
    const bUnread = unreadCounts[b?._id] || 0;
    
    if (bUnread !== aUnread) {
      return bUnread - aUnread;
    }
    
    // Then by name (alphabetically)
    const aName = a?.name || a?.username || a?.firstName || '';
    const bName = b?.name || b?.username || b?.firstName || '';
    return aName.localeCompare(bName);
  });

  // Updated function to get initials from both first and last names
  const getInitials = (user) => {
    if (!user) return 'U';
    
    let initials = '';
    
    // If we have a full name, get first letters of first and last name
    if (user.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length >= 2) {
        // Get first letter of first name and first letter of last name
        initials = `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`;
      } else {
        // If only one name part, get first letter
        initials = nameParts[0].charAt(0);
      }
    } 
    // If we have firstName and lastName fields
    else if (user.firstName || user.lastName) {
      if (user.firstName) initials += user.firstName.charAt(0);
      if (user.lastName) initials += user.lastName.charAt(0);
      // If we still don't have initials, try middleName
      if (!initials && user.middleName) initials = user.middleName.charAt(0);
    }
    // Fallback to username
    else if (user.username) {
      initials = user.username.charAt(0);
    }
    
    return initials.toUpperCase() || 'U';
  };

  // Enhanced color generator with a wider palette
  const getAvatarColor = (userId) => {
    try {
      // Expanded color palette for more variety
      const colors = [
        { bg: '#f87171', text: '#7f1d1d' }, // Red
        { bg: '#fb923c', text: '#7c2d12' }, // Orange
        { bg: '#facc15', text: '#713f12' }, // Yellow
        { bg: '#a3e635', text: '#365314' }, // Lime
        { bg: '#4ade80', text: '#14532d' }, // Green
        { bg: '#34d399', text: '#064e3b' }, // Emerald
        { bg: '#2dd4bf', text: '#134e4a' }, // Teal
        { bg: '#22d3ee', text: '#155e75' }, // Cyan
        { bg: '#38bdf8', text: '#075985' }, // Light Blue
        { bg: '#60a5fa', text: '#1e40af' }, // Blue
        { bg: '#818cf8', text: '#3730a3' }, // Indigo
        { bg: '#a78bfa', text: '#4c1d95' }, // Violet
        { bg: '#c084fc', text: '#581c87' }, // Purple
        { bg: '#e879f9', text: '#701a75' }, // Fuchsia
        { bg: '#f472b6', text: '#831843' }, // Pink
        { bg: '#fb7185', text: '#881337' }  // Rose
      ];
      
      // Create a more consistent hash from the userID
      let hash = 0;
      const id = String(userId || '0');
      
      // Use all characters of the ID to generate a hash
      for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash) + id.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
      }
      
      // Ensure hash is positive and get a modulo for the colors array
      const colorIndex = Math.abs(hash) % colors.length;
      return colors[colorIndex];
    } catch (err) {
      console.error("Error generating avatar color:", err);
      return { bg: '#e5e7eb', text: '#374151' }; // Default gray
    }
  };

  // Get the first name of a user
  const getFirstName = (user) => {
    if (!user) return 'User';
    
    if (user.firstName) return user.firstName;
    
    if (user.name) {
      // Try to get first name from full name
      const nameParts = user.name.split(' ');
      return nameParts[0];
    }
    
    return user.username || 'User';
  };

  // Get display name for the user
  const getDisplayName = (user) => {
    if (!user) return 'User';
    
    if (user.name) return user.name;
    
    if (user.firstName || user.middleName || user.lastName) {
      return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ');
    }
    
    return user.username || 'User';
  };

  // Filter users by search query
  const displayUsers = searchQuery.trim() ? 
    sortedUsers.filter(user => {
      if (!user) return false;
      const searchFields = [
        user.name,
        user.username,
        user.firstName,
        user.middleName,
        user.lastName,
        user.role
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchFields.includes(searchQuery.toLowerCase());
    }) : 
    sortedUsers;

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 border-b bg-white shadow-sm search-container">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent search-input"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ color: '#1e293b', backgroundColor: 'white' }}
          />
          {searchQuery && (
            <button 
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              onClick={() => setSearchQuery('')}
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      </div>
      
      {/* User list - Now with Telegram-like styling */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {!Array.isArray(users) || users.length === 0 || displayUsers.length === 0 ? (
          <div className="text-center p-6 empty-state">
            <FiUsers size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-500 mb-1">
              {searchQuery ? 'No users found matching your search' : 'No users available'}
            </p>
            {searchQuery && <p className="text-sm text-gray-400">Try adjusting your search</p>}
          </div>
        ) : (
          <div className="divide-y">
            {displayUsers.map((user) => {
              if (!user || !user._id) return null;
              
              try {
                const avatarColor = getAvatarColor(user._id);
                const hasUnread = (unreadCounts[user._id] || 0) > 0;
                const displayName = getDisplayName(user);
                const initials = getInitials(user);
                
                return (
                  <div
                    key={user._id}
                    onClick={() => onSelectUser(user._id)}
                    className={`user-list-item ${selectedUserId === user._id ? 'active' : ''}`}
                  >
                    <div className="user-avatar relative">
                      {user.photo ? (
                        <img 
                          src={user.photo} 
                          alt={displayName}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            // If image fails to load, fall back to initial
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentNode.style.backgroundColor = avatarColor.bg;
                            e.target.parentNode.innerHTML += `<span style="color: ${avatarColor.text};">${initials}</span>`;
                          }}
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center rounded-full"
                          style={{
                            backgroundColor: avatarColor.bg,
                            color: avatarColor.text
                          }}
                        >
                          <span>{initials}</span>
                        </div>
                      )}
                      {user.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="user-info">
                      <div className="flex justify-between items-center">
                        <span className={`user-name truncate ${user.isAdmin || user.role === 'admin' ? 'text-red-600 font-medium' : 'font-medium'}`}>
                          {displayName}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {user.lastMessageAt ? new Date(user.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="last-message max-w-[75%] truncate">
                          {user.lastMessage ? (
                            <span className="truncate text-gray-600">{user.lastMessage}</span>
                          ) : (
                            <span className="text-gray-400 italic text-sm">No messages yet</span>
                          )}
                        </div>
                        
                        {hasUnread && (
                          <div className="unread-badge ml-auto bg-blue-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                            {unreadCounts[user._id]}
                          </div>
                        )}
                      </div>
                      
                      {user.role && (
                        <div className="mt-1">
                          <span className={`role-badge inline-block px-2 py-0.5 rounded-full text-xs ${
                            user.role === 'admin' || user.isAdmin ? 'bg-red-100 text-red-800' : 
                            user.role === 'staff' ? 'bg-blue-100 text-blue-800' : 
                            user.role === 'police-officer' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              } catch (error) {
                console.error("Error rendering user:", user, error);
                return null;
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList; 