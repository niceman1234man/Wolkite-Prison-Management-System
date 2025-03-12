import React, { useEffect, useState } from "react";
import { 
  FaLandmark, 
  FaBullhorn, 
  FaClipboardList 
} from "react-icons/fa";
import SummaryCard from "./Summary.jsx";
// import axios from "axios";  

const InspectorSummary = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    // Temporary Dummy Data (Replace with API call)
    const dummyData = {
      totalPrisons: 12,
      totalMonthlyNotices: 85,
      totalNoticesToday: 5,
    };

    // Simulate async data fetching
    setTimeout(() => {
      setSummary(dummyData);
    }, 500);

    /*
    // Example API Fetch
    const fetchSummary = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Unauthorized access. Please log in.");
        return;
      }
      try {
        const response = await axios.get("https://your-backend-api.com/api/police/dashboard/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSummary(response.data);
      } catch (error) {
        console.error("Error fetching summary:", error);
      }
    };

    fetchSummary();
    */
  }, []);

  if (!summary) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-600">
        <span className="animate-pulse">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 mt-12">
      <h3 className="text-2xl font-bold text-gray-800">Inspector Dashboard Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <SummaryCard
          icon={<FaLandmark size={28} />}
          text="Total Prisons"
          number={summary.totalPrisons}
          color="bg-blue-700"
        />
        <SummaryCard
          icon={<FaBullhorn size={28} />}
          text="Total Notices (Monthly)"
          number={summary.totalMonthlyNotices}
          color="bg-orange-600"
        />
        <SummaryCard
          icon={<FaClipboardList size={28} />}
          text="Today's Notices"
          number={summary.totalNoticesToday}
          color="bg-green-700"
        />
      </div>
    </div>
  );
};

export default InspectorSummary;
