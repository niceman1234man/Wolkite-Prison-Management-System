import React, { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
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
  FiMessageSquare,
  FiCamera,
  FiCameraOff,
  FiPhoneOff
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
  disabled = false,
  containerWidth = 800 // Default width if not provided
}) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
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
  
  // Handle file selection
  const handleFileChange = (e) => {
    // First clear any existing file references
    clearSelectedFile();
    
    const file = e.target.files[0];
    if (!file) return;
    
    console.log("File selected in MessageChat:", file.name, file.type, file.size);
    
    // Validate the file has actual content
    if (file.size === 0) {
      alert('Cannot attach an empty file');
      e.target.value = '';
      return;
    }
    
    // Validate file size - max 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select a file smaller than 5MB.");
      e.target.value = '';
      return;
    }
    
    // Store the file directly without wrapping
    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      try {
        const objectUrl = URL.createObjectURL(file);
        setFilePreview(objectUrl);
      } catch (err) {
        console.error("Error creating preview:", err);
        setFilePreview(null);
      }
    }
    
    // Reset the file input
    e.target.value = '';
  };
  
  // Clear the selected file
  const clearSelectedFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    
    setSelectedFile(null);
    setFilePreview(null);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Message submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    console.log("Submitting message:", message);
    
    // Only sending text, no file attachment
    try {
      onSendMessage(message);
      
      // Reset form
      setMessage('');
    } catch (error) {
      console.error("Error in handleSubmit:", error);
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
  
  // Render file attachment preview
  const renderFileAttachment = () => {
    if (!selectedFile) return null;
    
    return (
      <div className="selected-file-preview p-2 bg-gray-100 rounded-md mb-2 flex items-center justify-between">
        <div className="flex items-center">
          {filePreview ? (
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
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-2 overflow-hidden">
                  {selectedUser?.photo ? (
                    <img 
                      src={selectedUser.photo} 
                      alt={selectedUser?.name || 'User'} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-xl text-white font-bold">
                      {(selectedUser?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
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
      
      {/* Message input */}
      <div className="message-input-container border-t">
        {/* File preview */}
        {renderFileAttachment()}
        
        <form onSubmit={handleSubmit} className="message-form p-3 flex items-end">
          {/* File attachment button */}
          <button
            type="button"
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 mr-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <FiPaperclip size={20} />
          </button>
          
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
          
          {/* Text input */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={disabled}
          />
          
          {/* Send button */}
          <button 
            type="submit" 
            className="send-button ml-2 p-2 rounded-full bg-indigo-600 text-white"
            disabled={(!message.trim() && !selectedFile) || disabled}
          >
            <FiSend size={20} />
          </button>
        </form>
      </div>
      
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