import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { columns, UserButtons } from "../../utils/CourtHelper";
import axiosInstance from "@/utils/axiosInstance";
import { FaSearch, FaFilter, FaGavel, FaArrowLeft, FaFileAlt } from "react-icons/fa";
import { useSelector } from "react-redux";
const InstructionList = () => {
  const navigate = useNavigate();
  const [instructions, setInstructions] = useState([]);
  const [filteredInstructions, setFilteredInstructions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  useEffect(() => {
    fetchInstructions();
  }, []);

  const fetchInstructions = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/instruction/allInstruction");
      if (response.data && response.data.instructions) {
        let Uno = 1;
        
        const data = response.data.instructions.map((instruct) => ({
          U_no: Uno++,
          _id: instruct._id,
          courtCaseNumber: instruct.courtCaseNumber || "N/A",
          prisonName: instruct.prisonName || "N/A",
          judgeName: instruct.judgeName || "N/A",
          verdict: instruct.verdict || "N/A",
          instructions: instruct.instructions || "N/A",
          hearingDate: instruct.hearingDate ? new Date(instruct.hearingDate).toLocaleDateString() : "N/A",
          effectiveDate: instruct.effectiveDate ? new Date(instruct.effectiveDate).toLocaleDateString() : "N/A",
          sendDate: instruct.sendDate ? new Date(instruct.sendDate).toLocaleDateString() : "N/A",
          action: <UserButtons _id={instruct._id} />,
        }));

        setInstructions(data);
        setFilteredInstructions(data);
      } else {
        console.error("Unexpected data format:", response.data);
        setInstructions([]);
        setFilteredInstructions([]);
      }
    } catch (error) {
      console.error("Error fetching instructions:", error);
      setInstructions([]);
      setFilteredInstructions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    if (!query) {
      applyFilter(activeFilter);
      return;
    }
    
    const filtered = instructions.filter(
      (instruct) =>
        instruct.courtCaseNumber.toLowerCase().includes(query) ||
        instruct.prisonName.toLowerCase().includes(query) ||
        instruct.judgeName.toLowerCase().includes(query)
    );
    
    setFilteredInstructions(filtered);
  };

  const applyFilter = (filterType) => {
    setActiveFilter(filterType);
    
    if (filterType === "all") {
      setFilteredInstructions(instructions);
      return;
    }
    
    const filtered = instructions.filter(
      (instruct) => instruct.verdict?.toLowerCase() === filterType.toLowerCase()
    );
    
    setFilteredInstructions(filtered);
  };

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        fontWeight: 'bold',
        color: '#475569',
      },
    },
    rows: {
      style: {
        minHeight: '60px',
        fontSize: '0.875rem',
        '&:hover': {
          backgroundColor: '#f1f5f9',
        },
      },
    },
    pagination: {
      style: {
        borderTop: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
      },
    },
  };

  return (
    <div className={`p-4 md:p-6 transition-all duration-300 mt-10 ${
      isCollapsed ? "ml-16" : "ml-64"
    }`}>
      {/* Back Button */}
      <button
        className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition duration-300 mb-6"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="mr-2 text-lg" /> Back
      </button>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg shadow-lg p-6 text-white relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 opacity-10">
          <FaGavel size={150} className="transform -translate-y-8 translate-x-8" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-1">Court Instructions Management</h2>
          <p className="text-blue-100 max-w-2xl opacity-90">
            Review and process court instructions for inmate management and case tracking.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-5 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Search */}
          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              onChange={handleSearch}
              placeholder="Search by case number, prison, or judge name..."
              className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-3 text-gray-400">
              <FaSearch />
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-md flex items-center transition ${
                activeFilter === "all" 
                  ? "bg-gray-700 text-white" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => applyFilter("all")}
            >
              <FaFilter className="mr-2" /> All
            </button>
            <button
              className={`px-4 py-2 rounded-md flex items-center transition ${
                activeFilter === "guilty" 
                  ? "bg-red-600 text-white" 
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
              onClick={() => applyFilter("guilty")}
            >
              <FaGavel className="mr-2" /> Guilty
            </button>
            <button
              className={`px-4 py-2 rounded-md flex items-center transition ${
                activeFilter === "not_guilty" 
                  ? "bg-green-600 text-white" 
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
              onClick={() => applyFilter("not_guilty")}
            >
              <FaGavel className="mr-2" /> Not Guilty
            </button>
          </div>
        </div>
      </div>
      
      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-3 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <FaFileAlt className="mr-2 text-blue-500" /> 
            Court Instructions
          </h3>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-gray-600">Loading instructions...</p>
          </div>
        ) : filteredInstructions.length === 0 ? (
          <div className="text-center p-10 text-gray-500">
            <FaFileAlt className="mx-auto text-4xl mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Instructions Found</h3>
            <p>There are no court instructions matching your criteria.</p>
          </div>
        ) : (
          <div className="p-5">
            <DataTable
              columns={columns}
              data={filteredInstructions}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50]}
              customStyles={customStyles}
              highlightOnHover
              striped
              responsive
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructionList;
