import { useNavigate } from "react-router-dom";
import axios from "axios";

export const columns = [
  {
    name: "S No",
    selector: (row) => row.sno,
    width: "100px",
  },
  {
    name: "Prison Name",
    selector: (row) => row.prison_name, // Updated field for prison name
    width: "130px",
    sortable: true,
  },
  {
    name: "Location",
    selector: (row) => row.location || "N/A", // Added location column
    width: "100px",
    sortable: true,
  },
  {
    name: "Description",
    selector: (row) => row.description || "N/A", // Added capacity column
    sortable: true,
  },
  {
    name: "Action",
    selector: (row) => row.action,
  },
];

export const PrisonButtons = ({ _id, onDelete }) => {
  const navigate = useNavigate();

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this prison record?"
    );
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(
        `https://localhost:5000/api/prison/${id}`, // Updated API for prison
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        alert("Prison deleted successfully.");
        onDelete();
      } else {
        alert("Failed to delete the prison record.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.response?.data?.error || "Error deleting the prison.");
    }
  };

  return (
    <div className="flex space-x-3 text-white">
      <button
        className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
        onClick={() => navigate(`/inspector-dashboard/edit/${_id}`)}
      >
        Edit Prison
      </button>
      <button
        className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
        onClick={() => handleDelete(_id)}
      >
        Delete Prison
      </button>
    </div>
  );
};
