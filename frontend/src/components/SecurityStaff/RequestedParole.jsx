import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import axiosInstance from "../utils/axiosInstance";
import { ParoleButtons } from "../utils/ParoleHelper";
import { useSelector } from "react-redux";
import { FaSearch, FaSync, FaFilter, FaClipboardList, FaDownload, FaSpinner, FaBarcode } from "react-icons/fa";
import { toast } from "react-toastify";

const RequestedParole = () => {
  const [inmates, setInmates] = useState([]);
  const [filteredInmates, setFilteredInmates] = useState([]);
  const [loadingInmates, setLoadingInmates] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get the collapsed state of the sidebar
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  
  // Generate reference number
  const generateReferenceNumber = (id, name) => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Extract initials from name
    const initials = name
      .split(' ')
      .map(part => part.charAt(0))
      .join('');
    
    // Last 4 characters of the ID
    const idSuffix = id.slice(-4);
    
    // Random 3-digit number
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `PR${year}${month}${day}-${initials}${idSuffix}-${random}`;
  };
  
  // Custom styles for DataTable
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f9fafb',
        fontSize: '0.875rem',
        color: '#374151',
        fontWeight: '600',
        minHeight: '3rem',
        borderBottomWidth: '1px',
        borderBottomColor: '#e5e7eb',
      },
    },
    rows: {
      style: {
        fontSize: '0.875rem',
        fontWeight: '400',
        color: '#1f2937',
        minHeight: '3rem',
        '&:not(:last-of-type)': {
          borderBottomStyle: 'solid',
          borderBottomWidth: '1px',
          borderBottomColor: '#f3f4f6',
        },
        '&:hover': {
          backgroundColor: '#f9fafb',
        },
      },
    },
    pagination: {
      style: {
        fontSize: '0.875rem',
        fontWeight: '400',
        color: '#4b5563',
        borderTopStyle: 'solid',
        borderTopWidth: '1px',
        borderTopColor: '#e5e7eb',
      },
    },
  };

  // Define new columns with auto-numbering and reference number
  const columns = [
    {
      name: "S.No",
      selector: row => row.sno,
      sortable: true,
      width: "70px",
    },
    {
      name: "Reference Number",
      selector: row => row.referenceNumber,
      sortable: true,
      cell: row => (
        <div className="flex items-center">
          <FaBarcode className="mr-2 text-gray-400" />
          <span className="font-mono text-xs">{row.referenceNumber}</span>
        </div>
      ),
    },
    {
      name: "Inmate Name",
      selector: row => row.inmate_name,
      sortable: true,
      grow: 2,
    },
    {
      name: "Age",
      selector: row => row.age,
      sortable: true,
      width: "80px",
    },
    {
      name: "Gender",
      selector: row => row.gender,
      sortable: true,
      width: "100px",
    },
    {
      name: "Status",
      selector: row => row.sentence,
      sortable: true,
      cell: row => {
        let statusClass = "";
        switch (row.sentence?.toLowerCase()) {
          case "pending":
            statusClass = "bg-yellow-100 text-yellow-800 border border-yellow-200";
            break;
          case "active":
            statusClass = "bg-green-100 text-green-800 border border-green-200";
            break;
          case "revoked":
            statusClass = "bg-red-100 text-red-800 border border-red-200";
            break;
          default:
            statusClass = "bg-gray-100 text-gray-800 border border-gray-200";
        }
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}`}>
            {row.sentence}
          </span>
        );
      },
    },
    {
      name: "Actions",
      cell: row => row.action,
      button: true,
      width: "150px",
    },
  ];

  // Fetch all inmates from the backend
  const fetchInmates = async () => {
    setLoadingInmates(true);
    try {
      const response = await axiosInstance.get("/inmates/allInmates");

      if (response.data && response.data?.inmates) {
        let sno = 1;
        const formattedData = response.data.inmates.map((inmate) => {
          const fullName = `${inmate.firstName} ${inmate.middleName || ""} ${inmate.lastName}`.trim();
          
          // Generate reference number if not present
          const refNumber = inmate.referenceNumber || generateReferenceNumber(inmate._id, fullName);
          
          return {
            _id: inmate._id,
            sno: sno++, // Auto-increment serial number
            referenceNumber: refNumber,
            inmate_name: fullName || "N/A",
            age: inmate.age || "N/A",
            gender: inmate.gender || "N/A",
            sentence: inmate.caseType || "N/A",
            action: <ParoleButtons _id={inmate._id} onDelete={fetchInmates} referenceNumber={refNumber} />,
          };
        });

        setInmates(formattedData);
        setFilteredInmates(formattedData);
      } else {
        console.error("Invalid API response:", response);
        toast.error("Failed to load inmate data");
      }
    } catch (error) {
      console.error("Error fetching inmates:", error);
      toast.error(error.response?.data?.error || "Failed to fetch inmate data.");
    } finally {
      setLoadingInmates(false);
    }
  };

  useEffect(() => {
    fetchInmates();
  }, [refreshKey]);

  // Handle search
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchTerm(query);
    applyFilters(query, activeFilter);
  };

  // Filter by status
  const filterByStatus = (status) => {
    setActiveFilter(status);
    applyFilters(searchTerm, status);
  };

  // Apply both filters
  const applyFilters = (query, status) => {
    let result = [...inmates];
    
    // Apply search filter
    if (query) {
      result = result.filter((inmate) =>
        inmate.inmate_name.toLowerCase().includes(query) ||
        inmate.referenceNumber.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (status !== "all") {
      result = result.filter((inmate) => 
        inmate.sentence.toLowerCase() === status.toLowerCase()
      );
    }
    
    setFilteredInmates(result);
  };

  // Export to CSV
  const exportCSV = () => {
    const headers = ["S.No", "Reference Number", "Inmate Name", "Age", "Gender", "Status"];
    
    const csvData = filteredInmates.map(inmate => [
      inmate.sno,
      inmate.referenceNumber,
      inmate.inmate_name,
      inmate.age,
      inmate.gender,
      inmate.sentence
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "parole_applications.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Count inmates by status
  const getStatusCount = (status) => {
    if (status === "all") return inmates.length;
    return inmates.filter(inmate => 
      inmate.sentence.toLowerCase() === status.toLowerCase()
    ).length;
  };

  return (
    <div
      className={`p-6 transition-all duration-300 ${
        isCollapsed ? "ml-16" : "ml-64"
      }`}
    >
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaClipboardList className="text-teal-600 mr-3" />
            Parole Applications
          </h1>
        </div>
        <p className="text-gray-500 ml-8">
          Review and manage inmate parole applications with unique reference numbers
        </p>
      </div>

      {/* Status Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex flex-wrap -mb-px">
          <button
            onClick={() => filterByStatus("all")}
            className={`inline-flex items-center py-3 px-4 text-sm font-medium border-b-2 ${
              activeFilter === "all"
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Applications
            <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {getStatusCount("all")}
            </span>
          </button>
          <button
            onClick={() => filterByStatus("pending")}
            className={`inline-flex items-center py-3 px-4 text-sm font-medium border-b-2 ${
              activeFilter === "pending"
                ? "border-yellow-500 text-yellow-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Pending
            <span className="ml-2 bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full text-xs">
              {getStatusCount("pending")}
            </span>
          </button>
          <button
            onClick={() => filterByStatus("active")}
            className={`inline-flex items-center py-3 px-4 text-sm font-medium border-b-2 ${
              activeFilter === "active"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Active
            <span className="ml-2 bg-green-100 text-green-600 px-2 py-0.5 rounded-full text-xs">
              {getStatusCount("active")}
            </span>
          </button>
          <button
            onClick={() => filterByStatus("revoked")}
            className={`inline-flex items-center py-3 px-4 text-sm font-medium border-b-2 ${
              activeFilter === "revoked"
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Revoked
            <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
              {getStatusCount("revoked")}
            </span>
          </button>
        </nav>
      </div>

      {/* Search and Action Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or reference number..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              className="p-2 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => {
                setRefreshKey(prev => prev + 1);
                toast.info("Refreshing parole data...");
              }}
              title="Refresh data"
            >
              <FaSync />
            </button>
            
            <button
              className="p-2 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-full transition-colors"
              onClick={exportCSV}
              title="Export to CSV"
            >
              <FaDownload />
            </button>
            
            {activeFilter !== "all" && (
              <button
                className="flex items-center px-3 py-1.5 text-sm bg-teal-50 text-teal-700 rounded-md hover:bg-teal-100"
                onClick={() => {
                  setActiveFilter("all");
                  applyFilters(searchTerm, "all");
                }}
              >
                <FaFilter className="mr-1.5 text-xs" />
                Clear Filter
              </button>
            )}
          </div>
        </div>
        
        {/* Active filters display */}
        {(activeFilter !== "all" || searchTerm) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilter !== "all" && (
              <span className={`text-xs flex items-center px-2 py-1 rounded-full
                ${activeFilter === "pending" ? "bg-yellow-100 text-yellow-800" :
                  activeFilter === "active" ? "bg-green-100 text-green-800" :
                  activeFilter === "revoked" ? "bg-red-100 text-red-800" : ""}`}
              >
                <FaFilter className="mr-1" />
                Status: {activeFilter}
              </span>
            )}
            
            {searchTerm && (
              <span className="text-xs flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                <FaSearch className="mr-1" />
                Search: "{searchTerm}"
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Reference Number Info */}
      <div className="bg-teal-50 p-3 rounded-lg border border-teal-100 mb-4 flex items-start">
        <FaBarcode className="text-teal-600 mr-2 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-teal-800">
            <span className="font-medium">Reference Numbers</span> are automatically generated for each parole application in the format:
          </p>
          <p className="text-xs text-teal-700 mt-1">
            <code className="bg-white px-1 py-0.5 rounded font-mono">PR[Date]-[Initials+ID]-[Random]</code> e.g., <code className="bg-white px-1 py-0.5 rounded font-mono">PR230615-JD1234-789</code>
          </p>
        </div>
      </div>
      
      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Showing {filteredInmates.length} {filteredInmates.length === 1 ? 'inmate' : 'inmates'}
          {activeFilter !== "all" ? ` with status "${activeFilter}"` : ''}
          {searchTerm ? ` matching "${searchTerm}"` : ''}
        </p>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
        {loadingInmates ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <FaSpinner className="animate-spin text-teal-600 text-2xl mb-3" />
              <p className="text-gray-500">Loading parole applications...</p>
            </div>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredInmates} 
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            customStyles={customStyles}
            noDataComponent={
              <div className="p-10 text-center text-gray-500">
                <FaClipboardList className="text-gray-300 text-4xl mx-auto mb-3" />
                <p className="text-lg font-medium">No parole applications found</p>
                <p className="text-sm mt-2">
                  {activeFilter !== "all" || searchTerm 
                    ? "Try changing your search or filter criteria" 
                    : "There are currently no applications in the system"}
                </p>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
};

export default RequestedParole;