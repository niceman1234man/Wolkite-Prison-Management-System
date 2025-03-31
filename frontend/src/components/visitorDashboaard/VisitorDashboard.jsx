import React from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import VisitorSidebar from "./VisitorSidebar";
import VisitorSummaryCard from "./VisitorSummary";
import ScheduleVisit from "./ScheduleVisit";
import VisitHistory from "./VisitHistory";
import VisitorProfile from "./VisitorProfile";
import UpdateProfile from "../profile/updateProfile";
import HelpPage from "../../page/helpPage";
import SettingPage from "../../page/settingsPage";

function VisitorDashboard() {
  return (
    <div className="flex h-screen bg-gray-100">
      <VisitorSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Routes>
            <Route index element={<VisitorSummaryCard />} />
            <Route path="schedule" element={<ScheduleVisit />} />
            <Route path="visit-history" element={<VisitHistory />} />
            <Route path="setting" element={<VisitorProfile />} />
            <Route path="update-profile" element={<UpdateProfile />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="settingsPage" element={<SettingPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default VisitorDashboard; 