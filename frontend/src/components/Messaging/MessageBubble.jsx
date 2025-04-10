import React from 'react';
import {
  FiStar,
  FiCheck,
  FiClock,
  FiAlertCircle
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const MessageBubble = ({
  message,
  isCurrentUser,
  onStarMessage,
  isStarred = false,
  status = 'sent',
  time,
  role = ''
}) => {
  // No attachment handling - text-only messages
  
  // Function to render message status icon
  const renderStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <FiClock className="text-gray-400" size={12} />;
      case 'sent':
        return <FiCheck className="text-blue-400" size={12} />;
      case 'delivered':
        return <div className="flex"><FiCheck className="text-green-400" size={12} /><FiCheck className="text-green-400 -ml-1" size={12} /></div>;
      case 'read':
        return <div className="flex"><FiCheck className="text-green-600" size={12} /><FiCheck className="text-green-600 -ml-1" size={12} /></div>;
      case 'failed':
        return <FiAlertCircle className="text-red-500" size={12} />;
      default:
        return null;
    }
  };

  // Determine classes for message bubble
  const bubbleClasses = `
    message-bubble group relative py-2 px-3 rounded-lg max-w-[85%] break-words
    ${isCurrentUser ? 'sent ml-auto bg-indigo-600 text-white rounded-br-none' : 'received mr-auto bg-white text-gray-800 rounded-bl-none border border-gray-200'}
    ${role === 'admin' ? 'admin bg-red-50 text-red-800 border border-red-200' : ''}
    ${status === 'failed' ? 'opacity-70' : ''}
  `;

  return (
    <div className={`message-container ${isCurrentUser ? 'flex justify-end' : 'flex justify-start'} mb-3`}>
      <div className={bubbleClasses}>
        {/* Message text */}
        <div className="mb-1">{message.content}</div>
        
        {/* Message metadata */}
        <div className="flex items-center justify-end space-x-1 text-xs opacity-80">
          <span>{time || new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span>{renderStatusIcon()}</span>
        </div>
        
        {/* Star option - only shown on hover and for your own messages */}
        {isCurrentUser && onStarMessage && (
          <button 
            onClick={() => onStarMessage(message._id)}
            className={`
              absolute top-1 left-0 transform -translate-x-[calc(100%+4px)]
              p-1 rounded-full text-gray-400 hover:text-yellow-500
              ${isStarred ? 'text-yellow-400' : 'opacity-0 group-hover:opacity-100'}
              transition-opacity
            `}
            aria-label={isStarred ? "Unstar message" : "Star message"}
          >
            <FiStar size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageBubble; 