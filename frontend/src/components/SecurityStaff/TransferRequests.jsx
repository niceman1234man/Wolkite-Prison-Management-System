import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";
import DataTable from "react-data-table-component";
import { FaEye, FaPrint, FaCheck, FaTimes, FaClock, FaUser, FaSort, FaSortUp, FaSortDown, FaSearch, FaSync } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const TransferRequests = () => {
  // State for managing transfers data
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [prisonFilter, setPrisonFilter] = useState('all');
  const [prisons, setPrisons] = useState([]);
  const [sortField, setSortField] = useState('transferDate');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // New state variables for status change and delete functionalities
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  // Add a separate state for the details view
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchTransfers();
    fetchPrisons();
  }, []);

  // Add debug logs for prison filtering
  useEffect(() => {
    console.log("Prison filter changed to:", prisonFilter);
    console.log("Available prisons:", prisons);
    console.log("Filtered transfers count:", getFilteredTransfers().length);
  }, [prisonFilter, prisons]);

  const fetchPrisons = async () => {
    try {
      console.log("Fetching prisons...");
      // Try fetching from the /prison/all endpoint, but be prepared to handle errors
      const response = await axiosInstance.get("/prison/all");
      console.log("Prison API response:", response.data);
      
      if (response.data && (response.data.success || Array.isArray(response.data) || response.data.data)) {
        let prisonsList = [];
        
        // Handle different API response structures
        if (Array.isArray(response.data)) {
          prisonsList = response.data;
        } else if (response.data.prisons && Array.isArray(response.data.prisons)) {
          prisonsList = response.data.prisons;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          prisonsList = response.data.data;
        } else if (typeof response.data === 'object') {
          // If data is not in expected format, try to extract prison objects
          const possiblePrisons = Object.values(response.data).filter(
            item => item && typeof item === 'object' && (item.name || item.prisonName)
          );
          if (possiblePrisons.length > 0) {
            prisonsList = possiblePrisons;
          }
        }
        
        // Ensure each prison has an _id and name property
        const formattedPrisons = prisonsList.map(prison => ({
          _id: prison._id || prison.id || String(Math.random()),
          name: prison.name || prison.prisonName || "Unknown Prison"
        }));
        
        console.log("Processed prisons list:", formattedPrisons);
        if (formattedPrisons.length > 0) {
          setPrisons(formattedPrisons);
          return; // Stop processing if we found prisons
        }
      }
      
      // If we reach here without returning, fall through to the catch block
      throw new Error("Invalid prison data structure");
    } catch (error) {
      console.error("Error fetching prisons:", error);
      
      // Try fallback method - extract from transfers
      // Only attempt this if we have transfers loaded
      if (transfers.length > 0) {
      const uniquePrisons = extractPrisonsFromTransfers();
      if (uniquePrisons.length > 0) {
        console.log("Successfully extracted prisons from transfers:", uniquePrisons);
        setPrisons(uniquePrisons);
          return;
        }
      }
      
      // If we still don't have prisons, create a minimal fallback
      toast.info("Using built-in prison data");
        // Create some realistic fallback prison data
        const fallbackPrisons = [
        { _id: "wolkite_main_prison", name: "Wolkite Main Prison" },
        { _id: "gubre_police", name: "Gubre Police" },
        { _id: "wolkite_police", name: "Wolkite Police" }
        ];
        setPrisons(fallbackPrisons);
    }
  };
  
  // Extract unique prisons from transfer data as a fallback
  const extractPrisonsFromTransfers = (transfersData = transfers) => {
    const uniquePrisons = new Map();
    
    transfersData.forEach(transfer => {
      // Extract from display names first
      if (transfer.fromPrisonRaw) {
        uniquePrisons.set(transfer.fromPrisonRaw, {
          _id: transfer.fromPrisonId || transfer.fromPrisonRaw,
          name: transfer.fromPrisonRaw
        });
      }
      
      if (transfer.toPrisonRaw) {
        uniquePrisons.set(transfer.toPrisonRaw, {
          _id: transfer.toPrisonId || transfer.toPrisonRaw,
          name: transfer.toPrisonRaw
        });
      }
      
      // Then try request details if available
      if (transfer.requestDetails?.fromPrisonName) {
        uniquePrisons.set(transfer.requestDetails.fromPrisonName, {
          _id: transfer.fromPrisonId || transfer.requestDetails.fromPrisonName,
          name: transfer.requestDetails.fromPrisonName
        });
      }
      
      if (transfer.requestDetails?.toPrisonName) {
        uniquePrisons.set(transfer.requestDetails.toPrisonName, {
          _id: transfer.toPrisonId || transfer.requestDetails.toPrisonName,
          name: transfer.requestDetails.toPrisonName
        });
      }
    });
    
    return Array.from(uniquePrisons.values());
  };

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/transfer/getall-transfers");
      console.log("Fetched transfers:", response.data);
      
      // Fetch prisons first to ensure we have the prison data for lookup
      try {
        const prisonsResponse = await axiosInstance.get("/prison/getall-prisons");
        if (prisonsResponse.data?.success && Array.isArray(prisonsResponse.data.prisons)) {
          // Create a more comprehensive prison map for lookups
          const prisonMap = {};
          prisonsResponse.data.prisons.forEach(prison => {
            prisonMap[prison._id] = prison.prison_name || prison.name;
          });
          console.log("Built prison map:", prisonMap);
          
          // Process the transfers using the prison map
      const processedTransfers = response.data.data.map(transfer => {
        // Get prison data, handling various possible formats
        const fromPrisonId = transfer.fromPrison || "";
        const toPrisonId = transfer.toPrison || "";
        
            // Look up prison names from map, fallback to other sources
            let fromPrisonName = prisonMap[fromPrisonId] || 
                                transfer.fromPrisonName || 
                                transfer.requestDetails?.fromPrisonName || 
                                "";
                                
            let toPrisonName = prisonMap[toPrisonId] || 
                              transfer.toPrisonName || 
                              transfer.requestDetails?.toPrisonName || 
                              "";
            
            // If we still don't have names, check if the "prison" might actually be a name
            if (!fromPrisonName && typeof fromPrisonId === 'string' && !fromPrisonId.match(/^[0-9a-fA-F]{24}$/)) {
              fromPrisonName = fromPrisonId;
            }
            
            if (!toPrisonName && typeof toPrisonId === 'string' && !toPrisonId.match(/^[0-9a-fA-F]{24}$/)) {
              toPrisonName = toPrisonId;
            }
            
            // For MongoDB IDs that we couldn't resolve, use fallback prison names
            if (!fromPrisonName && fromPrisonId.match(/^[0-9a-fA-F]{24}$/)) {
              fromPrisonName = "Unknown Prison";
            }
            
            if (!toPrisonName && toPrisonId.match(/^[0-9a-fA-F]{24}$/)) {
              toPrisonName = "Unknown Prison";
            }
            
            console.log(`Processed prison data for transfer ${transfer._id}:`, {
              fromPrisonId,
              toPrisonId,
              fromPrisonName,
              toPrisonName
            });
            
            return {
              ...transfer,
              // Store both the ID and name for reliable filtering
              fromPrisonId: String(fromPrisonId),
              toPrisonId: String(toPrisonId),
              // Store the resolved prison names
              fromPrison: fromPrisonName,
              toPrison: toPrisonName,
              transferDate: transfer.transferDate ? new Date(transfer.transferDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              createdAt: transfer.createdAt ? new Date(transfer.createdAt).toISOString().split('T')[0] : null,
              status: String(transfer.status || "pending").toLowerCase()
            };
          });
          
          console.log("Processed transfers with prison map:", processedTransfers);
          setTransfers(processedTransfers);
          
          // Update prison list from the fetched data
          const formattedPrisons = prisonsResponse.data.prisons.map(prison => ({
            _id: prison._id,
            name: prison.prison_name || prison.name
          }));
          setPrisons(formattedPrisons);
          
          return;
        }
      } catch (prisonError) {
        console.error("Error fetching prisons for name resolution:", prisonError);
      }
      
      // If we get here, the prison API lookup failed, so fall back to the old method
      const processedTransfers = response.data.data.map(transfer => {
        // Get prison data, handling various possible formats
        const fromPrisonId = transfer.fromPrison || "";
        const toPrisonId = transfer.toPrison || "";
        
        // Extract names from original data
        let fromPrisonName = transfer.fromPrisonName || transfer.requestDetails?.fromPrisonName || "";
        let toPrisonName = transfer.toPrisonName || transfer.requestDetails?.toPrisonName || "";
        
        // If we have IDs that look like MongoDB ObjectIDs but no names, try to use names from existing prison list
        if (fromPrisonId.match(/^[0-9a-fA-F]{24}$/) && !fromPrisonName) {
          const prison = prisons.find(p => p._id === fromPrisonId);
          if (prison) {
            fromPrisonName = prison.name;
          } else {
            fromPrisonName = "Unknown Prison";
          }
        } else if (!fromPrisonName && typeof fromPrisonId === 'string') {
          // If not a MongoDB ID and no name, use the ID as the name
          fromPrisonName = fromPrisonId;
        }
        
        if (toPrisonId.match(/^[0-9a-fA-F]{24}$/) && !toPrisonName) {
          const prison = prisons.find(p => p._id === toPrisonId);
          if (prison) {
            toPrisonName = prison.name;
          } else {
            toPrisonName = "Unknown Prison";
          }
        } else if (!toPrisonName && typeof toPrisonId === 'string') {
          // If not a MongoDB ID and no name, use the ID as the name
          toPrisonName = toPrisonId;
        }
        
        console.log(`Raw prison data for transfer ${transfer._id}:`, {
          fromPrison: transfer.fromPrison,
          toPrison: transfer.toPrison,
          fromPrisonName,
          toPrisonName,
          requestDetails: transfer.requestDetails
        });
        
        return {
          ...transfer,
          // Store both the ID and name for reliable filtering
          fromPrisonId: String(fromPrisonId),
          toPrisonId: String(toPrisonId),
          // Store the resolved prison names
          fromPrison: fromPrisonName,
          toPrison: toPrisonName,
          transferDate: transfer.transferDate ? new Date(transfer.transferDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          createdAt: transfer.createdAt ? new Date(transfer.createdAt).toISOString().split('T')[0] : null,
          status: String(transfer.status || "pending").toLowerCase()
        };
      });
      
      console.log("Processed transfers (fallback method):", processedTransfers);
      setTransfers(processedTransfers);
      
      // After loading transfers, if we have no prisons yet, try to extract them from the transfers
      if (prisons.length === 0) {
        const extractedPrisons = extractPrisonsFromTransfers(processedTransfers);
        if (extractedPrisons.length > 0) {
          setPrisons(extractedPrisons);
        }
      }
    } catch (error) {
      console.error("Error fetching transfers:", error);
      toast.error("Failed to fetch transfer requests");
    } finally {
      setLoading(false);
    }
  };

  // Re-process transfers when prisons are loaded
  useEffect(() => {
    if (prisons.length > 0 && transfers.length > 0) {
      console.log("Prisons loaded, updating transfer data with prison names...");
      
      // Re-process transfers to update prison names
      const updatedTransfers = transfers.map(transfer => {
        // Find the prison names from the loaded prison list
        const fromPrisonObj = prisons.find(p => String(p._id) === String(transfer.fromPrisonId));
        const toPrisonObj = prisons.find(p => String(p._id) === String(transfer.toPrisonId));
        
        // Update the prison names if we found a match
        return {
          ...transfer,
          fromPrison: fromPrisonObj?.name || transfer.fromPrison,
          toPrison: toPrisonObj?.name || transfer.toPrison
        };
      });
      
      console.log("Updated transfers with prison names:", updatedTransfers);
      setTransfers(updatedTransfers);
    }
  }, [prisons.length]);

  const handleStatusUpdate = async (transferId, newStatus) => {
    try {
      if (newStatus === "rejected" && !rejectionReason.trim()) {
        toast.error("Please provide a reason for rejection");
        return;
      }

      setIsUpdating(true);
      
      // Use the special approve-transfer endpoint for approvals to update prison populations
      if (newStatus === "approved") {
        // Get the transfer details first for UI feedback
        const transfer = transfers.find(t => t._id === transferId);
        const fromPrisonName = getPrisonName(transfer?.fromPrison);
        const toPrisonName = getPrisonName(transfer?.toPrison);
        
        try {
          // Call the dedicated approve endpoint that handles population updates
          const response = await axiosInstance.put(`/transfer/approve-transfer/${transferId}`);
          
          if (response.data?.success) {
            toast.success(`Transfer approved successfully! Prison populations updated.`);
            // Add more detailed feedback about the population changes
            toast.info(`Inmate moved from ${fromPrisonName} to ${toPrisonName}`);
            
            // Refresh the transfers list
            fetchTransfers();
          } else {
            toast.error(response.data?.error || "Failed to approve transfer");
          }
        } catch (error) {
          console.error("Error approving transfer:", error);
          toast.error(error.response?.data?.error || "Failed to approve transfer");
        }
      } else {
        // For non-approval status updates, use the regular update endpoint
        const updateData = {
          status: newStatus,
          ...(newStatus === "rejected" && { rejectionReason }),
          updatedAt: new Date().toISOString()
        };

        await axiosInstance.put(`/transfer/update-transfer/${transferId}`, updateData);
        toast.success(`Transfer request ${newStatus} successfully`);
        
        // Refresh the transfers list
        fetchTransfers();
      }
    } catch (error) {
      console.error("Error updating transfer status:", error);
      toast.error(error.response?.data?.message || "Failed to update transfer status");
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper function to get prison name from ID
  const getPrisonName = (prisonId) => {
    // If prisonId is already a name (string), return it directly
    if (typeof prisonId === 'string' && !prisonId.match(/^[0-9a-fA-F]{24}$/)) {
      return prisonId;
    }
    
    // Otherwise, try to find the prison name from the prisons array
    const prison = prisons.find(p => String(p._id) === String(prisonId));
    return prison ? (prison.name || prison.prisonName || "Unknown Prison") : prisonId;
  };

  // Sort function for transfer data
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to desc for date, asc for others
      setSortField(field);
      setSortDirection(field === "transferDate" ? "desc" : "asc");
    }
  };

  // Component to display sort icons
  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaSort className="ml-1 text-gray-400" />;
    if (sortDirection === "asc") return <FaSortUp className="ml-1 text-blue-600" />;
    return <FaSortDown className="ml-1 text-blue-600" />;
  };

  const columns = [
    {
      name: "#",
      selector: (row, index) => index + 1,
      sortable: false,
      width: "60px",
      cell: (row, index) => (
        <div className="text-sm text-gray-700 text-center">{index + 1}</div>
      ),
    },
    {
      name: "Inmate Name",
      selector: (row) => {
        const firstName = row.inmateData?.firstName || "";
        const middleName = row.inmateData?.middleName || "";
        const lastName = row.inmateData?.lastName || "";
        return `${firstName} ${middleName} ${lastName}`.trim() || "Unknown Inmate";
      },
      sortable: true,
      grow: 2,
      cell: (row) => {
        const firstName = row.inmateData?.firstName || "";
        const middleName = row.inmateData?.middleName || "";
        const lastName = row.inmateData?.lastName || "";
        const fullName = `${firstName} ${middleName} ${lastName}`.trim() || "Unknown Inmate";
        
        return (
        <div className="text-sm text-gray-900 font-medium">
            {fullName}
        </div>
        );
      },
    },
    {
      name: "From Prison",
      selector: (row) => row.fromPrison || "Unknown",
      sortable: true,
      grow: 1,
      cell: (row) => (
        <div className="text-sm text-gray-900">
          {row.fromPrison || "Unknown Prison"}
        </div>
      ),
    },
    {
      name: "To Prison",
      selector: (row) => row.toPrison || "Unknown",
      sortable: true,
      grow: 1,
      cell: (row) => (
        <div className="text-sm text-gray-900">
          {row.toPrison || "Unknown Prison"}
        </div>
      ),
    },
    {
      name: "Transfer Date",
      selector: (row) => row.transferDate,
      sortable: true,
      grow: 1,
      cell: (row) => {
        const date = new Date(row.transferDate);
        return (
          <div className="text-sm text-gray-900">
            {date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
            })}
          </div>
        );
      },
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      grow: 1,
      cell: (row) => {
        let statusColor = "bg-gray-100 text-gray-800";
        
        switch(row.status) {
          case "approved":
            statusColor = "bg-green-100 text-green-800";
            break;
          case "rejected":
            statusColor = "bg-red-100 text-red-800";
            break;
          case "in_review":
            statusColor = "bg-yellow-100 text-yellow-800";
            break;
          case "pending":
            statusColor = "bg-blue-100 text-blue-800";
            break;
          case "cancelled":
            statusColor = "bg-gray-100 text-gray-600";
            break;
        }
        
        return (
        <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor} shadow-sm`}
        >
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
        );
      },
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex space-x-2 justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click event
              setSelectedTransfer(row);
              setShowDetailsModal(true); // Open details modal, not status change
              setRejectionReason("");
            }}
            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-full transition-all duration-150 hover:shadow-md transform hover:-translate-y-1"
            title="View Details"
          >
            <FaEye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click event
              handlePrint(row);
            }}
            className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-all duration-150 hover:shadow-md transform hover:-translate-y-1"
            title="Print"
          >
            <FaPrint className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      button: true,
      width: "120px",
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#1e40af',
        backgroundImage: 'linear-gradient(to right, #1e40af, #3b82f6)',
        color: 'white',
        '&:hover': {
          backgroundColor: '#1e40af',
          backgroundImage: 'linear-gradient(to right, #1e40af, #3b82f6)',
        },
      },
    },
    headCells: {
      style: {
        fontSize: '0.875rem',
        fontWeight: '600',
        paddingLeft: '16px',
        paddingRight: '16px',
        color: 'white',
      },
    },
    rows: {
      style: {
        '&:hover': {
          backgroundColor: '#eff6ff',
          cursor: 'pointer',
        },
        borderBottomStyle: 'solid',
        borderBottomWidth: '1px',
        borderBottomColor: '#e5e7eb',
      },
      highlightOnHoverStyle: {
        backgroundColor: '#eff6ff',
        transitionDuration: '0.15s',
        outlineStyle: 'solid',
        outlineWidth: '1px',
        outlineColor: '#bfdbfe',
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
      },
    },
    pagination: {
      style: {
        borderTopStyle: 'solid',
        borderTopWidth: '1px',
        borderTopColor: '#e5e7eb',
      },
      pageButtonsStyle: {
        backgroundColor: 'transparent',
        '&:hover': {
          backgroundColor: '#eff6ff',
        },
        '&:focus': {
          outline: 'none',
          backgroundColor: '#eff6ff',
        },
      },
    },
  };

  // Helper function to get status color classes
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter transfers based on current filters
  const getFilteredTransfers = useCallback(() => {
    console.log('Filtering transfers. Status:', statusFilter, 'Prison:', prisonFilter, 'Search:', searchTerm);
    
    return transfers.filter((transfer) => {
      // Status filter
      const statusMatch = statusFilter === 'all' || transfer.status.toLowerCase() === statusFilter.toLowerCase();
      
      // Prison filter - either from or to prison matches
      let prisonMatch = true;
      if (prisonFilter !== 'all') {
        const fromMatch = String(transfer.fromPrisonId) === String(prisonFilter);
        const toMatch = String(transfer.toPrisonId) === String(prisonFilter);
        prisonMatch = fromMatch || toMatch;
        
        console.log(`Prison filter check for transfer ${transfer._id}:`, {
          prisonFilter,
          fromPrisonId: transfer.fromPrisonId,
          fromMatch,
          toPrisonId: transfer.toPrisonId,
          toMatch,
          match: prisonMatch
        });
      }
      
      // Text search
      const searchMatch = searchTerm === "" ? true :
        String(transfer.inmateData?.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(transfer.inmateData?.lastName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(transfer.fromPrison || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(transfer.toPrison || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(transfer.status || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(transfer.reason || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      return statusMatch && prisonMatch && searchMatch;
    });
  }, [statusFilter, prisonFilter, searchTerm, transfers]);

  // Apply sorting to the filtered transfers
  const sortedTransfers = [...getFilteredTransfers()].sort((a, b) => {
    let valueA, valueB;
    
    switch(sortField) {
      case "inmateData":
        valueA = `${a.inmateData?.firstName || ""} ${a.inmateData?.lastName || ""}`;
        valueB = `${b.inmateData?.firstName || ""} ${b.inmateData?.lastName || ""}`;
        break;
      case "fromPrison":
        valueA = a.fromPrison || "";
        valueB = b.fromPrison || "";
        break;
      case "toPrison":
        valueA = a.toPrison || "";
        valueB = b.toPrison || "";
        break;
      case "status":
        valueA = a.status || "";
        valueB = b.status || "";
        break;
      case "transferDate":
      default:
        try {
          valueA = a.transferDate ? new Date(a.transferDate) : new Date(0);
          valueB = b.transferDate ? new Date(b.transferDate) : new Date(0);
        } catch (e) {
          valueA = 0;
          valueB = 0;
        }
        break;
    }
    
    // Apply sort direction
    if (sortDirection === "asc") {
      if (valueA < valueB) return -1;
      if (valueA > valueB) return 1;
      return 0;
    } else {
      if (valueA > valueB) return -1;
      if (valueA < valueB) return 1;
      return 0;
    }
  });

  const handlePrint = (transfer) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Transfer Request Details</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
            .section { margin-bottom: 25px; background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .section-title { font-weight: bold; margin-bottom: 10px; color: #1e40af; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .label { font-weight: bold; color: #4b5563; }
            .value { margin-bottom: 8px; }
            .flex-container { display: flex; justify-content: space-between; flex-wrap: wrap; }
            .col { flex: 1; min-width: 250px; margin-right: 15px; }
            .status { display: inline-block; padding: 6px 12px; border-radius: 9999px; font-weight: 500; }
            .status-pending { background-color: #dbeafe; color: #1e40af; }
            .status-approved { background-color: #dcfce7; color: #166534; }
            .status-rejected { background-color: #fee2e2; color: #b91c1c; }
            .status-in_review { background-color: #fef3c7; color: #92400e; }
            .status-cancelled { background-color: #f3f4f6; color: #4b5563; }
            .reason-box { background-color: #fff; padding: 10px; border-radius: 5px; border: 1px solid #e5e7eb; }
            @media print { body { -webkit-print-color-adjust: exact; color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Transfer Request Details</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="flex-container">
            <div class="col">
          <div class="section">
                <div class="section-title">Inmate Information</div>
                <div class="value"><span class="label">Name:</span> ${transfer.inmateData?.firstName || ''} ${transfer.inmateData?.middleName || ''} ${transfer.inmateData?.lastName || ''}</div>
                <div class="value"><span class="label">ID:</span> ${transfer.inmateData?.inmateId || transfer.inmateData?.id || transfer.inmateData?._id || 'N/A'}</div>
                <div class="value"><span class="label">Gender:</span> ${transfer.inmateData?.gender || 'N/A'}</div>
                ${transfer.inmateData?.dateOfBirth ? `<div class="value"><span class="label">Date of Birth:</span> ${new Date(transfer.inmateData.dateOfBirth).toLocaleDateString()}</div>` : ''}
                ${transfer.inmateData?.age ? `<div class="value"><span class="label">Age:</span> ${transfer.inmateData.age} years</div>` : ''}
                ${transfer.inmateData?.crimeType ? `<div class="value"><span class="label">Crime Type:</span> ${transfer.inmateData.crimeType || transfer.inmateData.caseType || transfer.inmateData.crime || 'Not specified'}</div>` : ''}
          </div>
            </div>
            
            <div class="col">
          <div class="section">
                <div class="section-title">Transfer Details</div>
                <div class="value"><span class="label">From Prison:</span> ${transfer.fromPrison || 'N/A'}</div>
                <div class="value"><span class="label">To Prison:</span> ${transfer.toPrison || 'N/A'}</div>
                <div class="value"><span class="label">Transfer Date:</span> ${transfer.transferDate ? new Date(transfer.transferDate).toLocaleDateString() : 'Not set'}</div>
                <div class="value"><span class="label">Request Date:</span> ${transfer.createdAt ? new Date(transfer.createdAt).toLocaleDateString() : 'Not available'}</div>
                <div class="value">
                  <span class="label">Status:</span> 
                  <span class="status status-${transfer.status}">${transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}</span>
          </div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Transfer Reason</div>
            <div class="reason-box">${transfer.reason || 'No reason provided'}</div>
          </div>
          
          ${transfer.rejectionReason ? `
            <div class="section" style="background-color: #fee2e2; border-color: #fca5a5;">
              <div class="section-title" style="color: #b91c1c;">Rejection Reason</div>
              <div class="reason-box" style="border-color: #fca5a5;">${transfer.rejectionReason}</div>
            </div>
          ` : ''}
          
          <script>
            // Auto-print when the page loads
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const renderStatusButtons = (transfer) => {
    console.log("Rendering buttons for transfer:", transfer);
    console.log("Current status:", transfer.status);

    // For pending transfers
    if (transfer.status === "pending" || transfer.status === "Pending") {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Rejection Reason (if rejecting)</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              rows="3"
              placeholder="Enter reason for rejection..."
              disabled={isUpdating}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={() => handleStatusUpdate(transfer._id, "in_review")}
              disabled={isUpdating}
              className={`px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center ${
                isUpdating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FaClock className="mr-2" /> {isUpdating ? 'Updating...' : 'Start Review'}
            </button>
            <button
              onClick={() => handleStatusUpdate(transfer._id, "approved")}
              disabled={isUpdating}
              className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center ${
                isUpdating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FaCheck className="mr-2" /> {isUpdating ? 'Updating...' : 'Approve'}
            </button>
            <button
              onClick={() => handleStatusUpdate(transfer._id, "rejected")}
              disabled={isUpdating}
              className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center ${
                isUpdating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FaTimes className="mr-2" /> {isUpdating ? 'Updating...' : 'Reject'}
            </button>
          </div>
        </div>
      );
    }

    // For in_review transfers
    if (transfer.status === "in_review" || transfer.status === "In Review") {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Rejection Reason (if rejecting)</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              rows="3"
              placeholder="Enter reason for rejection..."
              disabled={isUpdating}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={() => handleStatusUpdate(transfer._id, "approved")}
              disabled={isUpdating}
              className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center ${
                isUpdating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FaCheck className="mr-2" /> {isUpdating ? 'Updating...' : 'Approve'}
            </button>
            <button
              onClick={() => handleStatusUpdate(transfer._id, "rejected")}
              disabled={isUpdating}
              className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center ${
                isUpdating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FaTimes className="mr-2" /> {isUpdating ? 'Updating...' : 'Reject'}
            </button>
          </div>
        </div>
      );
    }

    console.log("No buttons rendered for status:", transfer.status);
    return null;
  };

  // Add function to get image URL
  const getImageUrl = (inmate) => {
    if (!inmate?.documents?.length) return null;
    const photoUrl = inmate.documents[0];
    // If it's already a full URL (Cloudinary), return it as is
    if (photoUrl.startsWith('http')) {
      return photoUrl;
    }
    // If it's a local file, construct the URL
    return `${import.meta.env.VITE_API_URL}/uploads/${photoUrl}`;
  };

  const renderEmptyState = () => (
    <div className="w-full text-center p-10 bg-white rounded-lg shadow">
      <div className="flex flex-col items-center justify-center">
        <FaUser className="text-gray-300 text-6xl mb-4" />
        <h3 className="text-xl font-medium text-gray-700 mb-2">No Transfer Requests Found</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          {searchTerm || statusFilter !== "all" || prisonFilter !== "all"
            ? "No transfers match your criteria. Try adjusting your filters."
            : "There are no transfer requests at this time."}
        </p>
      </div>
    </div>
  );

  // Add these functions after fetchTransfers function
  const handleStatusChange = async () => {
    if (!newStatus) {
      toast.error("Please select a status");
      return;
    }

    if (newStatus === "rejected" && !rejectionReason) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      setIsUpdating(true);
      
      // Use special approve endpoint for approvals to update prison populations
      if (newStatus === "approved") {
        const fromPrisonName = getPrisonName(selectedTransfer?.fromPrison);
        const toPrisonName = getPrisonName(selectedTransfer?.toPrison);
        
        try {
          // Call the dedicated approve endpoint that handles population updates
          const response = await axiosInstance.put(`/transfer/approve-transfer/${selectedTransfer._id}`);
          
          if (response.data?.success) {
            toast.success(`Transfer approved successfully! Prison populations updated.`);
            // Add more detailed feedback about the population changes
            toast.info(`Inmate moved from ${fromPrisonName} to ${toPrisonName}`);
            
            // Refresh the transfers list
            fetchTransfers();
            
            // Close both modals
            setShowDetailsModal(false);
            setShowStatusChangeModal(false);
            setRejectionReason("");
            setNewStatus("");
          } else {
            toast.error(response.data?.error || "Failed to approve transfer");
          }
        } catch (error) {
          console.error("Error approving transfer:", error);
          toast.error(error.response?.data?.error || "Failed to approve transfer");
        }
      } else {
        // For non-approval status updates, use the regular update endpoint
        // Fix the endpoint to match the correct API path format
        const response = await axiosInstance.put(`/transfer/update-transfer/${selectedTransfer._id}`, {
          status: newStatus,
          rejectionReason: newStatus === "rejected" ? rejectionReason : "",
        });

        if (response.data && response.data.success) {
          toast.success(`Transfer status updated to ${newStatus}`);
          fetchTransfers();
          // Close both modals
          setShowDetailsModal(false);
          setShowStatusChangeModal(false);
          setRejectionReason("");
          setNewStatus("");
        } else {
          toast.error(response.data?.message || "Failed to update transfer status");
        }
      }
    } catch (error) {
      console.error("Error updating transfer status:", error);
      toast.error(error.response?.data?.message || "Failed to update transfer status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTransfer = async () => {
    try {
      setIsUpdating(true);
      // Fix the endpoint to match the correct API path format
      const response = await axiosInstance.delete(`/transfer/delete-transfer/${selectedTransfer._id}`);
      
      if (response.data && response.data.success) {
        toast.success("Transfer request deleted successfully");
        fetchTransfers();
        // Close all modals
        setShowDetailsModal(false);
        setShowStatusChangeModal(false);
        setShowDeleteConfirm(false);
      } else {
        toast.error(response.data?.message || "Failed to delete transfer request");
      }
    } catch (error) {
      console.error("Error deleting transfer:", error);
      toast.error(error.response?.data?.message || "Failed to delete transfer request");
    } finally {
      setIsUpdating(false);
    }
  };

  // Replace the calculateAge function with this improved version
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    try {
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) return null; // Invalid date
      
      const today = new Date();
      
      // Check if birthdate is in the future
      if (birthDate > today) {
        return "Invalid (future date)";
      }
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birthday hasn't occurred yet this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.error("Error calculating age:", error);
      return null;
    }
  };

  return (
    <div className={`p-4 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
      {/* Header Section with Filters - Improved layout */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6 mt-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <FaUser className="mr-2 text-blue-600" />
            Transfer Requests
          </h2>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select h-9 rounded-md border border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Prison Filter */}
            <div className="relative">
              <select
                id="prisonFilter"
                value={prisonFilter}
                onChange={(e) => setPrisonFilter(e.target.value)}
                className="p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-40"
                aria-label="Filter by prison"
              >
                <option value="all">All Prisons ({prisons.length})</option>
                {prisons && prisons.length > 0 ? (
                  prisons.map(prison => (
                    <option key={prison._id || Math.random().toString()} value={prison._id || prison.name}>
                      {prison.name || prison.prisonName || "Unknown Prison"}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading prisons...</option>
                )}
              </select>
              {prisons.length === 0 && (
                <div className="absolute -bottom-5 right-0 text-xs text-orange-500">
                  No prisons loaded
                </div>
              )}
            </div>
            
            {/* Search Box */}
            <div className="relative flex-grow sm:max-w-xs">
              <input
                type="text"
                placeholder="Search transfers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-8 pr-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Refresh Button */}
            <button 
              onClick={fetchTransfers}
              className="p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center"
              title="Refresh Transfers"
            >
              <FaSync className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <DataTable
          columns={columns}
          data={sortedTransfers}
          progressPending={loading}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50]}
          responsive
          highlightOnHover
          pointerOnHover
          noDataComponent={renderEmptyState()}
          customStyles={customStyles}
          onRowClicked={(row) => {
            setSelectedTransfer(row);
            setShowDetailsModal(true);
            setRejectionReason("");
          }}
          persistTableHead
          fixedHeader
          fixedHeaderScrollHeight="calc(100vh - 220px)"
        />
      </div>
      
      {/* Transfer Details Dialog */}
      {showDetailsModal && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Fixed Header */}
            <div className="sticky top-0 z-10 bg-white border-b flex justify-between items-center p-6 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                <FaUser className="mr-3 text-blue-600" />
                Transfer Request Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-6 flex-grow">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Inmate Photo and Basic Info */}
                <div className="lg:col-span-1">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm mb-6">
                    <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center border-b pb-2">
                      <FaUser className="mr-2 text-blue-600" />
                      Inmate Photo
                    </h4>
                    <div className="flex justify-center mb-4">
                      {selectedTransfer.inmateData?.documents?.length > 0 ? (
                        <div className="relative w-48 h-48">
                          <img
                            src={getImageUrl(selectedTransfer.inmateData)}
                            alt={`${selectedTransfer.inmateData?.firstName || 'Inmate'} ${selectedTransfer.inmateData?.lastName || ''}`}
                            className="w-full h-full rounded-lg object-cover border-4 border-white shadow-lg"
                            onError={(e) => {
                              console.log("Image failed to load, using placeholder");
                              e.target.src = "https://via.placeholder.com/200?text=No+Photo";
                              setImageError(true);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-48 h-48 rounded-lg bg-gray-200 border-4 border-white shadow-lg flex items-center justify-center">
                          <FaUser className="w-24 h-24 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Basic Inmate Info Card */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h5 className="font-semibold text-gray-700 mb-3 text-center border-b pb-2">
                        {selectedTransfer.inmateData?.firstName || 'N/A'} {selectedTransfer.inmateData?.middleName || ''} {selectedTransfer.inmateData?.lastName || ''}
                      </h5>
                      <div className="space-y-2 text-sm">
                        {(selectedTransfer.inmateData?.inmateId || selectedTransfer.inmateData?.id || selectedTransfer.inmateData?._id) && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">ID:</span>
                            <span className="text-gray-800 font-semibold">
                              {selectedTransfer.inmateData?.inmateId || 
                               selectedTransfer.inmateData?.id || 
                               selectedTransfer.inmateData?._id}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Gender:</span>
                          <span className="text-gray-800">
                            {selectedTransfer.inmateData?.gender || 'N/A'}
                          </span>
                        </div>
                        {(() => {
                          // Calculate age
                          const dateOfBirth = selectedTransfer.inmateData?.dateOfBirth || 
                                           selectedTransfer.inmateData?.birthDate;
                          const storedAge = selectedTransfer.inmateData?.age;
                          
                          if (storedAge && storedAge > 0 && storedAge < 150) {
                            return (
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">Age:</span>
                                <span className="text-gray-800">{storedAge} years</span>
                              </div>
                            );
                          }
                          
                          if (dateOfBirth) {
                            const calculatedAge = calculateAge(dateOfBirth);
                            if (calculatedAge && calculatedAge !== "Invalid (future date)") {
                              return (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-600">Age:</span>
                                  <span className="text-gray-800">{calculatedAge} years</span>
                                </div>
                              );
                            } else if (calculatedAge === "Invalid (future date)") {
                              return (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-600">Age:</span>
                                  <span className="text-gray-800 text-red-500">{calculatedAge}</span>
                                </div>
                              );
                            }
                          }
                          
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Transfer Status Card */}
                  <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h4 className="text-lg font-semibold mb-3 text-gray-800 flex items-center border-b pb-2">
                      <FaSync className="mr-2 text-blue-600" />
                      Transfer Status
                    </h4>
                    <div className="flex flex-col items-center p-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold mb-2 ${
                        selectedTransfer.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : selectedTransfer.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : selectedTransfer.status === "in_review"
                          ? "bg-yellow-100 text-yellow-800"
                          : selectedTransfer.status === "cancelled"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {selectedTransfer.status.charAt(0).toUpperCase() + selectedTransfer.status.slice(1)}
                      </span>
                      <p className="text-gray-600 text-sm text-center mt-1">
                        Last Updated: {new Date(selectedTransfer.updatedAt || selectedTransfer.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Middle and Right columns - Details */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Transfer Details Section */}
                    <div className="bg-white rounded-xl shadow-sm border p-4">
                      <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center border-b pb-2">
                        <FaPrint className="mr-2 text-blue-600" />
                        Transfer Details
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-500 block">From Prison:</span>
                          <p className="text-gray-800 font-semibold">{selectedTransfer.fromPrison || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500 block">To Prison:</span>
                          <p className="text-gray-800 font-semibold">{selectedTransfer.toPrison || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500 block">Transfer Date:</span>
                          <p className="text-gray-800">
                            {selectedTransfer.transferDate ? new Date(selectedTransfer.transferDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500 block">Request Date:</span>
                          <p className="text-gray-800">
                            {selectedTransfer.createdAt ? new Date(selectedTransfer.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'Not available'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Personal Information Section */}
                    <div className="bg-white rounded-xl shadow-sm border p-4">
                      <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center border-b pb-2">
                        <FaUser className="mr-2 text-blue-600" />
                        Personal Information
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-500 block">Date of Birth:</span>
                          <p className="text-gray-800">
                            {(() => {
                              const birthDate = selectedTransfer.inmateData?.dateOfBirth || 
                                              selectedTransfer.inmateData?.birthDate;
                              if (!birthDate) return 'Not specified';
                              
                              try {
                                const date = new Date(birthDate);
                                if (isNaN(date.getTime())) return 'Invalid date format';
                                
                                return date.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                });
                              } catch (e) {
                                return 'Error parsing date';
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Crime Information */}
                    <div className="bg-white rounded-xl shadow-sm border p-4 md:col-span-2">
                      <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center border-b pb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v12H4V4zm2 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        Crime Information
                      </h4>
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-500 block">Crime Type:</span>
                          <p className="text-gray-800 font-semibold">
                            {selectedTransfer.inmateData?.crimeType || 
                             selectedTransfer.inmateData?.caseType || 
                             selectedTransfer.inmateData?.crime ||
                             'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Transfer Reason */}
                    <div className="bg-white rounded-xl shadow-sm border p-4 md:col-span-2">
                      <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center border-b pb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Transfer Reason
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-800 whitespace-pre-line">{selectedTransfer.reason || 'No reason provided'}</p>
                      </div>
                    </div>

                    {/* Rejection Reason (if applicable) */}
                    {selectedTransfer.rejectionReason && (
                      <div className="bg-red-50 rounded-xl shadow-sm border border-red-100 p-4 md:col-span-2">
                        <h4 className="text-lg font-semibold mb-4 text-red-800 flex items-center border-b border-red-100 pb-2">
                          <FaTimes className="mr-2 text-red-600" />
                          Rejection Reason
                        </h4>
                        <div className="p-3 rounded-lg">
                          <p className="text-red-800 whitespace-pre-line">{selectedTransfer.rejectionReason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Fixed Footer with Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 z-10 shadow-md">
              <div className="flex flex-wrap justify-between items-center">
                <div className="flex space-x-3 mb-4 sm:mb-0">
                  <button
                    onClick={() => {
                      setNewStatus("");
                      setShowStatusChangeModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-sm transition-colors"
                    disabled={isUpdating}
                  >
                    <FaSync className="mr-2" /> Change Status
                  </button>
                  <button
                    onClick={() => handlePrint(selectedTransfer)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 flex items-center shadow-sm transition-colors"
                  >
                    <FaPrint className="mr-2" /> Print Details
                  </button>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center shadow-sm transition-colors"
                  disabled={isUpdating}
                >
                  <FaTimes className="mr-2" /> Delete Transfer
                </button>
              </div>
              {selectedTransfer.status === "pending" || selectedTransfer.status === "in_review" ? (
                <div className="mt-4">
                  {renderStatusButtons(selectedTransfer)}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
      
      {/* Status Change Modal */}
      {showStatusChangeModal && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Change Transfer Status</h3>
              <button
                onClick={() => setShowStatusChangeModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Status: <span className="font-bold">{selectedTransfer.status.charAt(0).toUpperCase() + selectedTransfer.status.slice(1)}</span>
              </label>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select new status</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            {newStatus === "rejected" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowStatusChangeModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={!newStatus || (newStatus === "rejected" && !rejectionReason) || isUpdating}
                className={`px-4 py-2 rounded-md text-white ${
                  !newStatus || (newStatus === "rejected" && !rejectionReason) || isUpdating
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isUpdating ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-600">Delete Transfer</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">Are you sure you want to delete this transfer request? This action will archive the transfer and it can be restored from the archive system if needed.</p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTransfer}
                disabled={isUpdating}
                className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${
                  isUpdating ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isUpdating ? "Deleting..." : "Delete Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferRequests; 