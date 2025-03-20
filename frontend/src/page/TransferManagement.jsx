import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const TransferManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("requests");

  // Set the active tab based on the current route
  React.useEffect(() => {
    if (location.pathname.includes("new")) {
      setActiveTab("new");
    } else {
      setActiveTab("requests");
    }
  }, [location]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Transfer Management</h2>

      {/* Tabs for Navigation */}
      <div className="flex space-x-4 border-b mb-6">
        <Link
          to="/woreda-dashboard/transfers"
          className={`pb-2 px-4 ${
            activeTab === "requests"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-blue-600"
          }`}
        >
          Transfer Requests
        </Link>
        <Link
          to="/woreda-dashboard/transfers/new"
          className={`pb-2 px-4 ${
            activeTab === "new"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-blue-600"
          }`}
        >
          New Transfer Request
        </Link>
      </div>

      {/* Render Child Routes */}
      <Outlet />
    </div>
  );
};

export default TransferManagement;