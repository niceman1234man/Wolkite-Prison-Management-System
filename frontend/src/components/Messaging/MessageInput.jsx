import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiPaperclip, FiX, FiFile, FiImage, FiSmile } from 'react-icons/fi';

const MessageInput = ({ onSendMessage, disabled, isAdmin = false, isFullscreen = false }) => {
  const [message, setMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  
  // File attachment variables removed for testing
  
  const textareaRef = useRef(null);

  // Common emojis
  const emojis = ['😊', '😂', '❤️', '👍', '🙏', '🎉', '🔥', '👋', '😎', '🤔', '👏', '😢', '🥰', '😍', '🤣', '😁', '😘', '🤗', '🤩', '😇'];

  useEffect(() => {
    // Auto-resize the textarea
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

  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojis(false);
    textareaRef.current?.focus();
  };

  const handleSend = () => {
    // Don't send if disabled or no content
    if (disabled || !message.trim()) return;
    
    try {
      // Send message without attachment
      onSendMessage(message);
      
      // Reset state
      setMessage('');
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error("Error in handleSend:", error);
    }
  };

  return (
    <div className={`input-section relative ${isFullscreen ? 'px-4' : ''}`}>
      {/* File attachment preview removed for testing */}
      
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
          
          {/* Attachment button disabled for testing */}
          <button
            className={`p-2 rounded-full text-gray-300 ${isFullscreen ? 'text-lg' : ''}`}
            type="button"
            aria-label="Attach file (disabled)"
            disabled={true}
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
        
        {/* File input removed for testing */}
        
        <button
          onClick={handleSend}
          className={`p-2 ml-2 rounded-full ${
            isFullscreen ? 'p-3' : ''
          } ${
            !message.trim() || disabled 
              ? 'bg-gray-300 text-gray-500' 
              : isAdmin
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          disabled={!message.trim() || disabled}
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