import React from 'react';
import { BookOpenIcon, CheckCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

function Help({ darkMode, advancedView }) {
  return (
    <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-6rem)] py-12">
      <div className={`max-w-4xl w-full mx-6 p-8 rounded-2xl ${darkMode ? 'bg-gray-800/90' : 'bg-[#1e3a5f]/90'} shadow-xl`}>
        <h2 className="text-3xl font-bold mb-8 text-white text-center border-b pb-4 border-gray-700">
          {advancedView ? "Correctional Facility Visitation Guidelines" : "Visitor Guidelines"}
        </h2>
        
        <div className="space-y-8 text-white">
          <div className={`p-6 ${darkMode ? 'bg-gray-700/80' : 'bg-[#173454]/90'} rounded-lg border ${darkMode ? 'border-gray-600' : 'border-[#0c2a4e]'}`}>
            <div className="flex items-center mb-4">
              <BookOpenIcon className="h-6 w-6 text-blue-300 mr-3" />
              <h3 className="text-xl font-semibold">Registration Process</h3>
            </div>
            <ul className="space-y-3 pl-9">
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'}`}>Complete the visitor registration form with accurate personal information.</p>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'}`}>Upload a valid government-issued ID for verification purposes.</p>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'}`}>Submit your relationship to the inmate you wish to visit.</p>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'}`}>Wait for approval notification via email or SMS.</p>
              </li>
            </ul>
          </div>

          <div className={`p-6 ${darkMode ? 'bg-gray-700/80' : 'bg-[#173454]/90'} rounded-lg border ${darkMode ? 'border-gray-600' : 'border-[#0c2a4e]'}`}>
            <div className="flex items-center mb-4">
              <QuestionMarkCircleIcon className="h-6 w-6 text-blue-300 mr-3" />
              <h3 className="text-xl font-semibold">Visitation Rules</h3>
            </div>
            <ul className="space-y-3 pl-9">
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'}`}>Visitors must arrive 30 minutes before scheduled visitation time.</p>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'}`}>All visitors must present approved identification matching registration details.</p>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'}`}>No electronic devices, including mobile phones, are permitted in the visitation area.</p>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-100'}`}>All visitors are subject to security screening and searches.</p>
              </li>
            </ul>
          </div>
          
          {advancedView && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-400 italic">
                These guidelines are established in accordance with the Ethiopian Federal Correctional Authority regulations and are subject to change. The facility administration reserves the right to deny visitation privileges to any individual who fails to comply with these guidelines.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Help; 