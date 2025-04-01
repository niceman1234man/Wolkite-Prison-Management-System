import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function ScheduleVisit({ schedule, onSuccess, onCancel }) {
  const navigate = useNavigate();
  const [inmates, setInmates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inmatesLoading, setInmatesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    inmateId: "default_inmate",
    visitDate: "",
    visitTime: "",
    purpose: "",
    relationship: "",
    visitDuration: 30,
    notes: "",
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    idType: "",
    idNumber: "",
    idExpiryDate: "",
    idPhoto: null,
    visitorPhoto: null
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to schedule a visit");
      navigate("/login");
      return;
    }

    fetchInmates();
    if (schedule) {
      // Pre-fill form data if updating
      setFormData({
        inmateId: schedule.inmateId?._id || "default_inmate",
        visitDate: format(new Date(schedule.visitDate), "yyyy-MM-dd"),
        visitTime: schedule.visitTime,
        purpose: schedule.purpose,
        relationship: schedule.relationship,
        visitDuration: schedule.visitDuration,
        notes: schedule.notes || "",
        firstName: schedule.firstName || "",
        middleName: schedule.middleName || "",
        lastName: schedule.lastName || "",
        phone: schedule.phone || "",
        idType: schedule.idType || "",
        idNumber: schedule.idNumber || "",
        idExpiryDate: schedule.idExpiryDate ? format(new Date(schedule.idExpiryDate), "yyyy-MM-dd") : "",
        idPhoto: null,
        visitorPhoto: null
      });
    }
  }, [schedule, navigate]);

  const fetchInmates = async () => {
    try {
      setInmatesLoading(true);
      const response = await axiosInstance.get("/visitor/schedule/inmates");
      if (response.data?.success) {
        setInmates(response.data.data || []);
      } else {
        // Handle empty response gracefully
        setInmates([]);
        console.log("No inmates returned from API");
      }
    } catch (error) {
      console.error("Error fetching inmates:", error);
      toast.error("Could not load inmates list. You can still continue without selecting an inmate.");
      setInmates([]);
    } finally {
      setInmatesLoading(false);
    }
  };

  const validateEthiopianPhone = (phone) => {
    // Ethiopian phone number regex pattern
    const phoneRegex = /^(\+251|251|0)?[7-9][0-9]{8}$/;
    return phoneRegex.test(phone);
  };

  const formatPhoneNumber = (phone) => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 0, replace with +251
    if (cleaned.startsWith('0')) {
      return '+251' + cleaned.slice(1);
    }
    
    // If it doesn't start with +251, add it
    if (!cleaned.startsWith('251')) {
      return '+251' + cleaned;
    }
    
    return '+' + cleaned;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // Format phone number as user types
      const formattedPhone = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
      toast.success(`${name === 'idPhoto' ? 'ID' : 'Visitor'} photo uploaded successfully`);
    }
  };

  const resetForm = () => {
    setFormData({
      inmateId: "default_inmate",
      visitDate: "",
      visitTime: "",
      purpose: "",
      relationship: "",
      visitDuration: 30,
      notes: "",
      firstName: "",
      middleName: "",
      lastName: "",
      phone: "",
      idType: "",
      idNumber: "",
      idExpiryDate: "",
      idPhoto: null,
      visitorPhoto: null
    });
    setError(null);
    
    // Clear any existing toast notifications
    toast.dismiss();
    
    // Only show this message if it's not part of another action that already has a toast
    if (document.activeElement?.tagName !== 'BUTTON') {
      toast.success("Form reset to default values");
    }
  };

  const validateForm = () => {
    // Check mandatory fields
    if (
      !formData.visitDate ||
      !formData.visitTime ||
      !formData.purpose ||
      !formData.relationship ||
      !formData.visitDuration ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.phone ||
      !formData.idType ||
      !formData.idNumber ||
      !formData.idExpiryDate ||
      (!schedule && !formData.idPhoto)
    ) {
      setError("Please fill in all required fields");
      toast.error("Please fill in all required fields");
      return false;
    }

    // Validate phone number
    if (!validateEthiopianPhone(formData.phone)) {
      setError("Please enter a valid Ethiopian phone number");
      toast.error("Please enter a valid Ethiopian phone number");
      return false;
    }

    // Validate visit date (must be in the future)
    const visitDate = new Date(formData.visitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to beginning of day for proper comparison

    if (visitDate < today) {
      setError("Visit date must be in the future");
      toast.error("Visit date must be in the future");
      return false;
    }

    // Validate ID expiry date (must be in the future)
    const idExpiryDate = new Date(formData.idExpiryDate);
    if (idExpiryDate <= today) {
      setError("ID expiry date must be in the future");
      toast.error("ID expiry date must be in the future");
      return false;
    }

    // If it's a new schedule (not an update) and no inmate is selected
    if (!schedule && formData.inmateId === "default_inmate") {
      // This is now a warning, not an error that stops submission
      // toast.warning("No inmate selected. Your request will be processed without an inmate assignment.");
    }

    // If this is a new schedule and no photo is provided
    if (!schedule && !formData.visitorPhoto) {
      toast.warning("No photo uploaded. Your request will be processed without a visitor photo.");
    }

    // All validations passed
    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to schedule a visit");
      navigate("/login");
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
      
      const loadingId = toast.loading(schedule ? "Updating visit..." : "Scheduling visit...");
  
      // Create FormData object
      const formDataToSend = new FormData();
  
      // Format dates properly
      const visitDateObj = new Date(formData.visitDate);
      const idExpiryDateObj = new Date(formData.idExpiryDate);
  
      // Validate dates
      if (isNaN(visitDateObj.getTime()) || isNaN(idExpiryDateObj.getTime())) {
        toast.dismiss(loadingId);
        toast.error("Invalid date format");
        throw new Error("Invalid date format");
      }
  
      // Check if ID expiry date is in the future
      if (idExpiryDateObj <= new Date()) {
        toast.dismiss(loadingId);
        toast.error("ID expiry date must be in the future");
        return;
      }
  
      // Append all form fields
      if (formData.inmateId !== "default_inmate") {
        formDataToSend.append('inmateId', formData.inmateId);
      }
      formDataToSend.append('visitDate', visitDateObj.toISOString());
      formDataToSend.append('visitTime', formData.visitTime);
      formDataToSend.append('purpose', formData.purpose);
      formDataToSend.append('relationship', formData.relationship);
      formDataToSend.append('visitDuration', formData.visitDuration.toString());
      formDataToSend.append('notes', formData.notes);
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('middleName', formData.middleName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('idType', formData.idType);
      formDataToSend.append('idNumber', formData.idNumber);
      formDataToSend.append('idExpiryDate', idExpiryDateObj.toISOString());
  
      // Append photos if they exist
      if (formData.idPhoto) {
        formDataToSend.append('idPhoto', formData.idPhoto);
      }
      if (formData.visitorPhoto) {
        formDataToSend.append('visitorPhoto', formData.visitorPhoto);
      }
  
      // Log form data for debugging
      console.log('Form data being sent:');
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ', pair[1]);
      }
  
      let response;
      if (schedule && schedule._id) {
        response = await axiosInstance.put(
          `/visitor/schedule/schedule/${schedule._id}`,
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            },
          }
        );
      } else {
        response = await axiosInstance.post(
          "/visitor/schedule/schedule",
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            },
          }
        );
      }
  
      // First dismiss only the loading toast
      toast.dismiss(loadingId);
      
      if (response.data.success) {
        // Show success toast with custom options for better visibility
        toast.success(
          schedule ? "Visit updated successfully!" : "Visit scheduled successfully!",
          {
            duration: 5000, // Show for 5 seconds
            position: "top-center",
            style: {
              padding: '16px',
              fontWeight: 'bold',
              backgroundColor: '#10B981', // Green background
              color: 'white'
            },
          }
        );
        
        resetForm();
        
        if (onSuccess) {
          // Pass the response data to the parent component
          onSuccess(response.data);
        }
      } else {
        const errorMessage = response.data.message || 'Failed to schedule visit';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      // Dismiss all toasts to avoid conflicts
      toast.dismiss();
      console.error('Error scheduling visit:', error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }
      
      const errorMessage = error.response?.data?.message || 'Error scheduling visit';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        {schedule ? "Update Visit" : "Schedule a Visit"}
      </h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information Section */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          
          {/* First Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Middle Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Middle Name
            </label>
            <input
              type="text"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Last Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Phone Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+251 7XXXXXXXX"
              required
              className="w-full p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter a valid Ethiopian phone number (e.g., +251 7XXXXXXXX)
            </p>
          </div>
        </div>

        {/* ID Information Section */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">ID Information</h3>
          
          {/* ID Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Type
            </label>
            <select
              name="idType"
              value={formData.idType}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select ID type</option>
              <option value="passport">Passport</option>
              <option value="nationalId">National ID</option>
              <option value="driversLicense">Driver's License</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* ID Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Number
            </label>
            <input
              type="text"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* ID Expiry Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Expiry Date
            </label>
            <input
              type="date"
              name="idExpiryDate"
              value={formData.idExpiryDate}
              onChange={handleChange}
              required
              min={format(new Date(), "yyyy-MM-dd")}
              className="w-full p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        {/* Inmate Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Inmate (Optional)
          </label>
          <div className="relative">
            <select
              name="inmateId"
              value={formData.inmateId}
              onChange={handleChange}
              disabled={inmatesLoading}
              className={`w-full p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500 ${
                inmatesLoading ? "bg-gray-50" : ""
              }`}
            >
              <option value="default_inmate">Select an inmate (optional)</option>
              {inmates.map((inmate) => (
                <option key={inmate._id} value={inmate._id}>
                  {inmate.fullName} - {inmate.prisonerId}
                </option>
              ))}
            </select>
            {inmatesLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FaSpinner className="animate-spin text-gray-400" />
              </div>
            )}
          </div>
          {inmates.length === 0 && !inmatesLoading && (
            <p className="mt-1 text-sm text-yellow-500">
              No inmates available. You can still schedule a visit without selecting an inmate.
            </p>
          )}
        </div>

        {/* Visit Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visit Date
          </label>
          <input
            type="date"
            name="visitDate"
            value={formData.visitDate}
            onChange={handleChange}
            required
            min={format(new Date(), "yyyy-MM-dd")}
            className="w-full p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        {/* Visit Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visit Time
          </label>
          <input
            type="time"
            name="visitTime"
            value={formData.visitTime}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purpose of Visit
          </label>
          <input
            type="text"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        {/* Relationship */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Relationship with Inmate
          </label>
          <select
            name="relationship"
            value={formData.relationship}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="">Select relationship</option>
            <option value="family">Family</option>
            <option value="friend">Friend</option>
            <option value="lawyer">Lawyer</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Visit Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visit Duration (minutes)
          </label>
          <input
            type="number"
            name="visitDuration"
            value={formData.visitDuration}
            onChange={handleChange}
            min="15"
            max="120"
            required
            className="w-full p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            className="w-full p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        {/* Photo Upload Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Photo Upload</h3>
          
          {/* ID Photo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload ID Photo
            </label>
            <input
              type="file"
              name="idPhoto"
              onChange={handleFileChange}
              accept="image/*"
              required={!schedule}
              className="w-full p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              {schedule ? "Upload a new ID photo only if you want to replace the existing one." : "Please upload a clear photo of your ID. Maximum file size: 5MB"}
            </p>
          </div>

          {/* Visitor Photo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Visitor Photo
            </label>
            <input
              type="file"
              name="visitorPhoto"
              onChange={handleFileChange}
              accept="image/*"
              required={!schedule}
              className="w-full p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              {schedule ? "Upload a new photo only if you want to replace the existing one." : "Please upload a clear photo of yourself. Maximum file size: 5MB"}
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={() => {
              resetForm();
              toast.success("Form reset successfully");
            }}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            disabled={loading || inmatesLoading}
          >
            {(loading || inmatesLoading) ? "Please wait..." : "Reset"}
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading || inmatesLoading}
          >
            {loading || inmatesLoading ? (
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {inmatesLoading ? "Loading inmates..." : "Processing..."}
              </span>
            ) : schedule ? "Update Visit" : "Schedule Visit"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={() => {
                toast.info("Cancelled form submission");
                onCancel();
              }}
              className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={loading || inmatesLoading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ScheduleVisit;

// Add default props
ScheduleVisit.defaultProps = {
  schedule: null,
  onSuccess: () => {},
  onCancel: null
}; 