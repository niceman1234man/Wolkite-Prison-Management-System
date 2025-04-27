import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FaShieldAlt, FaExclamationTriangle, FaUsers } from "react-icons/fa";
import SummaryCard from "./Summary.jsx";
import NoticeWidget from "../Notices/NoticeWidget";
import axiosInstance from "../../utils/axiosInstance";

// CSS for the pattern overlay
const overlayStyle = `
  .pattern-overlay {
    position: relative;
  }
  .pattern-overlay::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b5998' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.3;
    z-index: 0;
    pointer-events: none;
  }
  .content-container {
    position: relative;
    z-index: 1;
  }
`;

// Background style
const backgroundStyle = {
  backgroundImage: `
    linear-gradient(135deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.1)), 
    url("https://images.unsplash.com/photo-1627224287599-a819e6f27343?q=80&w=2071&auto=format&fit=crop")
  `,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed',
};

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
    
    // Add overlay style to head
    const styleEl = document.createElement('style');
    styleEl.innerHTML = overlayStyle;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  return (
    <div className="flex">
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />
      <div className="flex-1 relative pattern-overlay" style={backgroundStyle}>
        {/* Header Section */}
        <div className={`bg-gradient-to-r from-blue-800 to-blue-900 shadow-md p-4 fixed top-14 z-20 flex justify-between items-center transition-all duration-300 ml-2 ${isCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"}`}>
          <h3 className="text-2xl font-bold text-white text-center">Security Staff Dashboard Overview</h3>
        </div>

        <div className="p-6 mt-24 min-h-screen content-container">
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
          
          {/* Welcome section */}
          <div className="mb-10 text-white bg-black bg-opacity-40 p-6 rounded-lg backdrop-blur-sm">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-green-300 text-sm font-semibold">Security System Active</span>
            </div>
            <h2 className="text-4xl font-bold mb-3 mt-2">Prison Security Dashboard</h2>
            <p className="text-lg text-blue-100 max-w-3xl">
              Monitor inmate activity, track facility security, and respond to incidents in real-time. 
              All security systems are operational and functioning properly.
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64 text-white">
              <span className="animate-pulse">Loading dashboard data...</span>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-red-300">
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
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <SummaryCard 
                icon={<FaShieldAlt size={28} />} 
                text="Total Inmates" 
                number={summaryData.totalInmates} 
                  color="bg-gradient-to-r from-blue-800 to-blue-600" 
              />
              <SummaryCard 
                icon={<FaExclamationTriangle size={28} />} 
                text="Parole Requests" 
                number={summaryData.paroleRequests} 
                  color="bg-gradient-to-r from-orange-700 to-orange-500" 
              />
              <SummaryCard 
                icon={<FaUsers size={28} />} 
                text="Guilty Inmates" 
                number={summaryData.guiltyInmates} 
                  color="bg-gradient-to-r from-green-800 to-green-600" 
              />
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityStaffSummary;
