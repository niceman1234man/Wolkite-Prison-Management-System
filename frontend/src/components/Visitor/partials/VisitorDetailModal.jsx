import React, { useState, useEffect } from "react";
import { 
  FaTimes, 
  FaPrint, 
  FaCheck, 
  FaClock, 
  FaExclamationTriangle, 
  FaUserCircle, 
  FaIdCard, 
  FaCalendarAlt, 
  FaInfoCircle,
  FaPhone,
  FaMapMarkerAlt,
  FaEnvelope,
  FaClipboard,
  FaTimesCircle,
  FaEdit
} from "react-icons/fa";
import axiosInstance from "../../../utils/axiosInstance.js";
import { format } from "date-fns";

const VisitorDetailModal = ({
  visitor,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onPostpone,
  onUpdate,
  capacityReached,
  userRole
}) => {
  const [capacityInfo, setCapacityInfo] = useState({
    maxCapacity: 50,
    currentCount: 0,
    hasReachedCapacity: false,
    isLoading: true
  });

  // Fetch visitor capacity statistics when modal opens
  useEffect(() => {
    if (isOpen && visitor) {
      fetchCapacityInfo();
    }
  }, [isOpen, visitor]);

  // Fetch capacity info from API
  const fetchCapacityInfo = async () => {
    try {
      const response = await axiosInstance.get('/visitor/schedule/capacity');
      
      if (response.data && response.data.success) {
        const maxCapacity = response.data.maxCapacity || 50;
        const approvedCount = response.data.approvedCount || 0;
        
        setCapacityInfo({
          maxCapacity,
          currentCount: approvedCount,
          hasReachedCapacity: approvedCount >= maxCapacity,
          isLoading: false
        });
      }
    } catch (error) {
      console.error("Error fetching capacity info:", error);
      // Default values if API fails
      setCapacityInfo(prev => ({ 
        ...prev, 
        hasReachedCapacity: false, 
        isLoading: false 
      }));
    }
  };

  if (!isOpen || !visitor) return null;

  // Get user role from localStorage if not provided
  const storedUser = JSON.parse(localStorage.getItem("user") || '{}');
  const effectiveUserRole = userRole || storedUser?.role;
  const isPending = visitor.status?.toLowerCase() === 'pending';
  const isPoliceOrAdmin = effectiveUserRole === 'police-officer' || effectiveUserRole === 'admin';

  // Format date properly
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Not provided';
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (e) {
      console.error("Date formatting error:", e);
      return dateString || 'Not provided';
    }
  };

  // Get status badge color and style
  const getStatusBadge = (status) => {
    if (!status) return { bg: "bg-gray-100", text: "text-gray-800", label: "Pending" };
    
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    
    switch (status.toLowerCase()) {
      case "pending":
        return { bg: "bg-yellow-100", text: "text-yellow-800", label: formattedStatus };
      case "approved":
        return { bg: "bg-green-100", text: "text-green-800", label: formattedStatus };
      case "rejected":
        return { bg: "bg-red-100", text: "text-red-800", label: formattedStatus };
      case "postponed":
        return { bg: "bg-orange-100", text: "text-orange-800", label: formattedStatus };
      case "cancelled":
        return { bg: "bg-gray-100", text: "text-gray-800", label: formattedStatus };
      case "completed":
        return { bg: "bg-blue-100", text: "text-blue-800", label: formattedStatus };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", label: formattedStatus };
    }
  };
  
  const statusBadge = getStatusBadge(visitor.status);

  // Get proper image URL with error handling
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    } else {
      return `http://localhost:5001${imagePath}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-5 flex justify-between items-center">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold mr-3">Visitor Details</h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white ${statusBadge.text}`}>
              {statusBadge.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
              onClick={() => window.print()}
              title="Print details"
            >
              <FaPrint size={18} />
            </button>
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
              title="Close"
            >
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* Capacity Warning - Only show for pending visitors */}
        {isPending && capacityInfo.hasReachedCapacity && isPoliceOrAdmin && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-yellow-500 mr-3" />
              <div>
                <p className="font-medium text-yellow-700">Visitor Capacity Warning</p>
                <p className="text-sm text-yellow-600">Maximum visitor capacity has been reached ({capacityInfo.currentCount}/{capacityInfo.maxCapacity}). You cannot approve more visitors until capacity is increased or some visits are completed.</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Content scrollable area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Visitor Information */}
            <div className="md:col-span-2 space-y-6">
              {/* Personal Information Section */}
              <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaUserCircle className="text-indigo-600 mr-2" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
                    <p className="text-sm font-medium text-gray-500 mb-1">First Name</p>
                    <p className="text-base font-semibold text-gray-800">{visitor.firstName || 'Not provided'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
                    <p className="text-sm font-medium text-gray-500 mb-1">Middle Name</p>
                    <p className="text-base font-semibold text-gray-800">{visitor.middleName || 'Not provided'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
                    <p className="text-sm font-medium text-gray-500 mb-1">Last Name</p>
                    <p className="text-base font-semibold text-gray-800">{visitor.lastName || 'Not provided'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      <FaPhone className="inline mr-1 text-gray-400" /> Phone Number
                    </p>
                    <p className="text-base font-semibold text-gray-800">{visitor.phone || 'Not provided'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      <FaEnvelope className="inline mr-1 text-gray-400" /> Email
                    </p>
                    <p className="text-base font-semibold text-gray-800">{visitor.email || 'Not provided'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      <FaMapMarkerAlt className="inline mr-1 text-gray-400" /> Address
                    </p>
                    <p className="text-base font-semibold text-gray-800">{visitor.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* ID Information Section */}
              <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaIdCard className="text-indigo-600 mr-2" />
                  ID Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
                    <p className="text-sm font-medium text-gray-500 mb-1">ID Type</p>
                    <p className="text-base font-semibold text-gray-800 capitalize">{visitor.idType || 'Not provided'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
                    <p className="text-sm font-medium text-gray-500 mb-1">ID Number</p>
                    <p className="text-base font-semibold text-gray-800">{visitor.idNumber || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Visit Information Section */}
              <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaCalendarAlt className="text-indigo-600 mr-2" />
                  Visit Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
                    <p className="text-sm font-medium text-gray-500 mb-1">Purpose</p>
                    <p className="text-base font-semibold text-gray-800">{visitor.purpose || 'Not provided'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
                    <p className="text-sm font-medium text-gray-500 mb-1">Visit Date</p>
                    <p className="text-base font-semibold text-gray-800">{formatDate(visitor.date)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
                    <p className="text-sm font-medium text-gray-500 mb-1">Visit Time</p>
                    <p className="text-base font-semibold text-gray-800">{visitor.time || 'Not provided'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      <FaClipboard className="inline mr-1 text-gray-400" /> Status
                    </p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                  
                  {visitor.inmate && (
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors md:col-span-2">
                      <p className="text-sm font-medium text-gray-500 mb-1">Inmate</p>
                      <p className="text-base font-semibold text-gray-800">
                        {typeof visitor.inmate === 'object' ? 
                          visitor.inmate.fullName : 
                          visitor.inmate}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Notes Section - only show if notes exist */}
              {visitor.notes && (
                <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaInfoCircle className="text-indigo-600 mr-2" />
                    Additional Notes
                  </h3>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
                    <p className="text-gray-700 whitespace-pre-wrap">{visitor.notes}</p>
                  </div>
                </div>
              )}
              
              {/* Rejection Reason - Show if rejected */}
              {visitor.status?.toLowerCase() === 'rejected' && visitor.rejectionReason && (
                <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-6 border border-red-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center border-b border-red-200 pb-2">
                    <FaTimesCircle className="text-red-600 mr-2" />
                    Rejection Reason
                  </h3>
                  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
                    <p className="text-gray-700 whitespace-pre-wrap">{visitor.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Column - Photos and Status */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaClipboard className="text-indigo-600 mr-2" />
                  Visit Status
                </h3>
                <div className={`p-6 rounded-lg text-center ${
                  visitor.status?.toLowerCase() === "pending" ? "bg-yellow-50 border border-yellow-200" :
                  visitor.status?.toLowerCase() === "approved" ? "bg-green-50 border border-green-200" :
                  visitor.status?.toLowerCase() === "rejected" ? "bg-red-50 border border-red-200" :
                  visitor.status?.toLowerCase() === "postponed" ? "bg-orange-50 border border-orange-200" :
                  "bg-gray-50 border border-gray-200"
                }`}>
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                    visitor.status?.toLowerCase() === "pending" ? "bg-yellow-100 text-yellow-600" :
                    visitor.status?.toLowerCase() === "approved" ? "bg-green-100 text-green-600" :
                    visitor.status?.toLowerCase() === "rejected" ? "bg-red-100 text-red-600" :
                    visitor.status?.toLowerCase() === "postponed" ? "bg-orange-100 text-orange-600" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {visitor.status?.toLowerCase() === "pending" ? <FaClock size={24} /> :
                     visitor.status?.toLowerCase() === "approved" ? <FaCheck size={24} /> :
                     visitor.status?.toLowerCase() === "rejected" ? <FaTimesCircle size={24} /> :
                     visitor.status?.toLowerCase() === "postponed" ? <FaCalendarAlt size={24} /> :
                     <FaInfoCircle size={24} />}
                  </div>
                  <h4 className="text-xl font-bold capitalize mb-2">
                    {visitor.status || "Pending"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {visitor.status?.toLowerCase() === "pending" ? "Awaiting approval from prison officers" :
                     visitor.status?.toLowerCase() === "approved" ? "Visit has been approved" :
                     visitor.status?.toLowerCase() === "rejected" ? "Visit request was rejected" :
                     visitor.status?.toLowerCase() === "postponed" ? "Visit has been postponed" :
                     "Status information unavailable"}
                  </p>
                </div>
              </div>
              
              {/* Visitor Photo */}
              {visitor.photo && (
                <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaUserCircle className="text-indigo-600 mr-2" />
                    Visitor Photo
                  </h3>
                  <div className="flex justify-center">
                    <img
                      src={getImageUrl(visitor.photo)}
                      alt="Visitor"
                      className="w-48 h-48 object-cover rounded-lg shadow-md border border-gray-200 hover:border-indigo-300 transition-all hover:shadow-lg"
                      onError={(e) => {
                        console.error("Failed to load visitor photo");
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/150?text=No+Photo";
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* ID Photo */}
              {visitor.idPhoto && (
                <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaIdCard className="text-indigo-600 mr-2" />
                    ID Photo
                  </h3>
                  <div className="flex justify-center">
                    <img
                      src={getImageUrl(visitor.idPhoto)}
                      alt="ID"
                      className="w-48 h-48 object-cover rounded-lg shadow-md border border-gray-200 hover:border-indigo-300 transition-all hover:shadow-lg"
                      onError={(e) => {
                        console.error("Failed to load ID photo");
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/150?text=No+ID+Photo";
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons for Police Officers and Admins */}
        {isPoliceOrAdmin && isPending && (
          <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-4">
            <button
              onClick={() => onApprove?.(visitor._id)}
              disabled={capacityInfo.hasReachedCapacity}
              className={`px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all flex items-center ${
                capacityInfo.hasReachedCapacity ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={capacityInfo.hasReachedCapacity ? "Cannot approve - maximum capacity reached" : "Approve visit"}
            >
              <FaCheck className="inline-block mr-2" />
              Approve
            </button>
            <button
              onClick={() => onReject?.(visitor._id)}
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all flex items-center"
            >
              <FaTimesCircle className="inline-block mr-2" />
              Reject
            </button>
            <button
              onClick={() => onPostpone?.(visitor._id)}
              className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all flex items-center"
            >
              <FaClock className="inline-block mr-2" />
              Postpone
            </button>
            <button
              onClick={() => onUpdate?.(visitor)}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all flex items-center"
            >
              <FaEdit className="inline-block mr-2" />
              Update
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all flex items-center"
            >
              Close
            </button>
          </div>
        )}
        
        {/* Simplified Action Buttons for Non-Pending Status */}
        {(isPoliceOrAdmin && !isPending) && (
          <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-4">
            <button
              onClick={() => onUpdate?.(visitor)}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all flex items-center"
            >
              <FaEdit className="inline-block mr-2" />
              Update
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all flex items-center"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitorDetailModal; 