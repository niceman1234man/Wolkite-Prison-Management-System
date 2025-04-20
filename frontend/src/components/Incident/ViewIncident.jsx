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
      const response = await axiosInstance.delete(`/incidents/update-incident/${id}`);
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
        if (response.data && Array.isArray(response.data.incidents) && response.data.incidents.length > 0) {
          setIncident(response.data.incidents[0]);
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

    fetchIncident();
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

              {/* Description */}
              <div className="bg-white border rounded-lg overflow-hidden shadow-sm print:shadow-none">
                <div className="px-6 py-4 border-b bg-gray-50 print:bg-white">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FaInfoCircle className="mr-2 text-teal-600" />
                    Incident Description
                  </h3>
                </div>
                <div className="p-6">
                  <div className="font-medium text-gray-900 p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                    {incident.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Additional info */}
            <div className="col-span-1 md:col-span-4 space-y-6">
              {/* Incident Type */}
              <div className="bg-white border rounded-lg overflow-hidden shadow-sm print:shadow-none">
                <div className="px-6 py-4 border-b bg-gray-50 print:bg-white">
                  <h3 className="text-lg font-semibold text-gray-800">Incident Type</h3>
                </div>
                <div className="p-6">
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full font-medium bg-teal-100 text-teal-800">
                    {incident.incidentType}
                  </div>
                </div>
            </div>

              {/* Attachment */}
              {incident.attachment && (
                <div className="bg-white border rounded-lg overflow-hidden shadow-sm print:shadow-none">
                  <div className="px-6 py-4 border-b bg-gray-50 print:bg-white">
                    <h3 className="text-lg font-semibold text-gray-800">Attachment</h3>
                  </div>
                  <div className="p-4">
                    <div className="rounded-lg overflow-hidden border">
                      <img 
                        src={`https://localhost:4000/uploads/${incident.attachment}`} 
                        alt="Incident Attachment" 
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      Supporting documentation
                    </div>
                  </div>
                </div>
              )}

              {/* Other info */}
              <div className="bg-white border rounded-lg overflow-hidden shadow-sm print:shadow-none">
                <div className="px-6 py-4 border-b bg-gray-50 print:bg-white">
                  <h3 className="text-lg font-semibold text-gray-800">Additional Information</h3>
                </div>
                <div className="p-4">
                  <div className="text-sm text-gray-500 py-2 border-b">Date Reported</div>
                  <div className="font-medium text-gray-900 py-2 mb-2">
                    {getFormattedDate(incident.createdAt || incident.incidentDate)}
            </div>

                  <div className="text-sm text-gray-500 py-2 border-b">Last Updated</div>
                  <div className="font-medium text-gray-900 py-2">
                    {getFormattedDate(incident.updatedAt || incident.incidentDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - print only */}
          <div className="mt-16 border-t pt-6 text-center text-gray-500 hidden print:block">
            <p>This document was generated on {new Date().toLocaleDateString()} - Wolkite Prison Management System</p>
            <p className="text-xs mt-1">CONFIDENTIAL - For official use only</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16">
          <FaExclamationTriangle className="text-yellow-500 text-5xl mb-4" />
          <div className="text-center text-gray-600 font-medium text-lg">Incident not found.</div>
          <p className="text-gray-500 mt-2">The requested incident record could not be located.</p>
            <button
            onClick={() => navigate("/admin-dashboard/incidents")}
            className="mt-6 flex items-center px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded transition-colors"
            >
            <TiArrowBack className="mr-2" />
            Return to Incidents
            </button>
        </div>
      )}

               <ConfirmModal
                 open={openDelete}
                 message="Do you really want to delete this Incident? This action cannot be undone."
                 onConfirm={() => {
                   deleteIncident();
                   setOpenDelete(false);
                 }}
                 onCancel={() => setOpenDelete(false)}
               />
    </div>
  );
};

export default ViewIncident;
