import React from 'react';

function Help() {
  return (
    <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-6rem)]">
      <div className="max-w-4xl w-full mx-6 p-8 rounded-2xl bg-white/10 backdrop-blur-sm">
        <h2 className="text-4xl font-bold mb-8 text-white text-center">Help & Support</h2>
        <div className="space-y-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white/10 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
              <ul className="space-y-3">
                <li>• How do I register as a visitor?</li>
                <li>• What documents do I need to visit?</li>
                <li>• What are the visiting hours?</li>
                <li>• How can I contact the prison administration?</li>
              </ul>
            </div>
            <div className="p-6 bg-white/10 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Contact Support</h3>
              <p className="mb-4">Need help? Contact our support team:</p>
              <p>Email: support@guragepms.com</p>
              <p>Phone: +251 123 456 789</p>
              <p>Hours: Monday - Friday, 8:00 AM - 5:00 PM</p>
            </div>
          </div>
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Submit a Support Ticket</h3>
            <form className="space-y-4">
              <input type="text" placeholder="Subject" className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white" />
              <textarea placeholder="Describe your issue" className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white h-32"></textarea>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300">
                Submit Ticket
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Help; 