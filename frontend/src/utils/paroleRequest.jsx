// InmateHelper.jsx
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AddModal from "@/components/Modals/AddModal";
import ViewParole from "@/components/CourtDashboard/CourtInstructions/ViewParole";
import { useState } from "react";

// Function to format dates
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  } catch (error) {
    console.error("Date formatting error:", error);
    return dateString;
  }
};

export const columns = [
  {
    name: "S No",
    selector: (row) => row.sno,
    width: "70px",
    
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
    name: "Parole Date",
    selector: (row) => formatDate(row.paroleDate),
    sortable: true,
    width: "150px",
  },
  {
    name: "Gender",
    selector: (row) => row.gender || "N/A",
    sortable: true,
    width: "110px",
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
    width: "130px",
  },
  {
    name: "Action",
    selector: (row) => row.action,
  },
];

export const ParoleRequestButtons = ({ _id }) => {
  const navigate = useNavigate();
  const [view, setView] = useState(false);

  return (
    <div className="flex space-x-3 text-white">
      <button
        className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
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




