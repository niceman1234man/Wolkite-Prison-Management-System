import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { columns, TransferButtons } from "../../utils/TransferHelper";
import axiosInstance from "../../utils/axiosInstance";
import { useSelector } from "react-redux";
import { FaSearch } from "react-icons/fa";

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
    placeholder="Search by first or middle name"
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
              responsive // Enable responsive behavior
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferList;