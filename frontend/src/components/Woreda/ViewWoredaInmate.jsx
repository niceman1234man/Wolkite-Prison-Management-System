import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import TransferDialog from "./TransferDialog";
import PrintButton from "./PrintButton";
import { FaUser, FaArrowLeft, FaExchangeAlt, FaFileAlt, FaPrint, FaTimes } from "react-icons/fa";

export default function ViewWoredaInmate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inmate, setInmate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [prisonName, setPrisonName] = useState("");
  const [modalOpen, setModalOpen] = useState(true);

  useEffect(() => {
    const fetchInmateDetails = async () => {
      try {
        const response = await axiosInstance.get(
          `/woreda-inmate/get-inmate/${id}`
        );
        if (response.data?.success) {
          setInmate(response.data.inmate);
          // Fetch prison name if assigned
          if (response.data.inmate.assignedPrison) {
            const prisonResponse = await axiosInstance.get(`/prison/${response.data.inmate.assignedPrison}`);
            if (prisonResponse.data?.success) {
              setPrisonName(prisonResponse.data.prison.prison_name);
            }
          }
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

  const closeModal = () => {
    setModalOpen(false);
    navigate("/woreda-dashboard/prisoners");
  };

  // Calculate sentence duration in years
  const calculateSentenceDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate difference in years
    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    
    // Adjust for months
    let years = yearDiff;
    if (monthDiff < 0) {
      years -= 1;
    }
    
    return years === 1 ? "1 year" : `${years} years`;
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-6 lg:p-8 ml-0 md:ml-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 md:p-6 lg:p-8 ml-0 md:ml-64">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate("/woreda-dashboard/inmates")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
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
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-gray-600 mb-4">Inmate not found</div>
          <button
            onClick={() => navigate("/woreda-dashboard/inmates")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 ml-0 md:ml-64 mt-8">
      {/* Modal Background */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          {/* Modal Container - reduced width */}
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header with Photo */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-lg p-4 md:p-6 text-white">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                {/* Photo in header - smaller size */}
                <div className="relative w-24 h-24 md:w-28 md:h-28">
                  {inmate?.documents?.length > 0 ? (
                    <img
                      src={inmate.documents[0]}
                      alt={`${inmate.firstName} ${inmate.lastName}`}
                      className="w-full h-full rounded-lg object-cover border-2 border-white shadow-lg"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/200?text=No+Photo";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-gray-200 border-2 border-white shadow-lg flex items-center justify-center">
                      <FaUser className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Inmate details - removed registration number */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl font-bold">
                    {inmate?.firstName} {inmate?.middleName} {inmate?.lastName}
                  </h1>
                  <p className="text-blue-100 mt-1">Prison: {prisonName || "Not assigned"}</p>
                </div>
                
                {/* Close button */}
                <button 
                  onClick={closeModal}
                  className="text-white hover:text-red-200 transition-colors self-start"
                >
                  <FaTimes size={24} />
                </button>
              </div>
            </div>
            
            {/* Modal Body - Scrollable - add margin top */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {/* Detailed Information Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
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
                        Registration #
                      </label>
                      <p className="mt-1 text-gray-900">{inmate.registrationNumber}</p>
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
                  </div>
                </div>

                {/* Criminal Information */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
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
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-600">
                        Sentence Duration
                      </label>
                      <p className="mt-1 text-gray-900 font-medium">
                        {calculateSentenceDuration(inmate.sentenceStart, inmate.sentenceEnd)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
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
                  <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                    Administrative Information
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Assigned Prison
                      </label>
                      <p className="mt-1 text-gray-900">{prisonName || "Not assigned"}</p>
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

                {/* Documents - Fixed document display */}
                {inmate.documents && inmate.documents.length > 0 && (
                  <div className="col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                      Documents & Photos
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {inmate.documents.map((doc, index) => {
                        // Ensure we have proper URL access
                        const documentUrl = typeof doc === 'string' ? doc : doc.url;
                        const isImage = typeof doc === 'string' ? 
                          doc.match(/\.(jpeg|jpg|gif|png)$/i) : 
                          (doc.type === 'image' || (doc.url && doc.url.match(/\.(jpeg|jpg|gif|png)$/i)));
                        
                        return (
                          <div
                            key={index}
                            className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => window.open(documentUrl, "_blank")}
                          >
                            <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                              {isImage ? (
                                <img
                                  src={documentUrl}
                                  alt={`Document ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = "https://via.placeholder.com/200?text=Image+Error";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FaFileAlt className="w-12 h-12 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="p-3 bg-white">
                              <p className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm transition-colors">
                                <FaFileAlt className="w-4 h-4" />
                                {isImage ? `View Photo ${index + 1}` : `View Document ${index + 1}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg flex justify-between items-center">
              <button
                onClick={closeModal}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors text-white"
              >
                <FaArrowLeft /> Back to List
              </button>
              
              <div className="flex gap-3">
                <PrintButton
                  inmate={inmate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md transition-colors text-white"
                  buttonContent={<><FaPrint /> Print</>}
                  title="Inmate Details Report"
                  additionalData={{
                    "Personal Information": {
                      "Full Name": `${inmate?.firstName} ${inmate?.middleName} ${inmate?.lastName}`,
                      "Registration Number": inmate.registrationNumber,
                      "Date of Birth": new Date(inmate?.dateOfBirth).toLocaleDateString(),
                      Gender: inmate?.gender,
                    },
                    "Criminal Information": {
                      Crime: inmate?.crime,
                      "Risk Level": inmate?.riskLevel,
                      "Sentence Start": new Date(inmate?.sentenceStart).toLocaleDateString(),
                      "Sentence End": new Date(inmate?.sentenceEnd).toLocaleDateString(),
                      "Sentence Duration": calculateSentenceDuration(inmate.sentenceStart, inmate.sentenceEnd),
                    },
                    "Medical Information": {
                      "Medical Conditions": inmate?.medicalConditions || "None",
                      "Special Requirements": inmate?.specialRequirements || "None",
                    },
                    "Administrative Information": {
                      "Assigned Prison": prisonName || "Not assigned",
                      "Holding Cell": inmate?.holdingCell,
                      "Arresting Officer": inmate?.arrestingOfficer,
                      "Intake Date": new Date(inmate?.intakeDate).toLocaleDateString(),
                    },
                  }}
                />
                <button
                  onClick={() => setIsTransferDialogOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors text-white"
                >
                  <FaExchangeAlt /> Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Dialog */}
      <TransferDialog
        isOpen={isTransferDialogOpen}
        onClose={() => setIsTransferDialogOpen(false)}
        inmate={inmate}
        onTransferComplete={() => {
          navigate("/woreda-dashboard/inmates");
        }}
      />
    </div>
  );
}
