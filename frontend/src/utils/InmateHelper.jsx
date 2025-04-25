import React from "react";
import { FaEdit, FaTrash,FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axiosInstance from "./axiosInstance";
import { toast } from "react-hot-toast";
import AddModal from "@/components/Modals/AddModal";
import UpdateInmate from "@/components/Inmates/UpdateInmate";
import ViewInmate from "@/components/Inmates/ViewInmate";
import { useState } from "react";

export const columns = [
  {
    name: "S.No",
    selector: (row) => row.sno,
    sortable: true,
    width: "60px",
  },
  {
    name: "Name",
    selector: (row) => row.inmate_name,
    sortable: true,
    grow: 2,
    cell: (row) => (
      <div className="font-medium">{row.inmate_name}</div>
    ),
  },
  {
    name: "Age",
    selector: (row) => row.age,
    sortable: true,
    width: "70px",
  },
  {
    name: "Gender",
    selector: (row) => row.gender,
    sortable: true,
    width: "90px",
    cell: (row) => (
      <div className="capitalize">{row.gender}</div>
    ),
  },
  {
    name: "Case Type",
    selector: (row) => row.case_type,
    sortable: true,
    width: "110px",
    cell: (row) => (
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.case_type === "Criminal" ? "bg-red-100 text-red-800" : 
        row.case_type === "Civil" ? "bg-blue-100 text-blue-800" : 
        row.case_type === "Administrative" ? "bg-green-100 text-green-800" :
        "bg-gray-100 text-gray-800"
      }`}>
        {row.case_type}
      </div>
    ),
  },
  {
    name: "Reason",
    selector: (row) => row.reason,
    sortable: true,
    width: "180px",
    cell: (row) => (
      <div className="truncate max-w-[180px]" title={row.reason}>
        {row.reason || "Not specified"}
      </div>
    ),
  },
  {
    name: "Status",
    selector: (row) => row.transfer_status,
    sortable: true,
    width: "120px",
    cell: (row) => (
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.transfer_status === "transferred" ? "bg-purple-100 text-purple-800" : 
        row.transfer_status === "local" ? "bg-green-100 text-green-800" : 
        "bg-gray-100 text-gray-800"
      }`}>
        {row.transfer_status || "Local"}
      </div>
    ),
  },
  {
    name: "Actions",
    cell: (row) => <InmateButtons _id={row._id} onDelete={row.onDelete} />,
    width: "120px",
    ignoreRowClick: true,
    right: true,
  },
];

export const InmateButtons = ({ _id, onDelete }) => {
  console.log(_id);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [view,setView]=useState(false);
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this inmate?")) {
      try {
        const response = await axiosInstance.delete(`/inmates/delete-inmate/${_id}`);
        if (response.data) {
          toast.success("Inmate deleted successfully");
          onDelete();
        }
      } catch (error) {
        console.error("Error deleting inmate:", error);
        if (error.response?.status === 401) {
          toast.error("Please login to continue");
          navigate("/login");
        } else if (error.response?.status === 403) {
          toast.error("You don't have permission to delete this inmate");
        } else {
          toast.error(error.response?.data?.error || "Failed to delete inmate");
        }
      }
    }
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
        title="Edit Inmate"
      >
        <FaEdit size={18} />
      </button>
      <AddModal open={open} setOpen={setOpen} >
        <UpdateInmate _id={_id} />
      </AddModal>
      <button
        onClick={handleDelete}
        className="p-2 text-red-600 hover:text-red-800 transition-colors"
        title="Delete Inmate"
      >
        <FaTrash size={18} />
      </button>
      <button
        onClick={()=>setView(true)}
        className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
        title="View Inmate"
      >
        <FaEye size={18} />
      </button>
      <AddModal open={view} setOpen={setView} >
        <ViewInmate _id={_id} />
      </AddModal>
    </div>
  );
};