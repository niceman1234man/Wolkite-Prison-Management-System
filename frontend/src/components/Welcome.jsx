import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import "@fontsource/poppins";
import "@fontsource/roboto";
import Login from "../components/auth/Login";

import backgroundImage from "../assets/gurageZone.png";
import ethiopiaFlag from "../assets/centralEthiopiaFlag.png";
import flagofEthiopia from "../assets/Flag-Ethiopia.png";
import guragePrison from "../assets/guragePrison.jpg";

function Welcome() {
  const [messages, setMessages] = useState([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(1);
  const [sideImages, setSideImages] = useState([]);
  const [time, setTime] = useState(new Date());
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const messagesResponse = await axiosInstance.get("/managemessages/get-messages");
        if (messagesResponse.data?.messages) {
          const messagesWithFullUrls = messagesResponse.data.messages.map(msg => ({
            ...msg,
            image: msg.image ? `${axiosInstance.defaults.baseURL}${msg.image}` : null
          }));
          setMessages(messagesWithFullUrls);
        } else {
          toast.error("No messages found.");
        }

        const imagesResponse = await axiosInstance.get("/manageimages/get-side-images");
        if (imagesResponse.data?.images) {
          const imagesWithFullUrls = imagesResponse.data.images.map(img => 
            `${axiosInstance.defaults.baseURL}${img}`
          );
          setSideImages(imagesWithFullUrls);
        } else {
          toast.error("No images available.");
        }
      } catch (error) {
        console.error("Error fetching content:", error);
        toast.error(`Failed to load content: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const interval = setInterval(() => {
        setDirection(1);
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

  const secondsDeg = (time.getSeconds() / 60) * 360;
  const minutesDeg = (time.getMinutes() / 60) * 360;
  const hoursDeg = ((time.getHours() % 12) / 12) * 360 + (time.getMinutes() / 60) * 30;

  return (
    <div
      className="flex flex-col h-screen font-[Poppins] text-gray-900 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="relative flex flex-col h-full">
        {/* Header */}
        <header className="bg-teal-600 bg-opacity-90 text-gray-900 flex justify-between items-center px-5 py-4 shadow-md z-10">
          <div className="flex items-center space-x-4">
            <img src={ethiopiaFlag} alt="Central Ethiopia Flag" className="w-32 h-18 object-contain rounded shadow-md" />
            <h1 className="font-bold text-4xl">Gurage Zone PMS</h1>
            <img src={flagofEthiopia} alt="Ethiopian Flag" className="w-38 h-24 object-contain rounded shadow-md" />
          </div>
          <div className="flex space-x-6 items-center">
            <Link to="/register" className="hover:underline text-xl">Register as Visitor</Link>
            <Link to="/about" className="hover:underline text-xl">About</Link>
            <Link to="/help" className="hover:underline text-xl">Help</Link>
            <Link to="/contact" className="hover:underline text-xl">Contact Us</Link>
            <button
              onClick={() => setIsLoginOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              Login
            </button>
          </div>
        </header>

        {/* Static Image on the Left Side */}
        <img
          src={guragePrison}
          alt="Prison"
          className="absolute left-0 top-12 w-1/3 object-cover shadow-md border-r-4 border-gray-600"
        />

        {/* Main Content */}
        <main className="flex-grow flex items-center justify-center text-center p-10 z-10 relative">
          {/* Left Side Image */}
          {sideImages[0] && (
            <motion.img
              src={sideImages[0]}
              alt="Side Image Left"
              className="w-1/5 h-auto rounded-lg shadow-md hidden md:block"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          )}

          {/* Message Box */}
          <motion.div
            className="bg-white bg-opacity-10 p-12 rounded-lg shadow-2xl max-w-2xl w-full mx-6 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-5xl font-bold mb-6 font-[Roboto] text-white drop-shadow-lg">
              Welcome to Gurage PMS
            </h1>

            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="relative w-full h-64 overflow-hidden rounded-xl">
                <AnimatePresence custom={direction} mode="wait">
                  <motion.div
                    key={currentMessageIndex}
                    initial={{ x: direction * 100, opacity: 0, scale: 0.9 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    exit={{ x: -direction * 100, opacity: 0, scale: 0.9 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="absolute w-full h-full flex flex-col items-center justify-center"
                  >
                    {/* Message Image */}
                    {messages[currentMessageIndex]?.image && (
                      <motion.img
                        src={messages[currentMessageIndex].image}
                        alt="Message"
                        className="w-full h-32 object-cover rounded-t-xl"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      />
                    )}
                    
                    {/* Message Text */}
                    <div className="w-full p-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-b-xl">
                      <p className="text-white text-2xl font-medium leading-relaxed">
                        {messages[currentMessageIndex]?.text}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Right Side Image */}
          {sideImages[1] && (
            <motion.img
              src={sideImages[1]}
              alt="Side Image Right"
              className="w-1/5 h-auto rounded-lg shadow-md hidden md:block"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-teal-800 text-white text-center py-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} Wolkite Prison Management. All rights reserved.</p>
        </footer>
      </div>

      {/* Login Popup */}
      {isLoginOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-lg rounded-lg shadow-xl p-8 relative"
          >
            <button
              onClick={() => setIsLoginOpen(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Login />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default Welcome;