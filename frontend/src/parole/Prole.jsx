import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import axiosInstance from "../utils/axiosInstance";
import { columns, ParoleButtons } from "../utils/ParoleHelper";
import { useDispatch, useSelector } from "react-redux";

const Prole = () => {
  const [inmates, setInmates] = useState([]); // State for inmates data
  const [filteredInmates, setFilteredInmates] = useState([]); // Filtered inmates data
  const [loadingInmates, setLoadingInmates] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  // Get the collapsed state of the sidebar
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  // Fetch all inmates from the backend
  const fetchInmates = async () => {
    setLoadingInmates(true);
    try {
      const response = await axiosInstance.get("/inmates/allInmates");
      if (response.data && response.data?.inmates) {
        let sno = 1;
        const formattedData = response.data.inmates.map((inmate) => ({
          _id: inmate._id,
          sno: sno++, // Auto-increment serial number
          inmate_name: inmate.firstName +" "+ inmate.middleName+" "+inmate.lastName  || "N/A",
          age: inmate.age || "N/A",
          gender: inmate.gender || "N/A",
          sentence: inmate.caseType || "N/A",
          status: inmate.status,
          action: <ParoleButtons _id={inmate._id} onDelete={fetchInmates} />,
        }));

        setInmates(formattedData);
        setFilteredInmates(formattedData);
      } else {
        console.error("Invalid API response:", response);
      }
    } catch (error) {
      console.error("Error fetching inmates:", error);
      alert(error.response?.data?.error || "Failed to fetch inmate data.");
    } finally {
      setLoadingInmates(false);
    }
  };

  useEffect(() => {
    fetchInmates();
  }, []);

  // Search and filter by inmate name
  const handleInmateSearch = (e) => {
    const query = e.target.value.toLowerCase();
    if (!query) {
      setFilteredInmates(inmates); // Reset to all inmates if the search query is empty
      return;
    }
    const filtered = inmates.filter((inmate) =>
      inmate.inmate_name.toLowerCase().includes(query) // Use `inmate_name` instead of `fullName`
    );
    setFilteredInmates(filtered);
  };

  // Filter by parole status (Pending, Active, Revoked)
  const filterByButton = (status) => {
    setActiveFilter(status);
    if (status === "All") {
      setFilteredInmates(inmates);
      return;
    }
    const filtered = inmates.filter((inmate) => inmate.sentence === status);
    setFilteredInmates(filtered);
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
      className={`transition-all mt-20 duration-300 ease-in-out ${
        isCollapsed ? "ml-16" : "ml-64" // Adjust margin based on sidebar state
      }`}
    >
      <div className="bg-white rounded-lg shadow-md overflow-hidden m-6">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white p-6">
          <h2 className="text-2xl font-bold">Manage Parole Applications</h2>
          <p className="text-teal-100 mt-1">Monitor and process inmate parole requests</p>
        </div>

        {/* Controls section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
            {/* Search input */}
            <div className="w-full md:w-1/3 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by inmate name"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                onChange={handleInmateSearch}
              />
            </div>
            
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  activeFilter === "All" 
                  ? "bg-teal-600 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => filterByButton("All")}
              >
                All
              </button>
              <button
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  activeFilter === "Pending" 
                  ? "bg-yellow-500 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-yellow-100"
                }`}
                onClick={() => filterByButton("Pending")}
              >
                Pending
              </button>
              <button
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  activeFilter === "Active" 
                  ? "bg-green-600 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-green-100"
                }`}
                onClick={() => filterByButton("Active")}
              >
                Active
              </button>
              <button
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  activeFilter === "Revoked" 
                  ? "bg-red-600 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-red-100"
                }`}
                onClick={() => filterByButton("Revoked")}
              >
                Revoked
              </button>
            </div>
          </div>
        </div>

        {/* Table section */}
        <div className="p-6">
          {loadingInmates ? (
            <div className="flex justify-center items-center h-60">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
              <span className="ml-3 text-gray-600">Loading inmates...</span>
            </div>
          ) : filteredInmates.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-lg">No inmates found matching your criteria</p>
              <button
                onClick={() => {
                  setActiveFilter("All");
                  setFilteredInmates(inmates);
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

export default Prole;