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
import { useSelector } from "react-redux";
import {
  FaUsers,
  FaExchangeAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaUserFriends,
  FaUserCheck,
  FaExclamationTriangle,
  FaFileAlt,
  FaMale,
  FaFemale,
  FaGavel,
  FaHospital,
} from "react-icons/fa";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444"];

const Reports = () => {
  const [woredaStats, setWoredaStats] = useState({
    totalInmates: 0,
    activeInmates: 0,
    transferRequested: 0,
    transferred: 0,
    maleInmates: 0,
    femaleInmates: 0,
    highRiskInmates: 0,
    mediumRiskInmates: 0,
    lowRiskInmates: 0,
    inmatesWithMedicalConditions: 0,
    paroleEligible: 0,
    averageSentenceLength: 0,
    totalCrimes: 0,
    topCrimes: [],
    inmateTrend: 0,
    riskTrend: 0,
    genderTrend: 0,
    medicalTrend: 0,
  });
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("week"); // 'week', 'month', 'year'

  // Get sidebar state from Redux
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  useEffect(() => {
    fetchWoredaReports();
  }, [timeRange]);

  const fetchWoredaReports = async () => {
    setLoading(true);
    try {
      // Log the token status
      const token = localStorage.getItem("token");
      console.log("Token status:", token ? "Present" : "Missing");
      
      // Fetch woreda statistics
      const response = await axiosInstance.get(
        `/woreda/stats?range=${timeRange}`
      );

      if (response.data?.success && response.data?.stats) {
        setWoredaStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching woreda reports:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        config: error.config
      });
      toast.error(error.response?.data?.error || "Failed to fetch woreda reports");
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
            Woreda Reports & Analytics
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
                  title="Total Inmates"
                  value={woredaStats.totalInmates || "0"}
                  icon={<FaUsers className="text-blue-600 text-xl" />}
                  color="text-blue-600"
                  trend={woredaStats.inmateTrend}
                />
                <StatCard
                  title="Active Inmates"
                  value={woredaStats.activeInmates || "0"}
                  icon={<FaUserCheck className="text-green-600 text-xl" />}
                  color="text-green-600"
                  trend={woredaStats.activeTrend}
                />
                <StatCard
                  title="Transfer Requests"
                  value={woredaStats.transferRequested || "0"}
                  icon={<FaExchangeAlt className="text-yellow-600 text-xl" />}
                  color="text-yellow-600"
                  trend={woredaStats.transferTrend}
                />
                <StatCard
                  title="High Risk Inmates"
                  value={woredaStats.highRiskInmates || "0"}
                  icon={<FaExclamationTriangle className="text-red-600 text-xl" />}
                  color="text-red-600"
                  trend={woredaStats.riskTrend}
                />
              </div>

              {/* Additional Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Male Inmates"
                  value={woredaStats.maleInmates || "0"}
                  icon={<FaMale className="text-indigo-600 text-xl" />}
                  color="text-indigo-600"
                  trend={woredaStats.genderTrend}
                />
                <StatCard
                  title="Female Inmates"
                  value={woredaStats.femaleInmates || "0"}
                  icon={<FaFemale className="text-pink-600 text-xl" />}
                  color="text-pink-600"
                  trend={woredaStats.genderTrend}
                />
                <StatCard
                  title="Medical Conditions"
                  value={woredaStats.inmatesWithMedicalConditions || "0"}
                  icon={<FaHospital className="text-purple-600 text-xl" />}
                  color="text-purple-600"
                  trend={woredaStats.medicalTrend}
                />
                <StatCard
                  title="Parole Eligible"
                  value={woredaStats.paroleEligible || "0"}
                  icon={<FaGavel className="text-emerald-600 text-xl" />}
                  color="text-emerald-600"
                  trend={woredaStats.paroleTrend}
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gender Distribution */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Gender Distribution
                  </h3>
                  <div className="h-[300px]">
                    {woredaStats.totalInmates > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Male",
                                value: woredaStats.maleInmates,
                              },
                              {
                                name: "Female",
                                value: woredaStats.femaleInmates,
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[woredaStats.maleInmates, woredaStats.femaleInmates].map(
                              (_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              )
                            )}
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
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Risk Level Distribution */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Risk Level Distribution
                  </h3>
                  <div className="h-[300px]">
                    {woredaStats.totalInmates > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "High Risk",
                                value: woredaStats.highRiskInmates,
                              },
                              {
                                name: "Medium Risk",
                                value: woredaStats.mediumRiskInmates,
                              },
                              {
                                name: "Low Risk",
                                value: woredaStats.lowRiskInmates,
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
                              woredaStats.highRiskInmates,
                              woredaStats.mediumRiskInmates,
                              woredaStats.lowRiskInmates,
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
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Inmate Status Distribution */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">
                  Inmate Status Distribution
                </h3>
                <div className="h-[300px]">
                  {woredaStats.totalInmates > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: "Active", value: woredaStats.activeInmates },
                        { name: "Transfer Requested", value: woredaStats.transferRequested },
                        { name: "Transferred", value: woredaStats.transferred },
                      ]}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#4F46E5" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">No data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Crimes */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Top Crimes</h3>
                <div className="space-y-4">
                  {woredaStats.topCrimes && woredaStats.topCrimes.length > 0 ? (
                    woredaStats.topCrimes.map((crime, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-600">{crime.name}</span>
                        <span className="font-semibold">{crime.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No crime data available</p>
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
