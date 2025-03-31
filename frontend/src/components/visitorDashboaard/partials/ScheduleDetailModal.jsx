import React from "react";
import { FaTimes, FaEdit, FaTimesCircle } from "react-icons/fa";
import { format } from "date-fns";

const ScheduleDetailModal = ({
  isOpen,
  onClose,
  schedule,
  onUpdate,
  onCancel
}) => {
  if (!isOpen || !schedule) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Visit Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-8">
          {/* Personal Information Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-6 bg-blue-600 rounded mr-2"></span>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">First Name</p>
                <p className="text-base font-semibold text-gray-800">{schedule.firstName || 'Not provided'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">Middle Name</p>
                <p className="text-base font-semibold text-gray-800">{schedule.middleName || 'Not provided'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">Last Name</p>
                <p className="text-base font-semibold text-gray-800">{schedule.lastName || 'Not provided'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                <p className="text-base font-semibold text-gray-800">{schedule.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* ID Information Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-6 bg-blue-600 rounded mr-2"></span>
              ID Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">ID Type</p>
                <p className="text-base font-semibold text-gray-800 capitalize">{schedule.idType || 'Not provided'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">ID Number</p>
                <p className="text-base font-semibold text-gray-800">{schedule.idNumber || 'Not provided'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">ID Expiry Date</p>
                <p className="text-base font-semibold text-gray-800">
                  {schedule.idExpiryDate ? format(new Date(schedule.idExpiryDate), "MMMM d, yyyy") : 'Not provided'}
                </p>
              </div>
              {schedule.idPhoto && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-500 mb-1">ID Photo</p>
                  <img
                    src={`http://localhost:5001${schedule.idPhoto}`}
                    alt="ID Photo"
                    className="w-32 h-32 object-cover rounded-md mt-2 border border-gray-200"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/150?text=No+Image";
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Visit Details Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-6 bg-blue-600 rounded mr-2"></span>
              Visit Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">Visit Date</p>
                <p className="text-base font-semibold text-gray-800">
                  {format(new Date(schedule.visitDate), "MMMM d, yyyy")}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">Visit Time</p>
                <p className="text-base font-semibold text-gray-800">{schedule.visitTime}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">Duration</p>
                <p className="text-base font-semibold text-gray-800">{schedule.visitDuration} minutes</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">Purpose</p>
                <p className="text-base font-semibold text-gray-800">{schedule.purpose}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">Relationship</p>
                <p className="text-base font-semibold text-gray-800 capitalize">{schedule.relationship}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  schedule.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                  schedule.status === "approved" ? "bg-green-100 text-green-800" :
                  schedule.status === "rejected" ? "bg-red-100 text-red-800" :
                  schedule.status === "completed" ? "bg-blue-100 text-blue-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Inmate Information Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-6 bg-blue-600 rounded mr-2"></span>
              Inmate Information
            </h3>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-500 mb-1">Inmate Name</p>
              <p className="text-base font-semibold text-gray-800">
                {schedule.inmateId ? schedule.inmateId.fullName : "No inmate selected"}
              </p>
            </div>
          </div>

          {/* Visitor Photo Section */}
          {schedule.visitorPhoto && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-2 h-6 bg-blue-600 rounded mr-2"></span>
                Visitor Photo
              </h3>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <img
                  src={`http://localhost:5001${schedule.visitorPhoto}`}
                  alt="Visitor Photo"
                  className="w-32 h-32 object-cover rounded-md border border-gray-200"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/150?text=No+Image";
                  }}
                />
              </div>
            </div>
          )}

          {/* Notes Section */}
          {schedule.notes && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-2 h-6 bg-blue-600 rounded mr-2"></span>
                Additional Notes
              </h3>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-700 whitespace-pre-wrap">{schedule.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {schedule.status === "pending" && (
          <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-4">
            <button
              onClick={() => onUpdate(schedule)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <FaEdit className="inline-block mr-2" />
              Update
            </button>
            <button
              onClick={() => onCancel(schedule)}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            >
              <FaTimesCircle className="inline-block mr-2" />
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Close
            </button>
          </div>
        )}
        {schedule.status !== "pending" && (
          <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleDetailModal; 