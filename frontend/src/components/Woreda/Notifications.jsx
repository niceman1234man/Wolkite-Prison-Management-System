import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux"; // Import useSelector for sidebar state

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get sidebar state from Redux
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/notifications/getall-notifications", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data?.notifications?.length > 0) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to fetch notifications.");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await axiosInstance.delete(`/notifications/dismiss-notification/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setNotifications((prev) => prev.filter((notification) => notification._id !== id));
      toast.success("Notification dismissed successfully.");
    } catch (error) {
      console.error("Error dismissing notification:", error);
      toast.error("Failed to dismiss notification.");
    }
  };

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
          <h3 className="text-2xl font-bold text-gray-800 text-center">Notifications</h3>
        </div>

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-24">
          {loading ? (
            <p className="text-center">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="text-center text-gray-600">No new notifications.</p>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="p-4 bg-white rounded-lg shadow-md flex justify-between items-center hover:shadow-lg transition-shadow"
                >
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{notification.title}</h3>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDismiss(notification._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;