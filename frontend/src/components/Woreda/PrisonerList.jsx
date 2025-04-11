import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../utils/axiosInstance";
import DataTable from "react-data-table-component";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux"; // Import useSelector for sidebar state
import {
  FaSearch,
  FaExclamationTriangle,
  FaChevronDown,
  FaChevronUp,
  FaUser,
  FaFileAlt,
  FaPhone,
  FaNotesMedical,
  FaPrint,
} from "react-icons/fa";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import TransferDialog from "./TransferDialog";
import TransferButton from "./TransferButton";

const PrisonerList = () => {
  const [prisoners, setPrisoners] = useState([]);
  const [filteredPrisoners, setFilteredPrisoners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [prisons, setPrisons] = useState([]);
  const [selectedPrison, setSelectedPrison] = useState("");
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedInmate, setSelectedInmate] = useState(null);
  const [selectedPrisonerData, setSelectedPrisonerData] = useState(null);
  const [transferReason, setTransferReason] = useState("");
  const [criticalThreshold, setCriticalThreshold] = useState(6); // 6 hours threshold
  const [urgentThreshold, setUrgentThreshold] = useState(12); // 12 hours threshold
  const [prisonError, setPrisonError] = useState(false);
  const [, setForceUpdate] = useState(0); // For forcing timer updates
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Get sidebar state from Redux
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  // Live timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setForceUpdate((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Add this useEffect for the live timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Separate useEffect for initial data fetching
  useEffect(() => {
    fetchPrisons();
    fetchPrisoners();
    if (location.state?.transferMode && location.state?.inmateId) {
      setTransferModalOpen(true);
      setSelectedInmate(location.state.inmateId);
    }
  }, [location.state]);

  // Separate useEffect for critical prisoner checks
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const criticalPrisoners = prisoners.filter(
        (prisoner) =>
          prisoner.timeRemaining <= criticalThreshold * 60 * 60 * 1000
      );

      criticalPrisoners.forEach((prisoner) => {
        const hours = Math.floor(prisoner.timeRemaining / (60 * 60 * 1000));
        // Only show notification if it hasn't been shown before
        const notificationKey = `critical-${prisoner._id}`;
        if (!localStorage.getItem(notificationKey)) {
          toast.error(
            `CRITICAL: ${prisoner.firstName} ${prisoner.lastName} has only ${hours} hours remaining!`,
            {
              position: "top-right",
              autoClose: false,
              closeOnClick: false,
              draggable: false,
              toastId: notificationKey,
            }
          );
          localStorage.setItem(notificationKey, "true");
        }
      });
    }, 60 * 1000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [criticalThreshold, prisoners]);

  const fetchPrisons = async () => {
    try {
      console.log("Fetching prisons...");
      const response = await axiosInstance.get("/prison/getall-prisons");
      console.log("Prison API response:", response);

      if (response.data?.success) {
        const prisonsList = response.data.prisons || [];
        console.log("Setting prisons:", prisonsList);

        if (prisonsList.length === 0) {
          console.log("No prisons found in the response");
          toast.warning(
            "No prisons available. Please contact the administrator."
          );
        }

        setPrisons(prisonsList);
        setPrisonError(false);
      } else {
        console.log("Prison API returned success: false");
        setPrisonError(true);
        toast.error("Failed to fetch prison list");
      }
    } catch (error) {
      console.error("Error fetching prisons:", error);
      console.error("Error details:", error.response?.data);
      setPrisonError(true);
      toast.error("Failed to fetch prison list. Please try again later.");
    }
  };

  // Add useEffect to fetch prisons when component mounts and when transfer modal opens
  useEffect(() => {
    if (transferModalOpen) {
      fetchPrisons();
    }
  }, [transferModalOpen]);

  const fetchPrisoners = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/woreda-inmate/getall-inmates");
      if (response.data?.success) {
        // Fetch all transfers
        const transfersResponse = await axiosInstance.get("/transfer/getall-transfers");
        console.log("Transfers response:", transfersResponse.data);

        // Create a map of inmate IDs to their transfer status
        const transferStatusMap = {};
        if (transfersResponse.data?.success && transfersResponse.data?.data) {
          transfersResponse.data.data.forEach(transfer => {
            transferStatusMap[transfer.inmateId] = transfer.status;
          });
        }

        const data = response.data.inmates.map((prisoner) => {
          const status = transferStatusMap[prisoner._id];
          console.log(`Processing prisoner ${prisoner._id} with status:`, status);
          return {
            ...prisoner,
            timeRemaining: calculateTimeRemaining(prisoner.intakeDate),
            transferStatus: status || "No Transfer Request",
            hasPendingTransfer: status && status.toLowerCase() === 'pending'
          };
        });

        // Filter inmates with 12 hours or less remaining time (instead of 40)
        const urgentInmates = data.filter(
          (prisoner) => prisoner.timeRemaining <= 12 * 60 * 60 * 1000
        );

        // Set both all prisoners and filtered prisoners
        setPrisoners(urgentInmates);
        setFilteredPrisoners(urgentInmates);

        // Log the data for debugging
        console.log("Urgent inmates (12h or less):", urgentInmates);
        console.log(
          "Inmates with time details:",
          urgentInmates.map((prisoner) => ({
            name: prisoner.firstName,
            timeRemaining: prisoner.timeRemaining,
            hoursRemaining: prisoner.timeRemaining / (60 * 60 * 1000),
            transferStatus: prisoner.transferStatus,
            hasPendingTransfer: prisoner.hasPendingTransfer
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching prisoners:", error);
      toast.error("Failed to fetch prisoner data");
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRemaining = (intakeDate) => {
    const intakeTime = new Date(intakeDate).getTime();
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - intakeTime;
    const remainingTime = 48 * 60 * 60 * 1000 - elapsedTime; // 48 hours minus elapsed time
    return Math.max(0, remainingTime); // Ensure no negative time
  };

  const formatTimeRemaining = (timeRemaining) => {
    const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
    const minutes = Math.floor(
      (timeRemaining % (60 * 60 * 1000)) / (60 * 1000)
    );
    const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = prisoners.filter(
      (prisoner) =>
        prisoner.firstName.toLowerCase().includes(query) ||
        prisoner.lastName.toLowerCase().includes(query) ||
        prisoner.crime.toLowerCase().includes(query)
    );
    setFilteredPrisoners(filtered);
  };

  const handleFilterUrgent = () => {
    const urgentPrisoners = prisoners.filter(
      (prisoner) => prisoner.timeRemaining <= 6 * 60 * 60 * 1000 // Less than 6 hours remaining (critical cases)
    );
    setFilteredPrisoners(urgentPrisoners);
  };

  const handleTransferClick = (prisoner) => {
    // Check if prisoner already has a pending transfer request
    if (prisoner.hasPendingTransfer) {
      toast.error("This inmate already has a pending transfer request.");
      return;
    }
    
    setSelectedInmate(prisoner._id);
    setSelectedPrisonerData(prisoner);
    setTransferModalOpen(true);
  };

  const handleTransfer = async () => {
    if (!selectedPrison || !transferReason) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const transferData = {
        inmateId: selectedInmate,
        toPrison: selectedPrison,
        reason: transferReason,
        status: "Pending",
        inmateData: {
          firstName: selectedPrisonerData.firstName,
          lastName: selectedPrisonerData.lastName,
          crime: selectedPrisonerData.crime,
          intakeDate: selectedPrisonerData.intakeDate,
          timeRemaining: selectedPrisonerData.timeRemaining,
          age: selectedPrisonerData.age,
          gender: selectedPrisonerData.gender,
          address: selectedPrisonerData.address,
          phoneNumber: selectedPrisonerData.phoneNumber,
          emergencyContact: selectedPrisonerData.emergencyContact,
          medicalConditions: selectedPrisonerData.medicalConditions,
        },
        requestDetails: {
          requestedBy: {
            role: "Woreda",
            prison: selectedPrisonerData.assignedPrison
          },
          requestDate: new Date().toISOString(),
          status: "Pending"
        }
      };

      console.log("Submitting transfer request:", transferData);
      const response = await axiosInstance.post(
        "/api/transfer/create-transfer",
        transferData
      );

      if (response.data?.success) {
        toast.success("Transfer request submitted successfully. Waiting for security staff approval.");
        setTransferModalOpen(false);
        setSelectedPrison("");
        setTransferReason("");
        setSelectedPrisonerData(null);
        // Refresh the list to show updated status
        await fetchPrisoners();
      }
    } catch (error) {
      console.error("Error creating transfer:", error);
      toast.error(
        error.response?.data?.error || "Failed to submit transfer request"
      );
    }
  };

  const getTimeStatus = (timeRemaining) => {
    const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
    if (hours <= criticalThreshold) {
      return { status: "critical", color: "text-red-600" };
    } else if (hours <= urgentThreshold) {
      return { status: "urgent", color: "text-orange-600" };
    }
    return { status: "normal", color: "text-green-600" };
  };

  const columns = [
    {
      name: "Name",
      selector: (row) => `${row.firstName} ${row.lastName}`,
      sortable: true,
      width: "200px",
    },
    {
      name: "Crime",
      selector: (row) => row.crime,
      sortable: true,
      width: "180px",
    },
    {
      name: "Transfer Status",
      selector: (row) => row.transferStatus,
      cell: (row) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            row.transferStatus === "Pending"
              ? "bg-yellow-100 text-yellow-800"
              : row.transferStatus === "Under Review"
              ? "bg-blue-100 text-blue-800"
              : row.transferStatus === "Approved"
              ? "bg-green-100 text-green-800"
              : row.transferStatus === "Rejected"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.transferStatus || "No Transfer Request"}
        </span>
      ),
      sortable: true,
      width: "150px",
    },
    {
      name: "Time Left",
      selector: (row) => row.timeRemaining,
      cell: (row) => {
        const timeStatus = getTimeStatus(row.timeRemaining);
        return (
          <div className="flex items-center gap-1">
            <span className={timeStatus.color}>
              {formatTimeRemaining(row.timeRemaining)}
            </span>
            {timeStatus.status === "critical" && (
              <FaExclamationTriangle className="text-red-500 animate-pulse" />
            )}
            {timeStatus.status === "urgent" && (
              <FaExclamationTriangle className="text-orange-500" />
            )}
          </div>
        );
      },
      sortable: true,
      width: "180px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/woreda-dashboard/inmates/${row._id}`)}
            className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="View Details"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>View</span>
          </button>
          <TransferButton
            inmate={row}
            onTransferComplete={() => {
              fetchPrisoners();
            }}
            currentPrison={row.assignedPrison}
          />
        </div>
      ),
      width: "280px",
      right: false,
      left: true,
    },
  ];

  // First, add this helper function near the top of the component
  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    return { hours: hours % 12 || 12, minutes, seconds, ampm };
  };

  const handleTransferComplete = () => {
    fetchPrisoners(); // Refresh the list after transfer
  };

  const handlePrintTransfer = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    const currentDate = new Date().toLocaleString();

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transfer Request - ${selectedPrisonerData?.firstName} ${
      selectedPrisonerData?.lastName
    }</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .field { margin-bottom: 10px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-left: 10px; }
            .transfer-details { background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            .signature-section { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; }
            .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 10px; text-align: center; }
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .transfer-details { background-color: #f8f8f8 !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Inmate Transfer Request</h1>
            <p>Generated on ${currentDate}</p>
          </div>

          <div class="section">
            <div class="section-title">Inmate Information</div>
            <div class="grid">
              <div class="field">
                <span class="label">Full Name:</span>
                <span class="value">${selectedPrisonerData?.firstName} ${
      selectedPrisonerData?.lastName
    }</span>
              </div>
              <div class="field">
                <span class="label">Age:</span>
                <span class="value">${selectedPrisonerData?.age}</span>
              </div>
              <div class="field">
                <span class="label">Gender:</span>
                <span class="value">${selectedPrisonerData?.gender}</span>
              </div>
              <div class="field">
                <span class="label">Intake Date:</span>
                <span class="value">${new Date(
                  selectedPrisonerData?.intakeDate
                ).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Criminal Information</div>
            <div class="grid">
              <div class="field">
                <span class="label">Crime:</span>
                <span class="value">${selectedPrisonerData?.crime}</span>
              </div>
              <div class="field">
                <span class="label">Case Number:</span>
                <span class="value">${
                  selectedPrisonerData?.caseNumber || "N/A"
                }</span>
              </div>
              <div class="field">
                <span class="label">Time Remaining:</span>
                <span class="value">${formatTimeRemaining(
                  selectedPrisonerData?.timeRemaining
                )}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Medical Information</div>
            <div class="grid">
              <div class="field">
                <span class="label">Medical Conditions:</span>
                <span class="value">${
                  selectedPrisonerData?.medicalConditions || "None"
                }</span>
              </div>
              <div class="field">
                <span class="label">Allergies:</span>
                <span class="value">${
                  selectedPrisonerData?.allergies || "None"
                }</span>
              </div>
            </div>
          </div>

          <div class="transfer-details">
            <div class="section-title">Transfer Details</div>
            <div class="field">
              <span class="label">Destination Prison:</span>
              <span class="value">${
                prisons.find((p) => p._id === selectedPrison)?.prison_name ||
                "Not selected"
              }</span>
            </div>
            <div class="field">
              <span class="label">Transfer Reason:</span>
              <span class="value">${transferReason || "Not specified"}</span>
            </div>
            <div class="field">
              <span class="label">Request Date:</span>
              <span class="value">${currentDate}</span>
            </div>
          </div>

          <div class="signature-section">
            <div class="signature-line">
              <p>Requesting Officer Signature</p>
              <p>Name: _______________________</p>
              <p>Date: _______________________</p>
            </div>
            <div class="signature-line">
              <p>Approving Authority Signature</p>
              <p>Name: _______________________</p>
              <p>Date: _______________________</p>
            </div>
          </div>

          <div class="footer">
            <p>This is an official transfer request document. Please maintain for records.</p>
            <p>Document ID: TR-${selectedPrisonerData?._id}-${Date.now()}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    printWindow.onload = function () {
      printWindow.print();
    };
  };

  return (
    <div className="flex">
      {/* Sidebar Spacing Fix */}
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      />

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Responsive Fixed Header */}
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex justify-between items-center transition-all duration-300 ml-2 ${
            isCollapsed
              ? "left-16 w-[calc(100%-5rem)]"
              : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold text-gray-800">
                Urgent Inmates (12h or less)
              </h3>
              <div className="flex items-center gap-4 mt-2">
                {/* Digital Clock Display */}
                <div className="bg-gray-900 rounded-lg p-3 text-white flex items-center gap-2">
                  <div className="flex items-center">
                    <span className="text-2xl font-mono">
                      {formatTime(currentTime).hours}
                    </span>
                    <span className="text-2xl font-mono animate-pulse">:</span>
                    <span className="text-2xl font-mono">
                      {formatTime(currentTime).minutes}
                    </span>
                    <span className="text-2xl font-mono animate-pulse">:</span>
                    <span className="text-2xl font-mono">
                      {formatTime(currentTime).seconds}
                    </span>
                    <span className="ml-2 text-sm font-semibold">
                      {formatTime(currentTime).ampm}
                    </span>
                  </div>
                </div>
                {/* Date Display */}
                <div className="bg-gray-100 rounded-lg p-2 flex flex-col items-center">
                  <span className="text-sm font-semibold text-gray-600">
                    {currentTime.toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                  </span>
                  <span className="text-sm text-gray-600">
                    {currentTime.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
              <span className="text-sm font-semibold text-gray-600">
                Thresholds:
              </span>
              <div className="flex items-center gap-1">
                <FaExclamationTriangle className="text-red-500" />
                <span className="text-sm text-red-600 font-semibold">
                  ≤{criticalThreshold}h
                </span>
              </div>
              <div className="flex items-center gap-1">
                <FaExclamationTriangle className="text-orange-500" />
                <span className="text-sm text-orange-600 font-semibold">
                  ≤{urgentThreshold}h
                </span>
              </div>
            </div>
          </div>
          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-64">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                onChange={handleSearch}
                placeholder="Search by name or crime"
                className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              onClick={handleFilterUrgent}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Show Critical Cases
            </button>
          </div>
        </div>

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-40">
          {/* DataTable */}
          <div className="mt-6 mx-auto max-w-7xl bg-white p-4 rounded shadow-md overflow-x-auto">
            <DataTable
              columns={columns}
              data={filteredPrisoners}
              pagination
              progressPending={loading}
              progressComponent={<p className="text-center">Loading...</p>}
              highlightOnHover
              striped
              responsive
            />
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Transfer Prisoner</DialogTitle>
            <DialogDescription>
              Review prisoner details and select the destination prison for
              transfer.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {/* Prisoner Details Section */}
            {selectedPrisonerData && (
              <div className="space-y-4">
                {/* Basic Information Section */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FaUser className="text-blue-500" />
                      Basic Information
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Time Remaining:</span>
                      <span
                        className={
                          getTimeStatus(selectedPrisonerData.timeRemaining)
                            .color
                        }
                      >
                        {formatTimeRemaining(
                          selectedPrisonerData.timeRemaining
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium ml-2">
                        {selectedPrisonerData.firstName}{" "}
                        {selectedPrisonerData.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Age:</span>
                      <span className="font-medium ml-2">
                        {selectedPrisonerData.age}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Gender:</span>
                      <span className="font-medium ml-2">
                        {selectedPrisonerData.gender}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Intake Date:</span>
                      <span className="font-medium ml-2">
                        {new Date(
                          selectedPrisonerData.intakeDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Criminal Information Section */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <FaFileAlt className="text-red-500" />
                    <h3 className="text-lg font-semibold">
                      Criminal Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Crime:</span>
                      <span className="font-medium ml-2">
                        {selectedPrisonerData.crime}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Case Number:</span>
                      <span className="font-medium ml-2">
                        {selectedPrisonerData.caseNumber || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Arrest Date:</span>
                      <span className="font-medium ml-2">
                        {selectedPrisonerData.arrestDate
                          ? new Date(
                              selectedPrisonerData.arrestDate
                            ).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Medical Information Section */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <FaNotesMedical className="text-purple-500" />
                    <h3 className="text-lg font-semibold">
                      Medical Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Medical Conditions:</span>
                      <span className="font-medium ml-2">
                        {selectedPrisonerData.medicalConditions || "None"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Allergies:</span>
                      <span className="font-medium ml-2">
                        {selectedPrisonerData.allergies || "None"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Details Section */}
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Select Prison
                </label>
                <select
                  value={selectedPrison}
                  onChange={(e) => setSelectedPrison(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                  disabled={prisonError}
                  required
                >
                  <option value="">Select a prison</option>
                  {prisons.map((prison) => (
                    <option key={prison._id} value={prison._id}>
                      {prison.prison_name}
                    </option>
                  ))}
                </select>
                {prisonError && (
                  <p className="mt-1 text-sm text-red-600">
                    Unable to load prisons. Please try again later.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Transfer Reason
                </label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                  rows="3"
                  required
                  placeholder="Enter the reason for transfer"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <button
              onClick={() => {
                setTransferModalOpen(false);
                setSelectedPrisonerData(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handlePrintTransfer}
              className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center gap-2"
              disabled={!selectedPrisonerData}
            >
              <FaPrint />
              Print Transfer
            </button>
            <button
              onClick={handleTransfer}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={prisonError || !selectedPrison || !transferReason}
            >
              Submit Transfer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add TransferDialog */}
      <TransferDialog
        isOpen={isTransferDialogOpen}
        onClose={() => {
          setIsTransferDialogOpen(false);
          setSelectedInmate(null);
        }}
        inmate={selectedInmate}
        onTransferComplete={handleTransferComplete}
      />
    </div>
  );
};

export default PrisonerList;
