import React, { useEffect, useState } from "react";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axiosInstance from "../../utils/axiosInstance.js";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  FaFilePdf, FaFileCsv, FaPrint, FaChartBar, FaUserShield, 
  FaClipboardList, FaGavel, FaChartLine, FaExclamationTriangle,
  FaExchangeAlt, FaUserClock, FaCheckCircle, FaUsers
} from "react-icons/fa";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const SecurityStaffReport = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [reportData, setReportData] = useState({
    staffStats: {
      total: 0,
      active: 0,
      inactive: 0,
      onDuty: 0,
      offDuty: 0,
      shifts: { morning: 0, afternoon: 0, night: 0 }
    },
    transferStats: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      in_review: 0,
      recentTransfers: []
    },
    paroleStats: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      recentParoles: []
    },
    courtStats: {
      total: 0,
      pending: 0,
      completed: 0,
      upcoming: 0,
      recentInstructions: []
    },
    inmateStats: {
      total: 0,
      active: 0,
      released: 0,
      byCategory: {},
      recentInmates: []
    },
    clearanceStats: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      recentClearances: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Initialize data structure with default values
      let reportDataTemp = {
        staffStats: {
          total: 0,
          active: 0,
          inactive: 0,
          onDuty: 0,
          offDuty: 0,
          shifts: { morning: 0, afternoon: 0, night: 0 }
        },
        transferStats: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          in_review: 0,
          recentTransfers: []
        },
        paroleStats: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          recentParoles: []
        },
        courtStats: {
          total: 0,
          pending: 0,
          completed: 0,
          upcoming: 0,
          recentInstructions: []
        },
        inmateStats: {
          total: 0,
          active: 0,
          released: 0,
          byCategory: {},
          recentInmates: []
        },
        clearanceStats: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          recentClearances: []
        }
      };

      try {
        // Fetch staff data
        const staffResponse = await axiosInstance.get("/user/getAlluser");
        if (staffResponse.data?.user) {
          const securityStaff = staffResponse.data.user.filter(user => 
            user.role === "securityStaff" || user.role === "SecurityStaff"
          );
          reportDataTemp.staffStats = processStaffData(securityStaff);
        }
      } catch (error) {
        console.error("Error fetching staff data:", error);
      }
      
      try {
        // Fetch transfer requests - updated to match TransferRequests component
        const transferResponse = await axiosInstance.get("/transfer/getall-transfers");
        if (transferResponse.data?.data) {
          const processedTransfers = transferResponse.data.data.map(transfer => ({
            ...transfer,
            transferDate: transfer.transferDate ? new Date(transfer.transferDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            createdAt: transfer.createdAt ? new Date(transfer.createdAt).toISOString().split('T')[0] : null,
            status: transfer.status?.toLowerCase() || 'pending'
          }));
          reportDataTemp.transferStats = processTransferData(processedTransfers);
        }
      } catch (error) {
        console.error("Error fetching transfer data:", error);
      }
      
      try {
        // Fetch parole requests
        const paroleResponse = await axiosInstance.get("/parole/getAll");
        if (paroleResponse.data?.paroles) {
          reportDataTemp.paroleStats = processParoleData(paroleResponse.data.paroles);
        }
      } catch (error) {
        console.error("Error fetching parole data:", error);
      }
      
      try {
        // Fetch court instructions
        const courtResponse = await axiosInstance.get("/court/getAll");
        if (courtResponse.data?.instructions) {
          reportDataTemp.courtStats = processCourtData(courtResponse.data.instructions);
        }
      } catch (error) {
        console.error("Error fetching court data:", error);
      }
      
      try {
        // Fetch inmates
        const inmatesResponse = await axiosInstance.get("/inmate/getAll");
        if (inmatesResponse.data?.inmates) {
          reportDataTemp.inmateStats = processInmateData(inmatesResponse.data.inmates);
        }
      } catch (error) {
        console.error("Error fetching inmate data:", error);
      }

      try {
        // Fetch clearance requests
        const clearanceResponse = await axiosInstance.get("/clearance/getAll");
        if (clearanceResponse.data?.clearances) {
          reportDataTemp.clearanceStats = processClearanceData(clearanceResponse.data.clearances);
        }
      } catch (error) {
        console.error("Error fetching clearance data:", error);
      }

      // Update state with all available data
      setReportData(reportDataTemp);
      setError(null);

    } catch (error) {
      console.error("Error fetching report data:", error);
      setError("Some data might be unavailable. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update data processing functions to handle potential null/undefined values
  const processStaffData = (staff = []) => ({
    total: staff.length,
    active: staff.filter(s => s?.isactivated === true).length,
    inactive: staff.filter(s => s?.isactivated === false).length,
    onDuty: staff.filter(s => s?.status?.toLowerCase() === 'on-duty').length,
    offDuty: staff.filter(s => s?.status?.toLowerCase() !== 'on-duty').length,
    shifts: {
      morning: staff.filter(s => s?.shift?.toLowerCase() === 'morning').length,
      afternoon: staff.filter(s => s?.shift?.toLowerCase() === 'afternoon').length,
      night: staff.filter(s => s?.shift?.toLowerCase() === 'night').length
    }
  });

  const processTransferData = (transfers = []) => ({
    total: transfers.length,
    pending: transfers.filter(t => t?.status?.toLowerCase() === 'pending').length,
    approved: transfers.filter(t => t?.status?.toLowerCase() === 'approved' || t?.status?.toLowerCase() === 'accepted').length,
    rejected: transfers.filter(t => t?.status?.toLowerCase() === 'rejected').length,
    in_review: transfers.filter(t => t?.status?.toLowerCase() === 'in_review').length,
    recentTransfers: transfers.slice(0, 5).map(t => ({
      inmateName: t.inmateData ? `${t.inmateData.firstName || ''} ${t.inmateData.middleName || ''} ${t.inmateData.lastName || ''}`.trim() : 'N/A',
      fromPrison: t.fromPrison || 'N/A',
      toPrison: t.toPrison || 'N/A',
      status: t.status || 'pending',
      date: t.transferDate ? new Date(t.transferDate).toLocaleDateString() : 'N/A',
      reason: t.reason || 'N/A'
    }))
  });

  const processParoleData = (paroles = []) => ({
    total: paroles.length,
    pending: paroles.filter(p => p?.status?.toLowerCase() === 'pending').length,
    approved: paroles.filter(p => p?.status?.toLowerCase() === 'approved').length,
    rejected: paroles.filter(p => p?.status?.toLowerCase() === 'rejected').length,
    recentParoles: paroles.slice(0, 5).map(p => ({
      inmateName: p.inmateName || p.fullName || 'N/A',
      status: p.status || 'pending',
      requestDate: p.requestDate ? new Date(p.requestDate).toLocaleDateString() : 'N/A',
      eligibilityDate: p.paroleDate ? new Date(p.paroleDate).toLocaleDateString() : 'N/A'
    }))
  });

  const processCourtData = (instructions = []) => ({
    total: instructions.length,
    pending: instructions.filter(i => i?.status?.toLowerCase() === 'pending').length,
    completed: instructions.filter(i => i?.status?.toLowerCase() === 'completed').length,
    upcoming: instructions.filter(i => i.effectiveDate && new Date(i.effectiveDate) > new Date()).length,
    recentInstructions: instructions.slice(0, 5).map(i => ({
      title: i.title || 'No Title',
      status: i.status || 'pending',
      effectiveDate: i.effectiveDate ? new Date(i.effectiveDate).toLocaleDateString() : 'N/A',
      sendDate: i.sendDate ? new Date(i.sendDate).toLocaleDateString() : 'N/A'
    }))
  });

  const processInmateData = (inmates = []) => {
    const inmateCategories = {};
    inmates.forEach(inmate => {
      const category = inmate?.caseType || 'Uncategorized';
      inmateCategories[category] = (inmateCategories[category] || 0) + 1;
    });

    return {
      total: inmates.length,
      active: inmates.filter(i => i?.status?.toLowerCase() === 'active').length,
      released: inmates.filter(i => i?.status?.toLowerCase() === 'released').length,
      byCategory: inmateCategories,
      recentInmates: inmates.slice(0, 5).map(i => ({
        name: `${i.firstName || ''} ${i.lastName || ''}`.trim() || 'N/A',
        caseType: i.caseType || 'Uncategorized',
        status: i.status || 'Unknown',
        admissionDate: i.createdAt ? new Date(i.createdAt).toLocaleDateString() : 'N/A'
      }))
    };
  };

  const processClearanceData = (clearances = []) => ({
    total: clearances.length,
    pending: clearances.filter(c => c?.status?.toLowerCase() === 'pending').length,
    approved: clearances.filter(c => c?.status?.toLowerCase() === 'approved').length,
    rejected: clearances.filter(c => c?.status?.toLowerCase() === 'rejected').length,
    recentClearances: clearances.slice(0, 5).map(c => ({
      inmateName: c.inmateData ? `${c.inmateData.firstName || ''} ${c.inmateData.middleName || ''} ${c.inmateData.lastName || ''}`.trim() : 'N/A',
      requestDate: c.requestDate ? new Date(c.requestDate).toLocaleDateString() : 'N/A',
      status: c.status || 'pending',
      reason: c.reason || 'N/A'
    }))
  });

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add title and date
    doc.setFontSize(18);
    doc.text("Security Staff Comprehensive Report", 14, 15);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);

    // Add staff statistics
    doc.setFontSize(14);
    doc.text("Staff Overview", 14, 35);
    const staffData = [
      ["Total Staff", reportData.staffStats.total],
      ["Active Staff", reportData.staffStats.active],
      ["On Duty", reportData.staffStats.onDuty],
      ["Off Duty", reportData.staffStats.offDuty]
    ];
    doc.autoTable({
      startY: 40,
      head: [["Category", "Count"]],
      body: staffData,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 3 }
    });

    // Add transfer statistics
    doc.text("Transfer Requests", 14, doc.lastAutoTable.finalY + 15);
    const transferData = [
      ["Total Transfers", reportData.transferStats.total],
      ["Pending", reportData.transferStats.pending],
      ["In Review", reportData.transferStats.in_review],
      ["Approved", reportData.transferStats.approved],
      ["Rejected", reportData.transferStats.rejected]
    ];
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Category", "Count"]],
      body: transferData,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 3 }
    });

    // Add parole statistics
    doc.text("Parole Requests", 14, doc.lastAutoTable.finalY + 15);
    const paroleData = [
      ["Total Requests", reportData.paroleStats.total],
      ["Pending", reportData.paroleStats.pending],
      ["Approved", reportData.paroleStats.approved],
      ["Rejected", reportData.paroleStats.rejected]
    ];
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Category", "Count"]],
      body: paroleData,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 3 }
    });

    doc.save("Security_Staff_Report.pdf");
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const reportTabs = [
    { id: 'overview', label: 'Overview Report', icon: <FaChartBar /> },
    { id: 'staff', label: 'Staff Reports', icon: <FaUserShield /> },
    { id: 'transfers', label: 'Transfer Reports', icon: <FaExchangeAlt /> },
    { id: 'parole', label: 'Parole Reports', icon: <FaUserClock /> },
    { id: 'court', label: 'Court Reports', icon: <FaGavel /> },
    { id: 'inmates', label: 'Inmate Reports', icon: <FaUsers /> },
    { id: 'clearance', label: 'Clearance Reports', icon: <FaCheckCircle /> }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        {error}
      </div>
    );
  }

  const renderOverviewTab = () => (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Staff</p>
              <h3 className="text-2xl font-bold text-teal-600">{reportData.staffStats.total}</h3>
            </div>
            <FaUserShield className="text-3xl text-teal-200" />
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Active</span>
              <span className="font-medium text-gray-700">{reportData.staffStats.active}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">On Duty</span>
              <span className="font-medium text-gray-700">{reportData.staffStats.onDuty}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Transfer Requests</p>
              <h3 className="text-2xl font-bold text-blue-600">{reportData.transferStats.total}</h3>
            </div>
            <FaExchangeAlt className="text-3xl text-blue-200" />
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pending</span>
              <span className="font-medium text-gray-700">{reportData.transferStats.pending}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">In Review</span>
              <span className="font-medium text-gray-700">{reportData.transferStats.in_review}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Approved</span>
              <span className="font-medium text-gray-700">{reportData.transferStats.approved}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Rejected</span>
              <span className="font-medium text-gray-700">{reportData.transferStats.rejected}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Parole Requests</p>
              <h3 className="text-2xl font-bold text-green-600">{reportData.paroleStats.total}</h3>
            </div>
            <FaUserClock className="text-3xl text-green-200" />
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pending</span>
              <span className="font-medium text-gray-700">{reportData.paroleStats.pending}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Approved</span>
              <span className="font-medium text-gray-700">{reportData.paroleStats.approved}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Staff Distribution Chart */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Staff Shift Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Morning", value: reportData.staffStats.shifts.morning },
                    { name: "Afternoon", value: reportData.staffStats.shifts.afternoon },
                    { name: "Night", value: reportData.staffStats.shifts.night }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(reportData.staffStats.shifts).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inmate Categories Chart */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Inmate Categories</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(reportData.inmateStats.byCategory).map(([category, count]) => ({
                  category,
                  count
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Activities</h3>
        <div className="space-y-4">
          {reportData.transferStats.recentTransfers.map((transfer, index) => (
            <div key={`transfer-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FaExchangeAlt className="text-blue-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-800">{transfer.inmateName}</p>
                  <p className="text-sm text-gray-500">Transfer: {transfer.fromPrison} → {transfer.toPrison}</p>
                  <p className="text-xs text-gray-500 mt-1">Reason: {transfer.reason}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  transfer.status === 'approved' || transfer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  transfer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  transfer.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                </span>
                <p className="text-xs text-gray-500 mt-1">{transfer.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderStaffTab = () => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Staff Overview Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Staff Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Staff</span>
              <span className="font-semibold text-teal-600">{reportData.staffStats.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Staff</span>
              <span className="font-semibold text-green-600">{reportData.staffStats.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Inactive Staff</span>
              <span className="font-semibold text-red-600">{reportData.staffStats.inactive}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">On Duty</span>
              <span className="font-semibold text-blue-600">{reportData.staffStats.onDuty}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Off Duty</span>
              <span className="font-semibold text-gray-600">{reportData.staffStats.offDuty}</span>
            </div>
          </div>
        </div>

        {/* Shift Distribution Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Shift Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Morning", value: reportData.staffStats.shifts.morning },
                    { name: "Afternoon", value: reportData.staffStats.shifts.afternoon },
                    { name: "Night", value: reportData.staffStats.shifts.night }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(reportData.staffStats.shifts).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );

  const renderTransferTab = () => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Transfer Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Transfer Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Transfers</span>
              <span className="font-semibold text-blue-600">{reportData.transferStats.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">{reportData.transferStats.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">In Review</span>
              <span className="font-semibold text-orange-600">{reportData.transferStats.in_review}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Approved</span>
              <span className="font-semibold text-green-600">{reportData.transferStats.approved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rejected</span>
              <span className="font-semibold text-red-600">{reportData.transferStats.rejected}</span>
            </div>
          </div>
        </div>

        {/* Recent Transfers */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Transfers</h3>
          <div className="space-y-4">
            {reportData.transferStats.recentTransfers.map((transfer, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">{transfer.inmateName}</p>
                    <p className="text-sm text-gray-600">{transfer.fromPrison} → {transfer.toPrison}</p>
                    <p className="text-xs text-gray-500 mt-1">Reason: {transfer.reason}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      transfer.status === 'approved' || transfer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      transfer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      transfer.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{transfer.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const renderParoleTab = () => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Parole Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Parole Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Requests</span>
              <span className="font-semibold text-blue-600">{reportData.paroleStats.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">{reportData.paroleStats.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Approved</span>
              <span className="font-semibold text-green-600">{reportData.paroleStats.approved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rejected</span>
              <span className="font-semibold text-red-600">{reportData.paroleStats.rejected}</span>
            </div>
          </div>
        </div>

        {/* Recent Parole Requests */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Parole Requests</h3>
          <div className="space-y-4">
            {reportData.paroleStats.recentParoles.map((parole, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">{parole.inmateName}</p>
                    <p className="text-sm text-gray-600">Request Date: {parole.requestDate}</p>
                    <p className="text-xs text-gray-500 mt-1">Eligibility: {parole.eligibilityDate}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      parole.status === 'approved' ? 'bg-green-100 text-green-800' :
                      parole.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {parole.status.charAt(0).toUpperCase() + parole.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const renderCourtTab = () => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Court Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Court Instructions</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Instructions</span>
              <span className="font-semibold text-blue-600">{reportData.courtStats.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">{reportData.courtStats.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">{reportData.courtStats.completed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Upcoming</span>
              <span className="font-semibold text-purple-600">{reportData.courtStats.upcoming}</span>
            </div>
          </div>
        </div>

        {/* Recent Court Instructions */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Instructions</h3>
          <div className="space-y-4">
            {reportData.courtStats.recentInstructions.map((instruction, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">{instruction.title}</p>
                    <p className="text-sm text-gray-600">Effective: {instruction.effectiveDate}</p>
                    <p className="text-xs text-gray-500 mt-1">Sent: {instruction.sendDate}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      instruction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      instruction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {instruction.status.charAt(0).toUpperCase() + instruction.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const renderInmatesTab = () => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Inmate Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Inmate Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Inmates</span>
              <span className="font-semibold text-blue-600">{reportData.inmateStats.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active</span>
              <span className="font-semibold text-green-600">{reportData.inmateStats.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Released</span>
              <span className="font-semibold text-gray-600">{reportData.inmateStats.released}</span>
            </div>
          </div>
        </div>

        {/* Inmate Categories Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Categories Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(reportData.inmateStats.byCategory).map(([category, count]) => ({
                  category,
                  count
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Inmates */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Inmates</h3>
        <div className="space-y-4">
          {reportData.inmateStats.recentInmates.map((inmate, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800">{inmate.name}</p>
                  <p className="text-sm text-gray-600">Case Type: {inmate.caseType}</p>
                  <p className="text-xs text-gray-500 mt-1">Admitted: {inmate.admissionDate}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    inmate.status === 'active' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {inmate.status.charAt(0).toUpperCase() + inmate.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderClearanceTab = () => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Clearance Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Clearance Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Requests</span>
              <span className="font-semibold text-blue-600">{reportData.clearanceStats.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">{reportData.clearanceStats.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Approved</span>
              <span className="font-semibold text-green-600">{reportData.clearanceStats.approved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rejected</span>
              <span className="font-semibold text-red-600">{reportData.clearanceStats.rejected}</span>
            </div>
          </div>
        </div>

        {/* Recent Clearance Requests */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Clearance Requests</h3>
          <div className="space-y-4">
            {reportData.clearanceStats.recentClearances.map((clearance, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">{clearance.inmateName}</p>
                    <p className="text-sm text-gray-600">Request Date: {clearance.requestDate}</p>
                    <p className="text-xs text-gray-500 mt-1">Reason: {clearance.reason}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      clearance.status === 'approved' ? 'bg-green-100 text-green-800' :
                      clearance.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {clearance.status.charAt(0).toUpperCase() + clearance.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className={`transition-all duration-300 ${
      isCollapsed ? 'ml-16' : 'ml-64'
    } mt-12`}>
      {/* Fixed Header Section */}
      <div className="fixed top-12 right-0 z-10 bg-white border-b border-gray-200 shadow-sm transition-all duration-300"
           style={{ width: `calc(100% - ${isCollapsed ? '4rem' : '16rem'})` }}>
        <div className="px-4 md:px-6 py-4">
          {/* Header Content */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Security Staff Reports</h2>
              <p className="text-gray-600 mt-1">Comprehensive overview of security operations</p>
            </div>
            
            <div className="flex flex-wrap gap-2 md:gap-4">
              <button
                onClick={generatePDF}
                className="flex items-center px-3 md:px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-300 text-sm md:text-base"
              >
                <FaFilePdf className="mr-2" /> Export PDF
              </button>
              
              <CSVLink 
                data={[]}
                filename={"security_staff_report.csv"}
                className="flex items-center px-3 md:px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-300 text-sm md:text-base"
              >
                <FaFileCsv className="mr-2" /> Export CSV
              </CSVLink>
              
              <button
                onClick={() => window.print()}
                className="flex items-center px-3 md:px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-300 text-sm md:text-base"
              >
                <FaPrint className="mr-2" /> Print
              </button>
            </div>
          </div>

          {/* Report Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap -mb-px">
              {reportTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                    activeTab === tab.id 
                      ? 'border-teal-500 text-teal-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span className="ml-2">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="pt-48 px-4 md:px-6"> {/* Add padding-top to account for fixed header */}
        <div className="space-y-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'staff' && renderStaffTab()}
          {activeTab === 'transfers' && renderTransferTab()}
          {activeTab === 'parole' && renderParoleTab()}
          {activeTab === 'court' && renderCourtTab()}
          {activeTab === 'inmates' && renderInmatesTab()}
          {activeTab === 'clearance' && renderClearanceTab()}
        </div>
      </div>
    </div>
  );
};

export default SecurityStaffReport;