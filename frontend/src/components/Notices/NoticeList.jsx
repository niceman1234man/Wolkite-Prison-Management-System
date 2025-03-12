import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import axiosInstance from "../../utils/axiosInstance";
import { columns,NoticeButtons } from "../../utils/NoticeHelper";

// Define columns for the notice table

const NoticesList = () => {
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [loading, setLoading] = useState(false);

const fetchNotices = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/notice/getAllNotices");

      if (response.data) {
        // Format notices with buttons for actions
        const formattedData = response.data.notices.map((notice) => ({
          _id: notice._id,
          title: notice.title || "N/A",
          description: notice.description  ||"N/A",
          roles: notice.roles?.join(", ") || "N/A", // Convert roles array to string
          date: new Date(notice.date).toLocaleDateString(), // Format date
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

  useEffect(() => {
    fetchNotices();
  }, []);

  // Search filter for notices
  const filterNotices = (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = notices.filter((notice) =>
      notice.title.toLowerCase().includes(query)
    );
    setFilteredNotices(filtered);
  };

  return (
    <div className="p-5 mt-12">
      <h3 className="text-2xl font-bold text-center mb-5">Manage Notices</h3>

      {/* Search & Add Notice Button */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by notice title"
          className="px-4 py-2 border border-gray-300 rounded-md w-1/3"
          onChange={filterNotices}
        />
        <Link
          to="/inspector-dashboard/add-notice"
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md"
        >
          Add New Notice
        </Link>
      </div>

      {/* Notices List Table */}
      {loading ? (
        <div className="text-center text-gray-600">Loading notices...</div>
      ) : (
        <DataTable columns={columns} data={filteredNotices} pagination />
      )}
    </div>
  );
};

export default NoticesList;