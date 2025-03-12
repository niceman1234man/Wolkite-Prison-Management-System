import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { useSelector } from "react-redux";
import { columns, PrisonButtons } from "../../utils/PrisonHelper";
import axiosInstance from "../../utils/axiosInstance";

const PrisonsList = () => {
  const [prisons, setPrisons] = useState([]);
  const [filteredPrisons, setFilteredPrisons] = useState([]);
  const [loading, setLoading] = useState(false);

  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  const fetchPrison = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/prison/getall-prisons", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data) {
        let sno = 1;
        const formattedData = response.data.prisons.map((prison) => ({
          _id: prison._id,
          sno: sno++, // Auto-increment serial number
          prison_name: prison.prison_name,
          location: prison.location || "N/A",
          description: prison.description || "N/A",
          action: <PrisonButtons _id={prison._id} onDelete={fetchPrison} />,
        }));

        setPrisons(formattedData);
        setFilteredPrisons(formattedData);
      }
    } catch (error) {
      console.error("Error fetching prisons:", error);
      alert(error.response?.data?.error || "Failed to fetch Prison data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrison();
  }, []);

  const filterPrisons = (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = prisons.filter((prison) =>
      prison.prison_name.toLowerCase().includes(query)
    );
    setFilteredPrisons(filtered);
  };

  return (
    <div className="flex">
      {/* Sidebar Spacing Fix */}
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      />
      
      {/* Main Content */}
      <div className="flex-1 p-5 mt-12">
        <h3 className="text-2xl font-bold text-center mb-5">Manage Prisons</h3>

        {/* Search & Add Prison Button */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
          <input
            type="text"
            placeholder="Search by prison name"
            className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-1/3"
            onChange={filterPrisons}
          />
          <Link
            to="/inspector-dashboard/add-prison"
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md w-full md:w-auto text-center"
          >
            Add New Prison
          </Link>
        </div>

        {/* Prisons List Table */}
        {loading ? (
          <div className="text-center text-gray-600">Loading Prisons...</div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredPrisons}
            pagination
            className="shadow-lg rounded-lg overflow-hidden"
          />
        )}
      </div>
    </div>
  );
};

export default PrisonsList;
