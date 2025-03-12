import React, { useEffect, useState } from "react";
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaUsers,
  FaHourglassHalf,
  FaCheckCircle,
  FaRegTimesCircle,
  FaFileAlt,
} from "react-icons/fa";
import SummaryCard from "./Summary.jsx";
import { useSelector } from "react-redux";
import axiosInstance from "../../utils/axiosInstance.js";

const PoliceOfficerSummary = () => {
  const [summary, setSummary] = useState(null);
  const [notice, setNotice] = useState([]); // Initialize as an empty array
  const [loading, setLoading] = useState(true); // Loading state for notices
  const users = useSelector((state) => state.users.users);
  const incidents = useSelector((state) => state.incidents.incident);
  const police = users.filter((user) => user.role === "police-officer");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch notices
        const noticeResponse = await axiosInstance.get("/notice/getAllNotices");
        if (noticeResponse.data) {
          setNotice(noticeResponse.data.notices);
        }

        // Fetch summary data (dummy data for now)
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
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false); // Set loading to false after data is fetched
      }
    };

    fetchData();
  }, []);

  if (!summary || loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 mt-12 text-center">
      {/* Notices Section */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold mb-6">Notices</h3>
        {notice.length > 0 ? (
          notice.map((noticeItem, index) => {
            // Check if the notice is posted and "Police Officer" is in the roles array
            if (noticeItem.isPosted && noticeItem.roles.includes("Police Officer")) {
              return (
                <div key={index} className="bg-gray-100 p-4 rounded-lg mb-4">
                  <p className="text-lg font-semibold">{noticeItem.title}</p>
                  <p className="text-sm text-gray-600">{noticeItem.description}</p>
                  <p className="text-sm text-gray-500">Priority: {noticeItem.priority}</p>
                  <p className="text-sm text-gray-500">Date: {new Date(noticeItem.date).toLocaleDateString()}</p>
                </div>
              );
            }
            return null; // Skip notices that don't match the condition
          })
        ) : (
          <p></p>
        )}
      </div>

      {/* Dashboard Overview */}
      <h3 className="text-2xl font-bold mb-12">Police Officer Dashboard Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <SummaryCard
          icon={<FaShieldAlt size={24} />}
          text="Total Cases"
          number={summary.totalCases}
          color="bg-blue-600"
        />
        <SummaryCard
          icon={<FaExclamationTriangle size={24} />}
          text="Total Incidents"
          number={incidents.length}
          color="bg-orange-600"
        />
        <SummaryCard
          icon={<FaUsers size={24} />}
          text="Total Officers"
          number={police.length}
          color="bg-green-600"
        />
      </div>

      {/* Case Details */}
      <div className="mt-12">
        <h4 className="text-center text-2xl font-bold">Case Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <SummaryCard
            icon={<FaHourglassHalf size={24} />}
            text="Cases Pending"
            number={summary.caseSummary.pending}
            color="bg-yellow-600"
          />
          <SummaryCard
            icon={<FaCheckCircle size={24} />}
            text="Cases Resolved"
            number={summary.caseSummary.resolved}
            color="bg-green-600"
          />
          <SummaryCard
            icon={<FaRegTimesCircle size={24} />}
            text="Cases Escalated"
            number={summary.caseSummary.escalated}
            color="bg-red-600"
          />
          <SummaryCard
            icon={<FaFileAlt size={24} />}
            text="Under Investigation"
            number={summary.caseSummary.underInvestigation}
            color="bg-teal-600"
          />
        </div>
      </div>
    </div>
  );
};

export default PoliceOfficerSummary;