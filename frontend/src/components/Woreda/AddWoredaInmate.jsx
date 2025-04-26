import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FaSearch,
  FaExclamationTriangle,
  FaUser,
  FaFileAlt,
  FaPhone,
  FaNotesMedical,
  FaChevronDown,
  FaChevronUp,
  FaPrint,
  FaTrash,
  FaSignOutAlt
} from "react-icons/fa";
import TransferButton from "./TransferButton";

export default function AddWoredaInmate() {
  const [prisons, setPrisons] = useState([]);
  const [inmates, setInmates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredInmates, setFilteredInmates] = useState([]);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [, setForceUpdate] = useState(0); // For forcing timer updates
  const [prisonerData, setPrisonerData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "male",
    crime: "",
    sentenceStart: "",
    sentenceEnd: "",
    paroleEligibility: false,
    medicalConditions: "",
    riskLevel: "Low",
    specialRequirements: "",
    intakeDate: new Date().toISOString().split("T")[0],
    arrestingOfficer: "",
    holdingCell: "",
    assignedPrison: "",
    documents: [],
  });
  
  // Add validation state
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [transferFilter, setTransferFilter] = useState("all"); // "all", "local", "transferred", "not-approved"
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [inmateToDelete, setInmateToDelete] = useState(null);
  
  // Transfer modal state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedInmate, setSelectedInmate] = useState(null);
  const [selectedPrison, setSelectedPrison] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [prisonError, setPrisonError] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    criminal: false,
    contact: false,
    medical: false,
  });

  // Add a loading state specific to deleting
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Release modal state
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [inmateToRelease, setInmateToRelease] = useState(null);
  const [releaseReason, setReleaseReason] = useState("");
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [customReleaseReason, setCustomReleaseReason] = useState(""); // Add a separate state for custom reason

  const navigate = useNavigate();

  // Live timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setForceUpdate((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchPrisons();
    fetchInmates();
  }, []);

  // Create state to store prison mapping
  const [prisonMap, setPrisonMap] = useState({});

  const fetchPrisons = async () => {
    try {
      const response = await axiosInstance.get("/prison/getall-prisons");
      if (response.data?.success) {
        const prisons = response.data.prisons || [];
        setPrisons(prisons);
        
        // Create a mapping of prison IDs to names for quick lookup
        const prisonIdToName = {};
        prisons.forEach(prison => {
          prisonIdToName[prison._id] = prison.prison_name;
        });
        setPrisonMap(prisonIdToName);
      }
    } catch (error) {
      toast.error("Failed to fetch prison data");
    }
  };

  // Calculate time remaining within first 48 hours of intake
  const calculateTimeRemaining = (intakeDate) => {
    if (!intakeDate) return 0;
    
    const intakeTime = new Date(intakeDate).getTime();
    const currentTime = new Date().getTime();
    
    // Calculate elapsed time since intake
    const elapsedTime = currentTime - intakeTime;
    
    // Calculate how much time is left in the 48-hour window
    const remainingTime = 48 * 60 * 60 * 1000 - elapsedTime; // 48 hours minus elapsed time
    
    // Return 0 if the 48-hour window has passed, otherwise return remaining time
    return Math.max(0, remainingTime);
  };

  const formatTimeRemaining = (remainingTime) => {
    if (remainingTime <= 0) {
      return "Time expired";
    }
    
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Update the fetchInmates function to remove console.logs and improve error handling
  const fetchInmates = async () => {
    try {
      setLoading(true);
      
      // Fetch all transfers
      const transferResponse = await axiosInstance.get("/transfer/getall-transfers");
      const transfersRaw = transferResponse.data?.data || [];
      
      // Normalize and process the transfers with clear logging
      console.log(`Fetched ${transfersRaw.length} total transfers`);
      
      // Normalize transfer statuses for consistent handling
      const transfers = transfersRaw.map(transfer => {
        // For consistent status handling, ensure all status values follow the same pattern
        let normalizedStatus = (transfer.status?.toLowerCase?.() || 'pending').trim();
        let displayStatus = transfer.status || 'Pending';
        
        // Handle all possible status variations
        if (normalizedStatus.includes('cancel')) {
          normalizedStatus = 'cancelled';
          displayStatus = 'Cancelled';
        } else if (normalizedStatus.includes('approve')) {
          normalizedStatus = 'approved';
          displayStatus = 'Approved';
        } else if (normalizedStatus.includes('reject')) {
          normalizedStatus = 'rejected';
          displayStatus = 'Rejected';
        } else if (normalizedStatus.includes('review') || normalizedStatus.includes('under')) {
          normalizedStatus = 'under-review';
          displayStatus = 'Under Review';
        } else if (normalizedStatus.includes('pending')) {
          normalizedStatus = 'pending';
          displayStatus = 'Pending';
        }
        
        return {
          ...transfer,
          normalizedStatus,
          displayStatus
        };
      });
      
      // Get unique inmate IDs that have transfers
      const inmatesInTransfer = [];
      const seenInmateIds = new Set();
      
      // First, create a map of the latest transfer for each inmate
      const latestTransferMap = {};
      
      transfers.forEach(transfer => {
        const inmateId = transfer.inmateId;
        
        // Skip invalid entries
        if (!inmateId || !transfer.inmateData) return;
        
        // If we haven't seen this inmate yet, or this transfer is newer
        if (!latestTransferMap[inmateId] || 
            new Date(transfer.createdAt) > new Date(latestTransferMap[inmateId].createdAt)) {
          latestTransferMap[inmateId] = transfer;
        }
      });
      
      // Now create inmate records from the latest transfers
      Object.values(latestTransferMap).forEach(transfer => {
        const inmateId = transfer.inmateId;
        
        // Skip if we've already processed this inmate (shouldn't happen now with the map)
        if (seenInmateIds.has(inmateId)) return;
        
        seenInmateIds.add(inmateId);
        
        // Create an inmate record from the transfer data
        const inmateFromTransfer = {
          _id: inmateId,
          firstName: transfer.inmateData.firstName,
          middleName: transfer.inmateData.middleName,
          lastName: transfer.inmateData.lastName,
          gender: transfer.inmateData.gender,
          crime: transfer.inmateData.crime,
          dateOfBirth: transfer.inmateData.dateOfBirth,
          sentenceStart: transfer.inmateData.sentenceStart,
          sentenceEnd: transfer.inmateData.sentenceEnd,
          medicalConditions: transfer.inmateData.medicalConditions,
          riskLevel: transfer.inmateData.riskLevel || 'Low',
          intakeDate: transfer.inmateData.intakeDate,
          transferStatus: {
            status: transfer.displayStatus,
            normalizedStatus: transfer.normalizedStatus,
            toPrison: transfer.toPrison
          },
          transferDestination: transfer.toPrison,
          isFromTransfer: true
        };
        
        inmatesInTransfer.push(inmateFromTransfer);
      });
      
      console.log(`Found ${inmatesInTransfer.length} unique inmates from transfers`);
      
      // Fetch regular inmates
      const inmatesResponse = await axiosInstance.get("/woreda-inmate/getall-inmates");
      const regularInmates = inmatesResponse.data?.inmates || [];
      console.log(`Fetched ${regularInmates.length} regular inmates`);
      
      // Get IDs of regular inmates for deduplication
      const regularInmateIds = new Set(regularInmates.map(inmate => inmate._id));
      
      // Filter out transfer inmates already in the regular list to avoid duplicates
      const uniqueTransferInmates = inmatesInTransfer.filter(inmate => !regularInmateIds.has(inmate._id));
      console.log(`Found ${uniqueTransferInmates.length} inmates that only exist in transfer records`);
      
      // Update regular inmates with their latest transfer status
      const updatedRegularInmates = regularInmates.map(inmate => {
        // Check if this inmate has any transfers
        const latestTransfer = latestTransferMap[inmate._id];
        
        if (latestTransfer) {
          return {
            ...inmate,
            transferStatus: {
              status: latestTransfer.displayStatus,
              normalizedStatus: latestTransfer.normalizedStatus,
              toPrison: latestTransfer.toPrison
            }
          };
        }
        
        return inmate;
      });
      
      // Combine both lists
      const allInmates = [...updatedRegularInmates, ...uniqueTransferInmates];
      console.log(`Combined total: ${allInmates.length} inmates`);
      
      // Process all inmates with their transfer status
      let sno = 1;
      const formattedData = allInmates.map(inmate => {
        // Create full name
        const fullName = [inmate.firstName, inmate.middleName, inmate.lastName]
          .filter(Boolean)
          .join(" ");
          
        // Format sentence info
        const sentenceInfo = inmate.sentenceYear ? 
          `${inmate.sentenceYear} ${inmate.sentenceYear === 1 ? 'year' : 'years'}` : 
          "Not specified";
          
        // Format location data
        const location = [inmate.currentWereda, inmate.currentZone]
          .filter(Boolean)
          .join(", ");
          
        // Calculate time remaining
        const timeRemaining = calculateTimeRemaining(inmate.intakeDate);
        
        return {
          _id: inmate._id,
          firstName: inmate.firstName,
          middleName: inmate.middleName,
          lastName: inmate.lastName,
          inmate_name: fullName,
          case_type: inmate.crime || "Not specified",
          crime: inmate.crime || "Not specified",
          sentenceInfo: sentenceInfo,
          location: location,
          reason: inmate.specialRequirements,
          intakeDate: inmate.intakeDate,
          remainingTime: formatTimeRemaining(timeRemaining),
          rawRemainingTime: timeRemaining,
          timeStatus: getTimeStatus(timeRemaining),
          transferStatus: inmate.transferStatus || null,
          isFromTransfer: inmate.isFromTransfer || false,
          gender: inmate.gender || "Not specified",
          dateOfBirth: inmate.dateOfBirth,
          paroleEligibility: inmate.paroleEligibility,
          medicalConditions: inmate.medicalConditions || "None",
          riskLevel: inmate.riskLevel || "Low",
          specialRequirements: inmate.specialRequirements || "None",
          arrestingOfficer: inmate.arrestingOfficer,
          holdingCell: inmate.holdingCell,
          assignedPrison: inmate.assignedPrison,
          documents: inmate.documents || [],
          sentenceStart: inmate.sentenceStart,
          sentenceEnd: inmate.sentenceEnd,
          status: inmate.status || "Active",
          releaseDate: inmate.releaseDate,
          releaseReason: inmate.releaseReason
        };
      });
      
      // Set the data
      setInmates(formattedData);
      setTotalItems(formattedData.length);
      setFilteredInmates(formattedData);
      
      // Log status counts for verification
      const statusCounts = {};
      formattedData.forEach(inmate => {
        if (inmate.transferStatus) {
          const status = inmate.transferStatus.status;
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        } else {
          statusCounts['No Transfer'] = (statusCounts['No Transfer'] || 0) + 1;
        }
      });
      
      console.log('Inmate status counts:', statusCounts);
      
    } catch (error) {
      console.error("Error fetching inmates:", error);
      toast.error("Failed to fetch inmate data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPrisonerData((prev) => ({
      ...prev,
      [name]: name === "paroleEligibility" ? value === "true" : value,
    }));
    
    // Clear error for this field when user makes changes
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setPrisonerData((prev) => ({
      ...prev,
      documents: files,
    }));
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    const today = new Date();
    const minAge = 12; // Minimum age for an inmate
    
    // Required fields
    if (!prisonerData.firstName.trim()) errors.firstName = "First name is required";
    if (!prisonerData.middleName.trim()) errors.middleName = "Middle name is required";
    if (!prisonerData.lastName.trim()) errors.lastName = "Last name is required";
    if (!prisonerData.crime.trim()) errors.crime = "Crime is required";
    if (!prisonerData.arrestingOfficer.trim()) errors.arrestingOfficer = "Arresting officer is required";
    if (!prisonerData.holdingCell.trim()) errors.holdingCell = "Holding cell is required";
    
    // Date of birth validation
    if (!prisonerData.dateOfBirth) {
      errors.dateOfBirth = "Date of birth is required";
    } else {
      const birthDate = new Date(prisonerData.dateOfBirth);
      const ageDate = new Date(today - birthDate);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      
      if (isNaN(birthDate.getTime())) {
        errors.dateOfBirth = "Invalid date format";
      } else if (birthDate > today) {
        errors.dateOfBirth = "Date of birth cannot be in the future";
      } else if (age < minAge) {
        errors.dateOfBirth = `Inmate must be at least ${minAge} years old`;
      }
    }
    
    // Sentence dates validation
    if (!prisonerData.sentenceStart) {
      errors.sentenceStart = "Sentence start date is required";
    } else {
      const startDate = new Date(prisonerData.sentenceStart);
      if (isNaN(startDate.getTime())) {
        errors.sentenceStart = "Invalid date format";
      }
    }
    
    if (!prisonerData.sentenceEnd) {
      errors.sentenceEnd = "Sentence end date is required";
    } else {
      const endDate = new Date(prisonerData.sentenceEnd);
      const startDate = new Date(prisonerData.sentenceStart);
      
      if (isNaN(endDate.getTime())) {
        errors.sentenceEnd = "Invalid date format";
      } else if (prisonerData.sentenceStart && startDate > endDate) {
        errors.sentenceEnd = "End date must be after start date";
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      Object.entries(prisonerData).forEach(([key, value]) => {
        if (key === "documents") {
          prisonerData.documents.forEach((file) => {
            formData.append("documents", file);
          });
        } else if (key === "paroleEligibility") {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value);
        }
      });

      const response = await axiosInstance.post(
        "/woreda-inmate/register",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data?.success) {
        // If inmate was assigned to a prison, update that prison's population
        if (prisonerData.assignedPrison) {
          try {
            // Increment the prison population by 1
            const populationResponse = await axiosInstance.post("/prison/increment-population", {
              prisonId: prisonerData.assignedPrison,
              increment: 1
            });
            
            if (populationResponse.data?.success) {
              // Notify components that prison population has changed
              window.dispatchEvent(new Event('prisonPopulationChanged'));
            } else {
              console.error("Failed to update prison population:", populationResponse.data?.error);
              // Still proceed with the inmate creation
            }
          } catch (populationError) {
            console.error("Error updating prison population:", populationError);
            // Still proceed with the inmate creation
          }
        }

        toast.success("Inmate registered successfully!");
        setShowForm(false);
        fetchInmates();
        setPrisonerData({
          firstName: "",
          middleName: "",
          lastName: "",
          dateOfBirth: "",
          gender: "male",
          crime: "",
          sentenceStart: "",
          sentenceEnd: "",
          paroleEligibility: false,
          medicalConditions: "",
          riskLevel: "Low",
          specialRequirements: "",
          intakeDate: new Date().toISOString().split("T")[0],
          arrestingOfficer: "",
          holdingCell: "",
          assignedPrison: "",
          documents: [],
        });
        setFormErrors({});
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to register inmate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferClick = (inmate) => {
    setSelectedInmate(inmate);
    setTransferModalOpen(true);
  };

  const handleTransfer = async () => {
    if (!selectedPrison || !transferReason) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const transferData = {
        inmateId: selectedInmate._id,
        toPrison: selectedPrison,
        reason: transferReason,
        status: "Pending",
        inmateData: {
          firstName: selectedInmate.firstName,
          lastName: selectedInmate.lastName,
          middleName: selectedInmate.middleName,
          dateOfBirth: selectedInmate.dateOfBirth,
          gender: selectedInmate.gender,
          crime: selectedInmate.crime,
          sentenceStart: selectedInmate.sentenceStart,
          sentenceEnd: selectedInmate.sentenceEnd,
          paroleEligibility: selectedInmate.paroleEligibility,
          medicalConditions: selectedInmate.medicalConditions,
          riskLevel: selectedInmate.riskLevel,
          specialRequirements: selectedInmate.specialRequirements,
          intakeDate: selectedInmate.intakeDate,
          arrestingOfficer: selectedInmate.arrestingOfficer,
          holdingCell: selectedInmate.holdingCell,
          documents: selectedInmate.documents,
        },
      };

      const response = await axiosInstance.post(
        "/transfer/create-transfer",
        transferData
      );

      if (response.data?.success) {
        toast.success("Transfer request submitted successfully");
        setTransferModalOpen(false);
        setSelectedPrison("");
        setTransferReason("");
        setSelectedInmate(null);
        fetchInmates();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to submit transfer request"
      );
    }
  };

  const handleViewDetails = (inmateId) => {
    navigate(`/woreda-dashboard/inmates/${inmateId}`);
  };

  const getTimeStatus = (remainingTime) => {
    if (remainingTime <= 4 * 60 * 60 * 1000) {
      return {
        color: "text-red-600",
        status: "Critical",
      };
    } else if (remainingTime <= 12 * 60 * 60 * 1000) {
      return {
        color: "text-yellow-600",
        status: "Warning",
      };
    } else {
      return {
        color: "text-green-600",
        status: "Normal",
      };
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePrintTransfer = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    const currentDate = new Date().toLocaleString();

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transfer Request - ${selectedInmate?.firstName} ${
      selectedInmate?.lastName
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
                <span class="value">${selectedInmate?.firstName} ${
      selectedInmate?.lastName
    }</span>
              </div>
              <div class="field">
                <span class="label">Age:</span>
                <span class="value">${selectedInmate?.age}</span>
              </div>
              <div class="field">
                <span class="label">Gender:</span>
                <span class="value">${selectedInmate?.gender}</span>
              </div>
              <div class="field">
                <span class="label">Intake Date:</span>
                <span class="value">${new Date(
                  selectedInmate?.intakeDate
                ).toLocaleDateString()}</span>
              </div>
            </div>
        </div>

          <div class="section">
            <div class="section-title">Criminal Information</div>
            <div class="grid">
              <div class="field">
                <span class="label">Crime:</span>
                <span class="value">${selectedInmate?.crime}</span>
              </div>
              <div class="field">
                <span class="label">Case Number:</span>
                <span class="value">${
                  selectedInmate?.caseNumber || "N/A"
                }</span>
              </div>
              <div class="field">
                <span class="label">Time Remaining:</span>
                <span class="value">${formatTimeRemaining(
                  selectedInmate?.timeRemaining
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
                  selectedInmate?.medicalConditions || "None"
                }</span>
              </div>
              <div class="field">
                <span class="label">Allergies:</span>
                <span class="value">${
                  selectedInmate?.allergies || "None"
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
            <p>Document ID: TR-${selectedInmate?._id}-${Date.now()}</p>
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

  // Handle search function
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on new search
  };
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInmates.slice(indexOfFirstItem, indexOfLastItem);
  
  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };
  
  // Get status color utility function
  const getStatusColor = (status) => {
    switch (status) {
      case "Critical":
        return "bg-red-100 text-red-800";
      case "Warning":
        return "bg-yellow-100 text-yellow-800";
      case "Pending Transfer":
        return "bg-blue-100 text-blue-800";
      case "Transfer Approved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle delete button click
  const handleDeleteClick = (inmate) => {
    // Check if inmate can be deleted
    if (!canDeleteInmate(inmate)) {
      toast.error("Cannot delete inmates with approved transfers. Please contact the administrator.");
      return;
    }
    
    setInmateToDelete(inmate);
    setDeleteConfirmOpen(true);
  };
  
  // Utility function to ensure proper ID format - sometimes MongoDB IDs can have unexpected formats
  const ensureProperIdFormat = (id) => {
    if (!id) return '';
    
    // Remove any unwanted characters that might be in the ID
    return id.toString().replace(/[^a-zA-Z0-9]/g, '');
  };

  // Handle delete inmate confirmation with special handling for transferred inmates
  const handleDeleteConfirm = async () => {
    if (!inmateToDelete) return;
    
    try {
      setLoading(true);
      setDeleteLoading(true);
      
      // Check if inmate has a transfer status of "Approved"
      if (inmateToDelete.transferStatus && 
          getNormalizedStatus(inmateToDelete.transferStatus).includes("approve")) {
        toast.error("Cannot delete inmates with approved transfers. Please contact the administrator.");
        setDeleteConfirmOpen(false);
        setInmateToDelete(null);
        setLoading(false);
        setDeleteLoading(false);
        return;
      }
      
      // Make sure we have a valid ID
      const inmateId = inmateToDelete._id;
      if (!inmateId) {
        toast.error("Invalid inmate ID. Cannot process delete request.");
        setDeleteConfirmOpen(false);
        setInmateToDelete(null);
        setLoading(false);
        setDeleteLoading(false);
        return;
      }
      
      console.log(`Attempting to delete inmate with ID: ${inmateId}`);
      console.log("Inmate details:", inmateToDelete);
      console.log("Transfer status:", inmateToDelete.transferStatus);
      console.log("Is from transfer:", inmateToDelete.isFromTransfer);
      
      // Check if this inmate only exists in the transfer collection
      if (inmateToDelete.isFromTransfer) {
        console.log("This inmate exists only in the transfer collection");
        
        // NEW CODE: Check if the transfer is rejected, cancelled, or pending
        const status = getNormalizedStatus(inmateToDelete.transferStatus);
        if (status.includes('reject') || status.includes('cancel') || status.includes('pending')) {
          // For rejected, cancelled, or pending transfers, we can delete from the transfer collection
          try {
            // First, find the transfer record by inmate ID
            const transfersResponse = await axiosInstance.get('/transfer/getall-transfers');
            const transfers = transfersResponse.data?.data || [];
            
            console.log(`Found ${transfers.length} total transfers in the system`);
            console.log(`Looking for transfer with inmate ID: ${inmateId}`);
            console.log(`Inmate details for matching: `, {
              firstName: inmateToDelete.firstName,
              lastName: inmateToDelete.lastName
            });
            
            // Find the transfer with the matching inmate ID
            const transfer = transfers.find(t => {
              // Check if this inmate is the matching one by comparing various ID fields
              // The inmateId in the transfer could be either a string or an object reference
              const transferInmateId = typeof t.inmateId === 'string' 
                ? t.inmateId 
                : (t.inmateId?._id || '');
                
              // For transfer records created with actual inmate data, we might need to look at other identifiers
              const inmateDataMatches = t.inmateData && 
                t.inmateData.firstName === inmateToDelete.firstName && 
                t.inmateData.lastName === inmateToDelete.lastName;
                
              return transferInmateId === inmateId || inmateDataMatches;
            });
            
            if (!transfer) {
              console.log("Could not find matching transfer in the system");
              toast.error("Could not find the transfer record for this inmate");
              fetchInmates();
              return;
            }
            
            console.log("Found matching transfer:", transfer);
            console.log("Deleting transfer with ID:", transfer._id);
            
            // Call the transfer deletion endpoint with the transfer ID
            const response = await axiosInstance.delete(`/transfer/delete-transfer/${transfer._id}`);
            
            if (response.data?.success) {
              toast.success("Transfer record deleted successfully");
              
              // Remove the inmate from the UI
              const filteredInmates = inmates.filter(inmate => inmate._id !== inmateToDelete._id);
              setInmates(filteredInmates);
              setFilteredInmates(filteredInmates);
              setTotalItems(filteredInmates.length);
            } else {
              toast.info(response.data?.message || "Delete request was processed but returned an unexpected response");
              fetchInmates(); // Refresh the list
            }
          } catch (error) {
            console.error("Transfer delete API error:", error.message);
            toast.error(`Failed to delete transfer record: ${error.message || "Unknown error"}`);
            fetchInmates(); // Refresh the list
          }
        } else {
          // For active transfers, show the original message
          toast.info("This inmate exists in the transfer system and cannot be deleted directly. The transfer must be cancelled first.");
        }
        
        setDeleteConfirmOpen(false);
        setInmateToDelete(null);
        setLoading(false);
        setDeleteLoading(false);
        return;
      }
      
      // Use the exact endpoint path from the backend routes
      try {
        const response = await axiosInstance.delete(`/woreda-inmate/delete-inmate/${inmateId}`);
        
        if (response.data?.success) {
          toast.success("Inmate deleted and archived successfully. You can access it in the Archive System.");
          fetchInmates(); // Refresh the inmate list
        } else if (response.data?.error === "Inmate not found") {
          toast.info("Inmate was already removed from the system");
          fetchInmates(); // Refresh the list
        } else {
          toast.info(response.data?.message || "Delete request was processed but returned an unexpected response");
          fetchInmates(); // Refresh the list
        }
      } catch (error) {
        console.error("Delete API error:", error.message);
        
        // Check if this is a "not found" error - which seems to be happening for inmates with transfers
        if (error.response?.status === 404) {
          if (error.response?.data?.error === "Inmate not found" && inmateToDelete.transferStatus) {
            console.log("Inmate not found in woreda-inmate collection but has transfer status. Handling as special case.");
            
            // Just hide the inmate from UI for now
            const filteredInmates = inmates.filter(inmate => inmate._id !== inmateToDelete._id);
            setInmates(filteredInmates);
            setFilteredInmates(filteredInmates);
            setTotalItems(filteredInmates.length);
            
            toast.warning(
              "This inmate has a transfer record but cannot be found in the main inmates database. " +
              "It has been hidden from your view. Please contact the administrator to fix this data inconsistency.",
              { autoClose: 5000 }
            );
          } else {
            toast.error("Unable to delete this inmate. The record may no longer exist.");
          }
        } else {
          toast.error(`Failed to delete inmate: ${error.message || "Unknown error"}`);
        }
        
        fetchInmates(); // Refresh the list anyway
      }
    } finally {
      setDeleteConfirmOpen(false);
      setInmateToDelete(null);
      setLoading(false);
      setDeleteLoading(false);
    }
  };
  
  // Cancel delete
  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setInmateToDelete(null);
  };

  // Add a helper function to normalize transfer status consistently
  const getNormalizedStatus = (transferStatus) => {
    if (!transferStatus) return '';
    
    // If it's already an object with normalized status
    if (transferStatus.normalizedStatus) {
      return transferStatus.normalizedStatus;
    }
    
    // If it's an object with status
    if (transferStatus.status) {
      const status = transferStatus.status.toLowerCase();
      
      // Handle standard status variations
      if (status.includes('approve')) return 'approved';
      if (status.includes('reject')) return 'rejected';
      if (status.includes('cancel')) return 'cancelled';
      if (status.includes('review') || status.includes('under')) return 'under-review';
      if (status.includes('pending')) return 'pending';
      
      return status;
    }
    
    // If it's a string
    if (typeof transferStatus === 'string') {
      const status = transferStatus.toLowerCase();
      
      // Handle standard status variations
      if (status.includes('approve')) return 'approved';
      if (status.includes('reject')) return 'rejected';
      if (status.includes('cancel')) return 'cancelled';
      if (status.includes('review') || status.includes('under')) return 'under-review';
      if (status.includes('pending')) return 'pending';
      
      return status;
    }
    
    return '';
  };
  
  // Apply filters and search with pagination
  const applyFilters = () => {
    let filtered = inmates;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
      (inmate) =>
          inmate.inmate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inmate.crime.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inmate.case_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (inmate.reason && inmate.reason.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply transfer status filter
    if (transferFilter !== "all") {
      filtered = filtered.filter(inmate => {
        // For "no-transfer" filter, we want inmates without transfer status
        if (transferFilter === "no-transfer") {
          return !inmate.transferStatus;
        }
        
        // For all other filters, we need a transfer status
        if (!inmate.transferStatus) {
          return false;
        }
        
        // Get normalized status for consistent comparison
        const normalizedStatus = getNormalizedStatus(inmate.transferStatus);
        
        // Match based on filter type
        switch(transferFilter) {
          case "approved":
            return normalizedStatus.includes('approve');
          case "rejected":
            return normalizedStatus.includes('reject');
          case "cancelled":
            // Check for all variations: cancel, cancelled, canceled
            return normalizedStatus.includes('cancel');
          case "pending":
            return normalizedStatus.includes('pending');
          case "under-review":
            return normalizedStatus.includes('review') || normalizedStatus.includes('under');
          default:
            return true;
        }
      });
    }
    
    setTotalItems(filtered.length);
    setFilteredInmates(filtered);
  };
  
  // Effect to apply filters when search term or transfer filter changes
  useEffect(() => {
    if (inmates.length > 0) {
      applyFilters();
    }
  }, [searchTerm, transferFilter, inmates]);

  // Handle transfer filter change
  const handleTransferFilterChange = (value) => {
    setTransferFilter(value);
    setCurrentPage(1); // Reset to first page
  };

  // Add a helper function to calculate sentence duration
  const calculateSentenceDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "Invalid dates";
      }
      
      // Calculate difference in milliseconds
      const diffTime = Math.abs(end - start);
      
      // Calculate years
      const years = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
      
      // Calculate months
      const months = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
      
      // Calculate days
      const days = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
      
      // Build result string
      let result = [];
      if (years > 0) {
        result.push(`${years} ${years === 1 ? 'year' : 'years'}`);
      }
      if (months > 0) {
        result.push(`${months} ${months === 1 ? 'month' : 'months'}`);
      }
      if (days > 0 || (years === 0 && months === 0)) {
        result.push(`${days} ${days === 1 ? 'day' : 'days'}`);
      }
      
      return result.join(', ');
    } catch (e) {
      console.error("Error calculating sentence duration:", e);
      return "Error";
    }
  };

  // Helper function for getting status color classes
  const getStatusColorClass = (transferStatus, isBadge = false) => {
    if (!transferStatus) {
      return isBadge ? 'bg-gray-100 text-gray-800' : 'bg-gray-500';
    }
    
    // Get the normalized status
    const normalizedStatus = getNormalizedStatus(transferStatus);
    
    if (normalizedStatus.includes('approve')) {
      return isBadge ? 'bg-green-100 text-green-800' : 'bg-green-500';
    } else if (normalizedStatus.includes('reject')) {
      return isBadge ? 'bg-red-100 text-red-800' : 'bg-red-500';
    } else if (normalizedStatus.includes('cancel')) {
      return isBadge ? 'bg-gray-100 text-gray-800' : 'bg-gray-500';
    } else if (normalizedStatus.includes('review')) {
      return isBadge ? 'bg-blue-100 text-blue-800' : 'bg-blue-500';
    } else if (normalizedStatus.includes('pending')) {
      return isBadge ? 'bg-yellow-100 text-yellow-800' : 'bg-yellow-500';
    }

    return isBadge ? 'bg-blue-100 text-blue-800' : 'bg-blue-500';
  };

  // Helper function to check if inmate can be deleted
  const canDeleteInmate = (inmate) => {
    if (!inmate) return false;
    
    // Only prevent deletion if inmate has an approved or under-review transfer
    if (inmate.transferStatus) {
      const normalizedStatus = getNormalizedStatus(inmate.transferStatus);
      // Block deletion for approved and under-review transfers
      if (normalizedStatus.includes("approve") || normalizedStatus.includes("review")) {
      return false;
      }
      // Allow deletion for rejected, cancelled, and pending transfers
      return true;
    }
    
    // Always allow deletion for inmates without transfer status
    return true;
  };

  // Helper function to check if inmate can be released
  const canReleaseInmate = (inmate) => {
    if (!inmate) return false;
    
    // Don't allow release for already released inmates
    if (inmate.status === "Released") return false;
    
    // Check if inmate is from the transfer list but not in the inmates database
    if (inmate.isFromTransfer && !inmate._id.includes('woreda')) {
      return false; // Cannot release inmates that only exist in transfer records
    }
    
    // Don't allow release for inmates with approved or under-review transfers
    if (inmate.transferStatus) {
      const normalizedStatus = getNormalizedStatus(inmate.transferStatus);
      // Block ONLY for approved and under-review transfers
      if (normalizedStatus.includes("approve") || normalizedStatus.includes("review")) {
        return false;
      }
      // Allow release for cancelled, rejected, and pending transfers
    }
    
    // Default: allow release
    return true;
  };

  // Handle release button click
  const handleReleaseClick = (inmate) => {
    // Check if inmate can be released
    if (!canReleaseInmate(inmate)) {
      if (inmate.status === "Released") {
        toast.info("This inmate has already been released.");
      } else {
        toast.error("Cannot release inmates with approved or under review transfers.");
      }
      return;
    }
    
    setInmateToRelease(inmate);
    setReleaseReason("");
    setReleaseModalOpen(true);
  };
  
  // Handle release inmate confirmation
  const handleReleaseConfirm = async () => {
    if (!inmateToRelease) return;
    
    try {
      setReleaseLoading(true);
      
      const inmateId = inmateToRelease._id;
      // Use either the selected reason or custom reason
      const finalReleaseReason = releaseReason === "Other" ? customReleaseReason : releaseReason;
      console.log(`Attempting to release inmate with ID: ${inmateId}, reason: ${finalReleaseReason}`);
      
      // If the inmate only exists in transfer records, not in the database
      if (inmateToRelease.isFromTransfer && !inmateId.includes('woreda')) {
        toast.error("Cannot release this inmate as they only exist in transfer records");
        return;
      }
      
      const response = await axiosInstance.put(
        `/woreda-inmate/release-inmate/${inmateId}`,
        { releaseReason: finalReleaseReason }
      );
      
      if (response.data?.success) {
        toast.success("Inmate released successfully");
        fetchInmates(); // Refresh the inmate list
      } else {
        toast.error(response.data?.error || "Failed to release inmate");
      }
    } catch (error) {
      console.error("Release API error:", error);
      
      if (error.response?.status === 404) {
        toast.error("This inmate could not be found in the database");
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.error || "Cannot release this inmate");
      } else {
        toast.error("An unexpected error occurred during release");
      }
    } finally {
      setReleaseLoading(false);
      setReleaseModalOpen(false);
      setInmateToRelease(null);
      setReleaseReason("");
      setCustomReleaseReason("");
    }
  };
  
  // Cancel release
  const handleReleaseCancel = () => {
    setReleaseModalOpen(false);
    setInmateToRelease(null);
    setReleaseReason("");
    setCustomReleaseReason("");
  };

  return (
    <div className="flex mt-10">
      {/* Sidebar Spacing Fix */}
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      />

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Fixed Header */}
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-50 flex justify-between items-center transition-all duration-300 ${
            isCollapsed
              ? "left-16 w-[calc(100%-4rem)]"
              : "left-64 w-[calc(100%-16rem)]"
          }`}
        >
          <h1 className="text-2xl font-bold text-gray-800">Woreda Inmates</h1>
          <div className="flex flex-col md:flex-row justify-end items-center gap-4">
            <div className="relative w-full md:w-64">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                onChange={handleSearch}
                placeholder="Search by name or crime"
                className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <select
                id="transfer-filter"
                value={transferFilter}
                onChange={(e) => handleTransferFilterChange(e.target.value)}
                className="form-select border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Inmates</option>
                <option value="approved">Approved Transfers</option>
                <option value="rejected">Rejected Transfers</option>
                <option value="pending">Pending Transfers</option>
                <option value="under-review">Under Review</option>
                <option value="cancelled">Cancelled Transfers</option>
                <option value="no-transfer">No Transfer Record</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label htmlFor="items-per-page" className="text-sm font-medium text-gray-600">
                Show:
              </label>
              <select
                id="items-per-page"
                className="form-select border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={1000}>All</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add New Inmate
            </button>
          </div>
        </div>

        {/* Push content down to prevent overlap */}
        <div className="mt-24">
          {/* Remove the summary bar with loading indicator since it's empty most of the time */}
          
          {/* Inmates Table - Improved for better responsiveness */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden w-full">
            {loading && (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading inmates...</p>
              </div>
            )}
            
            <div className="w-full" style={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>
              <table className="w-full table-fixed divide-y divide-gray-200 shadow-sm border border-gray-200">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-800 text-white sticky top-0 z-10 shadow-md">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[40px]">
                      #
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[35%]">
                      Name
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[22%] sm:w-[18%]">
                      Crime
                    </th>
                    <th className="hidden md:table-cell px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[25%]">
                      Transfer Status
                    </th>
                    <th className="hidden lg:table-cell px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[13%]">
                      Risk Level
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-[12%]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((inmate, index) => (
                    <tr 
                      key={inmate._id} 
                      className="hover:bg-blue-50 transition-colors duration-150 group cursor-pointer"
                      onClick={() => handleViewDetails(inmate._id)}
                    >
                      <td className="px-2 sm:px-4 py-3 sm:py-4 group-hover:bg-blue-100 transition-colors duration-150">
                        <div className="text-sm font-medium text-gray-900 bg-gray-100 group-hover:bg-blue-200 transition-colors duration-150 h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center">
                          {indexOfFirstItem + index + 1}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 group-hover:bg-blue-100 transition-colors duration-150">
                        <div className="flex items-center">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 mr-2 sm:mr-3 overflow-hidden rounded-full ring-2 ring-transparent group-hover:ring-blue-400 transition-all duration-150">
                            <div className="h-full w-full rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-200">
                              <FaUser className={inmate.gender === 'female' ? "text-pink-500" : "text-blue-500"} />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap items-center">
                                <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors duration-150 text-sm sm:text-base truncate w-full">
                                  {inmate.firstName} {inmate.lastName}
                                  <div className="inline-flex items-center mt-1">
                                    {inmate.status === "Released" && (
                                      <span className="mr-1 px-1 sm:px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">
                                        Released
                                      </span>
                                    )}
                                    {inmate.transferStatus && (
                                      <span className={`ml-1 sm:ml-2 inline-flex h-2 w-2 rounded-full ${getStatusColorClass(inmate.transferStatus)}`} />
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {inmate.gender}, ID: {inmate._id.slice(-6).toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 group-hover:bg-blue-100 transition-colors duration-150">
                        <div className="text-sm text-gray-900 font-medium group-hover:text-blue-700 transition-colors duration-150 break-words line-clamp-2">
                          {inmate.crime}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-2 sm:px-4 py-3 sm:py-4 group-hover:bg-blue-100 transition-colors duration-150">
                        <div className="text-sm">
                          {inmate.transferStatus ? (
                            <div className="flex flex-col">
                              <span className={`px-1 sm:px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm ${getStatusColorClass(inmate.transferStatus, true)}`}>
                                {inmate.transferStatus.status || "Unknown"}
                              </span>
                              {inmate.transferStatus.toPrison && (
                                <span className="text-xs text-gray-500 mt-1 break-words line-clamp-1">
                                  To: {typeof inmate.transferStatus.toPrison === 'string' ? 
                                    prisonMap[inmate.transferStatus.toPrison] || inmate.transferStatus.toPrison : 
                                    inmate.transferStatus.toPrison.name || 'Unknown Prison'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-1 sm:px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 shadow-sm">
                              No Transfer
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-2 sm:px-4 py-3 sm:py-4 group-hover:bg-blue-100 transition-colors duration-150">
                        <span className={`px-1 sm:px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full group-hover:opacity-90 shadow-sm transition-all duration-150 ${
                          inmate.riskLevel === 'High' 
                            ? 'bg-red-100 text-red-800 group-hover:bg-red-200' 
                            : inmate.riskLevel === 'Medium'
                            ? 'bg-yellow-100 text-yellow-800 group-hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 group-hover:bg-green-200'
                        }`}>
                          {inmate.riskLevel || 'Low'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm font-medium text-center group-hover:bg-blue-100 transition-colors duration-150" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(inmate._id);
                            }}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-1 sm:p-1.5 rounded-full transition-all duration-150 hover:shadow-md transform hover:-translate-y-1"
                            title="View Details"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3 sm:h-3.5 sm:w-3.5"
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
                          </button>
                          <div onClick={(e) => e.stopPropagation()}>
                            <TransferButton
                              inmate={inmate}
                              onTransferComplete={handleTransfer}
                              currentPrison={inmate.assignedPrison}
                              prisonMap={prisonMap}
                            />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReleaseClick(inmate);
                            }}
                            className={`${canReleaseInmate(inmate) 
                              ? "text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100" 
                              : "text-gray-400 bg-gray-50 cursor-not-allowed"} 
                              p-1 sm:p-1.5 rounded-full transition-all duration-150 hover:shadow-md transform hover:-translate-y-1 relative`}
                            title={
                              inmate.status === "Released" 
                                ? "Inmate already released" 
                                : inmate.isFromTransfer && !inmate._id.includes('woreda')
                                ? "Cannot release inmates that only exist in transfer records"
                                : inmate.transferStatus && (getNormalizedStatus(inmate.transferStatus).includes("approve") || getNormalizedStatus(inmate.transferStatus).includes("review"))
                                ? "Cannot release inmate with approved or under review transfer"
                                : "Release Inmate"
                            }
                            disabled={!canReleaseInmate(inmate) || releaseLoading}
                          >
                            {releaseLoading && inmateToRelease?._id === inmate._id ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-green-50 rounded-full">
                                <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            ) : (
                              <FaSignOutAlt className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(inmate);
                            }}
                            className={`${canDeleteInmate(inmate) 
                              ? "text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100" 
                              : "text-gray-400 bg-gray-50 cursor-not-allowed"} 
                              p-1 sm:p-1.5 rounded-full transition-all duration-150 hover:shadow-md transform hover:-translate-y-1 relative`}
                            title={canDeleteInmate(inmate) ? "Delete Inmate" : "Cannot delete approved transfers"}
                            disabled={!canDeleteInmate(inmate) || deleteLoading}
                          >
                            {deleteLoading && inmateToDelete?._id === inmate._id ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-full">
                                <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            ) : (
                              <FaTrash className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {currentItems.length === 0 && !loading && (
                    <tr>
                      <td colSpan="6" className="px-4 py-10 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <FaExclamationTriangle className="h-10 w-10 text-gray-300" />
                          <p className="text-lg font-medium">No inmates found</p>
                          <p className="text-sm">{searchTerm ? "Try a different search term." : "Add inmates using the button above."}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls - Updated with proper pagination */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <div className="mb-4 sm:mb-0 flex items-center">
                  <p className="text-sm text-gray-700">
                    Showing
                    <span className="font-medium mx-1">
                      {filteredInmates.length > 0 ? indexOfFirstItem + 1 : 0}
                    </span>
                    to
                    <span className="font-medium mx-1">
                      {Math.min(indexOfLastItem, filteredInmates.length)}
                    </span>
                    of
                    <span className="font-medium mx-1">{totalItems}</span>
                    results
                  </p>
                </div>
                
                {/* Pagination buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      currentPage === 1
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    &laquo;
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      currentPage === 1
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    &lsaquo;
                  </button>
                  
                  {/* Page numbers */}
                  {[...Array(Math.min(5, Math.ceil(totalItems / itemsPerPage)))].map((_, idx) => {
                    // Calculate page number based on current position
                    let pageNum;
                    const totalPages = Math.ceil(totalItems / itemsPerPage);
                    
                    if (totalPages <= 5) {
                      // If 5 or fewer pages, show all page numbers
                      pageNum = idx + 1;
                    } else if (currentPage <= 3) {
                      // Near the start
                      pageNum = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      // Near the end
                      pageNum = totalPages - 4 + idx;
                    } else {
                      // In the middle
                      pageNum = currentPage - 2 + idx;
                    }
                    
                    // Only render if pageNum is valid
                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded ${
                            currentPage === pageNum
                              ? "bg-blue-800 text-white"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === Math.ceil(totalItems / itemsPerPage)}
                    className={`px-3 py-1 rounded ${
                      currentPage === Math.ceil(totalItems / itemsPerPage)
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    &rsaquo;
                  </button>
                  <button
                    onClick={() => handlePageChange(Math.ceil(totalItems / itemsPerPage))}
                    disabled={currentPage === Math.ceil(totalItems / itemsPerPage)}
                    className={`px-3 py-1 rounded ${
                      currentPage === Math.ceil(totalItems / itemsPerPage)
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    &raquo;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add New Inmate Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Inmate</DialogTitle>
              <DialogDescription>
                Fill in the inmate's information below. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 [&_input]:border [&_input]:border-gray-300 [&_input]:px-3 [&_input]:py-2 [&_input]:rounded-md [&_input]:shadow-sm [&_input]:focus:border-blue-500 [&_input]:focus:ring-1 [&_input]:focus:ring-blue-500 [&_select]:border [&_select]:border-gray-300 [&_select]:px-3 [&_select]:py-2 [&_select]:rounded-md [&_select]:shadow-sm [&_select]:focus:border-blue-500 [&_select]:focus:ring-1 [&_select]:focus:ring-blue-500 [&_textarea]:border [&_textarea]:border-gray-300 [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:rounded-md [&_textarea]:shadow-sm [&_textarea]:focus:border-blue-500 [&_textarea]:focus:ring-1 [&_textarea]:focus:ring-blue-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={prisonerData.firstName}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md ${formErrors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                    aria-invalid={formErrors.firstName ? "true" : "false"}
                    required
                  />
                  {formErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Middle Name *
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={prisonerData.middleName}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md ${formErrors.middleName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                    aria-invalid={formErrors.middleName ? "true" : "false"}
                    required
                  />
                  {formErrors.middleName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.middleName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={prisonerData.lastName}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md ${formErrors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                    aria-invalid={formErrors.lastName ? "true" : "false"}
                    required
                  />
                  {formErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={prisonerData.dateOfBirth}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md ${formErrors.dateOfBirth ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                    aria-invalid={formErrors.dateOfBirth ? "true" : "false"}
                    required
                  />
                  {formErrors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.dateOfBirth}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={prisonerData.gender}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Crime *
                  </label>
                  <input
                    type="text"
                    name="crime"
                    value={prisonerData.crime}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md ${formErrors.crime ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                    aria-invalid={formErrors.crime ? "true" : "false"}
                    required
                  />
                  {formErrors.crime && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.crime}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Sentence Start Date *
                  </label>
                  <input
                    type="date"
                    name="sentenceStart"
                    value={prisonerData.sentenceStart}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md ${formErrors.sentenceStart ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                    aria-invalid={formErrors.sentenceStart ? "true" : "false"}
                    required
                  />
                  {formErrors.sentenceStart && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.sentenceStart}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Sentence End Date *
                  </label>
                  <input
                    type="date"
                    name="sentenceEnd"
                    value={prisonerData.sentenceEnd}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md ${formErrors.sentenceEnd ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                    aria-invalid={formErrors.sentenceEnd ? "true" : "false"}
                    required
                  />
                  {formErrors.sentenceEnd && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.sentenceEnd}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Risk Level *
                  </label>
                  <select
                    name="riskLevel"
                    value={prisonerData.riskLevel}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Parole Eligibility
                  </label>
                  <select
                    name="paroleEligibility"
                    value={prisonerData.paroleEligibility}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Medical Conditions
                  </label>
                  <textarea
                    name="medicalConditions"
                    value={prisonerData.medicalConditions}
                    onChange={handleChange}
                    rows="3"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Special Requirements
                  </label>
                  <textarea
                    name="specialRequirements"
                    value={prisonerData.specialRequirements}
                    onChange={handleChange}
                    rows="3"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Arresting Officer *
                  </label>
                  <input
                    type="text"
                    name="arrestingOfficer"
                    value={prisonerData.arrestingOfficer}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md ${formErrors.arrestingOfficer ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                    aria-invalid={formErrors.arrestingOfficer ? "true" : "false"}
                    required
                  />
                  {formErrors.arrestingOfficer && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.arrestingOfficer}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Holding Cell *
                  </label>
                  <input
                    type="text"
                    name="holdingCell"
                    value={prisonerData.holdingCell}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md ${formErrors.holdingCell ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                    aria-invalid={formErrors.holdingCell ? "true" : "false"}
                    required
                  />
                  {formErrors.holdingCell && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.holdingCell}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Assigned Prison
                  </label>
                  <select
                    name="assignedPrison"
                    value={prisonerData.assignedPrison}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700">
                    Documents
                  </label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx"
                    multiple
                    className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>
              </div>

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormErrors({});
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registering...
                    </span>
                  ) : (
                    "Add Inmate"
                  )}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this inmate record? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {inmateToDelete && (
                <div className="bg-red-50 p-4 rounded-md">
                  <p className="font-medium text-red-900">You are about to delete:</p>
                  <p className="text-red-800">
                    {inmateToDelete.firstName} {inmateToDelete.lastName}
                  </p>
                  <p className="text-sm text-red-700 mt-1">ID: {inmateToDelete._id}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="ml-3 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Release Confirmation Dialog */}
        <Dialog open={releaseModalOpen} onOpenChange={setReleaseModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Release Inmate</DialogTitle>
              <DialogDescription>
                You are about to release this inmate. Please provide a reason for the release.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {inmateToRelease && (
                <div className="bg-green-50 p-4 rounded-md">
                  <p className="font-medium text-green-900">You are about to release:</p>
                  <p className="text-green-800">
                    {inmateToRelease.firstName} {inmateToRelease.lastName}
                  </p>
                  <p className="text-sm text-green-700 mt-1">ID: {inmateToRelease._id}</p>
                </div>
              )}
              
              <div>
                <label htmlFor="releaseReason" className="block text-sm font-medium text-gray-700">
                  Release Reason
                </label>
                <select
                  id="releaseReason"
                  name="releaseReason"
                  value={releaseReason === "Other" ? "Other" : releaseReason}
                  onChange={(e) => setReleaseReason(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Sentence completed">Sentence completed</option>
                  <option value="Parole granted">Parole granted</option>
                  <option value="Case dismissed">Case dismissed</option>
                  <option value="Court order">Court order</option>
                  <option value="Bail granted">Bail granted</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              {releaseReason === "Other" && (
                <div>
                  <label htmlFor="customReleaseReason" className="block text-sm font-medium text-gray-700">
                    Specify Reason
                  </label>
                  <input
                    type="text"
                    id="customReleaseReason"
                    name="customReleaseReason"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Enter specific reason"
                    value={customReleaseReason}
                    onChange={(e) => setCustomReleaseReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={handleReleaseCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReleaseConfirm}
                className="ml-3 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={releaseLoading || !(releaseReason && (releaseReason !== "Other" || customReleaseReason))}
              >
                {releaseLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Releasing...
                  </span>
                ) : (
                  "Release Inmate"
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
