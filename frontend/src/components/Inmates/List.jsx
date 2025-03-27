import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { columns, InmateButtons } from "../../utils/InmateHelper.jsx";
import axiosInstance from "../../utils/axiosInstance";
import { useSelector, useDispatch } from "react-redux";
import { setInmate } from "../../redux/prisonSlice.js";
import AddInmate from "./Add";
import AddModal from "../Modals/AddModal";
import { toast } from "react-hot-toast";

const InmatesList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [inmates, setInmates] = useState([]);
  const [filteredInmates, setFilteredInmates] = useState([]);
  const [loading, setLoading] = useState(false);
  const inmate = useSelector((state) => state.inmate.inmate);

  const fetchInmates = async () => {
    setLoading(true);
    try {
      console.log("Fetching inmates...");
      const response = await axiosInstance.get("/inmates/allInmates");
      console.log("API Response:", response.data);

      // Check if response.data has an inmates array
      const inmatesData = response.data?.inmates || response.data || [];
      
      if (Array.isArray(inmatesData)) {
        dispatch(setInmate(inmatesData));
        let sno = 1;
        const formattedData = inmatesData.map((inmate) => ({
          _id: inmate._id,
          sno: sno++,
          inmate_name: inmate.fullName || "N/A",
          age: inmate.age || "N/A",
          gender: inmate.gender || "N/A",
          case_type: inmate.caseType || "N/A",
          release_reason: inmate.releaseReason || "N/A",
          current_location: `${inmate.currentWereda || ""}, ${inmate.currentZone || ""}`,
          contact: inmate.phoneNumber || "N/A",
          action: <InmateButtons _id={inmate._id} onDelete={fetchInmates} />,
        }));

        setInmates(formattedData);
        setFilteredInmates(formattedData);
      } else {
        console.error("Invalid API response structure:", response.data);
        toast.error("Invalid response structure from server");
      }
    } catch (error) {
      console.error("Error fetching inmates:", error);
      if (error.response?.status === 401) {
        toast.error("Please login to continue");
        navigate("/login");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to access this resource");
      } else {
        toast.error(error.response?.data?.error || "Failed to fetch inmate data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInmates();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    if (!query) {
      setFilteredInmates(inmates);
      return;
    }
    const filtered = inmates.filter((inmate) =>
      inmate.inmate_name.toLowerCase().includes(query) ||
      inmate.case_type.toLowerCase().includes(query) ||
      inmate.release_reason.toLowerCase().includes(query)
    );
    setFilteredInmates(filtered);
  };

  return (
    <div
      className={`p-6 mt-24 transition-all duration-300 ${
        isCollapsed ? "ml-16 w-[calc(100%-4rem)]" : "ml-64 w-[calc(100%-16rem)]"
      }`}
    >
      {/* Back Button */}
      <button
        className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition duration-300"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="mr-2 text-lg" /> Back
      </button>

      <h3 className="text-3xl font-bold text-gray-800 text-center my-6">Manage Inmates</h3>

      {/* Search & Add Inmate Button */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <input
          type="text"
          placeholder="Search by name, case type, or release reason..."
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-teal-500"
          onChange={handleSearch}
        />
        <button
          onClick={() => setOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2 rounded-lg shadow-md transition duration-300 text-center w-full md:w-auto"
        >
          + Add New Inmate
        </button>
        <AddModal open={open} setOpen={setOpen}>
          <AddInmate setOpen={setOpen} onSuccess={fetchInmates} />
        </AddModal>
      </div>

      {/* Inmate List Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white p-5 rounded-lg shadow-md">
          <DataTable 
            columns={columns} 
            data={filteredInmates} 
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            responsive
            striped
            highlightOnHover
          />
        </div>
      )}
    </div>
  );
};

export default InmatesList;
