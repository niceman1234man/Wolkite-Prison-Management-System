import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiPaperclip, FiX, FiFile, FiImage, FiSmile } from 'react-icons/fi';

const MessageInput = ({ onSendMessage, disabled, isAdmin = false, isFullscreen = false }) => {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Common emojis
  const emojis = ['😊', '😂', '❤️', '👍', '🙏', '🎉', '🔥', '👋', '😎', '🤔', '👏', '😢', '🥰', '😍', '🤣', '😁', '😘', '🤗', '🤩', '😇'];

  useEffect(() => {
    // Make sure we can see what we're typing
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [message]);

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size exceeds 5MB limit');
        return;
      }
      
      setAttachment({
        file,
        type: file.type,
        name: file.name,
        size: file.size,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      });
    }
    // Clear the input value so the same file can be selected again
    e.target.value = '';
  };

  const removeAttachment = () => {
    if (attachment?.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    setAttachment(null);
    
    // Make sure file input is cleared
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojis(false);
    textareaRef.current?.focus();
  };

  const handleSend = () => {
    if ((!message.trim() && !attachment) || disabled) return;
    
    try {
      // Send file attachment only if there's no message text
      if (attachment && !message.trim()) {
        onSendMessage("", attachment.file);
      } 
      // Send message with attachment if both are present
      else if (attachment && message.trim()) {
        onSendMessage(message, attachment.file);
      }
      // Send text message only
      else {
        onSendMessage(message, null);
      }
      
      setMessage('');
      
      // Make sure attachment is properly cleared after sending
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      setAttachment(null);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error("Error in handleSend:", error);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  };

  return (
    <div className={`input-section relative ${isFullscreen ? 'px-4' : ''}`}>
      {attachment && (
        <div className={`attachment-preview ${isFullscreen ? 'mx-auto max-w-xl' : ''}`}>
          {attachment.type.startsWith('image/') ? (
            <div className="relative">
              <img 
                src={attachment.preview} 
                alt="Attachment preview" 
                className="max-h-40 max-w-full rounded-md object-contain" 
              />
              <div className="absolute text-xs text-white bg-black/50 px-2 py-1 rounded-md bottom-2 left-2">
                {attachment.name}
              </div>
            </div>
          ) : (
            <div className="flex items-center p-2 bg-gray-100 rounded-md">
              <FiFile size={24} className="text-blue-500 mr-2" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{attachment.name}</div>
                <div className="text-xs text-gray-500">{formatFileSize(attachment.size)}</div>
              </div>
            </div>
          )}
          <button 
            onClick={removeAttachment}
            className="absolute top-1 right-1 bg-gray-800/50 text-white p-1 rounded-full hover:bg-gray-900/50"
            aria-label="Remove attachment"
          >
            <FiX size={12} />
          </button>
        </div>
      )}
      
      <div className={`flex items-end border-t pt-3 ${isFullscreen ? 'max-w-3xl mx-auto' : ''}`}>
        <div className="flex items-center space-x-2 mr-2">
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            className={`p-2 rounded-full hover:bg-gray-100 text-gray-500 ${isFullscreen ? 'text-lg' : ''}`}
            type="button"
            aria-label="Insert emoji"
          >
            <FiSmile size={isFullscreen ? 22 : 20} />
          </button>
          
          <button
            onClick={handleAttachmentClick}
            className={`p-2 rounded-full hover:bg-gray-100 text-gray-500 ${isFullscreen ? 'text-lg' : ''}`}
            type="button"
            aria-label="Attach file"
            disabled={isAdmin && !message.trim()}
          >
            <FiPaperclip size={isFullscreen ? 22 : 20} />
          </button>
        </div>
        
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isAdmin ? "Message from administrator..." : "Type a message..."}
          className={`flex-1 resize-none border focus:ring-1 outline-none px-4 py-2 max-h-32 rounded-full ${
            isFullscreen ? 'text-base py-3' : ''
          } ${
            isAdmin 
              ? 'border-red-200 bg-red-50 text-gray-800 focus:ring-red-500 placeholder-red-300'
              : 'border-gray-200 bg-white text-gray-900 focus:ring-blue-500'
          }`}
          style={{ color: '#1e293b' }}
          disabled={disabled}
          rows={1}
        />
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf,application/msword,application/vnd.ms-excel,text/plain"
        />
        
        <button
          onClick={handleSend}
          className={`p-2 ml-2 rounded-full ${
            isFullscreen ? 'p-3' : ''
          } ${
            (!message.trim() && !attachment) || disabled 
              ? 'bg-gray-300 text-gray-500' 
              : isAdmin
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          disabled={(!message.trim() && !attachment) || disabled}
          aria-label="Send message"
          type="button"
        >
          <FiSend size={isFullscreen ? 22 : 20} />
        </button>
      </div>
      
      {/* Emoji picker */}
      {showEmojis && (
        <div className={`absolute bottom-14 left-2 bg-white rounded-lg shadow-lg p-3 z-10 border ${isFullscreen ? 'w-72' : ''}`}>
          <div className={`grid ${isFullscreen ? 'grid-cols-6 gap-3' : 'grid-cols-5 gap-2'}`}>
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className={`${isFullscreen ? 'w-12 h-12 text-2xl' : 'w-10 h-10 text-xl'} hover:bg-gray-100 rounded flex items-center justify-center`}
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput; 