import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";
import { setIncident } from "../../redux/incidentSlice";
import { FaArrowLeft, FaSearch, FaExclamationTriangle, FaHistory } from "react-icons/fa";
import AddModal from "../Modals/AddModal";
import Add from "./Add";
import UpdateIncident from "./UpdateIncident";
import ViewIncident from "./ViewIncident";

const customStyles = {
  headCells: {
    style: {
      backgroundColor: "#20B2AA",
      color: "#FFFFFF",
      fontWeight: "bold",
      fontSize: "14px",
      textTransform: "uppercase",
    },
  },
  rows: {
    style: {
      "&:hover": {
        backgroundColor: "#E0F2F1",
        cursor: "pointer",
        transition: "background-color 0.2s ease-in-out",
      },
    },
  },
};

const Incident = () => {
  const dispatch = useDispatch();
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(false);
  const [edit, setEdit] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null); // Store only the ID
  const [inmateIdMap, setInmateIdMap] = useState({});

  // Fetch Incidents
  useEffect(() => {
    const getIncidents = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/incidents/allIncidents");
        if (response.data) {
          dispatch(setIncident(response.data.incidents));
          setIncidents(response.data.incidents);
          setFilteredIncidents(response.data.incidents);
          
          // Extract unique inmate names to fetch their IDs
          const uniqueInmateNames = [...new Set(response.data.incidents.map(incident => incident.inmate))];
          await fetchInmateIds(uniqueInmateNames);
        }
      } catch (error) {
        console.error("Error fetching incidents:", error);
      } finally {
        setLoading(false);
      }
    };
    getIncidents();
  }, [dispatch]);
  
  // Fetch inmate IDs for all inmates mentioned in incidents
  const fetchInmateIds = async (inmateNames) => {
    try {
      // If there are no inmates, don't make the API call
      if (!inmateNames.length) return;
      
      const response = await axiosInstance.get("/inmates/allInmates");
      if (response.data?.inmates) {
        // Create a map of inmate names to their IDs
        const idMap = {};
        response.data.inmates.forEach(inmate => {
          const fullName = `${inmate.firstName} ${inmate.middleName} ${inmate.lastName}`.trim();
          idMap[fullName] = inmate._id;
        });
        
        setInmateIdMap(idMap);
      }
    } catch (error) {
      console.error("Error fetching inmate IDs:", error);
    }
  };
  
  // Navigate to inmate history page
  const viewInmateHistory = (inmateName) => {
    if (inmateIdMap[inmateName]) {
      navigate(`/policeOfficer-dashboard/incidents/inmate/${inmateIdMap[inmateName]}`);
    }
  };

  // Filter incidents by search query
  const filterByInput = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredIncidents(
      incidents.filter((incident) =>
        incident?.incidentId?.toLowerCase().includes(query)
      )
    );
  };

  // Filter functions for buttons
  const resetFilters = () => {
    setSearchQuery("");
    setFilteredIncidents(incidents);
  };

  const filterByButton = (status) => {
    setFilteredIncidents(
      incidents.filter(
        (incident) =>
          incident.status &&
          incident.status.toLowerCase() === status.toLowerCase()
      )
    );
  };

  // Handle View Incident
  const handleViewIncident = (id) => {
    setSelectedIncidentId(id); // Set the ID
    setView(true);
  };

  // Handle Edit Incident
  const handleEditIncident = (id) => {
    setSelectedIncidentId(id); // Set the ID
    setEdit(true);
  };

  // Define Table Columns using useMemo for performance optimization
  const columns = useMemo(
    () => [
      {
        name: "Incident ID",
        selector: (row) => row.incidentId,
        sortable: true,
      },
      { name: "Reporter", selector: (row) => row.reporter, sortable: true },
      { name: "Type", selector: (row) => row.incidentType, sortable: true },
      { 
        name: "Inmate", 
        cell: (row) => (
          <div className="flex items-center">
            <span>{row.inmate}</span>
            {inmateIdMap[row.inmate] && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  viewInmateHistory(row.inmate);
                }}
                className="ml-2 text-blue-600 hover:text-blue-800"
                title="View inmate incident history"
              >
                <FaHistory size={14} />
              </button>
            )}
          </div>
        ),
        sortable: true 
      },
      { 
        name: "Status", 
        cell: (row) => (
          <div className={`px-2 py-1 rounded text-sm ${
            row.status === 'Resolved' ? 'bg-green-100 text-green-800' :
            row.status === 'Escalated' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {row.status}
          </div>
        ),
        sortable: true 
      },
      { 
        name: "Severity", 
        cell: (row) => (
          <div className={`px-2 py-1 rounded text-sm ${
            row.severity === 'Critical' ? 'bg-red-100 text-red-800' :
            row.severity === 'High' ? 'bg-orange-100 text-orange-800' :
            row.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {row.severity || 'Low'}
          </div>
        ),
        sortable: true 
      },
      {
        name: "Reported Date",
        selector: (row) => new Date(row.incidentDate).toLocaleDateString(),
        sortable: true,
      },
      {
        name: "Actions",
        cell: (row) => (
          <>
            <button
              onClick={() => handleViewIncident(row._id)} // Pass the ID
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-2"
            >
              View
            </button>
            <button
              onClick={() => handleEditIncident(row._id)} // Pass the ID
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Edit
            </button>
          </>
        ),
      },
    ],
    [inmateIdMap]
  );

  // Add a note about inmate history feature
  const helpText = (
    <div className="bg-blue-50 p-3 rounded-md mb-4 text-sm flex items-start">
      <FaHistory className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
      <div className="text-blue-800">
        <p className="font-medium">Inmate History Feature</p>
        <p>Click the history icon <FaHistory className="inline text-blue-600" size={12} /> next to an inmate's name to view their complete incident history.</p>
      </div>
    </div>
  );

  return (
    <div className="flex">
      {/* Sidebar Spacing Fix */}
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Responsive Fixed Header */}
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex flex-wrap items-center justify-between transition-all duration-300 ml-2 gap-4 ${
            isCollapsed
              ? "left-16 w-[calc(100%-5rem)]"
              : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          {/* Back Button */}
          <button
            className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition duration-300"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="mr-2 text-lg" /> Back
          </button>

          {/* Search Input */}
          <div className="relative flex items-center w-full md:w-72">
            <FaSearch className="absolute left-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search by Incident ID"
              className="h-10 px-4 py-2 border border-gray-300 rounded-md w-full pl-10"
              value={searchQuery}
              onChange={filterByInput}
            />
          </div>

          {/* Repeat Offenders Button */}
          <button
            onClick={() => navigate('/policeOfficer-dashboard/repeat-offenders')}
            className="h-10 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center justify-center min-w-[180px] md:w-auto mr-2"
          >
            <FaExclamationTriangle className="mr-2" /> Repeat Offenders
          </button>

          {/* Add New Incident Button (Modal Trigger) */}
          <button
            onClick={() => setOpen(true)}
            className="h-10 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center justify-center min-w-[150px] md:w-auto"
          >
            Add New Incident
          </button>
          <AddModal open={open} setOpen={setOpen}>
            <Add setOpen={setOpen} />
          </AddModal>
        </div>

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-32">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Incident List
          </h2>

          {/* Filter Buttons placed above the table */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              onClick={resetFilters}
            >
              All
            </button>
            <button
              className="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              onClick={() => filterByButton("Pending")}
            >
              Pending
            </button>
            <button
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
              onClick={() => filterByButton("Resolved")}
            >
              Resolved
            </button>
            <button
              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
              onClick={() => filterByButton("Escalated")}
            >
              Escalated
            </button>
          </div>

          {/* Help text with inmate history instructions */}
          {helpText}

          {loading ? (
            <div className="text-center text-gray-600">
              Loading Incidents...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={filteredIncidents}
                pagination
                customStyles={customStyles}
                highlightOnHover
                striped
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddModal open={view} setOpen={setView}>
        {selectedIncidentId && <ViewIncident setView={setView} id={selectedIncidentId} />}
      </AddModal>

      <AddModal open={edit} setOpen={setEdit}>
        {selectedIncidentId && <UpdateIncident setEdit={setEdit} id={selectedIncidentId} />}
      </AddModal>
    </div>
  );
};

export default Incident;