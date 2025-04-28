import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-hot-toast";
import "@fontsource/poppins";
import "@fontsource/roboto";
import Login from "../components/auth/Login";
import Header from "./welcome/Header";
import Footer from "./welcome/Footer";
import Home from "./welcome/Home";
import Register from "./welcome/Register";
import About from "./welcome/About";
import Help from "./welcome/Help";
import Contact from "./welcome/Contact";
import { ShieldCheckIcon, LockClosedIcon, XMarkIcon, UserIcon, DocumentTextIcon, SunIcon, MoonIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

// Toast configuration with closeOnClick enabled
const toastConfig = {
  duration: 3000,
  position: 'top-center',
  closeOnClick: true,
  pauseOnHover: true,
  style: {
    background: '#1a2234', // More formal navy-blue background
    color: '#f5f5f5', // Off-white text
    padding: '16px',
    borderRadius: '4px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid #2c3852',
  },
  success: {
    style: {
      background: '#213440',
      color: '#ffffff',
      border: '1px solid #2c4852',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#213440',
    },
  },
  error: {
    style: {
      background: '#3a2329',
      color: '#ffffff',
      border: '1px solid #4c2e36',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#3a2329',
    },
  },
};

function Welcome() {
  const [messages, setMessages] = useState([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sideImages, setSideImages] = useState([]);
  const [time, setTime] = useState(new Date());
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeButton, setActiveButton] = useState('home');
  const messageRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [inmates, setInmates] = useState([]);
  const [advancedView, setAdvancedView] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [statistics, setStatistics] = useState({
    totalVisitors: 0,
    totalInmates: 0,
    totalApprovedVisits: 0,
    pendingVisits: 0
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (messageRef.current) {
      observer.observe(messageRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const messagesResponse = await axiosInstance.get("/managemessages/get-messages");
        if (messagesResponse.data?.messages) {
          const messagesWithFullUrls = messagesResponse.data.messages
            .filter(msg => msg) // Filter out any null messages
            .map(msg => ({
              ...msg,
              image: msg.image ? 
                (msg.image.startsWith('http') ? 
                  msg.image : 
                  `http://localhost:5001${msg.image.startsWith('/') ? '' : '/'}${msg.image}`) 
                : null,
              text: msg.text || "" // Ensure text is never undefined
            }));
          console.log("Messages with corrected URLs:", messagesWithFullUrls);
          setMessages(messagesWithFullUrls);
        } else {
          toast.error("No messages found.", toastConfig);
        }
      } catch (error) {
        console.error("Error fetching content:", error);
        toast.error(`Failed to load content: ${error.response?.data?.message || error.message}`, toastConfig);
      } 
      finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [messages]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setActiveButton('home');
    else if (path === '/register') setActiveButton('register');
    else if (path === '/about') setActiveButton('about');
    else if (path === '/help') setActiveButton('help');
    else if (path === '/contact') setActiveButton('contact');
    else setActiveButton('home');
  }, [location.pathname]);

  useEffect(() => {
    const fetchInmates = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/inmates/allInmates");
        if (response.data?.inmates) {
          setInmates(response.data.inmates);
        } else {
          console.error("Invalid API response:", response);
        }
      } catch (error) {
        console.error("Error fetching inmates:", error);
        toast.error(error.response?.data?.error || "Failed to fetch inmate data.", toastConfig);
      } finally {
        setLoading(false);
      }
    };

    if (isRegisterOpen) {
      fetchInmates();
    }
  }, [isRegisterOpen]);

  // Advanced view effect - fetch additional statistics when advanced view is enabled
  useEffect(() => {
    if (advancedView) {
      fetchStatistics();
    }
  }, [advancedView]);

  const fetchStatistics = async () => {
    try {
      // Simulate fetching statistics data
      // In a real app, this would be an API call to get actual statistics
      setTimeout(() => {
        setStatistics({
          totalVisitors: Math.floor(Math.random() * 1000) + 500,
          totalInmates: Math.floor(Math.random() * 300) + 100,
          totalApprovedVisits: Math.floor(Math.random() * 2000) + 1000,
          pendingVisits: Math.floor(Math.random() * 50) + 10
        });
      }, 1000);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleImageError = (e, fallbackUrl) => {
    console.error("Image failed to load:", e.target.src);
    e.target.src = fallbackUrl;
  };

  // Toggle advanced view
  const toggleAdvancedView = () => {
    setAdvancedView(prev => !prev);
    toast.success(
      advancedView ? "Switched to standard view" : "Switched to advanced view", 
      toastConfig
    );
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Optimize the button click handler with useCallback
  const handleButtonClick = useCallback((buttonName) => {
    if (buttonName === 'login') {
      setIsLoginOpen(true);
      setIsMobileMenuOpen(false);
      return;
    }
    setActiveButton(buttonName);
    setIsMobileMenuOpen(false);
    if (buttonName === 'register') {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [setIsLoginOpen, setIsMobileMenuOpen, setActiveButton]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match", toastConfig);
      return;
    }

    try {
      const response = await axiosInstance.post("/auth/register", {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: "visitor"
      });

      if (response.data && response.data.success) {
        // Store token if provided
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }
        
        // Reset form
        setFormData({
          firstName: "",
          middleName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          phone: "",
        });
        
        return response;
      } else {
        throw new Error(response.data?.message || "Failed to create account");
      }
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };

  // Use useCallback for the close handler to prevent recreation on each render
  const handleLoginClose = useCallback(() => {
    setIsLoginOpen(false);
  }, []);

  const renderContent = () => {
    switch (activeButton) {
      case 'home':
        return <Home 
          messages={messages}
          currentMessageIndex={currentMessageIndex}
          setCurrentMessageIndex={setCurrentMessageIndex}
          sideImages={sideImages}
          loading={loading}
          time={time}
          messageRef={messageRef}
          isVisible={isVisible}
          advancedView={advancedView}
          statistics={statistics}
          darkMode={darkMode}
        />;
      case 'register':
  return (
          <div className={`fixed inset-0 ${darkMode ? 'bg-gray-900/90' : 'bg-black/80'} backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4`}>
            <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} rounded-md w-full h-full sm:h-auto sm:max-w-2xl sm:w-full mx-0 sm:mx-4 max-h-full sm:max-h-[90vh] overflow-y-auto shadow-2xl`}>
              <div className={`sticky top-0 z-10 flex justify-between items-center p-4 sm:p-6 ${darkMode ? 'bg-gray-900' : 'bg-slate-900'} text-white`}>
                <h2 className="text-xl sm:text-2xl font-bold flex items-center">
                  <UserIcon className="h-6 w-6 mr-2 inline-block" />
                  {advancedView ? "Visitor Authorization Portal" : "Visitor Registration"}
                </h2>
            <button
                  onClick={() => setActiveButton('home')}
                  className="p-2 text-white hover:text-gray-300 rounded-full transition-all duration-300"
            >
                  <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
              <div className={`p-4 sm:p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <Register 
                  formData={formData}
                  handleChange={handleChange}
                  handleSubmit={handleSubmit}
                  setShowLoginModal={() => setIsLoginOpen(true)}
                  advancedView={advancedView}
                  darkMode={darkMode}
                />
              </div>
            </div>
          </div>
        );
      case 'about':
        return <About darkMode={darkMode} advancedView={advancedView} />;
      case 'help':
        return <Help darkMode={darkMode} advancedView={advancedView} />;
      case 'contact':
        return <Contact darkMode={darkMode} advancedView={advancedView} />;
      default:
        return <Home 
          messages={messages}
          currentMessageIndex={currentMessageIndex}
          setCurrentMessageIndex={setCurrentMessageIndex}
          sideImages={sideImages}
          loading={loading}
          time={time}
          messageRef={messageRef}
          isVisible={isVisible}
          advancedView={advancedView}
          statistics={statistics}
          darkMode={darkMode}
        />;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#f0f2f5] text-slate-900'} transition-colors duration-300`}>
      <Header 
        activeButton={activeButton}
        handleButtonClick={handleButtonClick}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        darkMode={darkMode}
      />
      
      {/* View Mode Toggle */}
      <div className="fixed top-20 right-4 z-30 flex flex-col gap-2">
        <button 
          onClick={toggleAdvancedView}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} shadow-lg transition-all duration-300 group border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
          aria-label={advancedView ? "Switch to standard view" : "Switch to advanced view"}
        >
          <AdjustmentsHorizontalIcon className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className={`absolute right-full mr-2 whitespace-nowrap ${darkMode ? 'bg-gray-800' : 'bg-white'} ${darkMode ? 'text-gray-200' : 'text-gray-800'} text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {advancedView ? "Standard View" : "Advanced View"}
          </span>
        </button>
        
        <button 
          onClick={toggleDarkMode}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} shadow-lg transition-all duration-300 group border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <SunIcon className="h-6 w-6 text-amber-400" />
          ) : (
            <MoonIcon className="h-6 w-6 text-slate-700" />
          )}
          <span className={`absolute right-full mr-2 whitespace-nowrap ${darkMode ? 'bg-gray-800' : 'bg-white'} ${darkMode ? 'text-gray-200' : 'text-gray-800'} text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </span>
        </button>
      </div>
      
      <main className="pt-16 sm:pt-24">
        {renderContent()}
      </main>

      <Footer handleButtonClick={handleButtonClick} darkMode={darkMode} />

      {isLoginOpen && (
        <div className={`fixed inset-0 ${darkMode ? 'bg-gray-900/80' : 'bg-slate-900/50'} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} rounded-md p-6 sm:p-8 w-full max-w-md sm:max-w-md shadow-xl relative border text-white`}>
            <button
              onClick={handleLoginClose}
              className={`absolute top-3 right-3 p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors duration-200`}
              aria-label="Close login modal"
            >
              <XMarkIcon className={`h-5 sm:h-6 w-5 sm:w-6 ${darkMode ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`} />
            </button>
            <div className="flex items-center space-x-4 mb-6 sm:mb-8">
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-blue-50'} p-3 rounded-md`}>
                <LockClosedIcon className={`h-8 sm:h-10 w-8 sm:w-10 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h2 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>
                  {advancedView ? "Secure Authentication Portal" : "Authorized Access"}
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {advancedView ? "Federal Correctional Authority Access Control" : "Secure access to the correctional facility system"}
                </p>
              </div>
            </div>
            <div className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} p-4 rounded-md border`}>
              <Login onClose={handleLoginClose} isVisitor={true} darkMode={darkMode} advancedView={advancedView} />
            </div>
            <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600">
                <div className={`flex items-center ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-blue-50 text-gray-700'} px-3 py-2 rounded-md`}>
                  <LockClosedIcon className={`h-4 sm:h-5 w-4 sm:w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
                  <span>Secure Connection</span>
                </div>
                <div className={`flex items-center ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-blue-50 text-gray-700'} px-3 py-2 rounded-md`}>
                  <DocumentTextIcon className={`h-4 sm:h-5 w-4 sm:w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
                  <span>Official Access</span>
                </div>
              </div>
              <div className={`text-center mt-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No account? <button onClick={() => { handleLoginClose(); handleButtonClick('register'); }} className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} font-medium hover:underline transition-all`}>Register for Visitation</button>
              </div>
            </div>
            
            {advancedView && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-gray-400 flex items-center justify-center">
                  <span className={`${darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'} px-2 py-0.5 rounded text-[10px] uppercase tracking-wider`}>Advanced Security Protocol</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Advanced View Status Badge */}
      {advancedView && (
        <div className="fixed bottom-4 left-4 z-30">
          <div className={`${darkMode ? 'bg-blue-900/70 text-blue-200' : 'bg-blue-700 text-white'} text-xs px-3 py-1.5 rounded-full flex items-center shadow-lg backdrop-blur-sm`}>
            <AdjustmentsHorizontalIcon className="h-3.5 w-3.5 mr-1.5" />
            Advanced Security Mode
          </div>
        </div>
      )}
    </div>
  );
}

export default Welcome;