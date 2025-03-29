import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";
import DataTable from "react-data-table-component";
import { FaEye, FaPrint, FaCheck, FaTimes, FaClock, FaUser } from "react-icons/fa";
import { useSelector } from "react-redux";

const TransferRequests = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [isUpdating, setIsUpdating] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/transfer/getall-transfers");
      console.log("Fetched transfers:", response.data);
      const processedTransfers = response.data.data.map(transfer => ({
        ...transfer,
        transferDate: transfer.transferDate ? new Date(transfer.transferDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        createdAt: transfer.createdAt ? new Date(transfer.createdAt).toISOString().split('T')[0] : null,
        status: transfer.status?.toLowerCase() || 'pending'
      }));
      console.log("Processed transfers:", processedTransfers);
      setTransfers(processedTransfers);
    } catch (error) {
      console.error("Error fetching transfers:", error);
      toast.error("Failed to fetch transfer requests");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (transferId, newStatus) => {
    try {
      if (newStatus === "rejected" && !rejectionReason.trim()) {
        toast.error("Please provide a reason for rejection");
        return;
      }

      setIsUpdating(true);
      const updateData = {
        status: newStatus,
        ...(newStatus === "rejected" && { rejectionReason }),
        updatedAt: new Date().toISOString()
      };

      await axiosInstance.put(`/transfer/update-transfer/${transferId}`, updateData);
      toast.success(`Transfer request ${newStatus} successfully`);
      fetchTransfers();
      setShowDialog(false);
      setRejectionReason("");
    } catch (error) {
      console.error("Error updating transfer status:", error);
      toast.error("Failed to update transfer status");
    } finally {
      setIsUpdating(false);
    }
  };

  const columns = [
    {
      name: "Inmate Name",
      selector: (row) => `${row.inmateData?.firstName || ""} ${row.inmateData?.middleName || ""} ${row.inmateData?.lastName || ""}`,
      sortable: true,
      grow: 2,
    },
    {
      name: "From Prison",
      selector: (row) => row.fromPrison,
      sortable: true,
      grow: 1,
    },
    {
      name: "To Prison",
      selector: (row) => row.toPrison,
      sortable: true,
      grow: 1,
    },
    {
      name: "Transfer Date",
      selector: (row) => row.transferDate,
      sortable: true,
      grow: 1,
      cell: (row) => {
        const date = new Date(row.transferDate);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      },
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      grow: 1,
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            row.status === "approved"
              ? "bg-green-100 text-green-800"
              : row.status === "rejected"
              ? "bg-red-100 text-red-800"
              : row.status === "in_review"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedTransfer(row);
              setShowDialog(true);
              setRejectionReason("");
            }}
            className="p-2 text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            <FaEye />
          </button>
          <button
            onClick={() => handlePrint(row)}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="Print"
          >
            <FaPrint />
          </button>
        </div>
      ),
      grow: 0.5,
    },
  ];

  const filteredTransfers = transfers.filter(
    (transfer) =>
      transfer.inmateData?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.inmateData?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.fromPrison?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.toPrison?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrint = (transfer) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Transfer Request Details</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .section { margin-bottom: 15px; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Transfer Request Details</h1>
          </div>
          <div class="section">
            <div class="label">Inmate Information:</div>
            <div>Name: ${transfer.inmateData?.firstName} ${transfer.inmateData?.middleName} ${transfer.inmateData?.lastName}</div>
            <div>ID: ${transfer.inmateData?.inmateId}</div>
          </div>
          <div class="section">
            <div class="label">Transfer Details:</div>
            <div>From: ${transfer.fromPrison}</div>
            <div>To: ${transfer.toPrison}</div>
            <div>Date: ${transfer.transferDate ? new Date(transfer.transferDate).toLocaleDateString() : 'Not set'}</div>
            <div>Status: ${transfer.status}</div>
            ${transfer.rejectionReason ? `<div>Rejection Reason: ${transfer.rejectionReason}</div>` : ''}
          </div>
          <div class="section">
            <div class="label">Reason:</div>
            <div>${transfer.reason}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const renderStatusButtons = (transfer) => {
    console.log("Rendering buttons for transfer:", transfer);
    console.log("Current status:", transfer.status);

    // For pending transfers
    if (transfer.status === "pending" || transfer.status === "Pending") {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Rejection Reason (if rejecting)</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              rows="3"
              placeholder="Enter reason for rejection..."
              disabled={isUpdating}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={() => handleStatusUpdate(transfer._id, "in_review")}
              disabled={isUpdating}
              className={`px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center ${
                isUpdating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FaClock className="mr-2" /> {isUpdating ? 'Updating...' : 'Start Review'}
            </button>
            <button
              onClick={() => handleStatusUpdate(transfer._id, "approved")}
              disabled={isUpdating}
              className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center ${
                isUpdating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FaCheck className="mr-2" /> {isUpdating ? 'Updating...' : 'Approve'}
            </button>
            <button
              onClick={() => handleStatusUpdate(transfer._id, "rejected")}
              disabled={isUpdating}
              className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center ${
                isUpdating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FaTimes className="mr-2" /> {isUpdating ? 'Updating...' : 'Reject'}
            </button>
          </div>
        </div>
      );
    }

    // For in_review transfers
    if (transfer.status === "in_review" || transfer.status === "In Review") {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Rejection Reason (if rejecting)</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              rows="3"
              placeholder="Enter reason for rejection..."
              disabled={isUpdating}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={() => handleStatusUpdate(transfer._id, "approved")}
              disabled={isUpdating}
              className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center ${
                isUpdating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FaCheck className="mr-2" /> {isUpdating ? 'Updating...' : 'Approve'}
            </button>
            <button
              onClick={() => handleStatusUpdate(transfer._id, "rejected")}
              disabled={isUpdating}
              className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center ${
                isUpdating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FaTimes className="mr-2" /> {isUpdating ? 'Updating...' : 'Reject'}
            </button>
          </div>
        </div>
      );
    }

    console.log("No buttons rendered for status:", transfer.status);
    return null;
  };

  // Add function to get image URL
  const getImageUrl = (inmate) => {
    if (!inmate?.documents?.length) return null;
    const photoUrl = inmate.documents[0];
    // If it's already a full URL (Cloudinary), return it as is
    if (photoUrl.startsWith('http')) {
      return photoUrl;
    }
    // If it's a local file, construct the URL
    return `${import.meta.env.VITE_API_URL}/uploads/${photoUrl}`;
  };

  return (
    <div className={`p-4 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-4">Transfer Requests</h2>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <input
            type="text"
            placeholder="Search transfers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border rounded-lg w-full md:w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={filteredTransfers}
          progressPending={loading}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50]}
          responsive
          noTableHead={false}
          persistTableHead
          fixedHeader
          fixedHeaderScrollHeight="calc(100vh - 200px)"
        />
      </div>

      {/* Transfer Details Dialog */}
      {showDialog && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Transfer Request Details</h3>
              <button
                onClick={() => setShowDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inmate Photo Section */}
              <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                <h4 className="text-lg font-semibold mb-4 text-gray-800">Inmate Photo</h4>
                <div className="flex justify-center">
                  {selectedTransfer.inmateData?.documents?.length > 0 ? (
                    <div className="relative w-48 h-48">
                      <img
                        src={`${import.meta.env.VITE_API_URL}/uploads/${selectedTransfer.inmateData.documents[0]}`}
                        alt={`${selectedTransfer.inmateData.firstName} ${selectedTransfer.inmateData.lastName}`}
                        className="w-full h-full rounded-lg object-cover border-4 border-green-600 shadow-lg"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/200?text=No+Photo";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-48 rounded-lg bg-gray-200 border-4 border-green-600 shadow-lg flex items-center justify-center">
                      <FaUser className="w-24 h-24 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Inmate Information Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-4 text-gray-800">Inmate Information</h4>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-600">Full Name:</span>
                    <p className="text-gray-800">
                      {selectedTransfer.inmateData?.firstName} {selectedTransfer.inmateData?.middleName} {selectedTransfer.inmateData?.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Inmate ID:</span>
                    <p className="text-gray-800">{selectedTransfer.inmateData?.inmateId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Gender:</span>
                    <p className="text-gray-800">{selectedTransfer.inmateData?.gender}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Date of Birth:</span>
                    <p className="text-gray-800">
                      {new Date(selectedTransfer.inmateData?.dateOfBirth).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Age:</span>
                    <p className="text-gray-800">{selectedTransfer.inmateData?.age}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Marital Status:</span>
                    <p className="text-gray-800">{selectedTransfer.inmateData?.maritalStatus}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Religion:</span>
                    <p className="text-gray-800">{selectedTransfer.inmateData?.religion}</p>
                  </div>
                </div>
              </div>

              {/* Transfer Details Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-4 text-gray-800">Transfer Details</h4>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-600">From Prison:</span>
                    <p className="text-gray-800">{selectedTransfer.fromPrison}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">To Prison:</span>
                    <p className="text-gray-800">{selectedTransfer.toPrison}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Transfer Date:</span>
                    <p className="text-gray-800">
                      {new Date(selectedTransfer.transferDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedTransfer.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : selectedTransfer.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : selectedTransfer.status === "in_review"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {selectedTransfer.status.charAt(0).toUpperCase() + selectedTransfer.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Request Date:</span>
                    <p className="text-gray-800">
                      {new Date(selectedTransfer.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Crime and Sentence Information */}
              <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                <h4 className="text-lg font-semibold mb-4 text-gray-800">Crime and Sentence Information</h4>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-600">Crime Type:</span>
                    <p className="text-gray-800">{selectedTransfer.inmateData?.crimeType}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Sentence Duration:</span>
                    <p className="text-gray-800">{selectedTransfer.inmateData?.sentenceDuration}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Sentence Start Date:</span>
                    <p className="text-gray-800">
                      {new Date(selectedTransfer.inmateData?.sentenceStartDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Expected Release Date:</span>
                    <p className="text-gray-800">
                      {new Date(selectedTransfer.inmateData?.expectedReleaseDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transfer Reason */}
              <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                <h4 className="text-lg font-semibold mb-4 text-gray-800">Transfer Reason</h4>
                <p className="text-gray-800">{selectedTransfer.reason}</p>
              </div>

              {/* Rejection Reason (if applicable) */}
              {selectedTransfer.rejectionReason && (
                <div className="bg-red-50 p-4 rounded-lg md:col-span-2">
                  <h4 className="text-lg font-semibold mb-4 text-red-800">Rejection Reason</h4>
                  <p className="text-red-800">{selectedTransfer.rejectionReason}</p>
                </div>
              )}

              {/* Status Update Section */}
              {renderStatusButtons(selectedTransfer)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferRequests; 