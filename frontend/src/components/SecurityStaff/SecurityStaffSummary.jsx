import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaUsers,
} from "react-icons/fa";
import SummaryCard from "./Summary.jsx";
import axiosInstance from "../../utils/axiosInstance.js";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const SecurityStaffSummary = () => {
  const inmate = useSelector((state) => state.inmate.inmate);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  console.log(inmate);

  const [summary, setSummary] = useState(null);
  const [notice, setNotice] = useState([]);

  useEffect(() => {
    const dummyData = {
      totalInmates: 120,
      totalParoleRequests: 85,
      totalGuiltyInmates: 50,
      totalInProcessInmates: 40,
      inmatesBelow5YearVerdict: 20,
      caseSummary: {
        pending: 30,
        resolved: 70,
        escalated: 10,
        underInvestigation: 10,
      },
    };

    setTimeout(() => {
      setSummary(dummyData);
    }, 500);

    const fetchData = async () => {
      try {
        const noticeResponse = await axiosInstance.get("/notice/getAllNotices");
        if (noticeResponse.data) {
          setNotice(noticeResponse.data.notices);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  if (!summary) {
    return <div>Loading...</div>;
  }

  // Pie Chart Data (Case Status)
  const caseData = [
    { name: "Pending", value: summary.caseSummary.pending },
    { name: "Resolved", value: summary.caseSummary.resolved },
    { name: "Escalated", value: summary.caseSummary.escalated },
    { name: "Under Investigation", value: summary.caseSummary.underInvestigation },
  ];
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  // Bar Chart Data (Inmate Stats)
  const inmateStats = [
    { name: "Total", value: summary.totalInmates },
    { name: "Parole Requests", value: summary.totalParoleRequests },
    { name: "Guilty", value: summary.totalGuiltyInmates },
    { name: "In-Process", value: summary.totalInProcessInmates },
    { name: "Below 5 Years", value: summary.inmatesBelow5YearVerdict },
  ];

  return (
    <div className={`p-6 mt-12 transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-64"}`}>
      {/* Notices Section */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold mb-6">Notices</h3>
        {notice.length > 0 ? (
          notice.map((noticeItem, index) => {
            if (noticeItem.isPosted && noticeItem.roles.includes("Admin")) {
              return (
                <div key={index} className="bg-gray-100 p-4 rounded-lg mb-4">
                  <p className="text-lg font-semibold">{noticeItem.title}</p>
                  <p className="text-sm text-gray-600">{noticeItem.description}</p>
                  <p className="text-sm text-gray-500">Priority: {noticeItem.priority}</p>
                  <p className="text-sm text-gray-500">
                    Date: {new Date(noticeItem.date).toLocaleDateString()}
                  </p>
                </div>
              );
            }
            return null;
          })
        ) : (
          <p>No notices available.</p>
        )}
      </div>

      {/* Summary Cards */}
      <h3 className="text-2xl font-bold mb-4">Security Staff Dashboard Overview</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <SummaryCard icon={<FaShieldAlt size={24} />} text="Total Inmates" number={inmate.length} color="bg-blue-600" />
        <SummaryCard icon={<FaExclamationTriangle size={24} />} text="Parole Requests" number={summary.totalParoleRequests} color="bg-orange-600" />
        <SummaryCard icon={<FaUsers size={24} />} text="Guilty Inmates" number={summary.totalGuiltyInmates} color="bg-green-600" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        {/* Pie Chart (Case Status) */}
        <div className="bg-white p-6 shadow-md rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Case/parole Status Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={caseData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {caseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart (Inmate Stats) */}
        <div className="bg-white p-6 shadow-md rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Inmate Statistics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={inmateStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SecurityStaffSummary;
