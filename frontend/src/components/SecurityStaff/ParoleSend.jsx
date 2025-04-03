import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSearch, FaSync, FaClipboardCheck } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { columns, InmateButtons } from "../../utils/ParoleSendHelper";
import axiosInstance from "../../utils/axiosInstance";
import { useSelector, useDispatch } from "react-redux";
import { setInmate } from "../../redux/prisonSlice.js";
import { toast } from 'react-toastify';

const ParoleSend = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [inmates, setInmates] = useState([]);
  const [filteredInmates, setFilteredInmates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
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

  const fetchInmates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/parole-tracking");
     
      if (response.data && response.data.parole) {
        // Filter only eligible inmates
        const eligibleInmates = response.data.parole.filter(inmate => inmate.paroleEligible);
        
        dispatch(setInmate(eligibleInmates));
        let sno = 1;
        const formattedData = eligibleInmates.map((parole) => ({
          _id: parole.inmateId,
          sno: sno++,
          inmate_name: parole.fullName || "N/A",
          age: parole.age || "N/A",
          gender: parole.gender || "N/A",
          sentence: parole.caseType || "N/A",
          status: parole.status || "N/A",
          action: <InmateButtons _id={parole.inmateId} onDelete={fetchInmates} status={parole.status} />,
        }));

        setInmates(formattedData);
        setFilteredInmates(formattedData);
      } else {
        console.error("Invalid API response:", response);
        toast.error("Failed to fetch eligible inmates");
      }
    } catch (error) {
      console.error("Error fetching inmates:", error);
      toast.error(error.response?.data?.error || "Failed to fetch inmate data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInmates();
  }, []);

  // Enhance columns with status styling
  const enhancedColumns = columns.map(col => {
    if (col.name === "Status") {
      return {
        ...col,
        cell: row => {
          let statusClass = "";
          switch (row.status.toLowerCase()) {
            case "pending":
              statusClass = "bg-yellow-100 text-yellow-800 border border-yellow-200";
              break;
            case "accepted":
              statusClass = "bg-green-100 text-green-800 border border-green-200";
              break;
            case "rejected":
              statusClass = "bg-red-100 text-red-800 border border-red-200";
              break;
            default:
              statusClass = "bg-gray-100 text-gray-800 border border-gray-200";
          }
          return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}`}>
              {row.status}
            </span>
          );
        }
      };
    }
    return col;
  });

  // Instant Search
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
    let result = inmates;
    
    // Apply search filter
    if (query) {
      result = result.filter((inmate) =>
        (inmate.inmate_name?.toLowerCase() || "").includes(query) || 
        (inmate.status?.toLowerCase() || "").includes(query)
      );
    }
    
    // Apply status filter
    if (status !== "all") {
      result = result.filter((inmate) => 
        inmate.status.toLowerCase() === status.toLowerCase()
      );
    }
    
    setFilteredInmates(result);
  };

  return (
    <div className={`p-6 transition-all duration-300 mt-10 ${isCollapsed ? "ml-16" : "ml-64"}`}>
      {/* Header with back button */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <button
          className="flex items-center text-gray-600 hover:text-gray-900 pr-4"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft className="mr-2" />
          <span className="text-sm font-medium">Back</span>
        </button>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaClipboardCheck className="text-teal-600 mr-3" />
            Eligible Parole Requests
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-8">
            Review and manage inmates eligible for parole consideration
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by inmate name or status..."
              className="pl-10 pr-4 py-2.5 block w-full border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          {/* Refresh Button */}
          <button
            className="p-2.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center"
            onClick={() => {
              fetchInmates();
              toast.info("Refreshing data...");
            }}
            title="Refresh data"
          >
            <FaSync />
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
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
            All Requests
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
          </button>
          <button
            onClick={() => filterByStatus("accepted")}
            className={`inline-flex items-center py-3 px-4 text-sm font-medium border-b-2 ${
              activeFilter === "accepted"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Accepted
          </button>
          <button
            onClick={() => filterByStatus("rejected")}
            className={`inline-flex items-center py-3 px-4 text-sm font-medium border-b-2 ${
              activeFilter === "rejected"
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Rejected
          </button>
        </nav>
      </div>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          Showing {filteredInmates.length} {filteredInmates.length === 1 ? 'inmate' : 'inmates'}
          {activeFilter !== "all" ? ` with status "${activeFilter}"` : ''}
          {searchTerm ? ` matching "${searchTerm}"` : ''}
        </p>
      </div>

      {/* Table with data */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 flex justify-center">
          <div className="text-center">
            <FaSync className="animate-spin text-teal-600 text-2xl mx-auto mb-4" />
            <p className="text-gray-600">Loading eligible inmates...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          {filteredInmates.length > 0 ? (
            <DataTable 
              columns={enhancedColumns} 
              data={filteredInmates} 
              pagination 
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50, 100]}
              customStyles={customStyles}
              noDataComponent={
                <div className="py-8 text-center">
                  <p className="text-gray-500 text-lg font-medium">No inmates found</p>
                  <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              }
            />
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <FaClipboardCheck className="text-gray-400 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-700">No eligible inmates found</h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                {activeFilter !== "all" || searchTerm 
                  ? "Try adjusting your search criteria or filters" 
                  : "There are currently no inmates eligible for parole consideration"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParoleSend;
