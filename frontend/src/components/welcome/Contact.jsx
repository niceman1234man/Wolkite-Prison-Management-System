import React from 'react';

function Contact() {
  return (
    <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-6rem)]">
      <div className="max-w-4xl w-full mx-6 p-8 rounded-2xl bg-white/10 backdrop-blur-sm">
        <h2 className="text-4xl font-bold mb-8 text-white text-center">Contact Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6 text-white">
            <div>
              <h3 className="text-xl font-semibold mb-4">Address</h3>
              <p>Gurage Zone Prison Management</p>
              <p>Wolkite, Ethiopia</p>
              <p>P.O. Box: 1234</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
              <p>Phone: +251 123 456 789</p>
              <p>Email: info@guragepms.com</p>
              <p>Fax: +251 123 456 790</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Office Hours</h3>
              <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
              <p>Saturday: 9:00 AM - 1:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
          <div>
            <form className="space-y-4">
              <input type="text" placeholder="Your Name" className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white" />
              <input type="email" placeholder="Your Email" className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white" />
              <input type="text" placeholder="Subject" className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white" />
              <textarea placeholder="Your Message" className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white h-32"></textarea>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact; 