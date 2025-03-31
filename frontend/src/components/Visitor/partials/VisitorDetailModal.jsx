import React from "react";
import { FaTimes, FaPrint, FaCheck, FaClock } from "react-icons/fa";

const VisitorDetailModal = ({
  visitor,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onPostpone,
  userRole
}) => {
  if (!isOpen || !visitor) return null;

  // Get user role from localStorage if not provided
  const storedUser = JSON.parse(localStorage.getItem("user") || '{}');
  const effectiveUserRole = userRole || storedUser?.role;
  const isPending = visitor.status?.toLowerCase() === 'pending';
  const isPoliceOrAdmin = effectiveUserRole === 'police-officer' || effectiveUserRole === 'admin';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl print:shadow-none print:max-w-none print:max-h-none">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center print:sticky print:top-0">
          <h2 className="text-2xl font-bold text-gray-800">Visitor Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center transition-colors print:hidden"
            >
              <FaPrint className="mr-2" /> Print
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors print:hidden"
            >
              <FaTimes size={24} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-8 print:p-4">
          {/* Personal Information Section */}
          <div className="bg-gray-50 rounded-lg p-6 print:bg-white print:border print:border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-6 bg-blue-600 rounded mr-2 print:bg-gray-300"></span>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-1">First Name</p>
                <p className="text-base font-semibold text-gray-800">{visitor.firstName || 'Not provided'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-1">Middle Name</p>
                <p className="text-base font-semibold text-gray-800">{visitor.middleName || 'Not provided'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-1">Last Name</p>
                <p className="text-base font-semibold text-gray-800">{visitor.lastName || 'Not provided'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                <p className="text-base font-semibold text-gray-800">{visitor.phone || 'Not provided'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                <p className="text-base font-semibold text-gray-800">{visitor.email || 'Not provided'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-1">Address</p>
                <p className="text-base font-semibold text-gray-800">{visitor.address || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* ID Information Section */}
          <div className="bg-gray-50 rounded-lg p-6 print:bg-white print:border print:border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-6 bg-blue-600 rounded mr-2 print:bg-gray-300"></span>
              ID Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-1">ID Type</p>
                <p className="text-base font-semibold text-gray-800 capitalize">{visitor.idType || 'Not provided'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-1">ID Number</p>
                <p className="text-base font-semibold text-gray-800">{visitor.idNumber || 'Not provided'}</p>
              </div>
              {visitor.idPhoto && (
                <div className="bg-white p-4 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-1">ID Photo</p>
                  <img
                    src={`http://localhost:5001${visitor.idPhoto}`}
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

          {/* Visit Information Section */}
          <div className="bg-gray-50 rounded-lg p-6 print:bg-white print:border print:border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-6 bg-blue-600 rounded mr-2 print:bg-gray-300"></span>
              Visit Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-1">Purpose</p>
                <p className="text-base font-semibold text-gray-800">{visitor.purpose || 'Not provided'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-1">Visit Date</p>
                <p className="text-base font-semibold text-gray-800">{visitor.date || 'Not provided'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  visitor.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  visitor.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                  visitor.status === 'Postponed' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {visitor.status || 'Pending'}
                </span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-1">Created At</p>
                <p className="text-base font-semibold text-gray-800">{visitor.createdAt || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Visitor Photo Section */}
          {visitor.photo && (
            <div className="bg-gray-50 rounded-lg p-6 print:bg-white print:border print:border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-2 h-6 bg-blue-600 rounded mr-2 print:bg-gray-300"></span>
                Visitor Photo
              </h3>
              <div className="bg-white p-4 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200">
                <img
                  src={`http://localhost:5001${visitor.photo}`}
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

          {/* Additional Photos Section */}
          {visitor.photos && visitor.photos.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6 print:bg-white print:border print:border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-2 h-6 bg-blue-600 rounded mr-2 print:bg-gray-300"></span>
                Additional Photos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visitor.photos.map((photo, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200">
                    <img
                      src={`http://localhost:5001${photo}`}
                      alt={`Additional photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md border border-gray-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/150?text=No+Image";
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons for Police Officers and Admin */}
        {isPoliceOrAdmin && isPending && (
          <div className="sticky bottom-0 bg-white border-t p-4 flex flex-wrap gap-3 justify-end print:hidden">
            <button
              onClick={() => onApprove(visitor._id)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md flex items-center transition-colors"
            >
              <FaCheck className="mr-2" /> Approve
            </button>
            <button
              onClick={() => onReject(visitor._id)}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md flex items-center transition-colors"
            >
              <FaTimes className="mr-2" /> Reject
            </button>
            <button
              onClick={() => onPostpone(visitor._id)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md flex items-center transition-colors"
            >
              <FaClock className="mr-2" /> Postpone
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitorDetailModal; 