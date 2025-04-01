import { FaEdit, FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";
import axiosInstance from "./axiosInstance";

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
    name: "Crime",
    selector: (row) => row.crime,
    sortable: true,
    grow: 1,
  },
  {
    name: "Sentence Start",
    selector: (row) => row.sentence_start,
    sortable: true,
    width: "120px",
  },
  {
    name: "Sentence End",
    selector: (row) => row.sentence_end,
    sortable: true,
    width: "120px",
  },
  {
    name: "Risk Level",
    selector: (row) => row.risk_level,
    sortable: true,
    width: "120px",
    cell: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.risk_level === "High"
            ? "bg-red-100 text-red-800"
            : row.risk_level === "Medium"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-green-100 text-green-800"
        }`}
      >
        {row.risk_level}
      </span>
    ),
  },
  {
    name: "Parole Eligible",
    selector: (row) => row.parole_eligible,
    sortable: true,
    width: "120px",
    cell: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.parole_eligible === "Yes"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {row.parole_eligible}
      </span>
    ),
  },
  {
    name: "Actions",
    cell: (row) => row.action,
    width: "150px",
    ignoreRowClick: true,
  },
];

export const InmateButtons = ({ _id, onDelete }) => {
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this inmate?")) {
      try {
        await axiosInstance.delete(`/inmates/${_id}`);
        onDelete();
      } catch (error) {
        console.error("Error deleting inmate:", error);
        alert(error.response?.data?.error || "Failed to delete inmate.");
      }
    }
  };

  return (
    <div className="flex space-x-2">
      <Link
        to={`/inmates/edit/${_id}`}
        className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
      >
        <FaEdit className="text-lg" />
      </Link>
      <button
        onClick={handleDelete}
        className="p-2 text-red-600 hover:text-red-800 transition-colors"
      >
        <FaTrash className="text-lg" />
      </button>
    </div>
  );
}; 