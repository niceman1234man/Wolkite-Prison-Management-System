import { useState } from "react";
import { useSelector } from "react-redux";
import { FaArchive, FaArrowLeft } from "react-icons/fa";
import ArchiveList from "./ArchiveList";
import ArchiveDetail from "./ArchiveDetail";

const ArchivePage = () => {
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [selectedArchiveId, setSelectedArchiveId] = useState(null);

  // Function to handle viewing archive details
  const handleViewDetails = (archiveId) => {
    setSelectedArchiveId(archiveId);
  };

  // Function to go back to archive list
  const handleBackToList = () => {
    setSelectedArchiveId(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Spacing */}
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Fixed Header */}
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex items-center transition-all duration-300 ${
            isCollapsed ? "left-16 w-[calc(100%-4rem)]" : "left-64 w-[calc(100%-16rem)]"
          }`}
        >
          {selectedArchiveId ? (
            <>
              <button
                className="flex items-center text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg shadow-md transition duration-300 mr-4"
                onClick={handleBackToList}
              >
                <FaArrowLeft className="mr-2 text-lg" /> Back to Archive
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Archive Details</h1>
            </>
          ) : (
            <>
              <FaArchive className="text-teal-600 text-2xl mr-3" />
              <h1 className="text-2xl font-bold text-gray-800">Archive System</h1>
            </>
          )}
        </div>

        {/* Content Area with top padding to account for header */}
        <div className="pt-24 px-6 pb-6 overflow-auto flex-1 mt-10">
          {selectedArchiveId ? (
            <ArchiveDetail 
              archiveId={selectedArchiveId} 
              onBack={handleBackToList}
              standalone={false}
            />
          ) : (
            <ArchiveList 
              standalone={false}
              onViewDetails={handleViewDetails}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchivePage; 