import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { FaFileAlt, FaSignature, FaCalendarAlt, FaUser, FaPen, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const InmateClearance = ({setOpen}) => {
  const { inmateId } = useParams();
  const navigate = useNavigate();

  // Form state with additional fields
  const [formData, setFormData] = useState({
    date: new Date().toISOString().substring(0, 10),
    reason: "",
    remark: "",
    inmate: "",
    registrar: "",
    clearanceId: generateClearanceId(),
    propertyStatus: "Returned",
    fineStatus: "No Outstanding",
    medicalStatus: "Cleared",
    notes: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sign, setSign] = useState(null);
  const [signPreview, setSignPreview] = useState(null);
  const [inmates, setInmates] = useState([]); 
  const [selectedInmate, setSelectedInmate] = useState(null);
  const [departments, setDepartments] = useState([
    { id: 1, name: "Security", status: "Pending" },
    { id: 2, name: "Medical", status: "Pending" },
    { id: 3, name: "Property", status: "Pending" },
    { id: 4, name: "Finance", status: "Pending" },
    { id: 5, name: "Legal", status: "Pending" }
  ]);

  // Generate a unique clearance ID
  function generateClearanceId() {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CLR-${timestamp}-${random}`;
  }
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error message when user makes changes
    if (errorMessage) {
      setErrorMessage("");
    }
  };

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

  const handleDepartmentChange = (deptId, status) => {
    setDepartments(prev => 
      prev.map(dept => 
        dept.id === deptId ? { ...dept, status } : dept
      )
    );
  };

  // Fetch inmates and populate form if inmateId is provided
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
    
    const fetchInmateDetails = async () => {
      try {
        const response = await axiosInstance.get(`/inmates/${inmateId}`);
        if (response.data) {
          setSelectedInmate(response.data);
          setFormData((prevData) => ({
            ...prevData,
            inmate: response.data.fullName || response.data.name,
          }));
        }
      } catch (error) {
        console.error("Error fetching inmate details:", error);
        toast.error("Could not retrieve inmate details.");
      }
    };

    fetchInmates();
    if (inmateId) {
      fetchInmateDetails();
    }
  }, [inmateId]);

  // Check if all departments are approved
  const allDepartmentsApproved = () => {
    return departments.every(dept => dept.status === "Approved");
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    // Validation
    if (!formData.inmate) {
      setErrorMessage("Please select an inmate");
      setSubmitting(false);
      return;
    }

    if (!formData.reason) {
      setErrorMessage("Please provide a reason for the clearance");
      setSubmitting(false);
      return;
    }
    
    if (!formData.remark) { // Make sure remark is provided
      setErrorMessage("Please provide remarks for the clearance");
      setSubmitting(false);
      return;
    }

    if (!formData.registrar) {
      setErrorMessage("Please enter the registrar's name");
      setSubmitting(false);
      return;
    }

    try {
      // Create FormData for submission
    const formdata = new FormData();
      
      // Add all required fields explicitly
    formdata.append("date", formData.date);
      formdata.append("inmate", formData.inmate);
    formdata.append("reason", formData.reason);
    formdata.append("remark", formData.remark);
      formdata.append("registrar", formData.registrar);
      formdata.append("clearanceId", formData.clearanceId);
      
      // Add optional fields
      formdata.append("propertyStatus", formData.propertyStatus);
      formdata.append("fineStatus", formData.fineStatus);
      formdata.append("medicalStatus", formData.medicalStatus);
      formdata.append("notes", formData.notes || "");
      
      // Add file if available
    if (sign) {
      formdata.append("sign", sign);
    }

      const response = await axiosInstance.post("/clearance/addClearance", formdata);
      
      if (response.data) {
        toast.success("Clearance processed successfully");
        
        // Reset form after successful submission
        setFormData({
          date: new Date().toISOString().substring(0, 10),
          reason: "",
          remark: "",
          inmate: "",
          registrar: "",
          clearanceId: generateClearanceId(),
          propertyStatus: "Returned",
          fineStatus: "No Outstanding",
          medicalStatus: "Cleared",
          notes: ""
        });
        
        // Reset other state
        setSign(null);
        setSignPreview(null);
        
        // If in modal, close after success
        if (setOpen) {
          setTimeout(() => {
            setOpen(false);
        navigate("/securityStaff-dashboard/clearance");
          }, 1500);
        }
      } else {
        setErrorMessage("Failed to process clearance.");
        toast.error("Failed to process clearance");
      }
    } catch (error) {
      console.error("Error processing clearance:", error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "An error occurred while processing clearance.";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full mx-auto bg-white p-6 rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          <FaFileAlt className="inline-block mr-2 text-teal-600" />
          Process Inmate Clearance
        </h2>
        <p className="text-center text-sm text-gray-500 mt-1">Complete all required fields to process an inmate's clearance documents</p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-red-400" />
            </div>
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
                Select Inmate <span className="text-red-500">*</span>
            </label>
            <select
              name="inmate"
                value={formData.inmate}
              onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
              required
                disabled={loading}
            >
              <option value="">Select Inmate</option>
              {loading ? (
                <option disabled>Loading inmates...</option>
              ) : (
                inmates.map((inmate) => (
                    <option key={inmate._id} value={inmate.fullName || inmate.name}>
                      {inmate.fullName || inmate.name}
                  </option>
                ))
              )}
            </select>
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
                Clearance ID
              </label>
              <input
                type="text"
                value={formData.clearanceId}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">Automatically generated unique ID</p>
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
          </div>
        </div>

        {/* Departmental Approval */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center">
              <FaCheckCircle className="mr-2 text-teal-600" /> Departmental Approval
            </h3>
            <button 
              type="button"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
              onClick={() => {
                // Set all departments to approved (for quick testing)
                setDepartments(prev => prev.map(dept => ({ ...dept, status: "Approved" })));
              }}
            >
              <FaCheckCircle className="mr-1" /> Approve All
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Department</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Details</th>
                  <th className="px-4 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(dept => (
                  <tr key={dept.id} className="border-b border-gray-200">
                    <td className="px-4 py-2">{dept.name}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        dept.status === "Approved" ? "bg-green-100 text-green-800" :
                        dept.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {dept.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {dept.name === "Property" && (
                        <select 
                          name="propertyStatus" 
                          value={formData.propertyStatus}
                          onChange={handleChange}
                          className="p-1 text-xs border border-gray-300 rounded"
                        >
                          <option value="Returned">All Property Returned</option>
                          <option value="Partial">Partial Return</option>
                          <option value="Outstanding">Items Outstanding</option>
                        </select>
                      )}
                      {dept.name === "Finance" && (
                        <select 
                          name="fineStatus" 
                          value={formData.fineStatus}
                          onChange={handleChange}
                          className="p-1 text-xs border border-gray-300 rounded"
                        >
                          <option value="No Outstanding">No Outstanding Fines</option>
                          <option value="Partial">Partially Paid</option>
                          <option value="Outstanding">Fines Outstanding</option>
                        </select>
                      )}
                      {dept.name === "Medical" && (
                        <select 
                          name="medicalStatus" 
                          value={formData.medicalStatus}
                          onChange={handleChange}
                          className="p-1 text-xs border border-gray-300 rounded"
                        >
                          <option value="Cleared">Medical Clearance Approved</option>
                          <option value="Pending">Medical Check Pending</option>
                          <option value="Treatment">Ongoing Treatment Required</option>
                        </select>
                      )}
                      {dept.name === "Legal" && (
                        <span className="text-xs">Legal verification required</span>
                      )}
                      {dept.name === "Security" && (
                        <span className="text-xs">Security clearance required</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex space-x-2">
                        <button 
                          type="button"
                          onClick={() => handleDepartmentChange(dept.id, "Approved")}
                          className={`px-2 py-1 text-xs rounded ${
                            dept.status === "Approved" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-green-100"
                          }`}
                        >
                          Approve
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDepartmentChange(dept.id, "Rejected")}
                          className={`px-2 py-1 text-xs rounded ${
                            dept.status === "Rejected" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-red-100"
                          }`}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-gray-500 italic">All departments must approve before clearance can be processed</p>
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
                Additional Remarks
              </label>
            <textarea
              name="remark"
              value={formData.remark}
              onChange={handleChange}
                placeholder="Any additional information or notes"
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
              Upload an image of the registrar's signature (optional)
            </p>
          </div>
        </div>

        {/* Status Tracker */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Clearance Status</h3>
          
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.inmate ? 'bg-teal-600 text-white' : 'bg-gray-300'}`}>1</div>
                <span className="text-xs mt-1">Inmate Selected</span>
              </div>
              <div className="flex-1 h-1 bg-gray-300 mx-1"></div>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${allDepartmentsApproved() ? 'bg-teal-600 text-white' : 'bg-gray-300'}`}>2</div>
                <span className="text-xs mt-1">Dept. Approval</span>
              </div>
              <div className="flex-1 h-1 bg-gray-300 mx-1"></div>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.reason ? 'bg-teal-600 text-white' : 'bg-gray-300'}`}>3</div>
                <span className="text-xs mt-1">Details</span>
              </div>
              <div className="flex-1 h-1 bg-gray-300 mx-1"></div>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.registrar ? 'bg-teal-600 text-white' : 'bg-gray-300'}`}>4</div>
                <span className="text-xs mt-1">Authorization</span>
              </div>
            </div>
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
            disabled={submitting || loading}
            className={`py-3 px-8 text-white font-medium rounded-md shadow-md transition duration-200 ${
              submitting || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              "Process Clearance"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InmateClearance;
