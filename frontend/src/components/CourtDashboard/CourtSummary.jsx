import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FaUserTie, FaHourglassHalf, FaCheckCircle, FaTimesCircle, FaGavel } from "react-icons/fa";
import useNotices from "../../hooks/useNotice.jsx";
import NoticeButton from "../../utils/noticeButtons.jsx";
import NoticeModal from "../modals/noticeModal.jsx";
import SummaryCard from "./Summary.jsx";

const COLORS = {
  totalParolees: "#1E3A8A",
  pendingParolees: "#EA580C",
  activeParolees: "#047857",
  revokedParolees: "#DC2626",
};

const CourtSummary = () => {
  const [summary, setSummary] = useState(null);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { notices, isModalOpen, setIsModalOpen, markNoticeAsRead } = useNotices();

  useEffect(() => {
    const dummyData = {
      totalParolees: 120,
      pendingParolees: 85,
      activeParolees: 30,
      revokedParolees: 5,
    };

    setTimeout(() => {
      setSummary(dummyData);
    }, 500);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!summary) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-600">
        <span className="animate-pulse">Loading data...</span>
      </div>
    );
  }

  const chartData = [
    { name: "Total Parolees", value: summary.totalParolees, color: COLORS.totalParolees },
    { name: "Pending Parolees", value: summary.pendingParolees, color: COLORS.pendingParolees },
    { name: "Active Parolees", value: summary.activeParolees, color: COLORS.activeParolees },
    { name: "Revoked Parolees", value: summary.revokedParolees, color: COLORS.revokedParolees },
  ];

  return (
    <div className="flex">
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />
      <div className="flex-1 relative">
        <div className={`bg-white shadow-md p-4 fixed top-14 z-20 flex justify-between items-center transition-all duration-300 ml-2 ${isCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"}`}>
          <h3 className="text-2xl font-bold text-gray-800 text-center">Court Dashboard Overview</h3>
          <NoticeButton notices={notices} onClick={() => setIsModalOpen(true)} />
        </div>
        <div className="p-6 mt-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <SummaryCard icon={<FaUserTie size={28} />} text="Total Parolees" number={summary.totalParolees} color="bg-blue-700" />
            <SummaryCard icon={<FaHourglassHalf size={28} />} text="Pending Parolees" number={summary.pendingParolees} color="bg-orange-600" />
            <SummaryCard icon={<FaCheckCircle size={28} />} text="Active Parolees" number={summary.activeParolees} color="bg-green-700" />
            <SummaryCard icon={<FaTimesCircle size={28} />} text="Revoked Parolees" number={summary.revokedParolees} color="bg-red-700" />
          </div>
          <div className="mt-12 p-6 bg-white rounded-lg shadow-md flex flex-col items-center">
            <h4 className="text-xl font-semibold text-gray-800 text-center mb-6">Summary Statistics</h4>
            <div className="w-full max-w-4xl flex justify-center">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={chartData} cx={isMobile ? "50%" : "30%"} cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout={isMobile ? "horizontal" : "vertical"} align={isMobile ? "center" : "right"} verticalAlign={isMobile ? "bottom" : "middle"} wrapperStyle={isMobile ? { marginTop: "20px" } : {}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      <NoticeModal notices={notices} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelectNotice={markNoticeAsRead} selectedNotice={null} />
    </div>
  );
};

export default CourtSummary;
