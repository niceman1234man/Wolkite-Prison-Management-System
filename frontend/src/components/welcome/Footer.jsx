import React from 'react';

function Footer({ handleButtonClick }) {
  return (
    <footer className="bg-teal-800 text-white py-12 border-t border-teal-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-xl font-semibold mb-6">Emergency Contacts</h3>
            <div className="space-y-3">
              <p className="text-white/90">Emergency: +251 123 456 789</p>
              <p className="text-white/90">Security: +251 123 456 790</p>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li><button onClick={() => handleButtonClick('about')} className="text-white/90 hover:text-white transition-colors">About Us</button></li>
              <li><button onClick={() => handleButtonClick('help')} className="text-white/90 hover:text-white transition-colors">Help & Support</button></li>
              <li><button onClick={() => handleButtonClick('contact')} className="text-white/90 hover:text-white transition-colors">Contact</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-6">Address</h3>
            <div className="space-y-3 text-white/90">
              <p>Gurage Zone Prison</p>
              <p>Wolkite, Ethiopia</p>
              <p>P.O. Box: 1234</p>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-teal-700 text-center text-white/80">
          <p>&copy; {new Date().getFullYear()} Gurage Zone Prison Management System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 