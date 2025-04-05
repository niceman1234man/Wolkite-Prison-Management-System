import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FaShieldAlt, FaExclamationTriangle, FaUsers } from "react-icons/fa";
import SummaryCard from "./Summary.jsx";
import NoticeWidget from "../Notices/NoticeWidget";
import axiosInstance from "../../utils/axiosInstance";

const SecurityStaffSummary = () => {
  const [summaryData, setSummaryData] = useState({
    totalInmates: 0,
    paroleRequests: 0,
    guiltyInmates: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch inmates data
        const inmatesResponse = await axiosInstance.get("/inmates/allInmates");
        const inmates = inmatesResponse.data.inmates || [];
        const totalInmates = inmates.length;

        // Fetch parole records to count requests
        const paroleResponse = await axiosInstance.get("/parole-tracking");
        const paroleRecords = paroleResponse.data.parole || [];
        
        // Count parole requests (those with isRequested=true)
        const paroleRequests = paroleRecords.filter(
          record => record.request && record.request.isRequested
        ).length;

        // Count guilty inmates (simplified as those with specific crimes or indicators)
        const guiltyInmates = inmates.filter(
          inmate => inmate.crime && !inmate.crime.toLowerCase().includes("pending")
        ).length;

        setSummaryData({
          totalInmates,
          paroleRequests,
          guiltyInmates
        });
      } catch (err) {
        console.error("Error fetching security dashboard data:", err);
        setError("Failed to load dashboard data");
        
        // Fallback to dummy data for development
        setSummaryData({
          totalInmates: 120,
          paroleRequests: 85,
          guiltyInmates: 50
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="flex">
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />
      <div className="flex-1 relative">
        {/* Header Section */}
        <div className={`bg-white shadow-md p-4 fixed top-14 z-20 flex justify-between items-center transition-all duration-300 ml-2 ${isCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"}`}>
          <h3 className="text-2xl font-bold text-gray-800 text-center">Security Staff Dashboard Overview</h3>
        </div>

        <div className="p-6 mt-24">
          {/* Notice Widget */}
          <div className="mb-6">
            <NoticeWidget 
              maxNotices={3}
              variant="card"
              dashboardType="security"
              showMarkAsRead={true}
              showViewAll={true}
              hideWhenUnauthenticated={true}
            />
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64 text-gray-600">
              <span className="animate-pulse">Loading dashboard data...</span>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-red-500">
              <div className="flex flex-col items-center">
                <span>{error}</span>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <SummaryCard 
                icon={<FaShieldAlt size={28} />} 
                text="Total Inmates" 
                number={summaryData.totalInmates} 
                color="bg-blue-700" 
              />
              <SummaryCard 
                icon={<FaExclamationTriangle size={28} />} 
                text="Parole Requests" 
                number={summaryData.paroleRequests} 
                color="bg-orange-600" 
              />
              <SummaryCard 
                icon={<FaUsers size={28} />} 
                text="Guilty Inmates" 
                number={summaryData.guiltyInmates} 
                color="bg-green-700" 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityStaffSummary;
