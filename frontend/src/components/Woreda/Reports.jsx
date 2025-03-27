import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux"; // Import useSelector for sidebar state
import {
  FaUsers,
  FaExchangeAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444"];

const Reports = () => {
  const [dailyIntakeData, setDailyIntakeData] = useState([]);
  const [transferStats, setTransferStats] = useState({
    totalPrisoners: 0,
    successRate: 0,
    averageDelay: 0,
    complianceRate: 0,
    completedTransfers: 0,
    pendingTransfers: 0,
    inProgressTransfers: 0,
    failedTransfers: 0,
    complianceStatus: "Non-compliant",
  });
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("week"); // 'week', 'month', 'year'

  // Get sidebar state from Redux
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  useEffect(() => {
    fetchReports();
  }, [timeRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch daily intake data
      const intakeResponse = await axiosInstance.get(
        `/api/reports/daily-intake?range=${timeRange}`
      );

      // Format daily intake data
      if (intakeResponse.data?.dailyIntake) {
        const formattedData = intakeResponse.data.dailyIntake.map((item) => ({
          date: new Date(item.date).toLocaleDateString(),
          intakeCount: parseInt(item.intakeCount) || 0,
          transferCount: parseInt(item.transferCount) || 0,
        }));
        setDailyIntakeData(formattedData);
      }

      // Fetch transfer statistics
      const statsResponse = await axiosInstance.get(
        `/api/reports/transfer-stats?range=${timeRange}`
      );

      if (statsResponse.data?.transferStats) {
        setTransferStats(statsResponse.data.transferStats);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, trend }) => (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>{icon}</div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center">
          <span
            className={`text-sm ${
              trend > 0
                ? "text-green-500"
                : trend < 0
                ? "text-red-500"
                : "text-gray-500"
            }`}
          >
            {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"} {Math.abs(trend)}% from
            last period
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex">
      {/* Sidebar Spacing Fix */}
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      />

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Responsive Fixed Header */}
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex justify-between items-center transition-all duration-300 ml-2 ${
            isCollapsed
              ? "left-16 w-[calc(100%-5rem)]"
              : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          <h3 className="text-2xl font-bold text-gray-800">
            Reports & Analytics
          </h3>
          <div className="flex gap-2">
            {["week", "month", "year"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-32">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Prisoners"
                  value={transferStats.totalPrisoners || "0"}
                  icon={<FaUsers className="text-blue-600 text-xl" />}
                  color="text-blue-600"
                  trend={transferStats.prisonerTrend}
                />
                <StatCard
                  title="Transfer Rate"
                  value={`${transferStats.successRate || "0"}%`}
                  icon={<FaExchangeAlt className="text-green-600 text-xl" />}
                  color="text-green-600"
                  trend={transferStats.transferRateTrend}
                />
                <StatCard
                  title="Avg. Processing Time"
                  value={`${transferStats.averageDelay || "0"}h`}
                  icon={<FaClock className="text-yellow-600 text-xl" />}
                  color="text-yellow-600"
                  trend={transferStats.processingTimeTrend}
                />
                <StatCard
                  title="Compliance Rate"
                  value={`${transferStats.complianceRate || "0"}%`}
                  icon={<FaCheckCircle className="text-purple-600 text-xl" />}
                  color="text-purple-600"
                  trend={transferStats.complianceTrend}
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Daily Intake Chart */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Daily Intake Trends
                  </h3>
                  <div className="h-[300px]">
                    {dailyIntakeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyIntakeData}>
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="intakeCount"
                            stroke="#4F46E5"
                            name="New Intakes"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="transferCount"
                            stroke="#10B981"
                            name="Transfers"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transfer Status Distribution */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Transfer Status Distribution
                  </h3>
                  <div className="h-[300px]">
                    {transferStats.completedTransfers > 0 ||
                    transferStats.pendingTransfers > 0 ||
                    transferStats.inProgressTransfers > 0 ||
                    transferStats.failedTransfers > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Completed",
                                value: transferStats.completedTransfers,
                              },
                              {
                                name: "Pending",
                                value: transferStats.pendingTransfers,
                              },
                              {
                                name: "In Progress",
                                value: transferStats.inProgressTransfers,
                              },
                              {
                                name: "Failed",
                                value: transferStats.failedTransfers,
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              transferStats.completedTransfers,
                              transferStats.pendingTransfers,
                              transferStats.inProgressTransfers,
                              transferStats.failedTransfers,
                            ].map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">
                          No transfer data available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Compliance Status */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">
                  Legal Compliance Status
                </h3>
                <div className="flex items-center gap-4">
                  {transferStats.complianceStatus === "Compliant" ? (
                    <>
                      <FaCheckCircle className="text-green-500 text-3xl" />
                      <div>
                        <p className="text-green-600 font-semibold">
                          Compliant with 48-hour rule
                        </p>
                        <p className="text-gray-500 text-sm">
                          All transfers are being processed within the required
                          timeframe
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <FaExclamationCircle className="text-red-500 text-3xl" />
                      <div>
                        <p className="text-red-600 font-semibold">
                          Non-compliant with 48-hour rule
                        </p>
                        <p className="text-gray-500 text-sm">
                          Some transfers are exceeding the required timeframe
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
