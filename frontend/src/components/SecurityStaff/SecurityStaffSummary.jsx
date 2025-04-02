import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FaShieldAlt, FaExclamationTriangle, FaUsers } from "react-icons/fa";
import SummaryCard from "./Summary.jsx";
import NoticeWidget from "../Notices/NoticeWidget";

const SecurityStaffSummary = () => {
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <SummaryCard icon={<FaShieldAlt size={28} />} text="Total Inmates" number={120} color="bg-blue-700" />
            <SummaryCard icon={<FaExclamationTriangle size={28} />} text="Parole Requests" number={85} color="bg-orange-600" />
            <SummaryCard icon={<FaUsers size={28} />} text="Guilty Inmates" number={50} color="bg-green-700" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityStaffSummary;
