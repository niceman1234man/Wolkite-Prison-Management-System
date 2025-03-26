import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { useSelector } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import AddPrison from "./AddPrison";
import AddModal from "../Modals/AddModal";
import { toast } from "react-toastify";

const columns = [
  {
    name: "Prison Name",
    selector: (row) => row.prison_name,
    sortable: true,
  },
  {
    name: "Location",
    selector: (row) => row.location,
    sortable: true,
  },
  {
    name: "Capacity",
    selector: (row) => row.capacity,
    sortable: true,
  },
  {
    name: "Current Population",
    selector: (row) => row.current_population,
    sortable: true,
  },
  {
    name: "Status",
    selector: (row) => row.status,
    sortable: true,
    cell: (row) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.status === "active"
            ? "bg-green-100 text-green-800"
            : row.status === "inactive"
            ? "bg-red-100 text-red-800"
            : "bg-yellow-100 text-yellow-800"
        }`}
      >
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </span>
    ),
  },
  {
    name: "Actions",
    cell: (row) => (
      <div className="flex gap-2">
        <button
          onClick={() => handleEdit(row._id)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
        >
          Edit
        </button>
        <button
          onClick={() => handleDelete(row._id)}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
        >
          Delete
        </button>
      </div>
    ),
  },
];

const customStyles = {
  headCells: {
    style: {
      backgroundColor: "#D2B48C",
      color: "#5A3E1B",
      fontWeight: "bold",
      fontSize: "14px",
      textTransform: "uppercase",
    },
  },
  rows: {
    style: {
      "&:hover": {
        backgroundColor: "#F5DEB3",
        cursor: "pointer",
        transition: "background-color 0.2s ease-in-out",
      },
    },
  },
};

const PrisonsList = () => {
  const [prisons, setPrisons] = useState([]);
  const [filteredPrisons, setFilteredPrisons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const navigate = useNavigate();

  const fetchPrisons = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/prison/getall-prisons");
      if (response.data?.success) {
        setPrisons(response.data.prisons);
        setFilteredPrisons(response.data.prisons);
      }
    } catch (error) {
      console.error("Error fetching prisons:", error);
      toast.error("Failed to fetch prison data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrisons();
  }, []);

  const handleEdit = async (id) => {
    try {
      navigate(`/inspector-dashboard/prisons/edit/${id}`);
    } catch (error) {
      console.error("Error navigating to edit:", error);
      toast.error("Failed to navigate to edit page");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this prison?")) {
      try {
        const response = await axiosInstance.delete(
          `/prison/delete-prison/${id}`
        );
        if (response.data?.success) {
          toast.success("Prison deleted successfully");
          fetchPrisons();
        }
      } catch (error) {
        console.error("Error deleting prison:", error);
        toast.error(error.response?.data?.error || "Failed to delete prison");
      }
    }
  };

  const filterPrisons = (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = prisons.filter(
      (prison) =>
        prison.prison_name.toLowerCase().includes(query) ||
        prison.location.toLowerCase().includes(query)
    );
    setFilteredPrisons(filtered);
  };

  return (
    <div className="flex">
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      />
      <div className="flex-1 relative min-h-screen">
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex flex-wrap items-center justify-between transition-all duration-300 ml-2 gap-4 ${
            isCollapsed
              ? "left-16 w-[calc(100%-5rem)]"
              : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          <button
            className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition duration-300 mr-4"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="mr-2 text-lg" /> Back
          </button>
          <div className="flex-1" />
          <div className="relative flex items-center w-72 md:w-1/3 mr-4">
            <FaSearch className="absolute left-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search by prison name or location"
              className="h-10 px-4 py-2 border border-gray-300 rounded-md w-full pl-10"
              onChange={filterPrisons}
            />
          </div>
          <button
            onClick={() => setOpen(true)}
            className="h-10 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center justify-center min-w-[150px] md:w-auto"
          >
            Add New Prison
          </button>
          <AddModal open={open} setOpen={setOpen}>
            <AddPrison setOpen={setOpen} />
          </AddModal>
        </div>
        <div className="p-6 mt-32">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Prison List</h2>
          {loading ? (
            <div className="text-center text-gray-600">Loading Prisons...</div>
          ) : (
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={filteredPrisons}
                pagination
                className="shadow-lg rounded-lg overflow-hidden"
                customStyles={customStyles}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrisonsList;
