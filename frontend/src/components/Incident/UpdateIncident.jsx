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
    attachment: "",
    severity: ""
  });
  const [inmates, setInmates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
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
      setFetchingData(true);
      try {
        console.log("Fetching incident with ID:", id);
        const response = await axiosInstance.get(`/incidents/get-incident/${id}`);
        console.log("Incident response:", response.data);
        
        if (response.data && response.data.incident) {
          // Format date for the input field
          const incident = response.data.incident;
          if (incident.incidentDate) {
            incident.incidentDate = new Date(incident.incidentDate).toISOString().split("T")[0];
          }
          console.log("Setting form data:", incident);
          setFormData(incident);
        } else {
          setError("Incident not found");
          toast.error("Incident data not found");
        }
      } catch (error) {
        console.error("Error fetching incident details:", error);
        setError("Failed to load incident details");
        toast.error("Failed to load incident details");
      } finally {
        setFetchingData(false);
      }
    };
    
    fetchInmates();
    if (id) {
      fetchIncident();
    } else {
      setError("No incident ID provided");
      setFetchingData(false);
    }
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
      const updateData = { ...formData };
      // Remove fields that shouldn't be sent in the update
      delete updateData._id;
      delete updateData.__v;
      delete updateData.createdAt;
      delete updateData.updatedAt;
      
      console.log("Sending update data:", updateData);
      
      const response = await axiosInstance.put(
        `/incidents/update-incident/${id}`,
        updateData
      );
      
      if (response.data) {
        toast.success("Incident updated successfully!");
        if (setEdit) {
          setEdit(false);
        } else {
          navigate("/policeOfficer-dashboard/incident");
        }
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

  if (fetchingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
        <span className="ml-3 text-teal-600">Loading incident data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <FaExclamationCircle className="text-red-600 text-3xl mb-2" />
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

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
                  errors.incidentDate 
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                    : "border-gray-300 focus:ring-teal-500 focus:border-teal-500"
                } rounded-md`}
                required
              />
              {errors.incidentDate && (
                <p className="mt-1 text-sm text-red-500">{errors.incidentDate}</p>
              )}
            </div>

            {/* Incident Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaTag className="inline-block mr-1 text-teal-600" />
                Incident Type <span className="text-red-500">*</span>
              </label>
              <select
                name="incidentType"
                value={formData.incidentType || ""}
                onChange={handleChange}
                className={`p-2 block w-full border ${
                  errors.incidentType
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-teal-500 focus:border-teal-500"
                } rounded-md`}
                required
              >
                <option value="">Select incident type</option>
                <option value="Contraband">Contraband</option>
                <option value="Assault">Assault</option>
                <option value="Escape Attempt">Escape Attempt</option>
                <option value="Medical Emergency">Medical Emergency</option>
                <option value="Property Damage">Property Damage</option>
                <option value="Fire">Fire</option>
                <option value="Self-Harm">Self-Harm</option>
                <option value="Staff Assault">Staff Assault</option>
                <option value="Inmate Conflict">Inmate Conflict</option>
                <option value="Theft">Theft</option>
                <option value="Vandalism">Vandalism</option>
                <option value="Other">Other</option>
              </select>
              {errors.incidentType && (
                <p className="mt-1 text-sm text-red-500">{errors.incidentType}</p>
              )}
            </div>

            {/* Severity (Read-Only if repeated incident) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaExclamationCircle className="inline-block mr-1 text-teal-600" />
                Severity
              </label>
              <select
                name="severity"
                value={formData.severity || "Low"}
                onChange={handleChange}
                disabled={formData.isRepeat}
                className={`p-2 block w-full border ${
                  formData.isRepeat ? "bg-gray-100" : ""
                } border-gray-300 focus:ring-teal-500 focus:border-teal-500 rounded-md`}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              {formData.isRepeat && (
                <p className="mt-1 text-xs text-amber-600">
                  Severity is automatically set based on repeat count ({formData.repeatCount || 0})
                </p>
              )}
            </div>

            {/* Reporter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaUserShield className="inline-block mr-1 text-teal-600" />
                Reporter <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="reporter"
                value={formData.reporter || ""}
                onChange={handleChange}
                className={`p-2 block w-full border ${
                  errors.reporter
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-teal-500 focus:border-teal-500"
                } rounded-md`}
                required
              />
              {errors.reporter && (
                <p className="mt-1 text-sm text-red-500">{errors.reporter}</p>
              )}
            </div>

            {/* Inmate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaUser className="inline-block mr-1 text-teal-600" />
                Inmate <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="inmate"
                value={formData.inmate || ""}
                onChange={handleChange}
                className={`p-2 block w-full border ${
                  errors.inmate
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-teal-500 focus:border-teal-500"
                } rounded-md`}
                required
              />
              {errors.inmate && (
                <p className="mt-1 text-sm text-red-500">{errors.inmate}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaTag className="inline-block mr-1 text-teal-600" />
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status || ""}
                onChange={handleChange}
                className={`p-2 block w-full border ${
                  errors.status
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-teal-500 focus:border-teal-500"
                } rounded-md`}
                required
              >
                <option value="">Select status</option>
                <option value="Pending">Pending</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Resolved">Resolved</option>
                <option value="Escalated">Escalated</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-500">{errors.status}</p>
              )}
            </div>
          </div>
        </div>

        {/* Description Card */}
        <div className="bg-gray-50 p-5 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
            <FaClipboardList className="mr-2 text-teal-600" />
            Incident Description
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows="6"
              className={`p-2 block w-full border ${
                errors.description
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-teal-500 focus:border-teal-500"
              } rounded-md`}
              placeholder="Provide a detailed description of the incident..."
              required
            ></textarea>
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Repeat Incident Information */}
        {formData.isRepeat && (
          <div className="bg-amber-50 p-5 rounded-lg shadow-sm mb-6 border border-amber-200">
            <h3 className="text-lg font-medium text-amber-800 mb-4 flex items-center">
              <FaExclamationCircle className="mr-2 text-amber-600" />
              Repeat Incident
            </h3>
            
            <div className="flex items-center">
              <p className="text-amber-800">This is a repeat incident. Inmate has been involved in <strong>{formData.repeatCount || 0}</strong> incidents.</p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={() => setEdit ? setEdit(false) : navigate('/policeOfficer-dashboard/incident')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <FaTimes className="mr-2 -ml-1" />
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
              submitting ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {submitting ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                Updating...
              </>
            ) : (
              <>
                <FaSave className="mr-2 -ml-1" />
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
