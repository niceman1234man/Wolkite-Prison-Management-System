import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';
import { 
  FiMoreVertical, 
  FiMenu, 
  FiUser, 
  FiX, 
  FiSearch, 
  FiArrowLeft, 
  FiCheckCircle, 
  FiCheck, 
  FiMessageSquare,
  FiBell,
  FiStar,
  FiArrowRight,
  FiPlay,
  FiFile,
  FiDownload,
  FiImage,
  FiSend,
  FiPaperclip,
  FiUsers,
  FiSettings,
  FiBellOff,
  FiRefreshCw,
  FiPhone,
  FiVideo,
  FiInfo
} from 'react-icons/fi';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import MessageList from './MessageList';
import MessageChat from './MessageChat';
import '../../../src/styles/messaging.css';

// Constants
const API_ENDPOINTS = {
  USERS: '/user/getAlluser',
  MESSAGES: '/messages',
  UNREAD_COUNT: '/messages/unread/count',
  MARK_READ: '/messages/read',
  SEND_MESSAGE: '/messages/send'
};

// Utility functions
const messageUtils = {
  fetchUsers: async (userId) => {
    try {
      setIsLoading(true);
      
      // Add a default admin user to ensure the list is never empty
      const defaultUsers = [{
        _id: 'system-admin',
        name: 'System Admin',
        role: 'admin',
        isAdmin: true,
        isOnline: true
      }];
      
      // Get the user ID from localStorage
      let userId = null;
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          userId = userData.id || userData._id;
        }
      } catch (err) {
        console.error('Error getting userId from localStorage:', err);
        setUsers(defaultUsers);
        setFilteredUsers(defaultUsers);
        setIsLoading(false);
        return;
      }
      
      if (!userId) {
        console.log('No user ID available for fetching users');
        setUsers(defaultUsers);
        setFilteredUsers(defaultUsers);
        setIsLoading(false);
        return;
      }
      
      try {
        // Use API_ENDPOINTS.USERS from messageUtils
        const response = await axiosInstance.get('/user/getAlluser');
        console.log("User API response:", response.data);
      
      let usersList = [];
        
        // Handle different response formats
      if (Array.isArray(response.data)) {
        usersList = response.data;
      } else if (response.data.users && Array.isArray(response.data.users)) {
        usersList = response.data.users;
      } else if (response.data.user && Array.isArray(response.data.user)) {
        usersList = response.data.user;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        usersList = response.data.data;
      } else {
        console.error('Unexpected response format:', response.data);
        usersList = [];
      }
      
        // Filter out any users with role 'visitor' and the current user
        const filteredUsersList = usersList.filter(user => 
          user && user._id && user._id !== userId
        );
        
        console.log(`Found ${filteredUsersList.length} users after filtering`);
        
        // Always include the default admin
        const combinedUsers = [...defaultUsers];
        
        // Process and add each filtered user
        if (filteredUsersList.length > 0) {
          // Process users to add name and status
          filteredUsersList.forEach(user => {
            // Ensure user has a name field
            if (!user.name && (user.firstName || user.lastName)) {
              user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            }
            
            // Set default online status for demo
            user.isOnline = user.isOnline || Math.random() > 0.5;
            
            combinedUsers.push(user);
          });
        }
        
        // Set users in state
        setUsers(combinedUsers);
        setFilteredUsers(combinedUsers);
    } catch (error) {
        console.error('Error fetching users from API:', error);
        // Use default users as fallback
        setUsers(defaultUsers);
        setFilteredUsers(defaultUsers);
      }
    } catch (error) {
      console.error('Unexpected error in fetchUsers:', error);
      // Set default users as fallback for any error
      const defaultUsers = [{
        _id: 'system-admin',
        name: 'System Admin',
        role: 'admin',
        isAdmin: true,
        isOnline: true
      }];
      setUsers(defaultUsers);
      setFilteredUsers(defaultUsers);
    } finally {
      setIsLoading(false);
    }
  },
  
  fetchUnreadCounts: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.UNREAD_COUNT);
      
      if (response.data && response.data.bySender && typeof response.data.bySender === 'object') {
        return response.data.bySender;
      }
      return {};
    } catch (error) {
      console.error('Error fetching unread counts:', error);
      return {};
    }
  },
  
  fetchMessages: async (userId, currentUserId) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINTS.MESSAGES}/${userId}?currentUserId=${currentUserId}`);
      
      // Check the response structure
      let messagesData = [];
      if (Array.isArray(response.data)) {
        messagesData = response.data;
      } else if (response.data.messages && Array.isArray(response.data.messages)) {
        messagesData = response.data.messages;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        messagesData = response.data.data;
      } else {
        console.error('Unexpected message data format:', response.data);
        messagesData = [];
      }
      
      // Sort messages by creation time
      return messagesData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      return [];
    }
  },
  
  markMessagesAsRead: async (senderId, currentUserId) => {
    try {
      await axiosInstance.put(`${API_ENDPOINTS.MARK_READ}/${senderId}?currentUserId=${currentUserId}`);
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  },
  
  sendMessage: async (content, receiverId, currentUserId, attachment) => {
    if ((!content || !content.trim()) && !attachment) return null;
    
    try {
      // Validate inputs to prevent 400 errors
      if (!receiverId) {
        throw new Error("Receiver ID is required");
      }
      
      // Get user ID directly from Redux store or localStorage as fallback
      let senderId = currentUserId;
      if (!senderId) {
        const userString = localStorage.getItem('user');
        if (userString) {
          try {
            const userData = JSON.parse(userString);
            senderId = userData._id || userData.id;
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
      }
      
      if (!senderId) {
        throw new Error("Sender ID is required");
      }
      
      console.log("Preparing to send message with:", {
        content: content ? content.substring(0, 30) + (content.length > 30 ? '...' : '') : '',
        receiverId,
        senderId: senderId,
        hasAttachment: !!attachment
      });
      
      const formData = new FormData();
      formData.append('content', content || '');
      formData.append('receiverId', receiverId);
      formData.append('senderId', senderId);
      
      if (attachment) {
        // Use 'file' field name to match backend expectation (not 'attachment')
        formData.append('file', attachment);
        console.log("Attaching file:", attachment.name, attachment.type, attachment.size);
      }
      
      // Get token to ensure authorization
      const token = localStorage.getItem('token');
      
      console.log('Sending message with formData:', Array.from(formData.entries()));
      
      // Send via API
      try {
        console.log('Sending via API with formData:', {
          content: formData.get('content'),
          receiverId: formData.get('receiverId'),
          senderId: formData.get('senderId'),
          hasFile: !!formData.get('file')
        });
      
      const response = await axiosInstance.post(API_ENDPOINTS.SEND_MESSAGE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('API message response:', response.data);
        
        if (response.data) {
          // Add the sent message to the conversation
          const apiMessage = {
            ...newMessage,
            _id: response.data._id || response.data.data?._id || `temp-${Date.now()}`,
            createdAt: response.data.createdAt || response.data.data?.createdAt || new Date().toISOString()
          };
          
          setMessages(prev => [...prev, apiMessage]);
          setNewMessage('');
          
          // Scroll to bottom
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
        }
      } catch (apiError) {
        console.error('API send error:', apiError);
        
        // Handle ObjectId casting errors
        if (apiError.response?.data?.error?.includes('Cast to ObjectId failed')) {
          toast.error('Invalid recipient ID format');
          console.error('MongoDB ObjectId casting error with receiverId:', receiverId);
        } else {
          // Generic error fallback
          toast.error(apiError.message || 'Failed to send message via API');
        }
        
        // Still update UI with a temporary message to improve UX
        const tempMessage = {
          ...newMessage,
          _id: `temp-${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: 'failed'
        };
        
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
      }
      
      if (response.data && response.data._id) {
        return { ...response.data, status: 'sent' };
      }
      
      if (response.data && response.data.data && response.data.data._id) {
        return { ...response.data.data, status: 'sent' };
      }
      
      console.error('Message sent but returned unexpected response format:', response.data);
      return null;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
      return null;
    }
  },
  
  checkForNewMessages: async (userId, currentUserId, lastCheckedTime) => {
    try {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.MESSAGES}/${userId}?since=${lastCheckedTime}&currentUserId=${currentUserId}`
      );
      
      let messagesList = [];
      if (Array.isArray(response.data)) {
        messagesList = response.data;
      } else if (response.data.messages && Array.isArray(response.data.messages)) {
        messagesList = response.data.messages;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        messagesList = response.data.data;
      } else {
        console.error('Unexpected message data format:', response.data);
        return [];
      }
      
      // Filter to ensure we only process messages from the current conversation
      return messagesList.filter(message => {
        const messageSenderId = typeof message.senderId === 'object' ? message.senderId?._id : message.senderId;
        const messageReceiverId = typeof message.receiverId === 'object' ? message.receiverId?._id : message.receiverId;
        
        return (messageSenderId === currentUserId && messageReceiverId === userId) || 
               (messageSenderId === userId && messageReceiverId === currentUserId);
      });
    } catch (error) {
      console.error('Error checking for new messages:', error);
      return [];
    }
  }
};

const MessagingSystem = ({ isOpen, onClose }) => {
  // Get redux and socket state
  const user = useSelector(state => state.user.user);
  const socketContext = useSocket();
  const socket = socketContext?.socket;
  const isConnected = socketContext?.isConnected || false;
  
  // State to show warning about socket connection
  const [showSocketWarning, setShowSocketWarning] = useState(!isConnected);
  
  // Log socket state for debugging
  useEffect(() => {
    console.log("Socket connection status:", isConnected ? "connected" : "not available");
    if (!isConnected) {
      console.log("Socket connection not available. Messages will be sent using API fallback.");
    }
    setShowSocketWarning(!isConnected);
    
    // If socket is not available after 10 seconds, set it as permanently unavailable
    // This prevents infinite loading
    let socketTimeout;
    if (!isConnected && !socket) {
      socketTimeout = setTimeout(() => {
        console.log("Socket connection timeout - proceeding with API-only mode");
        setShowSocketWarning(false); // Hide the warning after timeout
        
        // Force initial data load even without socket
        if (isOpen && user?._id) {
          console.log("Loading initial data in API-only mode");
          loadInitialData();
        }
      }, 5000); // Reduced timeout to 5 seconds for better UX
    }
    
    // When socket becomes available, clear timeout and load data
    if (isConnected && socket) {
      console.log("Socket connected successfully");
      if (socketTimeout) {
        clearTimeout(socketTimeout);
      }
      
      // Emit user online status
      if (user?._id) {
        try {
          socket.emit('userStatus', {
            userId: user._id,
            status: 'online'
          });
          console.log('Emitted online status for user:', user._id);
        } catch (err) {
          console.error('Error emitting user status:', err);
        }
      }
      
      // Load data now that socket is connected
      if (isOpen && user?._id) {
        loadInitialData();
      }
    }
    
    return () => {
      if (socketTimeout) clearTimeout(socketTimeout);
    };
  }, [isConnected, socket, isOpen, user]);
  
  // Initialize state variables
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showUserList, setShowUserList] = useState(true);
  const [lastCheckedTime, setLastCheckedTime] = useState(Date.now());
  const [userStatus, setUserStatus] = useState('Online');

  // Add socket availability check
  useEffect(() => {
    if (!socket) {
      console.warn('Socket connection not available. Some real-time features may be limited.');
    }
  }, [socket]);

  // State variables for UI enhancements
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResizing, setIsResizing] = useState({ active: false, position: null });
  const [containerSize, setContainerSize] = useState({ width: 400, height: 600 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [containerPos, setContainerPos] = useState({ x: 20, y: 20 });
  const [showEmojis, setShowEmojis] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Add these state variables after the existing state declarations
  const [groupChatModalOpen, setGroupChatModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [starredMessages, setStarredMessages] = useState([]);
  const [isViewingStarred, setIsViewingStarred] = useState(false);
  
  // Add group chat tracking and storage
  const [groupChats, setGroupChats] = useState([]);
  
  // Add these state variables for settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notificationsMuted, setNotificationsMuted] = useState(false);
  const [messageSound, setMessageSound] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  
  // Add state for call handling
  const [currentCall, setCurrentCall] = useState(null);
  
  const pollIntervalRef = useRef(null);

  // Additional refs
  const containerRef = useRef(null);
  const messageContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Handle responsive design based on container width
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      
      // When resizing the container or window, adjust UI based on width
      if (containerSize.width < 768 && selectedUser) {
        // On smaller screens, show only the chat when user is selected
        setShowUserList(false);
      } else if (containerSize.width >= 768 && !isMobileView) {
        // On larger screens, show both panels
        setShowUserList(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedUser, containerSize.width, isMobileView]);

  // Start polling for new messages when the component mounts - this will run regardless of socket state
  useEffect(() => {
    if (isOpen && user?._id) {
      // If we already have a socket connection, data will be loaded in the socket effect
      // Otherwise, we'll load data after timeout in API-only mode
      
      // Start polling for new messages every 5 seconds for backup
      pollIntervalRef.current = setInterval(() => {
        checkForNewMessages();
      }, 5000);
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isOpen, user]);

  // Add mouse/touch event listeners for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      handleDragMove(e);
      handleResizeMove(e);
    };
    
    const handleMouseUp = () => {
      handleDragEnd();
      handleResizeEnd();
    };
    
    if (isDragging || isResizing.active) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove);
      document.addEventListener('touchend', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStartPos, containerPos, containerSize]);

  // Load position and size from localStorage on mount
  useEffect(() => {
    try {
      const savedPos = localStorage.getItem('messagingSystemPosition');
      const savedSize = localStorage.getItem('messagingSystemSize');
      
      if (savedPos) {
        setContainerPos(JSON.parse(savedPos));
      } else {
        // Default position centered in the viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        setContainerPos({
          x: Math.max(0, (viewportWidth - 1200) / 2),
          y: Math.max(0, (viewportHeight - 800) / 2)
        });
      }
      
      if (savedSize) {
        setContainerSize(JSON.parse(savedSize));
      } else {
        // Default to a larger size for better usability
        setContainerSize({ width: 1200, height: 800 });
      }
    } catch (err) {
      console.error('Error loading messaging system position/size:', err);
      // Fallback sizes if error occurs
      setContainerSize({ width: 1200, height: 800 });
    }
  }, []);

  // Save position and size to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('messagingSystemPosition', JSON.stringify(containerPos));
      localStorage.setItem('messagingSystemSize', JSON.stringify(containerSize));
    } catch (err) {
      console.error('Error saving messaging system position/size:', err);
    }
  }, [containerPos, containerSize]);

  // Load group chats from localStorage on mount
  useEffect(() => {
    try {
      const savedGroups = localStorage.getItem('messagingGroupChats');
      if (savedGroups) {
        setGroupChats(JSON.parse(savedGroups));
      }
    } catch (err) {
      console.error('Error loading group chats:', err);
    }
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('messagingSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setNotificationsMuted(settings.notificationsMuted || false);
        setMessageSound(settings.messageSound !== false);
        setDarkMode(settings.darkMode || false);
        setFontSize(settings.fontSize || 'medium');
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('messagingSettings', JSON.stringify({
        notificationsMuted,
        messageSound,
        darkMode,
        fontSize
      }));
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  }, [notificationsMuted, messageSound, darkMode, fontSize]);

  // Initial data loading function
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Add a default admin user to ensure the list is never empty
      const defaultUsers = [{
        _id: 'system-admin',
        name: 'System Admin',
        role: 'admin',
        isAdmin: true,
        isOnline: true
      }];
      
      // Get the user ID from localStorage
      let userId = null;
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          userId = userData.id || userData._id;
        }
      } catch (err) {
        console.error('Error getting userId from localStorage:', err);
        setUsers(defaultUsers);
        setFilteredUsers(defaultUsers);
        setIsLoading(false);
        return;
      }
      
      if (!userId) {
        console.log('No user ID available for fetching users');
        setUsers(defaultUsers);
        setFilteredUsers(defaultUsers);
        setIsLoading(false);
        return;
      }
      
      let usersFetched = false;
      
      try {
        // Use API_ENDPOINTS.USERS 
        const response = await axiosInstance.get('/user/getAlluser');
        console.log("User API response:", response.data);
      
        let usersList = [];
        
        // Handle different response formats
        if (Array.isArray(response.data)) {
          usersList = response.data;
        } else if (response.data.users && Array.isArray(response.data.users)) {
          usersList = response.data.users;
        } else if (response.data.user && Array.isArray(response.data.user)) {
          usersList = response.data.user;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          usersList = response.data.data;
        } else {
          console.error('Unexpected response format:', response.data);
          usersList = [];
        }
        
        // Filter out any users with role 'visitor' and the current user
        const filteredUsersList = usersList.filter(user => 
          user && user._id && user._id !== userId
        );
        
        console.log(`Found ${filteredUsersList.length} users after filtering`);
        
        // Always include the default admin
        const combinedUsers = [...defaultUsers];
        
        // Process and add each filtered user
        if (filteredUsersList.length > 0) {
          // Process users to add name and status
          filteredUsersList.forEach(user => {
            // Ensure user has a name field
            if (!user.name && (user.firstName || user.lastName)) {
              user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            }
            
            // Set default online status for demo
            user.isOnline = user.isOnline || Math.random() > 0.5;
            
            combinedUsers.push(user);
          });
        }
        
        // Set users in state
        setUsers(combinedUsers);
        setFilteredUsers(combinedUsers);
        usersFetched = true;
      } catch (error) {
        console.error('Error fetching users from API:', error);
        // Use default users as fallback
        setUsers(defaultUsers);
        setFilteredUsers(defaultUsers);
      }

      // Only proceed with other data loading if users were fetched successfully
      if (usersFetched) {
        try {
    await fetchUnreadCounts();
    
    // If we have a selected user, fetch messages immediately
    if (selectedUser) {
      await fetchMessages(selectedUser);
          }
        } catch (countError) {
          console.error('Error fetching additional data:', countError);
          // Non-critical error, continue with the users we have
        }
      }
    } catch (error) {
      console.error('Unexpected error loading data:', error);
      // Set default users as fallback for any error
      const defaultUsers = [{
        _id: 'system-admin',
        name: 'System Admin',
        role: 'admin',
        isAdmin: true,
        isOnline: true
      }];
      setUsers(defaultUsers);
      setFilteredUsers(defaultUsers);
    } finally {
      // Always set loading to false to avoid infinite loading state
      setIsLoading(false);
    }
  };
  
  // Update the checkForNewMessages function to avoid infinite loops
  const checkForNewMessages = async () => {
    if (!user?._id) return;
    
    try {
      // Fetch all unread counts first
      const counts = await fetchUnreadCounts();
      
      // If we're viewing a conversation, get new messages for that specific user
      if (selectedUser) {
        // Skip API calls for virtual admin user (not real admin)
        if (selectedUser === 'system-admin') {
          return;
        }
        
        // Add a timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Message fetch timeout')), 5000)
        );
        
        try {
          const messagePromise = messageUtils.checkForNewMessages(
          selectedUser, 
          user._id, 
          lastCheckedTime
        );
        
          // Race between the fetch and the timeout
          const newMessages = await Promise.race([messagePromise, timeoutPromise]);
          
          if (newMessages && newMessages.length > 0) {
        // Filter messages we don't already have based on ID
          const uniqueNewMessages = newMessages.filter(msg => 
          !messages.some(existingMsg => existingMsg._id === msg._id)
        );
        
          if (uniqueNewMessages.length > 0) {
          // Add the new messages to our state
          setMessages(prev => {
            // Create a new array with all messages without duplicates
            const existingIds = new Set(prev.map(m => m._id));
            const combinedMessages = [...prev];
            
              uniqueNewMessages.forEach(msg => {
              if (!existingIds.has(msg._id)) {
                combinedMessages.push(msg);
              }
            });
            
            // Sort by creation time
            return combinedMessages.sort((a, b) => 
              new Date(a.createdAt) - new Date(b.createdAt)
            );
          });
          
            // Play notification sound if appropriate
            playNotificationSound(uniqueNewMessages);
            
            // Mark as read if we're currently viewing this conversation
            markMessagesAsRead(selectedUser);
          }
          }
        } catch (messageError) {
          console.error('Error or timeout checking for new messages:', messageError);
          // Just continue - this is a polling function so it will try again
        }
        
        // Update last checked time regardless of whether we found new messages
        setLastCheckedTime(Date.now());
      }
    } catch (error) {
      console.error('Error in checkForNewMessages:', error);
    }
  };

  // Add a function to play notification sounds
  const playNotificationSound = (messages) => {
    if (!messageSound) return;
    
    // Only play sound for messages from others, not from current user
    const hasNewMessageFromOthers = messages.some(msg => {
      const senderId = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;
      return senderId !== user._id;
    });
    
    if (hasNewMessageFromOthers) {
      try {
        // Create and play a message notification sound
        const audio = new Audio('/message-notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(err => {
          console.error('Error playing notification sound:', err);
        });
      } catch (error) {
        console.error('Error setting up notification sound:', error);
      }
    }
  };

  // Function to fetch unread counts
  const fetchUnreadCounts = async () => {
    try {
      const counts = await messageUtils.fetchUnreadCounts();
      console.log('Unread message counts:', counts);
      setUnreadCounts(counts);
      return counts;
    } catch (error) {
      console.error('Error in fetchUnreadCounts:', error);
      return {};
    }
  };

  // Function to fetch messages for a selected user
  const fetchMessages = async (userId) => {
    if (!user?._id) return;
    
    // Check if we're trying to fetch messages for the virtual admin user
    if (userId === 'system-admin') {
      // For virtual admin user, create mock messages instead of fetching from server
    setIsLoading(true);
      try {
        // Create a welcome message from admin
        const mockMessages = [
          {
            _id: `admin-msg-${Date.now()}`,
            content: "Welcome to the messaging system. I'm the System Admin and I can help with any questions you have about the platform.",
            senderId: 'system-admin',
            receiverId: user._id,
            createdAt: new Date().toISOString(),
            status: 'read'
          }
        ];
        
        setMessages(mockMessages);
        
        // Update unread counts
        if (unreadCounts[userId]) {
          // Mark as read directly
          markMessagesAsRead(userId);
        }
        
        // Update last checked time
        setLastCheckedTime(Date.now());
        
        return;
    } catch (error) {
        console.error('Error creating admin messages:', error);
    } finally {
      setIsLoading(false);
      }
      return;
    }
    
    // For normal users and real admins, proceed with the API call
    setIsLoading(true);
    try {
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Message fetch timeout')), 8000)
      );
      
      // Create the fetch promise
      const fetchPromise = messageUtils.fetchMessages(userId, user._id);
      
      let messagesData = [];
      
      try {
        // Race between the fetch and the timeout
        messagesData = await Promise.race([fetchPromise, timeoutPromise]);
      } catch (error) {
        console.error('Error or timeout fetching messages:', error);
        // Return empty array on error
        messagesData = [];
      }
      
      console.log(`Fetched ${messagesData.length} messages for conversation with ${userId}`);
      
      // Check if this is a conversation with a fallback admin
      if (userId === 'fallback-admin' && messagesData.length === 0) {
        // Add welcome message for fallback admin
        const welcomeMessage = {
          _id: `fallback-msg-${Date.now()}`,
          content: "Hello! I'm the support staff member assigned to assist you. How can I help you today?",
          senderId: 'fallback-admin',
          receiverId: user._id,
          createdAt: new Date().toISOString(),
          status: 'read'
        };
        setMessages([welcomeMessage]);
      } else {
        setMessages(messagesData);
      }
      
      // Mark messages as read
      await markMessagesAsRead(userId);
      
      // Update last checked time
      setLastCheckedTime(Date.now());
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      toast.error('Failed to load messages');
      
      // If there's an error loading messages, provide a fallback empty state
      setMessages([]);
    } finally {
      // Always set loading to false, even in case of errors
      setIsLoading(false);
    }
  };

  // Replace one of the duplicate handleSendMessage functions with improved error handling
  const handleSendMessage = async (content, attachment = null) => {
    if (!content || content.trim() === '') {
      toast.error('Please enter a message');
      return;
    }

    if (!selectedUser) {
      toast.error('Please select a user to message');
        return;
      }
      
    try {
      setIsSending(true);

      // Get current user info
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast.error('User authentication required');
        return;
      }

      const currentUser = JSON.parse(userStr);
      const senderId = currentUser.id || currentUser._id;
      
      if (!senderId) {
        toast.error('User ID not found');
        return;
      }

      console.log('Selected user for message:', selectedUser);
      
      // Determine the correct receiverId format
      const receiverId = typeof selectedUser === 'object' ? selectedUser._id : selectedUser;
      console.log('Formatted receiverId:', receiverId);
      
      if (!receiverId) {
        toast.error('Recipient ID is invalid');
        console.error('Invalid receiverId:', selectedUser);
        return;
      }

      // Prepare message object
      const newMessage = {
        senderId,
        senderName: currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
        receiverId,
        content,
        timestamp: new Date().toISOString(),
        attachment
      };

      console.log('Sending message:', newMessage);
      
      // First try socket if available
      if (socket && socket.connected) {
        console.log('Emitting message via socket');
        socket.emit('sendMessage', newMessage);
        
        // Add message to conversation immediately for real-time feedback
        const updatedConversation = [...messages, newMessage];
        setMessages(updatedConversation);
        setNewMessage('');
        
        // Scroll to bottom
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        // Fallback to API if socket not available
        console.log('Socket not available, using API fallback');
        toast('Using standard messaging mode');
        
        // Create form data for API call
      const formData = new FormData();
      formData.append('content', content || '');
        
        // Use the validated receiverId from above
        formData.append('receiverId', receiverId);
        formData.append('senderId', senderId);
        
        if (attachment) {
          formData.append('file', attachment);
        }
        
        // Send via API
        try {
          console.log('Sending via API with formData:', {
            content: formData.get('content'),
            receiverId: formData.get('receiverId'),
            senderId: formData.get('senderId'),
            hasFile: !!formData.get('file')
          });
          
          const response = await axiosInstance.post(API_ENDPOINTS.SEND_MESSAGE, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
          console.log('API message response:', response.data);
          
          if (response.data) {
            // Add the sent message to the conversation
            const apiMessage = {
              ...newMessage,
              _id: response.data._id || response.data.data?._id || `temp-${Date.now()}`,
              createdAt: response.data.createdAt || response.data.data?.createdAt || new Date().toISOString()
            };
            
            setMessages(prev => [...prev, apiMessage]);
            setNewMessage('');
            
            // Scroll to bottom
            setTimeout(() => {
              if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
          }
        } catch (apiError) {
          console.error('API send error:', apiError);
          
          // Handle ObjectId casting errors
          if (apiError.response?.data?.error?.includes('Cast to ObjectId failed')) {
            toast.error('Invalid recipient ID format');
            console.error('MongoDB ObjectId casting error with receiverId:', receiverId);
        } else {
            // Generic error fallback
            toast.error(apiError.message || 'Failed to send message via API');
          }
          
          // Still update UI with a temporary message to improve UX
          const tempMessage = {
            ...newMessage,
            _id: `temp-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'failed'
          };
          
          setMessages(prev => [...prev, tempMessage]);
          setNewMessage('');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Handle selecting a user from the list
   */
  const handleSelectUser = (userId) => {
    // If we're already viewing this user, don't do anything
    if (selectedUser === userId) return;
    
    console.log('Selecting user:', userId);
    
    // Ensure we're storing just the ID string, not the full user object
    setSelectedUser(userId);
    fetchMessages(userId);
    
    // Mark messages as read
    if (unreadCounts[userId]) {
      markMessagesAsRead(userId);
    }
    
    // On mobile or small screen, show message view
    if (isMobileView || containerSize.width < 768) {
      setShowUserList(false);
    }
    
    // Close any open menus or panels
    setIsMenuOpen(false);
    setIsSettingsOpen(false);
    exitStarredMessagesView();
  };

  // Function to go back to user list (mobile view)
  const goBackToUserList = () => {
    // In telegram-style, we just deselect the user to return to the list view
    setSelectedUser(null);
    
    // Clear related state
    setMessages([]);
    setIsTyping(false);
    setSearchQuery('');
  };

  // Add these functions for call handling
  const handlePhoneCall = (userId) => {
    if (!userId) return;
    
    // Find the user
    const targetUser = users.find(u => u._id === userId) || {
      _id: userId,
      name: 'User'
    };
    
    // Set the current call
    setCurrentCall({
      userId,
      userName: targetUser.name || targetUser.username || 'User',
      isVideo: false,
      status: 'calling'
    });
    
    // Show notification
    toast(`Calling ${targetUser.name || targetUser.username || 'User'}...`);
    
    // For demo purposes, we'll simulate the call being accepted after 3 seconds
    setTimeout(() => {
      setCurrentCall(prev => prev ? { ...prev, status: 'connected' } : null);
      toast(`Call connected with ${targetUser.name || targetUser.username || 'User'}`);
    }, 3000);
  };

  const handleVideoCall = (userId) => {
    if (!userId) return;
    
    // Find the user
    const targetUser = users.find(u => u._id === userId) || {
      _id: userId,
      name: 'User'
    };
    
    // Set the current call
    setCurrentCall({
      userId,
      userName: targetUser.name || targetUser.username || 'User',
      isVideo: true,
      status: 'calling'
    });
    
    // Show notification
    toast(`Video calling ${targetUser.name || targetUser.username || 'User'}...`);
    
    // For demo purposes, we'll simulate the call being accepted after 3 seconds
      setTimeout(() => {
      setCurrentCall(prev => prev ? { ...prev, status: 'connected' } : null);
      toast(`Video call connected with ${targetUser.name || targetUser.username || 'User'}`);
    }, 3000);
  };

  const endCurrentCall = () => {
    if (!currentCall) return;
    
    const { userName, isVideo } = currentCall;
    setCurrentCall(null);
    toast(`${isVideo ? 'Video call' : 'Call'} with ${userName} ended`);
  };

  // Modify the getSelectedUserData function to include groups
  const getSelectedUserData = () => {
    if (!selectedUser) return null;
    
    // Check if it's a group
    if (selectedUser.startsWith('group-')) {
      return groupChats.find(g => g._id === selectedUser) || null;
    }
    
    // Otherwise it's a regular user
    return users.find(u => u._id === selectedUser) || null;
  };

  const selectedUserData = getSelectedUserData();

  // Handle dragging and resizing
  const handleDragStart = (e) => {
    // Prevent default to allow dragging over browser UI elements
    e.preventDefault();
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    setIsDragging(true);
    setDragStartPos({
      x: clientX,
      y: clientY,
      offsetX: containerPos.x,
      offsetY: containerPos.y
    });
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    // Calculate new position without limiting to viewport
    const newX = dragStartPos.offsetX + (clientX - dragStartPos.x);
    const newY = dragStartPos.offsetY + (clientY - dragStartPos.y);
    
    // Allow dragging to any position, even negative values to move off-screen
    setContainerPos({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Resize handlers
  const resizeHandles = [
    { position: 'right', cursor: 'ew-resize', className: 'absolute right-0 top-0 w-1 h-full' },
    { position: 'bottom', cursor: 'ns-resize', className: 'absolute bottom-0 left-0 w-full h-1' },
    { position: 'bottom-right', cursor: 'nwse-resize', className: 'absolute bottom-0 right-0 w-6 h-6' },
    { position: 'top', cursor: 'ns-resize', className: 'absolute top-0 left-0 w-full h-1' }
  ];

  const handleResizeStart = (e, position) => {
    e.stopPropagation();
    e.preventDefault();
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    setIsResizing({ active: true, position });
    setDragStartPos({
      x: clientX,
      y: clientY,
      width: containerSize.width,
      height: containerSize.height
    });
  };

  const handleResizeMove = (e) => {
    if (!isResizing.active) return;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const deltaX = clientX - dragStartPos.x;
    const deltaY = clientY - dragStartPos.y;
    
    const newSize = { ...containerSize };
    const newPos = { ...containerPos };
    
    if (isResizing.position === 'right' || isResizing.position === 'bottom-right') {
      // Allow resizing to very small width (minimum 200px)
      newSize.width = Math.max(200, dragStartPos.width + deltaX);
    }
    
    if (isResizing.position === 'bottom' || isResizing.position === 'bottom-right') {
      // Allow resizing to very small height (minimum 150px)
      newSize.height = Math.max(150, dragStartPos.height + deltaY);
    }
    
    if (isResizing.position === 'top') {
      const newHeight = Math.max(150, dragStartPos.height - deltaY);
      
      // No minimum top position requirement - allow going above the viewport
      newPos.y = containerPos.y + deltaY;
      newSize.height = newHeight;
    }
    
    if (isResizing.position === 'left') {
      const newWidth = Math.max(200, dragStartPos.width - deltaX);
      
      // No minimum left position requirement - allow going left of the viewport
      newPos.x = containerPos.x + deltaX;
      newSize.width = newWidth;
    }
    
    setContainerSize(newSize);
    
    // Only update position if we're resizing from the top or left
    if (isResizing.position === 'top' || isResizing.position === 'left') {
      setContainerPos(newPos);
    }
    
    // Adjust layout based on new width
    if (newSize.width < 768 && selectedUser) {
      // On smaller widths, show only chat when a user is selected
      setShowUserList(false);
    } else if (newSize.width >= 768 && !isMobileView) {
      // On larger widths, show both panels
      setShowUserList(true);
    }
  };

  const handleResizeEnd = () => {
    setIsResizing({ active: false, position: null });
  };

  // Menu toggle
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // If there are any other modals open, close them
    if (groupChatModalOpen) setGroupChatModalOpen(false);
    if (isViewingStarred) setIsViewingStarred(false);
  };

  // Update group chat creation functionality
  const handleCreateGroupChat = () => {
    if (groupName.trim() === '') {
      toast.error("Please enter a group name");
      return;
    }
    
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }
    
    // Create a unique ID for the group
    const groupId = `group-${Date.now()}`;
    
    // Create group chat object
    const newGroup = {
      _id: groupId,
      name: groupName,
      members: [...selectedUsers, user?._id],
      createdBy: user?._id,
      createdAt: new Date().toISOString(),
      isGroup: true,
      messages: []
    };
    
    // Add to state
    setGroupChats(prev => {
      const updated = [...prev, newGroup];
      
      // Save to localStorage
      try {
        localStorage.setItem('messagingGroupChats', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving group chats:', err);
      }
      
      return updated;
    });
    
    // Select the new group
    setSelectedUser(groupId);
    
    // Close modal and reset state
    setGroupChatModalOpen(false);
    setGroupName('');
    setSelectedUsers([]);
    setIsMenuOpen(false);
    
    toast(`Group "${groupName}" created with ${selectedUsers.length} members`);
  };

  // Star message functionality
  const handleStarMessage = (messageId) => {
    // Check if message is already starred
    const isAlreadyStarred = starredMessages.includes(messageId);
    
    if (isAlreadyStarred) {
      // Remove from starred
      setStarredMessages(prev => prev.filter(id => id !== messageId));
      toast('Message unstarred');
    } else {
      // Add to starred
      setStarredMessages(prev => [...prev, messageId]);
      toast('Message starred');
    }
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem('starredMessages', JSON.stringify(
        isAlreadyStarred 
          ? starredMessages.filter(id => id !== messageId)
          : [...starredMessages, messageId]
      ));
    } catch (err) {
      console.error('Error saving starred messages:', err);
    }
  };

  // View starred messages
  const viewStarredMessages = () => {
    if (starredMessages.length === 0) {
      toast.error('No starred messages to display');
      return;
    }
    
    setIsViewingStarred(true);
    setIsMenuOpen(false);
    toast(`Showing ${starredMessages.length} starred messages`);
  };

  // Exit starred messages view
  const exitStarredMessagesView = () => {
    setIsViewingStarred(false);
  };

  // Load starred messages from localStorage
  useEffect(() => {
    try {
      const savedStarred = localStorage.getItem('starredMessages');
      if (savedStarred) {
        setStarredMessages(JSON.parse(savedStarred));
      }
    } catch (err) {
      console.error('Error loading starred messages:', err);
    }
  }, []);

  // Filter messages to show only starred ones when in starred view
  const getDisplayedMessages = () => {
    if (isViewingStarred) {
      return messages.filter(msg => starredMessages.includes(msg._id));
    }
    return messages;
  };

  // Update menu handlers
  const openGroupChatModal = () => {
    setGroupChatModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedUsers(prev => [...prev, userId]);
    }
  };

  // Toggle settings panel
  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
    if (isMenuOpen) setIsMenuOpen(false);
    if (groupChatModalOpen) setGroupChatModalOpen(false);
    if (isViewingStarred) setIsViewingStarred(false);
  };

  // Toggle notifications mute
  const toggleNotifications = () => {
    setNotificationsMuted(!notificationsMuted);
    toast(notificationsMuted ? 'Notifications enabled' : 'Notifications muted');
  };

  // Update menu content to include settings button
  const renderMenuContent = () => {
    return (
      <div className="absolute top-12 right-0 w-64 bg-white shadow-lg rounded-md z-50 border border-gray-200">
        <div className="p-2">
          <button
            className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded-md flex items-center gap-2 transition"
            onClick={openGroupChatModal}
          >
            <FiUsers className="text-blue-500" />
            <span>Create Group Chat</span>
          </button>
          
          <button
            className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded-md flex items-center gap-2 transition"
            onClick={viewStarredMessages}
          >
            <FiStar className="text-yellow-500" />
            <span>Starred Messages ({starredMessages.length})</span>
          </button>
          
            <button 
            className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded-md flex items-center gap-2 transition"
            onClick={toggleSettings}
          >
            <FiSettings className="text-gray-500" />
            <span>Settings</span>
          </button>
          
            <button 
            className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded-md flex items-center gap-2 transition text-red-500"
            onClick={toggleNotifications}
          >
            {notificationsMuted ? <FiBellOff size={16} /> : <FiBell size={16} />}
            <span>{notificationsMuted ? 'Enable Notifications' : 'Mute Notifications'}</span>
          </button>
        </div>
      </div>
    );
  };

  // Render settings panel
  const renderSettingsPanel = () => {
    if (!isSettingsOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Settings</h3>
            <button onClick={() => setIsSettingsOpen(false)} className="text-gray-500 hover:text-gray-700">
              <FiX size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h4 className="font-medium text-gray-800">Notifications</h4>
                <p className="text-sm text-gray-500">Enable or disable message notifications</p>
              </div>
              <div className="relative">
            <input 
                  type="checkbox"
                  checked={!notificationsMuted}
                  onChange={toggleNotifications}
                  className="sr-only"
                  id="notifications-toggle"
                />
                <label 
                  htmlFor="notifications-toggle"
                  className={`block w-12 h-6 rounded-full transition ${!notificationsMuted ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <span 
                    className={`block w-4 h-4 mt-1 ml-1 bg-white rounded-full transition-transform transform ${!notificationsMuted ? 'translate-x-6' : ''}`}
                  />
                </label>
              </div>
          </div>
          
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h4 className="font-medium text-gray-800">Message Sounds</h4>
                <p className="text-sm text-gray-500">Play sounds when messages are received</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={messageSound}
                  onChange={() => setMessageSound(!messageSound)}
                  className="sr-only"
                  id="sound-toggle"
                />
                <label 
                  htmlFor="sound-toggle"
                  className={`block w-12 h-6 rounded-full transition ${messageSound ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <span 
                    className={`block w-4 h-4 mt-1 ml-1 bg-white rounded-full transition-transform transform ${messageSound ? 'translate-x-6' : ''}`}
                  />
                </label>
                      </div>
                  </div>
            
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h4 className="font-medium text-gray-800">Dark Mode</h4>
                <p className="text-sm text-gray-500">Enable dark theme for messaging</p>
                </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                  className="sr-only"
                  id="dark-mode-toggle"
                />
                <label 
                  htmlFor="dark-mode-toggle"
                  className={`block w-12 h-6 rounded-full transition ${darkMode ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <span 
                    className={`block w-4 h-4 mt-1 ml-1 bg-white rounded-full transition-transform transform ${darkMode ? 'translate-x-6' : ''}`}
                  />
                </label>
            </div>
          </div>
          
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Font Size</h4>
              <div className="flex items-center gap-4">
            <button 
                  onClick={() => setFontSize('small')}
                  className={`px-3 py-1 rounded ${fontSize === 'small' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
                  Small
            </button>
            <button 
                  onClick={() => setFontSize('medium')}
                  className={`px-3 py-1 rounded ${fontSize === 'medium' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Medium
                </button>
                <button 
                  onClick={() => setFontSize('large')}
                  className={`px-3 py-1 rounded ${fontSize === 'large' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Large
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add Group Chat Modal UI
  const renderGroupChatModal = () => {
    if (!groupChatModalOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Create Group Chat</h3>
            <button onClick={() => setGroupChatModalOpen(false)} className="text-gray-500 hover:text-gray-700">
              <FiX size={20} />
            </button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter group name"
            />
            </div>
            
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Users</label>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
              {users.map(user => (
                <div 
                  key={user._id} 
                  className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleUserSelection(user._id)}
                >
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <FiUser className="text-blue-500" />
              </div>
              </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name || user.username || 'User'}
                    </p>
            </div>
                  <div className="ml-2">
                    {selectedUsers.includes(user._id) ? (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <FiCheck className="text-white" size={12} />
              </div>
                    ) : (
                      <div className="w-5 h-5 border border-gray-300 rounded-full"></div>
                    )}
              </div>
            </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => setGroupChatModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroupChat}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              Create Group
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add Starred Messages Header
  const renderStarredMessagesHeader = () => {
    if (!isViewingStarred) return null;
    
    return (
      <div className="bg-yellow-50 p-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiStar className="text-yellow-500" />
          <span className="font-medium">Starred Messages</span>
        </div>
        <button
          onClick={exitStarredMessagesView}
          className="text-gray-500 hover:text-gray-700"
        >
          <FiX size={18} />
        </button>
      </div>
    );
  };

  // Update the MessageList component with combined users and groups list
  const getCombinedContacts = () => {
    // Convert group chats to the same format as users
    const groupsFormatted = groupChats.map(group => ({
      _id: group._id,
      name: group.name,
      username: group.name,
      isGroup: true,
      members: group.members,
      lastMessage: group.messages && group.messages.length > 0 ? 
        group.messages[group.messages.length - 1] : null
    }));
    
    // Add last message info and unread counts to users
    const usersWithLastMessage = users.map(user => {
      // Find messages between this user and current user
      const userMessages = messages.filter(msg => {
        const senderId = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;
        const receiverId = typeof msg.receiverId === 'object' ? msg.receiverId?._id : msg.receiverId;
        
        return (senderId === user._id && receiverId === user?._id) || 
               (senderId === user?._id && receiverId === user._id);
      });
      
      // Get the most recent message
      const lastMessage = userMessages.length > 0 ? 
        userMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] : null;
      
      // Return user with last message
      return {
        ...user,
        lastMessage: lastMessage ? {
          text: lastMessage.content,
          time: new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } : null,
        unreadCount: unreadCounts[user._id] || 0
      };
    });
    
    return [...usersWithLastMessage, ...groupsFormatted];
  };

  // Update the search functionality to use filteredUsers
  useEffect(() => {
    if (users.length > 0 && searchQuery) {
      const filtered = users.filter(user => {
        // Search by name, username, firstName, middleName, lastName
        const searchFields = [
          user.name,
          user.username,
          user.firstName,
          user.middleName,
          user.lastName
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchFields.includes(searchQuery.toLowerCase());
      });
      setFilteredUsers(filtered);
    } else if (users.length > 0) {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  // Add this function to properly filter users based on search query
  const filterUsers = (usersList, query) => {
    if (!query || !query.trim()) return usersList;
    
    return usersList.filter(user => {
      if (!user) return false;
      
      // Check all possible name fields
      const searchFields = [
        user.name,
        user.username,
        user.firstName,
        user.middleName,
        user.lastName
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchFields.includes(query.toLowerCase());
    });
  };

  // Function to mark messages as read and broadcast event for notification icon
  const markMessagesAsRead = async (senderId) => {
    if (!user?._id) return;
    
    console.log(`Marking messages from sender ${senderId} as read`);
    
    // Skip API calls for virtual admin user
    if (senderId === 'system-admin') {
      // Update local unread counts
      setUnreadCounts(prev => ({
        ...prev,
        [senderId]: 0
      }));
      return;
    }
    
    try {
      await messageUtils.markMessagesAsRead(senderId, user._id);
      
      // Update local unread counts
      setUnreadCounts(prev => ({
        ...prev,
        [senderId]: 0
      }));
      
      // Broadcast a custom event that messages were read
      // This allows the MessageNotificationIcon to update in real-time
      window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', {
        detail: { 
          senderId: senderId,
          userId: user._id 
        }
      }));
      
      // If there's a global function to mark messages as read, call it
      if (window.markMessageAsRead) {
        window.markMessageAsRead(senderId);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Add a function to check if the selected user is a real admin (not virtual)
  const isRealAdmin = (userId) => {
    // Check if this is our virtual system admin
    if (userId === 'system-admin') {
      return false;
    }
    
    const user = users.find(u => u._id === userId);
    return user && (user.role === 'admin' || user.isAdmin) && !user.isVirtual;
  };

  // Add a refresh function to load fresh data
  const handleRefresh = async () => {
    toast("Refreshing messages and contacts...");
    
    try {
      // Call the loadInitialData function which now properly fetches users
      await loadInitialData();
      toast("Refresh complete!");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh. Please try again.");
    }
  };

  // Add this function to get initials from both first and last names
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

  // Update the renderHeaderUserInfo function
  const renderHeaderUserInfo = () => {
    if (!selectedUser) return null;
    
    // Find the selected user data
    const userData = users.find(u => u._id === selectedUser);
    if (!userData) return null;
    
    const displayName = userData.name || userData.username || 'User';
    const initials = getInitials(userData);
    const role = userData.role || (userData.isAdmin ? 'Admin' : '');
    
    // Get consistent avatar color
    const avatarColor = getAvatarColor(userData._id);
    
    return (
      <div className="messaging-header-user-info">
        <div className="header-user-avatar">
          {userData.photo ? (
            <img 
              src={userData.photo} 
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // If image fails to load, show initials instead
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentNode.style.backgroundColor = avatarColor.bg;
                e.target.parentNode.innerHTML = `<span style="color: ${avatarColor.text};">${initials}</span>`;
              }}
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{
                backgroundColor: avatarColor.bg,
                color: avatarColor.text
              }}
            >
              <span>{initials}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col">
          <span className="text-white text-sm font-medium">{displayName}</span>
          {role && (
            <span className="text-white/70 text-xs">{role}</span>
          )}
        </div>
      </div>
    );
  };

  // Add WebSocket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new messages
    socket.on('newMessage', (message) => {
      if (message.senderId === selectedUser || message.receiverId === selectedUser) {
        setMessages(prev => {
          // Check if message already exists
          if (prev.some(msg => msg._id === message._id)) return prev;
          
          // Add new message and sort by timestamp
          return [...prev, message].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          );
        });

        // Play notification sound if appropriate
        if (message.senderId !== user?._id) {
          playNotificationSound([message]);
        }
      }
    });

    // Listen for typing indicators
    socket.on('typing', ({ userId, isTyping }) => {
      if (userId === selectedUser) {
        setIsTyping(isTyping);
      }
    });

    // Listen for user status updates
    socket.on('userStatus', ({ userId, status }) => {
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, isOnline: status === 'online' } : u
      ));
    });

    // Clean up event listeners
    return () => {
      socket.off('newMessage');
      socket.off('typing');
      socket.off('userStatus');
    };
  }, [socket, isConnected, selectedUser, user?._id]);

  // Add typing indicator handler
  const handleTyping = (isTyping) => {
    if (socket && isConnected && selectedUser) {
      socket.emit('typing', {
        receiverId: selectedUser,
        isTyping
      });
    }
  };

  // Render component
  return (
    <div className={`messaging-app ${isOpen ? 'open' : ''} ${darkMode ? 'dark-mode' : ''} ${fontSize}`}
        style={{
          left: `${containerPos.x}px`,
        top: `${containerPos.y}px`,
          width: `${containerSize.width}px`,
          height: `${containerSize.height}px`,
        position: 'fixed',
        zIndex: 2147483647,
          maxWidth: 'none',
          maxHeight: 'none',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1)',
          borderRadius: '24px',
          border: '10px solid #111827',
          background: '#111827',
          overflow: 'hidden',
          padding: '4px',
          resize: 'both',
          minWidth: '200px',
          minHeight: '150px',
        transform: 'translateZ(0)',
        willChange: 'transform',
        transition: 'all 0.3s ease'
        }}
      ref={containerRef}>
      
        {/* Phone status bar */}
        <div className="h-5 w-full bg-[#111827] flex items-center justify-between px-6">
          <div className="text-white text-xs font-medium">
            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-white/60"></div>
            <div className="w-2 h-2 rounded-full bg-white/90"></div>
            <div className="w-2 h-2 rounded-full bg-white"></div>
          </div>
        </div>
        
        {/* Main app container with white background */}
        <div className="h-[calc(100%-5px)] w-full rounded-t-xl bg-white overflow-hidden flex flex-col">
          {/* Header with enhanced styling */}
          <div 
            className="flex items-center justify-between p-3 cursor-move border-b bg-gradient-to-r from-blue-700 to-indigo-800 shadow-md"
            onMouseDown={handleDragStart}
          >
            <div className="flex items-center">
              {isViewingStarred ? (
                <span className="text-white text-sm">
                  Starred Messages
                          </span>
              ) : (
                renderHeaderUserInfo()
              )}
                                </div>
            <div className="flex items-center space-x-1">
              {/* Refresh button */}
                    <button
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                onClick={handleRefresh}
                title="Refresh"
              >
                <FiRefreshCw size={16} />
                    </button>
              {/* Notification toggle */}
                    <button
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                onClick={toggleNotifications}
                title={notificationsMuted ? "Enable Notifications" : "Mute Notifications"}
              >
                {notificationsMuted ? <FiBellOff size={16} /> : <FiBell size={16} />}
                    </button>
                    <button
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                onClick={toggleSettings}
                    >
                <FiSettings size={16} />
                    </button>
                    <button
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                onClick={onClose}
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                    </div>
          
        {/* Socket warning banner */}
        {!socket && showSocketWarning ? (
          <div className="p-2 bg-yellow-50 text-yellow-700 text-sm border-b border-yellow-200">
            <p className="flex items-center justify-center gap-2">
              <FiRefreshCw className="animate-spin" size={14} />
              Real-time messaging is initializing. Messages will still be delivered but may be delayed.
            </p>
          </div>
        ) : (!socket && !showSocketWarning) ? (
          <div className="p-2 bg-blue-50 text-blue-700 text-sm border-b border-blue-200">
            <p className="flex items-center justify-center gap-2">
              <FiInfo size={14} />
              Using standard messaging mode. Real-time features are limited.
            </p>
          </div>
        ) : null}
        
          {/* Main content container */}
          <div className="flex flex-1 overflow-hidden bg-gray-50">
            {/* User list column - full width when no user selected or forced full width on mobile */}
            <div className={`
              transition-all duration-300 overflow-hidden user-list
              ${!selectedUser ? 'w-full' : isMobileView || containerSize.width < 768 ? 'w-0' : 'md:max-w-[280px] md:min-w-[250px] md:w-[30%]'}
              h-full bg-white border-r
            `}>
              <MessageList 
              users={isViewingStarred ? starredMessages : filteredUsers || users}
                selectedUserId={selectedUser}
              onSelectUser={handleSelectUser}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                unreadCounts={unreadCounts}
              isLoading={isLoading}
              />
                                      </div>
            
            {/* Messages column - shown when user is selected */}
            <div className={`
              h-full flex-1 flex flex-col overflow-hidden relative
              ${!selectedUser ? 'hidden' : 'w-full'}
              ${isMobileView || containerSize.width < 768 ? 'w-full' : ''}
            `}>
              {selectedUser ? (
                <>
                  {isViewingStarred && renderStarredMessagesHeader()}
                  
                  {/* Floating call buttons for larger screens */}
                  {selectedUser && !isMobileView && containerSize.width >= 768 && (
                    <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
                    <button
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full shadow-md transition-colors"
                        onClick={() => handlePhoneCall(selectedUser)}
                        title="Voice Call"
                    >
                        <FiPhone size={20} />
                    </button>
                    <button
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full shadow-md transition-colors"
                        onClick={() => handleVideoCall(selectedUser)}
                        title="Video Call"
                    >
                        <FiVideo size={20} />
                    </button>
                  </div>
                )}
                
                  <MessageChat 
                    selectedUser={selectedUserData}
                    messages={getDisplayedMessages()}
                    currentUserId={user?._id}
                    isTyping={isTyping}
                  userStatus={selectedUserData?.isOnline ? 'online' : 'offline'}
                    isMobile={isMobileView || containerSize.width < 768}
                    onBackClick={goBackToUserList}
                    onPhoneClick={() => handlePhoneCall(selectedUser)}
                    onVideoClick={() => handleVideoCall(selectedUser)}
                    onMenuClick={toggleMenu}
                    onSendMessage={handleSendMessage}
                  onTyping={handleTyping}
                    isLoading={isLoading}
                    onStarMessage={handleStarMessage}
                    starredMessages={starredMessages}
                    isAdmin={selectedUserData?.isAdmin || selectedUserData?.role === 'admin'}
                    containerWidth={containerSize.width}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50">
                  <div className="text-center p-6">
                    <FiMessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
                    <p className="max-w-xs text-sm">
                      Choose a contact from the list to start messaging
                    </p>
                        </div>
                      </div>
                    )}
                          </div>
                  </div>
                  
          {/* Phone Home Button */}
          <div className="h-6 w-full bg-[#111827] rounded-b-xl flex items-center justify-center">
            <div className="w-20 h-1 bg-gray-500 rounded-full"></div>
                  </div>
                </div>
                
        {/* Add resize handles for all sides and corners */}
        <div
        className={`resize-handle absolute bottom-4 right-4 w-4 h-4 cursor-se-resize ${isResizing.active ? 'bg-blue-400/30' : ''}`}
          onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
        />
        <div
        className={`resize-handle absolute bottom-4 w-full h-1 cursor-s-resize ${isResizing.active ? 'bg-blue-400/30' : ''}`}
          onMouseDown={(e) => handleResizeStart(e, 'bottom')}
        />
        <div
        className={`resize-handle absolute right-4 h-full w-1 cursor-e-resize ${isResizing.active ? 'bg-blue-400/30' : ''}`}
          onMouseDown={(e) => handleResizeStart(e, 'right')}
        />
        <div
        className={`resize-handle absolute top-4 w-full h-1 cursor-n-resize ${isResizing.active ? 'bg-blue-400/30' : ''}`}
          onMouseDown={(e) => handleResizeStart(e, 'top')}
        />
        <div
        className={`resize-handle absolute left-4 h-full w-1 cursor-w-resize ${isResizing.active ? 'bg-blue-400/30' : ''}`}
          onMouseDown={(e) => handleResizeStart(e, 'left')}
        />
        <div
        className={`resize-handle absolute top-4 left-4 w-4 h-4 cursor-nw-resize ${isResizing.active ? 'bg-blue-400/30' : ''}`}
          onMouseDown={(e) => handleResizeStart(e, 'top-left')}
        />
        <div
        className={`resize-handle absolute top-4 right-4 w-4 h-4 cursor-ne-resize ${isResizing.active ? 'bg-blue-400/30' : ''}`}
          onMouseDown={(e) => handleResizeStart(e, 'top-right')}
        />
        <div
        className={`resize-handle absolute bottom-4 left-4 w-4 h-4 cursor-sw-resize ${isResizing.active ? 'bg-blue-400/30' : ''}`}
          onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
        />
      </div>
  );
};

export default MessagingSystem; 