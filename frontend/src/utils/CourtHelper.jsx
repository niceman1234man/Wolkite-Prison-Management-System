import axios from "axios";
import { useNavigate } from "react-router-dom";
import AddModal from "@/components/Modals/AddModal";
import CourtView from "@/components/SecurityStaff/CourtView";
import { useState } from "react";
// import { useAuth } from "../context/authContext";

export const columns = [
  {
    name: "Ins No",
    selector: (row) => row.U_no,
    width: "100px",
  },
  {
    name: "Case No",
    selector: (row) => row.courtCaseNumber,
    sortable: true,
    width: "100px",
    center: true,
  },
  {
    name: "Judge Name",
    selector: (row) => row.judgeName,
    sortable: true,
    width: "100px",
    center: true,
  },
  
  {
    name: "Prison Name",
    selector: (row) => row.prisonName,
    sortable: true,
    width: "100px",
    center: true,
  },
  {
    name: "verdict",
    selector: (row) => row.verdict ,
    width: "90px",
  },
  {
    name: "instructions",
    selector: (row) => row.instructions,
    width: "120px",
    center: true,
  },
  {
    name: "Hearing Date",
    selector: (row) => row.hearingDate,
    sortable: true,
    width: "130px",
    center: true,
  },
  {
    name: "Effective Date",
    selector: (row) => row.effectiveDate,
    sortable: true,
    width: "130px",
    center: true,
  },
  
  {
    name: "Action",
    selector: (row) => row.action,
    center: true,
  },
];



export const UserButtons = ({ _id }) => {
  const navigate = useNavigate();
  const [view,setView]=useState(false);
//   const { user } = useAuth(); // Get logged-in user details

  return (
    <div className="flex space-x-3 text-white">
      <button
        className="px-3 py-1 bg-teal-600 rounded"
        onClick={() =>setView(true)}
      >
        View
      </button>
      <AddModal open={view} setOpen={setView}>
        <CourtView id={_id} />
      </AddModal>
    
    </div>
  );
};
