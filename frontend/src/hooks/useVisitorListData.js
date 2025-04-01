import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import axiosInstance from "../utils/axiosInstance.js";

const useVisitorListData = () => {
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Handle filter change
  const handleFilterChange = (status) => {
    setFilter(status);
    filterVisitorsByStatus(status);
  };

  // Filter visitors by status
  const filterVisitorsByStatus = (status) => {
    if (!visitors.length) {
      setFilteredVisitors([]);
      return;
    }

    // First apply search filtering if there's a query
    let filtered = visitors;
    if (searchQuery) {
      filtered = applySearchFilter(visitors, searchQuery);
    }

    // Then apply status filtering
    if (status === "all") {
      setFilteredVisitors(filtered);
    } else {
      const statusFiltered = filtered.filter((visitor) => 
        visitor.status && visitor.status.toLowerCase() === status.toLowerCase()
      );
      setFilteredVisitors(statusFiltered);
    }
  };

  // Apply search filter to visitors
  const applySearchFilter = (visitorList, query) => {
    if (!query) return visitorList;
    
    const lowercaseQuery = query.toLowerCase();
    
    return visitorList.filter((visitor) =>
      (visitor.firstName && visitor.firstName.toLowerCase().includes(lowercaseQuery)) ||
      (visitor.middleName && visitor.middleName.toLowerCase().includes(lowercaseQuery)) ||
      (visitor.lastName && visitor.lastName.toLowerCase().includes(lowercaseQuery)) ||
      (visitor.phone && visitor.phone.toLowerCase().includes(lowercaseQuery)) ||
      (visitor.purpose && visitor.purpose.toLowerCase().includes(lowercaseQuery))
    );
  };

  // Handle search input
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    // Apply both filters
    let filtered = visitors;
    if (query) {
      filtered = applySearchFilter(visitors, query);
    }
    
    if (filter !== "all") {
      filtered = filtered.filter((visitor) => 
        visitor.status && visitor.status.toLowerCase() === filter.toLowerCase()
      );
    }
    
    setFilteredVisitors(filtered);
  };

  // Fetch visitor data
  const fetchVisitors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem("user"));
      
      // Check if user has permission to view visitors
      if (userData?.role === "police-officer") {
        // Police officer data handling
        return await fetchPoliceOfficerData(userData._id);
      }
      
      // For other roles, try the main endpoint
      return await fetchStandardData(userData?._id);
      
    } catch (error) {
      console.error("Error fetching visitors:", error);
      setError(error.response?.data?.message || "Failed to load visitors");
      toast.error(error.response?.data?.message || "Failed to load visitors");
      setVisitors([]);
      setFilteredVisitors([]);
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data for police officers
  const fetchPoliceOfficerData = async (userId) => {
    // For police officers, explicitly request all schedules
    try {
      setLoading(true);
      const response = await axiosInstance.get("/visitor/schedule/schedules", {
        params: { userId: userId, status: "all" }
      });
      
      if (response.data && response.data.success) {
        const visitorsData = response.data.data;
        const data = processVisitorData(visitorsData);
        setVisitors(data);
        filterVisitorsByStatus(filter);
        return Promise.resolve(data);
      } 
      
      // If direct approach fails, try fallback endpoints
      return await fetchPoliceOfficerFallback(userId);
    } catch (error) {
      // Try fallback if the main approach fails
      return await fetchPoliceOfficerFallback(userId);
    } finally {
      setLoading(false);
    }
  };

  // Fallback function for police officers to try different endpoints
  const fetchPoliceOfficerFallback = async (userId) => {
    // Try different endpoints for police officer
    const endpoints = [
      {
        url: "/visitor/schedule/schedules",
        params: { userId: userId, status: "all" }
      },
      {
        url: "/visitor/schedule/schedules",
        params: { userId: userId }
      },
      {
        url: "/visitor/schedule/schedules",
        params: { userId: userId, status: "pending" }
      },
      {
        url: "/visitor/schedule/pending",
        params: { userId: userId }
      },
      {
        url: "/visitor/schedule/assigned",
        params: { userId: userId }
      }
    ];
    
    let response = null;
    for (const endpoint of endpoints) {
      try {
        console.log("Trying endpoint:", endpoint.url, endpoint.params);
        response = await axiosInstance.get(endpoint.url, {
          params: endpoint.params
        });
        
        if (response.data && (response.data.success || response.data.visitors || Array.isArray(response.data))) {
          console.log("Successful response from endpoint:", endpoint.url);
          break;
        }
      } catch (e) {
        console.log("Failed endpoint:", endpoint.url, e.message);
        // Continue trying other endpoints
      }
    }
    
    if (!response) {
      toast.error("Failed to fetch visitors. Please try again later.");
      setVisitors([]);
      setFilteredVisitors([]);
      return Promise.reject(new Error("Failed to fetch visitors"));
    }
    
    // Handle different response formats
    let visitorsData = [];
    if (response.data.success && response.data.data) {
      visitorsData = response.data.data;
    } else if (response.data.visitors) {
      visitorsData = response.data.visitors;
    } else if (Array.isArray(response.data)) {
      visitorsData = response.data;
    }
    
    if (visitorsData.length === 0) {
      toast("No visitors found", {
        icon: 'ℹ️',
        duration: 3000,
      });
      setVisitors([]);
      setFilteredVisitors([]);
      return Promise.resolve([]);
    }
    
    const data = processVisitorData(visitorsData);
    setVisitors(data);
    filterVisitorsByStatus(filter);
    return Promise.resolve(data);
  };

  // Fetch data for standard users
  const fetchStandardData = async (userId) => {
    // Try main endpoint with all schedules
    try {
      const response = await axiosInstance.get("/visitor/schedule/schedules", {
        params: { userId: userId, status: "all" }
      });
      
      // If that returns empty, try without status filter
      if (!response.data || !response.data.data || response.data.data.length === 0) {
        try {
          const responseNoStatus = await axiosInstance.get("/visitor/schedule/schedules", {
            params: { userId: userId }
          });
          
          if (responseNoStatus.data && responseNoStatus.data.data && responseNoStatus.data.data.length > 0) {
            const visitorsData = responseNoStatus.data.data;
            const data = processVisitorData(visitorsData);
            setVisitors(data);
            filterVisitorsByStatus(filter);
            return Promise.resolve(data);
          }
        } catch (innerError) {
          // Continue to try alternative endpoint
        }
        
        // If still no results, try alternative endpoint
        return await fetchAlternativeData(userId);
      }
      
      // Handle main endpoint response
      if (response.data && response.data.success) {
        const visitorsData = response.data.data;
        
        if (visitorsData.length === 0) {
          toast("No visitors found in the system", {
            icon: 'ℹ️',
            duration: 3000,
          });
          setVisitors([]);
          setFilteredVisitors([]);
          return Promise.resolve([]);
        }
        
        const data = processVisitorData(visitorsData);
        setVisitors(data);
        filterVisitorsByStatus(filter);
        return Promise.resolve(data);
      } else {
        setError("Invalid data received from server");
        toast.error("Failed to load visitor data. Unexpected format received.");
        return Promise.reject(new Error("Invalid data received from server"));
      }
    } catch (error) {
      return await fetchAlternativeData(userId);
    }
  };

  // Try alternative endpoint if main fails
  const fetchAlternativeData = async (userId) => {
    try {
      const altResponse = await axiosInstance.get("/visitor/allVisitors", {
        params: { userId: userId }
      });
      
      if (altResponse.data && altResponse.data.visitors) {
        const visitorsData = altResponse.data.visitors;
        const data = processVisitorData(visitorsData);
        setVisitors(data);
        filterVisitorsByStatus(filter);
        return Promise.resolve(data);
      }
      
      setVisitors([]);
      setFilteredVisitors([]);
      return Promise.resolve([]);
    } catch (error) {
      setError("Failed to load visitors from alternative source");
      toast.error("Failed to load visitor data from all sources");
      return Promise.reject(error);
    }
  };

  // Process visitor data from API
  const processVisitorData = (visitorsData) => {
    let Uno = 1;
    return visitorsData.map((visitor) => ({
      U_no: Uno++,
      _id: visitor._id,
      firstName: visitor.firstName || '',
      middleName: visitor.middleName || '',
      lastName: visitor.lastName || '',
      phone: visitor.phone || 'Not provided',
      purpose: visitor.purpose || 'Not specified',
      date: visitor.visitDate ? new Date(visitor.visitDate).toLocaleDateString() : 
            visitor.date ? new Date(visitor.date).toLocaleDateString() : 'No date',
      visitDate: visitor.visitDate || visitor.date || null,
      visitTime: visitor.visitTime || 'Not specified',
      createdAt: visitor.createdAt ? new Date(visitor.createdAt).toLocaleDateString() : 'Unknown',
      status: visitor.status || 'Pending',
      photo: visitor.photo || visitor.visitorPhoto || '',
      idPhoto: visitor.idPhoto || visitor.idImage || '',
      photos: visitor.photos || [],
      email: visitor.email || '',
      idType: visitor.idType || '',
      idNumber: visitor.idNumber || '',
      address: visitor.address || '',
      relationship: visitor.relationship || '',
      notes: visitor.notes || '',
      inmate: visitor.inmateId || null,
    }));
  };

  // Get status color utility function
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "postponed":
        return "bg-orange-100 text-orange-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // Initialize data fetch on mount
  useEffect(() => {
    fetchVisitors();
  }, []);

  // Update filtered visitors when filter or search query changes
  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      filterVisitorsByStatus(filter);
    }
  }, [visitors, filter, searchQuery]);

  return {
    visitors,
    filteredVisitors,
    loading,
    error,
    filter,
    searchQuery,
    setVisitors,
    setFilteredVisitors,
    fetchVisitors,
    handleFilterChange,
    handleSearch,
    getStatusColor
  };
};

export default useVisitorListData; 