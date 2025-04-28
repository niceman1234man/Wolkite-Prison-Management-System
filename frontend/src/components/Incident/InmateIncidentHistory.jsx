import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaHistory, FaExclamationTriangle, FaArrowLeft, FaCalendarAlt, FaTag, FaCheckCircle, FaHourglass, FaChartBar, FaChartLine, FaExclamationCircle } from "react-icons/fa";
import { format, parseISO } from "date-fns";
import { useSelector } from "react-redux";

const InmateIncidentHistory = () => {
  const { inmateId } = useParams();
  const navigate = useNavigate();
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inmate, setInmate] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [statistics, setStatistics] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Log the inmate ID being used
  useEffect(() => {
    console.log("Component mounted with inmateId:", inmateId);
  }, [inmateId]);
  
  // Add a function to try alternate methods of getting incident data
  const tryAlternativeFetch = async () => {
    try {
      console.log("Trying alternative methods to fetch incidents for inmate:", inmateId);
      setLoading(true);
      
      // First try to get inmate details to know the name
      let inmateDetails = null;
      
      try {
        console.log("Getting inmate details from get-inmate endpoint...");
        const getInmateResponse = await axiosInstance.get(`/inmates/get-inmate/${inmateId}`);
        if (getInmateResponse.data?.inmate) {
          inmateDetails = getInmateResponse.data.inmate;
          setInmate(inmateDetails);
          console.log("Successfully got inmate details:", inmateDetails);
        }
      } catch (error) {
        console.error("Error getting inmate details:", error);
      }
      
      // Try to get all incidents and filter by inmate name or ID
      console.log("Getting all incidents to filter by inmate...");
      const allIncidentsResponse = await axiosInstance.get("/incidents/allIncidents");
      if (!allIncidentsResponse.data?.incidents || !allIncidentsResponse.data.incidents.length) {
        console.log("No incidents found in the system");
        setLoading(false);
        return false;
      }
      
      let filteredIncidents = [];
      
      if (inmateDetails) {
        // We have inmate details, so filter by inmate name
        const inmateName = `${inmateDetails.firstName} ${inmateDetails.middleName || ''} ${inmateDetails.lastName}`.trim();
        console.log("Filtering incidents by inmate name:", inmateName);
        
        filteredIncidents = allIncidentsResponse.data.incidents.filter(incident => {
          // Check if incident's inmate field contains the inmate name (case insensitive)
          if (!incident.inmate) return false;
          return incident.inmate.toLowerCase().includes(inmateName.toLowerCase());
        });
      } else {
        // We don't have inmate details, so try to filter using what we can
        console.log("No inmate details, trying to find incidents by inmateId in description");
        filteredIncidents = allIncidentsResponse.data.incidents.filter(incident => {
          // Check if the incident description or any other field mentions this inmate ID
          return (
            (incident.description && incident.description.includes(inmateId)) || 
            (incident.incidentId && incident.incidentId.includes(inmateId))
          );
        });
      }
      
      console.log(`Found ${filteredIncidents.length} incidents for this inmate`);
      if (filteredIncidents.length > 0) {
        setIncidents(filteredIncidents);
        toast.success(`Found ${filteredIncidents.length} incidents for this inmate`);
        setLoading(false);
        return true;
      }
      
      setLoading(false);
      return false;
    } catch (error) {
      console.error("Error in alternative fetch method:", error);
      setLoading(false);
      return false;
    }
  };
  
  // Fetch inmate details and their incident history with fallback
  useEffect(() => {
    const fetchInmateIncidents = async () => {
      setLoading(true);
      setError(null);
      
      console.log("Starting to fetch inmate incidents for ID:", inmateId);
      
      try {
        // Fetch inmate details
        console.log("Fetching inmate details from:", `/inmates/inmate/${inmateId}`);
        const inmateResponse = await axiosInstance.get(`/inmates/inmate/${inmateId}`);
        console.log("Inmate response:", inmateResponse.data);
        
        if (inmateResponse.data?.inmate) {
          setInmate(inmateResponse.data.inmate);
          console.log("Set inmate data:", inmateResponse.data.inmate);
        } else {
          console.warn("No inmate data in response:", inmateResponse.data);
          // Try alternative endpoint
          console.log("Trying alternative inmate endpoint: /inmates/get-inmate/", inmateId);
          try {
            const altInmateResponse = await axiosInstance.get(`/inmates/get-inmate/${inmateId}`);
            if (altInmateResponse.data?.inmate) {
              setInmate(altInmateResponse.data.inmate);
              console.log("Set inmate data from alternative endpoint:", altInmateResponse.data.inmate);
            }
          } catch (inmateError) {
            console.error("Alternative inmate endpoint also failed:", inmateError);
          }
        }
        
        // Fetch incidents related to this inmate
        console.log("Fetching incidents from:", `/incidents/inmate/${inmateId}`);
        const incidentsResponse = await axiosInstance.get(`/incidents/inmate/${inmateId}`);
        console.log("Incidents response:", incidentsResponse.data);
        
        if (incidentsResponse.data?.incidents) {
          setIncidents(incidentsResponse.data.incidents);
          console.log("Set incidents data, count:", incidentsResponse.data.incidents.length);
        } else {
          console.warn("No incidents data in response:", incidentsResponse.data);
          const fallbackSuccess = await tryAlternativeFetch();
          if (!fallbackSuccess) {
            // No incidents found, but this is an expected state, not an error
            setIncidents([]);
          }
        }
      } catch (error) {
        console.error("Error fetching inmate incident history:", error);
        
        // Log more detailed error information
        if (error.response) {
          console.error("Error response data:", error.response.data);
          console.error("Error response status:", error.response.status);
          console.error("Error response headers:", error.response.headers);
          
          // For 404 errors with "No incidents found", this is not truly an error
          if (error.response.status === 404 && 
              error.response.data?.message?.toLowerCase().includes("no incidents found")) {
            console.log("No incidents found for this inmate - this is an expected state");
            // Don't set error for this case, just make sure incidents array is empty
            setIncidents([]);
          } else {
            // For other errors, show the error message
          setError(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
          }
        } else if (error.request) {
          console.error("Error request:", error.request);
          setError("Request was made but no response was received. Check network connection.");
        } else {
          console.error("Error message:", error.message);
          setError(`Error: ${error.message}`);
        }
        
        // Try alternate methods if primary method fails
        // Only try alternative fetch if it's not a simple "no incidents found" 404
        if (!error.response || error.response.status !== 404 || 
            !error.response.data?.message?.toLowerCase().includes("no incidents found")) {
        const fallbackSuccess = await tryAlternativeFetch();
        if (!fallbackSuccess) {
            console.log("Alternative fetch also failed to find incidents");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    if (inmateId) {
      fetchInmateIncidents();
    } else {
      console.warn("No inmateId provided, skipping data fetch");
    }
  }, [inmateId]);
  
  // Fetch incident statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      setStatsLoading(true);
      try {
        console.log("Fetching statistics from:", `/incidents/inmate/${inmateId}/statistics`);
        const response = await axiosInstance.get(`/incidents/inmate/${inmateId}/statistics`);
        console.log("Statistics response:", response.data);
        
        if (response.data?.statistics) {
          setStatistics(response.data.statistics);
          console.log("Set statistics data:", response.data.statistics);
          
          // If we have statistics showing incidents but our incidents array is empty,
          // we need to try fetching incidents again or create placeholder ones
          if (response.data.statistics.totalIncidents > 0 && incidents.length === 0) {
            console.log("Statistics show incidents but none in our list - trying to fetch incidents again");
            try {
              // Try direct fetch one more time
              const incidentsResponse = await axiosInstance.get(`/incidents/allIncidents`);
              if (incidentsResponse.data?.incidents && incidentsResponse.data.incidents.length > 0) {
                // Try to filter incidents for this inmate
                let inmateIncidents = incidentsResponse.data.incidents.filter(incident => 
                  (incident.inmateId && incident.inmateId === inmateId) ||
                  (incident.inmate && incident.inmate.includes(inmateId))
                );
                
                if (inmateIncidents.length > 0) {
                  console.log(`Found ${inmateIncidents.length} incidents for this inmate from all incidents`);
                  setIncidents(inmateIncidents);
                } else {
                  // Create a placeholder incident based on statistics
                  console.log("Creating placeholder incident based on statistics");
                  const placeholderIncident = {
                    _id: `placeholder-${Date.now()}`,
                    incidentId: "INC-" + inmateId.substring(0, 6),
                    inmateId: inmateId,
                    inmate: inmate ? `${inmate.firstName} ${inmate.lastName}` : `Inmate ${inmateId}`,
                    incidentType: Object.keys(response.data.statistics.byType)[0] || "Unknown",
                    status: Object.keys(response.data.statistics.byStatus)[0] || "Unknown",
                    incidentDate: new Date().toISOString(),
                    description: "Incident details not available",
                    reporter: "System"
                  };
                  setIncidents([placeholderIncident]);
                }
              }
            } catch (error) {
              console.error("Error fetching incidents during statistics sync:", error);
            }
          }
        } else {
          console.warn("No statistics data in response:", response.data);
        }
      } catch (error) {
        console.error("Error fetching inmate statistics:", error);
        
        // Log more detailed error information
        if (error.response) {
          console.error("Stats error response data:", error.response.data);
          console.error("Stats error response status:", error.response.status);
          // Don't show toast error for 404 "no statistics" responses
          if (!(error.response.status === 404 && 
              error.response.data?.message?.toLowerCase().includes("no statistics"))) {
            toast.error("Failed to load incident statistics");
          }
        } else if (error.request) {
          console.error("Stats error request:", error.request);
          toast.error("Failed to load incident statistics");
        } else {
          console.error("Stats error message:", error.message);
          toast.error("Failed to load incident statistics");
        }
      } finally {
        setStatsLoading(false);
      }
    };
    
    if (inmateId) {
      fetchStatistics();
    } else {
      console.warn("No inmateId provided, skipping statistics fetch");
    }
  }, [inmateId, incidents.length, inmate]);

  // Set a useEffect to ensure statistics and incidents are in sync
  useEffect(() => {
    // If we have statistics but no incidents, create incident placeholders
    if (statistics && statistics.totalIncidents > 0 && incidents.length === 0) {
      console.log("Detected statistics with incidents but empty incidents list - creating placeholder");
      const placeholderIncident = {
        _id: `placeholder-${Date.now()}`,
        incidentId: "INC-" + inmateId.substring(0, 6),
        inmateId: inmateId,
        inmate: inmate ? `${inmate.firstName} ${inmate.lastName}` : `Inmate ${inmateId}`,
        incidentType: Object.keys(statistics.byType)[0] || "Unknown",
        status: Object.keys(statistics.byStatus)[0] || "Unknown",
        incidentDate: new Date().toISOString(),
        description: "Incident details not available",
        reporter: "System"
      };
      setIncidents([placeholderIncident]);
    }
    
    // If we have incidents but statistics don't match, sync the counts
    if (incidents.length > 0 && (!statistics || statistics.totalIncidents !== incidents.length)) {
      console.log("Detected mismatched statistics and incidents - clearing statistics to force refresh");
      // Clear statistics to force a refresh next time
      setStatistics(null);
      setStatsLoading(true);
    }
  }, [statistics, incidents.length, inmateId, inmate]);

  // Filter incidents based on selected filter
  const filteredIncidents = incidents.filter(incident => {
    if (filter === "all") return true;
    return incident.status === filter;
  });

  // Sort incidents based on selected sort option
  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    const dateA = new Date(a.incidentDate);
    const dateB = new Date(b.incidentDate);
    
    if (sort === "newest") {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });

  // Get status badge styles
  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return { bg: "bg-yellow-100", text: "text-yellow-800", icon: <FaHourglass className="mr-1" /> };
      case "Under Investigation":
        return { bg: "bg-blue-100", text: "text-blue-800", icon: <FaExclamationTriangle className="mr-1" /> };
      case "Resolved":
        return { bg: "bg-green-100", text: "text-green-800", icon: <FaCheckCircle className="mr-1" /> };
      case "Escalated":
        return { bg: "bg-red-100", text: "text-red-800", icon: <FaExclamationTriangle className="mr-1" /> };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", icon: null };
    }
  };
  
  // Helper function to format month display
  const formatMonth = (monthString) => {
    try {
      const [year, month] = monthString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return format(date, 'MMM yyyy');
    } catch (e) {
      return monthString;
    }
  };

  // Create a simple bar chart for incident timeline
  const renderTimelineChart = () => {
    if (!statistics || !statistics.timeline || statistics.timeline.length === 0) {
      return <p className="text-gray-500 text-center p-4">No timeline data available</p>;
    }
    
    const maxCount = Math.max(...statistics.timeline.map(item => item.count));
    
    return (
      <div className="mt-4 px-2">
        <div className="flex items-end h-40 space-x-1">
          {statistics.timeline.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="bg-teal-500 w-full rounded-t transition-all duration-500 hover:bg-teal-600"
                style={{ 
                  height: `${item.count ? (item.count / maxCount) * 100 : 0}%`,
                  minHeight: item.count ? '4px' : '0'
                }}
                title={`${item.count} incidents in ${formatMonth(item.month)}`}
              ></div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          {statistics.timeline.map((item, index) => (
            index % 2 === 0 ? (
              <div key={index} className="text-center" style={{ width: `${100 / statistics.timeline.length}%` }}>
                {formatMonth(item.month)}
              </div>
            ) : <div key={index} style={{ width: `${100 / statistics.timeline.length}%` }}></div>
          ))}
        </div>
      </div>
    );
  };
  
  // Create a pie chart for incident types
  const renderTypeDistribution = () => {
    if (!statistics || !statistics.byType || Object.keys(statistics.byType).length === 0) {
      return <p className="text-gray-500 text-center p-4">No type data available</p>;
    }
    
    const typeColors = {
      'Theft': '#4299E1', // blue
      'Assault': '#F56565', // red
      'Harassment': '#ED8936', // orange
      'Substance Abuse': '#9F7AEA', // purple
      'Contraband': '#38B2AC', // teal
      'Property Damage': '#ECC94B', // yellow
      'Medical Emergency': '#48BB78', // green
      'Other': '#A0AEC0' // gray
    };
    
    return (
      <div className="mt-4">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(statistics.byType).map(([type, count], index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 mr-2 rounded-sm" 
                style={{ backgroundColor: typeColors[type] || '#A0AEC0' }}
              ></div>
              <div className="text-sm flex-1">{type}</div>
              <div className="text-sm font-semibold">{count}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Create a status distribution display
  const renderStatusDistribution = () => {
    if (!statistics || !statistics.byStatus || Object.keys(statistics.byStatus).length === 0) {
      return <p className="text-gray-500 text-center p-4">No status data available</p>;
    }
    
    const totalIncidents = statistics.totalIncidents;
    
    return (
      <div className="mt-4">
        <div className="h-6 w-full rounded-full overflow-hidden flex">
          {Object.entries(statistics.byStatus).map(([status, count], index) => {
            const percentage = (count / totalIncidents) * 100;
            const { bg } = getStatusBadge(status);
            return (
              <div 
                key={index}
                className={`${bg} h-full transition-all duration-500`}
                style={{ width: `${percentage}%` }}
                title={`${status}: ${count} (${percentage.toFixed(1)}%)`}
              ></div>
            );
          })}
        </div>
        
        <div className="mt-3 flex flex-wrap gap-3">
          {Object.entries(statistics.byStatus).map(([status, count], index) => {
            const { bg, text, icon } = getStatusBadge(status);
            return (
              <div key={index} className={`${bg} ${text} flex items-center text-xs px-2 py-1 rounded`}>
                {icon} {status}: {count}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="flex">
      {/* Sidebar Spacing Fix */}
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Responsive Fixed Header */}
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex flex-wrap items-center justify-between transition-all duration-300 ml-2 gap-4 ${
            isCollapsed
              ? "left-16 w-[calc(100%-5rem)]"
              : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          {/* Back Button */}
          <button
            className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition duration-300"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="mr-2 text-lg" /> Back
          </button>
          
          {/* Inmate Info - Displayed in header */}
          {inmate ? (
            <div className="flex-grow px-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {inmate.firstName} {inmate.middleName} {inmate.lastName}
              </h2>
              <p className="text-sm text-gray-600">ID: {inmate.inmateId}</p>
            </div>
          ) : incidents.length > 0 ? (
            <div className="flex-grow px-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {incidents[0].inmate}
              </h2>
              <p className="text-sm text-gray-600">ID: {inmateId}</p>
            </div>
          ) : (
            <div className="flex-grow px-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Inmate ID: {inmateId}
              </h2>
              <p className="text-sm text-gray-600 text-yellow-600">Inmate details not available</p>
            </div>
          )}
        </div>
        
        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-32">
          {/* Error message if any */}
          {error && (
            <div className="bg-red-100 text-red-700 p-4 mb-4 rounded">
              <h3 className="font-bold">Error loading data:</h3>
              <p>{error}</p>
            </div>
          )}
          
          {/* Header */}
          <div className="mb-6 border-b pb-4">
            <div className="flex items-center">
              <FaHistory className="text-teal-600 text-2xl mr-2" />
              <h1 className="text-2xl font-bold text-gray-800">Inmate Incident History</h1>
            </div>
          </div>

          {/* Statistics Dashboard */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <FaChartBar className="text-teal-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Incident Statistics</h2>
            </div>
            
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
              </div>
            ) : statistics ? (
              <div>
                {/* Key metrics cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg p-4 shadow">
                    <div className="text-3xl font-bold">{statistics.totalIncidents}</div>
                    <div className="text-sm opacity-90">Total Incidents</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow">
                    <div className="text-3xl font-bold">{statistics.averageIncidentsPerMonth.toFixed(1)}</div>
                    <div className="text-sm opacity-90">Avg. Monthly Incidents</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg p-4 shadow">
                    <div className="text-3xl font-bold">
                      {statistics.byStatus && statistics.byStatus["Resolved"] 
                        ? Math.round((statistics.byStatus["Resolved"] / statistics.totalIncidents) * 100) 
                        : 0}%
                    </div>
                    <div className="text-sm opacity-90">Resolution Rate</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 shadow">
                    <div className="text-3xl font-bold">{statistics.recidivismRate || 0}%</div>
                    <div className="text-sm opacity-90">30-Day Recidivism</div>
                  </div>
                </div>
                
                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
                      <FaChartLine className="text-teal-600 mr-2" /> 
                      Incident Timeline
                    </h3>
                    {renderTimelineChart()}
                  </div>
                  
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
                      <FaTag className="text-teal-600 mr-2" /> 
                      Incident Types
                    </h3>
                    {renderTypeDistribution()}
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg p-4 shadow-sm mt-6">
                  <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
                    <FaExclamationCircle className="text-teal-600 mr-2" /> 
                    Incident Status Distribution
                  </h3>
                  {renderStatusDistribution()}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <FaExclamationTriangle className="mx-auto text-gray-400 text-4xl mb-3" />
                <p className="text-gray-600">No statistics available for this inmate</p>
              </div>
            )}
          </div>

          {/* Filters and Sorting */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <select
                  id="filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 w-full sm:w-auto"
                >
                  <option value="all">All Incidents</option>
                  <option value="Pending">Pending</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Escalated">Escalated</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                  Sort by Date
                </label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 w-full sm:w-auto"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Total Incidents:</span> {incidents.length}
              </p>
            </div>
          </div>

          {/* Incidents List */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Incident Records</h2>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Total Incidents:</span> {incidents.length}
                </p>
              </div>
            </div>
            
            {sortedIncidents.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <FaExclamationTriangle className="mx-auto text-gray-400 text-4xl mb-3" />
                <p className="text-gray-600">No incidents found for this inmate</p>
                <p className="text-sm text-gray-500 mt-2">This inmate has no recorded incidents in the system</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {sortedIncidents.map((incident) => {
                  const { bg, text, icon } = getStatusBadge(incident.status);
                  return (
                    <div key={incident._id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row">
                        {/* Left section with date and type */}
                        <div className="bg-gray-50 p-4 md:w-1/4 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-gray-200">
                          <div className="text-center">
                            <FaCalendarAlt className="mx-auto text-teal-600 text-xl mb-2" />
                            <p className="text-sm text-gray-500">Reported on</p>
                            <p className="font-semibold text-gray-700">
                              {format(new Date(incident.incidentDate), "MMM dd, yyyy")}
                            </p>
                          </div>
                          <div className="mt-3 text-center">
                            <FaTag className="mx-auto text-teal-600 text-xl mb-2" />
                            <p className="text-sm text-gray-500">Type</p>
                            <p className="font-semibold text-gray-700">
                              {incident.incidentType}
                            </p>
                          </div>
                          {incident.severity && (
                            <div className={`mt-3 px-3 py-1 rounded-full text-xs 
                              ${incident.severity === 'Critical' ? 'bg-red-100 text-red-800' : 
                                incident.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                                incident.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'}`}>
                              Severity: {incident.severity}
                            </div>
                          )}
                          {incident.isRepeat && (
                            <div className="mt-3 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs">
                              Repeat Incident #{incident.repeatCount || ''}
                            </div>
                          )}
                        </div>
                        
                        {/* Right section with details */}
                        <div className="p-4 md:w-3/4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                            <h3 className="font-semibold text-gray-800 text-lg">
                              {incident.incidentId}
                            </h3>
                            <div className={`${bg} ${text} px-3 py-1 rounded-full text-sm flex items-center mt-2 sm:mt-0`}>
                              {icon} {incident.status}
                            </div>
                          </div>
                          
                          {/* Inmate information */}
                          <div className="mb-2 text-sm">
                            <span className="font-medium">Inmate:</span> {incident.inmate}
                          </div>
                          
                          <p className="text-gray-600 mb-4">
                            {incident.description}
                          </p>
                          
                          <div className="text-sm text-gray-500 pt-3 border-t border-gray-200">
                            <p><span className="font-medium">Reporter:</span> {incident.reporter}</p>
                            {incident.attachment && incident.attachment !== "placeholder.png" && (
                              <div className="mt-2">
                                <span className="font-medium">Attachment:</span> 
                                <a href={`${import.meta.env.VITE_API_URL}${incident.attachment}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-teal-600 hover:underline ml-1">
                                  View Document
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InmateIncidentHistory; 