import React, { useState, useEffect } from "react";
import { FaEye, FaCheck, FaTimes, FaClock, FaFilter, FaSearch, FaTable, FaThLarge } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../../utils/axiosInstance";
import "../../../styles/table.css";
import "../../../styles/responsive.css";
import { format } from 'date-fns';

const PoliceVisitorManagement = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayMode, setDisplayMode] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [capacity, setCapacity] = useState(null);

  useEffect(() => {
    fetchVisitors();
    fetchCapacity();
  }, []);

  const fetchCapacity = async () => {
    try {
      const response = await axiosInstance.get('/visitor/schedule/capacity');
      setCapacity(response.data.maxCapacity);
    } catch (err) {
      console.error('Error fetching capacity:', err);
      // Don't show error toast for capacity as it's not critical
    }
  };

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch schedules
      const schedulesResponse = await axiosInstance.get('/visitor/schedule/schedules?status=all');
      const schedules = schedulesResponse.data || [];

      // Fetch visitor details
      const visitorsResponse = await axiosInstance.get('/visitor/allVisitors');
      const visitorDetails = visitorsResponse.data || [];

      // Combine the data
      const combinedData = schedules.map(schedule => {
        const visitor = visitorDetails.find(v => v._id === schedule.visitorId);
        return {
          ...schedule,
          visitorDetails: visitor || {},
          formattedDate: format(new Date(schedule.visitDate), 'MMM dd, yyyy'),
          formattedTime: format(new Date(schedule.visitDate), 'hh:mm a'),
          isPastVisit: new Date(schedule.visitDate) < new Date()
        };
      });

      setVisitors(combinedData);
    } catch (err) {
      console.error('Error fetching visitors:', err);
      setError('Failed to fetch visitor data. Please try again later.');
      toast.error('Failed to fetch visitor data');
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (visitorId, newStatus) => {
    try {
      const response = await axiosInstance.put(`/visitor/schedule/${visitorId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        toast.success(`Visitor status updated to ${newStatus}`);
        fetchVisitors(); // Refresh the list
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  // Filter visitors based on search query and status
  const filteredVisitors = visitors.filter(visitor => {
    if (!visitor || !visitor.userId) return false;
    
    const visitorData = visitor.userId;
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = !searchQuery || 
      (visitorData.firstName?.toLowerCase().includes(searchLower) ||
       visitorData.lastName?.toLowerCase().includes(searchLower) ||
       visitorData.phone?.toLowerCase().includes(searchLower));

    const matchesStatus = statusFilter === 'all' || 
      visitor.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        <p>{error}</p>
        <button 
          onClick={fetchVisitors}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render visitor card
  const renderVisitorCard = (visitor) => {
    if (!visitor || !visitor.userId) return null;
    
    return (
      <div key={visitor._id} className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">
              {visitor.userId.firstName} {visitor.userId.lastName}
            </h3>
            <p className="text-gray-600">Phone: {visitor.userId.phone}</p>
            <p className="text-gray-600">Inmate: {visitor.inmateId?.fullName || 'N/A'}</p>
            <p className="text-gray-600">Date: {visitor.formattedDate}</p>
            <p className="text-gray-600">Time: {visitor.formattedTime}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleStatusUpdate(visitor._id, 'approved')}
              className="p-2 text-green-500 hover:bg-green-100 rounded"
              title="Approve"
            >
              <FaCheck />
            </button>
            <button
              onClick={() => handleStatusUpdate(visitor._id, 'rejected')}
              className="p-2 text-red-500 hover:bg-red-100 rounded"
              title="Reject"
            >
              <FaTimes />
            </button>
            <button
              onClick={() => {
                setSelectedVisitor(visitor);
                setShowDetailModal(true);
              }}
              className="p-2 text-blue-500 hover:bg-blue-100 rounded"
              title="View Details"
            >
              <FaEye />
            </button>
          </div>
        </div>
        <div className="mt-2">
          <span className={`px-2 py-1 rounded text-sm ${
            visitor.status === 'approved' ? 'bg-green-100 text-green-800' :
            visitor.status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {visitor.status || 'pending'}
          </span>
        </div>
      </div>
    );
  };

  // Render visitor table
  const renderVisitorTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Visitor
            </th>
            <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Inmate
            </th>
            <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Date & Time
            </th>
            <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredVisitors.map(visitor => (
            <tr key={visitor._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 border-b border-gray-200">
                {visitor.userId.firstName} {visitor.userId.lastName}
              </td>
              <td className="px-6 py-4 border-b border-gray-200">
                {visitor.userId.phone}
              </td>
              <td className="px-6 py-4 border-b border-gray-200">
                {visitor.inmateId?.fullName || 'N/A'}
              </td>
              <td className="px-6 py-4 border-b border-gray-200">
                {visitor.formattedDate} {visitor.formattedTime}
              </td>
              <td className="px-6 py-4 border-b border-gray-200">
                <span className={`px-2 py-1 rounded text-sm ${
                  visitor.status === 'approved' ? 'bg-green-100 text-green-800' :
                  visitor.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {visitor.status || 'pending'}
                </span>
              </td>
              <td className="px-6 py-4 border-b border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStatusUpdate(visitor._id, 'approved')}
                    className="p-2 text-green-500 hover:bg-green-100 rounded"
                    title="Approve"
                  >
                    <FaCheck />
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(visitor._id, 'rejected')}
                    className="p-2 text-red-500 hover:bg-red-100 rounded"
                    title="Reject"
                  >
                    <FaTimes />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedVisitor(visitor);
                      setShowDetailModal(true);
                    }}
                    className="p-2 text-blue-500 hover:bg-blue-100 rounded"
                    title="View Details"
                  >
                    <FaEye />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4">
      {/* Controls */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search visitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDisplayMode('table')}
            className={`p-2 rounded ${displayMode === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            title="Table View"
          >
            <FaTable />
          </button>
          <button
            onClick={() => setDisplayMode('card')}
            className={`p-2 rounded ${displayMode === 'card' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            title="Card View"
          >
            <FaThLarge />
          </button>
        </div>
      </div>

      {/* Content */}
      {filteredVisitors.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No visitors found</p>
        </div>
      ) : displayMode === 'table' ? (
        renderVisitorTable()
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisitors.map(visitor => renderVisitorCard(visitor))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedVisitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">
                {selectedVisitor.userId.firstName} {selectedVisitor.userId.lastName}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Personal Information</h3>
                <p>Phone: {selectedVisitor.userId.phone}</p>
              </div>
              <div>
                <h3 className="font-semibold">Visit Details</h3>
                <p>Inmate: {selectedVisitor.inmateId?.fullName || 'N/A'}</p>
                <p>Date: {selectedVisitor.formattedDate}</p>
                <p>Time: {selectedVisitor.formattedTime}</p>
              </div>
              <div>
                <h3 className="font-semibold">Status</h3>
                <span className={`px-2 py-1 rounded text-sm ${
                  selectedVisitor.status === 'approved' ? 'bg-green-100 text-green-800' :
                  selectedVisitor.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedVisitor.status || 'pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoliceVisitorManagement; 