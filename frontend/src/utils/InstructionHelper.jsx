import EditInstruction from "@/components/CourtDashboard/CourtInstructions/EditInstruction";
import ViewInstruction from "@/components/CourtDashboard/CourtInstructions/ViewInstruction";
import AddModal from "@/components/Modals/AddModal";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEdit, FiFileText, FiUser, FiHome, FiCalendar, FiCheck } from "react-icons/fi";
// import { useAuth } from "../context/authContext";

// Enhanced data table columns with improved styling
export const columns = [
  {
    name: "Ins No",
    selector: (row) => row.U_no,
    width: "90px",
    sortable: true,
    cell: (row) => (
      <div className="font-medium text-gray-800">{row.U_no}</div>
    ),
  },
  {
    name: "Case No",
    selector: (row) => row.courtCaseNumber,
    sortable: true,
    width: "100px",
    center: true,
    cell: (row) => (
      <div className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-md text-sm font-medium flex items-center justify-center">
        <FiFileText className="mr-1.5 text-blue-500" size={14} />
        {row.courtCaseNumber}
      </div>
    ),
  },
  {
    name: "Judge Name",
    selector: (row) => row.judgeName,
    sortable: true,
    width: "120px",
    cell: (row) => (
      <div className="flex items-center">
        <FiUser className="mr-1 text-gray-500" />
        <span className="text-gray-800">{row.judgeName}</span>
      </div>
    ),
  },
  {
    name: "Prison Name",
    selector: (row) => row.prisonName,
    sortable: true,
    width: "110px",
    cell: (row) => (
      <div className="flex items-center">
        <FiHome className="mr-1 text-gray-500" />
        <span className="text-gray-800">{row.prisonName}</span>
      </div>
    ),
  },
  {
    name: "Verdict",
    selector: (row) => row.verdict,
    width: "110px",
    cell: (row) => (
      <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
        row.verdict === "guilty" 
          ? "bg-red-50 text-red-700" 
          : "bg-green-50 text-green-700"
      }`}>
        <FiCheck className="inline mr-1" size={12} />
        {row.verdict === "guilty" ? "Guilty" : "Not Guilty"}
      </div>
    ),
  },
  {
    name: "Instructions",
    selector: (row) => row.instructions,
    width: "150px",
    cell: (row) => (
      <div className="truncate max-w-[150px] text-gray-700 hover:text-gray-900 cursor-pointer hover:underline" title={row.instructions}>
        {row.instructions}
      </div>
    ),
  },
  {
    name: "Hearing Date",
    selector: (row) => row.hearingDate,
    sortable: true,
    width: "100px",
    cell: (row) => (
      <div className="flex items-center text-gray-700">
        <FiCalendar className="mr-1.5 text-gray-500" size={14} />
        {new Date(row.hearingDate).toLocaleDateString()}
      </div>
    ),
  },
  {
    name: "Effective Date",
    selector: (row) => row.effectiveDate,
    sortable: true,
    width: "100px",
    cell: (row) => (
      <div className="flex items-center text-gray-700">
        <FiCalendar className=" text-gray-500" size={14} />
        {new Date(row.effectiveDate).toLocaleDateString()}
      </div>
    ),
  },
  {
    name: "Action",
    selector: (row) => row.action,
    center: true,
    width: "120px",
  },
];

export const UserButtons = ({ _id }) => {
  const navigate = useNavigate();
  const [view, setView] = useState(false);
  const [edit, setEdit] = useState(false);
//   const { user } = useAuth(); // Get logged-in user details

  return (
    <div className="flex space-x-2">
      <button
        className=" py-1.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-md shadow-sm hover:from-teal-600 hover:to-teal-700 transition-colors flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
        onClick={() => setView(true)}
      >
        <FiEye className="mr-1.5" size={14} />
        View
      </button>
      <AddModal open={view} setOpen={setView}>
        <ViewInstruction id={_id} />
      </AddModal>
      
      <button
        className=" py-1.5 px-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md shadow-sm hover:from-blue-600 hover:to-blue-700 transition-colors flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        onClick={() => setEdit(true)}
      >
        <FiEdit className="mr-1.5" size={14} />
        Edit
      </button>
      <AddModal open={edit} setOpen={setEdit}>
        <EditInstruction setOpen={setEdit} id={_id} />
      </AddModal>
    </div>
  );
};

// Custom styles for the data table
export const customStyles = {
  headRow: {
    style: {
      backgroundColor: '#f9fafb',
      borderBottom: '1px solid #e5e7eb',
      fontWeight: 'bold',
      color: '#4b5563',
      fontSize: '0.875rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
  },
  headCells: {
    style: {
      padding: '16px',
    },
  },
  rows: {
    style: {
      minHeight: '60px',
      fontSize: '0.875rem',
      borderBottom: '1px solid #f3f4f6',
      '&:hover': {
        backgroundColor: '#f9fafb',
      },
    },
    highlightOnHoverStyle: {
      backgroundColor: '#f3f4f6',
      transition: '0.2s',
    },
  },
  cells: {
    style: {
      padding: '16px',
    },
  },
  pagination: {
    style: {
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
    },
    pageButtonsStyle: {
      padding: '8px',
      marginLeft: '2px',
      marginRight: '2px',
      borderRadius: '4px',
      color: '#4b5563',
      '&:hover:not(:disabled)': {
        backgroundColor: '#e5e7eb',
      },
      '&:focus': {
        outline: 'none',
      },
    },
  },
};

// Function to format date strings
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Function to create a status badge
export const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyles()}`}>
      {status}
    </span>
  );
};
