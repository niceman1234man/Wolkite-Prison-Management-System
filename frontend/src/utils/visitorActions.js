import axiosInstance from "./axiosInstance.js";
import { toast } from "react-hot-toast";

export const handleApprove = async (scheduleId) => {
  try {
    const response = await axiosInstance.put(`/visitor/schedule/schedule/${scheduleId}/approve`);
    
    if (response.data.success) {
      toast.success("Visit approved successfully");
      return true;
    } else {
      toast.error(response.data.message || "Failed to approve visit");
      return false;
    }
  } catch (error) {
    console.error("Approve error:", error.response?.data || error);
    toast.error(error.response?.data?.message || "Failed to approve visit. Check the server logs.");
    return false;
  }
};

export const handleReject = async (scheduleId) => {
  try {
    const response = await axiosInstance.put(`/visitor/schedule/schedule/${scheduleId}/reject`, {
      rejectionReason: "Rejected by police officer"
    });
    
    if (response.data.success) {
      toast.success("Visit rejected successfully");
      return true;
    } else {
      toast.error(response.data.message || "Failed to reject visit");
      return false;
    }
  } catch (error) {
    console.error("Reject error:", error.response?.data || error);
    toast.error(error.response?.data?.message || "Failed to reject visit. Check the server logs.");
    return false;
  }
};

export const handlePostpone = async (scheduleId, newDate) => {
  try {
    if (!newDate) {
      toast.error("New date is required for postponement");
      return false;
    }
    
    const response = await axiosInstance.put(`/visitor/schedule/schedule/${scheduleId}/postpone`, {
      newDate
    });
    
    if (response.data.success) {
      toast.success("Visit postponed successfully");
      return true;
    } else {
      toast.error(response.data.message || "Failed to postpone visit");
      return false;
    }
  } catch (error) {
    console.error("Postpone error:", error.response?.data || error);
    toast.error(error.response?.data?.message || "Failed to postpone visit. Check the server logs.");
    return false;
  }
}; 
