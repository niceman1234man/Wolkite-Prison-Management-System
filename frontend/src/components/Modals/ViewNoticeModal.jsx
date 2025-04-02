import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";
import ConfirmModal from "./ConfirmModal";

const ViewNoticeModal = ({ open, setOpen, notice, onReload }) => {
  const [showMore, setShowMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  useEffect(() => {
    if (notice) {
      console.log("ViewNoticeModal received notice:", notice);
    }
  }, [notice]);

  if (!open || !notice) return null;

  const togglePostStatus = async () => {
    setLoading(true);
    try {
      // Debug log
      console.log(`Attempting to change notice status to: ${!notice.isPosted}`);
      console.log("Notice data:", notice);
      
      const response = await axiosInstance.put(`/notice/post-notice/${notice._id}`, {
        isPosted: !notice.isPosted
      });
      
      console.log("API Response:", response.data);
      
      if (response.data && response.data.success) {
        toast.success(`Notice ${notice.isPosted ? 'unpublished' : 'published'} successfully`);
        if (typeof onReload === 'function') {
          console.log("Calling reload function");
          onReload();
        } else {
          console.warn("onReload function not provided to ViewNoticeModal");
        }
        setOpen(false);
      } else {
        throw new Error(response.data?.message || `Failed to ${notice.isPosted ? 'unpublish' : 'publish'} notice`);
      }
    } catch (error) {
      console.error("Error toggling notice status:", error);
      toast.error(error.response?.data?.message || `Failed to ${notice.isPosted ? 'unpublish' : 'publish'} notice. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotice = async () => {
    setLoading(true);
    try {
      console.log(`Attempting to delete notice with ID: ${notice._id}`);
      console.log("Notice data:", notice);
      
      const response = await axiosInstance.delete(`/notice/delete-notice/${notice._id}`);
      
      console.log("Delete API Response:", response.data);
      
      if (response.data && response.data.success) {
        toast.success("Notice deleted successfully");
        if (typeof onReload === 'function') {
          console.log("Calling reload function after delete");
          onReload();
        } else {
          console.warn("onReload function not provided to ViewNoticeModal for delete");
        }
        setOpen(false);
      } else {
        throw new Error(response.data?.message || "Failed to delete notice");
      }
    } catch (error) {
      console.error("Error deleting notice:", error);
      toast.error(error.response?.data?.message || "Error deleting the notice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAction = () => {
    console.log("Toggle Publish button clicked in ViewNoticeModal");
    setConfirmMessage(`Are you sure you want to ${notice.isPosted ? 'unpublish' : 'publish'} this notice?`);
    setConfirmAction(() => togglePostStatus);
    setShowConfirm(true);
  };

  const handleDeleteAction = () => {
    console.log("Delete button clicked in ViewNoticeModal");
    setConfirmMessage("Are you sure you want to delete this notice? This action cannot be undone.");
    setConfirmAction(() => deleteNotice);
    setShowConfirm(true);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto relative border border-gray-200">
        {/* Close Button - Now just closes modal */}
        <button
          className="absolute top-4 right-4 bg-gray-200 hover:bg-red-500 hover:text-white text-gray-600 rounded-full p-2 transition duration-300 shadow-md"
          onClick={() => setOpen(false)} 
        >
          <FaTimes size={18} />
        </button>

        <h3 className="text-3xl font-extrabold text-gray-800 text-center mb-4">📢 Notice Details</h3>

        <div className="space-y-5">
          <div>
            <p className="font-semibold text-lg text-gray-700">📌 Title:</p>
            <p className="text-gray-900 text-xl font-medium">{notice?.title || "N/A"}</p>
          </div>

          <div>
            <p className="font-semibold text-lg text-gray-700">📝 Description:</p>
            <p className="text-gray-700 leading-relaxed">
              {showMore || (notice?.description?.length ?? 0) < 100
                ? notice.description
                : `${notice.description.substring(0, 100)}...`}
            </p>
            {notice?.description?.length > 100 && (
              <button
                className="text-blue-600 hover:underline text-sm mt-1 transition duration-200"
                onClick={() => setShowMore(!showMore)}
              >
                {showMore ? "Show Less" : "Load More"}
              </button>
            )}
          </div>

          <div>
            <p className="font-semibold text-lg text-gray-700">📅 Date:</p>
            <p className="text-gray-800">{notice?.date ? new Date(notice.date).toLocaleString() : "N/A"}</p>
          </div>

          <div>
            <p className="font-semibold text-lg text-gray-700">⚡ Priority:</p>
            <span
              className={`px-2 py-1 rounded-md text-white ${
                notice?.priority === "Urgent"
                  ? "bg-red-600"
                  : notice?.priority === "High"
                  ? "bg-orange-500"
                  : notice?.priority === "Normal"
                  ? "bg-blue-500"
                  : "bg-gray-400"
              }`}
            >
              {notice?.priority || "N/A"}
            </span>
          </div>

          <div>
            <p className="font-semibold text-lg text-gray-700">👥 Roles:</p>
            <p className="text-gray-800">{notice?.roles?.join(", ") || "N/A"}</p>
          </div>

          <div>
            <p className="font-semibold text-lg text-gray-700">👁️ Read By:</p>
            {notice?.readBy?.length > 0 ? (
              <ul className="text-gray-800 list-disc list-inside">
                {notice.readBy.map((user, index) => (
                  <li key={index}>{typeof user === 'object' ? user.name : user}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No one has read this notice yet.</p>
            )}
          </div>

          <div>
            <p className="font-semibold text-lg text-gray-700">📌 Status:</p>
            <span
              className={`inline-block px-4 py-1 rounded-full text-white font-semibold ${
                notice?.isPosted ? "bg-green-600" : "bg-red-500"
              }`}
            >
              {notice?.isPosted ? "Published" : "Draft"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mt-6">
          <button
            className={`w-1/2 py-2 px-3 rounded font-medium transition duration-300 ${
              notice?.isPosted
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
            onClick={() => {
              console.log("Publish/Unpublish button clicked");
              handleToggleAction();
            }}
            disabled={loading}
          >
            {loading ? "Processing..." : notice?.isPosted ? "Unpublish" : "Publish"}
          </button>

          <button
            className="w-1/2 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded font-medium transition duration-300 disabled:bg-gray-400"
            onClick={() => {
              console.log("Delete button clicked");
              handleDeleteAction();
            }}
            disabled={loading}
          >
            {loading ? "Processing..." : "Delete"}
          </button>
        </div>
        
        {showConfirm && (
          <ConfirmModal 
            message={confirmMessage}
            onConfirm={() => {
              console.log("Confirm action in modal");
              if (confirmAction) {
                confirmAction();
              }
              setShowConfirm(false);
            }}
            onCancel={() => {
              console.log("Cancel action in modal");
              setShowConfirm(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ViewNoticeModal;
