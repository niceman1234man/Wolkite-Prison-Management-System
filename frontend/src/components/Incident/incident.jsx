import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import axiosInstance from "../../utils/axiosInstance";
import { useDispatch } from "react-redux";
import { setIncident } from "../../redux/incidentSlice";
import AddModal from "../Modals/AddModal";
import Add from "./Add";
const Incident = () => {
  const dispatch=useDispatch();
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
    const [open,setOpen]=useState(false);

  // Fetch Incidents
  useEffect(() => {
    const getIncidents = async () => {
      try {
        const response = await axiosInstance.get("/incidents/allIncidents");
        if (response.data) {
         dispatch(setIncident(response.data.incidents));
          setIncidents(response.data.incidents);
        }
      } catch (error) {
        console.error("Error fetching incidents:", error);
      }
    };
    getIncidents();
  }, []);

  // Ensure `filteredIncidents` updates when `incidents` change
  useEffect(() => {
    setFilteredIncidents(incidents);
  }, [incidents]);

  // Search by Incident ID
  const filterByInput = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredIncidents(
      incidents.filter((incident) =>
        incident?.incidentId?.toLowerCase().includes(query)
      )
    );
  };

  // Filter by Status
  const filterByButton = (status) => {
    setFilteredIncidents(
      incidents.filter((incident) => incident?.status?.toLowerCase() === status.toLowerCase())
    );
  };

  // Reset Filters
  const resetFilters = () => {
    setSearchQuery("");
    setFilteredIncidents(incidents);
  };

  // Define Table Columns using useMemo for performance optimization
  const columns = useMemo(
    () => [
      { name: "Incident ID", selector: (row) => row.incidentId, sortable: true },
      { name: "Reporter", selector: (row) => row.reporter, sortable: true },
      { name: "Type", selector: (row) => row.incidentType, sortable: true },
      { name: "Inmate", selector: (row) => row.inmate, sortable: true },
      { name: "Status", selector: (row) => row.status, sortable: true },
      {
        name: "Reported Date",
        selector: (row) => new Date(row.incidentDate).toLocaleDateString(),
        sortable: true,
      },
      {
        name: "Actions",
        cell: (row) => (
          <>
            <Link
              to={`/policeOfficer-dashboard/incident-details/${row._id}`}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-2"
            >
              View
            </Link>
            <Link
              to={`/policeOfficer-dashboard/edit-incident/${row._id}`}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Edit
            </Link>
          </>
        ),
      },
    ],
    []
  );
  

  return (
    <div className="p-6 bg-white shadow-md rounded-md mt-12">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">Incident Management</h2>
      </div>

      {/* Search & Add Incident */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by Incident ID"
          className="px-4 py-2 border rounded-md"
          value={searchQuery}
          onChange={filterByInput}
        />
        <button
          
          className="px-4 py-2 bg-teal-600 rounded text-white"
          onClick={()=>setOpen(true)}
        >
          Add New Incident
        </button>
        <AddModal open={open} setOpen={setOpen}>
          <Add setOpen={setOpen} />
        </AddModal>
      </div>

      {/* Filter Buttons */}
      <div className="flex justify-end space-x-2 mb-4">
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

      {/* Incident Table */}
      {filteredIncidents.length === 0 ? (
        <p className="text-center text-gray-500">No incidents found.</p>
      ) : (
        <DataTable columns={columns} data={filteredIncidents} pagination />
      )}
    </div>
  );
};

export default Incident;
