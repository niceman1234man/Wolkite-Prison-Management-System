import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSearch, FaUserPlus, FaUsers, FaFilter, FaSort } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { columns, InmateButtons } from "../../utils/InmateHelper.jsx";
import axiosInstance from "../../utils/axiosInstance";
import { useSelector, useDispatch } from "react-redux";
import { setInmate } from "../../redux/prisonSlice.js";
import AddInmate from "./Add";
import AddModal from "../Modals/AddModal";
import { toast } from "react-hot-toast";

const InmatesList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [inmates, setInmates] = useState([]);
  const [filteredInmates, setFilteredInmates] = useState([]);
  const [loading, setLoading] = useState(false);
  const inmate = useSelector((state) => state.inmate.inmate);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const fetchInmates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/inmates/allInmates");

      // Check if response.data has an inmates array
      const inmatesData = response.data?.inmates || response.data || [];
      
      if (Array.isArray(inmatesData)) {
        dispatch(setInmate(inmatesData));
        let sno = 1;
        const formattedData = inmatesData.map((inmate) => ({
          _id: inmate._id,
          sno: sno++,
          inmate_name: inmate.fullName || "N/A",
          age: inmate.age || "N/A",
          gender: inmate.gender || "N/A",
          case_type: inmate.caseType || "N/A",
          release_reason: inmate.releaseReason || "N/A",
          current_location: `${inmate.currentWereda || ""}, ${inmate.currentZone || ""}`,
          contact: inmate.phoneNumber || "N/A",
          action: <InmateButtons _id={inmate._id} onDelete={fetchInmates} />,
        }));

        setInmates(formattedData);
        setFilteredInmates(formattedData);
      } else {
        toast.error("Invalid response structure from server");
      }
    } catch (error) {
      console.error("Error fetching inmates:", error);
      if (error.response?.status === 401) {
        toast.error("Please login to continue");
        navigate("/login");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to access this resource");
      } else {
        toast.error(error.response?.data?.error || "Failed to fetch inmate data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInmates();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    applyFilters(query, filterType);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    applyFilters(searchQuery, type);
  };

  const applyFilters = (query, type) => {
    let filtered = inmates;
    
    // Apply search query
    if (query) {
      filtered = filtered.filter((inmate) =>
        inmate.inmate_name.toLowerCase().includes(query) ||
        inmate.case_type.toLowerCase().includes(query) ||
        inmate.release_reason.toLowerCase().includes(query)
      );
    }
    
    // Apply type filter
    if (type !== "all") {
      filtered = filtered.filter((inmate) => 
        inmate.case_type.toLowerCase() === type.toLowerCase()
      );
    }
    
    setFilteredInmates(filtered);
  };

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        fontWeight: 'bold',
        color: '#4b5563',
        fontSize: '0.875rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      },
    },
    rows: {
      style: {
        minHeight: '60px',
        fontSize: '0.875rem',
        borderBottom: '1px solid #f3f4f6',
        '&:hover': {
          backgroundColor: '#f9fafb',
        },
      },
    },
    pagination: {
      style: {
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
      },
    },
  };

  return (
    <div
      className={`p-6 mt-24 transition-all duration-300 ${
        isCollapsed ? "ml-16 w-[calc(100%-4rem)]" : "ml-64 w-[calc(100%-16rem)]"
      }`}
    >
      {/* Back Button */}
      <button
        className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition duration-300"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="mr-2 text-lg" /> Back
      </button>

      {/* Simplified Header */}
      <div className="mt-2 mb-2">
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-lg shadow-md p-4 text-white">
          <h2 className="text-2xl font-bold">Inmate Management</h2>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <FaUsers className="mr-2 text-teal-600" /> 
            Inmate Records
          </h3>
        </div>
        
        <div className="p-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Search Bar */}
            <div className="relative w-full md:w-1/3">
              <input
                type="text"
                placeholder="Search by name, case type, or release reason..."
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                onChange={handleSearch}
              />
              <div className="absolute left-3 top-3 text-gray-400">
                <FaSearch />
              </div>
            </div>
            
            {/* Filter & Action Buttons */}
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative group">
                <button className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors">
                  <FaFilter className="text-gray-500" />
                  <span>Filter</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
                  <div className="py-1">
                    <button 
                      onClick={() => handleFilterChange("all")}
                      className={`block px-4 py-2 text-sm w-full text-left ${filterType === "all" ? "bg-teal-50 text-teal-700" : "text-gray-700 hover:bg-gray-100"}`}
                    >
                      All Cases
                    </button>
                    <button 
                      onClick={() => handleFilterChange("criminal")}
                      className={`block px-4 py-2 text-sm w-full text-left ${filterType === "criminal" ? "bg-teal-50 text-teal-700" : "text-gray-700 hover:bg-gray-100"}`}
                    >
                      Criminal
                    </button>
                    <button 
                      onClick={() => handleFilterChange("civil")}
                      className={`block px-4 py-2 text-sm w-full text-left ${filterType === "civil" ? "bg-teal-50 text-teal-700" : "text-gray-700 hover:bg-gray-100"}`}
                    >
                      Civil
                    </button>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setOpen(true)}
                className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium px-4 py-2 rounded-lg shadow-md transition-colors duration-300 flex items-center space-x-2"
              >
                <FaUserPlus />
                <span>Add Inmate</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inmate List Table */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-gray-500">Loading inmate records...</p>
        </div>
      ) : filteredInmates.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg shadow-md text-center">
          <div className="flex flex-col items-center">
            <FaSearch className="text-4xl text-yellow-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">No Inmates Found</h3>
            <p>No inmates match your search criteria. Try adjusting your filters or search terms.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <DataTable 
              columns={columns} 
              data={filteredInmates} 
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50, 100]}
              responsive
              striped
              highlightOnHover
              customStyles={customStyles}
              sortIcon={<FaSort size={12} className="ml-1 text-gray-400" />}
              paginationComponentOptions={{
                rowsPerPageText: 'Inmates per page:',
              }}
              noDataComponent={
                <div className="p-6 text-center">
                  <p className="text-gray-500">No inmate records found</p>
                </div>
              }
            />
          </div>
        </div>
      )}

      {/* Add Modal */}
      <AddModal open={open} setOpen={setOpen}>
        <AddInmate setOpen={setOpen} onSuccess={fetchInmates} />
      </AddModal>
    </div>
  );
};

export default InmatesList;
