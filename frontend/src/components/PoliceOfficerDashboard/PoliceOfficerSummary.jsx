import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FaShieldAlt, FaExclamationTriangle, FaUsers } from "react-icons/fa";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import NoticeWidget from "../Notices/NoticeWidget";
import SummaryCard from "./Summary.jsx";
import axiosInstance from "../../utils/axiosInstance";

const COLORS = {
  pending: "#F59E0B", // Orange
  resolved: "#10B981", // Green
  escalated: "#EF4444", // Red
  underInvestigation: "#14B8A6", // Teal
};

const PoliceOfficerSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch incidents data - use correct route from backend/index.js
        const incidentsResponse = await axiosInstance.get("/incidents/allIncidents");
        const incidents = incidentsResponse.data.incidents || [];

        // Fetch officers count (using user API with role filter)
        const usersResponse = await axiosInstance.get("/user/getAlluser");
        const users = usersResponse.data.users || [];
        const officers = users.filter(user => user.role === "police-officer").length;

        // Process incidents data to get status counts
        const pendingCases = incidents.filter(incident => incident.status === "Pending" || incident.status === "pending").length;
        const resolvedCases = incidents.filter(incident => incident.status === "Resolved" || incident.status === "resolved").length;
        const escalatedCases = incidents.filter(incident => incident.status === "Escalated" || incident.status === "escalated").length;
        const underInvestigationCases = incidents.filter(incident => 
          incident.status === "Under Investigation" || incident.status === "under investigation").length;

        // Calculate total cases
        const totalCases = incidents.length;

        // Create summary object
        const dashboardData = {
          totalCases,
          totalIncidents: incidents.length,
          totalOfficers: officers,
          caseSummary: {
            pending: pendingCases,
            resolved: resolvedCases,
            escalated: escalatedCases,
            underInvestigation: underInvestigationCases,
          },
        };

        setSummary(dashboardData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
        
        // Fallback to dummy data for development/demo purposes
        const dummyData = {
          totalCases: 120,
          totalIncidents: 85,
          totalOfficers: 50,
          caseSummary: {
            pending: 30,
            resolved: 70,
            escalated: 10,
            underInvestigation: 10,
          },
        };
        setSummary(dummyData);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-600">
        <span className="animate-pulse">Loading data...</span>
      </div>
    );
  }

  if (error && !summary) {
    return (
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
    );
  }

  if (!summary) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-600">
        <span>No data available</span>
      </div>
    );
  }

  const chartData = [
    { name: "Pending", value: summary.caseSummary.pending || 0, color: COLORS.pending },
    { name: "Resolved", value: summary.caseSummary.resolved || 0, color: COLORS.resolved },
    { name: "Escalated", value: summary.caseSummary.escalated || 0, color: COLORS.escalated },
    { name: "Under Investigation", value: summary.caseSummary.underInvestigation || 0, color: COLORS.underInvestigation },
  ];

  // Background style with police-related image
  const backgroundStyle = {
    backgroundImage: "url('https://images.unsplash.com/photo-1596394723269-b2cbca4e6463?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    position: "relative",
  };

  // Content overlay style for better readability
  const overlayStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: "0.5rem",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  };

  return (
    <div className="flex">
      {/* Sidebar Spacing Fix */}
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />

      {/* Main Content with Background */}
      <div className="flex-1 relative" style={backgroundStyle}>
        {/* Semi-transparent overlay for entire content area */}
        <div className="absolute inset-0 bg-white bg-opacity-20"></div>
        
        {/* Fixed Header */}
        <div
          className={`bg-white bg-opacity-90 shadow-md p-4 fixed top-12 z-20 flex justify-between items-center transition-all duration-300 ml-2 ${isCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"}`}
          style={{ zIndex: 20 }}
        >
          <h3 className="text-2xl font-bold text-gray-800 text-center">
            Police Officer Dashboard Overview
          </h3>
        </div>

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-20 relative z-10"> {/* Adjusted margin top to avoid overlap with the header */}
          {/* Notice Widget */}
          <div className="mb-6" style={overlayStyle}>
            <NoticeWidget 
              maxNotices={3}
              variant="card"
              dashboardType="police"
              showMarkAsRead={true}
              showViewAll={true}
              hideWhenUnauthenticated={true}
            />
          </div>
          
          {/* Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <SummaryCard icon={<FaShieldAlt size={28} />} text="Total Cases" number={summary.totalCases} color="bg-blue-700" />
            <SummaryCard icon={<FaExclamationTriangle size={28} />} text="Total Incidents" number={summary.totalIncidents} color="bg-orange-600" />
            <SummaryCard icon={<FaUsers size={28} />} text="Total Officers" number={summary.totalOfficers} color="bg-green-700" />
          </div>

          {/* Pie Chart Summary with Responsive Legend */}
          <div className="mt-12 p-6 bg-white bg-opacity-90 rounded-lg shadow-md flex flex-col items-center" style={overlayStyle}>
            <h4 className="text-xl font-semibold text-gray-800 text-center mb-6">
              Case Status Breakdown
            </h4>

            {/* Ensure proper width and height for the pie chart */}
            <div className="w-full max-w-4xl flex justify-center">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx={isMobile ? "50%" : "30%"}
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                    ))}
                  </Pie>

                  <Tooltip />

                  <Legend
                    layout={isMobile ? "horizontal" : "vertical"}
                    align={isMobile ? "center" : "right"}
                    verticalAlign={isMobile ? "bottom" : "middle"}
                    wrapperStyle={isMobile ? { marginTop: "20px" } : {}}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliceOfficerSummary;
