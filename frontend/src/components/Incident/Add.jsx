import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; // Import toast
import "react-toastify/dist/ReactToastify.css"; // Import toast CSS
import { TiArrowBack } from "react-icons/ti";
import { FaExclamationCircle, FaCheckCircle, FaUpload, FaCalendarAlt, 
         FaUser, FaUserShield, FaTag, FaClipboardList, FaFileAlt } from "react-icons/fa";

const Add = ({ setOpen }) => {
  const [formData, setFormData] = useState({
    incidentId: `INC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    reporter: "",
    inmate: "",
    incidentDate: new Date().toISOString().split('T')[0],
    incidentType: "",
    status: "Pending", // Default status
    description: ""
  });
  const [attachment, setAttachment] = useState(null);
  const [inmates, setInmates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const navigate = useNavigate();

  // Fetch inmates from the backend
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

    fetchInmates();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  // Handle attachment change
  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should not exceed 5MB");
        setAttachment(null);
        setAttachmentPreview(null);
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only JPEG, PNG, GIF, and PDF files are allowed");
        setAttachment(null);
        setAttachmentPreview(null);
        return;
      }
      
      setAttachment(file);
      
      // Create preview URL
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachmentPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        // For PDFs, use a generic icon
        setAttachmentPreview('/pdf-icon.png');
      }
    } else {
      setAttachment(null);
      setAttachmentPreview(null);
    }
  };

  // Create a placeholder file for the backend requirement
  const createPlaceholderFile = () => {
    // Small 1x1 transparent PNG
    const base64Data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const byteString = atob(base64Data.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new File([ab], "placeholder.png", { type: "image/png" });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formdata = new FormData();
    formdata.append("incidentId", formData.incidentId);
    formdata.append("reporter", formData.reporter);
    formdata.append("inmate", formData.inmate);
    formdata.append("incidentDate", formData.incidentDate);
    formdata.append("incidentType", formData.incidentType);
    formdata.append("status", formData.status);
    formdata.append("description", formData.description);

    // If no attachment provided, use a placeholder file to satisfy backend requirement
    if (attachment) {
      formdata.append("attachment", attachment);
    } else {
      const placeholderFile = createPlaceholderFile();
      formdata.append("attachment", placeholderFile);
    }

    try {
      const response = await axiosInstance.post(
        "/incidents/new-incident",
        formdata,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data) {
        toast.success("New Incident Registered Successfully!");
        setFormData({
          incidentId: `INC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          reporter: "",
          inmate: "",
          incidentDate: new Date().toISOString().split('T')[0],
          incidentType: "",
          status: "Pending",
          description: ""
        });
        setAttachment(null);
        setAttachmentPreview(null);
        
        if (setOpen) {
          setOpen(false);
        } else {
          navigate("/policeOfficer-dashboard/incident");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      if (error.response) {
        toast.error(
          error.response.data.message ||
            "An error occurred while adding the incident."
        );
      } else {
        toast.error("Error occurred. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Header with icon and title */}
      <div className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaClipboardList className="mr-2 text-teal-600" />
          Report New Incident
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Complete the form below to report a prison incident
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Incident Information Card */}
        <div className="bg-gray-50 p-5 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
            <FaFileAlt className="mr-2 text-teal-600" />
            Incident Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Incident ID - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Incident ID
              </label>
              <input
                type="text"
                name="incidentId"
                value={formData.incidentId}
                readOnly
                className="p-2 block w-full border border-gray-300 rounded-md bg-gray-100 text-gray-700"
              />
              <p className="mt-1 text-xs text-gray-500">Auto-generated unique identifier</p>
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
                value={formData.incidentDate}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                className="p-2 block w-full border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                required
              />
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
                value={formData.reporter}
                placeholder="Enter full name of reporter"
                onChange={handleChange}
                className="p-2 block w-full border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>

            {/* Inmate Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaUser className="inline-block mr-1 text-teal-600" />
                Inmate Involved <span className="text-red-500">*</span>
              </label>
              <select
                name="inmate"
                value={formData.inmate}
                onChange={handleChange}
                className="p-2 block w-full border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
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
                value={formData.incidentType}
                onChange={handleChange}
                className="p-2 block w-full border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
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
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="p-2 block w-full border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                required
              >
                <option value="Pending">Pending</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Resolved">Resolved</option>
                <option value="Escalated">Escalated</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Current status of the incident</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              placeholder="Provide a detailed description of what happened during the incident..."
              onChange={handleChange}
              className="p-2 block w-full border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              rows="4"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Include who was involved, what happened, when and where the incident occurred, and any actions taken
            </p>
          </div>

          {/* Attachment - Clearly marked as optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaUpload className="inline-block mr-1 text-teal-600" />
              Upload Attachment <span className="text-xs text-gray-500">(Optional)</span>
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <input
                type="file"
                name="attachment"
                accept="image/jpeg,image/png,image/gif,application/pdf"
                onChange={handleAttachmentChange}
                className="p-2 block w-full border border-gray-300 rounded-md"
              />
              
              {attachmentPreview && (
                <div className="h-20 w-20 border rounded-md overflow-hidden flex-shrink-0">
                  <img
                    src={attachmentPreview}
                    alt="Attachment Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Accepted formats: JPEG, PNG, GIF, PDF (Max: 5MB)
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
            onClick={() => {
              if (setOpen) {
                setOpen(false);
              } else {
                navigate(-1);
              }
            }}
            className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-200 flex items-center justify-center"
          >
            <TiArrowBack className="mr-1" />
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
                <FaCheckCircle className="mr-1" />
                Submit Incident
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Add;