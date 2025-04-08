// InmateHelper.jsx
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AddModal from "@/components/Modals/AddModal";
import ViewParole from "@/components/SecurityStaff/ViewParole";
import { useState } from "react";

export const columns = [
  {
    name: "P_No",
    selector: (row) => row.sno,
    width: "80px",
    
  },
  {
    name: "Inmate Name",
    selector: (row) => row.inmate_name, // Adjust field based on your API response
    sortable: true,
  },
  {
    name: "Age",
    selector: (row) => row.age || "N/A",
    sortable: true,
    width: "90px",
  },
  {
    name: "Gender",
    selector: (row) => row.gender || "N/A",
    sortable: true,
    width: "100px",
  },
  {
    name: "Parole Date",
    selector: (row) => row.paroleDate || "N/A",
    sortable: true,
    width: "150px",
  },
  
  {
    name: "Sentence",
    selector: (row) => row.sentence || "N/A",
    sortable: true,
  },
  {
    name: "Status",
    selector: (row) => row.status,
    sortable: true,
    cell: (row) => (
      <div>
        {row.status && (
          <span
            className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
              row.status === "accepted"
                ? "bg-green-600"
                : row.status === "rejected"
                ? "bg-red-600"
                : "bg-yellow-600"
            }`}
          >
            {row.status}
          </span>
        )}
      </div>
    ),
    width: "120px",
  },
  {
    name: "Action",
    selector: (row) => row.action,
  },
];

export const InmateButtons = ({ _id, onDelete }) => {
  const navigate = useNavigate();
  const [view, setView] = useState(false);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this inmate record?"
    );
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(
        `https://localhost:5000/api/inmate/${id}`, // API endpoint
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        alert("Inmate record deleted successfully.");
        onDelete();
      } else {
        alert("Failed to delete the inmate record.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.response?.data?.error || "Error deleting the inmate record.");
    }
  };

  return (
    <div className="flex space-x-3 text-white text-center">
      <button
        className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-700"
        onClick={() => setView(true)}
      >
        View
      </button>

      <AddModal open={view} setOpen={setView}>
        <ViewParole id={_id} />
      </AddModal>
    </div>
  );
};

