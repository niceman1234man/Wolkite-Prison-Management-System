import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaArrowLeft } from "react-icons/fa"; // Back Icon
import { toast } from "react-toastify";
import axiosInstance from "../../utils/axiosInstance";
import "react-toastify/dist/ReactToastify.css";

const ViewNotice = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const response = await axiosInstance.get(`/notice/get-notice/${id}`);
        setNotice(response.data.notice);
      } catch (error) {
        toast.error(error.response?.data?.error || "Error fetching notice details");
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();
  }, [id]);

  const deleteNotice = async () => {
    if (window.confirm("Are you sure you want to delete this notice?")) {
      try {
        await axiosInstance.delete(`/notice/delete-notice/${id}`);
        toast.success("Notice deleted successfully!");
        navigate("/Inspector-dashboard/notices");
      } catch (error) {
        toast.error(error.response?.data?.error || "Error deleting notice");
      }
    }
  };

  const toggleActivation = async () => {
    if (window.confirm(`Do you want to ${notice.isPosted ? "Remove Post" : "Post"} this Notice?`)) {
      try {
        await axiosInstance.put(`/notice/post-notice/${id}`, { isPosted: !notice.isPosted });
        setNotice((prevNotice) => ({ ...prevNotice, isPosted: !prevNotice.isPosted }));
        toast.success(`Notice ${notice.isPosted ? "Post Removed" : "Posted"} successfully!`);
      } catch (error) {
        toast.error(error.response?.data?.error || "Error updating notice status");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-lg font-semibold animate-pulse">Loading Notice details...</p>
      </div>
    );
  }

  return (
    <div className="flex">
      {/* Sidebar Spacing */}
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />

      {/* Main Content */}
      <div className="flex-1 relative min-h-screen">
        
        {/* Fixed Header */}
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex items-center justify-between transition-all duration-300 ml-2 ${
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

          {/* Centered Header */}
          <h3 className="text-2xl font-bold text-gray-800 text-center flex-1">
            Notice Details
          </h3>

          {/* Placeholder for balance */}
          <div className="w-24" />
        </div>

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-32 flex justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
            {notice && (
              <>
                <div className="space-y-4">
                  <p className="font-bold text-lg">Title:</p>
                  <p className="text-gray-700">{notice.title}</p>

                  <p className="font-bold text-lg">Description:</p>
                  <p className="text-gray-700">{notice.description}</p>

                  <p className="font-bold text-lg">Date:</p>
                  <p className="text-gray-700">{new Date(notice.date).toLocaleString()}</p>

                  <p className="font-bold text-lg">Priority:</p>
                  <p className="text-gray-700">{notice.priority}</p>

                  <p className="font-bold text-lg">Status:</p>
                  <p className={`text-white px-3 py-1 rounded ${notice.isPosted ? "bg-green-500" : "bg-red-500"}`}>
                    {notice.isPosted ? "Posted" : "Not Posted"}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex space-x-4 mt-6">
                  <button
                    className={`w-1/2 py-2 px-3 rounded ${
                      notice.isPosted ? "bg-red-400 hover:bg-red-500" : "bg-green-600 hover:bg-green-700"
                    } text-white transition`}
                    onClick={toggleActivation}
                  >
                    {notice.isPosted ? "Remove Post" : "Post"}
                  </button>

                  <button
                    className="w-1/2 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded transition"
                    onClick={deleteNotice}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewNotice;
