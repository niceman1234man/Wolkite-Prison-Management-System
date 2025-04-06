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
    width: "80px",
  },
  {
    name: "Name",
    selector: (row) => row.inmate_name,
    sortable: true,
    grow: 2,
  },
  {
    name: "Age",
    selector: (row) => row.age,
    sortable: true,
    width: "100px",
  },
  {
    name: "Gender",
    selector: (row) => row.gender,
    sortable: true,
    width: "100px",
  },
  {
    name: "Case Type",
    selector: (row) => row.case_type,
    sortable: true,
    grow: 1,
  },
  {
    name: "Release Reason",
    selector: (row) => row.release_reason,
    sortable: true,
    grow: 1,
  },
  {
    name: "Location",
    selector: (row) => row.current_location,
    sortable: true,
    grow: 1,
  },
  {
    name: "Contact",
    selector: (row) => row.contact,
    sortable: true,
    width: "120px",
  },
  {
    name: "Actions",
    cell: (row) => <InmateButtons _id={row._id} onDelete={row.onDelete} />,
    width: "150px",
    ignoreRowClick: true,
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