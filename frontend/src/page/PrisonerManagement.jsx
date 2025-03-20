import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const PrisonerManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("list");

  // Set the active tab based on the current route
  React.useEffect(() => {
    if (location.pathname.includes("add")) {
      setActiveTab("add");
    } else {
      setActiveTab("list");
    }
  }, [location]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Prisoner Management</h2>

      {/* Tabs for Navigation */}
      <div className="flex space-x-4 border-b mb-6">
        <Link
          to="/woreda-dashboard/prisoners"
          className={`pb-2 px-4 ${
            activeTab === "list"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-blue-600"
          }`}
        >
          Prisoner List
        </Link>
        <Link
          to="/woreda-dashboard/prisoners/add"
          className={`pb-2 px-4 ${
            activeTab === "add"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-blue-600"
          }`}
        >
          Add New Prisoner
        </Link>
      </div>

      {/* Render Child Routes */}
      <Outlet />
    </div>
  );
};

export default PrisonerManagement;