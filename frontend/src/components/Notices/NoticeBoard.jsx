import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNotices = async () => {
      try {     
        const response = await axiosInstance.get("/notice/getAllNotices", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        
        // Check if response has the expected structure
        if (response.data && (
          (Array.isArray(response.data.notices) && response.data.notices.length > 0) || 
          (Array.isArray(response.data.data) && response.data.data.length > 0)
        )) {
          // Use notices array or data array depending on what's available
          const noticesArray = response.data.notices || response.data.data;
          
          // Filter out any null or invalid notices
          const validNotices = noticesArray.filter(notice => 
            notice && typeof notice._id !== 'undefined'
          );
          
          setNotices(validNotices);
          setError("");
        } else {
          console.error("Unexpected API response format:", response.data);
          setNotices([]);
          setError("No notices available. Please check back later.");
        }
      } catch (error) {
        console.error("Error fetching notices:", error);
        setNotices([]);
        setError("Failed to fetch notices. Please try again later.");
      }
    };

    fetchNotices();
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold mb-6 text-center">📢 Notice Board</h2>

      {error && <p className="text-red-500 text-center">{error}</p>}

      {notices.length === 0 && !error ? (
        <p className="text-center text-gray-500">No notices available</p>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <div
              key={notice._id}
              className={`p-4 rounded-md shadow ${
                notice.priority === "High" ? "bg-red-200 border-l-4 border-red-600" : "bg-gray-100"
              }`}
            >
              <h3 className="text-lg font-bold">{notice.title || "Untitled Notice"}</h3>
              <p className="text-sm text-gray-600">{notice.description || "No description provided"}</p>
              <p className="text-xs text-gray-500">
                🕒 Date: {new Date(notice.date || notice.createdAt || Date.now()).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500">🎯 Priority: {notice.priority || "Normal"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;
