import React from 'react';

function About() {
  return (
    <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-6rem)]">
      <div className="max-w-4xl w-full mx-6 p-8 rounded-2xl bg-white/10 backdrop-blur-sm">
        <h2 className="text-4xl font-bold mb-8 text-white text-center">About Gurage Zone PMS</h2>
        <div className="space-y-6 text-white">
          <p className="text-lg leading-relaxed">
            The Gurage Zone Prison Management System is a comprehensive solution designed to streamline and modernize prison operations in the Gurage Zone region. Our system facilitates efficient management of inmate records, visitor registration, and administrative tasks.
          </p>
          <p className="text-lg leading-relaxed">
            Our mission is to enhance the security, efficiency, and transparency of prison management while ensuring the well-being of inmates and staff members.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="p-6 bg-white/10 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Our Vision</h3>
              <p>To be the leading prison management system in Ethiopia, setting standards for efficiency and security.</p>
            </div>
            <div className="p-6 bg-white/10 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Our Mission</h3>
              <p>To provide innovative solutions for prison management while maintaining the highest standards of security and efficiency.</p>
            </div>
            <div className="p-6 bg-white/10 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Our Values</h3>
              <p>Integrity, Efficiency, Security, and Commitment to Excellence.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About; 