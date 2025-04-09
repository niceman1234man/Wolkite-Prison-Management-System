import React from 'react';
import { FaSearch, FaFilter, FaCalendar } from 'react-icons/fa';

const VisitorListFilters = ({ filters, onFilterChange }) => {
  const handleStatusChange = (e) => {
    onFilterChange({ status: e.target.value });
  };

  const handleSearchChange = (e) => {
    onFilterChange({ search: e.target.value });
  };

  const handleDateChange = (type, value) => {
    onFilterChange({
      dateRange: {
        ...filters.dateRange,
        [type]: value
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search visitors..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filters.search}
          onChange={handleSearchChange}
        />
      </div>

      {/* Status Filter */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaFilter className="h-5 w-5 text-gray-400" />
        </div>
        <select
          value={filters.status}
          onChange={handleStatusChange}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="postponed">Postponed</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Date Range Filters */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaCalendar className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="date"
          placeholder="Start Date"
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filters.dateRange.start || ''}
          onChange={(e) => handleDateChange('start', e.target.value)}
        />
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaCalendar className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="date"
          placeholder="End Date"
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filters.dateRange.end || ''}
          onChange={(e) => handleDateChange('end', e.target.value)}
        />
      </div>
    </div>
  );
};

export default VisitorListFilters; 