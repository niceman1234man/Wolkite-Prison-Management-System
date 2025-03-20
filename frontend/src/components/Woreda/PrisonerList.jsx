import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import DataTable from "react-data-table-component";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux"; // Import useSelector for sidebar state
import { FaSearch } from "react-icons/fa";

const PrisonerList = () => {
  const [prisoners, setPrisoners] = useState([]);
  const [filteredPrisoners, setFilteredPrisoners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get sidebar state from Redux
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  useEffect(() => {
    fetchPrisoners();
  }, []);

  const fetchPrisoners = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/prisoner/getall-prisoners", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data?.prisoners?.length > 0) {
        const data = response.data.prisoners.map((prisoner) => ({
          ...prisoner,
          timeRemaining: calculateTimeRemaining(prisoner.intakeDate),
        }));
        setPrisoners(data);
        setFilteredPrisoners(data);
      }
    } catch (error) {
      console.error("Error fetching prisoners:", error);
      alert(error.response?.data?.error || "Failed to fetch prisoner data.");
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRemaining = (intakeDate) => {
    const intakeTime = new Date(intakeDate).getTime();
    const deadline = intakeTime + 48 * 60 * 60 * 1000; // 48 hours in milliseconds
    const remainingTime = deadline - new Date().getTime();
    return remainingTime > 0 ? remainingTime : 0; // Ensure no negative time
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = prisoners.filter(
      (prisoner) =>
        prisoner.firstName.toLowerCase().includes(query) ||
        prisoner.lastName.toLowerCase().includes(query) ||
        prisoner.crime.toLowerCase().includes(query)
    );
    setFilteredPrisoners(filtered);
  };

  const handleFilterUrgent = () => {
    const urgentPrisoners = prisoners.filter(
      (prisoner) => prisoner.timeRemaining < 6 * 60 * 60 * 1000 // Less than 6 hours remaining
    );
    setFilteredPrisoners(urgentPrisoners);
  };

  const columns = [
    {
      name: "First Name",
      selector: (row) => row.firstName,
      sortable: true,
    },
    {
      name: "Last Name",
      selector: (row) => row.lastName,
      sortable: true,
    },
    {
      name: "Crime",
      selector: (row) => row.crime,
      sortable: true,
    },
    {
      name: "Intake Date",
      selector: (row) => new Date(row.intakeDate).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "Time Remaining",
      selector: (row) => {
        const hours = Math.floor(row.timeRemaining / (60 * 60 * 1000));
        const minutes = Math.floor((row.timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
        return `${hours}h ${minutes}m`;
      },
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <Link
          to={`/woreda-dashboard/prisoner/${row._id}`}
          className="text-blue-600 hover:underline"
        >
          View Details
        </Link>
      ),
    },
  ];

  return (
    <div className="flex">
      {/* Sidebar Spacing Fix */}
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Responsive Fixed Header */}
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex justify-between items-center transition-all duration-300 ml-2 ${
            isCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          <h3 className="text-2xl font-bold text-gray-800 text-center">Prisoner List</h3>
            {/* Search and Filter Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="relative w-full md:w-64">
  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
  <input
    type="text"
    onChange={handleSearch}
    placeholder="Search by first or middle name"
    className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
  />
</div>

            <button
              onClick={handleFilterUrgent}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Show Urgent Cases
            </button>
          </div>
        </div>

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-40">
        

          {/* DataTable */}
          <div className="mt-6 bg-white p-4 rounded shadow-md overflow-x-auto">
            <DataTable
              columns={columns}
              data={filteredPrisoners}
              pagination
              progressPending={loading}
              progressComponent={<p className="text-center">Loading...</p>}
              highlightOnHover
              striped
              responsive // Enable responsive behavior
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrisonerList;