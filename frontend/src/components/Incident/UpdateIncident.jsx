import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TiArrowBack } from "react-icons/ti";
import { 
  FaEdit, FaCalendarAlt, FaUser, FaUserShield, FaTag, 
  FaClipboardList, FaUpload, FaSave, FaTimes, FaExclamationCircle 
} from "react-icons/fa";

const UpdateIncident = ({setEdit, id}) => {
  const [formData, setFormData] = useState({
    incidentId: "",
    reporter: "",
    inmate: "",
    incidentDate: "",
    incidentType: "",
    status: "",
    description: "",
    attachment: ""
  });
  const [inmates, setInmates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInmates = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/inmates/allInmates");
        if (response.data?.inmates) {
          setInmates(response.data.inmates);
        } else {
          console.error("Invalid API response:", response);
          toast.error("Invalid API response. Please try again.");
        }
      } catch (error) {
        console.error("Error fetching inmates:", error);
        toast.error(
          error.response?.data?.error || "Failed to fetch inmate data."
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchIncident = async () => {
      try {
        const response = await axiosInstance.get(`/incidents/get-incident/${id}`);
        const incident = Array.isArray(response.data.incidents)
          ? response.data.incidents.find((item) => item._id === id) || {}
          : response.data.incidents;

        // Format date for the input field
        if (incident.incidentDate) {
          incident.incidentDate = new Date(incident.incidentDate).toISOString().split("T")[0];
        }

        setFormData(incident);
      } catch (error) {
        console.error("Error fetching incident details:", error);
        toast.error("Failed to load incident details");
      }
    };
    
    fetchInmates();
    fetchIncident();
  }, [id]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.reporter.trim()) {
      newErrors.reporter = "Reporter name is required";
    }
    
    if (!formData.inmate) {
      newErrors.inmate = "Please select an inmate";
    }
    
    if (!formData.incidentDate) {
      newErrors.incidentDate = "Incident date is required";
    } else {
      const selectedDate = new Date(formData.incidentDate);
      const currentDate = new Date();
      if (selectedDate > currentDate) {
        newErrors.incidentDate = "Incident date cannot be in the future";
      }
    }
    
    if (!formData.incidentType) {
      newErrors.incidentType = "Please select an incident type";
    }
    
    if (!formData.status) {
      newErrors.status = "Please select a status";
    }
    
    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = "Description should be at least 10 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await axiosInstance.put(
        `/incidents/update-incident/${id}`,
        formData
      );
      
      if (response.data) {
        toast.success("Incident updated successfully!");
        setEdit(false);
        navigate("/policeOfficer-dashboard/incident");
      }
    } catch (error) {
      console.error("Error updating incident:", error);
      toast.error(error.response?.data?.message || "Failed to update incident");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Resolved':
        return 'text-green-600 border-green-600';
      case 'Pending':
        return 'text-yellow-600 border-yellow-600';
      case 'Escalated':
        return 'text-red-600 border-red-600';
      default:
        return 'text-gray-600 border-gray-600';
    }
  };

  return (
    <div className="w-full mx-auto bg-white p-6 rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaEdit className="mr-2 text-teal-600" />
          Update Incident Report
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Edit the incident details and submit to update the record
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information Card */}
        <div className="bg-gray-50 p-5 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
            <FaClipboardList className="mr-2 text-teal-600" />
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Incident ID (Read-Only) */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
              Incident ID
            </label>
            <input
              type="text"
              name="incidentId"
              value={formData.incidentId || ""}
              disabled
                className="p-2 block w-full border border-gray-300 rounded-md bg-gray-100 text-gray-700"
              />
              <p className="mt-1 text-xs text-gray-500">Unique identifier (cannot be changed)</p>
            </div>

            {/* Date of Incident */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaCalendarAlt className="inline-block mr-1 text-teal-600" />
                Date of Incident <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="incidentDate"
                value={formData.incidentDate || ""}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                className={`p-2 block w-full border ${
                  errors.incidentDate ? "border-red-500" : "border-gray-300"
                } rounded-md focus:ring-teal-500 focus:border-teal-500`}
                required
              />
              {errors.incidentDate && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <FaExclamationCircle className="mr-1" />
                  {errors.incidentDate}
                </p>
              )}
          </div>

          {/* Reporter Name */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaUserShield className="inline-block mr-1 text-teal-600" />
                Reporter Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="reporter"
              value={formData.reporter || ""}
                placeholder="Enter full name of reporter"
              onChange={handleChange}
                className={`p-2 block w-full border ${
                  errors.reporter ? "border-red-500" : "border-gray-300"
                } rounded-md focus:ring-teal-500 focus:border-teal-500`}
              required
            />
              {errors.reporter && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <FaExclamationCircle className="mr-1" />
                  {errors.reporter}
                </p>
              )}
          </div>

            {/* Inmate Selection */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaUser className="inline-block mr-1 text-teal-600" />
                Inmate Involved <span className="text-red-500">*</span>
            </label>
            <select
              name="inmate"
              value={formData.inmate || ""}
              onChange={handleChange}
                className={`p-2 block w-full border ${
                  errors.inmate ? "border-red-500" : "border-gray-300"
                } rounded-md focus:ring-teal-500 focus:border-teal-500`}
              required
            >
              <option value="">Select Inmate</option>
              {loading ? (
                <option disabled>Loading inmates...</option>
              ) : (
                inmates.map((inmate) => (
                  <option key={inmate._id} value={inmate.fullName}>
                    {inmate.fullName}
                  </option>
                ))
              )}
            </select>
              {errors.inmate && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <FaExclamationCircle className="mr-1" />
                  {errors.inmate}
                </p>
              )}
            </div>
          </div>
          </div>

        {/* Incident Details Card */}
        <div className="bg-gray-50 p-5 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
            <FaTag className="mr-2 text-teal-600" />
            Incident Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
          {/* Incident Type */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Incident Type <span className="text-red-500">*</span>
            </label>
            <select
              name="incidentType"
              value={formData.incidentType || ""}
              onChange={handleChange}
                className={`p-2 block w-full border ${
                  errors.incidentType ? "border-red-500" : "border-gray-300"
                } rounded-md focus:ring-teal-500 focus:border-teal-500`}
              required
            >
              <option value="">Select Incident Type</option>
              <option value="Theft">Theft</option>
                <option value="Assault">Assault</option>
              <option value="Harassment">Harassment</option>
                <option value="Substance Abuse">Substance Abuse</option>
                <option value="Contraband">Contraband</option>
              <option value="Accident">Accident</option>
                <option value="Property Damage">Property Damage</option>
                <option value="Medical Emergency">Medical Emergency</option>
              <option value="Other">Other</option>
            </select>
              {errors.incidentType && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <FaExclamationCircle className="mr-1" />
                  {errors.incidentType}
                </p>
              )}
          </div>

          {/* Status */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status || ""}
              onChange={handleChange}
                className={`p-2 block w-full border ${
                  errors.status ? "border-red-500" : "border-gray-300"
                } rounded-md focus:ring-teal-500 focus:border-teal-500 ${getStatusClass(formData.status)}`}
              required
            >
              <option value="">Select Status</option>
              <option value="Pending">Pending</option>
                <option value="Under Investigation">Under Investigation</option>
              <option value="Resolved">Resolved</option>
              <option value="Escalated">Escalated</option>
            </select>
              {errors.status && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <FaExclamationCircle className="mr-1" />
                  {errors.status}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description || ""}
              placeholder="Provide a detailed description of what happened during the incident..."
              onChange={handleChange}
              className={`p-2 block w-full border ${
                errors.description ? "border-red-500" : "border-gray-300"
              } rounded-md focus:ring-teal-500 focus:border-teal-500`}
              rows="4"
              required
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <FaExclamationCircle className="mr-1" />
                {errors.description}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Include who was involved, what happened, when and where the incident occurred, and any actions taken
            </p>
          </div>

          {/* Attachment Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaUpload className="inline-block mr-1 text-teal-600" />
              Attachment Reference <span className="text-xs text-gray-500">(Optional)</span>
            </label>
            <input
              type="text"
              name="attachment"
              value={formData.attachment || ""}
              onChange={handleChange}
              className="p-2 block w-full border border-gray-300 rounded-md"
              placeholder="Reference to existing attachment"
            />
            <p className="mt-1 text-xs text-gray-500">
              Note: This field only updates the reference to an existing file
            </p>
          </div>
          </div>

        {/* Status Bar */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Form Completion</h4>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200">
                  {formData.reporter && formData.inmate && formData.incidentDate && 
                   formData.incidentType && formData.status && formData.description 
                   ? "Ready to Submit" : "In Progress"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-teal-600">
                  {(formData.reporter ? 1 : 0) + 
                   (formData.inmate ? 1 : 0) + 
                   (formData.incidentDate ? 1 : 0) + 
                   (formData.incidentType ? 1 : 0) + 
                   (formData.status ? 1 : 0) + 
                   (formData.description ? 1 : 0)}/6
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-teal-200">
              <div style={{ width: `${((formData.reporter ? 1 : 0) + 
                            (formData.inmate ? 1 : 0) + 
                            (formData.incidentDate ? 1 : 0) + 
                            (formData.incidentType ? 1 : 0) + 
                            (formData.status ? 1 : 0) + 
                            (formData.description ? 1 : 0)) * 16.7}%` }} 
                   className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-500 transition-all duration-300">
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => setEdit(false)}
            className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-200 flex items-center justify-center"
          >
            <FaTimes className="mr-1" />
            Cancel
          </button>
          
            <button
              type="submit"
            disabled={submitting || !formData.reporter || !formData.inmate || !formData.incidentDate || 
                     !formData.incidentType || !formData.status || !formData.description}
            className={`py-2 px-6 rounded-md text-white font-medium flex items-center justify-center transition duration-200 ${
              submitting || !formData.reporter || !formData.inmate || !formData.incidentDate || 
              !formData.incidentType || !formData.status || !formData.description
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <FaSave className="mr-1" />
              Update Incident
              </>
            )}
            </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateIncident;
