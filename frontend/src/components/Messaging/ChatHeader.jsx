import React from 'react';
import { FiArrowLeft, FiMoreVertical, FiPhone, FiVideo, FiUsers, FiShield } from 'react-icons/fi';

const ChatHeader = ({ 
  user, 
  isMobile, 
  onBackClick, 
  onPhoneClick, 
  onVideoClick, 
  onMenuClick, 
  isTyping, 
  userStatus,
  isAdmin = false,
  isFullscreen = false
}) => {
  // Randomly determine if user is online (for demonstration)
  const isOnline = user?._id % 2 === 0 || userStatus === 'online';
  const isGroup = user?.isGroup;
  
  return (
    <div className={`chat-header flex items-center justify-between p-3 border-b bg-white shadow-sm ${isFullscreen ? 'px-6' : ''}`}>
      <div className="flex items-center">
        {isMobile && (
          <button 
            onClick={onBackClick}
            className="p-2 mr-2 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <FiArrowLeft size={20} />
          </button>
        )}
        
        <div className="flex items-center">
          <div className={`relative ${isFullscreen ? 'scale-110' : ''}`}>
            <div className={`${isFullscreen ? 'w-12 h-12' : 'w-10 h-10'} rounded-full bg-gray-200 flex items-center justify-center text-gray-600 transition-all duration-200`}>
              {isGroup ? (
                <FiUsers size={isFullscreen ? 24 : 20} className="text-blue-600" />
              ) : isAdmin ? (
                <FiShield size={isFullscreen ? 24 : 20} className="text-red-600" />
              ) : user?.profilePicture ? (
                <img src={user?.profilePicture} alt="User" className={`${isFullscreen ? 'w-12 h-12' : 'w-10 h-10'} rounded-full object-cover`} />
              ) : (
                <span className={`${isFullscreen ? 'text-xl' : 'text-lg'} font-semibold`}>
                  {user ? (user.name || user.username || '?').charAt(0).toUpperCase() : '?'}
                </span>
              )}
            </div>
            
            {!isGroup && isOnline && !isAdmin && (
              <span className={`absolute bottom-0 right-0 ${isFullscreen ? 'w-4 h-4' : 'w-3 h-3'} bg-green-500 border-2 border-white rounded-full`}></span>
            )}
          </div>
          
          <div className="ml-3">
            <h3 className={`font-medium text-gray-900 ${isFullscreen ? 'text-lg' : ''}`}>
              {isGroup ? user?.name : (user?.name || user?.username || 'Unknown User')}
              {isGroup && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Group</span>}
              {isAdmin && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Admin</span>}
            </h3>
            
            <p className="text-xs text-gray-500">
              {isGroup 
                ? `${user?.members?.length || 0} members` 
                : isAdmin
                  ? 'System Administrator'
                  : (isTyping 
                    ? 'typing...' 
                    : (isOnline ? 'online' : 'offline'))}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center">
        {!isGroup && !isAdmin && (
          <>
            <button 
              onClick={onPhoneClick}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <FiPhone size={isFullscreen ? 20 : 18} />
            </button>
            
            <button 
              onClick={onVideoClick}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <FiVideo size={isFullscreen ? 20 : 18} />
            </button>
          </>
        )}
        
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
        >
          <FiMoreVertical size={isFullscreen ? 20 : 18} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader; 