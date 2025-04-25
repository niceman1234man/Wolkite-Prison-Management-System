import React from 'react';
import { toast } from 'react-toastify';
import axiosInstance from "../../utils/axiosInstance";
import TransferButton from './TransferButton';

/**
 * Component to render different buttons based on transfer status
 */
const TransferButtons = ({ 
  row, 
  fetchPrisoners, 
  setSelectedInmate, 
  setSelectedPrisonerData, 
  setTransferModalOpen 
}) => {
  // No Transfer Request status
  if (row.transferStatus === "No Transfer Request") {
    return (
      <TransferButton
        inmate={row}
        onTransferComplete={() => {
          fetchPrisoners();
        }}
        currentPrison={row.assignedPrison}
      />
    );
  }
  
  // Pending status
  if (row.transferStatus === "Pending") {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => {
            setSelectedInmate(row._id);
            setSelectedPrisonerData(row);
            setTransferModalOpen(true);
          }}
          className="flex items-center gap-1 px-3 py-1.5 text-yellow-600 hover:text-yellow-800 bg-yellow-50 hover:bg-yellow-100 rounded-full transition-all duration-150 hover:shadow-md"
          title="Edit Transfer Request"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          <span>Edit</span>
        </button>
        <button
          onClick={async () => {
            if (window.confirm("Are you sure you want to cancel this transfer request?")) {
              try {
                await axiosInstance.delete(`/transfer/cancel-transfer/${row._id}`);
                toast.success("Transfer request cancelled successfully");
                fetchPrisoners();
              } catch (error) {
                console.error("Error cancelling transfer:", error);
                toast.error("Failed to cancel transfer request");
              }
            }
          }}
          className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-full transition-all duration-150 hover:shadow-md"
          title="Cancel Transfer Request"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span>Cancel</span>
        </button>
      </div>
    );
  }
  
  // Under Review status
  if (row.transferStatus === "Under Review") {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => {
            // View transfer details or progress
            toast.info(`Transfer for ${row.firstName} ${row.lastName} is under review by security staff.`);
          }}
          className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-full transition-all duration-150 hover:shadow-md"
          title="View Transfer Status"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Status</span>
        </button>
        <button
          onClick={async () => {
            if (window.confirm("Are you sure you want to cancel this transfer request that is under review?")) {
              try {
                await axiosInstance.delete(`/transfer/cancel-transfer/${row._id}`);
                toast.success("Transfer request cancelled successfully");
                fetchPrisoners();
              } catch (error) {
                console.error("Error cancelling transfer:", error);
                toast.error("Failed to cancel transfer request");
              }
            }
          }}
          className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-full transition-all duration-150 hover:shadow-md"
          title="Cancel Transfer Request"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span>Cancel</span>
        </button>
      </div>
    );
  }
  
  // Rejected status
  if (row.transferStatus === "Rejected") {
    return (
      <TransferButton
        inmate={row}
        onTransferComplete={() => {
          fetchPrisoners();
        }}
        currentPrison={row.assignedPrison}
      />
    );
  }
  
  // Approved status
  if (row.transferStatus === "Approved") {
    return (
      <button
        className="flex items-center gap-1 px-3 py-1.5 text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded-full transition-all duration-150 hover:shadow-md"
        title="Transfer Approved"
        disabled
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        <span>Approved</span>
      </button>
    );
  }
  
  // Default - no buttons for unknown status
  return null;
};

export default TransferButtons; 