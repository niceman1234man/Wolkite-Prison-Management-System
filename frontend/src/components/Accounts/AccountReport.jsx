import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axiosInstance from "../../utils/axiosInstance.js";

import useNotices from "../../hooks/useNotice.jsx"; // 🛠️ Import the custom notice hook
import { useSelector } from "react-redux";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"; // Import recharts components

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [deactivatedCount, setDeactivatedCount] = useState(0);
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [deactivatedVisitors, setDeactivatedVisitors] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // Track mobile view
  const [selectedReport, setSelectedReport] = useState(null); // Track selected report type

  // Get sidebar state from Redux
  const isSidebarCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  // 🛠️ Use the custom hook to fetch and manage notices
  const { notices, isModalOpen, setIsModalOpen, markNoticeAsRead } = useNotices();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/user/getAlluser");
        if (response.data && response.data.user) {
          let userNo = 1;
          let visitorNo = 1;

          // Process Non-Visitor Users
          const usersData = response.data.user
            .filter((user) => user.role !== "visitor")
            .map((user) => ({
              U_no: userNo++, // Increment user number
              _id: user._id,
              firstName: user.firstName,
              middleName: user.middleName,
              lastName: user.lastName,
              email: user.email,
              gender: user.gender,
              role: user.role,
              status: user.isactivated ? "Active" : "Deactivated",
            }));

          // Process Visitor Users
          const visitorsData = response.data.user
            .filter((user) => user.role === "visitor")
            .map((user) => ({
              V_no: visitorNo++, // Increment visitor number
              _id: user._id,
              firstName: user.firstName,
              middleName: user.middleName,
              lastName: user.lastName,
              email: user.email,
              gender: user.gender,
              role: user.role,
              status: user.isactivated ? "Active" : "Deactivated",
            }));

          setUsers(usersData);
          setVisitors(visitorsData);
          setFilteredUsers(usersData);
          setFilteredVisitors(visitorsData);

          setActiveCount(usersData.filter((user) => user.status === "Active").length);
          setDeactivatedCount(usersData.filter((user) => user.status === "Deactivated").length);
          setActiveVisitors(visitorsData.filter((user) => user.status === "Active").length);
          setDeactivatedVisitors(visitorsData.filter((user) => user.status === "Deactivated").length);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleFilterUsers = (e) => {
    const query = e.target.value.toLowerCase();
    setFilteredUsers(users.filter((user) => user.firstName.toLowerCase().includes(query)));
  };

  const handleFilterVisitors = (e) => {
    const query = e.target.value.toLowerCase();
    setFilteredVisitors(visitors.filter((visitor) => visitor.firstName.toLowerCase().includes(query)));
  };

  const generatePDF = (data, title) => {
    const doc = new jsPDF();
    doc.text(title, 14, 10);

    const tableColumn = ["No", "First Name", "Middle Name", "Last Name", "Email", "Gender", "Role", "Status"];
    const tableRows = data.map((user) => [
      user.U_no || user.V_no,
      user.firstName,
      user.middleName,
      user.lastName,
      user.email,
      user.gender,
      user.role,
      user.status,
    ]);

    doc.autoTable({ head: [tableColumn], body: tableRows });

    // Add counts at the bottom of the PDF
    doc.text(`Total Active: ${activeCount}`, 14, doc.autoTable.previous.finalY + 10);
    doc.text(`Total Deactivated: ${deactivatedCount}`, 14, doc.autoTable.previous.finalY + 20);

    doc.save(`${title}.pdf`);
  };

  const columns = [
    { name: "No", selector: (row) => row.U_no || row.V_no, sortable: true },
    { name: "First Name", selector: (row) => row.firstName, sortable: true },
    { name: "Middle Name", selector: (row) => row.middleName, sortable: true },
    { name: "Last Name", selector: (row) => row.lastName, sortable: true },
    { name: "Email", selector: (row) => row.email, sortable: true },
    { name: "Gender", selector: (row) => row.gender, sortable: true },
    { name: "Role", selector: (row) => row.role, sortable: true },
    { name: "Status", selector: (row) => row.status, sortable: true },
  ];

  // Data for the pie chart
  const pieChartData = [
    { name: "Active Users", value: activeCount },
    { name: "Deactivated Users", value: deactivatedCount },
    { name: "Active Visitors", value: activeVisitors },
    { name: "Deactivated Visitors", value: deactivatedVisitors },
  ];

  // Colors for the pie chart
  const COLORS = ["#00C49F", "#FF8042", "#0088FE", "#FFBB28"];

  return (
    <div className="flex">
      {/* Sidebar Spacing Fix */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? "w-16" : "w-64"}`} />

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Responsive Fixed Header */}
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex justify-between items-center transition-all duration-300 ml-2 ${
            isSidebarCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          <h3 className="text-2xl font-bold text-gray-800 text-center">
           Manage Reports
          </h3>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            <input
              type="text"
              placeholder="Search users by first name"
              className="px-4 py-2 border rounded-md w-full sm:w-auto"
              onChange={handleFilterUsers}
            />
       
          </div>
        </div>

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-24">
          {/* Report Selection Step */}
          {!selectedReport && (
            <div className="flex flex-col mt-10 items-center justify-center space-y-4">
              <h3 className="text-2xl font-bold mb-4">Select Report Type</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedReport("user")}
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  User Report
                </button>
                <button
                  onClick={() => setSelectedReport("visitor")}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Visitor Report
                </button>
              </div>

              {/* Pie Chart */}
              <div className="mt-8 w-full max-w-2xl">
                <h3 className="text-xl font-bold text-center mb-4">Account Summary</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* User Report */}
          {selectedReport === "user" && (
            <div className="mt-16">
              <div className="flex gap-6 mb-4 mt-10">
                <div className="flex flex-wrap gap-2 mb-4">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md">
                    Active Users: {activeCount}
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-md">
                    Deactivated Users: {deactivatedCount}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <CSVLink
                    data={filteredUsers}
                    filename="User_Report.csv"
                    className="px-4 py-2 bg-purple-600 text-white rounded-md text-center"
                  >
                    Export Users CSV
                  </CSVLink>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-md"
                    onClick={() => generatePDF(filteredUsers, "User Report")}
                  >
                    Export Users PDF
                  </button>
                </div>
              </div>

              <DataTable
                columns={columns}
                data={filteredUsers}
                pagination
                progressPending={loading}
                responsive={true} // Enable responsive mode for DataTable
              />
            </div>
          )}

          {/* Visitor Report */}
          {selectedReport === "visitor" && (
            <div className="mb-4">
              <h3 className="text-xl font-bold mt-8">Visitor Account</h3>
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search visitors by first name"
                  className="px-4 py-2 border rounded-md w-full sm:w-auto"
                  onChange={handleFilterVisitors}
                />
              </div>
                 <div className="flex gap-6 mb-4 mt-10">
              <div className="flex flex-wrap gap-2 mb-4">
                <button className="px-4 py-2 bg-green-600 text-white rounded-md">
                  Active Visitors: {activeVisitors}
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-md">
                  Deactivated Visitors: {deactivatedVisitors}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <CSVLink
                  data={filteredVisitors}
                  filename="Visitor_Report.csv"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md text-center"
                >
                  Export Visitors CSV
                </CSVLink>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md"
                  onClick={() => generatePDF(filteredVisitors, "Visitor Report")}
                >
                  Export Visitors PDF
                </button>
              </div>
              </div>
              <DataTable
                columns={columns}
                data={filteredVisitors}
                pagination
                progressPending={loading}
                responsive={true} // Enable responsive mode for DataTable
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserList;