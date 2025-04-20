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
  FaHospital,
  FaDownload,
  FaFilePdf,
  FaFileExcel,
  FaPrint,
  FaFilter,
  FaCalendarAlt,
  FaSync,
  FaChevronDown,
} from "react-icons/fa";
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444"];

const Reports = () => {
  const reportRef = useRef(null);
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
    paroleEligible: 0,
    averageSentenceLength: 0,
    totalCrimes: 0,
    topCrimes: [],
    inmateTrend: 0,
    riskTrend: 0,
    genderTrend: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("week"); // 'week', 'month', 'year'
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    prisonId: '',
    crimeType: '',
  });
  const [availablePrisons, setAvailablePrisons] = useState([]);
  const [crimeTypes, setCrimeTypes] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

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

  useEffect(() => {
    // Initialize by fetching prisons and crime types (only once)
    fetchPrisons();
    fetchCrimeTypes();
  }, []);

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
      fetchWoredaReports();
    }
  }, [timeRange]);

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

  // Helper function to format date for API
  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  const fetchWoredaReports = async (customFilters = null) => {
    setLoading(true);
    try {
      // Calculate date range based on timeRange or custom filters
      let startDate, endDate, formattedStartDate, formattedEndDate;
      
      // If custom filters with dates are provided, use those
      if (customFilters && customFilters.startDate && customFilters.endDate) {
        formattedStartDate = customFilters.startDate;
        formattedEndDate = customFilters.endDate;
        startDate = new Date(formattedStartDate);
        endDate = new Date(formattedEndDate);
      } else {
        // Otherwise use the timeRange
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(endDate.getDate() - dateRanges[timeRange].days);
        formattedStartDate = formatDateForAPI(startDate);
        formattedEndDate = formatDateForAPI(endDate);
      }
      
      // Prepare query parameters
      const queryParams = new URLSearchParams();
      
      // Always include the date parameters
      queryParams.append('startDate', formattedStartDate);
      queryParams.append('endDate', formattedEndDate);
      
      // Add other custom filters if provided
      if (customFilters) {
        if (customFilters.prisonId) queryParams.append('prisonId', customFilters.prisonId);
        if (customFilters.crimeType) queryParams.append('crimeType', customFilters.crimeType);
      }
      
      console.log("Date range for API:", { 
        timeRange,
        isCustom: timeRange === 'custom', 
        startDate: formattedStartDate, 
        endDate: formattedEndDate,
        queryParams: queryParams.toString()
      });
      
      // Log the token status
      const token = localStorage.getItem("token");
      console.log("Token status:", token ? "Present" : "Missing");
      
      // Fetch woreda statistics
      const response = await axiosInstance.get(
        `/woreda/stats?${queryParams.toString()}`
      );

      // Create a stats object with defaults
      let statsData = {
        totalInmates: 0,
        activeInmates: 0,
        transferRequested: 0,
        transferred: 0,
        maleInmates: 0,
        femaleInmates: 0,
        highRiskInmates: 0,
        mediumRiskInmates: 0,
        lowRiskInmates: 0,
        paroleEligible: 0,
        averageSentenceLength: 0,
        totalCrimes: 0,
        topCrimes: [],
        inmateTrend: 0,
        riskTrend: 0,
        genderTrend: 0,
        cancelled: 0,
      };
      
      // Update with received data if available
      if (response.data?.success && response.data?.stats) {
        statsData = { ...statsData, ...response.data.stats };
        
        // Add debug logging for top crimes
        if (statsData.topCrimes && statsData.topCrimes.length > 0) {
          console.log("TOP CRIMES RECEIVED:", statsData.topCrimes);
          
          // Calculate total crime count for proper percentage calculations
          const totalCrimesCount = statsData.topCrimes.reduce((sum, crime) => sum + (crime.count || 0), 0);
          console.log("TOTAL CRIMES COUNT:", totalCrimesCount);
          
          // Add percentage field directly to the topCrimes data
          statsData.topCrimes = statsData.topCrimes.map(crime => ({
            ...crime,
            percentage: totalCrimesCount > 0 ? (crime.count / totalCrimesCount) * 100 : 0
          }));
          
          // Log the updated top crimes with percentages
          console.log("TOP CRIMES WITH PERCENTAGES:", 
            statsData.topCrimes.map(c => ({
              name: c.name, 
              count: c.count, 
              percentage: c.percentage.toFixed(1) + '%'
            }))
          );
          
          // Verify the percentages sum to 100%
          const totalPercentage = statsData.topCrimes.reduce((sum, crime) => sum + crime.percentage, 0);
          console.log("TOTAL PERCENTAGE (should be ~100%):", totalPercentage.toFixed(1) + '%');
        } else {
          console.log("No top crimes data available");
        }
      }
      
      // Fetch all inmates to get a proper total count and gender statistics
      try {
        console.log("Fetching inmates with params:", queryParams.toString());
        const inmatesResponse = await axiosInstance.get(`/woreda-inmate/getall-inmates?${queryParams.toString()}`);
        if (inmatesResponse.data?.inmates) {
          const inmates = inmatesResponse.data.inmates;
          // Set the total inmates count from all inmates regardless of status
          statsData.totalInmates = inmates.length;
          
          console.log("FULL INMATE DATA:", inmatesResponse.data);
          console.log("TOTAL INMATES FOUND:", inmates.length);
          
          // Create a breakdown of all gender values in the dataset
          const genderBreakdown = {};
          inmates.forEach(inmate => {
            const genderValue = inmate.gender || 'undefined';
            genderBreakdown[genderValue] = (genderBreakdown[genderValue] || 0) + 1;
          });
          console.log("GENDER VALUES IN DATASET:", genderBreakdown);
          
          // Log the first few complete inmate objects to see their structure
          console.log("SAMPLE FULL INMATE OBJECTS:", inmates.slice(0, 3));
          
          // Calculate gender statistics - handle missing or case variations in gender field
          statsData.maleInmates = inmates.filter(inmate => {
            const gender = inmate.gender || '';
            const isMale = gender.toLowerCase() === 'male' || gender.toLowerCase() === 'm';
            if (isMale) console.log("MALE INMATE:", inmate._id, inmate.firstName, inmate.lastName);
            return isMale;
          }).length;
          
          statsData.femaleInmates = inmates.filter(inmate => {
            const gender = inmate.gender || '';
            const isFemale = gender.toLowerCase() === 'female' || gender.toLowerCase() === 'f';
            if (isFemale) console.log("FEMALE INMATE:", inmate._id, inmate.firstName, inmate.lastName);
            return isFemale;
          }).length;
          
          // Calculate inmates with unspecified gender
          const unspecifiedGenderInmates = inmates.filter(inmate => {
            const gender = inmate.gender || '';
            return !(['male', 'm', 'female', 'f'].includes(gender.toLowerCase()));
          });
          
          console.log("GENDER TOTALS - Male:", statsData.maleInmates, "Female:", statsData.femaleInmates, "Unspecified:", unspecifiedGenderInmates.length);
          console.log("UNSPECIFIED GENDER INMATES:", unspecifiedGenderInmates.map(i => ({
            id: i._id,
            name: `${i.firstName} ${i.lastName}`,
            gender: i.gender
          })));
          
          // Ensure we have counts for all inmates
          if (statsData.maleInmates + statsData.femaleInmates < inmates.length) {
            // If unspecified genders exist, distribute proportionally or assign to males
            const unspecifiedCount = inmates.length - statsData.maleInmates - statsData.femaleInmates;
            console.log(`Distributing ${unspecifiedCount} inmates with unspecified gender`);
            
            // Assign unspecified gender inmates to male (this is just an example approach)
            statsData.maleInmates += unspecifiedCount;
            
            console.log("AFTER DISTRIBUTION - Male:", statsData.maleInmates, "Female:", statsData.femaleInmates);
          }
          
          // Calculate risk level statistics
          statsData.highRiskInmates = inmates.filter(inmate => {
            const risk = inmate.riskLevel || '';
            return risk.toLowerCase() === 'high';
          }).length;
          
          statsData.mediumRiskInmates = inmates.filter(inmate => {
            const risk = inmate.riskLevel || '';
            return risk.toLowerCase() === 'medium';
          }).length;
          
          statsData.lowRiskInmates = inmates.filter(inmate => {
            const risk = inmate.riskLevel || '';
            return risk.toLowerCase() === 'low';
          }).length;
          
          // Log for debugging
          console.log(`Found ${inmates.length} inmates in date range`, {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            maleCount: statsData.maleInmates,
            femaleCount: statsData.femaleInmates,
            highRisk: statsData.highRiskInmates,
            mediumRisk: statsData.mediumRiskInmates,
            lowRisk: statsData.lowRiskInmates
          });
        }
      } catch (inmatesError) {
        console.error("Error fetching inmates data:", inmatesError);
      }
      
      // Fetch transfer data separately to ensure we have the latest
      try {
        console.log("Fetching transfers with params:", queryParams.toString());
        const transferResponse = await axiosInstance.get(`/transfer/getall-transfers?${queryParams.toString()}`);
        if (transferResponse.data?.data) {
          const transfers = transferResponse.data.data;
          
          // Log raw transfers
          console.log(`Found ${transfers.length} transfers in date range`, {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            transfers: transfers.map(t => ({
              id: t._id,
              status: t.status,
              createdAt: t.createdAt,
              updatedAt: t.updatedAt
            }))
          });
          
          // Filter transfers by date if needed (backend should do this, but as a safeguard)
          const dateFilteredTransfers = transfers.filter(transfer => {
            if (!transfer.createdAt) return true; // Include if no date
            
            // Use helper function for date filtering
            const isInRange = isDateInRange(transfer.createdAt, startDate, endDate);
            return isInRange;
          });
          
          console.log(`After date filtering: ${dateFilteredTransfers.length} transfers`, {
            dateRange: `${formatDateForAPI(startDate)} to ${formatDateForAPI(endDate)}`,
            isCustomDate: timeRange === 'custom'
          });
          
          // Normalize status values for consistent comparison
          const processedTransfers = dateFilteredTransfers.map(transfer => {
            let normalizedStatus = transfer.status?.toLowerCase() || '';
            return {
              ...transfer,
              normalizedStatus
            };
          });
          
          // Count by status
          statsData.transferRequested = processedTransfers.filter(t => 
            t.normalizedStatus === 'pending'
          ).length;
          
          statsData.underReview = processedTransfers.filter(t => 
            t.normalizedStatus === 'under review' || t.normalizedStatus === 'in_review'
          ).length;
          
          // Count completed transfers - include approved status as well
          statsData.transferred = processedTransfers.filter(t => 
            t.normalizedStatus === 'completed' || 
            t.normalizedStatus === 'accepted' || 
            t.normalizedStatus === 'approved'
          ).length;
          
          // Count cancelled transfers
          statsData.cancelled = processedTransfers.filter(t => 
            t.normalizedStatus === 'cancelled'
          ).length;
          
          // Make sure total inmates count includes all inmates regardless of transfer status
          statsData.totalInmates = Math.max(
            statsData.totalInmates, 
            statsData.activeInmates + 
            statsData.transferred + 
            statsData.transferRequested + 
            statsData.underReview + 
            statsData.cancelled
          );
          
          // Log for debugging
          console.log("Transfer counts:", {
            requested: statsData.transferRequested,
            underReview: statsData.underReview,
            transferred: statsData.transferred,
            cancelled: statsData.cancelled,
            total: statsData.totalInmates
          });
        }
      } catch (transferError) {
        console.error("Error fetching transfer data:", transferError);
      }
      
      setWoredaStats(statsData);
      setLastUpdated(new Date());
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

  const fetchPrisons = async () => {
    try {
      const response = await axiosInstance.get("/prison/getall-prisons");
      if (response.data?.success) {
        setAvailablePrisons(response.data.prisons || []);
      }
    } catch (error) {
      console.error("Error fetching prisons:", error);
    }
  };

  const fetchCrimeTypes = async () => {
    try {
      const response = await axiosInstance.get("/crime/getall-crimes");
      if (response.data?.success) {
        setCrimeTypes(response.data.crimes || []);
      }
    } catch (error) {
      console.error("Error fetching crime types:", error);
    }
  };

  // Print functionality
  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Woreda_Report_${timeRange}_${new Date().toISOString().split('T')[0]}`,
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
        sheetName: 'Population Overview',
        data: [
          ['Woreda Correctional Facility Report', `Generated on ${new Date().toLocaleString()}`],
          ['Time Period', getDateRangeString()],
          [''],
          ['POPULATION OVERVIEW', 'COUNT', 'PERCENTAGE', 'TREND (%)'],
          ['Total Inmates', woredaStats.totalInmates, '100%', woredaStats.inmateTrend || 0],
          ['In Custody', woredaStats.activeInmates, formatPercentage(woredaStats.activeInmates, woredaStats.totalInmates), woredaStats.activeTrend || 0],
          ['Transferred Out', woredaStats.transferred, formatPercentage(woredaStats.transferred, woredaStats.totalInmates), woredaStats.transferTrend || 0],
          ['Pending Transfers', woredaStats.transferRequested, formatPercentage(woredaStats.transferRequested, woredaStats.totalInmates), 0],
          ['Under Review', woredaStats.underReview, formatPercentage(woredaStats.underReview, woredaStats.totalInmates), 0],
          ['Cancelled', woredaStats.cancelled, formatPercentage(woredaStats.cancelled, woredaStats.totalInmates), 0],
          [''],
          ['DEMOGRAPHICS', 'COUNT', 'PERCENTAGE', 'TREND (%)'],
          ['Male Inmates', woredaStats.maleInmates, formatPercentage(woredaStats.maleInmates, woredaStats.totalInmates), woredaStats.genderTrend || 0],
          ['Female Inmates', woredaStats.femaleInmates, formatPercentage(woredaStats.femaleInmates, woredaStats.totalInmates), woredaStats.genderTrend || 0],
          [''],
          ['RISK CLASSIFICATION', 'COUNT', 'PERCENTAGE', 'TREND (%)'],
          ['High Risk Inmates', woredaStats.highRiskInmates, formatPercentage(woredaStats.highRiskInmates, woredaStats.totalInmates), woredaStats.riskTrend || 0],
          ['Medium Risk Inmates', woredaStats.mediumRiskInmates, formatPercentage(woredaStats.mediumRiskInmates, woredaStats.totalInmates), woredaStats.riskTrend || 0],
          ['Low Risk Inmates', woredaStats.lowRiskInmates, formatPercentage(woredaStats.lowRiskInmates, woredaStats.totalInmates), woredaStats.riskTrend || 0],
          [''],
          ['OTHER STATISTICS', 'COUNT', 'PERCENTAGE', 'TREND (%)'],
          ['Parole Eligible', woredaStats.paroleEligible, formatPercentage(woredaStats.paroleEligible, woredaStats.totalInmates), woredaStats.paroleTrend || 0],
        ]
      },
      {
        sheetName: 'Top Crimes',
        data: [
          ['Crime Type', 'Count', 'Percentage'],
          ...(woredaStats.topCrimes || []).map(crime => [
            crime.name, 
            crime.count, 
            formatPercentage(crime.count, woredaStats.totalInmates)
          ])
        ]
      },
      {
        sheetName: 'Transfer Analysis',
        data: [
          ['Transfer Status Report', `Generated on ${new Date().toLocaleString()}`],
          ['Time Period', getDateRangeString()],
          [''],
          ['STATUS', 'COUNT', 'PERCENTAGE'],
          ['Total Transfers', getTotalTransfers(), '100%'],
          ['Pending', woredaStats.transferRequested, formatPercentage(woredaStats.transferRequested, getTotalTransfers())],
          ['Under Review', woredaStats.underReview, formatPercentage(woredaStats.underReview, getTotalTransfers())],
          ['Approved/Completed', woredaStats.transferred, formatPercentage(woredaStats.transferred, getTotalTransfers())],
          ['Cancelled', woredaStats.cancelled, formatPercentage(woredaStats.cancelled, getTotalTransfers())],
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
    
    const fileName = `Woreda_Report_${timeRange}_${new Date().toISOString().split('T')[0]}${fileExtension}`;
    
    // Create download link and trigger click
    const href = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Report exported to Excel successfully");
  };
  
  // Helper function to format percentages
  const formatPercentage = (value, total, useActualTotal = true) => {
    if (!value) return '0%';
    if (!total) return '0%';
    
    // If useActualTotal is false, we'll use the value itself as the denominator
    // This is useful for pre-calculated percentages
    return `${((value / total) * 100).toFixed(1)}%`;
  };
  
  // Helper function to get total transfers
  const getTotalTransfers = () => {
    return woredaStats.transferRequested + 
           woredaStats.underReview + 
           woredaStats.transferred + 
           woredaStats.cancelled;
  };

  // Check if a date is within a given range
  const isDateInRange = (dateStr, startDate, endDate) => {
    if (!dateStr) return false;
    
    const date = new Date(dateStr);
    return date >= startDate && date <= endDate;
  };

  // Export to PDF
  const exportToPDF = async () => {
    const reportContent = reportRef.current;
    if (!reportContent) {
      toast.error("Report content not available for export");
      return;
    }
    
    try {
      toast.info("Preparing PDF export...", { autoClose: 2000 });
      
      // Create a temporary clone of the report for manipulation
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = reportContent.outerHTML;
      const tempReport = tempDiv.firstChild;
      
      // Style the temp container
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      document.body.appendChild(tempDiv);
      
      // Check and remove any hidden footer (report generated date)
      const footerElements = tempReport.querySelectorAll('.print-only, [class*="print-only"]');
      footerElements.forEach(el => {
        el.parentNode.removeChild(el);
      });
      
      // Find sections in the cloned report using more reliable selectors
      // Get main sections by their position and structure rather than exact class names
      const allSections = tempReport.querySelectorAll('.bg-white.rounded-xl, .grid.grid-cols-1');
      
      // Identify sections based on content and structure
      let populationOverview = null;
      let demographicsSection = null;
      let chartsSection = null;
      let transferSection = null;
      let topCrimesSection = null;
      
      // Identify sections based on their content
      allSections.forEach(section => {
        const sectionText = section.textContent || '';
        const headings = section.querySelectorAll('h3');
        
        // Check each heading to identify the section
        headings.forEach(heading => {
          const headingText = heading.textContent || '';
          
          if (headingText.includes('Population Overview')) {
            populationOverview = section;
          } else if (section.classList.contains('grid-cols-4') || section.querySelectorAll('.StatCard').length > 0) {
            demographicsSection = section;
          } else if (headingText.includes('Gender Distribution') || headingText.includes('Risk Level')) {
            chartsSection = section;
          } else if (headingText.includes('Transfer Status')) {
            transferSection = section;
          } else if (headingText.includes('Top Crimes')) {
            topCrimesSection = section;
          }
        });
      });
      
      // If we couldn't identify sections by headings, try alternative methods
      if (!chartsSection) {
        // Look for container with gender/risk charts
        chartsSection = tempReport.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
      }
      
      if (!transferSection) {
        // Look for container with transfer chart (typically the 3rd bg-white section)
        const whiteSections = tempReport.querySelectorAll('.bg-white.rounded-xl');
        if (whiteSections.length >= 3) {
          transferSection = whiteSections[2];
        }
      }
      
      if (!topCrimesSection) {
        // Look for container with top crimes (typically the 4th bg-white section)
        const whiteSections = tempReport.querySelectorAll('.bg-white.rounded-xl');
        if (whiteSections.length >= 4) {
          topCrimesSection = whiteSections[3];
        }
      }
      
      console.log("Section identification results:", {
        populationOverview: !!populationOverview,
        demographicsSection: !!demographicsSection,
        chartsSection: !!chartsSection,
        transferSection: !!transferSection,
        topCrimesSection: !!topCrimesSection
      });
      
      // Adjust chart container heights in the temp report
      const chartContainers = tempReport.querySelectorAll('[class*="h-[300px]"]');
      chartContainers.forEach(container => {
        container.style.height = 'auto';
        container.style.minHeight = '300px';
      });
      
      // Create the PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pageWidth - (margin * 2);
      
      // Add title to first page
      pdf.setFontSize(18);
      pdf.text('Woreda Correctional Facility Report', pageWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(`Period: ${getDateRangeString()}`, pageWidth / 2, 28, { align: 'center' });
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 34, { align: 'center' });
      
      // Function to add a section to the PDF
      const addSectionToPDF = async (section, title, yStart = 40) => {
        if (!section) {
          console.log(`Section "${title}" not found, skipping`);
          return yStart;
        }
        
        console.log(`Rendering section: ${title}`);
        
        try {
          // First, ensure the section has a visible background color
          const originalBg = section.style.backgroundColor;
          section.style.backgroundColor = '#ffffff';
          
          // Generate canvas from the section
          const canvas = await html2canvas(section, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          
          // Calculate dimensions
          const imgWidth = usableWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Check if this section will fit on the current page
          if (yStart + imgHeight > pageHeight - margin) {
            // Add a new page if it won't fit
            pdf.addPage();
            yStart = 20; // Reset Y position on new page
            
            // Add section title on new page
            pdf.setFontSize(14);
            pdf.text(title, pageWidth / 2, yStart, { align: 'center' });
            yStart += 10;
          } else {
            // Add section title
            pdf.setFontSize(14);
            pdf.text(title, pageWidth / 2, yStart, { align: 'center' });
            yStart += 10;
          }
          
          // Add the image
          pdf.addImage(
            canvas.toDataURL('image/png'),
            'PNG',
            margin,
            yStart,
            imgWidth,
            imgHeight
          );
          
          // Restore original background
          section.style.backgroundColor = originalBg;
          
          return yStart + imgHeight + 10;
        } catch (sectionError) {
          console.error(`Error rendering section ${title}:`, sectionError);
          return yStart;
        }
      };
      
      // Add each section to the PDF
      let yPosition = 40;
      
      // Add population overview
      if (populationOverview) {
        yPosition = await addSectionToPDF(populationOverview, 'Population Overview', yPosition);
      }
      
      // Add demographics section
      if (demographicsSection) {
        yPosition = await addSectionToPDF(demographicsSection, 'Inmate Demographics', yPosition);
      }
      
      // Always start charts on a new page to avoid splitting
      pdf.addPage();
      yPosition = 20;
      
      // Add gender & risk charts
      if (chartsSection) {
        yPosition = await addSectionToPDF(chartsSection, 'Gender & Risk Distribution', yPosition);
      }
      
      // Always put transfer chart on a new page
      pdf.addPage();
      yPosition = 20;
      
      // Add transfer section
      if (transferSection) {
        yPosition = await addSectionToPDF(transferSection, 'Transfer Status Distribution', yPosition);
      }
      
      // Add top crimes section (if it fits, otherwise new page)
      if (topCrimesSection) {
        yPosition = await addSectionToPDF(topCrimesSection, 'Top Crimes', yPosition);
      }
      
      // Remove the temporary div from the DOM
      document.body.removeChild(tempDiv);
      
      // Save the PDF
      pdf.save(`Woreda_Report_${timeRange}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Report exported to PDF successfully");
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF: " + error.message);
    }
  };

  // Apply filters
  const applyFilters = () => {
    // Validate date range for custom filter
    if (timeRange === 'custom' && (!filters.startDate || !filters.endDate)) {
      toast.warning("Please select both start and end dates for custom filtering");
      return;
    }
    
    // Prevent invalid date ranges
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      
      if (startDate > endDate) {
        toast.error("Start date cannot be after end date");
        return;
      }
      
      // If the range is more than 3 years, warn the user
      const threeYearsInMs = 3 * 365 * 24 * 60 * 60 * 1000;
      if (endDate - startDate > threeYearsInMs) {
        toast.warning("Large date ranges may cause performance issues and return incomplete data");
      }
    }
    
    // Apply the custom filters
    setLoading(true);
    fetchWoredaReports(filters)
      .then(() => {
        // Close filter panel when filters are applied
        setFilterOpen(false);
        toast.success("Filters applied successfully");
      })
      .catch(error => {
        console.error("Error applying filters:", error);
        toast.error("Failed to apply filters");
      });
  };
  
  const resetFilters = () => {
    // Only reset back to default time range if we're in custom mode
    const shouldResetTimeRange = timeRange === 'custom';
    
    // Reset filters to empty state
    setFilters({
      startDate: '',
      endDate: '',
      prisonId: '',
      crimeType: '',
    });
    
    // Reset to default time range (week) and fetch data
    if (shouldResetTimeRange) {
      setTimeRange('week');
      // Data will be fetched via the timeRange useEffect
      toast.info("Filters reset to default view");
    } else {
      toast.info("Additional filters cleared");
    }
    
    // Close the filter panel
    setFilterOpen(false);
  };

  // Include a function to refresh data with visual feedback
  const refreshData = () => {
    if (timeRange !== 'custom') {
      fetchWoredaReports();
      toast.info("Refreshing report data...");
    } else if (filters.startDate && filters.endDate) {
      applyFilters();
      toast.info("Refreshing with custom filters...");
    } else {
      toast.warning("Please select a date range");
    }
  };

  const StatCard = ({ title, value, icon, color, trend, percentage, onClick }) => (
    <div 
      className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 cursor-pointer ${onClick ? 'hover:border-blue-300 hover:border' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center mb-3">
        <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')}`}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold ml-3">{title}</h3>
      </div>
      <div className="flex items-baseline">
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        {percentage && <p className="ml-2 text-sm text-gray-500">({percentage})</p>}
      </div>
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
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex flex-col sm:flex-row justify-between items-start sm:items-center transition-all duration-300 ${
            isCollapsed
              ? "left-16 w-[calc(100%-4rem)]"
              : "left-64 w-[calc(100%-16rem)]"
          }`}
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Reports Dashboard</h1>
            <p className="text-sm text-gray-500">
              {timeRange === 'custom' 
                ? `Custom period: ${getDateRangeString()}`
                : `${dateRanges[timeRange].label} view: ${getDateRangeString()}`
              } 
              <span className="text-xs ml-2">Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            {/* Time Range Selector - New improved dropdown */}
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
                <option value="custom">Custom Range</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FaChevronDown className="h-3 w-3" />
              </div>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={refreshData}
              className="p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1"
              title="Refresh Data"
            >
              <FaSync className="w-3.5 h-3.5" />
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
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Additional Filters</h5>
                    </div>
                    
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
                      <label className="block text-xs text-gray-600 mb-1">Crime Type</label>
                      <select
                        value={filters.crimeType}
                        onChange={(e) => setFilters({...filters, crimeType: e.target.value})}
                        className="w-full p-1.5 border rounded-md text-sm"
                      >
                        <option value="">All Crimes</option>
                        {crimeTypes.map(crime => (
                          <option key={crime._id} value={crime.name}>
                            {crime.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex gap-2 pt-2 justify-between">
                      <button
                        onClick={resetFilters}
                        className="px-3 py-1.5 text-gray-600 bg-gray-100 rounded-md text-sm hover:bg-gray-200 transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={applyFilters}
                        className="px-3 py-1.5 text-white bg-blue-600 rounded-md text-sm hover:bg-blue-700 transition-colors"
                      >
                        Apply Filters
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

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-28">
          {loading ? (
            <div className="space-y-6">
              {/* Skeleton loading state */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="h-8 w-48 bg-gray-200 rounded-md mb-4 animate-pulse"></div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                      <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                      <div className="h-7 w-16 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 w-12 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                  <div className="h-6 w-40 bg-gray-200 rounded mb-6"></div>
                  <div className="h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="h-32 w-32 rounded-full bg-gray-200 animate-pulse"></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                  <div className="h-6 w-40 bg-gray-200 rounded mb-6"></div>
                  <div className="h-[300px] bg-gray-100 rounded-lg"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8" ref={reportRef}>
              {/* Report Header for Print */}
              <div className="print-only mb-8 hidden">
                <h1 className="text-3xl font-bold text-center">Woreda Correctional Facility Report</h1>
                <p className="text-center text-gray-600">
                  Time Period: {getDateRangeString()} | 
                  Generated on: {new Date().toLocaleString()}
                </p>
                <div className="border-b-2 border-gray-300 my-4"></div>
              </div>

              {/* Status Summary */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-6 transition-all duration-300 hover:shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <FaUsers className="mr-2 text-blue-600" />
                  Population Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md">
                    <p className="text-sm text-gray-600 mb-1">Total Inmates</p>
                    <p className="text-2xl font-bold text-blue-600">{woredaStats.totalInmates || "0"}</p>
                    <p className="text-xs text-gray-500 mt-1"></p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md">
                    <p className="text-sm text-gray-600 mb-1">In Custody</p>
                    <p className="text-2xl font-bold text-green-600">{woredaStats.activeInmates || "0"}</p>
                    <p className="text-xs text-gray-500 mt-1">({formatPercentage(woredaStats.activeInmates, woredaStats.totalInmates)})</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md">
                    <p className="text-sm text-gray-600 mb-1">Transferred Out</p>
                    <p className="text-2xl font-bold text-purple-600">{woredaStats.transferred || "0"}</p>
                    <p className="text-xs text-gray-500 mt-1">({formatPercentage(woredaStats.transferred, woredaStats.totalInmates)})</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md">
                    <p className="text-sm text-gray-600 mb-1">Pending Transfers</p>
                    <p className="text-2xl font-bold text-yellow-600">{woredaStats.transferRequested || "0"}</p>
                    <p className="text-xs text-gray-500 mt-1">({formatPercentage(woredaStats.transferRequested, woredaStats.totalInmates)})</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md">
                    <p className="text-sm text-gray-600 mb-1">Cancelled</p>
                    <p className="text-2xl font-bold text-gray-600">{woredaStats.cancelled || "0"}</p>
                    <p className="text-xs text-gray-500 mt-1">({formatPercentage(woredaStats.cancelled, woredaStats.totalInmates)})</p>
                  </div>
                </div>
              </div>

              {/* Gender and Risk Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Male Inmates"
                  value={woredaStats.maleInmates || "0"}
                  icon={<FaMale className="text-indigo-600 text-xl" />}
                  color="text-indigo-600"
                  trend={woredaStats.genderTrend}
                  percentage={formatPercentage(woredaStats.maleInmates, woredaStats.totalInmates)}
                />
                <StatCard
                  title="Female Inmates"
                  value={woredaStats.femaleInmates || "0"}
                  icon={<FaFemale className="text-pink-600 text-xl" />}
                  color="text-pink-600"
                  trend={-woredaStats.genderTrend}
                  percentage={formatPercentage(woredaStats.femaleInmates, woredaStats.totalInmates)}
                />
                <StatCard
                  title="High Risk Inmates"
                  value={woredaStats.highRiskInmates || "0"}
                  icon={<FaExclamationTriangle className="text-red-600 text-xl" />}
                  color="text-red-600"
                  trend={woredaStats.riskTrend}
                  percentage={formatPercentage(
                    woredaStats.highRiskInmates, 
                    (woredaStats.highRiskInmates + woredaStats.mediumRiskInmates + woredaStats.lowRiskInmates)
                  )}
                />
                <StatCard
                  title="Medium Risk Inmates"
                  value={woredaStats.mediumRiskInmates || "0"}
                  icon={<FaExclamationCircle className="text-yellow-600 text-xl" />}
                  color="text-yellow-600"
                  trend={woredaStats.riskTrend}
                  percentage={formatPercentage(
                    woredaStats.mediumRiskInmates, 
                    (woredaStats.highRiskInmates + woredaStats.mediumRiskInmates + woredaStats.lowRiskInmates)
                  )}
                />
              </div>

              {/* Gender Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <FaUserFriends className="mr-2 text-indigo-600" />
                    Gender Distribution
                  </h3>
                  <div className="h-[300px] chart-container">
                    {woredaStats.totalInmates > 0 && (woredaStats.maleInmates > 0 || woredaStats.femaleInmates > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Male",
                                value: woredaStats.maleInmates || 0,
                              },
                              {
                                name: "Female",
                                value: woredaStats.femaleInmates || 0,
                              },
                              {
                                name: "Unspecified",
                                value: woredaStats.totalInmates - woredaStats.maleInmates - woredaStats.femaleInmates,
                              }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {[woredaStats.maleInmates, woredaStats.femaleInmates, 
                              (woredaStats.totalInmates - woredaStats.maleInmates - woredaStats.femaleInmates)].map(
                              (value, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={index === 0 ? "#4F46E5" : index === 1 ? "#EC4899" : "#9CA3AF"}
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [value, 'Count']}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                              padding: "8px",
                              fontSize: "12px"
                            }}
                          />
                          <Legend verticalAlign="bottom" height={36} />
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
                <div className="bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <FaExclamationCircle className="mr-2 text-red-600" />
                    Risk Level Distribution
                  </h3>
                  <div className="h-[300px] chart-container">
                    {woredaStats.totalInmates > 0 && (woredaStats.highRiskInmates > 0 || woredaStats.mediumRiskInmates > 0 || woredaStats.lowRiskInmates > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "High Risk",
                                value: woredaStats.highRiskInmates || 0,
                              },
                              {
                                name: "Medium Risk",
                                value: woredaStats.mediumRiskInmates || 0,
                              },
                              {
                                name: "Low Risk",
                                value: woredaStats.lowRiskInmates || 0,
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            <Cell key="high" fill="#EF4444" />
                            <Cell key="medium" fill="#F59E0B" />
                            <Cell key="low" fill="#10B981" />
                          </Pie>
                          <Tooltip
                            formatter={(value) => [value, 'Count']}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                              padding: "8px",
                              fontSize: "12px"
                            }}
                          />
                          <Legend verticalAlign="bottom" height={36} />
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

              {/* Transfer Status Distribution */}
              <div className="bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <FaExchangeAlt className="mr-2 text-blue-600" />
                  Transfer Status Distribution
                </h3>
                <div className="h-[300px] chart-container">
                  {woredaStats.totalInmates > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: "In Custody", value: woredaStats.activeInmates || 0, color: "#10B981" },
                        { name: "Pending", value: woredaStats.transferRequested || 0, color: "#F59E0B" },
                        { name: "Under Review", value: woredaStats.underReview || 0, color: "#F97316" },
                        { name: "Transferred", value: woredaStats.transferred || 0, color: "#8B5CF6" },
                        { name: "Cancelled", value: woredaStats.cancelled || 0, color: "#6B7280" },
                      ]}>
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value, name, props) => {
                            return [
                              value, 
                              'Count',
                              `${((value / woredaStats.totalInmates) * 100).toFixed(1)}%`
                            ];
                          }}
                          itemSorter={(item) => -item.value}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            padding: "8px",
                            fontSize: "12px"
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar 
                          dataKey="value" 
                          name="Inmates" 
                          fill="#4F46E5"
                          radius={[4, 4, 0, 0]}
                          barSize={40}
                          animationDuration={1000}
                        >
                          {
                            [
                              { name: "In Custody", value: woredaStats.activeInmates || 0, color: "#10B981" },
                              { name: "Pending", value: woredaStats.transferRequested || 0, color: "#F59E0B" },
                              { name: "Under Review", value: woredaStats.underReview || 0, color: "#F97316" },
                              { name: "Transferred", value: woredaStats.transferred || 0, color: "#8B5CF6" },
                              { name: "Cancelled", value: woredaStats.cancelled || 0, color: "#6B7280" },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))
                          }
                        </Bar>
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
              <div className="bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <FaGavel className="mr-2 text-gray-700" />
                  Top Crimes
                </h3>
                <div className="space-y-4">
                  {woredaStats.topCrimes && woredaStats.topCrimes.length > 0 ? (
                    woredaStats.topCrimes.map((crime, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-3 group hover:bg-gray-50 p-2 rounded-md transition-colors">
                        <span className="text-gray-700 font-medium">{crime.name}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-48 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full group-hover:bg-blue-700 transition-all duration-500" 
                              style={{ 
                                width: `${Math.min(100, (crime.count / Math.max(...woredaStats.topCrimes.map(c => c.count))) * 100)}%` 
                              }}
                            ></div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-semibold min-w-[40px] text-right">{crime.count}</span>
                            <span className="text-xs text-gray-500">
                              {crime.percentage ? `${crime.percentage.toFixed(1)}%` : formatPercentage(crime.count, woredaStats.topCrimes.reduce((sum, c) => sum + c.count, 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-gray-500">No crime data available</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Footer for printed reports */}
              <div className="print-only mt-8 pt-4 border-t border-gray-300 text-center text-gray-500 text-sm hidden">
                <p>This report was generated from the Prison Management System.</p>
                <p>Confidential - For official use only.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
