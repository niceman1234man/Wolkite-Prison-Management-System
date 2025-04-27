import React, { useEffect } from "react";
import {
  FaTimes,
  FaEdit,
  FaTimesCircle,
  FaCheck,
  FaExclamationTriangle,
  FaClock,
  FaUserCircle,
  FaIdCard,
  FaCalendarAlt,
  FaInfoCircle,
  FaPhone,
  FaMapMarkerAlt,
  FaClipboard,
  FaSave,
  FaPrint,
  FaDownload,
  FaShare,
  FaFileExcel
} from "react-icons/fa";
import { format } from "date-fns";
import '../../../styles/responsive.css';
import { getImageUrl, getPlaceholderUrl, handleImageError } from '../../../utils/imageUtils';

const ScheduleDetailModal = ({
  isOpen,
  onClose,
  schedule,
  onEdit,
  onCancel,
  onApprove,
  onReject,
  onPostpone,
  capacityReached = false,
  userRole
}) => {
  if (!isOpen || !schedule) return null;

  const isPoliceOrAdmin = userRole === 'police-officer' || userRole === 'admin';
  const isPending = schedule.status?.toLowerCase() === 'pending';
  const isApproved = schedule.status?.toLowerCase() === 'approved';
  const isRejected = schedule.status?.toLowerCase() === 'rejected';
  const canCancel = isPending || isApproved;
  
  // Format dates properly with fallbacks
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Not provided';
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (e) {
      console.error("Date formatting error:", e);
      return dateString || 'Not provided';
    }
  };
  
  // Format dates with time
  const formatDateTime = (dateString) => {
    try {
      if (!dateString) return 'Not provided';
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return dateString || 'Not provided';
    }
  };
  
  // Get proper image URL with error handling
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    console.log("Processing image path:", imagePath);
    
    // If it already starts with http/https, it's a full URL
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's a relative path starting with /uploads or /api
    if (imagePath.startsWith('/uploads') || imagePath.startsWith('/api')) {
      // Try to get the API URL from environment, fallback to localhost
      const apiBaseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5001';
      return `${apiBaseUrl}${imagePath}`;
    }
    
    // For other relative paths, just prepend the API base URL
    const apiBaseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5001';
    return `${apiBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  // Debug image paths
  useEffect(() => {
    console.log("Schedule in detail modal:", schedule);
    console.log("ID Photo path:", schedule.idPhoto);
    console.log("Visitor Photo path:", schedule.visitorPhoto);
    if (schedule.idPhoto) {
      console.log("ID Photo URL from getImageUrl:", getImageUrl(schedule.idPhoto));
    }
    if (schedule.visitorPhoto) {
      console.log("Visitor Photo URL from getImageUrl:", getImageUrl(schedule.visitorPhoto));
    }
  }, [schedule]);

  // Get status badge color and style
  const getStatusBadge = (status) => {
    if (!status) return { bg: "bg-gray-100", text: "text-gray-800", label: "Unknown" };
    
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    
    switch (status.toLowerCase()) {
      case "pending":
        return { bg: "bg-yellow-100", text: "text-yellow-800", label: formattedStatus };
      case "approved":
        return { bg: "bg-green-100", text: "text-green-800", label: formattedStatus };
      case "rejected":
        return { bg: "bg-red-100", text: "text-red-800", label: formattedStatus };
      case "cancelled":
        return { bg: "bg-gray-100", text: "text-gray-800", label: formattedStatus };
      case "completed":
        return { bg: "bg-blue-100", text: "text-blue-800", label: formattedStatus };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", label: formattedStatus };
    }
  };
  
  const statusBadge = getStatusBadge(schedule.status);

  // Handle cancel button click
  const handleCancelClick = () => {
    if (onCancel && schedule) {
      onCancel(schedule);
    }
  };

  // Handle update button click
  const handleUpdateClick = () => {
    if (onEdit && schedule) {
      onEdit(schedule);
    }
  };
  
  // Download schedule details as JSON
  const downloadScheduleDetails = () => {
    try {
      // Create formatted data for download
      const dataToDownload = {
        visitId: schedule._id,
        visitorName: `${schedule.firstName || ''} ${schedule.middleName || ''} ${schedule.lastName || ''}`.trim(),
        phone: schedule.phone || 'Not provided',
        address: schedule.address || 'Not provided',
        idType: schedule.idType || 'Not provided',
        idNumber: schedule.idNumber || 'Not provided',
        idExpiryDate: schedule.idExpiryDate ? formatDate(schedule.idExpiryDate) : 'Not provided',
        visitDate: schedule.visitDate ? formatDate(schedule.visitDate) : 'Not provided',
        visitTime: schedule.visitTime || 'Not specified',
        visitDuration: `${schedule.visitDuration || "30"} minutes`,
        purpose: schedule.purpose || 'Not specified',
        status: schedule.status || 'Unknown',
        inmateName: schedule.inmateId?.fullName || 'Not specified',
        relationship: schedule.relationship || 'Not specified',
        createdAt: schedule.createdAt ? formatDateTime(schedule.createdAt) : 'Not provided',
        notes: schedule.notes || 'No additional notes'
      };
      
      // Convert to JSON string
      const dataStr = JSON.stringify(dataToDownload, null, 2);
      
      // Create download link
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      // Create download element
      const exportLink = document.createElement('a');
      exportLink.setAttribute('href', dataUri);
      exportLink.setAttribute('download', `visit-details-${schedule._id || 'unknown'}.json`);
      document.body.appendChild(exportLink);
      exportLink.click();
      document.body.removeChild(exportLink);
    } catch (error) {
      console.error("Error downloading details:", error);
      alert("Failed to download visit details");
    }
  };

  // Function to download as CSV
  const downloadAsCSV = () => {
    try {
      // CSV header
      const headers = [
        "Visit ID", "Visitor Name", "Phone", "Address", "ID Type", "ID Number",
        "ID Expiry Date", "Visit Date", "Visit Time", "Duration", "Purpose",
        "Status", "Inmate Name", "Relationship", "Created At", "Approved At",
        "Completed At", "Cancelled At", "Notes"
      ];
      
      // CSV data
      const data = [
        schedule._id || "",
        `${schedule.firstName || ''} ${schedule.middleName || ''} ${schedule.lastName || ''}`.trim(),
        schedule.phone || 'Not provided',
        schedule.address || 'Not provided',
        schedule.idType || 'Not provided',
        schedule.idNumber || 'Not provided',
        schedule.idExpiryDate ? formatDate(schedule.idExpiryDate) : 'Not provided',
        schedule.visitDate ? formatDate(schedule.visitDate) : 'Not provided',
        schedule.visitTime || 'Not specified',
        `${schedule.visitDuration || "30"} minutes`,
        schedule.purpose || 'Not specified',
        schedule.status || 'Unknown',
        schedule.inmateId?.fullName || 'Not specified',
        schedule.relationship || 'Not specified',
        schedule.createdAt ? formatDateTime(schedule.createdAt) : 'Not provided',
        schedule.approvedAt ? formatDateTime(schedule.approvedAt) : 'Not applicable',
        schedule.completedAt ? formatDateTime(schedule.completedAt) : 'Not applicable',
        schedule.cancelledAt ? formatDateTime(schedule.cancelledAt) : 'Not applicable',
        (schedule.notes || 'No additional notes').replace(/\n/g, ' ')
      ];
      
      // Format CSV string with proper escaping of fields
      const formatCSVField = (field) => {
        if (field === null || field === undefined) return '';
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      };
      
      const csvContent = [
        headers.map(formatCSVField).join(','),
        data.map(formatCSVField).join(',')
      ].join('\n');
      
      // Create a blob from the CSV data
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `visit-details-${schedule._id}.csv`;
      
      // Append to document, click to download, then remove
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading visit details as CSV:", error);
      alert("Failed to download visit details as CSV");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl w-full">
          {/* Modal Header */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex items-center justify-between border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Visit Details</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                {statusBadge.label}
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={downloadScheduleDetails}
                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors focus:outline-none"
                title="Download as JSON"
              >
                <FaDownload className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={downloadAsCSV}
                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors focus:outline-none"
                title="Download as CSV"
              >
                <FaFileExcel className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors focus:outline-none"
                title="Print Details"
              >
                <FaPrint className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors focus:outline-none"
                title="Close"
              >
                <FaTimes className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Rejection Reason Banner - will only show if visit was rejected */}
          {isRejected && (schedule.formattedRejectionInfo || schedule.rejectionReason) && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FaTimesCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">This visit request was rejected</h3>
                  <div className="mt-2 text-sm text-red-700 whitespace-pre-line">
                    <span className="font-semibold">Reason: </span>
                    {schedule.formattedRejectionInfo || schedule.rejectionReason}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning Banner for Capacity */}
          {capacityReached && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Warning:</strong> Maximum visitor capacity has been reached. New visits cannot be approved at this time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Modal Content */}
          <div className="px-4 py-5 sm:p-6 max-h-[70vh] overflow-y-auto">
            <div className="p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Left Column - Visitor Information */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Personal Information Section */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-6 border border-blue-100 shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center border-b pb-2">
                    <FaUserCircle className="text-blue-600 mr-2 text-sm sm:text-base" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Full Name</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-800">
                        {schedule.firstName || ''} {schedule.middleName || ''} {schedule.lastName || ''}
                      </p>
                    </div>
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                        <FaPhone className="inline mr-1 text-gray-400" /> Phone Number
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-gray-800">{schedule.phone || 'Not provided'}</p>
                    </div>
                    
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                        <FaMapMarkerAlt className="inline mr-1 text-gray-400" /> Address
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-gray-800">{schedule.address || 'Not provided'}</p>
                    </div>
                    
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                        <FaClipboard className="inline mr-1 text-gray-400" /> Status
                      </p>
                      <span className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${
                        statusBadge.bg} ${statusBadge.text}`
                      }>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ID Information Section */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-6 border border-blue-100 shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center border-b pb-2">
                    <FaIdCard className="text-blue-600 mr-2 text-sm sm:text-base" />
                    ID Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">ID Type</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-800 capitalize">{schedule.idType || 'Not provided'}</p>
                    </div>
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">ID Number</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-800">{schedule.idNumber || 'Not provided'}</p>
                    </div>
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">ID Expiry Date</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-800">
                        {formatDate(schedule.idExpiryDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ID Photo Section */}
                {schedule.idPhoto && (
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-6 border border-blue-100 shadow-sm mt-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center border-b pb-2">
                      <FaIdCard className="text-blue-600 mr-2 text-sm sm:text-base" />
                      ID Photo
                    </h3>
                    <div className="flex justify-center">
                      <img
                        src={getImageUrl(schedule.idPhoto)}
                        alt="ID"
                        className="w-48 h-48 object-cover rounded-lg shadow-md border border-gray-200 hover:border-blue-300 transition-all hover:shadow-lg"
                        onError={(e) => handleImageError(e, 'ID Photo', schedule.idPhoto)}
                      />
                    </div>
                  </div>
                )}
                
                {/* Visitor Photo Section */}
                {schedule.visitorPhoto && (
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-6 border border-blue-100 shadow-sm mt-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center border-b pb-2">
                      <FaUserCircle className="text-blue-600 mr-2 text-sm sm:text-base" />
                      Visitor Photo
                    </h3>
                    <div className="flex justify-center">
                      <img
                        src={getImageUrl(schedule.visitorPhoto)}
                        alt="Visitor"
                        className="w-48 h-48 object-cover rounded-lg shadow-md border border-gray-200 hover:border-blue-300 transition-all hover:shadow-lg"
                        onError={(e) => handleImageError(e, 'Visitor Photo', schedule.visitorPhoto)}
                      />
                    </div>
                  </div>
                )}

                {/* Visit Details Section */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-6 border border-blue-100 shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center border-b pb-2">
                    <FaCalendarAlt className="text-blue-600 mr-2 text-sm sm:text-base" />
                    Visit Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Visit Date</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-800">
                        {formatDate(schedule.visitDate)}
                      </p>
                    </div>
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Visit Time</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-800">{schedule.visitTime || 'Not specified'}</p>
                    </div>
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Duration</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-800">{schedule.visitDuration || "30"} minutes</p>
                    </div>
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Purpose</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-800">{schedule.purpose || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Inmate Information */}
              <div className="space-y-4 sm:space-y-6">
                {/* Inmate Information Section */}
                <div className="bg-gradient-to-r from-gray-50 to-teal-50 rounded-lg sm:rounded-xl p-3 sm:p-6 border border-teal-100 shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center border-b pb-2">
                    <FaUserCircle className="text-teal-600 mr-2 text-sm sm:text-base" />
                    Inmate Information
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-teal-200 transition-colors">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Inmate Name</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-800">
                        {schedule.inmateId?.fullName || 'Not specified'}
                      </p>
                    </div>
                    
                    {/* Inmate ID */}
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-teal-200 transition-colors">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Inmate ID</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-800">
                        {schedule.inmateId?.prisonerId || schedule.inmateId?._id || 'Not specified'}
                      </p>
                    </div>
                    
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-teal-200 transition-colors">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Relationship</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-800 capitalize">
                        {schedule.relationship || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Request Timeline Section */}
                <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg sm:rounded-xl p-3 sm:p-6 border border-purple-100 shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center border-b pb-2">
                    <FaClock className="text-purple-600 mr-2 text-sm sm:text-base" />
                    Request Timeline
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Created At</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-800">
                        {formatDateTime(schedule.createdAt)}
                      </p>
                    </div>
                    
                    {schedule.approvedAt && (
                      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
                        <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Approved At</p>
                        <p className="text-sm sm:text-base font-semibold text-gray-800">
                          {formatDateTime(schedule.approvedAt)}
                        </p>
                      </div>
                    )}
                    
                    {schedule.completedAt && (
                      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
                        <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Completed At</p>
                        <p className="text-sm sm:text-base font-semibold text-gray-800">
                          {formatDateTime(schedule.completedAt)}
                        </p>
                      </div>
                    )}
                    
                    {schedule.cancelledAt && (
                      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
                        <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Cancelled At</p>
                        <p className="text-sm sm:text-base font-semibold text-gray-800">
                          {formatDateTime(schedule.cancelledAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Section (if applicable) */}
                {schedule.notes && (
                  <div className="bg-gradient-to-r from-gray-50 to-amber-50 rounded-lg sm:rounded-xl p-3 sm:p-6 border border-amber-100 shadow-sm">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center border-b pb-2">
                      <FaInfoCircle className="text-amber-600 mr-2 text-sm sm:text-base" />
                      Additional Notes
                    </h3>
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:border-amber-200 transition-colors">
                      <p className="text-sm sm:text-base text-gray-700 whitespace-pre-line">
                        {schedule.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer and Action Buttons - Made sticky */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-3 sm:p-4 flex flex-wrap gap-2 sm:gap-3 justify-end items-center">
            {canCancel && (
              <button
                onClick={handleCancelClick}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-red-600 text-white text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <FaTimesCircle className="text-xs sm:text-sm" />
                Cancel Visit
              </button>
            )}
            
            {isPending && onEdit && (
              <button
                onClick={handleUpdateClick}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-teal-600 text-white text-xs sm:text-sm font-medium hover:bg-teal-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <FaEdit className="text-xs sm:text-sm" />
                Update
              </button>
            )}
            
            {isPoliceOrAdmin && isPending && onApprove && (
              <button
                onClick={() => onApprove(schedule._id)}
                disabled={capacityReached}
                className={`inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  capacityReached 
                    ? "bg-gray-400 text-white cursor-not-allowed" 
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
                title={capacityReached ? "Maximum visitor capacity reached" : "Approve this visit"}
              >
                <FaCheck className="text-xs sm:text-sm" />
                Approve
              </button>
            )}
            
            {isPoliceOrAdmin && isPending && onReject && (
              <button
                onClick={() => onReject(schedule._id)}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-red-600 text-white text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <FaTimesCircle className="text-xs sm:text-sm" />
                Reject
              </button>
            )}
            
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-gray-200 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDetailModal; 