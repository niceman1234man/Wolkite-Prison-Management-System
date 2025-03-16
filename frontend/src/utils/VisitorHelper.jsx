import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AddModal from "@/components/Modals/AddModal";
import EditVisitor from "@/components/Visitor/EditVisitor";
import ViewVisitor from "@/components/Visitor/ViewVisitor";
// import { useAuth } from "../context/authContext";

export const columns = [
  {
    name: "V_No",
    selector: (row) => row.U_no,
    width: "70px",
  },
  {
    name: "FName",
    selector: (row) => row.firstName,
    sortable: true,
    width: "90px",
    center: true,
  },

  {
    name: "MName",
    selector: (row) => row.middleName,
    sortable: true,
    width: "90px",
    center: true,
  },
  {
    name: "LName",
    selector: (row) => row.lastName,
    sortable: true,
    width: "90px",
    center: true,
  },
  {
    name: "inmate",
    selector: (row) => row.inmate,
    width: "90px",
  },
  {
    name: "relation",
    selector: (row) => row.relation,
    width: "90px",
    center: true,
  },
  {
    name: "purpose",
    selector: (row) => row.purpose,
    sortable: true,
    width: "100px",
    center: true,
  },
  {
    name: "phone",
    selector: (row) => row.phone,
    sortable: true,
    width: "130px",
    center: true,
  },
  {
    name: "Date",
    selector: (row) => row.date,
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
  const [view, setView] = useState(false);
  const [edit, setEdit] = useState(false);

  return (
    <div className="flex space-x-3 text-white">
      <button
        className="px-3 py-1 bg-teal-600 rounded"
        onClick={() => setView(true)}
      >
        View
      </button>
      <AddModal open={view} setOpen={setView}>
        <ViewVisitor setView={setView} id={_id} />
      </AddModal>

      <button
        className="px-3 py-1 bg-blue-600 rounded"
        onClick={() => setEdit(true)}
      >
        Edit
      </button>
      <AddModal open={edit} setOpen={setEdit}>
        <EditVisitor setEdit={setEdit} id={_id} />
      </AddModal>
    </div>
  );
};

