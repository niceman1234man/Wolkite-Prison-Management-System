import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { useSelector } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";
import { columns, NoticeButtons } from "../../utils/NoticeHelper";
import { FaArrowLeft, FaSearch } from "react-icons/fa"; // Back and Search Icons

const customStyles = {
  headCells: {
    style: {
      backgroundColor: "#D2B48C", // Light Brown (Tan)
      color: "#5A3E1B", // Dark Brown text for contrast
      fontWeight: "bold",
      fontSize: "14px",
      textTransform: "uppercase",
    },
  },
  rows: {
    style: {
      "&:hover": {
        backgroundColor: "#F5DEB3", // Lighter shade of tan on hover (Wheat)
        cursor: "pointer",
        transition: "background-color 0.2s ease-in-out",
      },
    },
  },
};

const NoticesList = () => {
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/notice/getAllNotices");

        if (response.data) {
          const formattedData = response.data.notices.map((notice) => ({
            _id: notice._id,
            title: notice.title || "N/A",
            description: notice.description || "N/A",
            roles: notice.roles?.join(", ") || "N/A",
            date: new Date(notice.date).toLocaleDateString(),
            priority: notice.priority || "Normal",
            action: <NoticeButtons _id={notice._id} onDelete={fetchNotices} />,
          }));

          setNotices(formattedData);
          setFilteredNotices(formattedData);
        }
      } catch (error) {
        console.error("Error fetching notices:", error);
        alert("Failed to fetch notices.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const filterNotices = (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = notices.filter((notice) =>
      notice.title.toLowerCase().includes(query)
    );
    setFilteredNotices(filtered);
  };

  return (
    <div className="flex">
      {/* Sidebar Spacing Fix */}
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />

      {/* Main Content */}
      <div className="flex-1 relative min-h-screen">
        {/* Fixed Header */}
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex flex-wrap items-center justify-between transition-all duration-300 ml-2 gap-2 ${
            isCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          {/* Back Button */}
          <button
            className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition duration-300"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="mr-2 text-lg" /> Back
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search Input */}
          <div className="relative flex items-center w-60 md:w-1/3">
            <FaSearch className="absolute left-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search by title"
              className="h-10 px-4 py-2 border border-gray-300 rounded-md w-full pl-10"
              onChange={filterNotices}
            />
          </div>

          {/* Add Notice Button */}
          <Link
            to="/inspector-dashboard/add-notice"
            className="h-10 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center justify-center min-w-[150px] md:w-auto"
          >
            Add New Notice
          </Link>
        </div>

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-32">
          {/* Notices List Table */}
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Notice List</h2>
          {loading ? (
            <div className="text-center text-gray-600">Loading Notices...</div>
          ) : (
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={filteredNotices}
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

export default NoticesList;
