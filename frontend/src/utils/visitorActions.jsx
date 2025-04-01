import axiosInstance from "./axiosInstance.js";
import { toast } from "react-hot-toast";

export const handleApprove = async (scheduleId) => {
  try {
    const response = await axiosInstance.put(`/visitor-schedule/${scheduleId}/approve`);
    if (response.data.success) {
      toast.success("Visit approved successfully");
      return true;
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to approve visit");
    return false;
  }
};

export const handleReject = async (scheduleId) => {
  try {
    const response = await axiosInstance.put(`/visitor-schedule/${scheduleId}/reject`);
    if (response.data.success) {
      toast.success("Visit rejected successfully");
      return true;
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to reject visit");
    return false;
  }
};

export const handlePostpone = async (scheduleId, newDate) => {
  try {
    const response = await axiosInstance.put(`/visitor-schedule/${scheduleId}/postpone`, {
      newDate
    });
    if (response.data.success) {
      toast.success("Visit postponed successfully");
      return true;
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to postpone visit");
    return false;
  }
}; 