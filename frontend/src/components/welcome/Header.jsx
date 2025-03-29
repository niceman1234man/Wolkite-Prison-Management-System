import React from 'react';
import ethiopiaFlag from "../../assets/centralEthiopiaFlag.png";
import flagofEthiopia from "../../assets/Flag-Ethiopia.png";

function Header({ activeButton, handleButtonClick, isMobileMenuOpen, setIsMobileMenuOpen }) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-teal-600 text-white z-50 border-b border-teal-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-6">
            <img src={ethiopiaFlag} alt="Central Ethiopia Flag" className="w-12 h-8 object-contain" />
            <h1 className="font-bold text-2xl text-white">Gurage Zone PMS</h1>
            <img src={flagofEthiopia} alt="Ethiopian Flag" className="w-12 h-8 object-contain" />
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => handleButtonClick('home')}
              className={`text-sm font-medium transition-colors duration-200 ${
                activeButton === 'home'
                  ? 'text-teal-400 border-b-2 border-teal-400'
                  : 'text-gray-300 hover:text-teal-400'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleButtonClick('register')}
              className={`text-sm font-medium transition-colors duration-200 ${
                activeButton === 'register'
                  ? 'text-teal-400 border-b-2 border-teal-400'
                  : 'text-gray-300 hover:text-teal-400'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => handleButtonClick('about')}
              className={`text-sm font-medium transition-colors duration-200 ${
                activeButton === 'about'
                  ? 'text-teal-400 border-b-2 border-teal-400'
                  : 'text-gray-300 hover:text-teal-400'
              }`}
            >
              About
            </button>
            <button
              onClick={() => handleButtonClick('help')}
              className={`text-sm font-medium transition-colors duration-200 ${
                activeButton === 'help'
                  ? 'text-teal-400 border-b-2 border-teal-400'
                  : 'text-gray-300 hover:text-teal-400'
              }`}
            >
              Help
            </button>
            <button
              onClick={() => handleButtonClick('contact')}
              className={`text-sm font-medium transition-colors duration-200 ${
                activeButton === 'contact'
                  ? 'text-teal-400 border-b-2 border-teal-400'
                  : 'text-gray-300 hover:text-teal-400'
              }`}
            >
              Contact
            </button>
            <button
              onClick={() => handleButtonClick('login')}
              className="bg-teal-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-teal-700 transition-colors duration-200 flex items-center space-x-2 shadow-lg hover:shadow-teal-500/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Login</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-300 hover:text-white focus:outline-none"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 md:hidden">
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => handleButtonClick('home')}
                className={`text-sm font-medium transition-colors duration-200 ${
                  activeButton === 'home'
                    ? 'text-teal-400 border-l-2 border-teal-400 pl-2'
                    : 'text-gray-300 hover:text-teal-400'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => handleButtonClick('register')}
                className={`text-sm font-medium transition-colors duration-200 ${
                  activeButton === 'register'
                    ? 'text-teal-400 border-l-2 border-teal-400 pl-2'
                    : 'text-gray-300 hover:text-teal-400'
                }`}
              >
                Register
              </button>
              <button
                onClick={() => handleButtonClick('about')}
                className={`text-sm font-medium transition-colors duration-200 ${
                  activeButton === 'about'
                    ? 'text-teal-400 border-l-2 border-teal-400 pl-2'
                    : 'text-gray-300 hover:text-teal-400'
                }`}
              >
                About
              </button>
              <button
                onClick={() => handleButtonClick('help')}
                className={`text-sm font-medium transition-colors duration-200 ${
                  activeButton === 'help'
                    ? 'text-teal-400 border-l-2 border-teal-400 pl-2'
                    : 'text-gray-300 hover:text-teal-400'
                }`}
              >
                Help
              </button>
              <button
                onClick={() => handleButtonClick('contact')}
                className={`text-sm font-medium transition-colors duration-200 ${
                  activeButton === 'contact'
                    ? 'text-teal-400 border-l-2 border-teal-400 pl-2'
                    : 'text-gray-300 hover:text-teal-400'
                }`}
              >
                Contact
              </button>
              <button
                onClick={() => handleButtonClick('login')}
                className="bg-teal-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-teal-700 transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-teal-500/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Login</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header; 