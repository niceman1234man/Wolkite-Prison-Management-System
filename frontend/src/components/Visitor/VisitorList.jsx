import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { useSelector } from "react-redux";
import { FaArrowLeft, FaSearch, FaSync, FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaEye } from "react-icons/fa";
import { columns as defaultColumns, UserButtons } from "../../utils/VisitorHelper.jsx";
import UpdateVisitorModal from "../Modals/UpdateVisitorModal.jsx";
import AddModal from "../Modals/AddModal.jsx";    
import RegisterVisitor from './RegisterVisitor.jsx';
import { toast } from "react-hot-toast";

// Import custom components and hooks
import StatusFilter from "./partials/StatusFilter";
import PostponeModal from "./partials/PostponeModal";
import VisitorDetailModal from "./partials/VisitorDetailModal";
import useVisitorListData from "../../hooks/useVisitorListData";
import useVisitorActions from "../../hooks/useVisitorActions";

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

const VisitorList = () => {
  // Get data and actions from custom hooks
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
  
  const {
    viewVisitor,
    showDetailModal,
    showPostponeModal,
    handleApproveClick,
    handleRejectClick,
    handlePostponeClick,
    handlePostponeSubmit,
    handleViewDetails,
    closeDetailModal,
    closePostponeModal
  } = useVisitorActions(fetchVisitors);

  // Local state
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // Get sidebar state from Redux
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  // Define police officer columns inside the component
  const policeOfficerColumns = [
    {
      name: "No",
      selector: (row) => row.U_no,
      sortable: true,
      width: "60px",
      center: true,
    },
    {
      name: "Name",
      selector: (row) => `${row.firstName} ${row.middleName} ${row.lastName}`,
      sortable: true,
      wrap: true,
      center: true,
    },
    {
      name: "Phone",
      selector: (row) => row.phone,
      sortable: true,
      wrap: true,
      center: true,
    },
    {
      name: "Purpose",
      selector: (row) => row.purpose,
      sortable: true,
      wrap: true,
      center: true,
    },
    {
      name: "Visit Date",
      selector: (row) => row.date,
      sortable: true,
      center: true,
    },
    {
      name: "Status",
      selector: (row) => row.status || 'Pending',
      sortable: true,
      center: true,
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
            onClick={() => handleViewDetails(row)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
          >
            <FaEye className="mr-1" /> View
          </button>
          {(row.status?.toLowerCase() === 'pending') && (userData?.role === 'police-officer' || userData?.role === 'admin') && (
            <>
              {/* Uncomment these if you need them */}
              {/* <button
                onClick={() => handleApproveClick(row._id)}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
              >
                <FaCheckCircle className="mr-1" /> Approve
              </button>
              <button
                onClick={() => handleRejectClick(row._id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
              >
                <FaTimesCircle className="mr-1" /> Reject
              </button>
              <button
                onClick={() => handlePostponeClick(row._id)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
              >
                <FaCalendarAlt className="mr-1" /> Postpone
              </button> */}
            </>
          )}
          <button
            onClick={() => handleUpdate(row)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
          >
            <FaSync className="mr-1" /> Update
          </button>
        </div>
      ),
      width: "200px",
      center: true,
    },
];


  // Set up component on mount
  useEffect(() => {
    // Get user data from localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    setUserData(user);
  }, []);

  const handleUpdate = (visitor) => {
    setSelectedVisitor(visitor);
    setOpen(true);
  };

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
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Visitor List</h2>
          
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
          
          {/* Add New Visitor Button */}
          <button
            onClick={() => setOpen(true)}
            className="h-10 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center justify-center min-w-[150px] md:w-auto"
          >
            Add New Visitor
          </button>
          <AddModal open={open} setOpen={setOpen}>
            <RegisterVisitor setOpen={setOpen} onSuccess={() => {
              setOpen(false);
              fetchVisitors();
              toast.success("New visitor added successfully");
            }} />
          </AddModal>
        </div>

        {/* Visitor List Table */}
        <div className="p-4 md:p-6 mt-32">
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
                statusFilter={filter} 
                onStatusChange={handleFilterChange} 
              />
              
              {/* Data Table */}
              <div className="mt-4 border rounded-lg overflow-hidden bg-white">
                <DataTable
                  columns={userData?.role === "police-officer" || userData?.role === "admin" ? policeOfficerColumns : defaultColumns}
                  data={filteredVisitors}
                  pagination
                  customStyles={customStyles}
                  highlightOnHover
                  responsive
                  persistTableHead
                  progressPending={loading}
                  progressComponent={
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    </div>
                  }
                  noDataComponent={
                    <div className="text-center py-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-500">No visitors found</h3>
                      <p className="text-gray-400 mt-2">Try a different search or filter</p>
                    </div>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <VisitorDetailModal
        isOpen={showDetailModal}
        visitor={viewVisitor}
        onClose={closeDetailModal}
        onApprove={handleApproveClick}
        onReject={handleRejectClick}
        onPostpone={handlePostponeClick}
        userRole={userData?.role}
      />

      {/* Postpone Modal */}
      <PostponeModal
        isOpen={showPostponeModal}
        onClose={closePostponeModal}
        onSubmit={handlePostponeSubmit}
        visitor={viewVisitor}
      />

      {/* Update Visitor Modal */}
      {selectedVisitor && (
        <UpdateVisitorModal 
          open={open} 
          setOpen={setOpen} 
          visitor={selectedVisitor} 
          onSuccess={() => {
            setOpen(false);
            fetchVisitors();
            toast.success("Visitor updated successfully");
          }}
        />
      )}
    </div>
  );
};

export default VisitorList;
