import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import axiosInstance from "../../utils/axiosInstance";
import { useSelector } from "react-redux";
import { FaArrowLeft, FaPlus, FaSearch, FaEye, FaPen, FaTrash, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaEdit } from "react-icons/fa";
import InmateClearance from "./InmateClearance";
import AddModal from "../Modals/AddModal";
import ViewClearance from "./ViewClearance";
import UpdateClearance from "./UpdateClearance";
import { toast } from "react-toastify";
import ConfirmModal from "../Modals/ConfirmModal";

const ClearanceButtons = ({ _id, onDelete }) => {
  const [edit, setEdit] = useState(false);
  const [view, setView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const handleDelete = async () => {
    try {
      const response = await axiosInstance.delete(`/clearance/deleteClearance/${_id}`);
      if (response.data && response.data.success) {
        toast.success("Clearance deleted successfully");
        onDelete();
      } else {
        toast.error("Failed to delete clearance");
      }
    } catch (error) {
      console.error("Error deleting clearance:", error);
      toast.error(error.response?.data?.message || "Failed to delete clearance");
    }
  };

  return (
    <div className="flex gap-2">
      <button 
        className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100 transition-colors duration-200" 
        onClick={() => setEdit(true)}
        title="Edit Clearance"
      >
        <FaPen size={16} />
      </button>
      
      <button 
        className="p-1 text-green-600 hover:text-green-800 rounded-full hover:bg-green-100 transition-colors duration-200" 
        onClick={() => setView(true)}
        title="View Clearance"
      >
        <FaEye size={16} />
      </button>
      
      <button 
        className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100 transition-colors duration-200" 
        onClick={() => setOpenDelete(true)}
        title="Delete Clearance"
      >
        <FaTrash size={16} />
      </button>
      
      <AddModal open={edit} setOpen={setEdit}>
        <UpdateClearance setOpen={setEdit} id={_id} />
      </AddModal>

      <AddModal open={view} setOpen={setView}>
        <ViewClearance id={_id} />
      </AddModal>
      
      <ConfirmModal
        open={openDelete}
        message="Do you want to delete this clearance? This action cannot be undone."
        onConfirm={() => {
          handleDelete();
          setOpenDelete(false);
        }}
        onCancel={() => setOpenDelete(false)}
      />
    </div>
  );
};

const StatusBadge = ({ status, type }) => {
  let color, icon;
  
  if (type === "property") {
    if (status === "Returned") {
      color = "bg-green-100 text-green-800";
      icon = <FaCheckCircle size={12} className="mr-1" />;
    } else if (status === "Partial") {
      color = "bg-yellow-100 text-yellow-800";
      icon = <FaHourglassHalf size={12} className="mr-1" />;
    } else {
      color = "bg-red-100 text-red-800";
      icon = <FaTimesCircle size={12} className="mr-1" />;
    }
  } else if (type === "fine") {
    if (status === "No Outstanding") {
      color = "bg-green-100 text-green-800";
      icon = <FaCheckCircle size={12} className="mr-1" />;
    } else if (status === "Partial") {
      color = "bg-yellow-100 text-yellow-800";
      icon = <FaHourglassHalf size={12} className="mr-1" />;
    } else {
      color = "bg-red-100 text-red-800";
      icon = <FaTimesCircle size={12} className="mr-1" />;
    }
  } else if (type === "medical") {
    if (status === "Cleared") {
      color = "bg-green-100 text-green-800";
      icon = <FaCheckCircle size={12} className="mr-1" />;
    } else if (status === "Pending") {
      color = "bg-yellow-100 text-yellow-800";
      icon = <FaHourglassHalf size={12} className="mr-1" />;
    } else {
      color = "bg-red-100 text-red-800";
      icon = <FaTimesCircle size={12} className="mr-1" />;
    }
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs flex items-center justify-center ${color}`}>
      {icon} {status}
    </span>
  );
};

const ClearancesList = () => {
  const [clearances, setClearances] = useState([]);
  const [filteredClearances, setFilteredClearances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const navigate = useNavigate();

  const fetchClearances = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/clearance/getAllClearance");

      if (response.data && response.data.clearances) {
        const formattedData = response.data.clearances.map((clearance) => ({
          _id: clearance._id,
          inmate: clearance.inmate || "N/A",
          registrar: clearance.registrar || "N/A",
          clearanceId: clearance.clearanceId || "N/A",
          reason: clearance.reason || "N/A",
          sign: clearance.sign || "No Signature",
          date: new Date(clearance.date).toLocaleDateString(),
          createdAt: new Date(clearance.createdAt).toLocaleDateString(),
          remark: clearance.remark || "N/A",
          propertyStatus: clearance.propertyStatus || "Returned",
          fineStatus: clearance.fineStatus || "No Outstanding",
          medicalStatus: clearance.medicalStatus || "Cleared",
          status: getOverallStatus(clearance),
          action: <ClearanceButtons _id={clearance._id} onDelete={fetchClearances} />,
        }));

        setClearances(formattedData);
        setFilteredClearances(formattedData);
        setTotalRecords(formattedData.length);
      }
    } catch (error) {
      console.error("Error fetching clearances:", error);
      toast.error("Failed to fetch clearances");
    } finally {
      setLoading(false);
    }
  };

  // Determine overall status based on property, fine, and medical statuses
  const getOverallStatus = (clearance) => {
    const statuses = [
      clearance.propertyStatus || "Returned",
      clearance.fineStatus || "No Outstanding",
      clearance.medicalStatus || "Cleared"
    ];
    
    if (statuses.includes("Outstanding") || statuses.includes("Treatment")) {
      return "Not Cleared";
    } else if (statuses.includes("Partial") || statuses.includes("Pending")) {
      return "Partially Cleared";
    } else {
      return "Fully Cleared";
    }
  };

  useEffect(() => {
    fetchClearances();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    
    const filtered = clearances.filter((clearance) =>
      clearance.inmate.toLowerCase().includes(value) ||
      clearance.clearanceId.toLowerCase().includes(value) ||
      clearance.registrar.toLowerCase().includes(value)
    );
    
    setFilteredClearances(filtered);
  };

  const handleFilterByStatus = (e) => {
    const value = e.target.value;
    
    if (value === "all") {
      setFilteredClearances(clearances);
    } else {
      const filtered = clearances.filter((clearance) => 
        clearance.status === value
      );
      setFilteredClearances(filtered);
    }
  };

  const columns = [
    { 
      name: "ID", 
      selector: (row) => row.clearanceId, 
      sortable: true,
      cell: (row) => (
        <div className="py-2">
          <div className="font-medium">{row.clearanceId}</div>
          <div className="text-xs text-gray-500">{row.date}</div>
        </div>
      )
    },
    { 
      name: "Inmate", 
      selector: (row) => row.inmate, 
      sortable: true,
      grow: 1.5
    },
    { 
      name: "Registrar", 
      selector: (row) => row.registrar, 
      sortable: true,
      hide: "md"
    },
    { 
      name: "Status", 
      selector: (row) => row.status, 
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col space-y-1">
          <StatusBadge status={row.propertyStatus} type="property" />
          <StatusBadge status={row.fineStatus} type="fine" />
          <StatusBadge status={row.medicalStatus} type="medical" />
        </div>
      )
    },
    { 
      name: "Date Issued", 
      selector: (row) => row.date, 
      sortable: true,
      hide: "sm"
    },
    { 
      name: "Actions", 
      selector: (row) => row.action, 
      sortable: false,
      right: true
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f8fafc',
        borderBottomWidth: '1px',
        borderBottomColor: '#e2e8f0',
      },
    },
    head: {
      style: {
        color: '#475569',
        fontSize: '0.875rem',
        fontWeight: 600,
      },
    },
    rows: {
      style: {
        minHeight: '72px',
        fontSize: '0.875rem',
      },
      highlightOnHoverStyle: {
        backgroundColor: '#f1f5f9',
        borderBottomColor: '#e2e8f0',
        outline: '1px solid #e2e8f0',
      },
    },
    pagination: {
      style: {
        borderTopWidth: '1px',
        borderTopColor: '#e2e8f0',
      },
    },
  };

  return (
    <div className={`p-5 mt-12 transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-64"}`}>
      {/* Header & Navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
      <button 
        onClick={() => navigate(-1)} 
            className="mr-4 flex items-center text-gray-600 hover:text-gray-800"
      >
        <FaArrowLeft className="mr-2" /> Back
      </button>
          <h3 className="text-2xl font-bold text-gray-800">Manage Clearances</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Total: {totalRecords}</span>
          <button
            onClick={() => setOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <FaPlus className="mr-2" /> Add New Clearance
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
        <input
          type="text"
              placeholder="Search by inmate name or clearance ID..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-teal-500 focus:border-teal-500"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          <div className="flex space-x-4">
            <div>
              <select
                onChange={handleFilterByStatus}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="all">All Statuses</option>
                <option value="Fully Cleared">Fully Cleared</option>
                <option value="Partially Cleared">Partially Cleared</option>
                <option value="Not Cleared">Not Cleared</option>
              </select>
            </div>
            
        <button
              onClick={fetchClearances}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
              title="Refresh Data"
        >
              Refresh
        </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="bg-white p-8 rounded-lg shadow-sm flex justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            <p className="mt-4 text-gray-600">Loading clearances...</p>
          </div>
        </div>
      ) : filteredClearances.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <DataTable 
            columns={columns} 
            data={filteredClearances} 
            pagination 
            highlightOnHover
            pointerOnHover
            responsive
            striped
            customStyles={customStyles}
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
          />
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-gray-600">No clearance records found.</p>
          {searchTerm && (
            <button 
              onClick={() => { setSearchTerm(""); setFilteredClearances(clearances); }}
              className="mt-4 text-teal-600 hover:text-teal-800"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Add Modal */}
      <AddModal open={open} setOpen={setOpen}>
        <InmateClearance setOpen={setOpen} />
      </AddModal>
    </div>
  );
};

export default ClearancesList;
