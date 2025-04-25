import React from "react";
import { Link } from "react-router-dom";
import { HeartIcon, ShieldCheckIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const Footer = ({ handleButtonClick, darkMode }) => {
  return (
    <footer className={`py-10 ${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-[#1e3a5f] text-gray-200'} transition-colors duration-300`}>
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center mb-6 md:mb-0">
            <div className="mr-3">
              <ShieldCheckIcon className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight">
                GURAGE ZONE
              </span>
              <span className="block text-xs text-blue-200">CORRECTIONAL FACILITY</span>
            </div>
          </div>
          
          <div className="flex space-x-6">
                <button 
                  onClick={() => handleButtonClick('about')}
              className={`text-sm ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-200 hover:text-white'} transition-colors duration-300`}
                >
              About
                </button>
                <button 
                  onClick={() => handleButtonClick('help')}
              className={`text-sm ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-200 hover:text-white'} transition-colors duration-300`}
                >
              Guidelines
                </button>
                <button 
              onClick={() => handleButtonClick('contact')}
              className={`text-sm ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-200 hover:text-white'} transition-colors duration-300`}
                >
              Contact
                </button>
          </div>
        </div>
        
        <div className={`border-t ${darkMode ? 'border-gray-800' : 'border-[#17304d]'} pt-6 flex flex-col md:flex-row items-center justify-between`}>
          <div className="mb-4 md:mb-0 text-sm text-center md:text-left">
            <p>© {new Date().getFullYear()} Gurage Zone Correctional Facility Administration</p>
            <p className={`mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-300'} text-xs`}>
              Official Government Portal - All Rights Reserved
            </p>
          </div>
          
          <div className={`flex flex-col items-center md:flex-row md:items-center ${darkMode ? 'text-gray-500' : 'text-gray-300'}`}>
            <div className="flex items-center mb-2 md:mb-0 md:mr-6">
              <LockClosedIcon className="h-4 w-4 mr-1" />
              <span className="text-xs">Secure Access Portal</span>
            </div>
            
            <div className="text-xs flex items-center">
              <span>Developed with</span>
              <HeartIcon className={`h-3 w-3 mx-1 ${darkMode ? 'text-red-400' : 'text-red-300'}`} />
              <span>by Ministry of Justice</span>
            </div>
          </div>
        </div>
        
        {/* Security/Legal Information */}
        <div className={`mt-8 pt-4 border-t ${darkMode ? 'border-gray-800' : 'border-[#17304d]'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-[#173454]'} p-3 rounded`}>
              <h4 className="font-semibold mb-2">Privacy Policy</h4>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-300'} leading-relaxed`}>
                All information collected on this site is protected and handled according to government data protection regulations.
              </p>
            </div>
            
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-[#173454]'} p-3 rounded`}>
              <h4 className="font-semibold mb-2">Terms of Use</h4>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-300'} leading-relaxed`}>
                Unauthorized access to this system is prohibited and subject to legal action under applicable laws.
              </p>
            </div>
            
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-[#173454]'} p-3 rounded`}>
              <h4 className="font-semibold mb-2">Accessibility</h4>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-300'} leading-relaxed`}>
                This site is designed to be accessible to all users in compliance with government accessibility standards.
          </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 