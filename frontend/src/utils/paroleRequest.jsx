// InmateHelper.jsx
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AddModal from "@/components/Modals/AddModal";
import ViewParole from "@/components/CourtDashboard/CourtInstructions/ViewParole";
import { useState } from "react";
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
    width: "70px",
  },
  {
    name: "Gender",
    selector: (row) => row.gender || "N/A",
    sortable: true,
    width: "90px",
  },
  {
    name: "Sentence",
    selector: (row) => row.sentence || "N/A",
    sortable: true,
  },
  {
    name: "Action",
    selector: (row) => row.action,
  },
];

export const ParoleRequestButtons = ({ _id,status }) => {
  const navigate = useNavigate();
  const [view,setView]=useState(false);


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
     
      {status && (
        <button
          className={`px-3 py-1 rounded ${
            status === "accepted"
              ? "bg-green-600 hover:bg-green-700"
              : status === "rejected"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-yellow-600 hover:bg-yellow-700"
          }`}
        >
          {status}
        </button>
      )}
   
    </div>
  );
};




