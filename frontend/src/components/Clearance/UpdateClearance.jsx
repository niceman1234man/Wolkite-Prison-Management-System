import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { TiArrowBack } from "react-icons/ti";
import { toast } from "react-toastify";
import { FaFileAlt, FaSignature, FaCalendarAlt, FaUser, FaPen, FaNotesMedical } from "react-icons/fa";

const UpdateClearance = ({setOpen, id}) => {
  const navigate = useNavigate();

  // Function to generate a unique clearance ID
  function generateClearanceId() {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CLR-${timestamp}-${random}`;
  }

  const [formData, setFormData] = useState({
    date: new Date().toISOString().substring(0, 10),
    reason: "",
    remark: "",
    inmate: "", 
    registrar: "",
    sign: "",
    clearanceId: generateClearanceId(),
    propertyStatus: "Returned",
    fineStatus: "No Outstanding",
    medicalStatus: "Cleared",
    notes: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sign, setSign] = useState("");
  const [signPreview, setSignPreview] = useState(null);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    
    // Clear error when user makes changes
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  // Handle signature file upload
  const handleSignChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSign(file);
      
      // Create a preview URL for the signature
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSign(null);
      setSignPreview(null);
    }
  };

  // Pre-populate clearance data if id is available
  useEffect(() => {
    const fetchClearanceDetails = async () => {
      try {
        const response = await axiosInstance.get(`/clearance/getClearance/${id}`);
        if (response.data && response.data.clearance) {
          const clearance = response.data.clearance;
          
          // Update form data with fetched clearance data
          setFormData({
            date: new Date(clearance.date).toISOString().substring(0, 10),
            reason: clearance.reason || "",
            remark: clearance.remark || "",
            inmate: clearance.inmate || "", 
            registrar: clearance.registrar || "",
            sign: clearance.sign || "",
            clearanceId: clearance.clearanceId || generateClearanceId(),
            propertyStatus: clearance.propertyStatus || "Returned",
            fineStatus: clearance.fineStatus || "No Outstanding",
            medicalStatus: clearance.medicalStatus || "Cleared",
            notes: clearance.notes || ""
          });
          
          // If there's a signature, set the preview
          if (clearance.sign) {
            // Assuming your server stores images in an 'uploads' folder
            setSignPreview(`/uploads/${clearance.sign}`);
          }
        }
      } catch (error) {
        console.error("Error fetching clearance details:", error);
        toast.error("Could not load clearance details");
      }
    };

    if (id) {
      fetchClearanceDetails();
    }
  }, [id]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(""); 

    try {
      // Create FormData object for submission
      const formdata = new FormData();
      
      // Add all fields to the FormData explicitly
      formdata.append("date", formData.date);
      formdata.append("inmate", formData.inmate);
      formdata.append("reason", formData.reason);
      formdata.append("remark", formData.remark);
      formdata.append("registrar", formData.registrar);
      formdata.append("clearanceId", formData.clearanceId);
      formdata.append("propertyStatus", formData.propertyStatus);
      formdata.append("fineStatus", formData.fineStatus);
      formdata.append("medicalStatus", formData.medicalStatus);
      formdata.append("notes", formData.notes || "");
      
      // Handle signature - either use existing or upload new
      if (sign && typeof sign !== 'string') {
        // If we have a new file, append it
        formdata.append("sign", sign);
        console.log("Adding new signature file");
      } else if (formData.sign) {
        // Otherwise maintain existing signature value
        formdata.append("sign", formData.sign);
        console.log("Keeping existing signature:", formData.sign);
      }
      
      // Debug: Log all keys and values in the FormData
      for (let [key, value] of formdata.entries()) {
        console.log(`${key}: ${value instanceof File ? 'File: ' + value.name : value}`);
      }
      
      console.log("Sending update request to:", `/clearance/updateClearance/${id}`);
      
      // Make the API request with proper headers
      const response = await axiosInstance.put(`/clearance/updateClearance/${id}`, formdata, {
        headers: { 
          "Content-Type": "multipart/form-data"
        }
      });
      
      console.log("Response received:", response.data);
      
      if (response.data && response.data.success) {
        toast.success("Clearance updated successfully");
        setOpen(false);
        navigate("/securityStaff-dashboard/clearance");
      } else {
        setErrorMessage("Failed to update clearance");
        toast.error("Failed to update clearance");
      }
    } catch (error) {
      console.error("Error updating clearance:", error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "An error occurred while updating clearance.";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto bg-white p-6 rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          <FaFileAlt className="inline-block mr-2 text-teal-600" />
          Update Inmate Clearance
        </h2>
        <p className="text-center text-sm text-gray-500 mt-1">Update clearance information for this inmate</p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
            <FaUser className="mr-2 text-teal-600" /> Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inmate Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="inmate"
                value={formData.inmate}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clearance Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full pl-10 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registrar Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="registrar"
                value={formData.registrar}
                onChange={handleChange}
                placeholder="Enter registrar's full name"
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clearance ID
              </label>
              <input
                type="text"
                name="clearanceId"
                value={formData.clearanceId}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">Unique identifier for this clearance</p>
            </div>
          </div>
        </div>

        {/* Clearance Status */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
            <FaNotesMedical className="mr-2 text-teal-600" /> Clearance Status
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Status
              </label>
              <select
                name="propertyStatus"
                value={formData.propertyStatus}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="Returned">All Property Returned</option>
                <option value="Partial">Partial Return</option>
                <option value="Outstanding">Items Outstanding</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Status of inmate's property</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fine Status
              </label>
              <select
                name="fineStatus"
                value={formData.fineStatus}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="No Outstanding">No Outstanding Fines</option>
                <option value="Partial">Partially Paid</option>
                <option value="Outstanding">Fines Outstanding</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Status of inmate's fines</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical Status
              </label>
              <select
                name="medicalStatus"
                value={formData.medicalStatus}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="Cleared">Medical Clearance Approved</option>
                <option value="Pending">Medical Check Pending</option>
                <option value="Treatment">Ongoing Treatment Required</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Medical clearance status</p>
            </div>
          </div>
        </div>

        {/* Clearance Details */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
            <FaPen className="mr-2 text-teal-600" /> Clearance Details
          </h3>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clearance Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Enter detailed reason for clearance"
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                required
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleChange}
                placeholder="Additional information or notes"
                rows="2"
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                required
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any other important information"
                rows="2"
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
            <FaSignature className="mr-2 text-teal-600" /> Authentication
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Digital Signature
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                name="sign"
                onChange={handleSignChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                accept=".jpg,.png,.jpeg"
              />
              {signPreview && (
                <div className="h-16 w-20 border rounded-md overflow-hidden">
                  <img
                    src={signPreview}
                    alt="Signature Preview"
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {formData.sign ? "Current signature will be kept unless you upload a new one" : "Upload an image of the registrar's signature (optional)"}
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={() => setOpen ? setOpen(false) : navigate(-1)}
            className="py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition duration-200"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className={`py-3 px-8 text-white font-medium rounded-md shadow-md transition duration-200 ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : (
              "Update Clearance"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateClearance;
