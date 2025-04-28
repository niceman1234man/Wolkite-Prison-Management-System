import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useParams } from "react-router-dom";
import { FaUser, FaCalendarAlt, FaChartLine, FaClipboardList, FaBalanceScale, FaFilter, FaDownload, FaSearch } from "react-icons/fa";

const InmateBehaviorGraph = () => {
  const { _id: inmateId } = useParams(); // Destructure inmateId correctly
  const [behaviorData, setBehaviorData] = useState([]); // Store behavior logs
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Add filter state
  const [filteredBehaviorData, setFilteredBehaviorData] = useState([]);
  const [filterType, setFilterType] = useState("all"); // all, month, year, custom
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  });
  const [yearOptions, setYearOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Add new state for parole data
  const [paroleData, setParoleData] = useState({
    sentenceYear: 0,
    fullName: "",
    age: "",
    caseType: "",
    startDate: null,
    paroleDate: null,
    releasedDate: null,
    durationToParole: '',
    durationFromParoleToEnd: ''
  });

  // Fetch behavior data and inmate details
  useEffect(() => {
    const fetchInmateData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("No token found. Please log in again.");
          return;
        }

        const paroleResponse = await axiosInstance.get(`/parole-tracking/${inmateId}`);
        if (paroleResponse.data) {
          const behaviorLogs = paroleResponse.data.parole.behaviorLogs || [];
          const formattedData = behaviorLogs.map((log) => ({
            name: log.rule, 
            points: log.points,
            date: log.date, 
          }));
         
          const total = formattedData.reduce((sum, log) => sum + log.points, 0);
          setBehaviorData(formattedData);
          setFilteredBehaviorData(formattedData);
          setTotalPoints(total);

          // Extract unique years from behavior logs for filter options
          const years = [...new Set(formattedData.map(log => new Date(log.date).getFullYear()))];
          setYearOptions(years.sort((a, b) => b - a)); // Sort years in descending order

          // Set parole data
          setParoleData({
            sentenceYear: Number(paroleResponse.data.parole.sentenceYear),
            fullName: paroleResponse.data.parole.fullName,
            age: paroleResponse.data.parole.age,
            caseType: paroleResponse.data.parole.caseType,
            startDate: paroleResponse.data.parole.startDate,
            paroleDate: paroleResponse.data.parole.paroleDate,
            releasedDate: paroleResponse.data.parole.releasedDate,
            durationToParole: paroleResponse.data.parole.durationToParole,
            durationFromParoleToEnd: paroleResponse.data.parole.durationFromParoleToEnd
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (inmateId) {
      fetchInmateData();
    }
  }, [inmateId]);
  
  // Apply filter when filter options change
  useEffect(() => {
    filterBehaviorData();
  }, [filterType, selectedMonth, selectedYear, dateRange, searchQuery, behaviorData]);
  
  // Filter behavior data based on filter type
  const filterBehaviorData = () => {
    if (!behaviorData.length) return;
    
    let filtered = [...behaviorData];
    
   
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.name.toLowerCase().includes(query)
      );
    }
    
    // Apply date filters
    switch (filterType) {
      case "month":
        filtered = filtered.filter(log => {
          const logDate = new Date(log.date);
          return logDate.getMonth() === selectedMonth && 
                 logDate.getFullYear() === selectedYear;
        });
        break;
        
      case "year":
        filtered = filtered.filter(log => {
          const logDate = new Date(log.date);
          return logDate.getFullYear() === selectedYear;
        });
        break;
        
      case "custom":
        if (dateRange.start && dateRange.end) {
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999); // Include the entire end day
          
          filtered = filtered.filter(log => {
            const logDate = new Date(log.date);
            return logDate >= startDate && logDate <= endDate;
          });
        }
        break;
        
      default: // "all"
        // No additional filtering needed
        break;
    }
    
    setFilteredBehaviorData(filtered);
  };
  
  const calculateTrackedDays = () => {
    if (behaviorData.length > 0) {
      const firstDate = new Date(behaviorData[0].date);
      const lastDate = new Date(behaviorData[behaviorData.length - 1].date);
      return (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    }
    return 0;
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
  };
  
  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
  };
  
  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };
  
  const handleDateRangeChange = (type, e) => {
    setDateRange(prev => ({
      ...prev,
      [type]: e.target.value
    }));
  };
  
  // Function to export data as CSV
  const exportToCSV = () => {
    // Create CSV content
    const headers = ["Date", "Behavior Type", "Points"];
    const csvRows = [headers];
    
    filteredBehaviorData.forEach(log => {
      const row = [
        formatDate(log.date),
        log.name,
        log.points
      ];
      csvRows.push(row);
    });
    
    // Convert to CSV format
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `behavior_log_${paroleData.fullName.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const trackedDays = calculateTrackedDays();
  const averagePointsPerDay = trackedDays > 0 ? totalPoints / trackedDays : 0;
  const totalSentenceDays = paroleData.sentenceYear * 365;
  const maxPointsPerDay = 105;
  const progressPercentage = (averagePointsPerDay / maxPointsPerDay) * 100;

  const progressBarPerDay = (trackedDays / totalSentenceDays) * 100;
  const progressBarPerMonth = (trackedDays / (totalSentenceDays / 12)) * 100;
  const progressBarParole = paroleData.startDate && paroleData.paroleDate 
    ? ((new Date() - new Date(paroleData.startDate)) / (new Date(paroleData.paroleDate) - new Date(paroleData.startDate))) * 100 
    : 0;
  
  const labels = ["Progress", "Per Day", "Per Month", "Parole Progress"];
  
  const getProgressBarColor = (percentage) => {
    if (percentage >= 80) return "bg-green-600";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-600";
  };

  // Array of month names for dropdown
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="max-w-7xl mx-auto mt-8 bg-white p-6 rounded-xl shadow-lg ml-60">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-center text-teal-700">Inmate Behavior Report</h2>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
          <span className="ml-3 text-gray-600">Loading behavior data...</span>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Inmate Details Card */}
          <div className="lg:w-1/3 bg-gray-50 p-5 rounded-lg shadow-md">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-teal-600 text-white p-3 rounded-full">
                <FaUser className="text-2xl" />
              </div>
              <h3 className="ml-3 text-xl font-semibold text-gray-800">Inmate Information</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm">
                <span className="font-medium text-gray-700">Full Name:</span>
                <span className="font-semibold text-gray-900">{paroleData.fullName}</span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm">
                <span className="font-medium text-gray-700">Age:</span>
                <span>{paroleData.age}</span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm">
                <span className="font-medium text-gray-700">Case Type:</span>
                <span>{paroleData.caseType}</span>
              </div>
            </div>
          </div>
          
          {/* Timeline & Dates */}
          <div className="lg:w-1/3 bg-gray-50 p-5 rounded-lg shadow-md">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-teal-600 text-white p-3 rounded-full">
                <FaCalendarAlt className="text-2xl" />
              </div>
              <h3 className="ml-3 text-xl font-semibold text-gray-800">Sentence Timeline</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm">
                <span className="font-medium text-gray-700">Start Date:</span>
                <span>{formatDate(paroleData.startDate)}</span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm">
                <span className="font-medium text-gray-700">Parole Date:</span>
                <span className="text-blue-600 font-semibold">{formatDate(paroleData.paroleDate)}</span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm">
                <span className="font-medium text-gray-700">End Date:</span>
                <span>{formatDate(paroleData.releasedDate)}</span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm">
                <span className="font-medium text-gray-700">Start to Parole:</span>
                <span>{paroleData.durationToParole}</span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm">
                <span className="font-medium text-gray-700">Parole to End:</span>
                <span>{paroleData.durationFromParoleToEnd}</span>
              </div>
            </div>
          </div>
          
          {/* Performance Metrics */}
          <div className="lg:w-1/3 bg-gray-50 p-5 rounded-lg shadow-md">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-teal-600 text-white p-3 rounded-full">
                <FaChartLine className="text-2xl" />
              </div>
              <h3 className="ml-3 text-xl font-semibold text-gray-800">Performance Metrics</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm">
                <span className="font-medium text-gray-700">Total Points:</span>
                <span className="font-bold text-lg text-teal-700">{totalPoints}</span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm">
                <span className="font-medium text-gray-700">Tracked Days:</span>
                <span>{trackedDays.toFixed(0)}</span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm">
                <span className="font-medium text-gray-700">Avg. Points Per Day:</span>
                <span className={averagePointsPerDay >= 2.5 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                  {averagePointsPerDay.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm">
                <span className="font-medium text-gray-700">Parole Eligibility:</span>
                <span className={totalPoints >= 75 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {totalPoints >= 75 ? "Eligible" : "Not Eligible"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Progress Bars */}
      {!loading && (
        <div className="mt-8 bg-gray-50 p-5 rounded-lg shadow-md">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-teal-600 text-white p-3 rounded-full">
              <FaBalanceScale className="text-2xl" />
            </div>
            <h3 className="ml-3 text-xl font-semibold text-gray-800">Progress Indicators</h3>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { label: "Behavior Progress", value: progressPercentage, description: "Points relative to maximum" },
              { label: "Daily Progress", value: progressBarPerDay, description: "Day progress of sentence" },
              { label: "Monthly Progress", value: progressBarPerMonth, description: "Month progress of sentence" },
              { label: "Parole Timeline", value: progressBarParole, description: "Progress toward parole date" }
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center w-40">
                <h4 className="font-medium text-center mb-2">{item.label}</h4>
                <div className="w-20 h-64 bg-gray-200 rounded-full relative mb-2 overflow-hidden">
                  <div 
                    className={`${getProgressBarColor(item.value)} rounded-t-full absolute bottom-0 w-full transition-all duration-700 ease-in-out`} 
                    style={{ height: `${Math.min(item.value, 100)}%` }}
                  ></div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{item.value.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Behavior Logs with Filtering */}
      {!loading && behaviorData.length > 0 && (
        <div className="mt-8 bg-gray-50 p-5 rounded-lg shadow-md">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-teal-600 text-white p-3 rounded-full">
              <FaClipboardList className="text-2xl" />
            </div>
            <h3 className="ml-3 text-xl font-semibold text-gray-800">Behavior Log History</h3>
          </div>
          
          {/* Filter Controls */}
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center">
                <FaFilter className="text-teal-700 mr-2" />
                <span className="font-medium text-gray-700 mr-3">Filter by:</span>
                <select 
                  value={filterType} 
                  onChange={handleFilterChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Records</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <FaSearch className="text-teal-700 mr-2" />
                <input 
                  type="text" 
                  placeholder="Search behavior types..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <button 
                onClick={exportToCSV}
                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
              >
                <FaDownload className="mr-2" />
                Export Data
              </button>
            </div>
            
            {/* Conditional Filter Options */}
            <div className="mt-4">
              {filterType === "month" && (
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <select 
                      value={selectedMonth} 
                      onChange={handleMonthChange}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {months.map((month, index) => (
                        <option key={index} value={index}>{month}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <select 
                      value={selectedYear} 
                      onChange={handleYearChange}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {yearOptions.length ? (
                        yearOptions.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))
                      ) : (
                        <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                      )}
                    </select>
                  </div>
                </div>
              )}
              
              {filterType === "year" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select 
                    value={selectedYear} 
                    onChange={handleYearChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {yearOptions.length ? (
                      yearOptions.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))
                    ) : (
                      <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                    )}
                  </select>
                </div>
              )}
              
              {filterType === "custom" && (
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input 
                      type="date" 
                      value={dateRange.start || ''} 
                      onChange={(e) => handleDateRangeChange('start', e)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input 
                      type="date" 
                      value={dateRange.end || ''} 
                      onChange={(e) => handleDateRangeChange('end', e)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Results count */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredBehaviorData.length} of {behaviorData.length} records
            </div>
          </div>
          
          {/* Data Table */}
          <div className="overflow-x-auto">
            {filteredBehaviorData.length > 0 ? (
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-teal-600 text-white">
                  <tr>
                    <th className="py-3 px-4 text-left">Date</th>
                    <th className="py-3 px-4 text-left">Behavior Type</th>
                    <th className="py-3 px-4 text-left">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBehaviorData.map((log, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="py-3 px-4">{formatDate(log.date)}</td>
                      <td className="py-3 px-4">{log.name}</td>
                      <td className="py-3 px-4 font-medium">{log.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg">
                <p className="text-gray-500">No records found matching your filter criteria</p>
              </div>
            )}
          </div>
          
          {/* Pagination placeholder - could be implemented if needed */}
        </div>
      )}
    </div>
  );
};

export default InmateBehaviorGraph;
