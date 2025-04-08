import axios from  "axios";
import { useNavigate }  from "react-router-dom";
import AddModal from "@/components/Modals/AddModal";
import ViewUser from "@/components/Accounts/ViewUser";
import { useState } from "react";
import EditUser from "@/components/Accounts/EditUser";
import { toast } from "react-toastify";
import axiosInstance from "@/utils/axiosInstance";
import { FaEye, FaEdit, FaEnvelope } from "react-icons/fa";
// import { useAuth } from "../context/authContext";

export const columns = [
  {
    name: "U_No",
    selector: (row) => row.U_no,
    width: "70px",
  },
  {
    name: "FName",
    selector: (row) => row.firstName,
    sortable: true,
    width: "100px",
    center: true,
  },
  {
    name: "MName",
    selector: (row) => row.middleName,
    sortable: true,
    width: "100px",
    center: true,
  },
  {
    name: "LName",
    selector: (row) => row.lastName,
    sortable: true,
    width: "100px",
    center: true,
  },
  {
    name: "Status",
    selector: (row) => row.status,
    width: "90px",
    cell: (row) => (
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.status === "Active" 
          ? "bg-green-100 text-green-800" 
          : row.status === "Pending" 
          ? "bg-yellow-100 text-yellow-800" 
          : "bg-red-100 text-red-800"
      }`}>
        {row.status}
      </div>
    ),
  },
  {
    name: "Email",
    selector: (row) => row.email,
    width: "140px",
    center: true,
  },
  {
    name: "Gender",
    selector: (row) => row.gender,
    sortable: true,
    width: "90px",
    center: true,
  },
  {
    name: "Role",
    selector: (row) => row.role,
    sortable: true,
    width: "100px",
    center: true,
  },
  
  {
    name: "Action",
    selector: (row) => row.action,
    center: true,
    width: "300px",
  },
];

export const UserButtons = ({ _id, email }) => {
  const [edit, setEdit] = useState(false);
  const [view, setView] = useState(false);
  const [sending, setSending] = useState(false);

  // Function to send password email
  const sendPasswordEmail = async () => {
    if (!_id) {
      toast.error("User ID is missing");
      return;
    }

    try {
      setSending(true);
      
      // Call your backend API to generate and send password email
      const response = await axiosInstance.put("/user/send-password-email", {
        userId: _id
      });
      
      if (response.data.success) {
        toast.success(`Password sent to ${email || "user's email"}!`);
      } else {
        toast.error(response.data.message || "Failed to send password email");
      }
    } catch (error) {
      console.error("Error sending password email:", error);
      
      // More specific error messages
      if (error.response?.status === 404) {
        toast.error("User not found");
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || "Invalid request");
      } else {
        toast.error("Failed to send password email. Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex space-x-2">
      <button
        className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-md shadow-sm hover:from-teal-600 hover:to-teal-700 transition-colors flex items-center text-sm font-medium"
        onClick={() => setView(true)}
      >
        <FaEye className="mr-1.5" size={14} />
        View
      </button>
      <AddModal open={view} setOpen={setView}>
        <ViewUser id={_id} />
      </AddModal>
      
      <button
        className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md shadow-sm hover:from-blue-600 hover:to-blue-700 transition-colors flex items-center text-sm font-medium"
        onClick={() => setEdit(true)}
      >
        <FaEdit className="mr-1.5" size={14} />
        Edit
      </button>
      <AddModal open={edit} setOpen={setEdit}>
        <EditUser setOpen={setEdit} id={_id} />
      </AddModal>
      
      <button
        type="button"
        className={`px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-md shadow-sm flex items-center text-sm font-medium ${
          sending ? 'opacity-70 cursor-not-allowed' : 'hover:from-green-600 hover:to-green-700'
        }`}
        onClick={()=>sendPasswordEmail()}
        disabled={sending}
      >
        {sending ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
          </>
        ) : (
          <>
            <FaEnvelope className="mr-1.5" size={14} />
            Send
          </>
        )}
      </button>
    </div>
  );
};
