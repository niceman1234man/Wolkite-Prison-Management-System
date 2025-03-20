import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux"; // Import useSelector for sidebar state

const Reports = () => {
  const [dailyIntakeData, setDailyIntakeData] = useState([]);
  const [transferStats, setTransferStats] = useState({});
  const [loading, setLoading] = useState(false);

  // Get sidebar state from Redux
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch daily intake data
      const intakeResponse = await axiosInstance.get("/reports/daily-intake", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (intakeResponse.data?.dailyIntake) {
        setDailyIntakeData(intakeResponse.data.dailyIntake);
      }

      // Fetch transfer statistics
      const transferResponse = await axiosInstance.get("/reports/transfer-stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (transferResponse.data?.transferStats) {
        setTransferStats(transferResponse.data.transferStats);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to fetch reports.");
    } finally {
      setLoading(false);
    }
  };

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
          <h3 className="text-2xl font-bold text-gray-800 text-center">Reports & Analytics</h3>
        </div>

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-24">
          {loading ? (
            <p className="text-center">Loading reports...</p>
          ) : (
            <div className="space-y-8">
              {/* Daily Intake Report */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Daily Intake Report</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyIntakeData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="intakeCount" fill="#4F46E5" name="Prisoners Received" />
                    <Bar dataKey="transferCount" fill="#10B981" name="Prisoners Transferred" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Transfer Statistics */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Transfer Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <h4 className="text-lg font-semibold">Success Rate</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {transferStats.successRate || "N/A"}%
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <h4 className="text-lg font-semibold">Average Delay</h4>
                    <p className="text-2xl font-bold text-yellow-600">
                      {transferStats.averageDelay || "N/A"} hours
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <h4 className="text-lg font-semibold">Total Transfers</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {transferStats.totalTransfers || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Legal Compliance */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Legal Compliance</h3>
                <div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <p className="text-lg">
                    {transferStats.complianceStatus === "Compliant" ? (
                      <span className="text-green-600 font-bold">Compliant with 48-hour rule</span>
                    ) : (
                      <span className="text-red-600 font-bold">Non-compliant with 48-hour rule</span>
                    )}
                  </p>
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