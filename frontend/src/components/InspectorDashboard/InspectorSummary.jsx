import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { 
  FaLandmark, 
  FaBullhorn, 
  FaClipboardList, 
  FaUsers, 
  FaExclamationTriangle, 
  FaExchangeAlt,
  FaChartBar,
  FaHistory,
  FaInfoCircle,
  FaQuestion,
  FaList,
  FaChevronRight,
  FaArrowLeft,
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaCalendarAlt,
  FaUserShield,
  FaClipboardCheck,
  FaChartLine,
  FaBell,
  FaBuilding
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import NoticeWidget from "../Notices/NoticeWidget";
import SummaryCard from "./Summary.jsx";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from 'date-fns';
import { priorityColors } from "../../utils/NoticeHelper";

// Define colors for each data type
const COLORS = {
  prisons: "#1E3A8A", // Dark Blue
  noticesMonthly: "#EA580C", // Orange
  noticesToday: "#047857", // Green
  inmates: "#7C3AED", // Purple
  transfers: "#DC2626", // Red
  urgent: "#D97706", // Amber
  active: "#10B981", // Green
  inactive: "#EF4444", // Red
  pending: "#F59E0B", // Amber
  completed: "#3B82F6", // Blue
};

// Custom styles for data tables
const customStyles = {
  headCells: {
    style: {
      backgroundColor: "#D2B48C",
      color: "#5A3E1B",
      fontWeight: "bold",
      fontSize: "14px",
      textTransform: "uppercase",
    },
  },
  rows: {
    style: {
      "&:hover": {
        backgroundColor: "#F5DEB3",
        cursor: "pointer",
        transition: "background-color 0.2s ease-in-out",
      },
    },
  },
};

const InspectorSummary = () => {
  const [summaryData, setSummaryData] = useState({
    totalPrisons: 0,
    activePrisons: 0,
    totalCapacity: 0,
    currentPopulation: 0,
    totalNotices: 0,
    todayNotices: 0,
    monthlyNotices: 0,
    urgentNotices: 0,
    pendingTransfers: 0,
    approvedTransfers: 0,
    rejectedTransfers: 0,
    monthlyTransfers: 0,
    occupancyRate: 0,
    totalInmates: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPrisons, setFilteredPrisons] = useState([]);
  const [prisons, setPrisons] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axiosInstance.get("/user/profile");
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch prisons data
      const prisonsResponse = await axiosInstance.get("/prison/getall-prisons");
      // Check both possible response structures
      const prisons = prisonsResponse.data?.prisons || prisonsResponse.data?.data || [];
      setPrisons(prisons);
      setFilteredPrisons(prisons);

      // Calculate prison statistics
      const totalPrisons = prisons.length;
      const activePrisons = prisons.filter(p => p.status === "active").length;
      const totalCapacity = prisons.reduce((sum, p) => sum + (Number(p.capacity) || 0), 0);
      const currentPopulation = prisons.reduce((sum, p) => sum + (Number(p.current_population) || 0), 0);

      // Calculate occupancy rate
      const occupancyRate = totalCapacity > 0 ? (currentPopulation / totalCapacity) * 100 : 0;

      // Fetch notices data
      const noticesResponse = await axiosInstance.get("/notice/getAllNotices");
      const notices = noticesResponse.data.notices || noticesResponse.data.data || [];
      setRecentNotices(notices.slice(0, 5)); // Get 5 most recent notices

      // Calculate notice statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayNotices = notices.filter(notice => {
        const noticeDate = new Date(notice.date);
        noticeDate.setHours(0, 0, 0, 0);
        return noticeDate.getTime() === today.getTime();
      }).length;

      const monthlyNotices = notices.filter(notice => {
        const noticeDate = new Date(notice.date);
        return noticeDate.getMonth() === today.getMonth() && 
               noticeDate.getFullYear() === today.getFullYear();
      }).length;

      const urgentNotices = notices.filter(notice => 
        notice.priority === "High" || notice.priority === "Urgent"
      ).length;

      // Fetch transfer data
      const transfersResponse = await axiosInstance.get("/transfer/getall-transfers");
      const transfers = transfersResponse.data.data || [];
      
      // Calculate transfer statistics
      const pendingTransfers = transfers.filter(t => t.status === "pending" || t.status === "Pending").length;
      const approvedTransfers = transfers.filter(t => t.status === "approved" || t.status === "Approved").length;
      const rejectedTransfers = transfers.filter(t => t.status === "rejected" || t.status === "Rejected").length;
      const inReviewTransfers = transfers.filter(t => t.status === "in_review" || t.status === "In Review").length;
      
      // Calculate monthly transfers
      const monthlyTransfers = transfers.filter(transfer => {
        const transferDate = new Date(transfer.transferDate || transfer.createdAt);
        return transferDate.getMonth() === today.getMonth() && 
               transferDate.getFullYear() === today.getFullYear();
      }).length;

      // Fetch inmates data
      const inmatesResponse = await axiosInstance.get("/inmates/allInmates");
      const inmates = inmatesResponse.data?.inmates || inmatesResponse.data || [];
      
      // Calculate total inmates
      const totalInmates = inmates.length;

      // Generate monthly data for charts
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        
        return {
          name: `${monthName} ${year}`,
          notices: notices.filter(n => {
            const noticeDate = new Date(n.date);
            return noticeDate.getMonth() === date.getMonth() && 
                   noticeDate.getFullYear() === date.getFullYear();
          }).length,
          transfers: transfers.filter(t => {
            const transferDate = new Date(t.transferDate || t.createdAt);
            return transferDate.getMonth() === date.getMonth() && 
                   transferDate.getFullYear() === date.getFullYear();
          }).length,
          inmates: totalInmates, // Use actual inmate count
          urgentNotices: notices.filter(n => {
            const noticeDate = new Date(n.date);
            return noticeDate.getMonth() === date.getMonth() && 
                   noticeDate.getFullYear() === date.getFullYear() &&
                   (n.priority === 'High' || n.priority === 'Urgent');
          }).length,
        };
      }).reverse();
      
      setMonthlyData(last6Months);

      // Update summary data
      setSummaryData({
        totalPrisons,
        activePrisons,
        totalCapacity,
        currentPopulation,
        totalNotices: notices.length,
        todayNotices,
        monthlyNotices,
        urgentNotices,
        pendingTransfers,
        approvedTransfers,
        rejectedTransfers,
        inReviewTransfers,
        monthlyTransfers,
        occupancyRate,
        totalInmates
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.response?.data?.message || "Error loading dashboard data");
      setLoading(false);
      toast.error("Failed to load dashboard data");
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      if (!dateString) return "No date available";
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  // Filter prisons based on search term
  const filterPrisons = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchTerm(query);
    const filtered = prisons.filter(
      (prison) =>
        prison.prison_name.toLowerCase().includes(query) ||
        prison.location.toLowerCase().includes(query)
    );
    setFilteredPrisons(filtered);
  };

  // Handle prison actions
  const handleViewPrison = (id) => {
    navigate(`/inspector-dashboard/prisons/${id}`);
  };

  const handleEditPrison = (id) => {
    navigate(`/inspector-dashboard/prisons/edit/${id}`);
  };

  const handleDeletePrison = async (id) => {
    if (window.confirm("Are you sure you want to delete this prison?")) {
      try {
        const response = await axiosInstance.delete(`/prison/${id}`);
        
        if (response.data?.success) {
          toast.success("Prison deleted successfully");
          fetchDashboardData();
        }
      } catch (error) {
        console.error("Error deleting prison:", error);
        toast.error(error.response?.data?.error || "Failed to delete prison");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <span className="text-lg">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-red-600 p-4">
        <FaExclamationTriangle className="text-4xl mb-4" />
        <span className="text-lg mb-4">{error}</span>
        <button 
          onClick={fetchDashboardData}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const chartData = [
    { name: "Active Prisons", value: summaryData.activePrisons, color: COLORS.prisons },
    { name: "Monthly Notices", value: summaryData.monthlyNotices, color: COLORS.noticesMonthly },
    { name: "Today's Notices", value: summaryData.todayNotices, color: COLORS.noticesToday },
    { name: "Pending Transfers", value: summaryData.pendingTransfers, color: COLORS.transfers },
    { name: "In Review Transfers", value: summaryData.inReviewTransfers, color: COLORS.pending },
    { name: "Approved Transfers", value: summaryData.approvedTransfers, color: COLORS.completed },
    { name: "Urgent Cases", value: summaryData.urgentNotices, color: COLORS.urgent },
  ];

  return (
    <div className="flex">
      {/* Sidebar Spacing Fix */}
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Responsive Fixed Header */}
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex justify-between items-center transition-all duration-300 ml-2 ${
            isCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          <h3 className="text-2xl font-bold text-gray-800 text-center">
            Welcome back, {user?.name || "Inspector"}
          </h3>
          <div className="flex items-center">
            <div className="relative flex items-center w-72 md:w-1/3 mr-4">
              <FaSearch className="absolute left-3 text-gray-500" />
              <input
                type="text"
                placeholder="Search prisons..."
                className="h-10 px-4 py-2 border border-gray-300 rounded-md w-full pl-10"
                onChange={filterPrisons}
                value={searchTerm}
              />
            </div>
            <Link
              to="/inspector-dashboard/add-prison"
              className="h-10 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center justify-center min-w-[150px] md:w-auto"
            >
              <FaPlus className="mr-2" /> Add New Prison
            </Link>
          </div>
        </div>

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-24">
          {/* Notice Widget */}
          <div className="mb-6">
            <NoticeWidget 
              maxNotices={3}
              variant="card"
              dashboardType="inspector"
              showMarkAsRead={true}
              showViewAll={true}
              hideWhenUnauthenticated={true}
            />
          </div>

          {/* Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <SummaryCard 
              icon={<FaLandmark size={28} />} 
              text="Total Prisons" 
              number={summaryData.totalPrisons} 
              color="bg-blue-700" 
              subtitle={`${summaryData.activePrisons} active`}
            />
            <SummaryCard 
              icon={<FaUsers size={28} />} 
              text="Current Population" 
              number={summaryData.currentPopulation} 
              color="bg-purple-700" 
              subtitle={`of ${summaryData.totalCapacity} capacity`}
            />
            <SummaryCard 
              icon={<FaBullhorn size={28} />} 
              text="Monthly Notices" 
              number={summaryData.monthlyNotices} 
              color="bg-orange-600" 
              subtitle={`${summaryData.todayNotices} today`}
            />
            <SummaryCard 
              icon={<FaClipboardList size={28} />} 
              text="Today's Notices" 
              number={summaryData.todayNotices} 
              color="bg-green-700" 
            />
            <SummaryCard 
              icon={<FaExchangeAlt size={28} />} 
              text="Pending Transfers" 
              number={summaryData.pendingTransfers} 
              color="bg-red-600" 
              subtitle={`${summaryData.inReviewTransfers} in review`}
            />
            <SummaryCard 
              icon={<FaExclamationTriangle size={28} />} 
              text="Urgent Cases" 
              number={summaryData.urgentNotices} 
              color="bg-amber-600" 
            />
          </div>

          {/* Monthly Activity Chart */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaChartLine className="mr-2 text-blue-600" /> Monthly Activity
            </h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="notices" name="Notices" fill={COLORS.noticesMonthly} />
                  <Bar dataKey="transfers" name="Transfers" fill={COLORS.transfers} />
                  <Bar dataKey="inmates" name="Total Inmates" fill={COLORS.inmates} />
                  <Bar dataKey="urgentNotices" name="Urgent Notices" fill={COLORS.urgent} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaChartBar className="mr-2 text-blue-600" /> Prison Capacity Overview
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Capacity</span>
                  <span className="font-semibold">{summaryData.totalCapacity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Population</span>
                  <span className="font-semibold">{summaryData.currentPopulation}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Occupancy Rate</span>
                  <span className="font-semibold">{summaryData.occupancyRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className={`h-2.5 rounded-full ${
                      summaryData.occupancyRate > 90 
                        ? "bg-red-600" 
                        : summaryData.occupancyRate > 70 
                          ? "bg-yellow-500" 
                          : "bg-green-500"
                    }`} 
                    style={{ width: `${Math.min(summaryData.occupancyRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaInfoCircle className="mr-2 text-teal-600" /> Notice Statistics
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Today's Notices</span>
                  <span className="font-semibold">{summaryData.todayNotices}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly Notices</span>
                  <span className="font-semibold">{summaryData.monthlyNotices}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Urgent Notices</span>
                  <span className="font-semibold">{summaryData.urgentNotices}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Notices</span>
                  <span className="font-semibold">{summaryData.totalNotices}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Statistics */}
          <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaExchangeAlt className="mr-2 text-teal-600" /> Transfer Statistics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-red-600 font-semibold text-lg">{summaryData.pendingTransfers}</div>
                <div className="text-gray-600">Pending</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-yellow-600 font-semibold text-lg">{summaryData.inReviewTransfers}</div>
                <div className="text-gray-600">In Review</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-green-600 font-semibold text-lg">{summaryData.approvedTransfers}</div>
                <div className="text-gray-600">Approved</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-gray-600 font-semibold text-lg">{summaryData.rejectedTransfers}</div>
                <div className="text-gray-600">Rejected</div>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-gray-600">Monthly Transfers</span>
              <span className="font-semibold text-blue-600">{summaryData.monthlyTransfers}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaList className="mr-2 text-teal-600" /> Quick Actions
            </h4>
            <ul className="divide-y divide-gray-200">
              <li>
                <Link 
                  to="/inspector-dashboard/prisons" 
                  className="flex items-center py-3 px-1 hover:bg-gray-50 rounded transition-colors duration-200"
                >
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <FaLandmark className="text-blue-600 text-sm" />
                  </div>
                  <span>Manage Prisons</span>
                  <FaChevronRight className="ml-auto text-gray-400" />
                </Link>
              </li>
              <li>
                <Link 
                  to="/inspector-dashboard/notices" 
                  className="flex items-center py-3 px-1 hover:bg-gray-50 rounded transition-colors duration-200"
                >
                  <div className="bg-orange-100 p-2 rounded-full mr-3">
                    <FaBullhorn className="text-orange-600 text-sm" />
                  </div>
                  <span>Manage Notices</span>
                  <FaChevronRight className="ml-auto text-gray-400" />
                </Link>
              </li>
              <li>
                <Link 
                  to="/inspector-dashboard/add-prison" 
                  className="flex items-center py-3 px-1 hover:bg-gray-50 rounded transition-colors duration-200"
                >
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <FaUsers className="text-green-600 text-sm" />
                  </div>
                  <span>Add New Prison</span>
                  <FaChevronRight className="ml-auto text-gray-400" />
                </Link>
              </li>
              <li>
                <Link 
                  to="/inspector-dashboard/add-notice" 
                  className="flex items-center py-3 px-1 hover:bg-gray-50 rounded transition-colors duration-200"
                >
                  <div className="bg-purple-100 p-2 rounded-full mr-3">
                    <FaClipboardList className="text-purple-600 text-sm" />
                  </div>
                  <span>Create New Notice</span>
                  <FaChevronRight className="ml-auto text-gray-400" />
                </Link>
              </li>
              <li>
                <Link 
                  to="/inspector-dashboard/help" 
                  className="flex items-center py-3 px-1 hover:bg-gray-50 rounded transition-colors duration-200"
                >
                  <div className="bg-amber-100 p-2 rounded-full mr-3">
                    <FaQuestion className="text-amber-600 text-sm" />
                  </div>
                  <span>Get Help</span>
                  <FaChevronRight className="ml-auto text-gray-400" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Pie Chart Summary with Responsive Legend */}
          <div className="mt-12 p-6 bg-white rounded-lg shadow-md flex flex-col items-center">
            <h4 className="text-xl font-semibold text-gray-800 text-center mb-6 flex items-center">
              <FaChartBar className="mr-2 text-teal-600" /> Summary Statistics
            </h4>

            {/* Ensure proper width and height for the pie chart */}
            <div className="w-full max-w-4xl flex justify-center">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx={isMobile ? "50%" : "30%"}
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                    ))}
                  </Pie>

                  <Tooltip />

                  <Legend
                    layout={isMobile ? "horizontal" : "vertical"}
                    align={isMobile ? "center" : "right"}
                    verticalAlign={isMobile ? "bottom" : "middle"}
                    wrapperStyle={isMobile ? { marginTop: "20px" } : {}}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectorSummary;
