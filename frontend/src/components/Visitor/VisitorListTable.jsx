import React from 'react';
import {
  FaEye,
  FaCalendarAlt,
  FaCheck,
  FaTimes,
  FaClock
} from 'react-icons/fa';

const VisitorListTable = ({ visitors, onViewDetails, onPostpone, onApprove, onReject }) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <FaClock className="mr-1" />
      },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <FaCheck className="mr-1" />
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <FaTimes className="mr-1" />
      },
      postponed: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        icon: <FaCalendarAlt className="mr-1" />
      },
      completed: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <FaCheck className="mr-1" />
      }
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;

    return (
      <span className={\`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium \${config.bg} \${config.text}\`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              No
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Visitor Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Purpose
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Visit Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {visitors.map((visitor) => (
            <tr key={visitor._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {visitor.serialNo}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{visitor.fullName}</div>
                <div className="text-sm text-gray-500">{visitor.phone}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{visitor.purpose}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{visitor.formattedDate}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(visitor.status || 'pending')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onViewDetails(visitor)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <FaEye className="w-5 h-5" />
                  </button>
                  
                  {visitor.status === 'pending' && (
                    <>
                      <button
                        onClick={() => onApprove(visitor._id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <FaCheck className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onReject(visitor._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTimes className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onPostpone(visitor)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        <FaCalendarAlt className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {visitors.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No visitors found</div>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters to see more results</p>
        </div>
      )}
    </div>
  );
};

export default VisitorListTable; 