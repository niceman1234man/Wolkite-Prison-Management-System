import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FaTimes, FaCalendarAlt, FaClock, FaUserCircle, FaSave } from "react-icons/fa";
import axiosInstance from "../../utils/axiosInstance.js";

const UpdateScheduleModal = ({ isOpen, onClose, schedule, onSuccess }) => {
  const [formData, setFormData] = useState({
    visitDate: "",
    visitTime: "",
    visitDuration: 30,
    purpose: "",
    relationship: "",
    notes: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Format date to YYYY-MM-DD for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error("Date formatting error:", e);
      return '';
    }
  };

  // Populate form with schedule data when opened
  useEffect(() => {
    if (schedule && isOpen) {
      setFormData({
        visitDate: formatDateForInput(schedule.visitDate),
        visitTime: schedule.visitTime || "",
        visitDuration: schedule.visitDuration || 30,
        purpose: schedule.purpose || "",
        relationship: schedule.relationship || "",
        notes: schedule.notes || ""
      });
      setErrors({});
    }
  }, [schedule, isOpen]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.visitDate) {
      newErrors.visitDate = "Visit date is required";
    }
    
    if (!formData.visitTime) {
      newErrors.visitTime = "Visit time is required";
    }
    
    if (!formData.purpose) {
      newErrors.purpose = "Purpose is required";
    }
    
    if (!formData.relationship) {
      newErrors.relationship = "Relationship is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await axiosInstance.put(`/visitor/schedule/schedule/${schedule._id}`, formData);
      
      if (response.data.success) {
        toast.success("Schedule updated successfully");
        onClose();
        if (onSuccess) {
          onSuccess(response.data.data);
        }
      } else {
        toast.error(response.data.message || "Failed to update schedule");
      }
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error(error.response?.data?.message || "Failed to update schedule");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If modal is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-5 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <FaCalendarAlt className="mr-2" /> 
            Update Visit Schedule
          </h2>
          <button
            onClick={onClose}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
          >
            <FaTimes size={18} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visit Date */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Visit Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.visitDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.visitDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.visitDate}</p>
                )}
              </div>
            </div>
            
            {/* Visit Time */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Visit Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  name="visitTime"
                  value={formData.visitTime}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.visitTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.visitTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.visitTime}</p>
                )}
              </div>
            </div>
            
            {/* Visit Duration */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Visit Duration (minutes)
              </label>
              <select
                name="visitDuration"
                value={formData.visitDuration}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
              </select>
            </div>
            
            {/* Purpose */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Purpose <span className="text-red-500">*</span>
              </label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.purpose ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Purpose</option>
                <option value="family visit">Family Visit</option>
                <option value="legal visit">Legal Visit</option>
                <option value="counseling">Counseling</option>
                <option value="medical">Medical</option>
                <option value="other">Other</option>
              </select>
              {errors.purpose && (
                <p className="text-red-500 text-xs mt-1">{errors.purpose}</p>
              )}
            </div>
            
            {/* Relationship */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Relationship to Inmate <span className="text-red-500">*</span>
              </label>
              <select
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.relationship ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Relationship</option>
                <option value="parent">Parent</option>
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="sibling">Sibling</option>
                <option value="friend">Friend</option>
                <option value="legal">Legal Representative</option>
                <option value="other">Other</option>
              </select>
              {errors.relationship && (
                <p className="text-red-500 text-xs mt-1">{errors.relationship}</p>
              )}
            </div>
            
            {/* Notes (Optional) */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Any additional information..."
              ></textarea>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md border border-gray-300 hover:bg-gray-200 transition-colors flex items-center"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-6 py-2 rounded-md hover:from-purple-700 hover:to-indigo-800 transition-colors flex items-center"
              disabled={isSubmitting}
            >
              <FaSave className="mr-2" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateScheduleModal; 