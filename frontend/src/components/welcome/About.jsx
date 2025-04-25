import React from 'react';

function About({ darkMode, advancedView }) {
  return (
    <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-6rem)] py-12">
      <div className={`max-w-4xl w-full mx-6 p-8 rounded-2xl ${darkMode ? 'bg-gray-800/90' : 'bg-[#1e3a5f]/90'} shadow-xl`}>
        <h2 className="text-3xl font-bold mb-8 text-white text-center border-b pb-4 border-gray-700">
          {advancedView ? "About Gurage Zone Correctional Facility" : "About Gurage Zone Prison Management System"}
        </h2>
        <div className="space-y-6 text-white">
          <p className={`text-lg leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-100'}`}>
            The Gurage Zone Prison Management System is a comprehensive solution designed to streamline and modernize prison operations in the Gurage Zone region. Our system facilitates efficient management of inmate records, visitor registration, and administrative tasks.
          </p>
          <p className={`text-lg leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-100'}`}>
            Our mission is to enhance the security, efficiency, and transparency of prison management while ensuring the well-being of inmates and staff members.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className={`p-6 ${darkMode ? 'bg-gray-700/80' : 'bg-[#173454]/90'} rounded-lg border ${darkMode ? 'border-gray-600' : 'border-[#0c2a4e]'}`}>
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Our Vision</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-200'}`}>To be the leading prison management system in Ethiopia, setting standards for efficiency and security.</p>
            </div>
            <div className={`p-6 ${darkMode ? 'bg-gray-700/80' : 'bg-[#173454]/90'} rounded-lg border ${darkMode ? 'border-gray-600' : 'border-[#0c2a4e]'}`}>
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Our Mission</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-200'}`}>To provide innovative solutions for prison management while maintaining the highest standards of security and efficiency.</p>
            </div>
            <div className={`p-6 ${darkMode ? 'bg-gray-700/80' : 'bg-[#173454]/90'} rounded-lg border ${darkMode ? 'border-gray-600' : 'border-[#0c2a4e]'}`}>
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Our Values</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-200'}`}>Integrity, Efficiency, Security, and Commitment to Excellence.</p>
            </div>
          </div>
          
          {advancedView && (
            <div className="mt-10 pt-6 border-t border-gray-700">
              <h3 className="text-2xl font-semibold mb-4 text-white">Correctional Facility Overview</h3>
              <p className={`text-lg leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-200'}`}>
                The Gurage Zone Correctional Facility was established in 2010 as part of Ethiopia's correctional reform initiative. The facility is equipped with modern security systems and rehabilitation programs designed to prepare inmates for successful reintegration into society.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default About; 