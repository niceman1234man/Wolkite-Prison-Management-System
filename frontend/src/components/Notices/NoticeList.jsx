import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { useSelector } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";
import { columns as defaultColumns, NoticeButtons } from "../../utils/NoticeHelper";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import UpdateNoticeModal from "../Modals/UpdateNoticeModal";
import ViewNoticeModal from "../Modals/ViewNoticeModal";
import PostNotice from "./Notices";
import AddModal from "../Modals/AddModal";
import ConfirmModal from "../Modals/ConfirmModal";
import UpdateNotice from "./UpdateNotice";
import ViewNotice from "./ViewNotice";
import { toast } from "react-hot-toast";

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

const NoticesList = () => {
  const [add,setAdd]=useState(false);
  const [edit,setEdit]=useState(false);
  const [view,setView]=useState(false);
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [viewNotice, setViewNotice] = useState(null); // For View Modal
  const [showPublished, setShowPublished] = useState(true); // New state to toggle between published/draft
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [noticeToToggle, setNoticeToToggle] = useState(null);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      // Fetch all notices including both published and draft notices
      const response = await axiosInstance.get("/notice/getAllNotices");
      console.log("Fetched notices:", response.data);

      // Check if response has the expected structure
      if (response.data && (
          (Array.isArray(response.data.notices) && response.data.notices.length > 0) || 
          (Array.isArray(response.data.data) && response.data.data.length > 0)
        )) {
        // Use notices array or data array depending on what's available
        let noticesArray = response.data.notices || response.data.data;
        
        // Important: The controller by default filters for isPosted: true, 
        // so we need to make a different API call to get ALL notices for admin
        if (!noticesArray.some(notice => !notice.isPosted)) {
          console.log("No draft notices found in initial response, checking database directly");
          try {
            // Make a direct query to get all notices without filtering by isPosted
            const allResponse = await axiosInstance.get("/notice/getAllNotices?includeDrafts=true");
            if (allResponse.data && (allResponse.data.notices || allResponse.data.data)) {
              noticesArray = allResponse.data.notices || allResponse.data.data;
              console.log("All notices including drafts:", noticesArray);
            }
          } catch (directError) {
            console.error("Error fetching all notices:", directError);
          }
        }
        
        // Filter out any null or invalid notices and ensure required properties exist
        const validNotices = noticesArray.filter(notice => 
          notice && notice.title && typeof notice._id !== 'undefined'
        );
        
        const formattedData = validNotices.map((notice) => {
          // Create a new notice object with the formatted data
          const formattedNotice = {
            ...notice,
            status: (
              <span
                className={`px-2 py-1 rounded-full text-white text-xs font-semibold ${
                  notice.isPosted ? "bg-green-600" : "bg-red-500"
                }`}
              >
                {notice.isPosted ? "Published" : "Draft"}
              </span>
            )
          };
          
          // Add the action buttons
          formattedNotice.action = (
            <div className="flex gap-2 flex-wrap justify-center">
              <button
                onClick={() => setViewNotice(notice)}
                className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg shadow-md transition duration-300"
              >
                View
              </button>
              <button
                onClick={() => setSelectedNotice(notice)}
                className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg shadow-md transition duration-300"
              >
                Edit
              </button>
            </div>
          );
          
          return formattedNotice;
        });

        setNotices(formattedData);
        
        // Filter notices based on published status
        const filtered = showPublished ? 
          formattedData.filter(notice => notice.isPosted) : 
          formattedData.filter(notice => !notice.isPosted);
        
        console.log(`Displaying ${filtered.length} notices (${showPublished ? 'published' : 'draft'})`);
        setFilteredNotices(filtered);
      } else {
        console.error("Unexpected API response format:", response.data);
        // Initialize with empty arrays to prevent errors
        setNotices([]);
        setFilteredNotices([]);
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
      toast.error("Failed to fetch notices");
      // Initialize with empty arrays to prevent errors
      setNotices([]);
      setFilteredNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Triggering fetchNotices from useEffect");
    fetchNotices();
  }, [view, edit, showPublished]);

  const filterNotices = (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = notices.filter((notice) =>
      notice.title.toLowerCase().includes(query) && 
      (showPublished ? notice.isPosted : !notice.isPosted)
    );
    setFilteredNotices(filtered);
  };

  // Modify the columns to include status
  const enhancedColumns = [
    ...defaultColumns.filter(col => col.name !== "Action"),
    {
      name: "Status",
      selector: row => row.status,
      sortable: true,
    },
    {
      name: "Action",
      selector: row => row.action,
    }
  ];

  const handleDeleteNotice = async () => {
    if (!noticeToDelete) {
      console.error("No notice selected for deletion");
      return;
    }
    
    setDeleteLoading(true);
    try {
      console.log(`Attempting to delete notice with ID: ${noticeToDelete}`);
      const noticeToRemove = notices.find(n => n._id === noticeToDelete);
      console.log("Notice data:", noticeToRemove);
      
      const response = await axiosInstance.delete(`/notice/delete-notice/${noticeToDelete}`);
      console.log("Delete API Response:", response.data);
      
      if (response.data && response.data.success) {
        toast.success("Notice deleted successfully");
        fetchNotices();
      } else {
        throw new Error(response.data?.message || "Failed to delete notice");
      }
    } catch (error) {
      console.error("Error deleting notice:", error);
      toast.error(error.response?.data?.message || "Failed to delete notice. Please try again.");
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(false);
      setNoticeToDelete(null);
    }
  };

  // Handle toggling publish status
  const handleTogglePublish = async () => {
    if (!noticeToToggle) {
      console.error("No notice selected for toggling publish status");
      return;
    }
    
    setPublishLoading(true);
    try {
      const noticeToUpdate = notices.find(n => n._id === noticeToToggle);
      const isCurrentlyPublished = noticeToUpdate?.isPosted;
      
      console.log(`Attempting to ${isCurrentlyPublished ? 'unpublish' : 'publish'} notice: ${noticeToToggle}`);
      console.log("Notice data:", noticeToUpdate);
      
      const requestData = { isPosted: !isCurrentlyPublished };
      console.log("Request data:", requestData);
      
      const response = await axiosInstance.put(`/notice/post-notice/${noticeToToggle}`, requestData);
      
      console.log("Publish API Response:", response.data);
      
      if (response.data && response.data.success) {
        toast.success(`Notice ${isCurrentlyPublished ? 'unpublished' : 'published'} successfully`);
        fetchNotices();
      } else {
        throw new Error(response.data?.message || `Failed to ${isCurrentlyPublished ? 'unpublish' : 'publish'} notice`);
      }
    } catch (error) {
      console.error("Error toggling notice status:", error);
      toast.error(error.response?.data?.message || "Failed to update notice status. Please try again.");
    } finally {
      setPublishLoading(false);
      setConfirmPublish(false);
      setNoticeToToggle(null);
    }
  };

  // Add a refreshNotices function to call from other components
  const refreshNotices = () => {
    console.log("Manual refresh triggered");
    fetchNotices();
  };

  return (
    <div className="w-full flex">
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />
      <div className="flex-1 relative min-h-screen">
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex flex-wrap items-center justify-between transition-all duration-300 ml-2 gap-2 ${
            isCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          <button
            className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition duration-300"
            onClick={() => window.history.back()}
          >
            <FaArrowLeft className="mr-2 text-lg" /> Back
          </button>
          <div className="flex-1" />
          <div className="relative flex items-center w-60 md:w-1/3">
            <FaSearch className="absolute left-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search by title"
              className="h-10 px-4 py-2 border border-gray-300 rounded-md w-full pl-10"
              onChange={filterNotices}
            />
          </div>
          
          {/* Toggle Published/Draft */}
          <div className="flex items-center">
            <button
              onClick={() => setShowPublished(true)}
              className={`mr-2 px-4 py-2 rounded-l-md ${
                showPublished ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setShowPublished(false)}
              className={`px-4 py-2 rounded-r-md ${
                !showPublished ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              Drafts
            </button>
          </div>
          
          <button
            onClick={()=>setAdd(true)}
            className="h-10 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center justify-center min-w-[150px] md:w-auto"
          >
            Add New Notice
          </button>
          <AddModal open={add} setOpen={setAdd}>
            <PostNotice setOpen={setAdd} />
          </AddModal>
        </div>

        <div className="p-6 mt-32">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {showPublished ? "Published Notices" : "Draft Notices"}
          </h2>
          {loading ? (
            <div className="text-center text-gray-600">Loading Notices...</div>
          ) : filteredNotices.length === 0 ? (
            <div className="text-center text-gray-600 p-4 bg-gray-100 rounded-lg">
              No {showPublished ? "published" : "draft"} notices found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DataTable
                columns={enhancedColumns}
                data={filteredNotices}
                pagination
                className="shadow-lg rounded-lg overflow-hidden"
                customStyles={customStyles}
              />
            </div>
          )}
        </div>
      </div>

      {/* Update Notice Modal */}
      {selectedNotice && (
        <UpdateNoticeModal
          open={true}
          setOpen={() => setSelectedNotice(null)}
          notice={selectedNotice}
          setNotice={(updatedNotice) => {
            setNotices((prev) =>
              prev.map((n) => (n._id === updatedNotice._id ? updatedNotice : n))
            );
            setSelectedNotice(null);
          }}
        />
      )}

      {/* View Notice Modal */}
      {viewNotice && (
        <ViewNoticeModal
          open={true}
          setOpen={() => setViewNotice(null)}
          notice={viewNotice}
          onReload={refreshNotices}
        />
      )}

      {/* Add the confirmation modal for delete */}
      {confirmDelete && (
        <ConfirmModal
          message="Are you sure you want to delete this notice? This action cannot be undone."
          onConfirm={handleDeleteNotice}
          onCancel={() => {
            setConfirmDelete(false);
            setNoticeToDelete(null);
          }}
        />
      )}

      {/* Add the confirmation modal for publish/unpublish */}
      {confirmPublish && (
        <ConfirmModal
          message={
            notices.find(n => n._id === noticeToToggle)?.isPosted
              ? "Are you sure you want to unpublish this notice?"
              : "Are you sure you want to publish this notice?"
          }
          onConfirm={handleTogglePublish}
          onCancel={() => {
            setConfirmPublish(false);
            setNoticeToToggle(null);
          }}
        />
      )}
    </div>
  );
};

export default NoticesList;