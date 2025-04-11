import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { Link } from "react-router-dom";
import { FaUsers, FaExchangeAlt, FaExclamationCircle } from "react-icons/fa";
import { useSelector } from "react-redux"; // Import useSelector for sidebar state
import useNotices from "../hooks/useNotice.jsx";  
import NoticeButton from "../utils/noticeButtons.jsx"; // 🛠️ Import reusable notice button
import NoticeModal from "../components/Modals/NoticeModal.jsx"; // 🛠️ Import notice modal
import { toast } from "react-toastify";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalPrisoners: 0,
    pendingTransfers: 0,
    urgentCases: 0,
    recentTransfers: [],
    recentIncidents: [],
  });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // Track mobile view

  // Get sidebar state from Redux
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  // 🛠️ Use the custom hook to fetch and manage notices
  const { notices, isModalOpen, setIsModalOpen, markNoticeAsRead } = useNotices();

  useEffect(() => {
    fetchDashboardData();

    // Handle window resize for responsiveness
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // First try to fetch standard dashboard data
      const response = await axiosInstance.get("/dashboard/data");
      let updatedData = response.data?.data || {
        totalPrisoners: 0,
        pendingTransfers: 0,
        urgentCases: 0,
        recentTransfers: [],
        recentIncidents: [],
      };
      
      // Now fetch transfer data similar to SecurityStaffReport component
      try {
        const transferResponse = await axiosInstance.get("/transfer/getall-transfers");
        if (transferResponse.data?.data) {
          const processedTransfers = transferResponse.data.data.map(transfer => ({
            ...transfer,
            transferDate: transfer.transferDate ? new Date(transfer.transferDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            createdAt: transfer.createdAt ? new Date(transfer.createdAt).toISOString().split('T')[0] : null,
            status: transfer.status?.toLowerCase() || 'pending'
          }));
          
          // Update dashboard data with transfer stats
          updatedData.pendingTransfers = processedTransfers.filter(t => t?.status?.toLowerCase() === 'pending').length;
          updatedData.recentTransfers = processedTransfers.slice(0, 5);
        }
      } catch (transferError) {
        console.error("Error fetching transfer data:", transferError);
      }
      
      // Set final dashboard data
      setDashboardData(updatedData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error(error.response?.data?.error || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
          <h3 className="text-2xl font-bold text-gray-800 text-center">Dashboard Overview</h3>

          {/* 🛠️ Reusable Notice Button */}
          <NoticeButton notices={notices} onClick={() => setIsModalOpen(true)} />
        </div>

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-32">
          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Prisoners Card */}
            <div className="p-6 bg-white rounded-lg shadow-md flex items-center space-x-4 hover:shadow-lg transition-shadow">
              <div className="p-4 bg-blue-100 rounded-full">
                <FaUsers className="text-3xl text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Total Prisoners</h3>
                <p className="text-2xl font-bold">{dashboardData.totalPrisoners}</p>
              </div>
            </div>

            {/* Pending Transfers Card */}
            <div className="p-6 bg-white rounded-lg shadow-md flex items-center space-x-4 hover:shadow-lg transition-shadow">
              <div className="p-4 bg-green-100 rounded-full">
                <FaExchangeAlt className="text-3xl text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Pending Transfers</h3>
                <p className="text-2xl font-bold">{dashboardData.pendingTransfers}</p>
              </div>
            </div>

            {/* Urgent Cases Card */}
            <div className="p-6 bg-white rounded-lg shadow-md flex items-center space-x-4 hover:shadow-lg transition-shadow">
              <div className="p-4 bg-red-100 rounded-full">
                <FaExclamationCircle className="text-3xl text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Urgent Cases</h3>
                <p className="text-2xl font-bold">{dashboardData.urgentCases}</p>
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Transfers */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Transfers</h3>
              <div className="space-y-4">
                {dashboardData.recentTransfers.map((transfer, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {transfer.fromPrison} → {transfer.toPrison}
                        </p>
                        <p className="text-sm text-gray-600">
                          Status: <span className="font-medium">{transfer.status}</span>
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(transfer.transferDate || transfer.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Incidents */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Incidents</h3>
              <div className="space-y-4">
                {dashboardData.recentIncidents.map((incident, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{incident.title}</p>
                        <p className="text-sm text-gray-600">
                          Priority: <span className="font-medium">{incident.priority}</span>
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(incident.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/woreda-dashboard/prisoners"
              className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">Manage Prisoners</h3>
              <p className="text-gray-600">View and manage all prisoners in the system.</p>
            </Link>
            <Link
              to="/woreda-dashboard/transfers"
              className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">Manage Transfers</h3>
              <p className="text-gray-600">View and manage all transfer requests.</p>
            </Link>
            <Link
              to="/woreda-dashboard/reports"
              className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">View Reports</h3>
              <p className="text-gray-600">Generate and view system reports.</p>
            </Link>
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

export default Dashboard;