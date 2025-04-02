import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import axiosInstance from "../utils/axiosInstance";
import { format } from "date-fns";

const useVisitScheduleData = () => {
  // Use useRef to store the actual data to prevent re-renders
  const dataRef = useRef({
    schedules: [],
    visitors: []
  });
  
  // State only for triggering renders when needed
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visitors, setVisitors] = useState([]);
  const [visitorLoading, setVisitorLoading] = useState(false);
  // Add a version counter for controlled re-renders
  const [version, setVersion] = useState(0);
  
  // Use ref to track mounted state to prevent state updates after unmount
  const isMounted = useRef(true);

  // Handle filter change - make these truly stable with useCallback
  const handleStatusFilterChange = useCallback((status) => {
    setStatusFilter(status);
  }, []);

  // Handle search change - memoized
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Utility function to link visitors with schedules - memoized
  const linkVisitorsToSchedules = useCallback((schedulesData, visitorsData) => {
    if (!visitorsData?.length || !schedulesData?.length) return schedulesData;
    
    return schedulesData.map(schedule => {
      // Try to match visitor by user ID or visitor ID if available
      const visitor = visitorsData.find(v => 
        (v._id && schedule.visitorId && v._id === schedule.visitorId) || 
        (v.user && schedule.userId && v.user === schedule.userId)
      );
      
      // If no direct ID match, try to match by name and relationship
      const matchByDetails = !visitor ? visitorsData.find(v => {
        // If we have names in both places, try to match
        if (
          schedule.relationship && 
          v.relation && 
          schedule.relationship.toLowerCase() === v.relation.toLowerCase()
        ) {
          return true;
        }
        return false;
      }) : null;
      
      return {
        ...schedule,
        visitorInfo: visitor || matchByDetails ? {
          name: `${(visitor || matchByDetails).firstName || ''} ${(visitor || matchByDetails).middleName || ''} ${(visitor || matchByDetails).lastName || ''}`.trim(),
          phone: (visitor || matchByDetails).phone || 'N/A',
          relation: (visitor || matchByDetails).relation || schedule.relationship || 'N/A'
        } : null
      };
    });
  }, []);

  // Safe update function to prevent unnecessary re-renders
  const safeUpdateData = useCallback((newSchedules, newVisitors) => {
    if (!isMounted.current) return;
    
    // Only update state if data actually changed
    let hasChanged = false;
    
    if (newSchedules && JSON.stringify(dataRef.current.schedules) !== JSON.stringify(newSchedules)) {
      dataRef.current.schedules = newSchedules;
      setSchedules(newSchedules);
      hasChanged = true;
    }
    
    if (newVisitors && JSON.stringify(dataRef.current.visitors) !== JSON.stringify(newVisitors)) {
      dataRef.current.visitors = newVisitors;
      setVisitors(newVisitors);
      hasChanged = true;
    }
    
    // Only increment version if data actually changed
    if (hasChanged) {
      setVersion(v => v + 1);
    }
  }, []);

  // Fetch visitors data
  const fetchVisitors = useCallback(async () => {
    if (!isMounted.current) return [];
    
    try {
      setVisitorLoading(true);
      console.log("Fetching visitors...");
      
      const response = await axiosInstance.get("/visitor/allVisitors");
      
      if (!isMounted.current) return [];
      
      // Handle the correct response format from the API
      if (response.data && response.data.visitors) {
        console.log("Visitors fetched successfully:", response.data.visitors.length);
        const newVisitors = response.data.visitors;
        
        // Update with safe function
        safeUpdateData(null, newVisitors);
        
        return newVisitors;
      } else {
        console.error("Unexpected visitor data format:", response.data);
        if (isMounted.current) {
          toast.error("Failed to load visitor data");
        }
        return [];
      }
    } catch (error) {
      console.error('Error fetching visitors:', error);
      if (isMounted.current) {
        toast.error(error.response?.data?.error || 'Failed to load visitor data');
      }
      return [];
    } finally {
      if (isMounted.current) {
        setVisitorLoading(false);
      }
    }
  }, [safeUpdateData]);

  // Fetch schedule data
  const fetchSchedules = useCallback(async () => {
    if (!isMounted.current) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching visitor schedules...");
      const response = await axiosInstance.get("/visitor/schedule/schedules");
      
      if (!isMounted.current) return [];
      
      if (response.data.success) {
        console.log("Schedules fetched successfully:", response.data.data.length);
        
        // Use visitors from ref to avoid circular dependencies
        const currentVisitors = dataRef.current.visitors;
        
        // Process schedules with visitor data
        const enrichedSchedules = linkVisitorsToSchedules(response.data.data, currentVisitors);
        
        // Update with safe function
        safeUpdateData(enrichedSchedules, null);
        
        return enrichedSchedules;
      } else {
        console.error("Error in schedule response:", response.data);
        setError(response.data.message || 'Failed to fetch schedules');
        if (isMounted.current) {
          toast.error(response.data.message || 'Failed to fetch schedules');
        }
        return [];
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      setError('Error fetching schedules');
      if (isMounted.current) {
        toast.error('Failed to load schedules. Please try again.');
      }
      return [];
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [linkVisitorsToSchedules, safeUpdateData]);

  // Cancel schedule
  const cancelSchedule = useCallback(async (scheduleId) => {
    if (!isMounted.current) return false;
    
    try {
      const loadingId = toast.loading("Cancelling visit...");
      const response = await axiosInstance.put(`/visitor/schedule/${scheduleId}/cancel`);
      
      // Always dismiss the loading toast if still mounted
      if (isMounted.current) {
        toast.dismiss(loadingId);
      }
      
      if (response.data.success) {
        if (isMounted.current) {
          toast.success("Visit cancelled successfully");
          fetchSchedules();
        }
        return true;
      } else {
        if (isMounted.current) {
          toast.error(response.data.message || "Failed to cancel visit");
        }
        return false;
      }
    } catch (error) {
      // Dismiss all toasts to prevent stale UI
      if (isMounted.current) {
        toast.dismiss();
        console.error("Error cancelling schedule:", error);
        toast.error(error.response?.data?.message || "Failed to cancel visit");
      }
      return false;
    }
  }, [fetchSchedules]);

  // Initialize data fetch on mount
  useEffect(() => {
    // Mark as mounted
    isMounted.current = true;
    
    const loadData = async () => {
      if (isMounted.current) {
        const newVisitors = await fetchVisitors();
        // Store visitors first, then fetch schedules to use them
        if (newVisitors.length > 0) {
          dataRef.current.visitors = newVisitors;
        }
        await fetchSchedules();
      }
    };
    
    loadData();
    
    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, [fetchVisitors, fetchSchedules]);

  // Get status color utility function
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  }, []);

  return {
    schedules,
    visitors,
    loading,
    error,
    statusFilter,
    searchQuery,
    visitorLoading,
    fetchVisitors,
    fetchSchedules,
    handleStatusFilterChange,
    handleSearchChange,
    cancelSchedule,
    getStatusColor,
    version // Include version in returned values to help with memoization in components
  };
};

export default useVisitScheduleData; 