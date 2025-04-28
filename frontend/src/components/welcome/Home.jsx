import React, { useEffect, useState } from 'react';
import { ChartBarIcon, UserGroupIcon, CheckCircleIcon, ClockIcon, ShieldCheckIcon, DocumentTextIcon, IdentificationIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Import the UUID as a constant
const APP_UUID = '55709720-7916-4f8e-b86f-a30d9f074c89';

function Home({ messages, currentMessageIndex, sideImages, loading, time, messageRef, isVisible, advancedView, statistics, darkMode, setCurrentMessageIndex }) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Add a function to use the UUID for any necessary operations
  const getAppIdentifier = () => {
    return APP_UUID;
  };

  // Log messages for debugging when they change
  useEffect(() => {
    if (messages && messages.length > 0) {
      console.log("Messages in Home component:", messages);
      console.log("Current message:", messages[currentMessageIndex]);
    }
  }, [messages, currentMessageIndex]);

  // Handle manual navigation through slides
  const goToNextSlide = () => {
    if (messages && messages.length > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const goToPrevSlide = () => {
    if (messages && messages.length > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentMessageIndex((prevIndex) => (prevIndex === 0 ? messages.length - 1 : prevIndex - 1));
        setIsTransitioning(false);
      }, 300);
    }
  };

  // Add a handler for image loading errors
  const handleImageError = (e, fallbackUrl) => {
    console.error("Image failed to load:", e.target.src);
    e.target.src = fallbackUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' text-anchor='middle' dominant-baseline='middle' fill='%23a0a0a0'%3EImage Not Found%3C/text%3E%3C/svg%3E";
  };

  // Create a placeholder image for slides without images
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080' viewBox='0 0 1920 1080'%3E%3Crect width='1920' height='1080' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='48' text-anchor='middle' dominant-baseline='middle' fill='%236B7280'%3ECorrecional Facility%3C/text%3E%3C/svg%3E";

  return (
    <div data-app-id={APP_UUID} className="relative z-10">
      {/* Full-width Hero Slider Section */}
      <div className="relative h-screen overflow-hidden">
        {/* Image Slider */}
        {messages && messages.length > 0 ? (
          <div className="absolute inset-0 w-full h-full">
            {/* Background Image */}
            <div 
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
              style={{ 
                backgroundImage: `url(${messages[currentMessageIndex]?.image || placeholderImage})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover'
              }}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70"></div>
            </div>
            
            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col justify-center items-center px-4 text-center">
              <div className={`w-full max-w-6xl mx-auto transition-transform duration-500 ${isTransitioning ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'}`}>
                <div className="mb-6">
                  <span className="px-4 py-1.5 bg-white/10 backdrop-blur-sm text-white text-sm tracking-widest uppercase font-light rounded-full border border-white/20">
                    {advancedView ? "Federal Correctional Authority" : "Official Portal"}
                  </span>
                </div>
                <h1 className="text-5xl md:text-6xl font-light text-white drop-shadow-lg mb-6 tracking-wide">
                  {advancedView ? "Gurage Zone Correctional Facility" : "Gurage Zone Correctional Facility"}
                </h1>
                <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto drop-shadow-lg font-light tracking-wide">
                  {advancedView 
                    ? "Integrated Correctional Management System for Enhanced Security, Rehabilitation and Administration" 
                    : "Maintaining Public Safety Through Professional Correctional Management"}
                </p>
                
                {/* Statistics Dashboard in Advanced View */}
                {advancedView && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8 mb-12">
                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-lg border border-white/10 text-white hover:bg-white/10 transition-all">
                      <div className="flex items-center mb-2">
                        <UserGroupIcon className="w-5 h-5 mr-2 text-blue-300" />
                        <h3 className="font-light tracking-wider uppercase text-sm">Visitors</h3>
                      </div>
                      <p className="text-3xl font-light text-blue-300">{statistics.totalVisitors}</p>
                      <p className="text-xs mt-2 text-blue-100 opacity-80">Active in database</p>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-lg border border-white/10 text-white hover:bg-white/10 transition-all">
                      <div className="flex items-center mb-2">
                        <ChartBarIcon className="w-5 h-5 mr-2 text-green-300" />
                        <h3 className="font-light tracking-wider uppercase text-sm">Inmates</h3>
                      </div>
                      <p className="text-3xl font-light text-green-300">{statistics.totalInmates}</p>
                      <p className="text-xs mt-2 text-green-100 opacity-80">In correctional custody</p>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-lg border border-white/10 text-white hover:bg-white/10 transition-all">
                      <div className="flex items-center mb-2">
                        <CheckCircleIcon className="w-5 h-5 mr-2 text-purple-300" />
                        <h3 className="font-light tracking-wider uppercase text-sm">Visits</h3>
                      </div>
                      <p className="text-3xl font-light text-purple-300">{statistics.totalApprovedVisits}</p>
                      <p className="text-xs mt-2 text-purple-100 opacity-80">Approved procedures</p>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-lg border border-white/10 text-white hover:bg-white/10 transition-all">
                      <div className="flex items-center mb-2">
                        <ClockIcon className="w-5 h-5 mr-2 text-yellow-300" />
                        <h3 className="font-light tracking-wider uppercase text-sm">Pending</h3>
                      </div>
                      <p className="text-3xl font-light text-yellow-300">{statistics.pendingVisits}</p>
                      <p className="text-xs mt-2 text-yellow-100 opacity-80">Awaiting authorization</p>
                    </div>
                  </div>
                )}
                
                {/* Announcement Box */}
                {messages[currentMessageIndex] && (
                  <div className="w-full max-w-5xl mx-auto relative mt-8">
                    <div className={`backdrop-blur-[2px] border-l-4 ${darkMode ? 'border-l-blue-400/70' : 'border-l-blue-300/70'} px-8 py-10`}>
                      <div className="relative">
                        <span className="absolute -left-6 top-0 text-5xl text-white/30 font-serif">"</span>
                        <h3 className={`font-serif text-base uppercase tracking-[0.2em] mb-6 ${darkMode ? 'text-blue-200/90' : 'text-blue-100/90'} opacity-90`}>
                          {advancedView ? "Administrative Bulletin" : "Announcement"}
                        </h3>
                        <p className={`font-light text-2xl md:text-3xl leading-relaxed mb-6 ${darkMode ? 'text-white' : 'text-white'} drop-shadow-sm`}>
                          {messages[currentMessageIndex].text}
                        </p>
                        <span className="absolute -right-1 bottom-0 text-5xl text-white/30 font-serif">"</span>
                        
                        {advancedView && messages[currentMessageIndex] && messages[currentMessageIndex].date && (
                          <div className="mt-8 text-sm text-white/60 flex items-center border-t border-white/10 pt-4">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            <span className="font-light">Published: {new Date(messages[currentMessageIndex].date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</span>
                            <span className="ml-4 px-3 py-0.5 bg-blue-500/10 text-blue-100/90 rounded-full text-xs tracking-wider backdrop-blur-sm">
                              Ref: {messages[currentMessageIndex]._id?.substring(0, 8) || "DOC-" + Math.floor(Math.random() * 10000)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Loading state or no messages
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            {loading ? (
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
            ) : (
              <p className="text-white text-xl">No announcements available</p>
            )}
          </div>
        )}
        
        {/* Slide Navigation Controls */}
        {messages && messages.length > 1 && (
          <>
            {/* Previous button */}
            <button 
              onClick={goToPrevSlide}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm border border-white/10"
              aria-label="Previous slide"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            
            {/* Next button */}
            <button 
              onClick={goToNextSlide}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm border border-white/10"
              aria-label="Next slide"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
            
            {/* Dots navigation */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex justify-center space-x-3">
              {messages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setCurrentMessageIndex(index);
                      setIsTransitioning(false);
                    }, 300);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentMessageIndex === index
                      ? 'bg-white w-10'
                      : 'bg-white/30 hover:bg-white/50 w-2'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gradient-to-b from-transparent to-black/20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-16 drop-shadow-lg">
            {advancedView ? "CORRECTIONAL FACILITY MANAGEMENT FRAMEWORK" : "SECURE MANAGEMENT SYSTEMS"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className={`${darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200'} p-8 rounded-lg shadow-lg transition-all duration-300 border`}>
              <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-5">
                <ShieldCheckIcon className="h-8 w-8 text-blue-800" />
              </div>
              <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {advancedView ? "Security Protocol System" : "Secure Facility Management"}
              </h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                {advancedView 
                  ? "Multi-tier security framework with biometric authentication, perimeter surveillance, and real-time personnel tracking for maximum facility integrity" 
                  : "Advanced security protocols and comprehensive monitoring systems ensure facility safety"}
              </p>
              {advancedView && (
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    <span className="text-gray-400 text-sm">Biometric access control</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    <span className="text-gray-400 text-sm">24/7 surveillance integration</span>
                  </li>
                </ul>
              )}
            </div>
            <div className={`${darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200'} p-8 rounded-lg shadow-lg transition-all duration-300 border`}>
              <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-5">
                <DocumentTextIcon className="h-8 w-8 text-green-800" />
              </div>
              <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {advancedView ? "Records Management Protocol" : "Inmate Records System"}
              </h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                {advancedView 
                  ? "Encrypted record management with detailed case tracking, sentence administration, and comprehensive behavior assessment modules" 
                  : "Digital record management with secure document storage and tracking"}
              </p>
              {advancedView && (
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    <span className="text-gray-400 text-sm">Case history documentation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    <span className="text-gray-400 text-sm">Sentence calculation engine</span>
                  </li>
                </ul>
              )}
            </div>
            <div className={`${darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200'} p-8 rounded-lg shadow-lg transition-all duration-300 border`}>
              <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full mb-5">
                <IdentificationIcon className="h-8 w-8 text-purple-800" />
              </div>
              <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {advancedView ? "Visitor Authorization Framework" : "Visitor Processing System"}
              </h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                {advancedView 
                  ? "Visitor identity verification with background screening, relationship validation, and automated scheduling with capacity management" 
                  : "Secure visitor registration and monitoring for controlled facility access"}
              </p>
              {advancedView && (
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">•</span>
                    <span className="text-gray-400 text-sm">Identity verification protocols</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">•</span>
                    <span className="text-gray-400 text-sm">Contraband screening process</span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Official Communications Section */}
      <div className="py-20 bg-gradient-to-b from-black/20 to-transparent">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-16 drop-shadow-lg">
            {advancedView ? "OFFICIAL COMMUNICATIONS" : "PUBLIC NOTICES"}
          </h2>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {messages && messages.length > 0 && messages.slice(0, 3).map((message) => (
                <div
                  key={message?._id || Math.random().toString()}
                  className={`${darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200'} rounded-lg overflow-hidden shadow-lg transition-all duration-300 border`}
                >
                  {message && message.image && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={message.image}
                        alt="Official Communication"
                        className="w-full h-full object-cover transform transition-transform duration-500"
                        onError={(e) => {
                          console.error("Failed to load image:", e.target.src);
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' text-anchor='middle' dominant-baseline='middle' fill='%23a0a0a0'%3ENo Image Available%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent h-16"></div>
                    </div>
                  )}
                  <div className="p-6">
                    <div className={`${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} px-2 py-1 rounded text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'} inline-block mb-3`}>
                      {advancedView ? "BULLETIN" : "NOTICE"}
                    </div>
                    <p className={`${darkMode ? 'text-white' : 'text-gray-800'} text-lg font-medium leading-relaxed mb-3`}>
                      {message && message.text && message.text.length > 120 ? message.text.substring(0, 120) + "..." : (message?.text || "")}
                    </p>
                    <div className="flex justify-between items-center">
                      {advancedView && message && message.date && (
                        <div className="text-xs text-gray-500 flex items-center">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          <span>{new Date(message.date).toLocaleDateString()}</span>
                        </div>
                      )}
                      <button className={`text-xs font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>
                        View full notice
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Facility Information Section */}
      <div className="py-20 bg-gradient-to-b from-transparent to-black/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className={`${darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200'} p-8 rounded-lg shadow-lg border`}>
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>
                {advancedView ? "FACILITY COORDINATION" : "CONTACT INFORMATION"}
              </h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} p-3 rounded-full`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Official Location</p>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Gurage Zone Correctional Facility</p>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Wolkite, Ethiopia</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} p-3 rounded-full`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Communication Lines</p>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Administrative Office: +251 123 456 789</p>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Visitor Coordination: +251 123 456 790</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} p-3 rounded-full`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Electronic Correspondence</p>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>admin@guragecorrectional.gov.et</p>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>visitors@guragecorrectional.gov.et</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={`${darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200'} p-8 rounded-lg shadow-lg border`}>
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>
                {advancedView ? "VISITATION PROTOCOL" : "VISITING HOURS"}
              </h3>
              <div className="space-y-4">
                <div className={`flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b pb-3`}>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Monday - Thursday</span>
                  <span className={`${darkMode ? 'text-blue-300 bg-blue-900/30' : 'text-blue-800 bg-blue-50'} px-3 py-1 rounded-full text-sm`}>09:00 - 16:00</span>
                </div>
                <div className={`flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b pb-3`}>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Friday</span>
                  <span className={`${darkMode ? 'text-blue-300 bg-blue-900/30' : 'text-blue-800 bg-blue-50'} px-3 py-1 rounded-full text-sm`}>09:00 - 14:00</span>
                </div>
                <div className={`flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b pb-3`}>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Saturday</span>
                  <span className={`${darkMode ? 'text-blue-300 bg-blue-900/30' : 'text-blue-800 bg-blue-50'} px-3 py-1 rounded-full text-sm`}>10:00 - 14:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Sunday & Holidays</span>
                  <span className={`${darkMode ? 'text-red-300 bg-red-900/30' : 'text-red-800 bg-red-50'} px-3 py-1 rounded-full text-sm`}>Closed</span>
                </div>
              </div>
              
              {advancedView && (
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <h4 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Visitation Requirements</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-2`}>•</span>
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Visitors must register minimum 48 hours in advance</span>
                    </li>
                    <li className="flex items-start">
                      <span className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-2`}>•</span>
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Government-issued identification required</span>
                    </li>
                    <li className="flex items-start">
                      <span className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-2`}>•</span>
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Maximum visitation duration: 45 minutes per session</span>
                    </li>
                    <li className="flex items-start">
                      <span className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-2`}>•</span>
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Security screening mandatory for all visitors</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Official Footer Notice */}
      <div className="py-8 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-sm text-white/70 leading-relaxed">
            {advancedView 
              ? "This is an official portal of the Ethiopian Federal Correctional Authority. Unauthorized access or misuse of this system is strictly prohibited and may result in legal action. All activities are monitored and recorded for security purposes." 
              : "Official website of the Gurage Zone Correctional Facility. All rights reserved."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
