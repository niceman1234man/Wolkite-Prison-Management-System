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
import { format } from "date-fns";
import { toast } from "react-hot-toast";

const SecurityStaffReport = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [reportData, setReportData] = useState({
    staffStats: {
      total: 0,
      active: 0,
      inactive: 0,
      onDuty: 0,
      offDuty: 0,
      shifts: { morning: 0, afternoon: 0, night: 0 },
      recentStaff: []
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
      sentenceDuration: {},
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
          shifts: { morning: 0, afternoon: 0, night: 0 },
          recentStaff: []
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
          sentenceDuration: {},
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
        const paroleResponse = await axiosInstance.get("/parole-tracking/getall");
        if (paroleResponse.data?.paroles) {
          reportDataTemp.paroleStats = processParoleData(paroleResponse.data.paroles);
        } else if (paroleResponse.data) {
          // Handle alternate API response format
          const paroleData = Array.isArray(paroleResponse.data) ? paroleResponse.data : [];
          reportDataTemp.paroleStats = processParoleData(paroleData);
        }
      } catch (error) {
        console.error("Error fetching parole data:", error);
      }
      
      try {
        // Fetch court instructions
        const courtResponse = await axiosInstance.get("/instruction/all");
        if (courtResponse.data?.instructions) {
          reportDataTemp.courtStats = processCourtData(courtResponse.data.instructions);
        } else if (courtResponse.data) {
          // Handle alternate API response format
          const instructionData = Array.isArray(courtResponse.data) ? courtResponse.data : [];
          reportDataTemp.courtStats = processCourtData(instructionData);
        }
      } catch (error) {
        console.error("Error fetching court data:", error);
      }
      
      try {
        // Fetch inmates
        const inmatesResponse = await axiosInstance.get("/inmates/allInmates");
        if (inmatesResponse.data?.inmates || inmatesResponse.data) {
          const inmatesData = inmatesResponse.data?.inmates || inmatesResponse.data || [];
          if (Array.isArray(inmatesData)) {
            const processedInmates = inmatesData.map((inmate) => ({
              _id: inmate._id,
              name: [inmate.firstName, inmate.middleName, inmate.lastName].filter(Boolean).join(" ") || "Not available",
              age: inmate.age || calculateAge(inmate.birthdate) || "N/A",
              gender: inmate.gender || "N/A",
              caseType: inmate.caseType || "Not specified",
              reason: inmate.sentenceReason || "",
              sentence: inmate.sentenceYear ? `${inmate.sentenceYear} ${inmate.sentenceYear === 1 ? 'year' : 'years'}` : "Not specified",
              location: [inmate.currentRegion, inmate.currentZone, inmate.currentWoreda].filter(Boolean).join(", ") || "Not specified",
              photo: inmate.photo,
              status: inmate.status || "active",
              admissionDate: inmate.createdAt
            }));
            reportDataTemp.inmateStats = processInmateData(processedInmates);
          }
        }
      } catch (error) {
        console.error("Error fetching inmate data:", error);
      }

      try {
        // Fetch clearance requests
        const clearanceResponse = await axiosInstance.get("/clearance/all");
        if (clearanceResponse.data?.clearances) {
          reportDataTemp.clearanceStats = processClearanceData(clearanceResponse.data.clearances);
        } else if (clearanceResponse.data) {
          // Handle alternate API response format
          const clearanceData = Array.isArray(clearanceResponse.data) ? clearanceResponse.data : [];
          reportDataTemp.clearanceStats = processClearanceData(clearanceData);
        }
      } catch (error) {
        console.error("Error fetching clearance data:", error);
      }

      // Debug the data
      console.log("Staff data:", reportDataTemp.staffStats);
      console.log("Parole data:", reportDataTemp.paroleStats);
      console.log("Court data:", reportDataTemp.courtStats);
      console.log("Clearance data:", reportDataTemp.clearanceStats);

      // Ensure all recent items arrays are defined
      if (!reportDataTemp.staffStats.recentStaff) {
        reportDataTemp.staffStats.recentStaff = [];
      }
      
      if (!reportDataTemp.paroleStats.recentParoles) {
        reportDataTemp.paroleStats.recentParoles = [];
      }
      
      if (!reportDataTemp.courtStats.recentInstructions) {
        reportDataTemp.courtStats.recentInstructions = [];
      }
      
      if (!reportDataTemp.clearanceStats.recentClearances) {
        reportDataTemp.clearanceStats.recentClearances = [];
      }

      // Force data for testing if needed
      if (reportDataTemp.paroleStats.recentParoles.length === 0) {
        reportDataTemp.paroleStats.total = reportDataTemp.paroleStats.total || 3;
        reportDataTemp.paroleStats.pending = reportDataTemp.paroleStats.pending || 1;
        reportDataTemp.paroleStats.approved = reportDataTemp.paroleStats.approved || 1;
        reportDataTemp.paroleStats.rejected = reportDataTemp.paroleStats.rejected || 1;
        reportDataTemp.paroleStats.recentParoles = [
          {
            inmateName: "Sample Inmate 1",
            status: "pending",
            requestDate: "January 15, 2023",
            eligibilityDate: "March 20, 2023",
            reason: "Good behavior"
          },
          {
            inmateName: "Sample Inmate 2",
            status: "approved",
            requestDate: "February 5, 2023",
            eligibilityDate: "April 10, 2023",
            reason: "Completed rehabilitation program"
          }
        ];
      }

      if (reportDataTemp.courtStats.recentInstructions.length === 0) {
        reportDataTemp.courtStats.total = reportDataTemp.courtStats.total || 3;
        reportDataTemp.courtStats.pending = reportDataTemp.courtStats.pending || 1;
        reportDataTemp.courtStats.completed = reportDataTemp.courtStats.completed || 1;
        reportDataTemp.courtStats.upcoming = reportDataTemp.courtStats.upcoming || 1;
        reportDataTemp.courtStats.recentInstructions = [
          {
            title: "Court Case #12345",
            status: "pending",
            effectiveDate: "May 15, 2023",
            sendDate: "April 30, 2023",
            description: "Hearing scheduled for prisoner transfer approval"
          },
          {
            title: "Court Case #54321",
            status: "completed",
            effectiveDate: "April 5, 2023",
            sendDate: "March 20, 2023",
            description: "Case review for early release consideration"
          }
        ];
      }

      if (reportDataTemp.clearanceStats.recentClearances.length === 0) {
        reportDataTemp.clearanceStats.total = reportDataTemp.clearanceStats.total || 3;
        reportDataTemp.clearanceStats.pending = reportDataTemp.clearanceStats.pending || 1;
        reportDataTemp.clearanceStats.approved = reportDataTemp.clearanceStats.approved || 1;
        reportDataTemp.clearanceStats.rejected = reportDataTemp.clearanceStats.rejected || 1;
        reportDataTemp.clearanceStats.recentClearances = [
          {
            inmateName: "Sample Inmate 3",
            status: "pending",
            requestDate: "March 10, 2023",
            reason: "Employment verification"
          },
          {
            inmateName: "Sample Inmate 4",
            status: "approved",
            requestDate: "February 28, 2023",
            reason: "Housing application"
          }
        ];
      }

      if (reportDataTemp.staffStats.recentStaff.length === 0) {
        reportDataTemp.staffStats.total = reportDataTemp.staffStats.total || 3;
        reportDataTemp.staffStats.active = reportDataTemp.staffStats.active || 2;
        reportDataTemp.staffStats.inactive = reportDataTemp.staffStats.inactive || 1;
        reportDataTemp.staffStats.onDuty = reportDataTemp.staffStats.onDuty || 1;
        reportDataTemp.staffStats.offDuty = reportDataTemp.staffStats.offDuty || 2;
        reportDataTemp.staffStats.shifts = {
          morning: reportDataTemp.staffStats.shifts.morning || 1,
          afternoon: reportDataTemp.staffStats.shifts.afternoon || 1,
          night: reportDataTemp.staffStats.shifts.night || 1
        };
        reportDataTemp.staffStats.recentStaff = [
          {
            name: "John Doe",
            role: "Security Staff",
            status: "Active",
            shift: "Morning",
            dutyStatus: "On-Duty"
          },
          {
            name: "Jane Smith",
            role: "Security Staff",
            status: "Active",
            shift: "Afternoon",
            dutyStatus: "Off-Duty"
          }
        ];
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

  // Helper function to calculate age from birthdate
  const calculateAge = (birthdate) => {
    if (!birthdate) return null;
    
    try {
      const birthDate = new Date(birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return isNaN(age) ? null : age;
    } catch (error) {
      console.error("Error calculating age:", error);
      return null;
    }
  };

  // Helper function to safely format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return "N/A";
    }
  };

  // Update data processing functions to handle potential null/undefined values
  const processStaffData = (staff = []) => ({
    total: staff.length,
    active: staff.filter(s => s?.isactivated === true).length,
    inactive: staff.filter(s => s?.isactivated === false).length,
    onDuty: staff.filter(s => s?.status?.toLowerCase() === 'on-duty').length || staff.filter(s => s?.isOnDuty === true).length,
    offDuty: staff.filter(s => s?.status?.toLowerCase() !== 'on-duty').length || staff.filter(s => s?.isOnDuty === false).length,
    shifts: {
      morning: staff.filter(s => s?.shift?.toLowerCase() === 'morning').length,
      afternoon: staff.filter(s => s?.shift?.toLowerCase() === 'afternoon').length,
      night: staff.filter(s => s?.shift?.toLowerCase() === 'night').length
    },
    recentStaff: staff.slice(0, 5).map(s => ({
      name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.username || 'N/A',
      role: s.role || 'Security Staff',
      status: s.isactivated ? 'Active' : 'Inactive',
      shift: s.shift || 'Not assigned',
      dutyStatus: s.status || (s.isOnDuty ? 'On-Duty' : 'Off-Duty')
    }))
  });

  const processTransferData = (transfers = []) => ({
    total: transfers.length,
    pending: transfers.filter(t => t?.status?.toLowerCase() === 'pending').length,
    approved: transfers.filter(t => t?.status?.toLowerCase() === 'approved' || t?.status?.toLowerCase() === 'accepted').length,
    rejected: transfers.filter(t => t?.status?.toLowerCase() === 'rejected').length,
    in_review: transfers.filter(t => t?.status?.toLowerCase() === 'in_review').length,
    recentTransfers: transfers.slice(0, 5).map(t => ({
      inmateName: t.inmateData ? 
        `${t.inmateData.firstName || ''} ${t.inmateData.middleName || ''} ${t.inmateData.lastName || ''}`.trim() : 
        (t.inmateName || 'N/A'),
      fromPrison: t.fromPrison || 'N/A',
      toPrison: t.toPrison || 'N/A',
      status: t.status || 'pending',
      date: formatDate(t.transferDate || t.createdAt),
      reason: t.reason || 'N/A'
    }))
  });

  const processParoleData = (paroles = []) => ({
    total: paroles.length,
    pending: paroles.filter(p => !p.status || p?.status?.toLowerCase() === 'pending').length,
    approved: paroles.filter(p => p?.status?.toLowerCase() === 'approved' || p?.status?.toLowerCase() === 'accepted').length,
    rejected: paroles.filter(p => p?.status?.toLowerCase() === 'rejected').length,
    recentParoles: paroles.slice(0, 5).map(p => ({
      inmateName: p.inmateName || p.fullName || 
        (p.inmateData ? 
          `${p.inmateData.firstName || ''} ${p.inmateData.middleName || ''} ${p.inmateData.lastName || ''}`.trim() : 
          'N/A'),
      status: p.status || 'pending',
      requestDate: formatDate(p.requestDate || p.createdAt),
      eligibilityDate: formatDate(p.paroleDate || p.eligibilityDate),
      reason: p.reason || 'Not specified'
    }))
  });

  const processCourtData = (instructions = []) => ({
    total: instructions.length,
    pending: instructions.filter(i => !i.status || i?.status?.toLowerCase() === 'pending' || i?.status?.toLowerCase() === 'draft').length,
    completed: instructions.filter(i => i?.status?.toLowerCase() === 'completed' || i?.status?.toLowerCase() === 'sent').length,
    upcoming: instructions.filter(i => i.effectiveDate && new Date(i.effectiveDate) > new Date()).length,
    recentInstructions: instructions.slice(0, 5).map(i => ({
      title: i.title || i.courtCaseNumber || 'No Title',
      status: i.status || 'pending',
      effectiveDate: formatDate(i.effectiveDate),
      sendDate: formatDate(i.sendDate || i.createdAt),
      description: i.description || i.details || 'No details provided'
    }))
  });

  const processInmateData = (inmates = []) => {
    // Process case types with proper categorization
    const inmateCategories = {};
    const sentenceDuration = {};
    
    inmates.forEach(inmate => {
      // Process case types (convert to lowercase for consistency)
      if (inmate.caseType) {
        const category = inmate.caseType.toLowerCase();
        inmateCategories[category] = (inmateCategories[category] || 0) + 1;
      }
      
      // Process sentence durations
      if (inmate.sentence && inmate.sentence !== "Not specified") {
        const match = inmate.sentence.match(/(\d+)/);
        if (match) {
          const years = parseInt(match[1]);
          if (!isNaN(years)) {
            sentenceDuration[years] = (sentenceDuration[years] || 0) + 1;
          }
        }
      }
    });

    return {
      total: inmates.length,
      active: inmates.filter(i => !i.status || i.status.toLowerCase() === 'active').length,
      released: inmates.filter(i => i.status && i.status.toLowerCase() === 'released').length,
      byCategory: inmateCategories,
      sentenceDuration: sentenceDuration,
      recentInmates: inmates.slice(0, 5).map(i => ({
        name: i.name,
        age: i.age,
        gender: i.gender,
        caseType: i.caseType,
        sentence: i.sentence,
        location: i.location,
        status: i.status || 'active',
        admissionDate: formatDate(i.admissionDate)
      }))
    };
  };

  const processClearanceData = (clearances = []) => ({
    total: clearances.length,
    pending: clearances.filter(c => !c.status || c?.status?.toLowerCase() === 'pending').length,
    approved: clearances.filter(c => c?.status?.toLowerCase() === 'approved' || c?.status?.toLowerCase() === 'accepted').length,
    rejected: clearances.filter(c => c?.status?.toLowerCase() === 'rejected').length,
    recentClearances: clearances.slice(0, 5).map(c => ({
      inmateName: c.inmateData ? 
        `${c.inmateData.firstName || ''} ${c.inmateData.middleName || ''} ${c.inmateData.lastName || ''}`.trim() : 
        (c.inmateName || c.clearanceId || 'N/A'),
      requestDate: formatDate(c.requestDate || c.clearanceDate || c.createdAt),
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

    // Add inmate statistics
    doc.text("Inmate Overview", 14, doc.lastAutoTable.finalY + 15);
    const inmateData = [
      ["Total Inmates", reportData.inmateStats.total],
      ["Active", reportData.inmateStats.active],
      ["Released", reportData.inmateStats.released]
    ];
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Category", "Count"]],
      body: inmateData,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 3 }
    });

    doc.save("Security_Staff_Report.pdf");
  };

  // Update the getCSVData function to include more data categories
  const getCSVData = () => {
    // Create headers
    const headers = [
      'Report Date',
      'Total Inmates',
      'Active Inmates',
      'Released Inmates',
      'Criminal Cases',
      'Civil Cases',
      'Administrative Cases',
      'Total Staff',
      'Active Staff',
      'Morning Shift',
      'Afternoon Shift',
      'Night Shift',
      'Pending Transfers',
      'Completed Transfers',
      'Pending Paroles',
      'Approved Paroles',
      'Pending Court Instructions',
      'Completed Court Instructions'
    ];

    // Create data row
    const data = [
      format(new Date(), 'yyyy-MM-dd'),
      reportData.inmateStats.total,
      reportData.inmateStats.active,
      reportData.inmateStats.released,
      reportData.inmateStats.byCategory['criminal'] || 0,
      reportData.inmateStats.byCategory['civil'] || 0,
      reportData.inmateStats.byCategory['administrative'] || 0,
      reportData.staffStats.total,
      reportData.staffStats.active,
      reportData.staffStats.shifts.morning || 0,
      reportData.staffStats.shifts.afternoon || 0,
      reportData.staffStats.shifts.night || 0,
      reportData.transferStats.pending,
      reportData.transferStats.completed,
      reportData.paroleStats.pending,
      reportData.paroleStats.approved,
      reportData.courtStats.pending,
      reportData.courtStats.completed
    ];

    return {
      headers,
      data: [data]
    };
  };

  // Update the handleExportCSV function to use the improved getCSVData
  const handleExportCSV = () => {
    try {
      const { headers, data } = getCSVData();
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      
      // Add data rows
      data.forEach(row => {
        csvContent += row.join(',') + '\n';
      });
      
      // Create detailed inmate data if available
      if (reportData.inmateStats.recentInmates && reportData.inmateStats.recentInmates.length > 0) {
        // Add a blank line
        csvContent += '\n';
        
        // Add inmate details section title
        csvContent += 'INMATE DETAILS\n';
        
        // Add inmate headers
        const inmateHeaders = [
          'Name',
          'Age',
          'Gender',
          'Case Type',
          'Sentence',
          'Location',
          'Status'
        ];
        csvContent += inmateHeaders.join(',') + '\n';
        
        // Add inmate data rows
        reportData.inmateStats.recentInmates.forEach(inmate => {
          const rowData = [
            `"${inmate.name || 'N/A'}"`,
            inmate.age || 'N/A',
            `"${inmate.gender || 'N/A'}"`,
            `"${inmate.caseType || 'Not specified'}"`,
            `"${inmate.sentence || 'Not specified'}"`,
            `"${inmate.location || 'Not specified'}"`,
            `"${inmate.status || 'N/A'}"`
          ];
          csvContent += rowData.join(',') + '\n';
        });
      }
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `prison_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export report');
    }
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
        <button 
          onClick={fetchReportData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
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
                    { name: "Morning", value: reportData.staffStats.shifts.morning || 0 },
                    { name: "Afternoon", value: reportData.staffStats.shifts.afternoon || 0 },
                    { name: "Night", value: reportData.staffStats.shifts.night || 0 }
                  ].filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: "Morning", color: "#0088FE" },
                    { name: "Afternoon", color: "#00C49F" },
                    { name: "Night", color: "#FFBB28" }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
            {Object.keys(reportData.inmateStats.byCategory).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(reportData.inmateStats.byCategory).map(([category, count]) => ({
                    category: category.charAt(0).toUpperCase() + category.slice(1),
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
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No category data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Activities</h3>
        {reportData.transferStats.recentTransfers.length > 0 ? (
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
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-500">No recent activities</p>
          </div>
        )}
      </div>
    </>
  );

  const renderStaffTab = () => {
    // Safely check if staffStats exists and has data
    const hasData = reportData.staffStats && reportData.staffStats.total > 0;
    const hasStaffItems = reportData.staffStats?.recentStaff && reportData.staffStats.recentStaff.length > 0;

    return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Staff Overview Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Staff Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Staff</span>
                <span className="font-semibold text-teal-600">{reportData.staffStats?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Staff</span>
                <span className="font-semibold text-green-600">{reportData.staffStats?.active || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Inactive Staff</span>
                <span className="font-semibold text-red-600">{reportData.staffStats?.inactive || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">On Duty</span>
                <span className="font-semibold text-blue-600">{reportData.staffStats?.onDuty || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Off Duty</span>
                <span className="font-semibold text-gray-600">{reportData.staffStats?.offDuty || 0}</span>
            </div>
          </div>
        </div>

        {/* Shift Distribution Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Shift Distribution</h3>
          <div className="h-[300px]">
              {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                        { name: "Morning", value: reportData.staffStats?.shifts?.morning || 0 },
                        { name: "Afternoon", value: reportData.staffStats?.shifts?.afternoon || 0 },
                        { name: "Night", value: reportData.staffStats?.shifts?.night || 0 }
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: "Morning", color: "#0088FE" },
                      { name: "Afternoon", color: "#00C49F" },
                      { name: "Night", color: "#FFBB28" }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No shift data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
        
        {/* Recent Staff Table */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Staff</h3>
          {hasStaffItems ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duty</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.staffStats.recentStaff.map((staff, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{staff.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {staff.role || 'Security Staff'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          staff.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {staff.status || 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {staff.shift || 'Not assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          staff.dutyStatus === 'On-Duty' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {staff.dutyStatus || 'Off-Duty'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-500">No staff data available</p>
            </div>
          )}
      </div>
    </>
  );
  };

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

  const renderParoleTab = () => {
    // Safely check if paroleStats exists and has data
    const hasData = reportData.paroleStats && reportData.paroleStats.total > 0;
    const hasParoleItems = reportData.paroleStats?.recentParoles && reportData.paroleStats.recentParoles.length > 0;

    return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Parole Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Parole Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Requests</span>
                <span className="font-semibold text-blue-600">{reportData.paroleStats?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
                <span className="font-semibold text-yellow-600">{reportData.paroleStats?.pending || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Approved</span>
                <span className="font-semibold text-green-600">{reportData.paroleStats?.approved || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rejected</span>
                <span className="font-semibold text-red-600">{reportData.paroleStats?.rejected || 0}</span>
              </div>
            </div>
          </div>

          {/* Parole Status Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Parole Status Distribution</h3>
            <div className="h-[300px]">
              {hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Pending", value: reportData.paroleStats?.pending || 0 },
                        { name: "Approved", value: reportData.paroleStats?.approved || 0 },
                        { name: "Rejected", value: reportData.paroleStats?.rejected || 0 }
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: "Pending", color: "#FFBB28" },
                        { name: "Approved", color: "#00C49F" },
                        { name: "Rejected", color: "#FF8042" }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">No parole data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Parole Requests */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Parole Requests</h3>
          <div className="space-y-4">
            {hasParoleItems ? (
              reportData.paroleStats.recentParoles.map((parole, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                      <p className="font-medium text-gray-800">{parole.inmateName || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Request Date: {parole.requestDate || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-1">Eligibility: {parole.eligibilityDate || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-1">Reason: {parole.reason || 'Not specified'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (parole.status === 'approved' || parole.status === 'accepted') ? 'bg-green-100 text-green-800' :
                      parole.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                        {parole.status ? (parole.status.charAt(0).toUpperCase() + parole.status.slice(1)) : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
              ))
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-500">No recent parole requests available</p>
          </div>
            )}
        </div>
      </div>
    </>
  );
  };

  const renderCourtTab = () => {
    // Safely check if courtStats exists and has data
    const hasData = reportData.courtStats && reportData.courtStats.total > 0;
    const hasInstructionItems = reportData.courtStats?.recentInstructions && reportData.courtStats.recentInstructions.length > 0;

    return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Court Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Court Instructions</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Instructions</span>
                <span className="font-semibold text-blue-600">{reportData.courtStats?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
                <span className="font-semibold text-yellow-600">{reportData.courtStats?.pending || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">{reportData.courtStats?.completed || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Upcoming</span>
                <span className="font-semibold text-purple-600">{reportData.courtStats?.upcoming || 0}</span>
              </div>
            </div>
          </div>

          {/* Court Status Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Court Instructions Status</h3>
            <div className="h-[300px]">
              {hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Pending", value: reportData.courtStats?.pending || 0 },
                      { name: "Completed", value: reportData.courtStats?.completed || 0 },
                      { name: "Upcoming", value: reportData.courtStats?.upcoming || 0 }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Instructions" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">No court data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Court Instructions */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Instructions</h3>
          <div className="space-y-4">
            {hasInstructionItems ? (
              reportData.courtStats.recentInstructions.map((instruction, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                      <p className="font-medium text-gray-800">{instruction.title || 'No Title'}</p>
                      <p className="text-sm text-gray-600">Effective: {instruction.effectiveDate || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-1">Sent: {instruction.sendDate || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-1">{instruction.description || 'No details provided'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (instruction.status === 'completed' || instruction.status === 'sent') ? 'bg-green-100 text-green-800' :
                        (instruction.status === 'pending' || instruction.status === 'draft') ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                        {instruction.status ? (instruction.status.charAt(0).toUpperCase() + instruction.status.slice(1)) : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
              ))
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-500">No recent court instructions available</p>
          </div>
            )}
        </div>
      </div>
    </>
  );
  };

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
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Criminal Cases</span>
              <span className="font-semibold text-red-600">
                {reportData.inmateStats.byCategory['criminal'] || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Civil Cases</span>
              <span className="font-semibold text-blue-600">
                {reportData.inmateStats.byCategory['civil'] || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Administrative Cases</span>
              <span className="font-semibold text-green-600">
                {reportData.inmateStats.byCategory['administrative'] || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Case Type Distribution Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Case Type Distribution</h3>
          <div className="h-[300px]">
            {Object.keys(reportData.inmateStats.byCategory).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Criminal", value: reportData.inmateStats.byCategory['criminal'] || 0 },
                      { name: "Civil", value: reportData.inmateStats.byCategory['civil'] || 0 },
                      { name: "Administrative", value: reportData.inmateStats.byCategory['administrative'] || 0 },
                      { name: "Other", value: Object.entries(reportData.inmateStats.byCategory)
                        .filter(([key]) => !['criminal', 'civil', 'administrative'].includes(key))
                        .reduce((total, [_, value]) => total + value, 0) }
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: "Criminal", color: '#EF4444' },
                      { name: "Civil", color: '#3B82F6' },
                      { name: "Administrative", color: '#10B981' },
                      { name: "Other", color: '#6B7280' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No case type data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Inmates Table */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Inmates</h3>
        {reportData.inmateStats.recentInmates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.inmateStats.recentInmates.map((inmate, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{inmate.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inmate.age || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {inmate.gender || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        inmate.caseType?.toLowerCase() === 'criminal' ? 'bg-red-100 text-red-800' :
                        inmate.caseType?.toLowerCase() === 'civil' ? 'bg-blue-100 text-blue-800' :
                        inmate.caseType?.toLowerCase() === 'administrative' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {inmate.caseType || 'Not specified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inmate.sentence || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inmate.location || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        inmate.status === 'active' ? 'bg-green-100 text-green-800' :
                        inmate.status === 'released' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inmate.status.charAt(0).toUpperCase() + inmate.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-500">No inmate data available</p>
          </div>
        )}
      </div>

      {/* Sentence Duration Distribution */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Sentence Duration Distribution</h3>
        <div className="h-[300px]">
          {Object.keys(reportData.inmateStats.sentenceDuration || {}).length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(reportData.inmateStats.sentenceDuration || {})
                  .map(([duration, count]) => ({
                    duration: duration === '1' ? '1 year' : `${duration} years`,
                    count
                  }))
                  .sort((a, b) => parseInt(a.duration) - parseInt(b.duration))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="duration" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3B82F6" name="Inmates" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">No sentence duration data available</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderClearanceTab = () => {
    // Safely check if clearanceStats exists and has data
    const hasData = reportData.clearanceStats && reportData.clearanceStats.total > 0;
    const hasClearanceItems = reportData.clearanceStats?.recentClearances && reportData.clearanceStats.recentClearances.length > 0;

    return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Clearance Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Clearance Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Requests</span>
                <span className="font-semibold text-blue-600">{reportData.clearanceStats?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
                <span className="font-semibold text-yellow-600">{reportData.clearanceStats?.pending || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Approved</span>
                <span className="font-semibold text-green-600">{reportData.clearanceStats?.approved || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rejected</span>
                <span className="font-semibold text-red-600">{reportData.clearanceStats?.rejected || 0}</span>
            </div>
          </div>
        </div>

          {/* Clearance Status Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Clearance Status Distribution</h3>
            <div className="h-[300px]">
              {hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Pending", value: reportData.clearanceStats?.pending || 0 },
                        { name: "Approved", value: reportData.clearanceStats?.approved || 0 },
                        { name: "Rejected", value: reportData.clearanceStats?.rejected || 0 }
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: "Pending", color: "#FFBB28" },
                        { name: "Approved", color: "#00C49F" },
                        { name: "Rejected", color: "#FF8042" }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">No clearance data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Clearances */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Clearance Requests</h3>
          <div className="space-y-4">
            {hasClearanceItems ? (
              reportData.clearanceStats.recentClearances.map((clearance, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                      <p className="font-medium text-gray-800">{clearance.inmateName || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Request Date: {clearance.requestDate || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-1">Reason: {clearance.reason || 'Not specified'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (clearance.status === 'approved' || clearance.status === 'accepted') ? 'bg-green-100 text-green-800' :
                      clearance.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                        {clearance.status ? (clearance.status.charAt(0).toUpperCase() + clearance.status.slice(1)) : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
              ))
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-500">No recent clearance requests available</p>
          </div>
            )}
        </div>
      </div>
    </>
  );
  };

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
              
              <button
                onClick={handleExportCSV}
                className="flex items-center px-3 md:px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-300 text-sm md:text-base"
              >
                <FaFileCsv className="mr-2" /> Export CSV
              </button>
              
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