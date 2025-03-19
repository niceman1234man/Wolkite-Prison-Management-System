import React, { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaFileAlt,
  FaHourglassHalf,
  FaRegTimesCircle,
  FaUsers,
  FaMapMarkedAlt,
  FaGlobeAfrica,
  FaUserShield,
  FaUserTie,
} from "react-icons/fa";
import SummaryCard from "./SummaryCard.jsx";
import { useSelector } from "react-redux";
import axiosInstance from "../../utils/axiosInstance"; // Import axiosInstance
import NoticeButton from "../../utils/noticeButtons.jsx"; // 🛠️ Import reusable notice button
import NoticeModal from "../modals/noticeModal.jsx"; // 🛠️ Import notice modal
import useNotices from "../../hooks/useNotice.jsx"; // 🛠️ Import the custom notice hook

const AdminSummary = () => {
  const [notice, setNotice] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // Track mobile view

  // Use optional chaining and provide a fallback (empty array) for `users`
  const users = useSelector((state) => state.users?.users || []);
  const police = users.filter((user) => user.role === "police-officer");
  const activeUsers = users.filter((user) => user.isactivated === true);
  const deactivatedUsers = users.filter((user) => user.isactivated === false); // Fix spelling

  // Get sidebar state from Redux
  const isSidebarCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  // 🛠️ Use the custom hook to fetch and manage notices
  const { notices, isModalOpen, setIsModalOpen, markNoticeAsRead } = useNotices();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch notices
        const noticeResponse = await axiosInstance.get("/notice/getAllNotices");
        if (noticeResponse.data) {
          setNotice(noticeResponse.data.notices);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false); // Set loading to false after data is fetched
      }
    };

    fetchData();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Show loading state
  }

  return (
    <div className="flex">
      {/* Sidebar Spacing Fix */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? "w-16" : "w-64"}`} />

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Responsive Fixed Header */}
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex justify-between items-center transition-all duration-300 ml-2 ${
            isSidebarCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          <h3 className="text-2xl font-bold text-gray-800 text-center">
            Admin Dashboard Overview
          </h3>

          {/* 🛠️ Reusable Notice Button */}
          <NoticeButton notices={notices} onClick={() => setIsModalOpen(true)} />
        </div>

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-24">
        {/* Dashboard Overview */}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            <SummaryCard
              icon={<FaUsers />}
              text="Total Users"
              number={users.length} // Safe to use `length` now
              color="bg-teal-600"
            />
            <SummaryCard
              icon={<FaMapMarkedAlt />}
              text="Total Zone Accounts"
              number={40} // Replace with dynamic value if available
              color="bg-yellow-600"
            />
            <SummaryCard
              icon={<FaGlobeAfrica />}
              text="Total Woreda Accounts"
              number={100} // Replace with dynamic value if available
              color="bg-blue-600"
            />
            <SummaryCard
              icon={<FaUserShield />}
              text="Total Zone Police Officers"
              number={police.length} // Safe to use `length` now
              color="bg-purple-600"
            />
            <SummaryCard
              icon={<FaUserTie />}
              text="Total Woreda Police Officers"
              number={100} // Replace with dynamic value if available
              color="bg-indigo-600"
            />
          </div>

          {/* Account Details */}
          <div className="mt-12">
            <h4 className="text-center text-2xl font-bold">Account Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <SummaryCard
                icon={<FaFileAlt />}
                text="Active Accounts"
                number={activeUsers.length} // Safe to use `length` now
                color="bg-teal-600"
              />
              <SummaryCard
                icon={<FaCheckCircle />}
                text="Blocked Accounts"
                number={20} // Replace with dynamic value if available
                color="bg-green-600"
              />
              <SummaryCard
                icon={<FaHourglassHalf />}
                text="Restricted Accounts"
                number={deactivatedUsers.length} // Safe to use `length` now
                color="bg-yellow-600"
              />
              <SummaryCard
                icon={<FaRegTimesCircle />}
                text="Deleted Accounts"
                number={30} // Replace with dynamic value if available
                color="bg-red-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 🛠️ Reusable Notice Modal */}
      <NoticeModal
        notices={notices}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectNotice={markNoticeAsRead}
        selectedNotice={null}
      />
    </div>
  );
};

export default AdminSummary;