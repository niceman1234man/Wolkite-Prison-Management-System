import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { useSelector } from "react-redux";
import { FaArrowLeft, FaSearch, FaSync, FaCheckCircle, FaTimesCircle, FaCalendarAlt } from "react-icons/fa";
import { toast } from "react-hot-toast";

// Import custom components and hooks
import StatusFilter from "./partials/StatusFilter";
import useVisitorListData from "../../hooks/useVisitorListData";

// Custom styles for the table
const customStyles = {
  headCells: {
    style: {
      backgroundColor: "#D2B48C",
      color: "#5A3E1B",
      fontWeight: "bold",
      fontSize: "14px",
      textTransform: "uppercase",
    },
  },
  rows: {
    style: {
      "&:hover": {
        backgroundColor: "#F5DEB3",
        cursor: "pointer",
        transition: "background-color 0.2s ease-in-out",
      },
    },
  },
};

const TestVisitorList = () => {
  // Get data from custom hook
  const {
    visitors,
    filteredVisitors,
    loading,
    error,
    filter,
    fetchVisitors,
    handleFilterChange,
    handleSearch,
    getStatusColor
  } = useVisitorListData();
  
  // Get sidebar state from Redux
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  // Define columns for the data table
  const columns = [
    {
      name: "No",
      selector: (row) => row.U_no,
      sortable: true,
      width: "60px",
    },
    {
      name: "Name",
      selector: (row) => `${row.firstName} ${row.middleName} ${row.lastName}`,
      sortable: true,
      wrap: true,
    },
    {
      name: "Phone",
      selector: (row) => row.phone,
      sortable: true,
      wrap: true,
    },
    {
      name: "Purpose",
      selector: (row) => row.purpose,
      sortable: true,
      wrap: true,
    },
    {
      name: "Visit Date",
      selector: (row) => row.date,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => row.status || 'Pending',
      sortable: true,
      cell: (row) => (
        <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(row.status || 'Pending')}`}>
          {row.status || 'Pending'}
        </span>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => alert(`View details for ${row.firstName}`)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
          >
            <FaSearch className="mr-1" /> View
          </button>
          {row.status === 'Pending' && (
            <>
              <button
                onClick={() => alert(`Approve ${row.firstName}`)}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
              >
                <FaCheckCircle className="mr-1" /> Approve
              </button>
              <button
                onClick={() => alert(`Reject ${row.firstName}`)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
              >
                <FaTimesCircle className="mr-1" /> Reject
              </button>
              <button
                onClick={() => alert(`Postpone ${row.firstName}`)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
              >
                <FaCalendarAlt className="mr-1" /> Postpone
              </button>
            </>
          )}
        </div>
      ),
      width: "350px",
    },
  ];

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />
      
      {/* Main Content */}
      <div className="flex-1 relative min-h-screen">
        {/* Top Bar */}
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex flex-wrap items-center justify-between transition-all duration-300 ml-2 gap-2 ${
            isCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          {/* Back Button */}
          <button
            className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition duration-300"
            onClick={() => window.history.back()}
          >
            <FaArrowLeft className="mr-2 text-lg" /> Back
          </button>
          
          {/* Search Input */}
          <div className="flex-1" />
          <div className="relative flex items-center w-full md:w-60 lg:w-1/3">
            <FaSearch className="absolute left-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search visitors..."
              className="h-10 px-4 py-2 border border-gray-300 rounded-md w-full pl-10"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={() => {
              const refreshId = toast.loading("Refreshing visitor data...");
              fetchVisitors()
                .then(() => {
                  toast.dismiss(refreshId);
                  toast.success("Visitor data refreshed successfully");
                })
                .catch(() => {
                  toast.dismiss(refreshId);
                  toast.error("Failed to refresh visitor data");
                });
            }}
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center"
          >
            <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Visitor List Table */}
        <div className="p-4 md:p-6 mt-32">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Test Visitor List</h2>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : filteredVisitors.length === 0 ? (
            <div className="text-center py-6 bg-white rounded-lg shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-500">No visitors found</h3>
              <p className="text-gray-400 mt-2">Try a different search or filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Status Filter */}
              <StatusFilter 
                filter={filter} 
                onStatusChange={handleFilterChange} 
              />
              
              {/* Data Table */}
              <div className="mt-4 border rounded-lg overflow-hidden bg-white">
                <DataTable
                  columns={columns}
                  data={filteredVisitors}
                  pagination
                  customStyles={customStyles}
                  highlightOnHover
                  responsive
                  persistTableHead
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestVisitorList; 