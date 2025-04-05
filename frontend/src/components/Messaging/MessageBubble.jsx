import React from 'react';
import {
  FiStar,
  FiFile,
  FiImage,
  FiDownload,
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
  // Get attachment details first, before any functions reference it
  const attachment = message?.attachment || message?.file || {};
  const attachmentUrl = attachment?.url || attachment?.path || attachment?.preview || null;
  const isImage = attachment?.type?.startsWith('image/');
  const fileName = attachment?.fileName || attachment?.originalname || 'file';
  const fileSize = attachment?.size || 0;
  const attachmentExistsOnServer = !!(attachment?.url || attachment?.path);

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
  const handleDownload = (e, url, fileName) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log("Download requested for:", { url, fileName, attachment });
    
    // Try different possible sources for the file
    let fileUrl = url;
    
    try {
      // If we have a blob URL or data URL from preview, use it directly
      if (attachment?.preview && typeof attachment.preview === 'string' && attachment.preview.startsWith('blob:')) {
        fileUrl = attachment.preview;
        console.log("Using preview blob URL:", fileUrl);
      } 
      // If we have a base64 data URL
      else if (attachment?.data && typeof attachment.data === 'string' && attachment.data.startsWith('data:')) {
        fileUrl = attachment.data;
        console.log("Using data URL from attachment data field");
      }
      // If attachment has a url property (from server)
      else if (attachment?.url && typeof attachment.url === 'string') {
        fileUrl = attachment.url.startsWith('http') ? attachment.url : `${window.location.origin}${attachment.url}`;
        console.log("Using URL from attachment.url:", fileUrl);
      }
      // For server paths that need the base URL
      else if (fileUrl && typeof fileUrl === 'string' && fileUrl.startsWith('/')) {
        fileUrl = `${window.location.origin}${fileUrl}`;
        console.log("Constructed full URL from path:", fileUrl);
      }
      // If we have a path property on the attachment
      else if (attachment?.path && typeof attachment.path === 'string') {
        fileUrl = attachment.path.startsWith('http') ? attachment.path : `${window.location.origin}${attachment.path}`;
        console.log("Using attachment path:", fileUrl);
      }
      // For BLOB objects or Files that are directly in the attachment
      else if (attachment instanceof Blob || attachment instanceof File) {
        fileUrl = URL.createObjectURL(attachment);
        console.log("Created blob URL from attachment object");
      }
      // Fall back to blob attachment.file if exists
      else if (attachment?.file && (attachment.file instanceof Blob || attachment.file instanceof File)) {
        fileUrl = URL.createObjectURL(attachment.file);
        console.log("Created blob URL from attachment.file");
      }
      
      // When attachment exists but none of the above methods worked
      if (!fileUrl && attachment) {
        // Last resort - attempt to create a new file if we have necessary information
        if (attachment.type && (attachment.data || attachment.buffer || attachment.binary)) {
          const data = attachment.data || attachment.buffer || attachment.binary;
          if (typeof data === 'string') {
            // Try to create a blob from string data
            const blob = new Blob([data], { type: attachment.type });
            fileUrl = URL.createObjectURL(blob);
            console.log("Created blob URL from attachment string data");
          }
        } else {
          console.error("Unable to extract file data from attachment:", attachment);
        }
      }
      
      if (!fileUrl) {
        toast.error("Unable to generate download URL. File data not available.");
        console.error("Could not find valid file URL or data in:", { url, attachment });
        return;
      }
      
      // Now handle the download based on URL type
      if (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Only revoke blob URLs that we created in this function
        if (fileUrl.startsWith('blob:') && fileUrl !== url && fileUrl !== attachment?.preview) {
          setTimeout(() => URL.revokeObjectURL(fileUrl), 100);
        }
        
        toast.success(`Downloading: ${fileName || 'file'}`);
        return;
      }
      
      // For HTTP URLs, use fetch to ensure proper download
      fetch(fileUrl)
        .then(response => {
          if (!response.ok) throw new Error(`Network response error: ${response.status}`);
          return response.blob();
        })
        .then(blob => {
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName || 'download';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
          toast.success(`Downloading: ${fileName || 'file'}`);
        })
        .catch(err => {
          console.error('Download failed:', err);
          
          // Fallback to opening in new tab if fetch fails
          window.open(fileUrl, '_blank');
          toast.warning(`Opening file in new tab instead: ${fileName || 'file'}`);
        });
        
    } catch (error) {
      console.error('Error during download:', error);
      toast.error(`Download failed: ${error.message}`);
      
      // Last resort fallback
      if (fileUrl) {
        window.open(fileUrl, '_blank');
        toast.warning(`Attempting to open file in browser: ${fileName || 'file'}`);
      }
    }
  };

  // Function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
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
        {message.content && <div>{message.content}</div>}
        
        {/* Attachment preview for images */}
        {attachment && isImage && attachmentUrl && (
          <div className="mt-2 relative">
            <div className="relative" style={{ maxWidth: '250px' }}>
              <img 
                src={attachmentUrl} 
                alt="Attachment" 
                className="rounded-md w-full max-h-[250px] object-contain bg-gray-100"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik01IDIyaDE0YzEuMTAzIDAgMi0uODk3IDItMnYtMTJsLTUtNWgtMTFjLTEuMTAzIDAtMiAuODk3LTIgMnYxNWMwIDEuMTAzLjg5NyAyIDIgMnptMTQtMjBoLTEwLjY1bDUgNWgxMC42NWwtNS01eiIvPjwvc3ZnPg==';
                  e.target.style.padding = '30px';
                }}
              />
              
              {/* Download button for images */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="bg-black bg-opacity-70 text-white p-1 rounded-full hover:bg-opacity-90"
                  onClick={(e) => handleDownload(e, attachmentUrl, fileName)}
                  title="Download image"
                >
                  <FiDownload size={16} />
                </button>
              </div>
            </div>
            <div className="text-xs mt-1 text-gray-500 flex items-center">
              <FiImage className="mr-1" />
              <span className="truncate" style={{ maxWidth: '200px' }}>{fileName}</span>
              <span className="ml-1">({formatFileSize(fileSize)})</span>
            </div>
          </div>
        )}
        
        {/* Attachment for other file types */}
        {attachment && !isImage && (
          <div className="mt-2">
            <div className="bg-gray-100 rounded-md p-2 flex items-center">
              <div className="p-2 bg-white rounded-md mr-2">
                <FiFile className={isCurrentUser ? "text-blue-400" : "text-indigo-400"} size={20} />
              </div>
              <div className="flex-1 truncate">
                <div className="text-sm font-medium truncate" style={{ maxWidth: '150px' }}>{fileName}</div>
                <div className="text-xs text-gray-500">{formatFileSize(fileSize)}</div>
              </div>
              <button
                className="ml-2 p-1 bg-gray-200 rounded-full hover:bg-gray-300"
                onClick={(e) => handleDownload(e, attachmentUrl, fileName)}
                title="Download file"
              >
                <FiDownload size={16} />
              </button>
            </div>
          </div>
        )}
        
        {/* Time and status display */}
        <div className={`text-xs mt-1 flex justify-end items-center gap-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
          <span>{time}</span>
          {isCurrentUser && renderStatusIcon()}
        </div>
        
        {/* Star button */}
        {onStarMessage && (
          <button
            className={`absolute -top-2 -left-2 p-1 rounded-full ${isStarred ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-500'} opacity-0 group-hover:opacity-100 transition-opacity`}
            onClick={() => onStarMessage(message._id)}
            title={isStarred ? "Remove from starred" : "Star message"}
          >
            <FiStar size={12} />
          </button>
        )}
        
        {/* Retry option for failed messages */}
        {status === 'failed' && isCurrentUser && (
          <div className="mt-1 text-right">
            <button 
              className="text-xs text-red-500 hover:underline"
              onClick={() => toast.error("Retry functionality not implemented")}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble; 