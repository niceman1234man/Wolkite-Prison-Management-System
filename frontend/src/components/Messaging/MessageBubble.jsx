import React from 'react';
import {
  FiStar,
  FiCheck,
  FiClock,
  FiAlertCircle,
  FiFile,
  FiImage,
  FiDownload
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
  // Get attachment details
  const attachment = message?.file || null;
  const hasAttachment = !!attachment;
  const isImage = hasAttachment && 
    (attachment.includes('.jpg') || 
     attachment.includes('.jpeg') || 
     attachment.includes('.png') || 
     attachment.includes('.gif'));
    
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
  
  // Function to handle file download
  const handleDownload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!attachment) return;
    
    try {
      // Get the file name from the path
      const fileName = attachment.split('/').pop();
      
      // Create full URL for download
      const fileUrl = `${window.location.origin}${attachment}`;
      
      // Open file in new tab or download
      window.open(fileUrl, '_blank');
      
      toast.success('Opening attachment');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
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
        {message.content && <div className="mb-1">{message.content}</div>}
        
        {/* Image attachment */}
        {hasAttachment && isImage && (
          <div className="mt-2 relative">
            <div className="relative" style={{ maxWidth: '250px' }}>
              <img 
                src={`${window.location.origin}${attachment}`}
                alt="Attachment" 
                className="rounded-md w-full max-h-[250px] object-contain bg-gray-100"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik01IDIyaDE0YzEuMTAzIDAgMi0uODk3IDItMnYtMTJsLTUtNWgtMTFjLTEuMTAzIDAtMiAuODk3LTIgMnptMTQtMjBoLTEwLjY1bDUgNWgxMC42NWwtNS01eiIvPjwvc3ZnPg==';
                  e.target.style.padding = '30px';
                }}
              />
              
              {/* Download button for images */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="bg-black bg-opacity-70 text-white p-1 rounded-full hover:bg-opacity-90"
                  onClick={handleDownload}
                  title="View image"
                >
                  <FiDownload size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Other file attachment */}
        {hasAttachment && !isImage && (
          <div className="mt-2">
            <div className={`rounded-md p-2 flex items-center ${isCurrentUser ? 'bg-indigo-700' : 'bg-gray-100'}`}>
              <div className={`p-2 rounded-md mr-2 ${isCurrentUser ? 'bg-indigo-800' : 'bg-white'}`}>
                <FiFile className={isCurrentUser ? "text-white" : "text-indigo-400"} size={20} />
              </div>
              <div className="flex-1 truncate">
                <div className={`text-sm font-medium truncate ${isCurrentUser ? 'text-white' : 'text-gray-800'}`} style={{ maxWidth: '150px' }}>
                  {attachment.split('/').pop()}
                </div>
              </div>
              <button
                className={`ml-2 p-1 rounded-full ${isCurrentUser ? 'bg-indigo-800 text-white' : 'bg-gray-200 text-gray-800'} hover:opacity-80`}
                onClick={handleDownload}
                title="Download file"
              >
                <FiDownload size={16} />
              </button>
            </div>
          </div>
        )}
        
        {/* Message metadata */}
        <div className="flex items-center justify-end space-x-1 text-xs opacity-80 mt-1">
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