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
  const [activeFilter, setActiveFilter] = useState("All");

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
            paroleDate: inmate.paroleDate || "N/A",
            status: inmate.status || "Pending",
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
    setActiveFilter(status);
    if (status === "All") {
      setFilteredInmates(inmates);
    } else {
      const filtered = inmates.filter((inmate) => inmate.status.toLowerCase() === status.toLowerCase());
      setFilteredInmates(filtered);
    }
  };

  const customStyles = {
    headCells: {
      style: {
        fontSize: '16px',
        fontWeight: 'bold',
        backgroundColor: '#f0f9fa',
        paddingTop: '12px',
        paddingBottom: '12px',
      },
    },
    rows: {
      style: {
        fontSize: '14px',
        minHeight: '56px',
        '&:nth-of-type(odd)': {
          backgroundColor: '#f8fbfd',
        },
        '&:hover': {
          backgroundColor: '#f0f7fa',
          cursor: 'pointer',
        },
      },
    },
    pagination: {
      style: {
        borderTop: '1px solid #e2e8f0',
        fontSize: '14px',
      },
    },
  };

  return (
    <div
      className={`transition-all mt-10 duration-300 ${
        isCollapsed ? "ml-16" : "ml-64"
      }`}
    >
      <div className="bg-white rounded-lg shadow-md overflow-hidden m-6">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white p-6">
          <h2 className="text-2xl font-bold">Manage Parole Applications</h2>
          <p className="text-teal-100 mt-1">Review and respond to parole requests</p>
        </div>

        {/* Controls section */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 items-center">
            {/* Search input */}
            <div className="col-span-12 md:col-span-5 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by inmate name"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                onChange={handleSearch}
                value={searchQuery}
              />
            </div>
            
            {/* Filter buttons */}
            <div className="col-span-12 md:col-span-7 flex justify-end space-x-2">
              {["All", "Pending", "Accepted", "Rejected"].map((status) => (
                <button
                  key={status}
                  className={`px-4 py-2 rounded-md transition-all duration-200 whitespace-nowrap ${
                    activeFilter === status 
                    ? status === "All" 
                      ? "bg-teal-600 text-white" 
                      : status === "Pending" 
                      ? "bg-yellow-500 text-white" 
                      : status === "Accepted" 
                      ? "bg-green-600 text-white" 
                      : "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => filterByStatus(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table section */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-60">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
              <span className="ml-3 text-gray-600">Loading parole requests...</span>
            </div>
          ) : filteredInmates.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-lg">No parole requests found</p>
              <button
                onClick={() => {
                  setActiveFilter("All");
                  setFilteredInmates(inmates);
                  setSearchQuery("");
                }}
                className="mt-2 text-teal-600 underline hover:text-teal-800"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <DataTable 
                columns={columns} 
                data={filteredInmates} 
                pagination 
                customStyles={customStyles}
                highlightOnHover
                pointerOnHover
                responsive
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParoleRequest;
