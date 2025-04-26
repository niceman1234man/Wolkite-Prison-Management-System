import React, { useState, useEffect, useRef } from "react";
import { FaGlobe } from "react-icons/fa";

const APP_UUID = '55709720-7916-4f8e-b86f-a30d9f074c89';

const LanguageSelectorDropdown = ({ className }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem(`language_${APP_UUID}`) || 'en';
  });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem(`language_${APP_UUID}`, lang);
    setIsOpen(false);
    
    // Optionally you can add a reload or context update here
    // to apply the language change across the application
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaGlobe className="h-5 w-5 mr-1" />
        {language === 'en' ? 'English' : language === 'am' ? 'አማርኛ' : 'Afaan Oromoo'}
      </button>
      
      {isOpen && (
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
  );
};

export default LanguageSelectorDropdown; 