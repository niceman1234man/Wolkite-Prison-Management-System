import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import TransferDialog from "./TransferDialog";
import PrintButton from "./PrintButton";
import { FaUser, FaArrowLeft, FaExchangeAlt, FaFileAlt } from "react-icons/fa";

export default function ViewWoredaInmate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inmate, setInmate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

  useEffect(() => {
    const fetchInmateDetails = async () => {
      try {
        const response = await axiosInstance.get(
          `/woreda-inmate/get-inmate/${id}`
        );
        if (response.data?.success) {
          setInmate(response.data.inmate);
        } else {
          throw new Error(
            response.data?.error || "Failed to fetch inmate details"
          );
        }
      } catch (error) {
        console.error("Error fetching inmate details:", error);
        setError(
          error.response?.data?.error || "Failed to fetch inmate details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInmateDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-6 lg:p-8 ml-0 md:ml-64">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 md:p-6 lg:p-8 ml-0 md:ml-64">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate("/woreda-dashboard/inmates")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  if (!inmate) {
    return (
      <div className="flex-1 p-4 md:p-6 lg:p-8 ml-0 md:ml-64">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-gray-600 mb-4">Inmate not found</div>
          <button
            onClick={() => navigate("/woreda-dashboard/inmates")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 ml-0 md:ml-64">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Photo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-48 h-48 mb-4">
            {inmate?.documents?.length > 0 ? (
              <img
                src={inmate.documents[0]}
                alt={`${inmate.firstName} ${inmate.lastName}`}
                className="w-full h-full rounded-lg object-cover border-4 border-green-600 shadow-lg"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/200?text=No+Photo";
                }}
              />
            ) : (
              <div className="w-full h-full rounded-lg bg-gray-200 border-4 border-green-600 shadow-lg flex items-center justify-center">
                <FaUser className="w-24 h-24 text-gray-400" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center py-2 text-sm">
              {inmate.firstName} {inmate.lastName}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {inmate?.firstName} {inmate?.lastName}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mb-6">
          <button
            onClick={() => navigate("/woreda-dashboard/prisoners")}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to List
          </button>
          <div className="space-x-4">
            <PrintButton
              inmate={inmate}
              title="Inmate Details Report"
              additionalData={{
                "Personal Information": {
                  "Full Name": `${inmate?.firstName} ${inmate?.middleName} ${inmate?.lastName}`,
                  "Date of Birth": new Date(
                    inmate?.dateOfBirth
                  ).toLocaleDateString(),
                  Gender: inmate?.gender,
                  Status: inmate?.status,
                },
                "Criminal Information": {
                  Crime: inmate?.crime,
                  "Risk Level": inmate?.riskLevel,
                  "Sentence Start": new Date(
                    inmate?.sentenceStart
                  ).toLocaleDateString(),
                  "Sentence End": new Date(
                    inmate?.sentenceEnd
                  ).toLocaleDateString(),
                },
                "Medical Information": {
                  "Medical Conditions": inmate?.medicalConditions || "None",
                  "Special Requirements": inmate?.specialRequirements || "None",
                },
                "Administrative Information": {
                  "Assigned Prison": inmate?.assignedPrison,
                  "Holding Cell": inmate?.holdingCell,
                  "Arresting Officer": inmate?.arrestingOfficer,
                  "Intake Date": new Date(
                    inmate?.intakeDate
                  ).toLocaleDateString(),
                },
              }}
            />
            <button
              onClick={() => setIsTransferDialogOpen(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <FaExchangeAlt className="mr-2" />
              Transfer Inmate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Personal Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Full Name
                </label>
                <p className="mt-1 text-gray-900">
                  {inmate.firstName} {inmate.middleName} {inmate.lastName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Date of Birth
                </label>
                <p className="mt-1 text-gray-900">
                  {new Date(inmate.dateOfBirth).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Gender
                </label>
                <p className="mt-1 text-gray-900">{inmate.gender}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Status
                </label>
                <p className="mt-1">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {inmate.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Criminal Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Criminal Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Crime
                </label>
                <p className="mt-1 text-gray-900">{inmate.crime}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Risk Level
                </label>
                <p className="mt-1 text-gray-900">{inmate.riskLevel}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Sentence Start
                </label>
                <p className="mt-1 text-gray-900">
                  {new Date(inmate.sentenceStart).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Sentence End
                </label>
                <p className="mt-1 text-gray-900">
                  {new Date(inmate.sentenceEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Medical Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600">
                  Medical Conditions
                </label>
                <p className="mt-1 text-gray-900">
                  {inmate.medicalConditions || "None"}
                </p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600">
                  Special Requirements
                </label>
                <p className="mt-1 text-gray-900">
                  {inmate.specialRequirements || "None"}
                </p>
              </div>
            </div>
          </div>

          {/* Administrative Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Administrative Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Assigned Prison
                </label>
                <p className="mt-1 text-gray-900">{inmate.assignedPrison}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Holding Cell
                </label>
                <p className="mt-1 text-gray-900">{inmate.holdingCell}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Arresting Officer
                </label>
                <p className="mt-1 text-gray-900">{inmate.arrestingOfficer}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Intake Date
                </label>
                <p className="mt-1 text-gray-900">
                  {new Date(inmate.intakeDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Documents */}
          {inmate.documents && inmate.documents.length > 0 && (
            <div className="col-span-2 space-y-4">
              <h2 className="text-xl font-semibold text-gray-700">
                Documents & Photos
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {inmate.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                      {doc.type === "image" ? (
                        <img
                          src={doc.url}
                          alt={`Inmate Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                          onClick={() => window.open(doc.url, "_blank")}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaFileAlt className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-white">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm"
                      >
                        <FaFileAlt className="w-4 h-4" />
                        {doc.type === "image"
                          ? `View Photo ${index + 1}`
                          : `View Document ${index + 1}`}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add TransferDialog */}
        <TransferDialog
          isOpen={isTransferDialogOpen}
          onClose={() => setIsTransferDialogOpen(false)}
          inmate={inmate}
          onTransferComplete={() => {
            navigate("/woreda-dashboard/inmates");
          }}
        />
      </div>
    </div>
  );
}
