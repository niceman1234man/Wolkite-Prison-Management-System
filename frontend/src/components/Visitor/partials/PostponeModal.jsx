import React, { useState } from "react";
import { FaTimes, FaCalendarAlt } from "react-icons/fa";

const PostponeModal = ({ isOpen, onClose, onSubmit, visitor }) => {
  const [newDate, setNewDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate) {
      return;
    }

    setIsSubmitting(true);
    await onSubmit(newDate);
    setIsSubmitting(false);
    setNewDate("");
  };

  // Calculate minimum date (today)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="bg-yellow-500 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center">
            <FaCalendarAlt className="mr-2" /> 
            Postpone Visit
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <p className="mb-4">
                <span className="font-semibold">Visitor:</span>{" "}
                {visitor ? `${visitor.firstName} ${visitor.middleName || ''} ${visitor.lastName}` : 'Unknown visitor'}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Current Date:</span>{" "}
                {visitor?.date || 'Unknown date'}
              </p>
              <label className="block text-gray-700 font-semibold mb-2">
                Select New Date:
              </label>
              <input
                type="date"
                min={minDate}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newDate}
                className={`px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors flex items-center ${
                  isSubmitting || !newDate ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Confirm Postponement'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostponeModal; 