import React, { useState, useRef, useEffect } from 'react';
import { 
  FiArrowLeft, 
  FiPhone, 
  FiVideo, 
  FiMoreVertical, 
  FiSend, 
  FiPaperclip,
  FiImage,
  FiFile,
  FiDownload,
  FiStar,
  FiMic,
  FiMicOff,
  FiVideoOff,
  FiX,
  FiVolume2,
  FiVolumeX,
  FiMessageSquare
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const MessageChat = ({
  selectedUser,
  messages,
  currentUserId,
  isTyping,
  userStatus,
  isMobile,
  onBackClick,
  onPhoneClick,
  onVideoClick,
  onMenuClick,
  onSendMessage,
  isLoading,
  onStarMessage,
  starredMessages,
  isAdmin = false,
  containerWidth = 800 // Default width if not provided
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [ringSound, setRingSound] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callTimer, setCallTimer] = useState(null);
  const [audioNodes, setAudioNodes] = useState(null);
  
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callAudioRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Initialize ring sound
  useEffect(() => {
    // Create audio element for call sounds
    const audio = new Audio('/message-notification.mp3'); // Replace with actual ring sound
    audio.loop = true;
    setRingSound(audio);
    
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);
  
  // Handle call timer
  useEffect(() => {
    if (isCallActive && !callTimer) {
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      setCallTimer(timer);
    } else if (!isCallActive && callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
      setCallDuration(0);
    }
    
    return () => {
      if (callTimer) {
        clearInterval(callTimer);
      }
    };
  }, [isCallActive, callTimer]);
  
  // Format call duration
  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Update handleFileChange to properly handle files and create previews
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log("File selected:", file.name, file.type, file.size);
    
    setSelectedFile(file);
    
    // Process image files for preview
    if (file.type.startsWith('image/')) {
      setFileType('image');
      
      try {
        // Create a blob URL for immediate preview
        const objectUrl = URL.createObjectURL(file);
        console.log("Created preview URL:", objectUrl);
        setFilePreview(objectUrl);
        
        // Store cleanup function to prevent memory leaks
        return () => {
          URL.revokeObjectURL(objectUrl);
          console.log("Revoked preview URL");
        };
      } catch (err) {
        console.error("Error creating preview:", err);
        setFilePreview(null);
      }
    } else {
      // For non-image files
      setFileType('document');
      setFilePreview(null);
    }
  };
  
  // Handle message submission with enhanced file handling
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Don't send empty message unless there's an explicitly selected file
    if ((!newMessage || !newMessage.trim()) && !selectedFile) return;
    
    try {
      // Only proceed with file if it was explicitly selected
      if (selectedFile) {
        console.log("Sending file attachment:", {
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
          preview: filePreview ? "Available" : "None"
        });
        
        // Only send the file without the text message if it's empty
        if (!newMessage || !newMessage.trim()) {
          onSendMessage("", selectedFile);
        } else {
          // Send the message with file
          onSendMessage(newMessage, selectedFile);
        }
      } else {
        // Send text message only with null file parameter to ensure no file is attached
        onSendMessage(newMessage, null);
      }
      
      // Reset the form
      setNewMessage('');
      setSelectedFile(null);
      setFilePreview('');
      
      // Clear file input by resetting its value
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };
  
  // Clear the selected file
  const clearSelectedFile = () => {
    if (filePreview && filePreview.startsWith('blob:')) {
      // Clean up blob URL to prevent memory leaks
      URL.revokeObjectURL(filePreview);
    }
    
    setSelectedFile(null);
    setFilePreview('');
    setFileType(null); // Also clear file type state
    
    // Also clear the file input element
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Function to scroll to the bottom of the message list
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Get the name of the selected user
  const getUserName = () => {
    if (!selectedUser) return 'User';
    return selectedUser.name || selectedUser.username || 'User';
  };
  
  // Show user profile/details
  const showUserDetails = () => {
    // This would typically open a modal or slide-in panel
    toast.success(`View ${getUserName()}'s profile`);
    // You would implement a proper profile view here
  };
  
  // Add a function to show user profile when clicking on user name/avatar
  const handleUserProfileClick = (e) => {
    e.stopPropagation();
    showUserDetails();
  };
  
  // Format timestamp for display
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };
  
  // Format date for the message groups
  const formatDate = (dateString) => {
    try {
      const messageDate = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Check if the message is from today
      if (messageDate.toDateString() === today.toDateString()) {
        return 'Today';
      }
      
      // Check if the message is from yesterday
      if (messageDate.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      
      // Otherwise return the formatted date
      return messageDate.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // Check if the message is from the current user
  const isCurrentUserMessage = (message) => {
    const senderId = typeof message.senderId === 'object' ? message.senderId?._id : message.senderId;
    return senderId === currentUserId;
  };
  
  // Status dot for message status
  const MessageStatus = ({ status }) => {
    let color;
    switch (status) {
      case 'sending':
        color = 'bg-gray-400';
        break;
      case 'sent':
        color = 'bg-blue-400';
        break;
      case 'delivered':
        color = 'bg-green-400';
        break;
      case 'read':
        color = 'bg-green-600';
        break;
      case 'failed':
        color = 'bg-red-500';
        break;
      default:
        color = 'bg-gray-400';
    }
    
    return (
      <span className={`${color} rounded-full w-2 h-2 inline-block ml-1`}></span>
    );
  };
  
  // Handle phone call button
  const handlePhoneCallClick = () => {
    initiateCall(false);
    // Also call the parent handler if provided
    if (onPhoneClick) onPhoneClick();
  };
  
  // Handle video call button
  const handleVideoCallClick = () => {
    initiateCall(true);
    // Also call the parent handler if provided
    if (onVideoClick) onVideoClick();
  };
  
  // Create a more realistic call function with simulated video and audio
  const initiateCall = (isVideo) => {
    if (isCallActive) {
      toast.error('A call is already in progress');
      return;
    }
    
    // Play ringing sound for 5 seconds
    if (ringSound) {
      ringSound.currentTime = 0;
      ringSound.play().catch(e => console.error('Error playing ring sound:', e));
    }
    
    // Set call state
    setIsCallActive(true);
    setIsVideoCall(isVideo);
    
    // Simulate connection delay (2-4 seconds)
    const connectionDelay = 2000 + Math.random() * 2000;
    
    toast.loading(`${isVideo ? 'Video' : 'Voice'} call to ${getUserName()}...`, { 
      id: 'callToast',
      duration: connectionDelay
    });
    
    // Create fake video streams and audio for demo
    setTimeout(() => {
      toast.success(`Connected to ${getUserName()}`, { id: 'callToast' });
      
      // Create local video stream using canvas
      if (localVideoRef.current) {
        const localCanvas = document.createElement('canvas');
        localCanvas.width = 640;
        localCanvas.height = 480;
        const localCtx = localCanvas.getContext('2d');
        
        // Create video stream from canvas
        const localStream = localCanvas.captureStream(30); // 30 FPS
        localVideoRef.current.srcObject = localStream;
        
        // Draw something on the canvas to simulate video
        const drawLocalVideo = () => {
          if (!isCallActive) return; // Stop drawing if call ended
          
          // Gradient background
          const gradient = localCtx.createLinearGradient(0, 0, 640, 480);
          gradient.addColorStop(0, '#4f46e5');
          gradient.addColorStop(1, '#8b5cf6');
          localCtx.fillStyle = gradient;
          localCtx.fillRect(0, 0, 640, 480);
          
          // Draw time
          localCtx.fillStyle = 'white';
          localCtx.font = '24px Arial';
          localCtx.textAlign = 'center';
          
          // Get current user's name
          const myName = currentUserId || 'You';
          const callTime = formatCallDuration(callDuration);
          
          localCtx.fillText(callTime, 320, 240);
          localCtx.font = '18px Arial';
          localCtx.fillText(myName, 320, 280);
          
          // Draw a camera-like shape in the center
          if (isVideoCall && !isVideoEnabled) {
            // Draw camera off indicator
            localCtx.beginPath();
            localCtx.arc(320, 180, 40, 0, Math.PI * 2);
            localCtx.fillStyle = 'rgba(255,255,255,0.2)';
            localCtx.fill();
            localCtx.fillStyle = 'rgba(255,255,255,0.8)';
            localCtx.fillText('Camera Off', 320, 185);
          }
          
          requestAnimationFrame(drawLocalVideo);
        };
        
        drawLocalVideo();
      }
      
      // Create remote video stream using canvas
      if (remoteVideoRef.current) {
        const remoteCanvas = document.createElement('canvas');
        remoteCanvas.width = 640;
        remoteCanvas.height = 480;
        const remoteCtx = remoteCanvas.getContext('2d');
        
        // Create video stream from canvas
        const remoteStream = remoteCanvas.captureStream(30); // 30 FPS
        remoteVideoRef.current.srcObject = remoteStream;
        
        // Draw something on the canvas to simulate remote video
        const drawRemoteVideo = () => {
          if (!isCallActive) return; // Stop drawing if call ended
          
          // Gradient background
          const gradient = remoteCtx.createLinearGradient(0, 0, 640, 480);
          gradient.addColorStop(0, '#0ea5e9');
          gradient.addColorStop(1, '#3b82f6');
          remoteCtx.fillStyle = gradient;
          remoteCtx.fillRect(0, 0, 640, 480);
          
          // Draw contact name
          remoteCtx.fillStyle = 'white';
          remoteCtx.font = '24px Arial';
          remoteCtx.textAlign = 'center';
          remoteCtx.fillText(getUserName(), 320, 220);
          
          // Draw a ripple effect to simulate voice activity
          if (!isVideoCall || !isVideoEnabled) {
            const time = Date.now() / 1000;
            const size = 50 + Math.sin(time * 2) * 10;
            
            remoteCtx.beginPath();
            remoteCtx.arc(320, 180, size, 0, Math.PI * 2);
            remoteCtx.fillStyle = 'rgba(255,255,255,0.2)';
            remoteCtx.fill();
            
            remoteCtx.beginPath();
            remoteCtx.arc(320, 180, size * 0.7, 0, Math.PI * 2);
            remoteCtx.fillStyle = 'rgba(255,255,255,0.3)';
            remoteCtx.fill();
            
            // Draw user initial
            remoteCtx.fillStyle = 'white';
            remoteCtx.font = '60px Arial';
            remoteCtx.fillText(getUserName().charAt(0).toUpperCase(), 320, 195);
          }
          
          requestAnimationFrame(drawRemoteVideo);
        };
        
        drawRemoteVideo();
      }
      
      // Create audio for voice calls
      if (!isVideo || isVideo && !isMuted) {
        try {
          // Create audio context
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          const audioCtx = new AudioContext();
          
          // Create oscillator for "voice" simulation
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          // Configure the oscillator
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 note
          
          // Configure the gain (volume)
          gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime); // Very low volume
          
          // Connect the nodes
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          // Start the oscillator
          oscillator.start();
          
          // Modulate the frequency slightly to simulate speech
          const modulateVoice = () => {
            if (!isCallActive) return;
            
            // Random frequency modulation to simulate voice
            const randomFreq = 380 + Math.random() * 120;
            oscillator.frequency.setValueAtTime(randomFreq, audioCtx.currentTime);
            
            // Random volume modulation
            const randomVol = 0.01 + Math.random() * 0.02;
            gainNode.gain.setValueAtTime(randomVol, audioCtx.currentTime);
            
            // Schedule next modulation
            setTimeout(modulateVoice, 300 + Math.random() * 200);
          };
          
          modulateVoice();
          
          // Save audio nodes for cleanup
          setAudioNodes({
            context: audioCtx,
            oscillator,
            gainNode
          });
        } catch (err) {
          console.error('Error creating audio:', err);
        }
      }
      
      // Stop ringing sound
      if (ringSound) {
        ringSound.pause();
      }
    }, connectionDelay);
  };
  
  // Properly end the call with cleanup
  const endCurrentCall = () => {
    setIsCallActive(false);
    setIsVideoCall(false);
    setCallDuration(0);
    
    // Stop any sounds
    if (ringSound) {
      ringSound.pause();
    }
    
    // Stop audio oscillator
    if (audioNodes) {
      try {
        if (audioNodes.oscillator) {
          audioNodes.oscillator.stop();
        }
        if (audioNodes.context && audioNodes.context.state !== 'closed') {
          audioNodes.context.close();
        }
      } catch (e) {
        console.error('Error cleaning up audio:', e);
      }
      setAudioNodes(null);
    }
    
    // Clear video streams
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      const tracks = remoteVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
    
    toast.success(`Call ended`, { duration: 3000 });
    
    // Notify the parent component that the call ended
    if (onCallEnd) {
      onCallEnd();
    }
  };
  
  // Toggle mute during call
  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    // In a real implementation, you would mute the audio track
    if (audioNodes) {
      try {
        // Toggle the gain value between 0 (muted) and 0.1 (unmuted)
        audioNodes.gainNode.gain.value = isMuted ? 0.1 : 0;
      } catch (err) {
        console.error('Error toggling mute:', err);
      }
    }
    
    toast.success(isMuted ? 'Microphone unmuted' : 'Microphone muted');
  };
  
  // Toggle video during call
  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    
    // In a real implementation, you would enable/disable the video track
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      try {
        // Toggle visibility instead of actually stopping tracks for the demo
        localVideoRef.current.style.display = isVideoEnabled ? 'none' : 'block';
      } catch (err) {
        console.error('Error toggling video:', err);
      }
    }
    
    toast.success(isVideoEnabled ? 'Camera turned off' : 'Camera turned on');
  };
  
  // Render messages with proper grouping and formatting
  const renderMessages = () => {
    if (isLoading) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      );
    }
    
    if (!messages || messages.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <FiMessageSquare size={36} className="mx-auto mb-2" />
            <p>No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        </div>
      );
    }
    
    // Group messages by date for better visual separation
    const groupedMessages = messages.reduce((groups, message) => {
      const date = new Date(message.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {});
    
    return Object.entries(groupedMessages).map(([date, dateMessages]) => (
      <div key={date} className="message-date-group mb-4">
        <div className="date-separator">
          <span className="date-label">{formatDate(date)}</span>
        </div>
        
        {dateMessages.map((message) => {
          const isSentByCurrentUser = isCurrentUserMessage(message);
          const messageRole = message.role || (
            message.senderId === 'system-admin' || 
            (typeof message.senderId === 'object' && message.senderId?.role === 'admin') ? 
            'admin' : ''
          );
          
          return (
            <MessageBubble
              key={message._id}
              message={message}
              isCurrentUser={isSentByCurrentUser}
              time={formatTime(message.createdAt)}
              status={message.status || 'sent'}
              onStarMessage={() => onStarMessage && onStarMessage(message._id)}
              isStarred={starredMessages?.includes(message._id)}
              role={messageRole}
            />
          );
        })}
      </div>
    ));
  };
  
  // Render video call overlay
  const renderCallOverlay = () => {
    if (!isCallActive) return null;
    
    return (
      <div className="absolute inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-between z-50 p-5">
        {/* Call header */}
        <div className="w-full flex items-center justify-between mb-6 bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center mr-3 overflow-hidden">
              {selectedUser?.photo ? (
                <img src={selectedUser.photo} alt={getUserName()} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl text-white font-bold">{getUserName().charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="text-white font-medium text-lg">{getUserName()}</h3>
              <p className="text-gray-300 text-sm">
                {callDuration < 3 ? 'Connecting...' : 
                `${isVideoCall ? 'Video' : 'Voice'} call • ${formatCallDuration(callDuration)}`}
              </p>
            </div>
          </div>
          <button
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white"
            onClick={endCurrentCall}
          >
            <FiX size={24} />
          </button>
        </div>
        
        {/* Video content area */}
        <div className="flex-1 w-full max-w-4xl relative mb-8">
          {isVideoCall ? (
            <>
              {/* Remote video */}
              <div className="w-full h-[60vh] bg-gray-800 rounded-xl overflow-hidden relative">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Fallback if video isn't connected yet */}
                {callDuration < 3 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <span className="text-3xl text-white font-bold">{getUserName().charAt(0).toUpperCase()}</span>
                      </div>
                      <p className="text-white font-medium">Connecting video...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Local video (picture-in-picture) */}
              <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-blue-400 shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay when video is disabled */}
                {!isVideoEnabled && (
                  <div className="absolute inset-0 bg-gray-800 bg-opacity-90 flex items-center justify-center">
                    <FiVideoOff size={30} className="text-white" />
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Audio call UI */
            <div className="flex flex-col items-center justify-center h-96">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                {selectedUser?.photo ? (
                  <img src={selectedUser.photo} alt={getUserName()} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-4xl text-white font-bold">{getUserName().charAt(0).toUpperCase()}</span>
                )}
              </div>
              <h2 className="text-white text-2xl font-bold mb-2">{getUserName()}</h2>
              <p className="text-gray-300 text-lg mb-4">
                {callDuration < 3 ? 'Calling...' : formatCallDuration(callDuration)}
              </p>
              <p className="text-gray-400">
                {isMuted ? 'Microphone muted' : 'Microphone active'}
              </p>
              
              {/* Audio visualization (fake) */}
              <div className="mt-6 flex items-center justify-center space-x-1">
                {[...Array(10)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-1 bg-blue-400 rounded-full" 
                    style={{
                      height: `${Math.random() * 25 + 5}px`,
                      opacity: isMuted ? 0.2 : 0.7,
                      animationDuration: `${(i % 3) + 1}s`,
                      animationName: 'pulse',
                      animationIterationCount: 'infinite'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Call controls */}
        <div className="w-full max-w-md mx-auto flex items-center justify-center space-x-6 mb-4">
          <button
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
            onClick={toggleMute}
          >
            {isMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
          </button>
          
          {isVideoCall && (
            <button
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                !isVideoEnabled ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <FiVideo size={24} /> : <FiVideoOff size={24} />}
            </button>
          )}
          
          <button
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
            onClick={endCurrentCall}
          >
            <FiPhone size={24} className="transform rotate-135" />
          </button>
          
          <button
            className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center transition-colors"
            onClick={() => {
              // Toggle speaker (in a real app)
              toast.success("Speaker toggled");
            }}
          >
            <FiVolume2 size={24} />
          </button>
        </div>
      </div>
    );
  };
  
  // Update the section that renders file attachment UI
  const renderFileAttachment = () => {
    if (!selectedFile) return null;
    
    return (
      <div className="selected-file-preview p-2 bg-gray-100 rounded-md mb-2 flex items-center justify-between">
        <div className="flex items-center">
          {fileType === 'image' && filePreview ? (
            <div className="w-12 h-12 mr-3 bg-white rounded overflow-hidden">
              <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 mr-3 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-600">
              <FiFile size={20} />
            </div>
          )}
          <div>
            <div className="text-sm font-medium truncate" style={{ maxWidth: '180px' }}>
              {selectedFile.name}
            </div>
            <div className="text-xs text-gray-500">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>
        <button
          onClick={clearSelectedFile}
          className="p-1 rounded-full hover:bg-gray-200"
          title="Remove file"
        >
          <FiX size={18} />
        </button>
      </div>
    );
  };
  
  // Update the function to get initials from both first and last names
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
  
  // Update the renderUserAvatar function with the new getInitials function
  const renderUserAvatar = (user) => {
    if (!user) return null;
    
    const displayName = user.name || user.username || 'User';
    const initials = getInitials(user);
    
    // Generate a color based on user ID
    const generateColor = (userId) => {
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
      
      try {
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
        return colors[0];
      }
    };
    
    const avatarColor = generateColor(user._id);
    
    return (
      <div className="chat-header-avatar mr-2 relative">
        {user.photo ? (
          <img 
            src={user.photo} 
            alt={displayName}
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
            onError={(e) => {
              // If image fails to load, fall back to initial
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.parentNode.style.backgroundColor = avatarColor.bg;
              e.target.parentNode.innerHTML += `<span class="text-lg font-semibold" style="color: ${avatarColor.text};">${initials}</span>`;
            }}
          />
        ) : (
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: avatarColor.bg,
              color: avatarColor.text
            }}
          >
            <span className="text-lg font-semibold">{initials}</span>
          </div>
        )}
        {user.isOnline && (
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full relative">
      {/* Message list with back button for mobile */}
      <div className="flex-1 overflow-y-auto message-list bg-gray-50">
        {/* Back button for mobile */}
        {(isMobile || containerWidth < 768) && (
          <div className="sticky top-0 z-10 p-2 bg-white border-b shadow-sm flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={onBackClick}
                className="p-2 rounded-full hover:bg-gray-100 mr-1"
              >
                <FiArrowLeft size={20} className="text-gray-700" />
              </button>
              <div className="flex items-center">
                {renderUserAvatar(selectedUser)}
                <div>
                  <div className="font-medium leading-tight">
                    {selectedUser?.name || selectedUser?.username || 'User'}
                  </div>
                  <div className="text-xs text-gray-500 leading-tight">
                    {userStatus || 'Offline'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={onPhoneClick}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <FiPhone size={20} className="text-gray-700" />
              </button>
              <button
                onClick={onVideoClick}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <FiVideo size={20} className="text-gray-700" />
              </button>
              <button
                onClick={onMenuClick}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <FiMoreVertical size={20} className="text-gray-700" />
              </button>
            </div>
          </div>
        )}
        
        <div className="p-4">
          {renderMessages()}
        </div>
      </div>
      
      {/* File preview */}
      {selectedFile && (
        <div className="p-3 bg-gray-100 border-t border-gray-200">
          {renderFileAttachment()}
        </div>
      )}
      
      {/* Message input */}
      <form onSubmit={handleSubmit} className="input-section border-t">
        {/* File preview */}
        {renderFileAttachment()}
        
        <div className="flex items-end p-3">
          {/* File attachment button */}
          <div className="relative mr-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              title="Attach file"
            />
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              title="Attach file"
            >
              <FiPaperclip size={20} />
            </button>
          </div>
          
          {/* Text input */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            style={{ color: '#1e293b', backgroundColor: 'white' }}
          />
          
          {/* Send button */}
          <button
            type="submit"
            disabled={!newMessage && !selectedFile}
            className={`ml-2 p-2 rounded-full ${
              !newMessage && !selectedFile
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <FiSend size={20} />
          </button>
        </div>
      </form>
      
      {/* Call overlay */}
      {isCallActive && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-between z-50 p-5">
          {/* Call header */}
          <div className="w-full flex items-center justify-between mb-6 bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center mr-3 overflow-hidden">
                {selectedUser?.photo ? (
                  <img src={selectedUser.photo} alt={getUserName()} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl text-white font-bold">{getUserName().charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h3 className="text-white font-medium text-lg">{getUserName()}</h3>
                <p className="text-gray-300 text-sm">
                  {callDuration < 3 ? 'Connecting...' : 
                  `${isVideoCall ? 'Video' : 'Voice'} call • ${formatCallDuration(callDuration)}`}
                </p>
              </div>
            </div>
            <button
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white"
              onClick={endCurrentCall}
            >
              <FiX size={24} />
            </button>
          </div>
          
          {/* Video content area */}
          <div className="flex-1 w-full max-w-4xl relative mb-8">
            {isVideoCall ? (
              <>
                {/* Remote video */}
                <div className="w-full h-[60vh] bg-gray-800 rounded-xl overflow-hidden relative">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Fallback if video isn't connected yet */}
                  {callDuration < 3 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                          <span className="text-3xl text-white font-bold">{getUserName().charAt(0).toUpperCase()}</span>
                        </div>
                        <p className="text-white font-medium">Connecting video...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Local video (picture-in-picture) */}
                <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-blue-400 shadow-lg">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay when video is disabled */}
                  {!isVideoEnabled && (
                    <div className="absolute inset-0 bg-gray-800 bg-opacity-90 flex items-center justify-center">
                      <FiVideoOff size={30} className="text-white" />
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Audio call UI */
              <div className="flex flex-col items-center justify-center h-96">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  {selectedUser?.photo ? (
                    <img src={selectedUser.photo} alt={getUserName()} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-4xl text-white font-bold">{getUserName().charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <h2 className="text-white text-2xl font-bold mb-2">{getUserName()}</h2>
                <p className="text-gray-300 text-lg mb-4">
                  {callDuration < 3 ? 'Calling...' : formatCallDuration(callDuration)}
                </p>
                <p className="text-gray-400">
                  {isMuted ? 'Microphone muted' : 'Microphone active'}
                </p>
                
                {/* Audio visualization (fake) */}
                <div className="mt-6 flex items-center justify-center space-x-1">
                  {[...Array(10)].map((_, i) => (
                    <div 
                      key={i}
                      className="w-1 bg-blue-400 rounded-full" 
                      style={{
                        height: `${Math.random() * 25 + 5}px`,
                        opacity: isMuted ? 0.2 : 0.7,
                        animationDuration: `${(i % 3) + 1}s`,
                        animationName: 'pulse',
                        animationIterationCount: 'infinite'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Call controls */}
          <div className="w-full max-w-md mx-auto flex items-center justify-center space-x-6 mb-4">
            <button
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
              onClick={toggleMute}
            >
              {isMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
            </button>
            
            {isVideoCall && (
              <button
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  !isVideoEnabled ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
                onClick={toggleVideo}
              >
                {isVideoEnabled ? <FiVideo size={24} /> : <FiVideoOff size={24} />}
              </button>
            )}
            
            <button
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
              onClick={endCurrentCall}
            >
              <FiPhone size={24} className="transform rotate-135" />
            </button>
            
            <button
              className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center transition-colors"
              onClick={() => {
                // Toggle speaker (in a real app)
                toast.success("Speaker toggled");
              }}
            >
              <FiVolume2 size={24} />
            </button>
          </div>
        </div>
      )}
      
      <audio ref={callAudioRef} />
    </div>
  );
};

export default MessageChat; 