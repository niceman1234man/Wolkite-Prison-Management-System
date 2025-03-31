import React from "react";

const StatusFilter = ({ statusFilter, filter, onStatusChange }) => {
  const statuses = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "Postponed", value: "postponed" },
    { label: "Cancelled", value: "cancelled" },
    // <select name="status" id="">
    //   <option value="all">All</option>
    //   <option value="alpendingl">Pending</option>
    //   <option value="approved">All</option>
    //   <option value="rejected">All</option>
    //   <option value="postponed">All</option>
    //   <option value="postponed">All</option>
    //   <option value="cancelled">All</option>
    // </select>
  ];

  // Use either statusFilter or filter, whichever is provided
  const currentFilter = statusFilter || filter || "all";

  return (
    <div className="bg-white rounded-md shadow-sm p-3 mb-4">
      <h3 className="font-medium text-gray-700 mb-2">Filter by Status</h3>
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <button
            key={status.value}
            onClick={() => onStatusChange(status.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              currentFilter === status.value
                ? "bg-blue-100 text-blue-800 border-2 border-blue-400"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StatusFilter; 