import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { useParams } from "react-router-dom";
import { TiArrowBack } from "react-icons/ti";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import ConfirmModal from "../Modals/ConfirmModal";
import { 
  FaCalendarAlt, FaUser, FaFileAlt, FaClipboardList, 
  FaTag, FaInfoCircle, FaExclamationTriangle, FaTrashAlt, 
  FaPrint, FaExclamationCircle
} from "react-icons/fa";

const ViewIncident = ({setView, id}) => {
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDelete, setOpenDelete] = useState(false);

  const deleteIncident = async () => {
    try {
      console.log("Attempting to delete incident with ID:", id);
      const response = await axiosInstance.delete(`/incidents/delete-incident/${id}`);
      console.log("Delete response:", response.data);
      
      if (response.data && response.status === 200) {
        toast.success("Incident deleted successfully!");
        setOpenDelete(false);
        navigate("/policeOfficer-dashboard/incident");
      } else {
        const errorMsg = response.data?.message || "Failed to delete incident. Please try again.";
        console.error("Delete failed:", errorMsg);
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Error deleting incident:", error);
      const errorMsg = error.response?.data?.error || "Error deleting incident";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const response = await axiosInstance.get(`/incidents/get-incident/${id}`);
        if (response.data && response.data.incident) {
          setIncident(response.data.incident);
          console.log("Incident data:", response.data.incident);
        } else {
          setError("Incident details not found.");
        }
      } catch (error) {
        console.error("Error fetching incident details:", error);
        setError(error.response?.data?.error || "An error occurred while fetching incident details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchIncident();
    } else {
      setError("No incident ID provided");
      setLoading(false);
    }
  }, [id]);

  // Get formatted date
  const getFormattedDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status class
  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'escalated':
        return 'bg-red-100 text-red-800';
      case 'under investigation':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get severity class
  const getSeverityClass = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
        <span className="ml-3 text-teal-600 font-medium">Loading incident details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <FaExclamationCircle className="text-red-600 text-5xl mb-4" />
        <div className="text-red-600 font-semibold text-lg mb-2">{error}</div>
        
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <FaExclamationCircle className="text-amber-600 text-5xl mb-4" />
        <div className="text-amber-600 font-semibold text-lg mb-2">Incident not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto my-8 bg-white rounded-lg overflow-hidden shadow-lg print:shadow-none print:my-0">
      {/* Header */}
      <div className="bg-teal-600 print:bg-white print:border-b-2 print:border-gray-300 text-white print:text-gray-800 p-6 flex justify-between items-center">
        <h2 className="text-2xl md:text-3xl font-bold flex items-center">
          <FaClipboardList className="mr-3" />
          Incident Report
        </h2>
        <div className="flex space-x-2 print:hidden">
          
          <button
            onClick={handlePrint}
            className="flex items-center px-3 py-1.5 bg-white text-teal-600 hover:bg-gray-100 rounded text-sm font-medium transition-colors"
          >
            <FaPrint className="mr-1" />
            Print
          </button>
          <button
            className="flex items-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors"
            onClick={() => setOpenDelete(true)}
          >
            <FaTrashAlt className="mr-1" />
            Delete
          </button>
        </div>
      </div>

      {incident ? (
        <div className="p-6">
          {/* Incident summary banner */}
          <div className="mb-8 bg-gray-50 print:bg-white border print:border-b rounded-lg overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between p-4">
              <div className="flex items-center mb-3 md:mb-0">
                <div className="bg-teal-100 p-2.5 rounded-full">
                  <FaFileAlt className="text-teal-600 text-xl" />
                </div>
                <div className="ml-3">
                  <div className="text-sm text-gray-500">Incident ID</div>
                  <div className="font-semibold">{incident.incidentId}</div>
                </div>
              </div>
              <div className="flex items-center mb-3 md:mb-0">
                <div className="bg-teal-100 p-2.5 rounded-full">
                  <FaCalendarAlt className="text-teal-600 text-xl" />
                </div>
                <div className="ml-3">
                  <div className="text-sm text-gray-500">Reported On</div>
                  <div className="font-semibold">{getFormattedDate(incident.incidentDate)}</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-teal-100 p-2.5 rounded-full">
                  <FaTag className="text-teal-600 text-xl" />
                </div>
                <div className="ml-3">
                  <div className="text-sm text-gray-500">Status</div>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusClass(incident.status)}`}>
                    {incident.status}
                  </div>
                </div>
              </div>
            </div>
            </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left column - Incident details */}
            <div className="col-span-1 md:col-span-8 space-y-6">
              {/* Incident participants */}
              <div className="bg-white border rounded-lg overflow-hidden shadow-sm print:shadow-none">
                <div className="px-6 py-4 border-b bg-gray-50 print:bg-white">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FaUser className="mr-2 text-teal-600" />
                    Involved Parties
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Reporter</div>
                    <div className="font-medium text-gray-900 p-3 bg-gray-50 rounded-md">
                      {incident.reporter}
                    </div>
                  </div>
                  <div> 
                    <div className="text-sm text-gray-500 mb-1">Inmate Involved</div>
                    <div className="font-medium text-gray-900 p-3 bg-gray-50 rounded-md">
                      {incident.inmate}
                    </div>
                  </div>
                </div>
                </div>

              {/* Incident details */}
              <div className="bg-white border rounded-lg overflow-hidden shadow-sm print:shadow-none">
                <div className="px-6 py-4 border-b bg-gray-50 print:bg-white">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FaInfoCircle className="mr-2 text-teal-600" />
                    Incident Details
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Incident Type</div>
                      <div className="font-medium text-gray-900 p-3 bg-gray-50 rounded-md">
                        {incident.incidentType}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Severity Level</div>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getSeverityClass(incident.severity || 'Low')}`}>
                        {incident.severity || 'Low'}
                        {incident.isRepeat && (
                          <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                            Repeat #{incident.repeatCount || '?'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Description</div>
                    <div className="font-medium text-gray-900 p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                      {incident.description}
                    </div>
                  </div>
                  
                  {incident.attachment && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Attachment</div>
                      <div className="mt-2">
                        <a 
                          href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/uploads/${incident.attachment}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
                        >
                          <FaFileAlt className="mr-2" />
                          View Attachment
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column - Status and metadata */}
            <div className="col-span-1 md:col-span-4 space-y-6">
              {/* Status card */}
              <div className="bg-white border rounded-lg overflow-hidden shadow-sm print:shadow-none">
                <div className="px-6 py-4 border-b bg-gray-50 print:bg-white">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FaExclamationTriangle className="mr-2 text-teal-600" />
                    Status
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-col space-y-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Current Status</div>
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold ${getStatusClass(incident.status)}`}>
                        {incident.status}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Last Updated</div>
                      <div className="font-medium text-gray-900">
                        {incident.updatedAt ? getFormattedDate(incident.updatedAt) : "Not available"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tags/metadata card */}
              <div className="bg-white border rounded-lg overflow-hidden shadow-sm print:shadow-none">
                <div className="px-6 py-4 border-b bg-gray-50 print:bg-white">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FaTag className="mr-2 text-teal-600" />
                    Related Information
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-col space-y-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Incident ID</div>
                      <div className="font-medium text-gray-900">{incident.incidentId}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Created At</div>
                      <div className="font-medium text-gray-900">
                        {incident.createdAt ? getFormattedDate(incident.createdAt) : "Not available"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-10 text-center">
          <FaExclamationCircle className="mx-auto text-4xl text-red-500 mb-4" />
          <p className="text-gray-700">Incident data not available.</p>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={openDelete}
        setOpen={setOpenDelete}
        title="Delete Incident"
        message="Are you sure you want to delete this incident record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={deleteIncident}
        confirmButtonColor="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default ViewIncident;
