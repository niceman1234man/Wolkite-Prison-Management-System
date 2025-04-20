import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import { 
  FaUsers, 
  FaExchangeAlt, 
  FaHourglassHalf, 
  FaCheckCircle, 
  FaTimesCircle,
  FaBan,
  FaArrowRight,
  FaFileAlt,
  FaSignOutAlt
} from "react-icons/fa";
import { useSelector } from "react-redux";
import useNotices from "../hooks/useNotice.jsx";  
import NoticeButton from "../utils/noticeButtons.jsx";
import NoticeModal from "../components/Modals/NoticeModal.jsx";
import { toast } from "react-toastify";

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalPrisoners: 0,
    transferStats: {
      total: 0,
      pending: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0
    },
    inmatesWithoutTransfer: 0,
    prisonerIdsWithTransfer: new Set(),
    releasedInmates: 0
  });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const { notices, isModalOpen, setIsModalOpen, markNoticeAsRead } = useNotices();

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(interval);
    };
  }, []);

  const handleStatusClick = (status) => {
    // Convert status to match the format used in transfers list
    let filterStatus = status.toLowerCase();
    
    // Handle special cases
    if (filterStatus === "under review") {
      filterStatus = "in_review";
    }
    
    // Navigate to transfers page with status filter
    navigate('/woreda-dashboard/transfers', { 
      state: { 
        filterStatus: filterStatus
      }
    });
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch all transfers first
      const transferResponse = await axiosInstance.get("/transfer/getall-transfers");
      const transfers = transferResponse.data?.data || [];

      // Fetch all prisoners
      const prisonersResponse = await axiosInstance.get("/woreda-inmate/getall-inmates");
      const allInmates = prisonersResponse.data?.inmates || [];
      
      // Count released inmates
      const releasedInmates = allInmates.filter(inmate => inmate.status === "Released").length;
      
      // Get inmates without transfer (excluding released inmates for more accurate counting)
      const inmatesWithoutTransfer = allInmates.filter(inmate => inmate.status !== "Released").length;

      // Get unique prisoner IDs from transfers
      const prisonerIdsWithTransfer = new Set(transfers.map(transfer => transfer.inmateId));
      
      // Calculate total prisoners (inmates without transfer + unique inmates with transfer)
      const totalPrisoners = inmatesWithoutTransfer + prisonerIdsWithTransfer.size;

      // Process transfers with correct status mapping
      const processedTransfers = transfers.map(transfer => {
        // Normalize the status to lowercase and handle variations
        let normalizedStatus = transfer.status?.toLowerCase() || '';
        
        // Handle status variations
        if (normalizedStatus === 'in_review' || normalizedStatus === 'under review') {
          normalizedStatus = 'under review';
        }
        
        return {
          ...transfer,
          status: normalizedStatus
        };
      });

      // Log raw data for debugging
      // console.log("Raw transfer data:", transfers);
      // console.log("Normalized transfers:", processedTransfers);
      // console.log("Inmates without transfer:", inmatesWithoutTransfer.length);
      // console.log("Unique inmates with transfer:", prisonerIdsWithTransfer.size);
      // console.log("Total prisoners:", totalPrisoners);

      // Count transfers by status
      const transferStats = {
        total: transfers.length,
        pending: processedTransfers.filter(t => t.status === "pending").length,
        underReview: processedTransfers.filter(t => t.status === "under review").length,
        approved: processedTransfers.filter(t => t.status === "approved").length,
        rejected: processedTransfers.filter(t => t.status === "rejected").length,
        cancelled: processedTransfers.filter(t => t.status === "cancelled").length
      };

      // Log final stats for debugging
      console.log("Transfer statistics:", transferStats);

      setDashboardData({
        totalPrisoners,
        transferStats,
        inmatesWithoutTransfer,
        prisonerIdsWithTransfer,
        releasedInmates
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error(error.response?.data?.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const StatusCard = ({ icon: Icon, label, count, bgColor, textColor, onClick }) => (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between p-3 ${bgColor} rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 transform hover:-translate-y-1`}
    >
      <div className="flex items-center">
        <Icon className={`${textColor} mr-3`} />
        <span>{label}</span>
      </div>
      <div className="flex items-center">
        <span className={`font-bold ${textColor} mr-2`}>{count}</span>
        <FaArrowRight className={`${textColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
      </div>
    </div>
  );

  return (
    <div className="flex">
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />

      <div className="flex-1 relative">
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex justify-between items-center transition-all duration-300 ml-2 ${
            isCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          <h3 className="text-2xl font-bold text-gray-800">Dashboard Overview</h3>
          <NoticeButton notices={notices} onClick={() => setIsModalOpen(true)} />
        </div>

        <div className="p-6 mt-32">
          {/* Main Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Prisoners Card */}
            <Link to="/woreda-dashboard/prisoners" className="p-6 bg-white rounded-lg shadow-md flex items-center space-x-4 hover:shadow-lg transition-shadow">
              <div className="p-4 bg-blue-100 rounded-full">
                <FaUsers className="text-3xl text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Total Prisoners</h3>
                <p className="text-2xl font-bold">{dashboardData.totalPrisoners}</p>
              </div>
            </Link>

            {/* Released Inmates Card */}
            <Link to="/woreda-dashboard/inmates" className="p-6 bg-white rounded-lg shadow-md flex items-center space-x-4 hover:shadow-lg transition-shadow">
              <div className="p-4 bg-purple-100 rounded-full">
                <FaSignOutAlt className="text-3xl text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Released Inmates</h3>
                <p className="text-2xl font-bold">{dashboardData.releasedInmates}</p>
              </div>
            </Link>

            {/* Total Transfers Card */}
            <Link to="/woreda-dashboard/transfers" className="p-6 bg-white rounded-lg shadow-md flex items-center space-x-4 hover:shadow-lg transition-shadow">
              <div className="p-4 bg-green-100 rounded-full">
                <FaExchangeAlt className="text-3xl text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Total Transfer Requests</h3>
                <p className="text-2xl font-bold">{dashboardData.transferStats.total}</p>
              </div>
            </Link>

            {/* Cancelled Transfers Card */}
            <div 
              onClick={() => handleStatusClick("Cancelled")}
              className="p-6 bg-white rounded-lg shadow-md flex items-center space-x-4 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="p-4 bg-gray-100 rounded-full">
                <FaBan className="text-3xl text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Cancelled</h3>
                <p className="text-2xl font-bold">{dashboardData.transferStats.cancelled}</p>
              </div>
            </div>
          </div>

          {/* Transfer Status Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Transfer Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center justify-between">
                <span>Transfer Status Summary</span>
                <button 
                  onClick={fetchDashboardData}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  <FaArrowRight className="inline-block mr-1" />
                  Refresh
                </button>
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Pending Transfers</p>
                      <h3 className="text-2xl font-bold mt-1">{dashboardData.transferStats.pending || 0}</h3>
                    </div>
                    <div className="p-3 rounded-full text-yellow-600 bg-yellow-50">
                      <FaHourglassHalf className="text-xl" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <button 
                      onClick={() => handleStatusClick("Pending")}
                      className="text-yellow-600 text-sm hover:underline flex items-center"
                    >
                      View Details <FaArrowRight className="ml-2" />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Under Review</p>
                      <h3 className="text-2xl font-bold mt-1">{dashboardData.transferStats.underReview || 0}</h3>
                    </div>
                    <div className="p-3 rounded-full text-blue-600 bg-blue-50">
                      <FaExchangeAlt className="text-xl" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <button 
                      onClick={() => handleStatusClick("Under Review")}
                      className="text-blue-600 text-sm hover:underline flex items-center"
                    >
                      View Details <FaArrowRight className="ml-2" />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                      <div>
                      <p className="text-gray-500 text-sm">Approved Transfers</p>
                      <h3 className="text-2xl font-bold mt-1">{dashboardData.transferStats.approved || 0}</h3>
                      </div>
                    <div className="p-3 rounded-full text-green-600 bg-green-50">
                      <FaCheckCircle className="text-xl" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <button 
                      onClick={() => handleStatusClick("Approved")}
                      className="text-green-600 text-sm hover:underline flex items-center"
                    >
                      View Details <FaArrowRight className="ml-2" />
                    </button>
              </div>
            </div>

                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                      <div>
                      <p className="text-gray-500 text-sm">Rejected Transfers</p>
                      <h3 className="text-2xl font-bold mt-1">{dashboardData.transferStats.rejected || 0}</h3>
                      </div>
                    <div className="p-3 rounded-full text-red-600 bg-red-50">
                      <FaTimesCircle className="text-xl" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <button 
                      onClick={() => handleStatusClick("Rejected")}
                      className="text-red-600 text-sm hover:underline flex items-center"
                    >
                      View Details <FaArrowRight className="ml-2" />
                    </button>
                  </div>
                </div>
            </div>
          </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4">
            <Link
              to="/woreda-dashboard/prisoners"
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Manage Prisoners</p>
                      <h3 className="text-lg font-semibold mt-1">View and manage prisoner records</h3>
                    </div>
                    <div className="p-3 rounded-full text-blue-600 bg-blue-50">
                      <FaUsers className="text-xl" />
                    </div>
                  </div>
            </Link>

            <Link
              to="/woreda-dashboard/transfers"
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Manage Transfers</p>
                      <h3 className="text-lg font-semibold mt-1">Handle transfer requests</h3>
                    </div>
                    <div className="p-3 rounded-full text-green-600 bg-green-50">
                      <FaExchangeAlt className="text-xl" />
                    </div>
                  </div>
            </Link>

            <Link
              to="/woreda-dashboard/reports"
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">View Reports</p>
                      <h3 className="text-lg font-semibold mt-1">Access detailed analytics</h3>
                    </div>
                    <div className="p-3 rounded-full text-gray-600 bg-gray-50">
                      <FaFileAlt className="text-xl" />
                    </div>
                  </div>
            </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NoticeModal
        notices={notices}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectNotice={markNoticeAsRead}
        selectedNotice={null}
      />
    </div>
  );
};

export default Dashboard;