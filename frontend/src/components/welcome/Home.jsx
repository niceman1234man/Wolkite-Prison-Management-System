import React from 'react';
import guragePrison from "../../assets/guragePrison.jpg";

function Home({ messages, currentMessageIndex, setCurrentMessageIndex, handleImageError, loading }) {
  return (
    <div className="relative z-10">
      {/* Hero Section with Parallax Effect */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden mt-16">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${guragePrison})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/40 to-black/50"></div>
        </div>
        <div className="relative z-10 text-center px-4 w-full">
          <h1 className="text-6xl md:text-7xl font-bold text-white font-[Roboto] drop-shadow-lg mb-8">
            Gurage Zone PMS
          </h1>
          <p className="text-2xl text-white/90 mb-12 max-w-3xl mx-auto drop-shadow-lg">
            Advancing Justice Through Technology
          </p>
          {messages.length > 0 && (
            <div className="relative w-full">
              <div className="bg-white rounded-2xl overflow-hidden shadow-xl transform transition-all duration-500">
                {messages[currentMessageIndex].image && (
                  <div className="relative h-[600px] overflow-hidden">
                    <img
                      src={messages[currentMessageIndex].image}
                      alt="Announcement"
                      className="w-full h-full object-cover transform transition-transform duration-500"
                      onError={(e) => handleImageError(e, "https://via.placeholder.com/800x400?text=Image+Not+Found")}
                    />
                  </div>
                )}
                <div className="p-12">
                  <p className="text-gray-800 text-2xl leading-relaxed">
                    {messages[currentMessageIndex].text}
                  </p>
                </div>
              </div>
              <div className="flex justify-center space-x-3 mt-6">
                {messages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMessageIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentMessageIndex === index
                        ? 'bg-teal-600 w-8'
                        : 'bg-gray-300 hover:bg-gray-400 w-2'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-16 drop-shadow-lg">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="text-gray-800 text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Secure Management</h3>
              <p className="text-gray-600">Advanced security protocols and real-time monitoring systems</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="text-gray-800 text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Digital Records</h3>
              <p className="text-gray-600">Comprehensive digital record management and tracking</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="text-gray-800 text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Visitor Management</h3>
              <p className="text-gray-600">Streamlined visitor registration and monitoring</p>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Updates Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-16 drop-shadow-lg">Latest Updates</h2>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {messages.slice(0, 3).map((message) => (
                <div
                  key={message._id}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  {message.image && (
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={message.image}
                        alt="Announcement"
                        className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
                        onError={(e) => handleImageError(e, "https://via.placeholder.com/800x400?text=Image+Not+Found")}
                      />
                    </div>
                  )}
                  <div className="p-8">
                    <p className="text-gray-800 text-lg leading-relaxed">
                      {message.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="text-gray-800 text-2xl">📍</div>
                  <div>
                    <p className="text-gray-800 font-semibold">Address</p>
                    <p className="text-gray-600">Gurage Zone Prison, Wolkite, Ethiopia</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-gray-800 text-2xl">📞</div>
                  <div>
                    <p className="text-gray-800 font-semibold">Phone</p>
                    <p className="text-gray-600">+251 123 456 789</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-gray-800 text-2xl">✉️</div>
                  <div>
                    <p className="text-gray-800 font-semibold">Email</p>
                    <p className="text-gray-600">info@guragepms.com</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">Visiting Hours</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-800">Monday - Friday</span>
                  <span className="text-gray-600">9:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-800">Saturday</span>
                  <span className="text-gray-600">9:00 AM - 2:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-800">Sunday</span>
                  <span className="text-gray-600">Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home; 