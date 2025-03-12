import axiosInstance from "../../utils/axiosInstance";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TiArrowBack } from "react-icons/ti";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ViewNotice = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get(`/notice/get-notice/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setNotice(response.data.notice);
      } catch (error) {
        toast.error(error.response?.data?.error || "Error fetching notice details");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const deleteUser = async () => {
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
        toast.success(`Notice ${notice.isPosted ? " Post Removed" : "Posted"} successfully!`);
      } catch (error) {
        console.error("API Error:", error.response?.data); 
        toast.error(error.response?.data?.error || "Error post notice");
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
    <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-md shadow-md">
      <TiArrowBack size={50} onClick={() => navigate(-1)} className="cursor-pointer" />
      <h2 className="text-2xl font-bold mb-8 text-center">Notice Details</h2>

      {notice && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-lg font-bold">Title: <span className="font-medium">{notice.title}</span></p>
              <p className="text-lg font-bold">Date: <span className="font-medium">{new Date(notice.date).toLocaleString()}</span></p>
              <p className="text-lg font-bold">Description: <span className="font-medium">{notice.description}</span></p>
              <p className="text-lg font-bold">Priority: <span className="font-medium">{notice.priority}</span></p>
              <p className="text-lg font-bold">Role: <span className="font-medium">{notice.roles.map((role)=><span>{role},</span>)}</span></p>
              <p className="text-lg font-bold">Status: <span className="font-medium">{notice.isPosted?"Posted":"Not Posted"}</span></p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-6">
            <button
              className={`py-2 px-3 rounded font-semibold w-1/2 ${notice.isPosted ? "bg-red-400" : "bg-green-600"} text-white`}
              onClick={toggleActivation}
            >
              {notice.isPosted ? "Remove Post" : "Post"}
            </button>
            <button className="bg-red-600 text-white py-2 px-3 rounded font-semibold w-1/2" onClick={deleteUser}>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ViewNotice;
