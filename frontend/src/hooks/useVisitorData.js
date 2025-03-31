import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import axiosInstance from "../utils/axiosInstance.js";

const useVisitorData = () => {
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    filterVisitorsByStatus(status);
  };

  // Filter visitors by status
  const filterVisitorsByStatus = (status) => {
    if (status === "all") {
      setFilteredVisitors(visitors);
    } else {
      const filtered = visitors.filter((visitor) => 
        visitor.status && visitor.status.toLowerCase() === status.toLowerCase()
      );
      setFilteredVisitors(filtered);
    }
  };

  // Filter visitors by search query
  const filterVisitorsBySearch = (query) => {
    if (!query) {
      filterVisitorsByStatus(statusFilter);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    
    const filtered = visitors.filter((visitor) =>
      (visitor.firstName && visitor.firstName.toLowerCase().includes(lowercaseQuery)) ||
      (visitor.middleName && visitor.middleName.toLowerCase().includes(lowercaseQuery)) ||
      (visitor.lastName && visitor.lastName.toLowerCase().includes(lowercaseQuery)) ||
      (visitor.phone && visitor.phone.toLowerCase().includes(lowercaseQuery)) ||
      (visitor.purpose && visitor.purpose.toLowerCase().includes(lowercaseQuery))
    );

    // Apply status filter to search results if not "all"
    if (statusFilter !== "all") {
      const statusFiltered = filtered.filter((visitor) => 
        visitor.status && visitor.status.toLowerCase() === statusFilter.toLowerCase()
      );
      setFilteredVisitors(statusFiltered);
    } else {
      setFilteredVisitors(filtered);
    }
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
        // For police officers, first try to fetch all schedules
        try {
          const response = await axiosInstance.get("/visitor/schedule/schedules", {
            params: { userId: userData._id, status: "all" }
          });
          
          if (response.data && response.data.success) {
            const visitorsData = response.data.data;
            const data = processVisitorData(visitorsData);
            setVisitors(data);
            filterVisitorsByStatus(statusFilter);
            return;
          }
        } catch (directError) {
          console.log("Error fetching all schedules:", directError.message);
          // Continue to fallback endpoints
        }

        // Try different endpoints for police officer (as fallback)
        const endpoints = [
          {
            url: "/visitor/schedule/schedules",
            params: { userId: userData._id, status: "all" }
          },
          {
            url: "/visitor/schedule/schedules",
            params: { userId: userData._id }
          },
          {
            url: "/visitor/schedule/schedules",
            params: { userId: userData._id, status: "pending" }
          },
          {
            url: "/visitor/schedule/pending",
            params: { userId: userData._id }
          },
          {
            url: "/visitor/schedule/assigned",
            params: { userId: userData._id }
          }
        ];
        
        let response = null;
        for (const endpoint of endpoints) {
          try {
            response = await axiosInstance.get(endpoint.url, {
              params: endpoint.params
            });
            
            if (response.data && (response.data.success || response.data.visitors || Array.isArray(response.data))) {
              break;
            }
          } catch (e) {
            // Continue trying other endpoints
          }
        }
        
        if (!response) {
          toast.error("Failed to fetch visitors. Please try again later.");
          setVisitors([]);
          setFilteredVisitors([]);
          return;
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
          toast("No pending visitors found for your review", {
            icon: 'ℹ️',
            duration: 3000,
          });
          setVisitors([]);
          setFilteredVisitors([]);
          return;
        }
        
        const data = processVisitorData(visitorsData);
        setVisitors(data);
        filterVisitorsByStatus(statusFilter);
        return;
      }
      
      // For other roles, try the main endpoint
      const response = await axiosInstance.get("/visitor/schedule/schedules", {
        params: { userId: userData?._id }
      });
      
      // If main endpoint returns empty, try alternative endpoint
      if (!response.data || !response.data.data || response.data.data.length === 0) {
        const altResponse = await axiosInstance.get("/visitor/allVisitors", {
          params: { userId: userData?._id }
        });
        
        if (altResponse.data && altResponse.data.visitors) {
          const visitorsData = altResponse.data.visitors;
          const data = processVisitorData(visitorsData);
          setVisitors(data);
          filterVisitorsByStatus(statusFilter);
          return;
        }
      }
      
      // Handle main endpoint response
      if (response.data && response.data.success) {
        const visitorsData = response.data.data;
        
        if (visitorsData.length === 0) {
          toast("No visitors found", {
            icon: 'ℹ️',
            duration: 3000,
          });
          setVisitors([]);
          setFilteredVisitors([]);
          return;
        }
        
        const data = processVisitorData(visitorsData);
        setVisitors(data);
        filterVisitorsByStatus(statusFilter);
      } else {
        setError("Invalid data received from server");
        setVisitors([]);
        setFilteredVisitors([]);
        toast.error("Failed to load visitor data. Unexpected format received.");
      }
      
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load visitors");
      toast.error(error.response?.data?.message || "Failed to load visitors");
      setVisitors([]);
      setFilteredVisitors([]);
    } finally {
      setLoading(false);
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
      createdAt: visitor.createdAt ? new Date(visitor.createdAt).toLocaleDateString() : 'Unknown',
      status: visitor.status || 'Pending',
      photo: visitor.photo || visitor.visitorPhoto || '',
      idPhoto: visitor.idPhoto || visitor.idImage || '',
      photos: visitor.photos || [],
      email: visitor.email || '',
      idType: visitor.idType || '',
      idNumber: visitor.idNumber || '',
      address: visitor.address || '',
    }));
  };

  // Initialize data fetch on mount
  useEffect(() => {
    fetchVisitors();
  }, []);

  // Update filtered visitors when status filter changes
  useEffect(() => {
    filterVisitorsByStatus(statusFilter);
  }, [visitors, statusFilter]);

  return {
    visitors,
    filteredVisitors,
    loading,
    error,
    statusFilter,
    setVisitors,
    setFilteredVisitors,
    fetchVisitors,
    handleStatusFilterChange,
    filterVisitorsBySearch
  };
};

export default useVisitorData; 