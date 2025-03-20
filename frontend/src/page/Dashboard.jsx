import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { Link } from "react-router-dom";
import { FaUsers, FaExchangeAlt, FaExclamationCircle } from "react-icons/fa";
import { useSelector } from "react-redux"; // Import useSelector for sidebar state

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalPrisoners: 0,
    pendingTransfers: 0,
    urgentCases: 0,
  });
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // Track mobile view

  // Get sidebar state from Redux
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

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
    setLoading(true);
    try {
      const response = await axiosInstance.get("/dashboard/data", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-6">Loading dashboard data...</div>; // Show loading state
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
    </div>
  );
};

export default Dashboard;