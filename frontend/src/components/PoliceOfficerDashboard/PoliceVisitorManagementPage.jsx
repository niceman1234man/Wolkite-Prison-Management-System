// import React from "react";
import { useState } from "react";
import { useSelector } from "react-redux";
import PoliceVisitorManagement from "../visitorDashboaard/PoliceVisitorManagement";
import ScheduleVisit from "../visitorDashboaard/ScheduleVisit";

const PoliceVisitorManagementPage = () => {
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const refreshVisitorList = () => {
    setRefreshTrigger(prev => prev + 1);
  };

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
            Visitor Management
          </h3>
          <button 
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-all duration-300"
          >
            Add New Visitor
          </button>
        </div>

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-20">
          <PoliceVisitorManagement refreshTrigger={refreshTrigger} />
        </div>
        
        {/* Schedule Visit Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Add New Visitor</h2>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <ScheduleVisit 
                  isPoliceOfficer={true}
                  onSuccess={() => {
                    setShowScheduleModal(false);
                    refreshVisitorList();
                  }}
                  onCancel={() => setShowScheduleModal(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoliceVisitorManagementPage; 