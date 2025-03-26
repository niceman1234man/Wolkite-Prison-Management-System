import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";

const ViewPrisoner = () => {
  const [prisoner, setPrisoner] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrisonerDetails = async () => {
      try {
        const response = await axiosInstance.get(`/api/woreda-inmate/get-inmate/${id}`);
        if (response.data?.success) {
          setPrisoner(response.data.inmate);
        } else {
          toast.error("Failed to fetch prisoner details");
        }
      } catch (error) {
        console.error("Error fetching prisoner details:", error);
        toast.error("Failed to fetch prisoner details");
      } finally {
        setLoading(false);
      }
    };

    fetchPrisonerDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!prisoner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl text-red-600 mb-4">Prisoner not found</p>
        <button
          onClick={() => navigate("/woreda-dashboard/prisoner-list")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate("/woreda-dashboard/prisoner-list")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft /> Back to List
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Prisoner Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Personal Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {prisoner.firstName} {prisoner.lastName}</p>
              <p><span className="font-medium">Date of Birth:</span> {new Date(prisoner.dateOfBirth).toLocaleDateString()}</p>
              <p><span className="font-medium">Gender:</span> {prisoner.gender}</p>
              <p><span className="font-medium">Address:</span> {prisoner.address}</p>
            </div>
          </div>

          {/* Criminal Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Criminal Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Crime:</span> {prisoner.crime}</p>
              <p><span className="font-medium">Intake Date:</span> {new Date(prisoner.intakeDate).toLocaleDateString()}</p>
              <p><span className="font-medium">Status:</span> {prisoner.status}</p>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Medical Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Blood Type:</span> {prisoner.bloodType}</p>
              <p><span className="font-medium">Medical Conditions:</span> {prisoner.medicalConditions || "None"}</p>
              <p><span className="font-medium">Allergies:</span> {prisoner.allergies || "None"}</p>
            </div>
          </div>

          {/* Administrative Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Administrative Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Registration Date:</span> {new Date(prisoner.registrationDate).toLocaleDateString()}</p>
              <p><span className="font-medium">Registration Number:</span> {prisoner.registrationNumber}</p>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        {prisoner.documents && prisoner.documents.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prisoner.documents.map((doc, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <p className="font-medium">{doc.name}</p>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
                  >
                    View Document
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewPrisoner; 