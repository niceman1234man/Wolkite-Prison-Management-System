import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { useParams } from "react-router-dom";
import { TiArrowBack } from "react-icons/ti";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';  // Import toast
import ConfirmModal from "../Modals/ConfirmModal";

const ViewIncident = ({setView, id}) => {
  const navigate = useNavigate();
  // const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
   const [openDelete, setOpenDelete] = useState(false);

  const deleteIncident = async () => {
    try {
      const deletedIncident = await axiosInstance.delete(`/incidents/delete-incident/${id}`);
      if (deletedIncident) {
        toast.success("Incident deleted successfully!");
        setOpenDelete(false);
        navigate("/admin-dashboard/incidents");
      }
    } catch (error) {
      setError(error.response?.data?.error || "Error deleting incident");
    }
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

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-600 font-semibold">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Incident Details</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => navigate("/admin-dashboard/incidents")}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <TiArrowBack className="mr-2" />
            Back to List
          </button>
          <button
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
            onClick={() => setOpenDelete(true)}
          >
            Delete
          </button>
        </div>
      </div>

      {incident ? (
        <div className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-lg font-medium text-gray-700">Incident ID</h4>
                <p className="text-gray-900">{incident.incidentId}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-lg font-medium text-gray-700">Reporter Name</h4>
                <p className="text-gray-900">{incident.reporter}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-lg font-medium text-gray-700">Inmate</h4>
                <p className="text-gray-900">{incident.inmate}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-lg font-medium text-gray-700">Date of Incident</h4>
                <p className="text-gray-900">
                  {new Date(incident.incidentDate).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-lg font-medium text-gray-700">Incident Type</h4>
                <p className="text-gray-900">{incident.incidentType}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-lg font-medium text-gray-700">Status</h4>
                <p className={`font-medium ${incident.status === "Resolved" ? "text-green-600" : "text-red-600"}`}>
                  {incident.status}
                </p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Description</h3>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-gray-900 whitespace-pre-wrap">{incident.description}</p>
            </div>
          </div>

          {/* Attachment Section */}
          {incident.attachment && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Attachment</h3>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <img 
                  src={`https://localhost:4000/uploads/${incident.attachment}`} 
                  alt="Incident Attachment" 
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-red-600 font-semibold">Incident not found.</div>
      )}

      <ConfirmModal
        open={openDelete}
        setOpen={setOpenDelete}
        onDelete={deleteIncident}
        message="Do you really want to delete this Incident? This action cannot be undone."
      />
    </div>
  );
};

export default ViewIncident;
