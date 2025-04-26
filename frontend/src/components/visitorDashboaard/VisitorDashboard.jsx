import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import VisitorSidebar from "./VisitorSidebar";
import VisitorSummaryCard from "./VisitorSummary";
import ScheduleVisit from "./ScheduleVisit";
import VisitHistory from "./VisitHistory";
import VisitorProfile from "./VisitorProfile";
import UpdateProfile from "../profile/updateProfile";
import HelpPage from "../../page/helpPage";
import SettingPage from "../../page/settingsPage";
import { FaGlobe } from "react-icons/fa"; // Import globe icon for language selector

// Import the UUID as a constant
const APP_UUID = '55709720-7916-4f8e-b86f-a30d9f074c89';

function VisitorDashboard() {
  // Add state for language selection
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem(`language_${APP_UUID}`) || 'en';
  });
  
  // Add state for dropdown open/closed
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef(null);
  
  // Add a function to use the UUID for any necessary operations
  const getAppIdentifier = () => {
    return APP_UUID;
  };
  
  // Handle language change
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem(`language_${APP_UUID}`, lang);
    setIsLanguageMenuOpen(false);
  };
  
  // Close the menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setIsLanguageMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-100" data-app-id={APP_UUID}>
      <VisitorSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Add language selector at the top */}
        <div className="flex justify-end p-4 bg-white shadow-sm">
          <div className="relative" ref={languageMenuRef}>
            <button
              type="button"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 focus:outline-none"
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
              aria-expanded={isLanguageMenuOpen}
            >
              <FaGlobe className="h-5 w-5 mr-1" />
              {language === 'en' ? 'English' : language === 'am' ? 'አማርኛ' : 'Afaan Oromoo'}
            </button>
            {isLanguageMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`block px-4 py-2 text-sm ${language === 'en' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} w-full text-left hover:bg-gray-50`}
                    role="menuitem"
                  >
                    English
                  </button>
                  <button
                    onClick={() => handleLanguageChange('am')}
                    className={`block px-4 py-2 text-sm ${language === 'am' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} w-full text-left hover:bg-gray-50`}
                    role="menuitem"
                  >
                    አማርኛ
                  </button>
                  <button
                    onClick={() => handleLanguageChange('or')}
                    className={`block px-4 py-2 text-sm ${language === 'or' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} w-full text-left hover:bg-gray-50`}
                    role="menuitem"
                  >
                    Afaan Oromoo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <Routes>
            <Route index element={<VisitorSummaryCard />} />
            <Route path="schedule" element={<ScheduleVisit />} />
            <Route path="visit-history" element={<VisitHistory />} />
            <Route path="setting" element={<VisitorProfile />} />
            <Route path="update-profile" element={<UpdateProfile />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="settingsPage" element={<SettingPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default VisitorDashboard; 