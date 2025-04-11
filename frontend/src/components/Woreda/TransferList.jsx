import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { columns, TransferButtons } from "../../utils/TransferHelper";
import axiosInstance from "../../utils/axiosInstance";
import { useSelector } from "react-redux";
import { FaSearch, FaExclamationTriangle, FaPrint } from "react-icons/fa";

const TransferList = () => {
  const [inmates, setInmates] = useState([]);
  const [filteredInmates, setFilteredInmates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get sidebar state from Redux
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/transfer/getall-transfers");
        if (response.data && response.data.transfers) {
          let un = 1;
          const data = response.data.transfers.map((transfer, index) => {
            // Calculate time remaining
            const transferDate = new Date(transfer.transferDate);
            const now = new Date();
            const timeRemaining = transferDate - now;
            const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));

            return {
              U_no: un++,
              _id: transfer._id,
              firstName: transfer.firstName,
              middleName: transfer.middleName,
              lastName: transfer.lastName,
              fromPrison: transfer.fromPrison,
              toPrison: transfer.toPrison,
              status: transfer.status,
              transferDate: transfer.transferDate,
              timeRemaining: timeRemaining,
              hoursRemaining: hoursRemaining,
              action: <TransferButtons _id={transfer._id} />,
            };
          });

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

  const handleFilter = (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = inmates.filter(
      (transfer) =>
        transfer.firstName.toLowerCase().includes(query) ||
        transfer.middleName.toLowerCase().includes(query) ||
        transfer.lastName.toLowerCase().includes(query)
    );
    setFilteredInmates(filtered);
  };

  // Format time remaining
  const formatTimeRemaining = (timeRemaining) => {
    if (timeRemaining < 0) return "Overdue";
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Helper function to determine time status color
  const getTimeStatus = (timeRemaining) => {
    if (timeRemaining < 0) {
      return { status: "overdue", color: "text-red-600 font-bold" };
    }
    
    const hoursRemaining = timeRemaining / (1000 * 60 * 60);
    
    if (hoursRemaining <= 4) {
      return { status: "critical", color: "text-red-600 font-bold" };
    } else if (hoursRemaining <= 12) {
      return { status: "urgent", color: "text-orange-500 font-semibold" };
    } else {
      return { status: "normal", color: "text-gray-600" };
    }
  };

  // Handle view details
  const handleViewDetails = (row) => {
    // Implement view details functionality
    console.log("View details for", row);
  };

  // Handle print
  const handlePrint = (row) => {
    // Implement print functionality
    console.log("Print for", row);
  };

  // Define columns with status styling
  const columns = [
    {
      name: "No",
      selector: (row) => row.U_no,
      sortable: true,
      width: "70px",
    },
    {
      name: "Name",
      selector: (row) => `${row.firstName} ${row.middleName} ${row.lastName}`,
      sortable: true,
      width: "200px",
    },
    {
      name: "From Prison",
      selector: (row) => row.fromPrison,
      sortable: true,
      width: "180px",
    },
    {
      name: "To Prison",
      selector: (row) => row.toPrison,
      sortable: true,
      width: "180px",
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            row.status === "Pending"
              ? "bg-yellow-100 text-yellow-800"
              : row.status === "Under Review"
              ? "bg-blue-100 text-blue-800"
              : row.status === "Approved"
              ? "bg-green-100 text-green-800"
              : row.status === "Rejected"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.status || "Not Set"}
        </span>
      ),
      sortable: true,
      width: "150px",
    },
    {
      name: "Time Remaining",
      selector: (row) => row.timeRemaining,
      cell: (row) => {
        const timeStatus = getTimeStatus(row.timeRemaining);
        return (
          <div className="flex items-center gap-1">
            <span className={timeStatus.color}>
              {formatTimeRemaining(row.timeRemaining)}
            </span>
            {timeStatus.status === "critical" && (
              <FaExclamationTriangle className="text-red-500 animate-pulse" />
            )}
            {timeStatus.status === "urgent" && (
              <FaExclamationTriangle className="text-orange-500" />
            )}
          </div>
        );
      },
      sortable: true,
      width: "180px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewDetails(row)}
            className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="View Details"
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
            <span>View</span>
          </button>
          <button
            onClick={() => handlePrint(row)}
            className="flex items-center gap-1 px-2 py-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
            title="Print Transfer"
          >
            <FaPrint className="h-4 w-4" />
            <span>Print</span>
          </button>
        </div>
      ),
      width: "150px",
      right: true,
    },
  ];

  return (
    <div className="flex">
      {/* Sidebar Spacing Fix */}
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Responsive Fixed Header */}
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex justify-between items-center transition-all duration-300 ml-2 ${
            isCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          <h3 className="text-2xl font-bold text-gray-800 text-center">Manage Transfers</h3>
          {/* Search and Add New Transfer Section */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="relative w-full md:w-64">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                onChange={handleFilter}
                placeholder="Search by first, middle, or last name"
                className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <Link
              to="/woreda-dashboard/add"
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
            >
              Add New Transfer
            </Link>
          </div>
        </div>

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-40">
          {/* DataTable */}
          <div className="mt-6 bg-white p-4 rounded shadow-md overflow-x-auto">
            <DataTable
              columns={columns}
              data={filteredInmates}
              pagination
              progressPending={loading}
              progressComponent={<p className="text-center">Loading...</p>}
              highlightOnHover
              striped
              responsive
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferList;