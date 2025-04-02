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
import { ShieldCheckIcon, LockClosedIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Toast configuration with closeOnClick enabled
const toastConfig = {
  duration: 3000,
  position: 'top-center',
  closeOnClick: true,
  pauseOnHover: true,
  style: {
    background: '#fff',
    color: '#333',
    padding: '12px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
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
          const messagesWithFullUrls = messagesResponse.data.messages.map(msg => ({
            ...msg,
            image: msg.image ? `${import.meta.env.VITE_API_URL}${msg.image}` : null
          }));
          setMessages(messagesWithFullUrls);
        } else {
          toast.error("No messages found.", toastConfig);
        }

        const imagesResponse = await axiosInstance.get("/manageimages/get-side-images");
        if (imagesResponse.data?.images) {
          const imagesWithFullUrls = imagesResponse.data.images.map(img => 
            `${import.meta.env.VITE_API_URL}${img}`
          );
          setSideImages(imagesWithFullUrls);
        } else {
          toast.error("No images available.", toastConfig);
        }
      } catch (error) {
        console.error("Error fetching content:", error);
        toast.error(`Failed to load content: ${error.response?.data?.message || error.message}`, toastConfig);
      } finally {
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

  const handleImageError = (e, fallbackUrl) => {
    console.error("Image failed to load:", e.target.src);
    e.target.src = fallbackUrl;
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
          sideImages={sideImages}
          loading={loading}
          time={time}
          messageRef={messageRef}
          isVisible={isVisible}
        />;
      case 'register':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-lg w-full h-full sm:h-auto sm:max-w-2xl sm:w-full mx-0 sm:mx-4 max-h-full sm:max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 z-10 flex justify-between items-center p-4 sm:p-8 bg-white border-b border-gray-200">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Create Visitor Account</h2>
                <button
                  onClick={() => setActiveButton('home')}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 sm:p-8">
                <Register 
                  formData={formData}
                  handleChange={handleChange}
                  handleSubmit={handleSubmit}
                  setShowLoginModal={() => setIsLoginOpen(true)}
                />
              </div>
            </div>
          </div>
        );
      case 'about':
        return <About />;
      case 'help':
        return <Help />;
      case 'contact':
        return <Contact />;
      default:
        return <Home 
          messages={messages}
          currentMessageIndex={currentMessageIndex}
          sideImages={sideImages}
          loading={loading}
          time={time}
          messageRef={messageRef}
          isVisible={isVisible}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header 
        activeButton={activeButton}
        handleButtonClick={handleButtonClick}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      <main className="pt-16 sm:pt-24">
        {renderContent()}
      </main>

      <Footer handleButtonClick={handleButtonClick} />

      {isLoginOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-8 w-full max-w-md sm:max-w-md shadow-xl relative">
            <button
              onClick={handleLoginClose}
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              aria-label="Close login modal"
            >
              <XMarkIcon className="h-5 sm:h-6 w-5 sm:w-6 text-gray-500 hover:text-gray-700" />
            </button>
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="bg-teal-100 p-2 rounded-lg">
                <ShieldCheckIcon className="h-6 sm:h-8 w-6 sm:w-8 text-teal-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Welcome Back</h2>
                <p className="text-xs sm:text-sm text-gray-600">Please login to your account</p>
              </div>
            </div>
            <div className="bg-white">
              <Login onClose={handleLoginClose} isVisitor={true} />
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0 sm:space-x-4 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center">
                  <LockClosedIcon className="h-4 sm:h-5 w-4 sm:w-5 text-teal-600 mr-1" />
                  <span>Secure Login</span>
                </div>
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-4 sm:h-5 w-4 sm:w-5 text-teal-600 mr-1" />
                  <span>Protected Data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Welcome;