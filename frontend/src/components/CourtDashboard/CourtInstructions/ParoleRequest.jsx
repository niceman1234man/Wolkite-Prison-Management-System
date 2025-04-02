import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { columns, ParoleRequestButtons } from "../../../utils/paroleRequest";
import axiosInstance from "../../../utils/axiosInstance";
import { useSelector } from "react-redux";

const ParoleRequest = () => {
  const navigate = useNavigate();
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  
  const [inmates, setInmates] = useState([]);
  const [filteredInmates, setFilteredInmates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch inmates from backend
  const fetchInmates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/parole-tracking");
      if (response.data && response.data.parole.length > 0) {
        const requestedParole = response.data.parole.filter((p) => p.request?.isRequested);
        if (requestedParole.length > 0) {
          let sno = 1;
          const formattedData = requestedParole.map((inmate) => ({
            _id: inmate.inmateId,
            sno: sno++,
            inmate_name: inmate.fullName || "N/A",
            age: inmate.age || "N/A",
            gender: inmate.gender || "N/A",
            sentence: inmate.caseType || "N/A",
            status: inmate.status || "Pending", // ✅ Added status field for filtering
            action: <ParoleRequestButtons _id={inmate.inmateId} onDelete={fetchInmates} status={ inmate.status } />,
          }));

          setInmates(formattedData);
          setFilteredInmates(formattedData);
        } else {
          console.warn("No requested parole applications found.");
        }
      } else {
        console.error("Invalid API response:", response);
      }
    } catch (error) {
      console.error("Error fetching inmates:", error);
      alert(error.response?.data?.error || "Failed to fetch inmate data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInmates();
  }, []);

  // Search filter by name
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    if (!query) {
      setFilteredInmates(inmates);
      return;
    }
    const filtered = inmates.filter((inmate) =>
      inmate.inmate_name.toLowerCase().includes(query)
    );
    setFilteredInmates(filtered);
  };

  // Filter by status
  const filterByStatus = (status) => {
    if (status === "All") {
      setFilteredInmates(inmates);
    } else {
      const filtered = inmates.filter((inmate) => inmate.status.toLowerCase() === status.toLowerCase());
      setFilteredInmates(filtered);
    }
  };

  return (
    <div
      className={`p-6 mt-24 transition-all duration-300 ${
        isCollapsed ? "ml-16 w-[calc(100%-4rem)]" : "ml-64 w-[calc(100%-16rem)]"
      }`}
    >
      {/* Header Bar */}
      <div
        className={`bg-white shadow-md p-4 fixed top-12 z-20 flex justify-between items-center transition-all duration-300 ml-2 ${
          isCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"
        }`}
        style={{ zIndex: 20 }}
      >
        <h3 className="text-2xl font-bold text-gray-800 text-center">
          Manage Parole Applications
        </h3>

        {/* Search Bar */}
        <div className="relative flex items-center w-72 md:w-1/2 lg:w-1/3 ml-auto">
          <FaSearch className="absolute left-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by inmate name..."
            className="px-4 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
            onChange={handleSearch}
            value={searchQuery}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between mt-10 items-center mb-6 gap-4">
        <div className="flex flex-wrap gap-2">
          {["All", "Pending", "Accepted", "Rejected"].map((status) => (
            <button
              key={status}
              className={`px-3 py-1 rounded-md text-white ${
                status === "All"
                  ? "bg-gray-600 hover:bg-gray-700"
                  : status === "Pending"
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : status === "Accepted"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
              onClick={() => filterByStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="text-center text-gray-600">Loading inmates...</div>
      ) : (
        <div className="overflow-x-auto bg-white p-5 rounded-lg shadow-md">
          <DataTable columns={columns} data={filteredInmates} pagination />
        </div>
      )}
    </div>
  );
};

export default ParoleRequest;
