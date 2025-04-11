import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiPaperclip, FiX, FiFile, FiImage, FiSmile } from 'react-icons/fi';

const MessageInput = ({ onSendMessage, disabled, isAdmin = false, isFullscreen = false }) => {
  const [message, setMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    // Clean up file preview URLs when component unmounts
    return () => {
      if (filePreview && typeof filePreview === 'string' && filePreview.startsWith('blob:')) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

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

  const handleFileChange = (e) => {
    console.log("File input change event triggered", e.target.files);
    const file = e.target.files[0];
    if (!file) {
      console.log("No file selected");
      return;
    }
    
    console.log("File selected:", file.name, file.type, file.size);
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Please select a file smaller than 5MB.');
      e.target.value = '';
      return;
    }
    
    // Set the selected file
    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      try {
        const objectUrl = URL.createObjectURL(file);
        console.log("Created preview URL:", objectUrl);
        setFilePreview(objectUrl);
      } catch (err) {
        console.error("Error creating preview:", err);
        setFilePreview(null);
      }
    } else {
      setFilePreview(null);
    }
    
    // Focus on the text input after selecting a file
    setTimeout(() => textareaRef.current?.focus(), 100);
  };
  
  const handleFileButtonClick = (e) => {
    e.preventDefault(); // Prevent default button behavior
    console.log("File button clicked, triggering file input click");
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error("File input reference is not available");
    }
  };
  
  const clearSelectedFile = () => {
    console.log("Clearing selected file");
    if (filePreview && filePreview.startsWith('blob:')) {
      URL.revokeObjectURL(filePreview);
    }
    
    setSelectedFile(null);
    setFilePreview(null);
    
    // Clear the file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    // Don't send if disabled or no content/attachment
    if (disabled || (!message.trim() && !selectedFile)) {
      console.log("Cannot send: disabled or no content/attachment");
      return;
    }
    
    try {
      console.log("Sending message:", message, selectedFile ? `with attachment: ${selectedFile.name}` : 'without attachment');
      
      // Send message with attachment
      onSendMessage(message, selectedFile);
      
      // Reset state
      setMessage('');
      clearSelectedFile();
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error("Error in handleSend:", error);
    }
  };

  return (
    <div className={`input-section relative ${isFullscreen ? 'px-4' : ''}`}>
      {/* File attachment preview */}
      {selectedFile && (
        <div className="attachment-preview mb-2 bg-gray-50 p-2 rounded-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {filePreview ? (
                <div className="image-attachment mr-2 relative">
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    className="w-12 h-12 object-cover rounded-md"
                  />
                </div>
              ) : (
                <div className="file-attachment mr-2 w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                  <FiFile size={24} className="text-gray-500" />
                </div>
              )}
              
              <div>
                <div className="text-sm font-medium truncate max-w-[200px]">
                  {selectedFile.name}
                </div>
                <div className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
            
            <button
              onClick={clearSelectedFile}
              className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
              type="button"
              aria-label="Remove attachment"
            >
              <FiX size={16} />
            </button>
          </div>
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
          
          {/* Attachment button */}
          <button
            onClick={handleFileButtonClick}
            className={`p-2 rounded-full hover:bg-gray-100 text-gray-500 ${isFullscreen ? 'text-lg' : ''}`}
            type="button"
            aria-label="Attach file"
            disabled={disabled}
          >
            <FiPaperclip size={isFullscreen ? 22 : 20} />
          </button>
        </div>
        
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={selectedFile ? "Add a caption (optional)..." : isAdmin ? "Message from administrator..." : "Type a message..."}
          className={`flex-1 resize-none border focus:ring-1 outline-none px-4 py-2 max-h-32 rounded-full ${
            isFullscreen ? 'text-base py-3' : ''
          } ${
            isAdmin 
              ? 'border-red-200 bg-red-50 text-gray-800 focus:ring-red-500 placeholder-red-300'
              : 'border-gray-200 bg-white text-gray-900 focus:ring-blue-500'
          }`}
          style={{ color: '#000000' }}
          disabled={disabled}
          rows={1}
        />
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.csv"
          disabled={disabled}
        />
        
        <button
          onClick={handleSend}
          className={`p-2 ml-2 rounded-full ${
            isFullscreen ? 'p-3' : ''
          } ${
            (!message.trim() && !selectedFile) || disabled 
              ? 'bg-gray-300 text-gray-500' 
              : isAdmin
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          disabled={(!message.trim() && !selectedFile) || disabled}
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