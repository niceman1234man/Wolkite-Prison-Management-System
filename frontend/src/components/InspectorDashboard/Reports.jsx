import React, { useState, useEffect, useRef } from "react";
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
  FaBuilding,
  FaDownload, 
  FaFilePdf,
  FaFileExcel,
  FaPrint,
  FaFilter,
  FaCalendarAlt,
  FaSync,
  FaChevronDown,
  FaChartBar,
} from "react-icons/fa";
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444"];

const Reports = () => {
  const reportRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    prisonId: '',
    noticeType: '',
  });
  const [availablePrisons, setAvailablePrisons] = useState([]);
  const [noticeTypes, setNoticeTypes] = useState([
    "all",
    "visitors",
    "staff",
    "admin",
    "court",
    "security",
    "woreda"
  ]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [reportData, setReportData] = useState({
    totalPrisons: 0,
    activePrisons: 0,
    totalCapacity: 0,
    currentPopulation: 0,
    occupancyRate: 0,
    prisonDistribution: [],
    noticeStats: {
      total: 0,
      published: 0,
      unpublished: 0,
      urgent: 0,
      high: 0,
      normal: 0,
      low: 0,
      unread: 0,
      monthly: 0,
      today: 0
    },
    prisonTrends: [],
    noticeTrends: []
  });
  const [noticesSummary, setNoticesSummary] = useState({
    total: 0,
    today: 0,
    unread: 0,
    priority: {
      urgent: 0,
      high: 0,
      normal: 0,
      low: 0
    }
  });

  // Get user from Redux
  const user = useSelector((state) => state.user);
  // Get sidebar state from Redux
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  // Define date ranges for consistent use
  const dateRanges = {
    custom: { label: "Custom", days: 0 },
    week: { label: "Week", days: 7 },
    month: { label: "Month", days: 30 },
    quarter: { label: "Quarter", days: 90 },
    year: { label: "Year", days: 365 }
  };

  // Define priority levels based on schema
  const priorityLevels = {
    Urgent: 4,
    High: 3,
    Normal: 2,
    Low: 1
  };

  useEffect(() => {
    // Initialize by fetching prisons and notice types
    fetchPrisons();
    fetchNoticeTypes();
  }, []);

  // Add polling to refresh data automatically
  useEffect(() => {
    // Initial fetch
    fetchReportData();
    
    // Set up a polling interval to refresh data every 30 seconds
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing report data...");
      fetchReportData();
    }, 30000); // 30 seconds
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array so it only runs once on mount

  // Separate effect for handling timeRange changes
  useEffect(() => {
    if (timeRange !== 'custom') {
      // Calculate dates based on selected timeRange
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - dateRanges[timeRange].days);
      
      // Update filter state with formatted dates
      setFilters(prev => ({
        ...prev,
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
      }));
      
      // Fetch reports with the new date range
      fetchReportData();
    }
  }, [timeRange]);

  // Helper function to format date for API
  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  const fetchReportData = async (customFilters = null) => {
    setLoading(true);
    try {
      // Calculate date range based on timeRange or custom filters
      let startDate, endDate, formattedStartDate, formattedEndDate;
      
      if (customFilters && customFilters.startDate && customFilters.endDate) {
        formattedStartDate = customFilters.startDate;
        formattedEndDate = customFilters.endDate;
        startDate = new Date(formattedStartDate);
        endDate = new Date(formattedEndDate);
      } else {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(endDate.getDate() - dateRanges[timeRange].days);
        formattedStartDate = formatDateForAPI(startDate);
        formattedEndDate = formatDateForAPI(endDate);
      }

      // Prepare query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', formattedStartDate);
      queryParams.append('endDate', formattedEndDate);
      
      if (customFilters) {
        if (customFilters.prisonId) queryParams.append('prisonId', customFilters.prisonId);
        if (customFilters.noticeType) queryParams.append('noticeType', customFilters.noticeType);
      }

      // Fetch prison statistics
      const prisonsResponse = await axiosInstance.get("/prison/getall-prisons");
      const prisons = prisonsResponse.data?.prisons || [];

      // Calculate prison statistics
      const totalPrisons = prisons.length;
      const activePrisons = prisons.filter(p => p.status === "active").length;
      const totalCapacity = prisons.reduce((sum, p) => sum + (Number(p.capacity) || 0), 0);
      const currentPopulation = prisons.reduce((sum, p) => sum + (Number(p.current_population) || 0), 0);
      const occupancyRate = totalCapacity > 0 ? (currentPopulation / totalCapacity) * 100 : 0;

      // Fetch notices data - get all notices to ensure we catch newly published ones
      const noticesResponse = await axiosInstance.get("/notice/getAllNotices");
      
      // Standardize the data structure
      const allNotices = noticesResponse.data?.data || noticesResponse.data?.notices || [];

      console.log("Total notices fetched:", allNotices.length);

      // Filter for published notices only, and then by audience
      const relevantNotices = allNotices.filter(notice => {
        // Make sure notice exists and is valid
        if (!notice || !notice._id) return false;
        
        // Only include published notices
        if (notice.isPosted !== true) return false;
        
        // Filter based on target audience
        const targetAudience = (notice.targetAudience || "all").toLowerCase();
        
        // Show notices targeted to 'all' or 'staff' (inspector is considered staff)
        return targetAudience === 'all' || targetAudience === 'staff';
      });

      console.log("Published notices for inspector:", relevantNotices.length);
      
      // Debug the priority values in the data
      console.log("Sample notice priorities:", relevantNotices.slice(0, 5).map(n => 
        ({ id: n._id, title: n.title?.substring(0, 20), priority: n.priority })
      ));
      
      // Count notices by priority - ensure we handle all formats
      const priorityMap = {};
      relevantNotices.forEach(notice => {
        const priority = notice.priority || 'Normal';
        priorityMap[priority] = (priorityMap[priority] || 0) + 1;
      });
      console.log("Priority distribution:", priorityMap);

      // Calculate notice statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayNotices = relevantNotices.filter(notice => {
        const noticeDate = new Date(notice.date);
        noticeDate.setHours(0, 0, 0, 0);
        return noticeDate.getTime() === today.getTime();
      }).length;

      const monthlyNotices = relevantNotices.filter(notice => {
        const noticeDate = new Date(notice.date);
        return noticeDate.getMonth() === today.getMonth() && 
               noticeDate.getFullYear() === today.getFullYear();
      }).length;

      // Correctly count all priority types (case-insensitive)
      const urgentNotices = relevantNotices.filter(notice => {
        const priority = String(notice.priority || '').toLowerCase();
        return priority === 'urgent';
      }).length;
      
      const highNotices = relevantNotices.filter(notice => {
        const priority = String(notice.priority || '').toLowerCase();
        return priority === 'high';
      }).length;
      
      const normalNotices = relevantNotices.filter(notice => {
        const priority = String(notice.priority || '').toLowerCase();
        return priority === 'normal' || priority === 'medium';
      }).length;
      
      const lowNotices = relevantNotices.filter(notice => {
        const priority = String(notice.priority || '').toLowerCase();
        return priority === 'low';
      }).length;

      // Log the counted notices by priority for debugging
      console.log("Counted notices by priority:", {
        urgent: urgentNotices,
        high: highNotices,
        normal: normalNotices,
        low: lowNotices,
        total: urgentNotices + highNotices + normalNotices + lowNotices
      });

      // Check if user exists and has an ID before filtering unread notices
      const unreadNotices = user?.id ? 
        relevantNotices.filter(notice => 
          !notice.readBy || !notice.readBy.includes(user.id)
        ).length : 0;

      // Update notice summary
      setNoticesSummary({
        total: relevantNotices.length,
        today: todayNotices,
        unread: unreadNotices,
        priority: {
          urgent: urgentNotices,
          high: highNotices,
          normal: normalNotices,
          low: lowNotices
        }
      });

      // Calculate prison distribution data
      const prisonDistribution = prisons.map(prison => ({
        name: prison.prison_name,
        population: Number(prison.current_population) || 0,
        capacity: Number(prison.capacity) || 0,
        occupancyRate: prison.capacity > 0 
          ? ((prison.current_population / prison.capacity) * 100).toFixed(1)
          : 0
      }));

      // Update report data
      setReportData({
        totalPrisons,
        activePrisons,
        totalCapacity,
        currentPopulation,
        occupancyRate,
        prisonDistribution,
        noticeStats: {
          total: relevantNotices.length,
          published: relevantNotices.length,
          unpublished: 0, // We're only including published notices
          urgent: urgentNotices,
          high: highNotices,
          normal: normalNotices,
          low: lowNotices,
          unread: unreadNotices,
          monthly: monthlyNotices,
          today: todayNotices
        },
        prisonTrends: [],
        noticeTrends: []
      });

      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Failed to fetch report data");
      setLoading(false);
    }
  };

  const fetchPrisons = async () => {
    try {
      const response = await axiosInstance.get("/prison/getall-prisons");
      if (response.data?.success) {
        setAvailablePrisons(response.data.prisons || []);
      }
    } catch (error) {
      console.error("Error fetching prisons:", error);
      toast.error("Failed to fetch prisons");
    }
  };

  const fetchNoticeTypes = async () => {
    try {
      // This would need to be implemented in the backend
      // For now, using static types
      setNoticeTypes([
        "all",
        "visitors",
        "staff",
        "admin",
        "court",
        "security",
        "woreda"
      ]);
    } catch (error) {
      console.error("Error fetching notice types:", error);
    }
  };

  // Get formatted date range string based on current timeRange
  const getDateRangeString = () => {
    if (timeRange === 'custom' && filters.startDate && filters.endDate) {
      return `${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`;
    }
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - dateRanges[timeRange].days);
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  // Format percentage for display
  const formatPercentage = (value, total) => {
    if (!value || !total) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  // Print functionality
  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Inspector_Report_${timeRange}_${new Date().toISOString().split('T')[0]}`,
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
      setLoading(true);
        resolve();
      });
    },
    onAfterPrint: () => setLoading(false),
  });

  // Export to Excel
  const exportToExcel = () => {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';
    
    // Format data for Excel
    const excelData = [
      {
        sheetName: 'Prison Overview',
        data: [
          ['Prison System Report', `Generated on ${new Date().toLocaleString()}`],
          ['Time Period', getDateRangeString()],
          [''],
          ['PRISON OVERVIEW', 'COUNT', 'PERCENTAGE'],
          ['Total Prisons', reportData.totalPrisons, '100%'],
          ['Active Prisons', reportData.activePrisons, formatPercentage(reportData.activePrisons, reportData.totalPrisons)],
          ['Total Capacity', reportData.totalCapacity, '100%'],
          ['Current Population', reportData.currentPopulation, formatPercentage(reportData.currentPopulation, reportData.totalCapacity)],
          ['Occupancy Rate', `${reportData.occupancyRate.toFixed(1)}%`, ''],
          [''],
          ['NOTICE STATISTICS', 'COUNT', 'PERCENTAGE'],
          ['Total Notices', reportData.noticeStats.total, '100%'],
          ['Urgent Priority', reportData.noticeStats.urgent, formatPercentage(reportData.noticeStats.urgent, reportData.noticeStats.total)],
          ['High Priority', reportData.noticeStats.high, formatPercentage(reportData.noticeStats.high, reportData.noticeStats.total)],
          ['Normal Priority', reportData.noticeStats.normal, formatPercentage(reportData.noticeStats.normal, reportData.noticeStats.total)],
          ['Low Priority', reportData.noticeStats.low, formatPercentage(reportData.noticeStats.low, reportData.noticeStats.total)],
          ['Unread Notices', reportData.noticeStats.unread, formatPercentage(reportData.noticeStats.unread, reportData.noticeStats.total)],
        ]
      },
      {
        sheetName: 'Prison Distribution',
        data: [
          ['Prison Name', 'Current Population', 'Capacity', 'Occupancy Rate'],
          ...reportData.prisonDistribution.map(prison => [
            prison.name,
            prison.population,
            prison.capacity,
            `${prison.occupancyRate}%`
          ])
        ]
      }
    ];

    // Create workbook and add worksheets
    const wb = XLSX.utils.book_new();
    
    excelData.forEach(sheet => {
      const ws = XLSX.utils.aoa_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName);
    });
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {type: fileType});
    
    const fileName = `Inspector_Report_${timeRange}_${new Date().toISOString().split('T')[0]}${fileExtension}`;
    
    const href = URL.createObjectURL(data);
      const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    toast.success("Report exported to Excel successfully");
  };

  // Export to PDF
  const exportToPDF = async () => {
    const reportContent = reportRef.current;
    if (!reportContent) {
      toast.error("Report content not available for export");
      return;
    }
    
    try {
      toast.info("Preparing PDF export...");
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      
      // Add title
      pdf.setFontSize(18);
      pdf.text('Prison System Report', pageWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Period: ${getDateRangeString()}`, pageWidth / 2, 30, { align: 'center' });
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 40, { align: 'center' });

      // Convert the report content to canvas
      const canvas = await html2canvas(reportContent, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 60; // Start after the title

      // Add the image across multiple pages if necessary
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position);

      while (heightLeft > 0) {
        position = margin;
        heightLeft -= (pageHeight - margin);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      }

      pdf.save(`Inspector_Report_${timeRange}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Report exported to PDF successfully");
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="flex">
      {/* Sidebar Spacing Fix */}
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Fixed Header */}
        <div className={`bg-white shadow-md p-4 fixed top-14 z-20 flex flex-col sm:flex-row justify-between items-start sm:items-center transition-all duration-300 ${
          isCollapsed ? "left-16 w-[calc(100%-4rem)]" : "left-64 w-[calc(100%-16rem)]"
        }`}>
            <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Prison System Reports</h1>
            <p className="text-sm text-gray-500">
              {timeRange === 'custom' 
                ? `Custom period: ${getDateRangeString()}`
                : `${dateRanges[timeRange].label} view: ${getDateRangeString()}`
              } 
              <span className="text-xs ml-2">Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            {/* Time Range Selector */}
            <div className="relative mr-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
                {/* <option value="custom">Custom Range</option> */}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FaChevronDown className="h-3 w-3" />
              </div>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={() => {
                toast.info("Refreshing report data...");
                fetchReportData();
              }}
              className="p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1"
              title="Refresh Data"
            >
              <FaSync className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline text-sm font-medium">Refresh</span>
            </button>
            
            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`p-2 rounded-md transition-colors flex items-center gap-1 ${
                  filterOpen || Object.values(filters).some(v => v !== '') 
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title="Filter Reports"
              >
                <FaFilter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-sm font-medium">Filter</span>
              </button>
              
              {filterOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10 p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-800">Report Filters</h4>
                    <button 
                      onClick={() => setFilterOpen(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {timeRange === 'custom' && (
                      <div className="bg-blue-50 p-2 rounded-md mb-2">
                        <h5 className="text-sm font-medium text-blue-700 mb-1">Date Range</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                            <input 
                              type="date" 
                              value={filters.startDate}
                              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                              className="w-full p-1.5 border rounded-md text-sm"
                              max={filters.endDate || formatDateForAPI(new Date())}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">End Date</label>
                            <input 
                              type="date"
                              value={filters.endDate}
                              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                              className="w-full p-1.5 border rounded-md text-sm"
                              min={filters.startDate}
                              max={formatDateForAPI(new Date())}
                            />
                          </div>
          </div>
        </div>
                    )}
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Prison</label>
                      <select
                        value={filters.prisonId}
                        onChange={(e) => setFilters({...filters, prisonId: e.target.value})}
                        className="w-full p-1.5 border rounded-md text-sm"
                      >
                        <option value="">All Prisons</option>
                        {availablePrisons.map(prison => (
                          <option key={prison._id} value={prison._id}>
                            {prison.prison_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Notice Type</label>
                      <select
                        value={filters.noticeType}
                        onChange={(e) => setFilters({...filters, noticeType: e.target.value})}
                        className="w-full p-1.5 border rounded-md text-sm"
                      >
                        <option value="">All Types</option>
                        {noticeTypes.map(type => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setFilters({
                            startDate: '',
                            endDate: '',
                            prisonId: '',
                            noticeType: '',
                          });
                          if (timeRange === 'custom') {
                            setTimeRange('week');
                          }
                          setFilterOpen(false);
                        }}
                        className="flex-1 px-3 py-1.5 text-gray-600 bg-gray-100 rounded-md text-sm hover:bg-gray-200 transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => {
                          fetchReportData(filters);
                          setFilterOpen(false);
                        }}
                        className="flex-1 px-3 py-1.5 text-white bg-blue-600 rounded-md text-sm hover:bg-blue-700 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Export Button */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
                title="Export Report"
              >
                <FaDownload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-sm font-medium">Export</span>
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200 py-2">
                  <button
                    onClick={() => {
                      handlePrint();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                  >
                    <FaPrint className="mr-2 text-blue-600" /> Print Report
                  </button>
                  <button
                    onClick={() => {
                      exportToPDF();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                  >
                    <FaFilePdf className="mr-2 text-red-600" /> Export as PDF
                  </button>
                  <button
                    onClick={() => {
                      exportToExcel();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                  >
                    <FaFileExcel className="mr-2 text-green-600" /> Export as Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Report Content */}
        <div className="p-6 mt-28">
          <div className="space-y-6" ref={reportRef}>
            {loading ? (
              // Loading skeleton
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                  <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                      <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
                      <div className="h-[300px] bg-gray-100 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Prison Overview Card */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FaBuilding className="text-blue-600 text-xl" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-800">Prisons</h3>
                        <p className="text-3xl font-bold text-blue-600">{reportData.totalPrisons}</p>
                        <p className="text-sm text-gray-500">{reportData.activePrisons} active</p>
                      </div>
                    </div>
                  </div>

                  {/* Population Card */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <FaUsers className="text-green-600 text-xl" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-800">Population</h3>
                        <p className="text-3xl font-bold text-green-600">{reportData.currentPopulation}</p>
                        <p className="text-sm text-gray-500">of {reportData.totalCapacity} capacity</p>
                      </div>
                    </div>
                  </div>

                  {/* Occupancy Rate Card */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <FaChartBar className="text-yellow-600 text-xl" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-800">Occupancy Rate</h3>
                        <p className="text-3xl font-bold text-yellow-600">
                          {reportData.occupancyRate.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-500">system-wide</p>
                      </div>
                    </div>
                  </div>

                  {/* Notices Card */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <FaFileAlt className="text-purple-600 text-xl" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-800">Notices</h3>
                        <p className="text-3xl font-bold text-purple-600">{noticesSummary.total}</p>
                        <p className="text-sm text-gray-500">{noticesSummary.unread} unread</p>
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Today's Notices:</span>
                        <span className="font-medium">{noticesSummary.today}</span>
                      </div>
                      <div className="flex justify-between text-gray-600 mt-1">
                        <span>High Priority:</span>
                        <span className="font-medium text-red-600">
                          {noticesSummary.priority.urgent + noticesSummary.priority.high}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Prison Population Distribution */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Prison Population Distribution</h3>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.prisonDistribution}>
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="population" name="Current Population" fill="#4F46E5" />
                          <Bar dataKey="capacity" name="Capacity" fill="#10B981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Notice Priority Distribution */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Notice Priority Distribution</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Urgent', value: reportData.noticeStats.urgent, color: "#DC2626" },
                              { name: 'High', value: reportData.noticeStats.high, color: "#EF4444" },
                              { name: 'Normal', value: reportData.noticeStats.normal, color: "#F59E0B" },
                              { name: 'Low', value: reportData.noticeStats.low, color: "#10B981" }
                            ].filter(item => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={(entry) => `${entry.name}: ${entry.value}`}
                          >
                            {[
                              { name: 'Urgent', value: reportData.noticeStats.urgent, color: "#DC2626" },
                              { name: 'High', value: reportData.noticeStats.high, color: "#EF4444" },
                              { name: 'Normal', value: reportData.noticeStats.normal, color: "#F59E0B" },
                              { name: 'Low', value: reportData.noticeStats.low, color: "#10B981" }
                            ]
                            .filter(item => item.value > 0)
                            .map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, 'Count']} />
                          <Legend verticalAlign="bottom" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Text summary of priorities */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-[#DC2626] rounded-full mr-2"></div>
                        <span>Urgent: {reportData.noticeStats.urgent}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-[#EF4444] rounded-full mr-2"></div>
                        <span>High: {reportData.noticeStats.high}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-[#F59E0B] rounded-full mr-2"></div>
                        <span>Normal: {reportData.noticeStats.normal}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-[#10B981] rounded-full mr-2"></div>
                        <span>Low: {reportData.noticeStats.low}</span>
                      </div>
                    </div>
                </div>
              </div>
              
                {/* Prison Details Table */}
                <div className="bg-white rounded-xl shadow-md p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Prison Details</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prison Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Population</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupancy Rate</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.prisonDistribution.map((prison, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{prison.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Location</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prison.capacity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prison.population}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prison.occupancyRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              </div>
            </div>
              </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 