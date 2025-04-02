import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { 
  FaTimes, 
  FaUserCircle, 
  FaIdCard, 
  FaCalendarAlt, 
  FaSave, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt 
} from "react-icons/fa";
import axiosInstance from "../../../utils/axiosInstance.js";

const UpdateVisitorModal = ({ isOpen, onClose, visitor, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    purpose: "",
    idType: "",
    idNumber: "",
    date: "",
    time: "",
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

  // Populate form with visitor data when opened
  useEffect(() => {
    if (visitor && isOpen) {
      setFormData({
        firstName: visitor.firstName || "",
        middleName: visitor.middleName || "",
        lastName: visitor.lastName || "",
        email: visitor.email || "",
        phone: visitor.phone || "",
        address: visitor.address || "",
        purpose: visitor.purpose || "",
        idType: visitor.idType || "",
        idNumber: visitor.idNumber || "",
        date: formatDateForInput(visitor.date),
        time: visitor.time || "",
        notes: visitor.notes || ""
      });
      setErrors({});
    }
  }, [visitor, isOpen]);

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
    
    if (!formData.firstName) {
      newErrors.firstName = "First name is required";
    }
    
    if (!formData.lastName) {
      newErrors.lastName = "Last name is required";
    }
    
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    }
    
    if (!formData.purpose) {
      newErrors.purpose = "Purpose is required";
    }
    
    if (!formData.date) {
      newErrors.date = "Visit date is required";
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
      const response = await axiosInstance.put(`/visitor/update-visitor/${visitor._id}`, formData);
      
      if (response.data && response.data.success) {
        toast.success("Visitor information updated successfully");
        onClose();
        if (onSuccess) {
          onSuccess(response.data.visitor);
        }
      } else {
        toast.error(response.data?.message || "Failed to update visitor");
      }
    } catch (error) {
      console.error("Error updating visitor:", error);
      toast.error(error.response?.data?.message || "Failed to update visitor");
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
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-5 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <FaUserCircle className="mr-2" /> 
            Update Visitor Information
          </h2>
          <button
            onClick={onClose}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
          >
            <FaTimes size={18} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information Section */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                <FaUserCircle className="text-indigo-600 mr-2" />
                Personal Information
              </h3>
            </div>
            
            {/* First Name */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>
            
            {/* Middle Name */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Middle Name
              </label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter middle name (optional)"
              />
            </div>
            
            {/* Last Name */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
            
            {/* Phone */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <FaPhone className="inline-block mr-1 text-gray-500" />
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <FaEnvelope className="inline-block mr-1 text-gray-500" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter email (optional)"
              />
            </div>
            
            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <FaMapMarkerAlt className="inline-block mr-1 text-gray-500" />
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter address (optional)"
              />
            </div>
            
            {/* ID Information Section */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2 mt-4">
                <FaIdCard className="text-indigo-600 mr-2" />
                ID Information
              </h3>
            </div>
            
            {/* ID Type */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                ID Type
              </label>
              <select
                name="idType"
                value={formData.idType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select ID Type</option>
                <option value="nationalId">National ID</option>
                <option value="passport">Passport</option>
                <option value="driverLicense">Driver's License</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {/* ID Number */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                ID Number
              </label>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter ID number (optional)"
              />
            </div>
            
            {/* Visit Information Section */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2 mt-4">
                <FaCalendarAlt className="text-indigo-600 mr-2" />
                Visit Information
              </h3>
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
            
            {/* Visit Date */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Visit Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
              )}
            </div>
            
            {/* Visit Time */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Visit Time
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Additional Notes
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
              className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-6 py-2 rounded-md hover:from-indigo-700 hover:to-purple-800 transition-colors flex items-center"
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

export default UpdateVisitorModal; 