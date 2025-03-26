import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { columns, TransferButtons } from "../../utils/WoredaHelper";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";

const Woreda = () => {
  const [inmates, setInmates] = useState([]);
  const [filteredInmates, setFilteredInmates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transferRequests, setTransferRequests] = useState([]);

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/transfer/getall-transfers");
        if (response.data && response.data.transfers) {
          let un = 1;
          const data = response.data.transfers.map((transfer, index) => ({
            U_no: un++, // Using index + 1 instead of an external variable
            _id: transfer._id,
            firstName: transfer.firstName,
            middleName: transfer.middleName,
            fromPrison: transfer.fromPrison,
            toPrison: transfer.toPrison,
            status: transfer.status,
            action: <TransferButtons _id={transfer._id} />,
          }));

          setInmates(data);
          setFilteredInmates(data);
        } else {
          console.error("Unexpected data format:", response.data.transfers);
          setInmates([]);
        }
      } catch (error) {
        console.error("Error fetching inmates:", error);
        alert(error.response?.data?.error || "Failed to load users.");
        setInmates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, []);

  const fetchTransferRequests = async () => {
    try {
      const response = await axiosInstance.get(
        "/api/transfer/pending-requests"
      );
      if (response.data?.success) {
        setTransferRequests(response.data.transfers);
      }
    } catch (error) {
      console.error("Error fetching transfer requests:", error);
      toast.error("Failed to fetch transfer requests");
    }
  };

  useEffect(() => {
    fetchTransferRequests();
  }, []);

  const handleTransferReview = async (
    transferId,
    action,
    rejectionReason = null
  ) => {
    try {
      const response = await axiosInstance.post(
        `/api/transfer/review/${transferId}`,
        {
          action,
          rejectionReason,
        }
      );

      if (response.data?.success) {
        toast.success(
          `Transfer request ${action === "accept" ? "accepted" : "rejected"}`
        );
        fetchTransferRequests();
      }
    } catch (error) {
      console.error("Error reviewing transfer:", error);
      toast.error("Failed to review transfer request");
    }
  };

  const handleFilter = (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = inmates.filter(
      (transfer) =>
        transfer.firstName.toLowerCase().includes(query) ||
        transfer.middleName.toLowerCase().includes(query)
    );
    setFilteredInmates(filtered);
  };

  return (
    <div className="p-6 mt-12 ml-20">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold">Manage Inmate From Woreda</h3>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <input
          type="text"
          onChange={handleFilter}
          placeholder="Search by first or middle name"
          className="px-4 py-2 border rounded-md"
        />
        <div className="space-x-3">
          <button
            className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            onClick={() => setFilteredLeaves(leaves)} // Reset to all
          >
            All
          </button>
          <button
            className="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            onClick={() => filterByButton("Pending")}
          >
            Pending
          </button>
          <button
            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
            onClick={() => filterByButton("Active")}
          >
            Active
          </button>
          <button
            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
            onClick={() => filterByButton("Revoked")}
          >
            Revoked
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded shadow-md">
        <DataTable
          columns={columns}
          data={filteredInmates} // Fixed this line
          pagination
          progressPending={loading}
          progressComponent={<p className="text-center">Loading...</p>}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Pending Transfer Requests
        </h2>
        <div className="space-y-4">
          {transferRequests.map((transfer) => (
            <div key={transfer._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">
                    {transfer.inmateData.firstName}{" "}
                    {transfer.inmateData.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    From: {transfer.fromPrison}
                    <br />
                    To: {transfer.toPrison}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Reason: {transfer.reason}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTransferReview(transfer._id, "accept")}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt("Please enter rejection reason:");
                      if (reason) {
                        handleTransferReview(transfer._id, "reject", reason);
                      }
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
          {transferRequests.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No pending transfer requests
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Woreda;
