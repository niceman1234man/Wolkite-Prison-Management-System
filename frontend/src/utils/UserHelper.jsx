import axios from "axios";
import { useNavigate } from "react-router-dom";
import AddModal from "@/components/Modals/AddModal";
import ViewUser from "@/components/Accounts/ViewUser";
import { useState } from "react";
import EditUser from "@/components/Accounts/EditUser";
// import { useAuth } from "../context/authContext";

export const columns = [
  {
    name: "U_No",
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
    width: "100px",
    center: true,
  },
  {
    name: "Status",
    selector: (row) => row.status ,
    width: "90px",
  },
  {
    name: "Email",
    selector: (row) => row.email,
    width: "140px",
    center: true,
  },
  {
    name: "Gender",
    selector: (row) => row.gender,
    sortable: true,
    width: "90px",
    center: true,
  },
  {
    name: "Role",
    selector: (row) => row.role,
    sortable: true,
    width: "100px",
    center: true,
  },
  
  {
    name: "Action",
    selector: (row) => row.action,
    center: true,
  },
];



export const UserButtons = ({ _id }) => {
    const [edit,setEdit]=useState(false);
    const [view,setView]=useState(false);
//   const { user } = useAuth(); // Get logged-in user details

  return (
    <div className="flex space-x-3 text-white">
      <button
        className="px-3 py-1 bg-teal-600 rounded"
        onClick={() => setView(true)}
      >
        View
      </button>
      <AddModal open={view} setOpen={setView}>
        <ViewUser id={_id} />
      </AddModal>
      <button
        className="px-3 py-1 bg-blue-600 rounded"
        onClick={() => setEdit(true)}
      >
        Edit
      </button>
      <AddModal open={edit} setOpen={setEdit}>
        <EditUser setOpen={setEdit} id={_id} />
      </AddModal>
    </div>
  );
};
