import React from 'react';
import { PhoneIcon, EnvelopeIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

function Contact({ darkMode, advancedView }) {
  return (
    <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-6rem)] py-12">
      <div className={`max-w-4xl w-full mx-6 p-8 rounded-2xl ${darkMode ? 'bg-gray-800/90' : 'bg-[#1e3a5f]/90'} shadow-xl`}>
        <h2 className="text-3xl font-bold mb-8 text-white text-center border-b pb-4 border-gray-700">
          {advancedView ? "Official Communication Channels" : "Contact Information"}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className={`p-6 ${darkMode ? 'bg-gray-700/80' : 'bg-[#173454]/90'} rounded-lg border ${darkMode ? 'border-gray-600' : 'border-[#0c2a4e]'}`}>
              <div className="flex items-center mb-4">
                <MapPinIcon className="h-6 w-6 text-blue-300 mr-3" />
                <h3 className="text-xl font-semibold text-white">Official Address</h3>
              </div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'} mb-1`}>Gurage Zone Correctional Facility</p>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'} mb-1`}>P.O. Box 1234</p>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'}`}>Wolkite, Ethiopia</p>
            </div>
            
            <div className={`p-6 ${darkMode ? 'bg-gray-700/80' : 'bg-[#173454]/90'} rounded-lg border ${darkMode ? 'border-gray-600' : 'border-[#0c2a4e]'}`}>
              <div className="flex items-center mb-4">
                <ClockIcon className="h-6 w-6 text-blue-300 mr-3" />
                <h3 className="text-xl font-semibold text-white">Office Hours</h3>
              </div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'} mb-1`}>Monday - Friday: 8:00 AM - 5:00 PM</p>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'} mb-1`}>Saturday: 8:00 AM - 12:00 PM</p>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'}`}>Sunday: Closed</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className={`p-6 ${darkMode ? 'bg-gray-700/80' : 'bg-[#173454]/90'} rounded-lg border ${darkMode ? 'border-gray-600' : 'border-[#0c2a4e]'}`}>
              <div className="flex items-center mb-4">
                <PhoneIcon className="h-6 w-6 text-blue-300 mr-3" />
                <h3 className="text-xl font-semibold text-white">Phone Contact</h3>
              </div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'} mb-1`}>Main Office: +251 123 456 789</p>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'} mb-1`}>Visitor Registration: +251 123 456 780</p>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'}`}>Emergency: +251 123 456 700</p>
            </div>
            
            <div className={`p-6 ${darkMode ? 'bg-gray-700/80' : 'bg-[#173454]/90'} rounded-lg border ${darkMode ? 'border-gray-600' : 'border-[#0c2a4e]'}`}>
              <div className="flex items-center mb-4">
                <EnvelopeIcon className="h-6 w-6 text-blue-300 mr-3" />
                <h3 className="text-xl font-semibold text-white">Email Contact</h3>
              </div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'} mb-1`}>General Inquiries: info@guragecorrectional.gov.et</p>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'} mb-1`}>Visitor Registration: visitors@guragecorrectional.gov.et</p>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'}`}>Administration: admin@guragecorrectional.gov.et</p>
            </div>
          </div>
        </div>
        
        {advancedView && (
          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-400 italic text-center">
              All communications are monitored and recorded in accordance with federal security protocols.
              For urgent matters requiring immediate attention, please contact the emergency hotline.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Contact; 