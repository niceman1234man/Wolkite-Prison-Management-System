import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { columns, InmateButtons } from "../../utils/ParoleSendHelper";
import axiosInstance from "../../utils/axiosInstance";
import { useSelector, useDispatch } from "react-redux";
import { setInmate } from "../../redux/prisonSlice.js";
import { toast } from 'react-toastify';

const ParoleSend = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [inmates, setInmates] = useState([]);
  const [filteredInmates, setFilteredInmates] = useState([]);
  const [loading, setLoading] = useState(false);
  const inmate = useSelector((state) => state.inmate.inmate);

  const fetchInmates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/parole-tracking");
     
      if (response.data && response.data.parole) {
        // Filter only eligible inmates
        const eligibleInmates = response.data.parole.filter(inmate => inmate.paroleEligible);
        
        dispatch(setInmate(eligibleInmates));
        let sno = 1;
        const formattedData = eligibleInmates.map((parole) => ({
          _id: parole.inmateId,
          sno: sno++,
          inmate_name: parole.fullName || "N/A",
          age: parole.age || "N/A",
          gender: parole.gender || "N/A",
          sentence: parole.caseType || "N/A",
          status: parole.status || "N/A",
          action: <InmateButtons _id={parole.inmateId} onDelete={fetchInmates} status={parole.status} />,
        }));

        setInmates(formattedData);
        setFilteredInmates(formattedData);
      } else {
        console.error("Invalid API response:", response);
        toast.error("Failed to fetch eligible inmates");
      }
    } catch (error) {
      console.error("Error fetching inmates:", error);
      toast.error(error.response?.data?.error || "Failed to fetch inmate data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInmates();
  }, []);

  // Instant Search
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    if (!query) {
      setFilteredInmates(inmates);
      return;
    }
    const filtered = inmates.filter((inmate) =>
      (inmate.inmate_name?.toLowerCase() || "").includes(query) || 
      (inmate.status?.toLowerCase() || "").includes(query)
    );
    setFilteredInmates(filtered);
  };

  // Filter by status
  const filterByButton = (status) => {
    const filtered = inmates.filter((inmate) => 
      inmate.status.toLowerCase() === status.toLowerCase()
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

      <h3 className="text-3xl font-bold text-gray-800 text-center my-6">
        Eligible Parole Requests
      </h3>

      {/* Search & Filter Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <input
          type="text"
          placeholder="Search by inmate name or status..."
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-teal-500"
          onChange={handleSearch}
        />
        
        {/* Filter Buttons */}
        <div className="space-x-3">
          <button
            className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            onClick={() => setFilteredInmates(inmates)}
          >
            All
          </button>
          <button
            className="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            onClick={() => filterByButton("Pending")}
          >
            Pending
          </button>
          <button
            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
            onClick={() => filterByButton("Accepted")}
          >
            Accepted
          </button>
          <button
            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
            onClick={() => filterByButton("Rejected")}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Inmate List Table */}
      {loading ? (
        <div className="text-center text-gray-600">Loading inmates...</div>
      ) : (
        <div className="overflow-x-auto bg-white p-5 rounded-lg shadow-md">
          {filteredInmates.length > 0 ? (
            <DataTable columns={columns} data={filteredInmates} pagination />
          ) : (
            <div className="text-center py-4 text-gray-600">
              No eligible inmates found for parole
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParoleSend;
