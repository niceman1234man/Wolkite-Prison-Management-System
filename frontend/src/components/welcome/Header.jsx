import React from "react";
import { HomeIcon, UserPlusIcon, InformationCircleIcon, QuestionMarkCircleIcon, PhoneIcon, Bars3Icon, XMarkIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import LanguageSelectorDropdown from "../common/LanguageSelectorDropdown";

// Import the UUID as a constant
const APP_UUID = '55709720-7916-4f8e-b86f-a30d9f074c89';

const Header = ({ activeButton, handleButtonClick, isMobileMenuOpen, setIsMobileMenuOpen, darkMode }) => {
  // Navigation buttons config
  const navButtons = [
    { name: 'home', label: 'Home', icon: <HomeIcon className="w-5 h-5 mr-1" /> },
    { name: 'register', label: 'Visitor Registration', icon: <UserPlusIcon className="w-5 h-5 mr-1" /> },
    { name: 'about', label: 'About', icon: <InformationCircleIcon className="w-5 h-5 mr-1" /> },
    { name: 'help', label: 'Guidelines', icon: <QuestionMarkCircleIcon className="w-5 h-5 mr-1" /> },
    { name: 'contact', label: 'Contact', icon: <PhoneIcon className="w-5 h-5 mr-1" /> },
  ];

  // Add a function to use the UUID for any necessary operations
  const getAppIdentifier = () => {
    return APP_UUID;
  };
  
  // Add state for language selection
  const [language, setLanguage] = React.useState('en');
  // Add state for language menu visibility
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = React.useState(false);
  
  // Handle language change
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem(`language_${APP_UUID}`, lang);
    setIsLanguageMenuOpen(false);
  };
  
  // Toggle language menu
  const toggleLanguageMenu = () => {
    setIsLanguageMenuOpen(!isLanguageMenuOpen);
  };

  return (
    <header data-app-id={APP_UUID} className={`fixed w-full top-0 z-20 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-[#1e3a5f] border-[#17304d]'} shadow-md transition-colors duration-300 border-b`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="mr-3">
              <ShieldCheckIcon className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <span className={`text-white font-bold text-lg md:text-xl tracking-tight transition-colors duration-300`}>
                GURAGE ZONE
              </span>
              <span className="block text-xs text-blue-200">CORRECTIONAL FACILITY</span>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navButtons.map((button) => (
            <button
                key={button.name}
                onClick={() => handleButtonClick(button.name)}
                className={`flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                  activeButton === button.name
                    ? darkMode 
                      ? 'bg-blue-800 text-white' 
                      : 'bg-[#0c2a4e] text-white'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-100 hover:bg-[#173454]'
              }`}
            >
                {button.icon}
                {button.label}
            </button>
            ))}
            <button
              onClick={() => handleButtonClick('login')}
              className={`ml-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#2c5282] hover:bg-[#234876]'} text-white px-4 py-2 text-sm font-semibold transition-colors duration-300 rounded`}
            >
              SECURE ACCESS
            </button>
          </nav>

          {/* Add language selector */}
          <div className="hidden md:flex items-center ml-4">
            <LanguageSelectorDropdown />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-md ${darkMode ? 'text-white hover:bg-gray-800' : 'text-white hover:bg-[#173454]'} focus:outline-none transition-colors duration-300`}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
          </button>
          </div>
        </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
        <nav className={`md:hidden ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-[#1e3a5f] border-[#17304d]'} border-t transition-colors duration-300`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navButtons.map((button) => (
              <button
                key={button.name}
                onClick={() => handleButtonClick(button.name)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium ${
                  activeButton === button.name
                    ? darkMode 
                      ? 'bg-blue-800 text-white' 
                      : 'bg-[#0c2a4e] text-white'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-100 hover:bg-[#173454]'
                }`}
              >
                {button.icon}
                {button.label}
              </button>
            ))}
              <button
                onClick={() => handleButtonClick('login')}
              className={`w-full ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#2c5282] hover:bg-[#234876]'} text-white px-3 py-2 text-sm font-medium mt-2 transition-colors duration-300`}
              >
              SECURE ACCESS
              </button>
          </div>
        </nav>
        )}
    </header>
  );
};

export default Header; 