import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import { FaDownload, FaPrint, FaTimes } from "react-icons/fa";

function VisitHistory() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, approved, completed, cancelled
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await axiosInstance.get("/visitor/schedule/schedules");
      if (response.data.success) {
        setSchedules(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Failed to fetch visit history");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelVisit = async (scheduleId) => {
    if (!window.confirm("Are you sure you want to cancel this visit?")) {
      return;
    }

    try {
      const response = await axiosInstance.put(`/visitor/schedule/schedule/${scheduleId}/cancel`);
      if (response.data.success) {
        toast.success("Visit cancelled successfully");
        fetchSchedules(); // Refresh the list
      }
    } catch (error) {
      console.error("Error cancelling visit:", error);
      toast.error(error.response?.data?.message || "Failed to cancel visit");
    }
  };

  const handleDownloadHistory = () => {
    // TODO: Implement download functionality
    toast.info("Download functionality coming soon");
  };

  const handlePrintHistory = () => {
    window.print();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (filter === "all") return true;
    return schedule.status === filter;
  });

  const handleViewDetails = (schedule) => {
    setSelectedSchedule(schedule);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedSchedule(null);
  };

  return (
    <div className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'} p-4 md:p-6`}>
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-md mt-10 p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <h2 className="text-xl md:text-2xl font-bold">Visit History</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full md:w-auto p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Visits</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleDownloadHistory}
              className="flex-1 md:flex-none bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              <FaDownload className="text-sm" />
              Download
            </button>
            <button
              onClick={handlePrintHistory}
              className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              <FaPrint className="text-sm" />
              Print
            </button>
            <button
              onClick={fetchSchedules}
              className="flex-1 md:flex-none bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="text-center py-6 bg-white rounded-lg shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-500">No visits found with the selected filter</h3>
          <p className="text-gray-400 mt-2">Try selecting a different filter option</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inmate
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Relationship
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSchedules.map((schedule, index) => (
                  <tr key={schedule._id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {schedule.inmateId?.fullName || 'No inmate specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {format(new Date(schedule.visitDate), "MMMM d, yyyy")}
                      </div>
                      <div className="text-sm text-gray-500">
                        {schedule.visitTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-[200px] truncate" title={schedule.purpose}>
                        {schedule.purpose}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 capitalize">
                        {schedule.relationship}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {schedule.visitDuration} minutes
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(schedule.status)}`}>
                        {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => handleViewDetails(schedule)}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white py-1 px-3 rounded-md transition-colors duration-200 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                        {schedule.status === "pending" && (
                          <button
                            onClick={() => handleCancelVisit(schedule._id)}
                            className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md transition-colors duration-200 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  Visit Details
                </h3>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Inmate</h4>
                  <p className="text-base font-medium">{selectedSchedule.inmateId?.fullName || 'No inmate specified'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedSchedule.status)}`}>
                    {selectedSchedule.status.charAt(0).toUpperCase() + selectedSchedule.status.slice(1)}
                </span>
              </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Visit Date</h4>
                  <p className="text-base">{format(new Date(selectedSchedule.visitDate), "MMMM d, yyyy")}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Visit Time</h4>
                  <p className="text-base">{selectedSchedule.visitTime}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Duration</h4>
                  <p className="text-base">{selectedSchedule.visitDuration} minutes</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Relationship</h4>
                  <p className="text-base capitalize">{selectedSchedule.relationship}</p>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Purpose</h4>
                  <p className="text-base">{selectedSchedule.purpose}</p>
                </div>
                {selectedSchedule.notes && (
                  <div className="col-span-1 md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                    <p className="text-base">{selectedSchedule.notes}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">ID Type</h4>
                  <p className="text-base capitalize">{selectedSchedule.idType}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">ID Number</h4>
                  <p className="text-base">{selectedSchedule.idNumber}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">ID Expiry Date</h4>
                  <p className="text-base">{format(new Date(selectedSchedule.idExpiryDate), "MMMM d, yyyy")}</p>
              </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Scheduled On</h4>
                  <p className="text-base">{format(new Date(selectedSchedule.createdAt), "MMMM d, yyyy")}</p>
                </div>
                {selectedSchedule.visitorPhoto && (
                  <div className="col-span-1 md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Visitor Photo</h4>
                    <img 
                      src={`http://localhost:5001${selectedSchedule.visitorPhoto}`} 
                      alt="Visitor" 
                      className="mt-2 max-h-48 rounded-md" 
                    />
                </div>
              )}
              </div>

              {selectedSchedule.status === "pending" && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      closeDetailModal();
                      handleCancelVisit(selectedSchedule._id);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors duration-200 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel Visit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisitHistory; 