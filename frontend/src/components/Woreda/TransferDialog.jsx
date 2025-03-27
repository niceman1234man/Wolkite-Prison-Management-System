import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  FaUser,
  FaFileAlt,
  FaNotesMedical,
  FaPrint,
  FaTimes,
  FaExchangeAlt,
} from "react-icons/fa";
import PrintButton from "./PrintButton";

const TransferDialog = ({
  isOpen,
  onClose,
  inmate,
  onTransferComplete,
  currentPrison,
}) => {
  const [prisons, setPrisons] = useState([]);
  const [selectedPrison, setSelectedPrison] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPrisonName, setSelectedPrisonName] = useState("");

  useEffect(() => {
    fetchPrisons();
  }, []);

  const fetchPrisons = async () => {
    try {
      const response = await axiosInstance.get("/prison/getall-prisons");
      if (response.data?.success) {
        // Filter out the current prison from the list
        const availablePrisons = (response.data.prisons || []).filter(
          (prison) => prison._id !== currentPrison && prison.status === "Active"
        );
        setPrisons(availablePrisons);
      }
    } catch (error) {
      console.error("Error fetching prisons:", error);
      toast.error("Failed to fetch available prisons");
    }
  };

  const handlePrisonChange = (e) => {
    const prisonId = e.target.value;
    const selectedPrisonData = prisons.find((p) => p._id === prisonId);

    setSelectedPrison(prisonId);
    setSelectedPrisonName(
      selectedPrisonData ? selectedPrisonData.prison_name : ""
    );

    // Reset transfer reason when prison changes
    if (!prisonId) {
      setTransferReason("");
    }
  };

  const handleTransfer = async () => {
    if (!selectedPrison || !transferReason) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (selectedPrison === currentPrison) {
      toast.error("Cannot transfer to the same prison");
      return;
    }

    setLoading(true);
    try {
      const transferData = {
        inmateId: inmate._id,
        fromPrison: currentPrison || inmate?.assignedPrison,
        toPrison: selectedPrison,
        reason: transferReason.trim(),
        status: "Pending",
        inmateData: {
          firstName: inmate.firstName,
          lastName: inmate.lastName,
          middleName: inmate.middleName,
          dateOfBirth: inmate.dateOfBirth,
          gender: inmate.gender,
          crime: inmate.crime,
          sentenceStart: inmate.sentenceStart,
          sentenceEnd: inmate.sentenceEnd,
          paroleEligibility: inmate.paroleEligibility,
          medicalConditions: inmate.medicalConditions,
          riskLevel: inmate.riskLevel,
          specialRequirements: inmate.specialRequirements,
          intakeDate: inmate.intakeDate,
          arrestingOfficer: inmate.arrestingOfficer,
          holdingCell: inmate.holdingCell,
          documents: inmate.documents,
          photo: inmate.documents?.[0] || null,
        },
        requestDetails: {
          requestDate: new Date().toISOString(),
          requestedBy: {
            role: "woreda",
            prison: currentPrison,
          },
          status: "Pending",
          securityReview: {
            status: "Pending",
            reviewDate: null,
            reviewedBy: null,
            rejectionReason: null,
          },
        },
      };

      console.log("Submitting transfer request:", transferData);

      const response = await axiosInstance.post(
        "/transfer-requests/create",
        transferData
      );

      if (response.data?.success) {
        toast.success("Transfer request submitted successfully");
        onClose();
        setSelectedPrison("");
        setTransferReason("");
        if (onTransferComplete) onTransferComplete();
      } else {
        throw new Error(
          response.data?.message || "Failed to submit transfer request"
        );
      }
    } catch (error) {
      console.error("Transfer request error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit transfer request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Transfer Prisoner</DialogTitle>
          <DialogDescription>
            Review prisoner details and select the destination prison for
            transfer.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {inmate && (
            <div className="space-y-4">
              {/* Header with Photo */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative w-48 h-48">
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
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      Transfer Request for {inmate?.firstName}{" "}
                      {inmate?.lastName}
                    </h2>
                    <p className="text-gray-600">
                      Current Prison:{" "}
                      {currentPrison ||
                        inmate?.assignedPrison ||
                        "Not Assigned"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              {/* Transfer Form */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Transfer Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Destination Prison
                    </label>
                    <select
                      value={selectedPrison}
                      onChange={handlePrisonChange}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value="">Select a prison</option>
                      {prisons.map((prison) => (
                        <option key={prison._id} value={prison._id}>
                          {prison.prison_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transfer Reason
                    </label>
                    <textarea
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      disabled={loading}
                      placeholder="Enter reason for transfer..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          <PrintButton
            inmate={inmate}
            title="Transfer Request"
            additionalData={{
              "Transfer Details": {
                "From Prison": currentPrison || inmate?.assignedPrison,
                "To Prison": selectedPrisonName,
                "Transfer Reason": transferReason,
                Status: "Pending",
              },
              "Inmate Information": {
                "Full Name": `${inmate?.firstName} ${inmate?.middleName} ${inmate?.lastName}`,
                Gender: inmate?.gender,
                Age: inmate?.age,
                "Current Status": inmate?.status,
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
            }}
          />
          <button
            onClick={handleTransfer}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <FaExchangeAlt className="mr-2 text-sm" />
            {loading ? "Submitting..." : "Submit Transfer"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransferDialog;
