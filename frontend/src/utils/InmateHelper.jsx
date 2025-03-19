import { useNavigate } from "react-router-dom";
import axios from "axios";
import AddModal from "@/components/Modals/AddModal";
import UpdateInmate from "@/components/Inmates/UpdateInmate";
import ViewInmate from "@/components/Inmates/ViewInmate";
import { useState } from "react";

export const columns = [
  {
    name: "S No",
    selector: (row) => row.sno,
    width: "60px",
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

export const InmateButtons = ({ _id }) => {
  const [view, setView] = useState(false);
  const [edit, setEdit] = useState(false);
  return (
    <div className="flex space-x-3 text-white text-center">
      {/* View Button */}
      <button
        className="px-3 py-1 bg-green-600 rounded hover:bg-green-700"
        onClick={() => setView(true)}
      >
        View
      </button>
      <AddModal open={view} setOpen={setView}>
        <ViewInmate id={_id} />
      </AddModal>

      {/* Edit Button */}
      <button
        className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
        onClick={() => setEdit(true)}
      >
        Edit
      </button>
      <AddModal open={edit} setOpen={setEdit}>
        <UpdateInmate setOpen={setEdit} id={_id} />
      </AddModal>

    </div>
  );
};