import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { useSelector } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";
import { FaArrowLeft, FaSearch, FaTimes, FaTrash, FaExclamationTriangle } from "react-icons/fa";
import AddPrison from "./AddPrison";
import EditPrison from "./EditPrison";
import AddModal from "../Modals/AddModal";
import { toast } from "react-toastify";

const customStyles = {
  headCells: {
    style: {
      backgroundColor: "#1e3a8a", // Darker blue
      color: "white",
      fontWeight: "bold",
      fontSize: "14px",
      textTransform: "uppercase",
      paddingLeft: "16px",
      paddingRight: "16px"
    },
  },
  rows: {
    style: {
      fontSize: "14px",
      fontWeight: "400",
      color: "rgb(55, 65, 81)",
      minHeight: "60px",
      "&:hover": {
        backgroundColor: "#f0f9ff", // Light blue on hover
        cursor: "pointer",
        transition: "background-color 0.2s ease-in-out",
      },
      "&:nth-of-type(odd)": {
        backgroundColor: "#f9fafb", // Light gray for odd rows
      },
    },
  },
  cells: {
    style: {
      paddingLeft: "16px",
      paddingRight: "16px",
      paddingTop: "12px",
      paddingBottom: "12px",
    },
  },
  table: {
    style: {
      width: '100%', // Ensure table takes up full width
      tableLayout: 'fixed', // Fixed table layout for better column distribution
    },
  },
  pagination: {
    style: {
      borderTopStyle: "solid",
      borderTopWidth: "1px",
      borderTopColor: "#e5e7eb",
      backgroundColor: "#f9fafb",
      padding: "16px",
    },
    pageButtonsStyle: {
      borderRadius: "0.375rem",
      height: "32px",
      minWidth: "32px",
      margin: "0 4px",
    },
  },
};

const PrisonsList = () => {
  const [prisons, setPrisons] = useState([]);
  const [filteredPrisons, setFilteredPrisons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPrisonId, setSelectedPrisonId] = useState(null);
  const [prisonToDelete, setPrisonToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchError, setSearchError] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [processingDelete, setProcessingDelete] = useState(false);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const navigate = useNavigate();

  // Add a sort state
  const [sortInfo, setSortInfo] = useState({
    column: "prison_name",
    direction: "asc"
  });

  // Create full columns array inside the component to access functions
  const tableColumns = [
    {
      name: "#",
      selector: (row, index) => index + 1,
      sortable: false,
      width: "60px", // Keep fixed width for the number column
      cell: (row, index) => (
        <div className="bg-gray-100 h-8 w-8 rounded-full flex items-center justify-center font-medium text-gray-700">
          {index + 1}
        </div>
      ),
    },
    {
      name: "Prison Name",
      selector: (row) => row.prison_name,
      sortable: true,
      grow: 3, // Increased weight for prison name
    },
    {
      name: "Location",
      selector: (row) => row.location,
      sortable: true,
      grow: 2, // Same weight for location
    },
    {
      name: "Current Population",
      selector: (row) => row.current_population,
      sortable: true,
      grow: 2, // Decreased from 3 to 2
      cell: (row) => {
        // Convert to number and handle all falsy values
        const population = Number(row.current_population);
        const capacity = Number(row.capacity);
        
        // Get occupancy percentage directly from the normalized data
        const occupancyPercent = row.occupancyPercent || 0;
        
        let textColor = "text-gray-800"; // Default
        let progressColor = "bg-green-500"; // Default color
        
        if (occupancyPercent >= 90) {
          textColor = "text-red-600"; // Near capacity or over
          progressColor = "bg-red-500";
        } else if (occupancyPercent >= 75) {
          textColor = "text-orange-600"; // Getting full
          progressColor = "bg-orange-500";
        } else if (occupancyPercent >= 50) {
          textColor = "text-blue-600"; // Moderate
          progressColor = "bg-blue-500";
        }
        
        return (
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-center">
              <span className={`font-medium ${textColor}`}>
                {isNaN(population) ? "0" : population}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                {capacity > 0 ? `of ${capacity}` : ""}
              </span>
            </div>
            
            {/* Progress bar - show for all prisons with population */}
            {(occupancyPercent > 0 || population > 0) && (
              <div className="mt-1 w-full">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${progressColor} h-2 rounded-full`} 
                    style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {population > 0 ? 
                    `${occupancyPercent}% occupied` : 
                    "No inmates"
                  }
                </span>
              </div>
            )}
            
            {/* Show message when no capacity set but has inmates */}
            {capacity === 0 && population > 0 && (
              <span className="text-xs text-yellow-500 mt-1">
                Capacity not set ({population} inmates)
              </span>
            )}
            
            {/* Show message when no data */}
            {capacity === 0 && population === 0 && (
              <span className="text-xs text-gray-500 mt-1">
                No data available
              </span>
            )}
          </div>
        );
      },
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row._id)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
          >
            Edit
          </button>
          <button
            onClick={() => {
              setPrisonToDelete(row._id);
              setDeleteModalOpen(true);
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
          >
            Delete
          </button>
        </div>
      ),
      grow: 1.5,
      minWidth: "180px", // Increased from 150px
    },
  ];

  const fetchPrisons = async (retryCount = 0) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/prison/getall-prisons");
      if (response.data?.success) {
        console.log("Fetched prisons:", response.data.prisons);
        
        // Normalize the data - ensure numbers are numbers and statuses are lowercase
        const normalizedPrisons = response.data.prisons.map(prison => {
          // Parse current_population with fallback to 0
          let currentPopulation = 0;
          if (prison.current_population !== undefined && prison.current_population !== null) {
            currentPopulation = Number(prison.current_population);
            if (isNaN(currentPopulation)) currentPopulation = 0;
          }
          
          // Parse capacity with fallback to 0
          let capacity = 0;
          if (prison.capacity !== undefined && prison.capacity !== null) {
            capacity = Number(prison.capacity);
            if (isNaN(capacity)) capacity = 0;
          }
          
          // Calculate occupancy percentage for sorting/filtering
          const occupancyPercent = capacity > 0 ? Math.round((currentPopulation / capacity) * 100) : 0;
          
          // Create a clean, minimal representation of prison data
          return {
            _id: prison._id,
            prison_name: prison.prison_name || "",
            location: prison.location || "",
            description: prison.description || "",
            capacity: capacity,
            current_population: currentPopulation,
            status: (prison.status?.toLowerCase() || "active"),
            occupancyPercent: occupancyPercent
          };
        });
        
        console.log("Normalized prisons:", normalizedPrisons);
        setPrisons(normalizedPrisons);
        setFilteredPrisons(normalizedPrisons);
      }
    } catch (error) {
      console.error("Error fetching prisons:", error);
      toast.error("Failed to fetch prison data");
      
      // Implement retry logic (max 2 retries)
      if (retryCount < 2) {
        console.log(`Retrying fetch (${retryCount + 1}/2) after 1 second...`);
        setTimeout(() => {
          fetchPrisons(retryCount + 1);
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrisons();
    
    // Add event listener for prison updates and population changes
    const handlePrisonsUpdated = () => {
      console.log("Prisons updated event received, refreshing list");
      // Add a delay to ensure the server has processed the update
      setTimeout(() => {
        fetchPrisons();
      }, 1000); // Increased to 1 second
    };
    
    const handlePopulationChanged = () => {
      console.log("Prison population changed, refreshing list");
      setTimeout(() => {
        fetchPrisons();
      }, 500);
    }
    
    window.addEventListener('prisonsUpdated', handlePrisonsUpdated);
    window.addEventListener('prisonPopulationChanged', handlePopulationChanged);
    
    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener('prisonsUpdated', handlePrisonsUpdated);
      window.removeEventListener('prisonPopulationChanged', handlePopulationChanged);
    };
  }, []);

  const handleEdit = async (id) => {
    try {
      // Set the selected prison ID and open the edit modal
      setSelectedPrisonId(id);
      setEditOpen(true);
    } catch (error) {
      console.error("Error preparing to edit:", error);
      toast.error("Failed to prepare edit form");
    }
  };

  const handleDelete = async (id) => {
    setProcessingDelete(true);
    setDeleteError("");

    // Validate confirmation text
    if (deleteConfirmText.toLowerCase() !== "delete") {
      setDeleteError("Please type 'delete' to confirm");
      setProcessingDelete(false);
      return;
    }

    try {
      // First check if the prison still has inmates
      const prison = prisons.find(p => p._id === id);
      if (prison) {
        const currentPopulation = Number(prison.current_population || 0);
        if (currentPopulation > 0) {
          setDeleteError(`Cannot delete prison with ${currentPopulation} inmates. Transfer all inmates first.`);
          setProcessingDelete(false);
          return;
        }
      }

      const response = await axiosInstance.delete(`/prison/${id}`);
      
      if (response.data?.success) {
        toast.success("Prison deleted successfully");
        // Clean up modal state first
        setDeleteModalOpen(false);
        setPrisonToDelete(null);
        setDeleteConfirmText("");
        // Then fetch prisons with a small delay to ensure server processing
        setTimeout(() => {
          fetchPrisons();
        }, 500);
      }
    } catch (error) {
      console.error("Error deleting prison:", error);
      setDeleteError(error.response?.data?.error || "Failed to delete prison");
      toast.error(error.response?.data?.error || "Failed to delete prison");
    } finally {
      setProcessingDelete(false);
    }
  };

  const filterPrisons = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchTerm(query);
    
    // Validate search term
    if (query.length > 0 && query.length < 2) {
      setSearchError("Search term must be at least 2 characters");
      return;
    }
    
    if (/[^a-zA-Z0-9\s\-_.()]/.test(query)) {
      setSearchError("Search contains invalid characters");
      return;
    }
    
    setSearchError("");
    
    const filtered = prisons.filter(
      (prison) =>
        prison.prison_name.toLowerCase().includes(query) ||
        prison.location.toLowerCase().includes(query)
    );
    setFilteredPrisons(filtered);
  };

  // Function to prepare for prison deletion
  const confirmDelete = (prisonId) => {
    const prison = prisons.find(p => p._id === prisonId);
    if (!prison) {
      toast.error("Prison not found");
      return;
    }
    
    // Convert population to a number for checking
    const currentPopulation = Number(prison.current_population || 0);
    
    // Don't allow deletion if prison has inmates
    if (currentPopulation > 0) {
      toast.error(`Cannot delete ${prison.prison_name} - It has ${currentPopulation} inmates. Transfer all inmates first.`);
      return;
    }
    
    setPrisonToDelete(prisonId);
    setDeleteModalOpen(true);
    setDeleteConfirmText("");
    setDeleteError("");
  };

  // Handle sorting function
  const handleSort = (column) => {
    const direction = sortInfo.column === column && sortInfo.direction === "asc" ? "desc" : "asc";
    setSortInfo({ column, direction });
    
    // Sort the prisons by the selected column
    const sorted = [...filteredPrisons].sort((a, b) => {
      // Special case for occupancy percentage
      if (column === "occupancyPercent") {
        return direction === "asc" ? 
          a.occupancyPercent - b.occupancyPercent : 
          b.occupancyPercent - a.occupancyPercent;
      }
      
      // For string values like prison_name, location
      if (typeof a[column] === "string") {
        return direction === "asc" ?
          a[column].localeCompare(b[column]) :
          b[column].localeCompare(a[column]);
      }
      
      // For numeric values
      return direction === "asc" ?
        a[column] - b[column] :
        b[column] - a[column];
    });
    
    setFilteredPrisons(sorted);
  };

  return (
    <div className="flex">
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      />
      <div className="flex-1 relative min-h-screen">
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex flex-wrap items-center justify-between transition-all duration-300 ml-2 gap-4 ${
            isCollapsed
              ? "left-16 w-[calc(100%-5rem)]"
              : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          <button
            className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition duration-300 mr-4"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="mr-2 text-lg" /> Back
          </button>
          <div className="flex-1" />
          <div className="relative flex flex-col items-center w-72 md:w-1/3 mr-4">
            <div className="w-full relative">
              <FaSearch className="absolute left-3 text-gray-500 top-3" />
              <input
                type="text"
                placeholder="Search by prison name or location"
                className={`h-10 px-4 py-2 border ${searchError ? 'border-red-500' : 'border-gray-300'} rounded-md w-full pl-10`}
                onChange={filterPrisons}
                value={searchTerm}
              />
            </div>
            {searchError && (
              <p className="text-red-500 text-xs mt-1 self-start">{searchError}</p>
            )}
          </div>
          <button
            onClick={() => setOpen(true)}
            className="h-10 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center justify-center min-w-[150px] md:w-auto"
          >
            Add New Prison
          </button>
        </div>
        <div className="p-6 mt-32">
          {/* <h2 className="text-2xl font-bold text-gray-800 mb-4">Prison List</h2> */}
          {loading ? (
            <div className="text-center text-gray-600">Loading Prisons...</div>
          ) : (
            <>
              {filteredPrisons.length === 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        No prisons found matching your search criteria.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <DataTable
                  columns={tableColumns}
                  data={filteredPrisons}
                  pagination
                  paginationPerPage={10}
                  paginationRowsPerPageOptions={[5, 10, 15, 20, 25]}
                  className="shadow-lg rounded-lg overflow-hidden"
                  customStyles={customStyles}
                  responsive
                  highlightOnHover
                  striped
                  subHeaderWrap
                  fixedHeader
                  fixedHeaderScrollHeight="calc(100vh - 250px)"
                  noDataComponent={
                    <div className="p-6 text-center text-gray-600">
                      No prison records found
                    </div>
                  }
                  onSort={handleSort}
                  sortServer={false}
                />
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Add Prison Modal */}
      <AddModal open={open} setOpen={setOpen}>
        <AddPrison setOpen={setOpen} />
      </AddModal>
      
      {/* Edit Prison Modal */}
      <AddModal open={editOpen} setOpen={setEditOpen}>
        <EditPrison setOpen={setEditOpen} id={selectedPrisonId} />
      </AddModal>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Confirm Deletion</h3>
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setPrisonToDelete(null);
                    setDeleteConfirmText("");
                    setDeleteError("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <div className="mb-6">
                <p className="text-red-600 font-semibold mb-2">
                  Warning: This action cannot be undone.
                </p>
                <p className="text-gray-600 mb-4">
                  To confirm deletion, please type <strong>delete</strong> below:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className={`w-full p-2 border ${deleteError ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="Type 'delete' to confirm"
                />
                {deleteError && (
                  <p className="text-red-500 text-sm mt-1">{deleteError}</p>
                )}
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setPrisonToDelete(null);
                    setDeleteConfirmText("");
                    setDeleteError("");
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(prisonToDelete)}
                  disabled={deleteConfirmText.toLowerCase() !== "delete" || processingDelete}
                  className={`px-4 py-2 bg-red-600 text-white rounded-lg font-medium flex items-center ${
                    deleteConfirmText.toLowerCase() !== "delete" || processingDelete
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-red-700"
                  }`}
                >
                  {processingDelete ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaTrash className="mr-2" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrisonsList;
