import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FiSend, FiPaperclip, FiX, FiSearch, FiUser, FiMessageSquare, FiMoreVertical, FiCheck, FiBell, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { IoMdImages } from 'react-icons/io';
import { BsEmojiSmile } from 'react-icons/bs';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import { RiMenu3Line } from 'react-icons/ri';

const MessagingSystem = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showUserList, setShowUserList] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState(Date.now());
  const [messageStatus, setMessageStatus] = useState({});
  const messagesEndRef = useRef(null);
  const user = useSelector((state) => state.user.user);
  const inputRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userStatus, setUserStatus] = useState('Online');

  // Add swipe gesture functionality
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe && showUserList && isMobileView) {
      // Swipe left to hide user list and show chat
      if (selectedUser) {
        setShowUserList(false);
      }
    } else if (isRightSwipe && !showUserList && isMobileView) {
      // Swipe right to show user list
      setShowUserList(true);
    }
    
    // Reset values
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (mobile && selectedUser) {
        setShowUserList(false);
      } else {
        setShowUserList(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start polling for new messages when the component mounts
  useEffect(() => {
    if (isOpen && user?._id) {
      // Log user object to verify it's available
      console.log('Current user:', user);
      fetchUsers();
      fetchUnreadCounts();
      
      // If we have a selected user, fetch messages immediately
      if (selectedUser) {
        fetchMessages(selectedUser);
      }
      
      // Start polling for new messages every 5 seconds
      pollIntervalRef.current = setInterval(() => {
        if (selectedUser) {
          checkForNewMessages(selectedUser);
        } else {
          fetchUnreadCounts();
        }
      }, 5000);
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isOpen, user, selectedUser]);

  // Check for new messages since last check
  const checkForNewMessages = async (userId) => {
    if (!user?._id) {
      console.error('Cannot check for messages: No current user');
      return;
    }
    
    try {
      console.log(`Checking for new messages with ${userId} since ${new Date(lastCheckedTime).toISOString()}`);
      
      // Ensure user ID is a string
      const currentUserId = String(user._id);
      
      // Add currentUserId to query params to handle cases where req.user is not available
      const response = await axiosInstance.get(`/messages/${userId}?since=${lastCheckedTime}&currentUserId=${currentUserId}`);
      console.log('Checking for new messages response:', response.data);
      
      let messagesList = [];
      if (Array.isArray(response.data)) {
        messagesList = response.data;
      } else if (response.data.messages && Array.isArray(response.data.messages)) {
        messagesList = response.data.messages;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        messagesList = response.data.data;
      } else {
        console.error('Unexpected message data format:', response.data);
        return;
      }
      
      // Filter to ensure we only process messages from the current conversation
      messagesList = messagesList.filter(message => {
        // Extract sender and receiver IDs, handling both string IDs and populated objects
        const messageSenderId = typeof message.senderId === 'object' ? message.senderId?._id : message.senderId;
        const messageReceiverId = typeof message.receiverId === 'object' ? message.receiverId?._id : message.receiverId;
        const currentUserId = user._id;
        
        return (messageSenderId === currentUserId && messageReceiverId === userId) || 
               (messageSenderId === userId && messageReceiverId === currentUserId);
      });
      
      if (messagesList.length > 0) {
        // Filter messages we don't already have based on ID
        const newMessages = messagesList.filter(msg => 
          !messages.some(existingMsg => existingMsg._id === msg._id)
        );
        
        console.log(`Found ${newMessages.length} new messages out of ${messagesList.length} total`);
        
        if (newMessages.length > 0) {
          // Add the new messages to our state
          setMessages(prev => {
            // Create a new array with all messages without duplicates
            const existingIds = new Set(prev.map(m => m._id));
            const combinedMessages = [...prev];
            
            newMessages.forEach(msg => {
              if (!existingIds.has(msg._id)) {
                combinedMessages.push(msg);
              }
            });
            
            // Sort by creation time
            return combinedMessages.sort((a, b) => 
              new Date(a.createdAt) - new Date(b.createdAt)
            );
          });
          
          setHasNewMessages(true);
          
          // If messages were received and the user isn't the sender, show notification
          const receivedMessages = newMessages.filter(msg => msg.senderId !== user._id);
          if (receivedMessages.length > 0) {
            const sender = users.find(u => u._id === receivedMessages[0].senderId);
            if (sender) {
              toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} p-4 bg-blue-500 text-white rounded-lg shadow-lg flex items-center gap-3`}>
                  <FiBell size={20} />
                  <div>
                    <p className="font-medium">{sender.firstName} {sender.middleName}</p>
                    <p className="text-sm">New message received</p>
                  </div>
                </div>
              ));
            }
          }
          
          // Update message status for our messages that were delivered
          const ourDeliveredMessages = newMessages.filter(msg => 
            msg.senderId === user._id && msg.status === 'delivered'
          );
          
          if (ourDeliveredMessages.length > 0) {
            setMessageStatus(prev => {
              const updated = {...prev};
              ourDeliveredMessages.forEach(msg => {
                updated[msg._id] = 'delivered';
              });
              return updated;
            });
          }
        }
      }
      
      setLastCheckedTime(Date.now());
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/user/getAlluser');
      console.log('User response:', response.data); // Debug the response structure
      
      // Check the response structure and extract the user array
      let usersList = [];
      if (Array.isArray(response.data)) {
        usersList = response.data;
      } else if (response.data.users && Array.isArray(response.data.users)) {
        usersList = response.data.users;
      } else if (response.data.user && Array.isArray(response.data.user)) {
        usersList = response.data.user; // Handle the specific case where users are in 'user' property
      } else if (response.data.data && Array.isArray(response.data.data)) {
        usersList = response.data.data;
      } else {
        console.error('Unexpected response format:', response.data);
        usersList = []; // Initialize as empty array instead of showing error toast
      }
      
      const filteredUsers = usersList.filter(u => u._id !== user._id);
      setUsers(filteredUsers);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    }
  };

  const fetchUnreadCounts = async () => {
    if (!user?._id) {
      console.error('Cannot fetch unread counts: No current user');
      return;
    }
    
    try {
      // Ensure user ID is a string
      const currentUserId = String(user._id);
      console.log('Fetching unread counts for user', currentUserId);
      
      // Add currentUserId to both query params and request body for maximum compatibility
      const response = await axiosInstance.get(`/messages/unread/count?currentUserId=${currentUserId}`);
      console.log('Unread counts response:', response.data);
      
      // Handle different possible response formats
      if (response.data) {
        // If we have the new format with count and bySender
        if (response.data.bySender) {
          setUnreadCounts(response.data.bySender);
          if (response.data.count > 0) {
            setHasNewMessages(true);
          }
        } 
        // If we have the old format with just count
        else if (typeof response.data.count === 'number') {
          // Legacy format - create empty object
          setUnreadCounts({});
          if (response.data.count > 0) {
            setHasNewMessages(true);
          }
        }
        // If response data is directly the counts object
        else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          setUnreadCounts(response.data);
          
          const totalUnread = Object.values(response.data)
            .reduce((sum, count) => sum + (count || 0), 0);
          
          if (totalUnread > 0) {
            setHasNewMessages(true);
          }
        }
      } else {
        console.error('Unexpected unread counts format:', response.data);
      }
    } catch (error) {
      // Don't show error toast for this one since it's not critical
      console.error('Error fetching unread counts:', error);
    }
  };

  // Load previously selected user from localStorage when component mounts
  useEffect(() => {
    if (isOpen && user?._id) {
      const savedUserId = localStorage.getItem('selectedMessageUser');
      if (savedUserId) {
        console.log('Restoring previously selected user:', savedUserId);
        setSelectedUser(savedUserId);
        fetchMessages(savedUserId);
      }
    }
  }, [isOpen, user]);
  
  // Save selected user to localStorage whenever it changes
  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem('selectedMessageUser', selectedUser);
    }
  }, [selectedUser]);
  
  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (selectedUser && messages.length > 0) {
      try {
        // Save messages for this conversation
        localStorage.setItem(`messages_${selectedUser}`, JSON.stringify(messages));
      } catch (error) {
        console.error('Error saving messages to localStorage:', error);
      }
    }
  }, [messages, selectedUser]);

  // Load messages from localStorage when selecting a user
  const loadSavedMessages = (userId) => {
    try {
      const savedMessages = localStorage.getItem(`messages_${userId}`);
      if (savedMessages) {
        return JSON.parse(savedMessages);
      }
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
    }
    return [];
  };

  // Modified fetchMessages to ensure message area is displayed
  const fetchMessages = async (userId) => {
    if (!user?._id) {
      console.error('Cannot fetch messages: No current user');
      toast.error('User information not available');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Set the selected user immediately to improve the user experience
      setSelectedUser(userId);
      
      // First load any cached messages to show immediately
      const savedMessages = loadSavedMessages(userId);
      if (savedMessages.length > 0) {
        console.log(`Loaded ${savedMessages.length} saved messages from localStorage`);
        setMessages(savedMessages);
      }
      
      console.log(`Fetching messages with user ${userId}`);
      
      // Ensure user ID is a string
      const currentUserId = String(user._id);
      console.log('Current user ID:', currentUserId);
      
      // Add currentUserId to query params to handle cases where req.user is not available
      const response = await axiosInstance.get(`/messages/${userId}?currentUserId=${currentUserId}`);
      console.log('Messages response:', response.data);
      
      // Handle different possible response structures
      let messagesList = [];
      if (Array.isArray(response.data)) {
        messagesList = response.data;
      } else if (response.data.messages && Array.isArray(response.data.messages)) {
        messagesList = response.data.messages;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        messagesList = response.data.data;
      } else {
        console.error('Unexpected messages format:', response.data);
        toast.error('Could not load messages');
        return;
      }
      
      // Filter to ensure we only process messages from the current conversation
      messagesList = messagesList.filter(message => {
        // Extract sender and receiver IDs, handling both string IDs and populated objects
        const messageSenderId = typeof message.senderId === 'object' ? message.senderId?._id : message.senderId;
        const messageReceiverId = typeof message.receiverId === 'object' ? message.receiverId?._id : message.receiverId;
        const currentUserId = user._id;
        
        return (messageSenderId === currentUserId && messageReceiverId === userId) || 
               (messageSenderId === userId && messageReceiverId === currentUserId);
      });
      
      if (messagesList.length > 0) {
        // Reset new message flag when opening a conversation
        setHasNewMessages(false);
        
        // Sort messages by creation time
        const sortedMessages = messagesList.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        
        console.log(`Displaying ${sortedMessages.length} messages`);
        setMessages(sortedMessages);
        
        // Save to localStorage
        localStorage.setItem(`messages_${userId}`, JSON.stringify(sortedMessages));
      }
      
      try {
        // Ensure user ID is a string
        const currentUserId = String(user._id);
        
        // Add currentUserId to query params
        await axiosInstance.put(`/messages/read/${userId}?currentUserId=${currentUserId}`);
        fetchUnreadCounts();
      } catch (readError) {
        console.error('Error marking messages as read:', readError);
      }
    } catch (error) {
      toast.error('Failed to fetch messages');
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
      
      // In mobile view, hide user list and show chat
      if (isMobileView) {
        setShowUserList(false);
      }
    }
  };

  // Add these new state variables for reply functionality
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [isStarredMessage, setIsStarredMessage] = useState({});

  // Add these new handler functions
  const handleReplyToMessage = (message) => {
    setReplyingTo(message);
    // Focus on input field
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleForwardMessage = (message) => {
    setMessageToForward(message);
    setForwardModalOpen(true);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleStarMessage = (messageId) => {
    setIsStarredMessage(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
    
    // Store in localStorage for persistence
    const starredMessages = JSON.parse(localStorage.getItem('starredMessages') || '{}');
    starredMessages[messageId] = !starredMessages[messageId];
    localStorage.setItem('starredMessages', JSON.stringify(starredMessages));
    
    toast.success(isStarredMessage[messageId] ? 'Message unstarred' : 'Message starred');
  };

  // Load starred messages from localStorage
  useEffect(() => {
    try {
      const starredMessages = JSON.parse(localStorage.getItem('starredMessages') || '{}');
      setIsStarredMessage(starredMessages);
    } catch (error) {
      console.error('Error loading starred messages:', error);
    }
  }, []);

  // Update handleSendMessage to ensure changes persist
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Please select a user to message');
      return;
    }

    if (!newMessage.trim() && !selectedFile && !replyingTo) return;

    // Check if we have a valid user ID
    if (!user || !user._id) {
      toast.error('User information is not available');
      console.error('User object is missing or incomplete:', user);
      return;
    }

    const formData = new FormData();
    formData.append('senderId', user._id);
    formData.append('receiverId', selectedUser);
    formData.append('content', newMessage.trim() || '');
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    
    // Include reply information if replying to a message
    if (replyingTo) {
      formData.append('replyToId', replyingTo._id);
    }

    // Generate a unique temp ID for this message
    const tempId = `temp-${Date.now()}`;

    try {
      // Temporarily add the message to the UI immediately
      const tempMessage = {
        _id: tempId,
        senderId: user._id,
        receiverId: selectedUser,
        content: newMessage.trim(),
        file: selectedFile ? URL.createObjectURL(selectedFile) : null,
        createdAt: new Date().toISOString(),
        status: 'sending',
        replyTo: replyingTo
      };
      
      const updatedMessages = [...messages, tempMessage];
      setMessages(updatedMessages);
      
      // Save to localStorage immediately
      localStorage.setItem(`messages_${selectedUser}`, JSON.stringify(updatedMessages));
      
      setNewMessage('');
      setSelectedFile(null);
      setReplyingTo(null);
      
      const response = await axiosInstance.post('/messages/send', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Send message response:', response.data); // Debug the response
      
      // Handle different possible response structures
      let newMessageData = null;
      if (response.data && typeof response.data === 'object') {
        if (response.data._id) {
          // Direct message object returned
          newMessageData = response.data;
        } else if (response.data.data && response.data.data._id) {
          // Message wrapped in data property
          newMessageData = response.data.data;
        } else if (response.data.message && typeof response.data.message === 'object') {
          // Message wrapped in message property
          newMessageData = response.data.message;
        }
      }
      
      if (newMessageData) {
        // Replace the temp message with the real one
        const updatedMessagesWithReal = messages.map(msg => 
          msg._id === tempId ? {...newMessageData, status: 'sent'} : msg
        );
        
        setMessages(updatedMessagesWithReal);
        
        // Save to localStorage with the real message
        localStorage.setItem(`messages_${selectedUser}`, JSON.stringify(updatedMessagesWithReal));
        
        // Store the message status
        setMessageStatus(prev => ({
          ...prev,
          [newMessageData._id]: 'sent'
        }));
        
        // After 1 second, update the status to "delivered" to simulate delivery
        setTimeout(() => {
          setMessageStatus(prev => ({
            ...prev,
            [newMessageData._id]: 'delivered'
          }));
          
          // Update the message in the messages array
          const updatedMessagesWithDelivered = updatedMessagesWithReal.map(msg => 
            msg._id === newMessageData._id ? {...msg, status: 'delivered'} : msg
          );
          
          setMessages(updatedMessagesWithDelivered);
          
          // Save to localStorage with delivered status
          localStorage.setItem(`messages_${selectedUser}`, JSON.stringify(updatedMessagesWithDelivered));
        }, 1000);
        
        fetchUnreadCounts();
      } else {
        console.error('Unexpected send message response:', response.data);
        // Update the temp message status
        const updatedMessagesWithError = messages.map(msg => 
          msg._id === tempId ? {...msg, status: 'error'} : msg
        );
        
        setMessages(updatedMessagesWithError);
        
        // Save error state to localStorage
        localStorage.setItem(`messages_${selectedUser}`, JSON.stringify(updatedMessagesWithError));
        
        // Refresh messages to show the sent message
        fetchMessages(selectedUser);
      }
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
      
      // Update the temp message to show error
      const updatedMessagesWithError = messages.map(msg => 
        msg._id === tempId ? {...msg, status: 'error'} : msg
      );
      
      setMessages(updatedMessagesWithError);
      
      // Save error state to localStorage
      localStorage.setItem(`messages_${selectedUser}`, JSON.stringify(updatedMessagesWithError));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size exceeds 5MB limit');
        return;
      }
      setSelectedFile(file);
      // Focus on the input after selecting a file
      inputRef.current?.focus();
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    // Send typing indicator to the server (would require socket.io in a real implementation)
    setIsTyping(e.target.value.length > 0);
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojis(false);
    inputRef.current?.focus();
  };

  // Simple emoji picker
  const emojis = ['😊', '😂', '❤️', '👍', '🙏', '🎉', '🔥', '👋', '😎', '🤔'];

  const filteredUsers = users.filter(u => 
    u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.middleName?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const goBackToUserList = () => {
    setShowUserList(true);
    if (menuOpen) {
      setMenuOpen(false);
    }
  };

  // Update toggleMenu function to display the menu content
  const toggleMenu = () => {
    // Toggle the menu state
    setMenuOpen(!menuOpen);
  };

  // Add a menu content component that appears when menuOpen is true
  const renderMenuContent = () => {
    // We still need to render the component even when not open for the animation to work
    return (
      <>
        {/* Overlay behind the menu */}
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${menuOpen ? 'bg-opacity-30 z-40' : 'bg-opacity-0 pointer-events-none'}`}
          onClick={() => setMenuOpen(false)}
        />
        
        {/* Menu content */}
        <div 
          className={`absolute left-0 top-[48px] z-50 w-64 bg-white shadow-lg border-r border-gray-200 h-[calc(100%-48px)] overflow-y-auto transition-transform duration-300 transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="p-3 border-b flex flex-col">
            <h3 className="font-semibold text-gray-700 text-sm">Menu</h3>
            <div className="flex flex-col mt-2 gap-1">
              <button 
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md text-gray-700 text-sm"
                onClick={createGroupChat}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                New Group Chat
              </button>
              <button 
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md text-gray-700 text-sm"
                onClick={viewStarredMessages}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                Starred Messages
              </button>
              <button 
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md text-gray-700 text-sm"
                onClick={openChatSettings}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                Settings
              </button>
              <button 
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md text-gray-700 text-sm"
                onClick={viewArchivedChats}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8"></polyline>
                  <rect x="1" y="3" width="22" height="5"></rect>
                  <line x1="10" y1="12" x2="14" y2="12"></line>
                </svg>
                Archived Chats
              </button>
            </div>
          </div>
          
          <div className="p-3 border-b">
            <h3 className="font-semibold text-gray-700 text-sm mb-2">Status</h3>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center text-white">
                <FiUser size={16} />
              </div>
              <div>
                <p className="text-sm font-medium">Your Status</p>
                <p className="text-xs text-green-500">{userStatus}</p>
              </div>
            </div>
            <button 
              className="mt-2 text-blue-500 text-xs font-medium hover:underline"
              onClick={updateUserStatus}
            >
              Update Status
            </button>
          </div>
          
          <div className="p-3">
            <button 
              className="w-full py-2 rounded-lg bg-red-50 text-red-500 text-sm font-medium hover:bg-red-100 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Close Menu
            </button>
          </div>
        </div>
      </>
    );
  };

  // Improve the toggleUserList function to preserve selected user
  const toggleUserList = () => {
    // Toggle the visibility of the user list
    setShowUserList(!showUserList);
    
    // Close the menu when toggling user list
    if (menuOpen) {
      setMenuOpen(false);
    }
    
    // When hiding user list, ensure messages are visible with current selected user
    if (showUserList && selectedUser && isMobileView) {
      console.log("Hiding user list, showing messages for", selectedUser);
    }
  };

  // Add a new function to handle the view mode
  const setMessageView = (userId) => {
    fetchMessages(userId);
    if (isMobileView) {
      setShowUserList(false);
    }
    
    // Add this line to select the user
    setSelectedUser(userId);
  };

  // Add search message functionality
  const [searchMessageQuery, setSearchMessageQuery] = useState('');
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  const searchMessages = () => {
    if (!searchMessageQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }
    
    const trimmedQuery = searchMessageQuery.trim().toLowerCase();
    
    // First filter for current conversation only
    const conversationMessages = messages.filter(message => {
      // Extract sender and receiver IDs, handling both string IDs and populated objects
      const messageSenderId = typeof message.senderId === 'object' ? message.senderId?._id : message.senderId;
      const messageReceiverId = typeof message.receiverId === 'object' ? message.receiverId?._id : message.receiverId;
      const currentUserId = user?._id;
      
      return (messageSenderId === currentUserId && messageReceiverId === selectedUser) || 
             (messageSenderId === selectedUser && messageReceiverId === currentUserId);
    });
    
    // Search in message content for the current conversation only
    const results = conversationMessages.filter(message => 
      message.content && message.content.toLowerCase().includes(trimmedQuery)
    );
    
    setSearchResults(results);
    
    if (results.length === 0) {
      toast.error('No messages found matching your search');
    } else {
      toast.success(`Found ${results.length} message(s)`);
      
      // Scroll to the first result
      if (results.length > 0 && messageRefs.current[results[0]._id]) {
        messageRefs.current[results[0]._id].scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  };
  
  const renderDateSeparator = (dateString) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };
  
  // Fix the groupedMessages function to filter messages for the current conversation only
  const groupedMessages = () => {
    const groups = {};
    
    // First filter messages for current conversation only
    const conversationMessages = messages.filter(message => {
      // Extract sender and receiver IDs, handling both string IDs and populated objects
      const messageSenderId = typeof message.senderId === 'object' ? message.senderId?._id : message.senderId;
      const messageReceiverId = typeof message.receiverId === 'object' ? message.receiverId?._id : message.receiverId;
      const currentUserId = user?._id;
      
      return (messageSenderId === currentUserId && messageReceiverId === selectedUser) || 
             (messageSenderId === selectedUser && messageReceiverId === currentUserId);
    });
    
    // Use search results if searching, otherwise use filtered conversation messages
    const messagesToGroup = isSearchingMessages && searchResults.length > 0 
      ? searchResults 
      : conversationMessages;
    
    messagesToGroup.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  // Add new state and refs for pull-to-refresh functionality
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullStartY = useRef(null);
  const messageContainerRef = useRef(null);

  const handleTouchStartPull = (e) => {
    // Only enable pull when already at the top of the container
    if (messageContainerRef.current && messageContainerRef.current.scrollTop <= 0) {
      pullStartY.current = e.touches[0].clientY;
    } else {
      pullStartY.current = null;
    }
  };

  const handleTouchMovePull = (e) => {
    if (!pullStartY.current) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - pullStartY.current;
    
    // Only allow pulling down, not up
    if (diff > 0) {
      // Resist pulling with a dampening factor
      const dampedDiff = Math.min(80, diff * 0.5);
      setPullDistance(dampedDiff);
      setIsPulling(true);
      
      // Prevent scrolling while pulling
      e.preventDefault();
    }
  };

  const handleTouchEndPull = () => {
    if (!isPulling) return;
    
    // If pulled past threshold, refresh messages
    if (pullDistance > 40) {
      refreshMessages();
    }
    
    // Reset pull state
    setPullDistance(0);
    setIsPulling(false);
    pullStartY.current = null;
  };

  const refreshMessages = async () => {
    if (!selectedUser || !user?._id) return;
    
    toast.success('Refreshing messages...');
    setIsLoading(true);
    
    try {
      // Clear any search results
      resetSearch();
      
      // Fetch latest messages
      const response = await axiosInstance.get(`/messages/${selectedUser}?currentUserId=${user._id}`);
      
      console.log('Refreshed messages response:', response.data);
      
      // Handle response format
      let messagesList = [];
      if (Array.isArray(response.data)) {
        messagesList = response.data;
      } else if (response.data.messages && Array.isArray(response.data.messages)) {
        messagesList = response.data.messages;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        messagesList = response.data.data;
      } else {
        console.error('Unexpected messages format:', response.data);
        toast.error('Could not refresh messages');
        return;
      }
      
      // Filter to ensure we only process messages from the current conversation
      messagesList = messagesList.filter(message => {
        // Extract sender and receiver IDs, handling both string IDs and populated objects
        const messageSenderId = typeof message.senderId === 'object' ? message.senderId?._id : message.senderId;
        const messageReceiverId = typeof message.receiverId === 'object' ? message.receiverId?._id : message.receiverId;
        const currentUserId = user._id;
        
        return (messageSenderId === currentUserId && messageReceiverId === selectedUser) || 
               (messageSenderId === selectedUser && messageReceiverId === currentUserId);
      });
      
      if (messagesList.length > 0) {
        // Sort messages by creation time
        const sortedMessages = messagesList.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        
        console.log(`Displaying ${sortedMessages.length} refreshed messages`);
        setMessages(sortedMessages);
        
        // Save to localStorage
        localStorage.setItem(`messages_${selectedUser}`, JSON.stringify(sortedMessages));
        
        toast.success('Messages refreshed');
      } else {
        toast.info('No new messages found');
      }
      
      // Mark messages as read
      await axiosInstance.put(`/messages/read/${selectedUser}?currentUserId=${user._id}`);
      fetchUnreadCounts();
      
    } catch (error) {
      toast.error('Failed to refresh messages');
      console.error('Error refreshing messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add voice recording state and functions
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callStatus, setCallStatus] = useState({ active: false });
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callTimer, setCallTimer] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const peerConnectionRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks = [];
      mediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });
      
      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      });
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      clearInterval(timerRef.current);
      
      toast.success('Recording stopped');
    }
  };
  
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      clearInterval(timerRef.current);
      
      // Clear the audio blob
      setAudioBlob(null);
      
      toast.error('Recording cancelled');
    }
  };

  const sendAudioMessage = async () => {
    if (!audioBlob || !selectedUser) return;
    
    const formData = new FormData();
    formData.append('senderId', user._id);
    formData.append('receiverId', selectedUser);
    formData.append('content', 'Audio message');
    
    // Create a file from the blob
    const audioFile = new File([audioBlob], 'audio-message.webm', { type: 'audio/webm' });
    formData.append('file', audioFile);
    
    // Generate a unique temp ID
    const tempId = `temp-${Date.now()}`;
    
    try {
      // Add temporary message to UI
      const tempMessage = {
        _id: tempId,
        senderId: user._id,
        receiverId: selectedUser,
        content: 'Audio message',
        file: URL.createObjectURL(audioBlob),
        createdAt: new Date().toISOString(),
        status: 'sending'
      };
      
      setMessages([...messages, tempMessage]);
      setAudioBlob(null);
      
      // Send the audio via API
      const response = await axiosInstance.post('/messages/send', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Send audio response:', response.data);
      
      // Handle response similar to text messages
      let newMessageData = null;
      if (response.data && typeof response.data === 'object') {
        if (response.data._id) {
          newMessageData = response.data;
        } else if (response.data.data && response.data.data._id) {
          newMessageData = response.data.data;
        } else if (response.data.message && typeof response.data.message === 'object') {
          newMessageData = response.data.message;
        }
      }
      
      if (newMessageData) {
        // Replace the temp message with the real one
        setMessages(messages.map(msg => 
          msg._id === tempId ? {...newMessageData, status: 'sent'} : msg
        ));
        
        // Update message status
        setMessageStatus(prev => ({
          ...prev,
          [newMessageData._id]: 'sent'
        }));
        
        toast.success('Audio message sent');
      } else {
        console.error('Unexpected send audio response:', response.data);
        toast.error('Failed to send audio message');
      }
    } catch (error) {
      console.error('Error sending audio message:', error);
      toast.error('Failed to send audio message');
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Clean up call resources when component unmounts
  useEffect(() => {
    return () => {
      endCurrentCall();
    };
  }, []);

  // Update formatCallDuration to use the call timer
  const formatCallDuration = (startTime) => {
    if (!startTime) return '00:00';
    
    // If we have a call timer, use it directly
    if (callTimer) {
      const minutes = Math.floor(callTimer / 60);
      const seconds = callTimer % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Fallback to calculating based on start time
    const diff = new Date() - new Date(startTime);
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const initiateVoiceCall = async () => {
    const receiver = users.find(u => u._id === selectedUser);
    if (!receiver) return;
    
    try {
      // Set up call state
      setCallStatus({
        active: true,
        type: 'voice',
        with: receiver,
        startTime: new Date(),
        status: 'connecting'
      });
      
      // Get user media for audio only
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false
      });
      
      setLocalStream(stream);
      
      // Initialize WebRTC connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;
      
      // Add local stream to connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Listen for remote stream
      peerConnection.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };
      
      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // In a real app, you would send this offer to the receiver via your signaling server
      // For demo purposes, we'll simulate a successful connection after a delay
      setTimeout(() => {
        setCallStatus(prev => ({
          ...prev,
          status: 'connected'
        }));
        
        // Start call timer
        let seconds = 0;
        const timerInterval = setInterval(() => {
          seconds++;
          setCallTimer(seconds);
        }, 1000);
        
        setCallStatus(prev => ({
          ...prev, 
          timerInterval
        }));
        
        toast.success(`Connected to ${receiver.firstName}`);
      }, 1500);
      
      toast.success(`Calling ${receiver.firstName}...`);
      
    } catch (error) {
      console.error('Error starting voice call:', error);
      toast.error('Failed to start call. Please check your microphone permissions.');
      endCurrentCall();
    }
  };

  const initiateVideoCall = async () => {
    const receiver = users.find(u => u._id === selectedUser);
    if (!receiver) return;
    
    try {
      // Set up call state
      setCallStatus({
        active: true,
        type: 'video',
        with: receiver,
        startTime: new Date(),
        status: 'connecting'
      });
      
      // Get user media with video
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: true
      });
      
      setLocalStream(stream);
      
      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Initialize WebRTC connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;
      
      // Add local stream to connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Listen for remote stream
      peerConnection.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        
        // Display remote video
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      
      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // In a real app, you would send this offer to the receiver via your signaling server
      // For demo purposes, we'll simulate a successful connection after a delay
      setTimeout(() => {
        // Create a mock remote stream (in a real app this would come from the other user)
        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
          .then(mockRemoteStream => {
            setRemoteStream(mockRemoteStream);
            
            // Display remote video
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = mockRemoteStream;
            }
            
            setCallStatus(prev => ({
              ...prev,
              status: 'connected'
            }));
            
            // Start call timer
            let seconds = 0;
            const timerInterval = setInterval(() => {
              seconds++;
              setCallTimer(seconds);
            }, 1000);
            
            setCallStatus(prev => ({
              ...prev, 
              timerInterval
            }));
            
            toast.success(`Connected to ${receiver.firstName}`);
          });
      }, 1500);
      
      toast.success(`Calling ${receiver.firstName}...`);
      
    } catch (error) {
      console.error('Error starting video call:', error);
      toast.error('Failed to start call. Please check your camera and microphone permissions.');
      endCurrentCall();
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
      toast.success(isMuted ? 'Microphone unmuted' : 'Microphone muted');
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
      toast.success(isVideoOff ? 'Camera turned on' : 'Camera turned off');
    }
  };

  const endCurrentCall = () => {
    try {
      // Safely check if callStatus exists before accessing its properties
      if (callStatus && callStatus.timerInterval) {
        clearInterval(callStatus.timerInterval);
      }
      
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      // Stop all tracks in the streams
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        setRemoteStream(null);
      }
      
      // Reset state
      setCallTimer(null);
      setIsMuted(false);
      setIsVideoOff(false);
      setCallStatus({ active: false });
      
      console.log('Call resources cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up call resources:', error);
    }
  };

  // Hamburger menu functionality
  const createGroupChat = () => {
    // Set up state for group chat modal
    setGroupChatModalOpen(true);
    setMenuOpen(false);
  };

  const viewStarredMessages = () => {
    // Filter messages to only show starred ones
    setIsViewingStarred(true);
    setMenuOpen(false);
    
    // Get all starred message IDs
    const starredMessageIds = Object.entries(isStarredMessage)
      .filter(([_, isStarred]) => isStarred)
      .map(([id]) => id);
    
    if (starredMessageIds.length === 0) {
      toast.info('No starred messages found');
      return;
    }
    
    // Filter current messages to only show starred ones
    const starredOnly = messages.filter(msg => 
      starredMessageIds.includes(msg._id)
    );
    
    setStarredMessages(starredOnly);
    toast.success(`Showing ${starredOnly.length} starred messages`);
  };

  const openChatSettings = () => {
    setChatSettingsOpen(true);
    setMenuOpen(false);
  };

  const viewArchivedChats = () => {
    setIsViewingArchived(true);
    setMenuOpen(false);
    toast.info('Archived chats feature coming soon');
  };

  const updateUserStatus = () => {
    const statuses = ['Online', 'Away', 'Do not disturb', 'Invisible'];
    const currentIndex = statuses.indexOf(userStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    setUserStatus(nextStatus);
    toast.success(`Status updated to: ${nextStatus}`);
  };

  // Add new state variables for modals
  const [groupChatModalOpen, setGroupChatModalOpen] = useState(false);
  const [chatSettingsOpen, setChatSettingsOpen] = useState(false);
  const [isViewingStarred, setIsViewingStarred] = useState(false);
  const [isViewingArchived, setIsViewingArchived] = useState(false);
  const [starredMessages, setStarredMessages] = useState([]);

  // Add group chat modal
  const renderGroupChatModal = () => {
    if (!groupChatModalOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 m-4">
          <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h3 className="text-lg font-semibold">Create Group Chat</h3>
            <button 
              onClick={() => setGroupChatModalOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <FiX size={20} />
            </button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
            <input 
              type="text" 
              placeholder="Enter group name"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Add Participants</label>
            <div className="border rounded-lg p-2 max-h-40 overflow-y-auto">
              {users.map(user => (
                <div key={user._id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                  <input type="checkbox" className="mr-2" />
                  <div className="flex items-center">
                    {user.photo ? (
                      <img 
                        src={getImageUrl(user.photo)} 
                        className="w-8 h-8 rounded-full mr-2 object-cover"
                        alt={user.firstName}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                        <span className="text-blue-600 font-semibold">{user.firstName[0]}</span>
                      </div>
                    )}
                    <span>{user.firstName} {user.middleName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button 
              onClick={() => setGroupChatModalOpen(false)}
              className="mr-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                toast.success('Group created successfully!');
                setGroupChatModalOpen(false);
              }}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Group
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add chat settings modal
  const renderChatSettings = () => {
    if (!chatSettingsOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 m-4">
          <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h3 className="text-lg font-semibold">Chat Settings</h3>
            <button 
              onClick={() => setChatSettingsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <FiX size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span>Message Notifications</span>
              </div>
              <div className="relative inline-block w-10 align-middle select-none">
                <input type="checkbox" id="notifications" className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-blue-600" />
                <label htmlFor="notifications" className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                <span>Sounds</span>
              </div>
              <div className="relative inline-block w-10 align-middle select-none">
                <input type="checkbox" id="sounds" className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-blue-600" defaultChecked />
                <label htmlFor="sounds" className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>End-to-End Encryption</span>
              </div>
              <div className="relative inline-block w-10 align-middle select-none">
                <input type="checkbox" id="encryption" className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-blue-600" defaultChecked />
                <label htmlFor="encryption" className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </div>
            
            <div 
              className="flex items-center gap-3 p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
              onClick={() => {
                toast.success('Chat cleared successfully');
                setChatSettingsOpen(false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Clear Chat</span>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => setChatSettingsOpen(false)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Other state variables
  const [isResizing, setIsResizing] = useState({ active: false, position: null });
  const [containerSize, setContainerSize] = useState({ width: 400, height: 600 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [containerPos, setContainerPos] = useState({ x: 0, y: 0 });

  // Add handlers for dragging
  const handleDragStart = (e) => {
    if (e.target.closest('.resize-handle')) return;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    setIsDragging(true);
    setDragStartPos({
      x: clientX - containerPos.x,
      y: clientY - containerPos.y,
      width: containerSize.width, 
      height: containerSize.height
    });
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    setContainerPos({
      x: clientX - dragStartPos.x,
      y: clientY - dragStartPos.y
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Save position and size to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('messagingSystemPosition', JSON.stringify(containerPos));
      localStorage.setItem('messagingSystemSize', JSON.stringify(containerSize));
    } catch (err) {
      console.error('Error saving messaging system position/size:', err);
    }
  }, [containerPos, containerSize]);

  // Load position and size from localStorage on mount
  useEffect(() => {
    try {
      const savedPos = localStorage.getItem('messagingSystemPosition');
      const savedSize = localStorage.getItem('messagingSystemSize');
      
      if (savedPos) {
        setContainerPos(JSON.parse(savedPos));
      }
      
      if (savedSize) {
        setContainerSize(JSON.parse(savedSize));
      }
    } catch (err) {
      console.error('Error loading messaging system position/size:', err);
    }
  }, []);

  // Create a ref for the container element
  const containerRef = useRef(null);
  
  // Other refs
  const messageRefs = useRef({});

  // Fix the getImageUrl function to not use process.env
  const getImageUrl = (photo) => {
    // Check if the URL already has a protocol
    if (photo && (photo.startsWith('http://') || photo.startsWith('https://'))) {
      return photo;
    }
    
    // Use a hardcoded URL without environment variables
    return `http://localhost:5001/uploads/${photo}`;
  };

  // Improved resize functionality
  const resizeHandles = [
    { position: 'right', cursor: 'ew-resize', className: 'absolute right-0 top-0 w-1 h-full' },
    { position: 'bottom', cursor: 'ns-resize', className: 'absolute bottom-0 left-0 w-full h-1' },
    { position: 'bottom-right', cursor: 'nwse-resize', className: 'absolute bottom-0 right-0 w-6 h-6' }
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
    
    if (isResizing.position === 'right' || isResizing.position === 'bottom-right') {
      newSize.width = Math.max(320, dragStartPos.width + deltaX);
    }
    
    if (isResizing.position === 'bottom' || isResizing.position === 'bottom-right') {
      newSize.height = Math.max(400, dragStartPos.height + deltaY);
    }
    
    setContainerSize(newSize);
  };

  const handleResizeEnd = () => {
    setIsResizing({ active: false, position: null });
  };

  // Update the useEffect for mouse/touch events to handle improved resizing
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

  // Main container render
  
  // Add resetSearch function
  const resetSearch = () => {
    setIsSearchingMessages(false);
    setSearchMessageQuery('');
    setSearchResults([]);
  };

  return (
    <>
      {renderGroupChatModal()}
      {renderChatSettings()}
      {/* Main messaging container */}
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          top: `${containerPos.y}px`,
          left: `${containerPos.x}px`,
          width: `${containerSize.width}px`,
          height: `${containerSize.height}px`,
          zIndex: 50
        }}
        className={`bg-white rounded-lg shadow-2xl overflow-hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Drag handle - header */}
        <div 
          className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-3 flex items-center justify-between cursor-move"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="flex items-center">
            <button 
              onClick={toggleMenu} 
              className="p-1 mr-3 text-white rounded-full hover:bg-white/10 transition-all"
            >
              <div className={`transition-transform duration-300 ${menuOpen ? 'rotate-90' : ''}`}>
                <RiMenu3Line size={20} />
              </div>
            </button>
            <h3 className="font-semibold">Messages</h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose} 
              className="p-1 rounded-full hover:bg-white/10"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
        
        {/* Main content container */}
        <div className="flex h-[calc(100%-48px)] overflow-hidden bg-gray-50">
          {/* Render hamburger menu */}
          {renderMenuContent()}
          
          {/* User list column */}
          <div className={`${showUserList ? 'w-full' : 'w-0'} h-full bg-white md:max-w-xs md:min-w-[240px] md:w-[30%] md:block border-r transition-all duration-300 overflow-hidden`}>
            {/* Search bar */}
            <div className="p-3 border-b sticky top-0 bg-white z-10">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 pl-9 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FiSearch className="absolute left-3 top-2.5 text-gray-500" size={16} />
              </div>
            </div>
            
            {/* User list */}
            <div className="overflow-y-auto h-[calc(100%-56px)]">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No users found</div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => setMessageView(user._id)}
                    className={`p-3 flex items-center cursor-pointer hover:bg-gray-100 transition-colors ${
                      selectedUser === user._id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="relative">
                      {user.photo ? (
                        <img
                          src={getImageUrl(user.photo)}
                          className="w-12 h-12 rounded-full object-cover mr-3"
                          alt={user.firstName}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3 font-semibold">
                          {user.firstName[0]}
                        </div>
                      )}
                      {userStatus === 'Online' && (
                        <span className="absolute bottom-0 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-800 truncate">{user.firstName} {user.middleName}</h4>
                        {unreadCounts[user._id] && unreadCounts[user._id] > 0 && (
                          <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCounts[user._id]}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm truncate">
                        {user.online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Messages column */}
          <div className={`${showUserList ? 'hidden md:block' : 'w-full'} h-full flex-1 flex flex-col overflow-hidden`}>
            {!selectedUser ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center p-6">
                  <FiMessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
                  <p className="max-w-xs text-sm">
                    Choose a contact from the list to start messaging
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="p-3 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                  <div className="flex items-center">
                    {isMobileView && (
                      <button
                        onClick={goBackToUserList}
                        className="p-1 mr-2 rounded-full hover:bg-gray-100"
                      >
                        <FiArrowLeft size={16} />
                      </button>
                    )}
                    {selectedUser && (
                      <div className="flex items-center">
                        {(() => {
                          const chatUser = users.find(u => u._id === selectedUser);
                          return chatUser ? (
                            <>
                              {chatUser.photo ? (
                                <img
                                  src={getImageUrl(chatUser.photo)}
                                  className="w-10 h-10 rounded-full object-cover mr-3"
                                  alt={chatUser.firstName}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3 font-semibold">
                                  {chatUser.firstName[0]}
                                </div>
                              )}
                              <div>
                                <h4 className="font-medium text-gray-800">{chatUser.firstName} {chatUser.middleName}</h4>
                                <p className="text-xs text-gray-500">
                                  {isTyping ? 'Typing...' : userStatus}
                                </p>
                              </div>
                            </>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Call controls */}
                    <button
                      onClick={initiateVoiceCall}
                      className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
                      title="Voice call"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </button>
                    <button
                      onClick={initiateVideoCall}
                      className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
                      title="Video call"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                      </svg>
                    </button>
                    
                    {/* Search in conversation */}
                    <button
                      onClick={() => setIsSearchingMessages(true)}
                      className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
                      title="Search in conversation"
                    >
                      <FiSearch size={18} />
                    </button>
                  </div>
                </div>

                {/* Search message bar */}
                {isSearchingMessages && (
                  <div className="p-2 border-b flex items-center bg-white">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search in conversation..."
                        value={searchMessageQuery}
                        onChange={(e) => setSearchMessageQuery(e.target.value)}
                        className="w-full p-2 pl-8 bg-gray-100 rounded-full text-sm focus:outline-none"
                        autoFocus
                      />
                      <FiSearch className="absolute left-3 top-3 text-gray-500" size={14} />
                    </div>
                    <button
                      onClick={searchMessages}
                      className="ml-2 px-3 py-1 bg-blue-500 text-white rounded-full text-sm"
                    >
                      Search
                    </button>
                    <button
                      onClick={resetSearch}
                      className="ml-2 p-2 text-gray-500 hover:text-gray-700"
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                )}
                
                {/* Messages area */}
                <div 
                  ref={messageContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                  onTouchStart={handleTouchStartPull}
                  onTouchMove={handleTouchMovePull}
                  onTouchEnd={handleTouchEndPull}
                >
                  {/* Pull to refresh indicator */}
                  {isPulling && (
                    <div 
                      className="sticky top-0 left-0 w-full flex justify-center items-center text-blue-500 transition-transform duration-300"
                      style={{ transform: `translateY(${pullDistance}px)` }}
                    >
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{pullDistance > 40 ? 'Release to refresh' : 'Pull to refresh'}</span>
                    </div>
                  )}
                  
                  {/* Group messages by date */}
                  {Object.entries(groupedMessages()).map(([date, msgs]) => (
                    <div key={date}>
                      <div className="flex justify-center mb-4">
                        <span className="px-3 py-1 bg-gray-200 rounded-full text-sm text-gray-600">
                          {renderDateSeparator(date)}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {msgs.map((message) => {
                          const isOwnMessage = message.senderId === user._id;
                          return (
                            <div
                              key={message._id}
                              ref={(el) => (messageRefs.current[message._id] = el)}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                  isOwnMessage
                                    ? 'bg-blue-500 text-white rounded-br-none'
                                    : 'bg-white border rounded-bl-none'
                                }`}
                              >
                                {/* Reply preview */}
                                {message.replyTo && (
                                  <div 
                                    className={`text-xs p-2 rounded mb-2 border-l-2 ${
                                      isOwnMessage ? 'bg-blue-600 border-blue-300' : 'bg-gray-100 border-gray-300'
                                    }`}
                                  >
                                    <div className={isOwnMessage ? 'text-blue-200' : 'text-gray-500'}>
                                      {message.replyTo.senderId === user._id ? 'You' : users.find(u => u._id === message.replyTo.senderId)?.firstName || 'User'}
                                    </div>
                                    <div className="truncate">
                                      {message.replyTo.content}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Message content */}
                                <p>{message.content}</p>
                                
                                {/* File attachment */}
                                {message.file && (
                                  <div className="mt-2">
                                    {message.file.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                      <img
                                        src={message.file}
                                        alt="Attachment"
                                        className="max-w-full rounded-lg cursor-pointer hover:opacity-90"
                                        onClick={() => window.open(message.file, '_blank')}
                                      />
                                    ) : message.file.match(/\.(mp3|wav|ogg)$/i) ? (
                                      <audio controls className="w-full mt-1">
                                        <source src={message.file} />
                                        Your browser does not support the audio element.
                                      </audio>
                                    ) : (
                                      <div
                                        className="flex items-center p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                                        onClick={() => window.open(message.file, '_blank')}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                          <polyline points="14 2 14 8 20 8"></polyline>
                                          <line x1="16" y1="13" x2="8" y2="13"></line>
                                          <line x1="16" y1="17" x2="8" y2="17"></line>
                                          <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                        <span className="ml-2 text-sm">Attachment</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Message timestamp and status */}
                                <div className={`flex text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'} justify-end items-center space-x-1`}>
                                  <span>
                                    {new Date(message.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                  {isOwnMessage && (
                                    messageStatus[message._id] === 'delivered' ? (
                                      <FiCheckCircle size={12} />
                                    ) : messageStatus[message._id] === 'sent' ? (
                                      <FiCheck size={12} />
                                    ) : null
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Reply bar */}
                {replyingTo && (
                  <div className="p-2 flex items-center bg-gray-100 border-t">
                    <div className="flex-1 pl-2 border-l-2 border-blue-500">
                      <div className="text-xs text-gray-500">
                        Replying to {replyingTo.senderId === user._id ? 'yourself' : users.find(u => u._id === replyingTo.senderId)?.firstName || 'User'}
                      </div>
                      <div className="text-sm truncate pr-2">{replyingTo.content}</div>
                    </div>
                    <button
                      onClick={handleCancelReply}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                )}
                
                {/* Selected file preview */}
                {selectedFile && (
                  <div className="p-2 flex items-center bg-gray-100 border-t">
                    <div className="flex-1 pl-2">
                      <div className="text-xs text-gray-500">Selected file</div>
                      <div className="text-sm truncate">{selectedFile.name}</div>
                    </div>
                    <button
                      onClick={removeSelectedFile}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                )}
                
                {/* Message input */}
                <div className="p-3 border-t flex items-end">
                  <div className="flex items-center space-x-2 mr-2">
                    <label className="p-2 rounded-full hover:bg-gray-100 text-gray-700 cursor-pointer">
                      <FiPaperclip size={18} />
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,audio/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      />
                    </label>
                    <button
                      onClick={() => setShowEmojis(!showEmojis)}
                      className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
                    >
                      <BsEmojiSmile size={18} />
                    </button>
                  </div>
                  
                  <div className="relative flex-1">
                    <textarea
                      ref={inputRef}
                      value={newMessage}
                      onChange={handleTyping}
                      placeholder="Type a message..."
                      className="w-full p-2 pr-10 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 max-h-32 min-h-[40px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    {isRecording && (
                      <div className="absolute inset-0 bg-white border rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-red-500 animate-pulse mb-1">Recording... {formatTime(recordingTime)}</div>
                          <div className="flex justify-center space-x-4">
                            <button
                              onClick={cancelRecording}
                              className="px-3 py-1 bg-gray-200 rounded text-gray-700 text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={stopRecording}
                              className="px-3 py-1 bg-blue-500 rounded text-white text-sm"
                            >
                              Stop
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {audioBlob && !isRecording && (
                      <div className="absolute inset-0 bg-white border rounded-lg flex items-center justify-center">
                        <div className="text-center w-full px-3">
                          <audio className="w-full mb-2" controls src={URL.createObjectURL(audioBlob)}></audio>
                          <div className="flex justify-center space-x-3">
                            <button
                              onClick={() => setAudioBlob(null)}
                              className="px-3 py-1 bg-gray-200 rounded text-gray-700 text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={sendAudioMessage}
                              className="px-3 py-1 bg-blue-500 rounded text-white text-sm"
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-2 flex items-center">
                    {newMessage.trim() || selectedFile ? (
                      <button
                        onClick={handleSendMessage}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                      >
                        <FiSend size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-2 rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                          <line x1="12" y1="19" x2="12" y2="23"></line>
                          <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Emoji picker */}
                {showEmojis && (
                  <div className="absolute bottom-16 left-16 bg-white border rounded-lg shadow-lg p-2 z-10">
                    <div className="grid grid-cols-5 gap-2">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => addEmoji(emoji)}
                          className="text-xl hover:bg-gray-100 rounded w-8 h-8 flex items-center justify-center"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Resize handles */}
        {resizeHandles.map(handle => (
          <div 
            key={handle.position}
            className={`${handle.className} resize-handle z-10`}
            style={{ cursor: handle.cursor }}
            onMouseDown={(e) => handleResizeStart(e, handle.position)}
            onTouchStart={(e) => handleResizeStart(e, handle.position)}
          />
        ))}
        
        {/* Corner resize handle with visual indicator */}
        <div 
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-20"
          onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
          onTouchStart={(e) => handleResizeStart(e, 'bottom-right')}
          style={{
            backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '3px 3px',
            backgroundPosition: '0 0',
            opacity: 0.7
          }}
        />
      </div>
    </>
  );
};

export default MessagingSystem; 