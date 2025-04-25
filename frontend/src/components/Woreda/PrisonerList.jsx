import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../utils/axiosInstance";
import DataTable from "react-data-table-component";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux"; // Import useSelector for sidebar state
import {
  FaSearch,
  FaExclamationTriangle,
  FaUser,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedTransferId, setSelectedTransferId] = useState(null);
  const [crimeTypes, setCrimeTypes] = useState([]);
  const [transferFilter, setTransferFilter] = useState("all");
  const [selectedTransferStatus, setSelectedTransferStatus] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [itemsPerPage, setItemsPerPage] = useState(10); // Add state for items per page

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

      setCriticalAlerts(criticalPrisoners.map(prisoner => ({
        id: prisoner._id,
        name: `${prisoner.firstName} ${prisoner.middleName || ''} ${prisoner.lastName}`,
        timeRemaining: prisoner.timeRemaining,
        severity: prisoner.timeRemaining <= (criticalThreshold * 60 * 60 * 1000) ? 'critical' : 'urgent'
      })));
    }, 60 * 1000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [criticalThreshold, prisoners]);

  // Add this after other useEffect hooks
  useEffect(() => {
    // Extract unique crime types from prisoners
    const uniqueCrimes = [...new Set(prisoners.map(prisoner => prisoner.crime))];
    setCrimeTypes(uniqueCrimes);
  }, [prisoners]);

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

  // Add helper function to normalize transfer status consistently
  const getNormalizedStatus = (transferStatus) => {
    if (!transferStatus) return '';
    
    if (typeof transferStatus === 'string') {
      return transferStatus.toLowerCase();
    } else if (transferStatus.normalizedStatus) {
      return transferStatus.normalizedStatus;
    } else if (transferStatus.status) {
      return transferStatus.status.toLowerCase();
    }
    
    return '';
  };

  // Improved fetch prisoners function to properly fetch and display ALL transfer records
  const fetchPrisoners = async () => {
    setLoading(true);
    try {
      // First fetch all transfers - this is crucial to get ALL transfer records
      const transferResponse = await axiosInstance.get("/transfer/getall-transfers");
      const transfersRaw = transferResponse.data?.data || [];
      
      console.log(`Total transfers fetched: ${transfersRaw.length}`);
      
      // Log all transfers for debugging
      console.log("All transfers:", transfersRaw);
      
      // Count transfer statuses for debugging
      const statusCounts = {};
      transfersRaw.forEach(transfer => {
        const status = transfer.status?.toLowerCase() || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      console.log('Transfer status counts:', statusCounts);
      
      // IMPORTANT: Fix issue with fromPrison field which might be missing in some transfers
      // Initialize directly from transfer data with proper validation
      const transfers = transfersRaw.map(transfer => {
        // Fix missing fields that might cause issues
        const fromPrison = transfer.fromPrison || "Unknown";
        const toPrison = transfer.toPrison || "Unknown";
        
        // For cancelled status specifically, ensure it's properly normalized
        let normalizedStatus = transfer.status?.toLowerCase() || 'pending';
        let displayStatus = transfer.status || 'Pending';
        
        // Properly normalize status values consistently
        if (normalizedStatus.includes('cancel')) {
          normalizedStatus = 'cancelled';
          displayStatus = 'Cancelled';
        } else if (normalizedStatus.includes('approve')) {
          normalizedStatus = 'approved';
          displayStatus = 'Approved';
        } else if (normalizedStatus.includes('reject')) {
          normalizedStatus = 'rejected';
          displayStatus = 'Rejected';
        } else if (normalizedStatus === 'in_review' || normalizedStatus.includes('review')) {
          normalizedStatus = 'under review';
          displayStatus = 'Under Review';
        } else if (normalizedStatus.includes('pending')) {
          normalizedStatus = 'pending';
          displayStatus = 'Pending';
        }
        
        // Calculate transfer date for display
        const transferDate = new Date(transfer.createdAt).toLocaleDateString();
        
        return {
          ...transfer,
          normalizedStatus,
          displayStatus,
          transferDate,
          fromPrison,
          toPrison
        };
      });
      
      // Create a map of inmate IDs to their latest transfer details
      const transferMap = {};
      transfers.forEach(transfer => {
        const inmateId = transfer.inmateId;
        
        // Skip if inmateId is missing
        if (!inmateId) {
          console.log('Warning: Transfer missing inmateId:', transfer._id);
          return;
        }
        
        // Handle both string IDs and ObjectId references
        const inmateIdStr = typeof inmateId === 'object' ? 
          (inmateId._id || inmateId.toString()) : inmateId;
        
        // Only update if this is a more recent transfer for this inmate
        if (!transferMap[inmateIdStr] || 
            new Date(transfer.createdAt) > new Date(transferMap[inmateIdStr].createdAt)) {
          transferMap[inmateIdStr] = transfer;
        }
      });
      
      console.log(`Unique inmates with transfers: ${Object.keys(transferMap).length}`);
      
      // Now fetch regular inmates
      const inmatesResponse = await axiosInstance.get("/woreda-inmate/getall-inmates");
      const regularInmates = inmatesResponse.data?.inmates || [];
      
      console.log(`Regular inmates fetched: ${regularInmates.length}`);
      
      // Get IDs of regular inmates for reference
      const regularInmateIds = new Set(regularInmates.map(inmate => inmate._id));
      
      // Process regular inmates with their transfer status
      const processedRegularInmates = regularInmates.map(inmate => {
        // Skip if inmate has no ID (should never happen)
        if (!inmate._id) return null;
        
        // Get this inmate's time remaining
        const timeRemainingValue = calculateTimeRemaining(inmate.intakeDate);
        
        // Get transfer info using the inmate's ID
        const transferInfo = transferMap[inmate._id];
        
        // Build full name
        const fullName = [inmate.firstName, inmate.middleName, inmate.lastName]
          .filter(Boolean)
          .join(" ");
        
        // Format transfer data if it exists
        let transferStatus = "No Transfer Request";
        let normalizedStatus = '';
        let transferData = null;
        
        if (transferInfo) {
          transferStatus = transferInfo.displayStatus;
          normalizedStatus = transferInfo.normalizedStatus;
          
          transferData = {
            transferId: transferInfo._id,
            transferStatus: transferInfo.displayStatus,
            normalizedStatus: transferInfo.normalizedStatus,
            transferDate: transferInfo.transferDate,
            transferReason: transferInfo.reason || '',
            transferDestination: transferInfo.toPrison,
            rejectionReason: transferInfo.rejectionReason || '',
            updatedAt: transferInfo.updatedAt
          };
        }
        
        return {
          ...inmate,
          fullName,
          timeRemaining: timeRemainingValue,
          transferStatus,
          normalizedStatus,
          transferId: transferInfo?._id || null,
          transferDate: transferInfo?.transferDate || null,
          transferData,
          rejectionReason: transferInfo?.rejectionReason || null,
          transferReason: transferInfo?.reason || null,
          transferDestination: transferInfo?.toPrison || null,
          updatedAt: transferInfo?.updatedAt || null,
          hasTransfer: !!transferInfo,
          hasPendingTransfer: transferInfo && 
            (transferInfo.normalizedStatus.includes('pending') || transferInfo.normalizedStatus.includes('review'))
        };
      }).filter(Boolean); // Remove any null entries
      
      // Get transfer-only inmates (these are inmates that exist only in the transfer collection)
      const transferOnlyInmates = [];
      
      // Process each transfer to find inmates that don't exist in the regular inmate collection
      transfers.forEach(transfer => {
        // Skip if inmateId is missing
        if (!transfer.inmateId) return;
        
        // Convert ObjectId to string consistently
        const inmateId = typeof transfer.inmateId === 'object' ? 
          (transfer.inmateId._id || transfer.inmateId.toString()) : transfer.inmateId;
        
        // Only process if this inmate doesn't exist in regular inmates AND has inmate data
        if (!regularInmateIds.has(inmateId) && transfer.inmateData) {
          // Create a standardized inmate record from the transfer data
          const inmateFromTransfer = {
            _id: inmateId,
            firstName: transfer.inmateData.firstName || 'Unknown',
            middleName: transfer.inmateData.middleName || '',
            lastName: transfer.inmateData.lastName || 'Inmate',
            gender: transfer.inmateData.gender || 'Unknown',
            crime: transfer.inmateData.crime || 'Not specified',
            dateOfBirth: transfer.inmateData.dateOfBirth,
            intakeDate: transfer.inmateData.intakeDate || new Date().toISOString(),
            fullName: [
              transfer.inmateData.firstName || 'Unknown',
              transfer.inmateData.middleName || '',
              transfer.inmateData.lastName || 'Inmate'
            ].filter(Boolean).join(' '),
            transferStatus: transfer.displayStatus,
            normalizedStatus: transfer.normalizedStatus,
            transferId: transfer._id,
            transferDate: transfer.transferDate,
            transferDestination: transfer.toPrison,
            transferReason: transfer.reason || '',
            rejectionReason: transfer.rejectionReason || '',
            createdAt: transfer.createdAt,
            updatedAt: transfer.updatedAt,
            hasTransfer: true,
            isFromTransfer: true,
            timeRemaining: calculateTimeRemaining(transfer.inmateData.intakeDate || new Date().toISOString()),
            hasPendingTransfer: 
              transfer.normalizedStatus.includes('pending') || 
              transfer.normalizedStatus.includes('review'),
            transferData: {
              transferId: transfer._id,
              transferStatus: transfer.displayStatus,
              normalizedStatus: transfer.normalizedStatus,
              transferDate: transfer.transferDate,
              transferReason: transfer.reason || '',
              transferDestination: transfer.toPrison,
              rejectionReason: transfer.rejectionReason || '',
              updatedAt: transfer.updatedAt
            }
          };
          
          transferOnlyInmates.push(inmateFromTransfer);
        }
      });
      
      console.log(`Inmates existing only in transfers: ${transferOnlyInmates.length}`);
      
      // Combine both lists - this ensures we get ALL inmates
      const allInmates = [...processedRegularInmates, ...transferOnlyInmates];
      
      console.log(`Total combined inmates: ${allInmates.length}`);
      
      // For prisoners list, show ALL inmates with ANY transfer status (pending, approved, rejected, etc.)
      // or with urgent time remaining
      const finalInmatesList = allInmates.filter(inmate => 
        inmate.hasTransfer || inmate.timeRemaining <= urgentThreshold * 60 * 60 * 1000
      );
      
      console.log(`Final list (transfers + urgent time): ${finalInmatesList.length}`);
      
      // Perform status counts for verification
      const finalStatusCounts = {};
      finalInmatesList.forEach(inmate => {
        if (inmate.transferStatus && inmate.transferStatus !== "No Transfer Request") {
          const status = inmate.transferStatus;
          finalStatusCounts[status] = (finalStatusCounts[status] || 0) + 1;
        } else {
          finalStatusCounts['No Transfer'] = (finalStatusCounts['No Transfer'] || 0) + 1;
        }
      });
      
      console.log('Final inmate status counts:', finalStatusCounts);
      
      // Set inmates state with filtered list
      setPrisoners(finalInmatesList);
      setFilteredPrisoners(finalInmatesList);
      
      // Generate critical alerts for inmates with urgent time remaining
      const criticalList = finalInmatesList
        .filter(prisoner => prisoner.timeRemaining <= criticalThreshold * 60 * 60 * 1000)
        .map(prisoner => ({
          id: prisoner._id,
          name: prisoner.fullName,
          timeRemaining: prisoner.timeRemaining,
          severity: prisoner.timeRemaining <= (criticalThreshold * 60 * 60 * 1000 / 2) ? 'critical' : 'urgent'
        }));
        
      setCriticalAlerts(criticalList);
      
      console.log("Fetch and filtering complete.");
    } catch (error) {
      console.error("Error fetching prisoners:", error);
      toast.error("Failed to fetch prisoner data");
    } finally {
      setLoading(false);
    }
  };

  // Modify the applyFilters function to work better with our new data structure
  const applyFilters = (inmates = prisoners) => {
    console.log("Applying filters to", inmates.length, "inmates");
    console.log("Current transfer filter:", transferFilter);
    console.log("Current search term:", searchQuery);
    
    let filtered = [...inmates];
    
    // Apply transfer status filter
    if (transferFilter && transferFilter !== "all") {
      if (transferFilter === "no-transfer") {
        filtered = filtered.filter(inmate => 
          !inmate.transferStatus || inmate.transferStatus === "No Transfer Request");
      } else {
        // Filter by the normalized status
        filtered = filtered.filter(inmate => {
          if (!inmate.normalizedStatus) return false;
          
          return inmate.normalizedStatus.includes(transferFilter.toLowerCase());
        });
      }
      console.log(`After transfer filter (${transferFilter}):`, filtered.length);
    }
    
    // Apply search term if it exists
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      filtered = filtered.filter(inmate => {
        // Normalize the name for searching
        const fullName = inmate.fullName || 
          [inmate.firstName, inmate.middleName, inmate.lastName]
            .filter(Boolean)
            .join(" ");
            
        return fullName.toLowerCase().includes(term) || 
          (inmate.prisonerCode && inmate.prisonerCode.toLowerCase().includes(term));
      });
      console.log(`After search term filter (${searchQuery}):`, filtered.length);
    }
    
    // Sort the filtered list
    filtered = sortPrisoners(filtered, sortConfig);
    
    console.log("Final filtered count:", filtered.length);
    
    // Update the filtered prisoners state
    setFilteredPrisoners(filtered);
  };
  
  // Update the getStatusChips function to show accurate counts
  const getStatusChips = () => {
    // Start with all inmates
    const allInmates = prisoners || [];
    
    // Count transfer statuses
    const statusCounts = {
      Pending: 0,
      'Under Review': 0,
      Approved: 0,
      Rejected: 0,
      Cancelled: 0,
      'No Transfer Request': 0
    };
    
    // Count each status
    allInmates.forEach(inmate => {
      const status = inmate.transferStatus || 'No Transfer Request';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return (
      <div className="status-chips">
        <div
          className={`status-chip all ${selectedTransferStatus === "All" ? "active" : ""}`}
          onClick={() => setSelectedTransferStatus("All")}
        >
          All ({allInmates.length})
        </div>
        <div
          className={`status-chip pending ${selectedTransferStatus === "Pending" ? "active" : ""}`}
          onClick={() => setSelectedTransferStatus("Pending")}
        >
          Pending ({statusCounts["Pending"]})
        </div>
        <div
          className={`status-chip under-review ${selectedTransferStatus === "Under Review" ? "active" : ""}`}
          onClick={() => setSelectedTransferStatus("Under Review")}
        >
          Under Review ({statusCounts["Under Review"]})
        </div>
        <div
          className={`status-chip approved ${selectedTransferStatus === "Approved" ? "active" : ""}`}
          onClick={() => setSelectedTransferStatus("Approved")}
        >
          Approved ({statusCounts["Approved"]})
        </div>
        <div
          className={`status-chip rejected ${selectedTransferStatus === "Rejected" ? "active" : ""}`}
          onClick={() => setSelectedTransferStatus("Rejected")}
        >
          Rejected ({statusCounts["Rejected"]})
        </div>
        <div
          className={`status-chip cancelled ${selectedTransferStatus === "Cancelled" ? "active" : ""}`}
          onClick={() => setSelectedTransferStatus("Cancelled")}
        >
          Cancelled ({statusCounts["Cancelled"]})
        </div>
        <div
          className={`status-chip no-transfer ${selectedTransferStatus === "No Transfer Request" ? "active" : ""}`}
          onClick={() => setSelectedTransferStatus("No Transfer Request")}
        >
          No Transfer ({statusCounts["No Transfer Request"]})
        </div>
      </div>
    );
  };
  
  // Update the Status component to use improved styling and data
  const Status = ({ status }) => {
    let statusClass = "status-badge";
    
    // Normalize status for styling
    const normalizedStatus = status?.toLowerCase() || "no transfer request";
    
    if (normalizedStatus.includes("pending")) {
      statusClass += " status-pending";
    } else if (normalizedStatus.includes("review")) {
      statusClass += " status-review";
    } else if (normalizedStatus.includes("approved")) {
      statusClass += " status-approved";
    } else if (normalizedStatus.includes("rejected")) {
      statusClass += " status-rejected";
    } else if (normalizedStatus.includes("cancelled") || normalizedStatus.includes("canceled")) {
      statusClass += " status-cancelled";
    } else {
      statusClass += " status-no-transfer";
    }
    
    return <span className={statusClass}>{status || "No Transfer Request"}</span>;
  };

  // Update handleSearch to properly use the searchQuery state
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  // Update handleTransferFilterChange to work with the transferFilter state
  const handleTransferFilterChange = (e) => {
    const value = e.target.value;
    setTransferFilter(value);
    console.log("Transfer filter changed to:", value);
  };

  // Add a new handler for time range filtering
  const handleTimeRangeFilterChange = (e) => {
    const value = e.target.value;
    
    if (value === "all") {
      // Reset to all prisoners (but maintain other filters)
      applyFilters(prisoners);
    } else {
      const hours = parseInt(value);
      // Filter by time and then apply other filters
      const timeFiltered = prisoners.filter(
        prisoner => prisoner.timeRemaining <= hours * 60 * 60 * 1000
      );
      applyFilters(timeFiltered);
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

  const handleEdit = async (row) => {
    try {
      // First get the transfer details
      const response = await axiosInstance.get(`/transfer/get-transfer/${row.transferId}`);
      if (response.data?.success) {
        setSelectedInmate(row._id);
        setSelectedPrisonerData(row);
        setSelectedPrison(response.data.data.toPrison);
        setTransferReason(response.data.data.reason);
        setTransferModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching transfer details:", error);
      toast.error("Failed to load transfer details");
    }
  };

  const handleTransfer = async () => {
    if (!selectedPrison || !transferReason) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      // Find selected prison name for display
      const selectedPrisonData = prisons.find(p => p._id === selectedPrison);
      const selectedPrisonName = selectedPrisonData ? selectedPrisonData.prison_name : "Selected Prison";
      
      // Find current prison name
      const currentPrisonData = prisons.find(p => p._id === selectedPrisonerData.assignedPrison);
      const currentPrisonName = currentPrisonData ? currentPrisonData.prison_name : "Current Prison";

      const transferData = {
        inmateId: selectedInmate,
        fromPrison: selectedPrisonerData.assignedPrison,
        toPrison: selectedPrison,
        reason: transferReason,
        status: "Pending",
        inmateData: {
          firstName: selectedPrisonerData.firstName,
          lastName: selectedPrisonerData.lastName,
          middleName: selectedPrisonerData.middleName || "",
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
          status: "Pending",
          fromPrisonName: currentPrisonName,
          toPrisonName: selectedPrisonName
        }
      };

      let response;
      if (selectedPrisonerData.transferId) {
        // Update existing transfer
        response = await axiosInstance.put(
          `/transfer/update-transfer/${selectedPrisonerData.transferId}`,
        transferData
      );
      } else {
        // Create new transfer
        response = await axiosInstance.post(
          "/transfer/create-transfer",
          transferData
        );
      }

      if (response.data?.success) {
        // Check if transfer was approved immediately
        if (response.data?.data?.status === "Approved") {
          try {
            console.log("Transfer was approved immediately, updating prison populations");
            // If transfer is approved, update prison populations
            
            // Decrement the original prison's population if assigned
            if (selectedPrisonerData.assignedPrison) {
              console.log(`Decrementing population for source prison: ${selectedPrisonerData.assignedPrison}`);
              const decrementResponse = await axiosInstance.post("/prison/decrement-population", {
                prisonId: selectedPrisonerData.assignedPrison,
                decrement: 1
              });
              
              if (!decrementResponse.data?.success) {
                console.error("Failed to decrement source prison population:", decrementResponse.data?.error);
              } else {
                console.log("Successfully decremented source prison population");
              }
            }
            
            // Increment the destination prison's population
            console.log(`Incrementing population for destination prison: ${selectedPrison}`);
            const incrementResponse = await axiosInstance.post("/prison/increment-population", {
              prisonId: selectedPrison,
              increment: 1
            });
            
            if (!incrementResponse.data?.success) {
              console.error("Failed to increment destination prison population:", incrementResponse.data?.error);
            } else {
              console.log("Successfully incremented destination prison population");
              // Notify that prison populations have changed
              window.dispatchEvent(new Event('prisonPopulationChanged'));
              
              toast.success("Transfer completed and prison populations updated successfully!");
            }
          } catch (populationError) {
            console.error("Error updating prison populations during transfer:", populationError);
            toast.error("Transfer approved but failed to update prison populations");
          }
        } else {
          toast.success(selectedPrisonerData.transferId 
            ? "Transfer request updated successfully"
            : "Transfer request submitted successfully. Waiting for security staff approval."
          );
        }
        
        setTransferModalOpen(false);
        setSelectedPrison("");
        setTransferReason("");
        setSelectedPrisonerData(null);
        await fetchPrisoners();
      }
    } catch (error) {
      console.error("Error handling transfer:", error);
      toast.error(
        error.response?.data?.error || "Failed to process transfer request"
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
      name: "#",
      cell: (row, index) => {
        const rowNumber = (currentPage - 1) * 10 + index + 1;
        return (
          <div className="text-sm font-medium text-gray-900 bg-gray-100 h-8 w-8 rounded-full flex items-center justify-center">
            {rowNumber}
          </div>
        );
      },
      sortable: false,
      width: "60px",
      minWidth: "50px",
      maxWidth: "70px",
    },
    {
      name: "Name",
      selector: (row) => `${row.firstName} ${row.middleName || ''} ${row.lastName}`,
      cell: (row) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 mr-3 overflow-hidden rounded-full">
            {row.photo ? (
              <img 
                src={row.photo} 
                alt={`${row.firstName} ${row.lastName}`}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="h-full w-full rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <FaUser className={row.gender === 'female' ? "text-pink-500" : "text-blue-500"} />
              </div>
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {row.firstName} {row.middleName} {row.lastName}
            </div>
            <div className="text-xs text-gray-500">
              {row.gender}, ID: {row._id.slice(-6).toUpperCase()}
            </div>
          </div>
        </div>
      ),
      sortable: true,
      minWidth: "180px",
      maxWidth: "250px",
      grow: 1,
    },
    {
      name: "Crime",
      selector: (row) => row.crime,
      cell: (row) => (
        <div className="text-sm text-gray-900 font-medium">
          {row.crime}
        </div>
      ),
      sortable: true,
      minWidth: "120px",
      maxWidth: "180px",
      hide: "md",
    },
    {
      name: "Transfer Status",
      selector: (row) => row.transferStatus,
      cell: (row) => {
        const status = row.transferStatus || "No Transfer Request";
        let bgColor = "bg-gray-100";
        let textColor = "text-gray-800";

        switch (status) {
          case "Pending":
            bgColor = "bg-yellow-100";
            textColor = "text-yellow-800";
            break;
          case "Under Review":
            bgColor = "bg-blue-100";
            textColor = "text-blue-800";
            break;
          case "Approved":
            bgColor = "bg-green-100";
            textColor = "text-green-800";
            break;
          case "Rejected":
            bgColor = "bg-red-100";
            textColor = "text-red-800";
            break;
          case "Cancelled":
            bgColor = "bg-gray-100";
            textColor = "text-gray-800";
            break;
          default:
            bgColor = "bg-gray-100";
            textColor = "text-gray-800";
        }

        return (
          <div className="relative group">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${bgColor} ${textColor} cursor-default`}>
                {status}
              </span>
              {status === "Rejected" && row.rejectionReason && (
                <span className="text-xs text-gray-500 truncate max-w-[100px]">
                  - {row.rejectionReason}
                </span>
              )}
            </div>
            {/* Show tooltip for transfer reason when status is Pending or Under Review */}
            {(status === "Pending" || status === "Under Review") && row.transferReason && (
              <div className="absolute z-50 invisible group-hover:visible bg-white border border-gray-200 text-sm rounded-lg py-2 px-3 min-w-[200px] max-w-[250px] bottom-full left-0 mb-2 shadow-lg">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className={`w-2 h-2 rounded-full ${status === "Pending" ? "bg-yellow-500" : "bg-blue-500"}`}></div>
                    <span className="font-semibold text-gray-900">Transfer {status}</span>
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium text-gray-700">Reason:</span>
                    <p className="mt-1 text-gray-600">{row.transferReason}</p>
                  </div>
                  {row.createdAt && (
                    <div className="text-xs text-gray-500 mt-1 pt-2 border-t border-gray-200">
                      Requested on {new Date(row.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-[-6px] left-3 transform rotate-45 w-3 h-3 bg-white border-r border-b border-gray-200"></div>
              </div>
            )}
          </div>
        );
      },
      sortable: true,
      minWidth: "150px",
      maxWidth: "180px",
    },
    {
      name: "Time Left",
      selector: (row) => row.timeRemaining,
      cell: (row) => {
        const timeStatus = getTimeStatus(row.timeRemaining);
        return (
          <div className="flex items-center gap-1">
            <span className={`${timeStatus.color} font-medium`}>
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
      minWidth: "140px",
      maxWidth: "180px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate(`/woreda-dashboard/inmates/${row._id}`)}
            className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-full transition-all duration-150 hover:shadow-md text-xs"
            title="View Details"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
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
          
          {(row.transferStatus === "No Transfer Request" || row.transferStatus === "Rejected" || row.transferStatus === "Cancelled") && (
          <TransferButton
            inmate={row}
            onTransferComplete={() => {
              fetchPrisoners();
            }}
            currentPrison={row.assignedPrison}
          />
          )}
          
          {(row.transferStatus === "Pending" || row.transferStatus === "Under Review") && (
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => handleEdit(row)}
                className="flex items-center gap-1 px-2 py-1 text-yellow-600 hover:text-yellow-800 bg-yellow-50 hover:bg-yellow-100 rounded-full transition-all duration-150 hover:shadow-md text-xs"
                title="Edit Transfer Request"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  if (!row.transferId) {
                    toast.error("Transfer ID not found");
                    return;
                  }
                  setSelectedTransferId(row.transferId);
                  setShowCancelDialog(true);
                }}
                className="flex items-center gap-1 px-2 py-1 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-full transition-all duration-150 hover:shadow-md text-xs"
                title="Cancel Transfer Request"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>
      ),
      minWidth: "120px",
      grow: 2,
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
      selectedPrisonerData?.middleName ? selectedPrisonerData?.middleName + ' ' : ''
    }${selectedPrisonerData?.lastName}</title>
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
      selectedPrisonerData?.middleName ? selectedPrisonerData?.middleName + ' ' : ''
    }${selectedPrisonerData?.lastName}</span>
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

  const handleCancelTransfer = async () => {
    try {
      if (!selectedTransferId) {
        toast.error("No transfer selected");
        return;
      }

      console.log("Attempting to cancel transfer with ID:", selectedTransferId);

      const response = await axiosInstance.put(`/transfer/cancel-transfer/${selectedTransferId}`);
      
      if (response.data?.success) {
        toast.success("Transfer cancelled successfully");
        setShowCancelDialog(false);
        setSelectedTransferId(null);
        await fetchPrisoners(); // Refresh the list
      } else {
        toast.error(response.data?.message || "Failed to cancel transfer");
      }
    } catch (error) {
      console.error("Error cancelling transfer:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data
      });
      toast.error(error.response?.data?.message || "Failed to cancel transfer");
    }
  };

  // Add the sorting function to sort inmates by different criteria
  const sortPrisoners = (inmates, config) => {
    if (!config.key) return inmates;
    
    return [...inmates].sort((a, b) => {
      // Get the values to compare based on the key
      let aValue = a[config.key];
      let bValue = b[config.key];
      
      // Handle special case for transfer date
      if (config.key === 'transferDate') {
        aValue = a.transferDate ? new Date(a.transferDate).getTime() : 0;
        bValue = b.transferDate ? new Date(b.transferDate).getTime() : 0;
      }
      
      // Handle special case for remaining time (convert to numeric for sorting)
      if (config.key === 'timeRemaining') {
        aValue = a.timeRemaining || 0;
        bValue = b.timeRemaining || 0;
      }
      
      // Handle undefined or null values
      if (aValue === undefined || aValue === null) aValue = "";
      if (bValue === undefined || bValue === null) bValue = "";
      
      // Return a standard sort comparison based on direction
      if (aValue < bValue) {
        return config.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return config.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };
  
  // Add a function to request sorting when a column header is clicked
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Add handler for items per page change
  const handleItemsPerPageChange = (perPage) => {
    // DataTable sends the value directly, not an event object
    const value = Number(perPage);
    console.log("Items per page changing to:", value);
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Add handler for page change to properly track current page
  const handlePageChange = (page) => {
    // DataTable's onChangePage provides the page number directly
    console.log("Page changing to:", page);
    setCurrentPage(page);
  };

  // Add back the useEffect to apply filters when dependencies change
  useEffect(() => {
    if (prisoners.length > 0) {
      console.log("Re-applying filters due to dependency change");
      console.log("Current filter states:", { 
        searchQuery, 
        transferFilter, 
        prisonersCount: prisoners.length 
      });
      applyFilters(prisoners);
    }
  }, [searchQuery, transferFilter, prisoners, sortConfig]);

  // Update the Dialog component for cancellation
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
        {/* Responsive Fixed Header */}
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex justify-between items-center transition-all duration-300 ${
            isCollapsed
              ? "left-16 w-[calc(100%-4rem)]"
              : "left-64 w-[calc(100%-16rem)]"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Inmates Management
              </h1>
            </div>
            
            {/* All Filtering Controls Moved to Right */}
            <div className="flex flex-wrap items-center gap-3 justify-end">
              {/* Search Input */}
              <div className="relative min-w-[200px] max-w-[300px]">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search by name or ID"
                  className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Time Range Filter */}
              <div className="flex-shrink-0">
                <select
                  onChange={handleTimeRangeFilterChange}
                  className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Time Ranges</option>
                  <option value="6">Critical (≤ 6 hours)</option>
                  <option value="12">Urgent (≤ 12 hours)</option>
                  <option value="24">Warning (≤ 24 hours)</option>
                </select>
              </div>

              {/* Transfer Status Filter */}
              <div className="flex-shrink-0">
                <select
                  value={transferFilter}
                  onChange={handleTransferFilterChange}
                  className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Transfers</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="pending">Pending</option>
                  <option value="under-review">Under Review</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-transfer">No Transfer Record</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Push content down to prevent overlap */}
        <div className="mt-24">
          {/* DataTable with styled improvements */}
          <div className="mx-4 bg-white rounded-lg shadow-md overflow-hidden">
            {loading && (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading inmates...</p>
              </div>
            )}

            {!loading && filteredPrisoners.length === 0 && (
              <div className="p-8 text-center">
                <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No inmates found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? 
                    `No inmates match the search term "${searchQuery}"` : 
                    "No inmates match the current filter criteria"}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setTransferFilter("all");
                    applyFilters(prisoners);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {!loading && filteredPrisoners.length > 0 && (
            <div className="p-6 pb-10 overflow-hidden">
                <DataTable
                    columns={columns.filter(col => col.name !== "Crime")}
                    data={filteredPrisoners}
                    pagination={true}
                    paginationPerPage={itemsPerPage}
                    paginationRowsPerPageOptions={[10, 25, 50, 100]}
                    paginationComponentOptions={{
                      rowsPerPageText: 'Rows per page:',
                      rangeSeparatorText: 'of',
                      noRowsPerPage: false,
                      selectAllRowsItem: false,
                      selectAllRowsItemText: 'All',
                    }}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handleItemsPerPageChange}
                    progressPending={loading}
                    progressComponent={
                      <div className="p-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Loading inmates...</p>
                      </div>
                    }
                    noDataComponent={
                      <div className="p-4 text-center">
                        <p className="text-gray-500">No data available</p>
                      </div>
                    }
                    highlightOnHover
                    responsive
                    className="overflow-visible"
                    fixedHeader={true}
                    fixedHeaderScrollHeight="calc(100vh - 300px)"
                    customStyles={{
                      headRow: {
                        style: {
                          backgroundColor: '#1e40af',
                          background: 'linear-gradient(to right, #2563eb, #1e40af)',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          minHeight: '48px',
                          position: 'sticky',
                          top: 0,
                          zIndex: 10,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                          '&:hover': {
                            backgroundColor: '#1e40af'
                          },
                        },
                      },
                      headCells: {
                        style: {
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          paddingLeft: '16px',
                          paddingRight: '16px',
                          paddingTop: '12px',
                          paddingBottom: '12px',
                        },
                      },
                      rows: {
                        style: {
                          fontSize: '0.875rem',
                          fontWeight: '400',
                          color: 'rgb(55, 65, 81)',
                          minHeight: '60px',
                          padding: '8px 0',
                          '&:hover': {
                            backgroundColor: '#f9fafb',
                            cursor: 'pointer',
                          },
                          '&:nth-of-type(odd)': {
                            backgroundColor: '#f3f4f6',
                          },
                        },
                      },
                      cells: {
                        style: {
                          paddingLeft: '16px',
                          paddingRight: '16px',
                          paddingTop: '12px',
                          paddingBottom: '12px',
                          wordBreak: 'break-word',
                          whiteSpace: 'normal',
                        },
                      },
                      pagination: {
                        style: {
                          borderTopStyle: 'solid',
                          borderTopWidth: '1px',
                          borderTopColor: '#e5e7eb',
                          backgroundColor: '#f9fafb',
                          padding: '24px 16px',
                          marginTop: '10px',
                          fontSize: '0.875rem',
                        },
                        pageButtonsStyle: {
                          borderRadius: '0.375rem',
                          height: '32px',
                          minWidth: '32px',
                          margin: '0 4px',
                          padding: '0 8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          '&:hover:not(:disabled)': {
                            backgroundColor: '#f3f4f6',
                          },
                          '&:disabled': {
                            cursor: 'not-allowed',
                            opacity: '0.5',
                          },
                        },
                      },
                      table: {
                        style: {
                          backgroundColor: '#ffffff',
                          borderCollapse: 'separate',
                          borderSpacing: '0',
                          width: '100%',
                          maxWidth: '100%',
                          tableLayout: 'auto',
                        },
                      },
                      responsiveWrapper: {
                        style: {
                          overflowX: 'visible',
                          overflowY: 'auto',
                        },
                      },
                    }}
                />
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPrisonerData?.transferId ? "Edit Transfer Request" : "New Transfer Request"}
            </DialogTitle>
            <DialogDescription>
              {selectedPrisonerData?.transferId 
                ? "Update the transfer details below."
                : "Fill in the transfer details below."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic Inmate Info - Just for Context */}
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <p className="text-sm text-gray-600">
                Inmate: <span className="font-medium text-gray-900">
                  {selectedPrisonerData?.firstName} {selectedPrisonerData?.middleName} {selectedPrisonerData?.lastName}
                      </span>
              </p>
                </div>

            {/* Transfer Details Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Destination Prison *
                </label>
                <select
                  value={selectedPrison}
                  onChange={(e) => setSelectedPrison(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
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
                  Transfer Reason *
                </label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  required
                  placeholder="Enter the reason for transfer"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setTransferModalOpen(false);
                setSelectedPrisonerData(null);
                setSelectedPrison("");
                setTransferReason("");
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleTransfer}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={!selectedPrison || !transferReason}
            >
              {selectedPrisonerData?.transferId ? "Update Transfer" : "Submit Transfer"}
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

      {/* Simplified Cancel Transfer Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Transfer Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this transfer request?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => {
                setShowCancelDialog(false);
                setSelectedTransferId(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              No, Keep It
            </button>
            <button
              onClick={handleCancelTransfer}
              className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Yes, Cancel Transfer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrisonerList;
