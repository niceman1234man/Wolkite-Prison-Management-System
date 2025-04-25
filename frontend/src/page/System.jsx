import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import SystemSidebar from "../components/SystemSetting/SystemSidebar";
import SystemDashboard from "../components/SystemSetting/SystemDashboard";

function System() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <SystemSidebar />
      <div className="flex-1 p-4">
        <Outlet />
      </div>
    </div>
  );
}

export default System; 