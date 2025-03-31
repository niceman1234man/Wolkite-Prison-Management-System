import React from "react";
import { FaEye, FaTrash } from "react-icons/fa";
import { format } from "date-fns";

const ScheduleList = ({
  schedules,
  loading,
  getStatusColor,
  onView,
  onDelete
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="text-center py-6 bg-white rounded-lg shadow-md">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 mx-auto text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-500">
          No visits found for the selected filter
        </h3>
        <p className="text-gray-400 mt-2">
          Try selecting a different filter or schedule a new visit
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Mobile View */}
      <div className="md:hidden">
        {schedules.map((schedule, index) => (
          <div key={schedule._id} className="border-b border-gray-200 p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm font-medium text-gray-900">
                #{index + 1}
              </div>
              <span
                className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                  schedule.status
                )}`}
              >
                {schedule.status.charAt(0).toUpperCase() +
                  schedule.status.slice(1)}
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-xs font-medium text-gray-500">Name</div>
                <div className="text-sm text-gray-900">
                  {`${schedule.firstName || ""} ${schedule.middleName || ""} ${
                    schedule.lastName || ""
                  }`}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500">Phone</div>
                <div className="text-sm text-gray-900">
                  {schedule.phone || "Not provided"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500">
                  Visit Date
                </div>
                <div className="text-sm text-gray-900">
                  {format(new Date(schedule.visitDate), "PPP")}
                </div>
                <div className="text-xs text-gray-500">
                  {schedule.visitTime}
                </div>
              </div>
            </div>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => onView(schedule)}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center"
              >
                <FaEye className="h-4 w-4 mr-1" />
                View
              </button>
              <button
                onClick={() => {
                  if (
                    window.confirm("Are you sure you want to delete this visit?")
                  ) {
                    onDelete(schedule._id);
                  }
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center"
              >
                <FaTrash className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-blue-800">
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider"
              >
                No
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider"
              >
                Phone
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider"
              >
                Visit Date
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedules.map((schedule, index) => (
              <tr
                key={schedule._id}
                className={`transition-colors duration-200 hover:bg-blue-200 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {index + 1}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {`${schedule.firstName || ""} ${schedule.middleName || ""} ${
                      schedule.lastName || ""
                    }`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {schedule.phone || "Not provided"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {format(new Date(schedule.visitDate), "PPP")}
                  </div>
                  <div className="text-sm text-gray-500">
                    {schedule.visitTime}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      schedule.status
                    )}`}
                  >
                    {schedule.status.charAt(0).toUpperCase() +
                      schedule.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onView(schedule)}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white py-1 px-3 rounded-md transition-all duration-200 flex items-center shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                    >
                      <FaEye className="h-4 w-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this visit?"
                          )
                        ) {
                          onDelete(schedule._id);
                        }
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md transition-all duration-200 flex items-center shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                    >
                      <FaTrash className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleList; 