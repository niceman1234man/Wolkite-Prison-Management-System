import React, { useState, useEffect, createContext } from "react";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-hot-toast";

// Create the context
export const VisitorCapacityContext = createContext({
  visitorCapacity: {
    maxCapacity: 50,
    currentCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    isLoading: true
  },
  updateVisitorCapacity: async () => false,
  refreshCapacity: async () => {},
  isCapacityReached: false
});

// Create the provider component
export const VisitorCapacityProvider = ({ children }) => {
  const [visitorCapacity, setVisitorCapacity] = useState({
    maxCapacity: 50,
    currentCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    isLoading: true
  });
  
  const refreshCapacity = async () => {
    try {
      setVisitorCapacity(prev => ({ ...prev, isLoading: true }));
      const response = await axiosInstance.get('/visitor/schedule/capacity');
      
      if (response.data && response.data.success) {
        setVisitorCapacity({
          maxCapacity: response.data.maxCapacity || 50,
          currentCount: response.data.approvedCount || 0,
          pendingCount: response.data.pendingCount || 0,
          approvedCount: response.data.approvedCount || 0,
          isLoading: false
        });
      }
    } catch (error) {
      console.error("Error fetching visitor capacity:", error);
      setVisitorCapacity(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  const updateVisitorCapacity = async (newCapacity) => {
    try {
      const response = await axiosInstance.put('/visitor/schedule/capacity', {
        maxCapacity: newCapacity
      });
      
      if (response.data && response.data.success) {
        setVisitorCapacity(prev => ({
          ...prev,
          maxCapacity: newCapacity
        }));
        toast.success("Visitor capacity updated successfully");
        return true;
      } else {
        toast.error("Failed to update visitor capacity");
        return false;
      }
    } catch (error) {
      console.error("Error updating visitor capacity:", error);
      toast.error("Failed to update visitor capacity");
      return false;
    }
  };
  
  // Check if capacity is reached
  const isCapacityReached = visitorCapacity.currentCount >= visitorCapacity.maxCapacity;
  
  // Fetch capacity on mount
  useEffect(() => {
    refreshCapacity();
    
    // Set up capacity polling (every 1 minute)
    const intervalId = setInterval(() => {
      refreshCapacity();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <VisitorCapacityContext.Provider value={{ 
      visitorCapacity, 
      updateVisitorCapacity, 
      refreshCapacity,
      isCapacityReached 
    }}>
      {children}
    </VisitorCapacityContext.Provider>
  );
}; 