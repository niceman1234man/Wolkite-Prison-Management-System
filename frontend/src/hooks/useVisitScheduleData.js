import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import axiosInstance from "../utils/axiosInstance";
import { format } from "date-fns";

const useVisitScheduleData = () => {
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [visitors, setVisitors] = useState([]);
  const [visitorLoading, setVisitorLoading] = useState(false);

  // Handle filter change
  const handleFilterChange = (status) => {
    setFilter(status);
    filterSchedulesByStatus(status);
  };

  // Filter schedules by status
  const filterSchedulesByStatus = (status) => {
    if (status === "all") {
      setFilteredSchedules(schedules);
    } else {
      const filtered = schedules.filter((schedule) => 
        schedule.status && schedule.status.toLowerCase() === status.toLowerCase()
      );
      setFilteredSchedules(filtered);
    }
  };

  // Fetch visitor data
  const fetchVisitors = async () => {
    try {
      setVisitorLoading(true);
      const response = await axiosInstance.get("/visitor/allVisitors");
      
      if (response.data && response.data.visitors) {
        setVisitors(response.data.visitors);
        console.log("Visitors loaded:", response.data.visitors.length);
      } else {
        console.error("Unexpected visitor data format:", response.data);
        setVisitors([]);
        toast.error("Failed to load visitor data");
      }
      return response.data.visitors || [];
    } catch (error) {
      console.error("Error fetching visitors:", error);
      toast.error(error.response?.data?.error || "Failed to load visitors");
      setVisitors([]);
      return [];
    } finally {
      setVisitorLoading(false);
    }
  };

  // Utility function to link visitors with schedules
  const linkVisitorsToSchedules = (schedules, visitors) => {
    if (!visitors.length || !schedules.length) return schedules;
    
    return schedules.map(schedule => {
      // Try to match visitor by user ID or visitor ID if available
      const visitor = visitors.find(v => 
        (v._id && schedule.visitorId && v._id === schedule.visitorId) || 
        (v.user && schedule.user && v.user === schedule.user)
      );
      
      // If no direct ID match, try to match by name and relationship
      const matchByDetails = !visitor ? visitors.find(v => {
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
  };

  // Fetch schedule data
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get("/visitor/schedule/schedules");
      
      if (response.data.success) {
        // Process schedules with visitor data
        const enrichedSchedules = linkVisitorsToSchedules(response.data.data, visitors);
        setSchedules(enrichedSchedules);
        filterSchedulesByStatus(filter);
        return Promise.resolve(enrichedSchedules);
      } else {
        setError(response.data.message || 'Failed to fetch schedules');
        toast.error(response.data.message || 'Failed to fetch schedules');
        return Promise.reject(new Error(response.data.message || 'Failed to fetch schedules'));
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setError('Error fetching schedules');
      toast.error('Failed to load schedules. Please try again.');
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel schedule
  const handleCancelSchedule = async (scheduleId) => {
    try {
      const loadingId = toast.loading("Cancelling visit...");
      const response = await axiosInstance.put(`/visitor/schedule/schedule/${scheduleId}/cancel`);
      
      // Always dismiss the loading toast
      toast.dismiss(loadingId);
      
      if (response.data.success) {
        toast.success("Visit cancelled successfully");
        fetchSchedules();
        return true;
      } else {
        toast.error(response.data.message || "Failed to cancel visit");
        return false;
      }
    } catch (error) {
      // Dismiss all toasts to prevent stale UI
      toast.dismiss();
      console.error("Error cancelling schedule:", error);
      toast.error(error.response?.data?.message || "Failed to cancel visit");
      return false;
    }
  };

  // Handle delete schedule
  const handleDeleteSchedule = async (scheduleId) => {
    try {
      const loadingId = toast.loading("Deleting visit...");
      const response = await axiosInstance.delete(`/visitor/schedule/schedule/${scheduleId}`);
      
      toast.dismiss(loadingId);
      
      if (response.data.success) {
        toast.success("Visit deleted successfully");
        fetchSchedules();
        return true;
      } else {
        toast.error(response.data.message || "Failed to delete visit");
        return false;
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error deleting schedule:", error);
      toast.error(error.response?.data?.message || "Failed to delete visit");
      return false;
    }
  };

  // Initialize data fetch on mount
  useEffect(() => {
    const loadData = async () => {
      const visitorData = await fetchVisitors();
      await fetchSchedules();
      // Re-link visitors if we have new data
      if (visitorData.length > 0 && schedules.length > 0) {
        const enrichedSchedules = linkVisitorsToSchedules(schedules, visitorData);
        setSchedules(enrichedSchedules);
        filterSchedulesByStatus(filter);
      }
    };
    
    loadData();
  }, []);

  // Update filtered schedules when filter changes
  useEffect(() => {
    filterSchedulesByStatus(filter);
  }, [schedules, filter]);

  // Get status color utility function
  const getStatusColor = (status) => {
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
  };

  return {
    schedules,
    filteredSchedules,
    loading,
    error,
    filter,
    visitors,
    visitorLoading,
    setSchedules,
    setFilteredSchedules,
    fetchSchedules,
    fetchVisitors,
    handleFilterChange,
    handleCancelSchedule,
    handleDeleteSchedule,
    getStatusColor
  };
};

export default useVisitScheduleData; 