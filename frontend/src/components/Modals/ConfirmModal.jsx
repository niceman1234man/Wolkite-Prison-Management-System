import React from "react";

export default function ConfirmModal({ open, message, onConfirm, onCancel }) {
  console.log("ConfirmModal rendered with open:", open, "message:", message);
  
  // Don't render anything if not open
  if (!open) {
    return null;
  }
  
  const handleConfirm = () => {
    console.log("Confirm button clicked in ConfirmModal");
    if (typeof onConfirm === 'function') {
      onConfirm();
    }
  };

  const handleCancel = () => {
    console.log("Cancel button clicked in ConfirmModal");
    if (typeof onCancel === 'function') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[1000]">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmation</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex space-x-4">
          <button
            className="w-1/2 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded font-medium transition duration-300"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="w-1/2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-medium transition duration-300"
            onClick={handleConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
