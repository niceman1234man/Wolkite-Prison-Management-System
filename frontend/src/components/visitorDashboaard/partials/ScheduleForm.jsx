import React from "react";
import ScheduleVisit from "../ScheduleVisit";

const ScheduleForm = ({
  isOpen,
  onClose,
  schedule,
  onSuccess
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">
              {schedule ? "Update Visit" : "Schedule New Visit"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-4">
          <ScheduleVisit
            schedule={schedule}
            onSuccess={(data) => {
              console.log("Schedule operation successful", data);
              
              // Close the form immediately
              onClose();
              
              // Call the onSuccess callback
              if (onSuccess) {
                onSuccess(data);
              }
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default ScheduleForm; 