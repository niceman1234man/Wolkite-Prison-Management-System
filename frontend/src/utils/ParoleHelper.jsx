// InmateHelper.jsx
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const columns = [
  {
    name: "S No",
    selector: (row) => row.sno,
    width: "70px",
    center: true,
    sortable: true,
    style: {
      fontWeight: "500",
      color: "#4a5568"
    }
  },
  {
    name: "Inmate Name",
    selector: (row) => row.inmate_name,
    sortable: true,
    
    style: {
      fontWeight: "500",
    },
    grow: 2
  },
  {
    name: "Age",
    selector: (row) => row.age || "N/A",
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "Gender",
    selector: (row) => row.gender || "N/A",
    sortable: true,
    width: "100px",
    center: true,
    cell: row => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
      }`}>
        {row.gender || "N/A"}
      </span>
    ),
  },
  {
    name: "Sentence",
    selector: (row) => row.sentence || "N/A",
    sortable: true,
    width: "120px",
    center: true,
  },
  {
    name: "Status",
    selector: (row) => row.status || "N/A",
    sortable: true,
    width: "120px",
    center: true,
    cell: row => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.status === 'Active' ? 'bg-green-100 text-green-800' : 
        row.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
        row.status === 'Revoked' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {row.status || "N/A"}
      </span>
    ),
  },
  {
    name: "Action",
    selector: (row) => row.action,
    center: true,
    width: "300px",
  },
];

export const ParoleButtons = ({ _id }) => {
  const navigate = useNavigate();

//   const handleDelete = async (id) => {
//     const confirmDelete = window.confirm(
//       "Are you sure you want to delete this inmate record?"
//     );
//     if (!confirmDelete) return;

//     try {
//       const response = await axios.delete(
//         `https://localhost:5000/api/inmate/${id}`, // Updated API endpoint for inmate
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );

//       if (response.data.success) {
//         alert("Inmate record deleted successfully.");
//         onDelete();
//       } else {
//         alert("Failed to delete the inmate record.");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       alert(error.response?.data?.error || "Error deleting the inmate record.");
//     }
//   };

  return (
    <div className="flex flex-col sm:flex-row gap-2 py-2 w-full justify-center">
      <button
        className="px-3 py-1.5 bg-teal-600 rounded-md hover:bg-teal-700 transition-colors duration-200 text-white text-sm font-medium flex items-center justify-center space-x-1 shadow-sm"
        onClick={() => navigate(`/policeOfficer-dashboard/ParoleList/${_id}`)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span>Track Parole</span>
      </button>
      <button
        className="px-3 py-1.5 bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors duration-200 text-white text-sm font-medium flex items-center justify-center space-x-1 shadow-sm"
        onClick={() => navigate(`/policeOfficer-dashboard/status/${_id}`)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Parole Status</span>
      </button>
    </div>
  );
};




