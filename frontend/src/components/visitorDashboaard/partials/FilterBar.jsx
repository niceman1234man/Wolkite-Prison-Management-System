import React from "react";
import { FaSync } from "react-icons/fa";

const FilterBar = ({
  filter,
  onFilterChange,
  onAddNew,
  onRefresh,
  loading,
  visitorLoading
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <h2 className="text-xl md:text-2xl font-bold">Visit Schedules</h2>
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="w-full md:w-auto p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="all">All Visits</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={onAddNew}
            className="flex-1 md:flex-none bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            Add New Visit
          </button>
          <button
            onClick={onRefresh}
            className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
          >
            <FaSync className={`mr-2 ${loading || visitorLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
      {(loading || visitorLoading) && (
        <div className="mt-2 text-sm text-gray-500">
          {loading && visitorLoading ? 'Loading schedules and visitor data...' : 
           loading ? 'Loading schedules...' : 'Loading visitor data...'}
        </div>
      )}
    </div>
  );
};

export default FilterBar; 