import React from "react";
import { useSelector } from "react-redux";
import ArchiveList from "../Archive/ArchiveList";

const PoliceArchivePage = () => {
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  return (
    <div className="flex">
      {/* Sidebar Spacing Fix */}
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Fixed Header */}
        <div
          className={`bg-white shadow-md p-4 fixed top-12 z-20 flex justify-between items-center transition-all duration-300 ml-2 ${
            isCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"
          }`}
          style={{ zIndex: 20 }}
        >
          <h3 className="text-2xl font-bold text-gray-800 text-center">
            Archive System
          </h3>
        </div>

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-20">
          <ArchiveList />
        </div>
      </div>
    </div>
  );
};

export default PoliceArchivePage; 