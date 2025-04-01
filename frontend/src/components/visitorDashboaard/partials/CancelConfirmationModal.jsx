import React from "react";
import { FaTimes, FaExclamationTriangle } from "react-icons/fa";
import { format } from "date-fns";

const CancelConfirmationModal = ({
  isOpen,
  onClose,
  schedule,
  onConfirm
}) => {
  if (!isOpen || !schedule) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-red-600">
              Cancel Visit
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center text-red-500 mb-4">
            <FaExclamationTriangle className="h-12 w-12" />
          </div>
          <p className="text-center text-gray-700 mb-4">
            Are you sure you want to cancel this visit scheduled for{" "}
            <span className="font-semibold">
              {format(new Date(schedule.visitDate), "PPP")}
            </span>{" "}
            at <span className="font-semibold">{schedule.visitTime}</span>?
          </p>
          <p className="text-center text-gray-500 mb-6 text-sm">
            This action cannot be undone.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              No, Keep Visit
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Yes, Cancel Visit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelConfirmationModal; 