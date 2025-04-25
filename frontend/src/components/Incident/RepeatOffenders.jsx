import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '../../utils/axiosInstance';
import { FaArrowLeft, FaExclamationTriangle, FaChartBar, FaHistory, FaUserAlt } from 'react-icons/fa';
import DataTable from 'react-data-table-component';
import AddModal from '../Modals/AddModal';
import ViewIncident from './ViewIncident';

const customStyles = {
  headCells: {
    style: {
      backgroundColor: "#c53030", // Red for warning
      color: "#FFFFFF",
      fontWeight: "bold",
      fontSize: "14px",
      textTransform: "uppercase",
    },
  },
  rows: {
    style: {
      "&:hover": {
        backgroundColor: "#FEEBC8", // Light orange for warning
        cursor: "pointer",
        transition: "background-color 0.2s ease-in-out",
      },
    },
  },
};

const RepeatOffenders = () => {
  const navigate = useNavigate();
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  
  const [repeatOffenders, setRepeatOffenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInmate, setSelectedInmate] = useState('');
  const [inmateIncidents, setInmateIncidents] = useState([]);
  const [showIncidents, setShowIncidents] = useState(false);
  const [statisticsData, setStatisticsData] = useState(null);
  const [viewIncident, setViewIncident] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);

  // Fetch repeat offenders
  useEffect(() => {
    const fetchRepeatOffenders = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/incidents/repeat-offenders');
        if (response.data?.repeatOffenders) {
          setRepeatOffenders(response.data.repeatOffenders);
        }
      } catch (error) {
        console.error('Error fetching repeat offenders:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRepeatOffenders();
  }, []);

  // Handle view incidents for a specific inmate
  const handleViewIncidents = async (inmateName) => {
    try {
      setSelectedInmate(inmateName);
      const response = await axiosInstance.get(`/incidents/inmate-incidents/${inmateName}`);
      if (response.data) {
        setInmateIncidents(response.data.incidents);
        setStatisticsData(response.data.statistics);
        setShowIncidents(true);
      }
    } catch (error) {
      console.error('Error fetching inmate incidents:', error);
    }
  };

  // Handle view specific incident
  const handleViewIncident = (id) => {
    setSelectedIncidentId(id);
    setViewIncident(true);
  };

  // Get severity level color
  const getSeverityColor = (count) => {
    if (count >= 5) return 'text-red-700 bg-red-100';
    if (count >= 3) return 'text-orange-700 bg-orange-100';
    return 'text-yellow-700 bg-yellow-100';
  };

  // Define columns for repeat offenders table
  const offenderColumns = [
    {
      name: 'Inmate Name',
      selector: row => row._id,
      sortable: true,
    },
    {
      name: 'Incident Count',
      cell: row => (
        <div className={`font-bold px-3 py-1 rounded-full ${getSeverityColor(row.count)}`}>
          {row.count}
        </div>
      ),
      sortable: true,
    },
    {
      name: 'Last Incident',
      selector: row => new Date(row.lastIncident).toLocaleDateString(),
      sortable: true,
    },
    {
      name: 'Actions',
      cell: row => (
        <button
          onClick={() => handleViewIncidents(row._id)}
          className="flex items-center bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700"
        >
          <FaHistory className="mr-1" /> View History
        </button>
      ),
    },
  ];

  // Define columns for inmate incidents table
  const incidentColumns = [
    {
      name: 'Incident ID',
      selector: row => row.incidentId,
      sortable: true,
    },
    {
      name: 'Type',
      selector: row => row.incidentType,
      sortable: true,
    },
    {
      name: 'Date',
      selector: row => new Date(row.incidentDate).toLocaleDateString(),
      sortable: true,
    },
    {
      name: 'Status',
      cell: row => (
        <div className={`px-2 py-1 rounded text-sm ${
          row.status === 'Resolved' ? 'bg-green-100 text-green-800' :
          row.status === 'Escalated' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {row.status}
        </div>
      ),
      sortable: true,
    },
    {
      name: 'Severity',
      cell: row => (
        <div className={`px-2 py-1 rounded text-sm ${
          row.severity === 'Critical' ? 'bg-red-100 text-red-800' :
          row.severity === 'High' ? 'bg-orange-100 text-orange-800' :
          row.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {row.severity || 'Low'}
        </div>
      ),
      sortable: true,
    },
    {
      name: 'Actions',
      cell: row => (
        <button
          onClick={() => handleViewIncident(row._id)}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="flex">
      {/* Sidebar Spacing Fix */}
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Header */}
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 transition-all duration-300 ml-2 ${
            isCollapsed
              ? "left-16 w-[calc(100%-5rem)]"
              : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          <div className="flex justify-between items-center">
            <button
              className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded shadow-md transition-colors"
              onClick={() => {
                if (showIncidents) {
                  setShowIncidents(false);
                  setSelectedInmate('');
                  setInmateIncidents([]);
                  setStatisticsData(null);
                } else {
                  navigate('/policeOfficer-dashboard/incident');
                }
              }}
            >
              <FaArrowLeft className="mr-2" /> {showIncidents ? 'Back to Offenders' : 'Back to Incidents'}
            </button>
            
            <h2 className="text-xl font-bold text-red-600 flex items-center">
              <FaExclamationTriangle className="mr-2" />
              {showIncidents ? `${selectedInmate}'s Incident History` : 'Repeat Offenders Monitoring'}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 mt-32">
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
              <p className="mt-3 text-gray-600">Loading data...</p>
            </div>
          ) : showIncidents ? (
            <div>
              {/* Statistics Panel */}
              {statisticsData && (
                <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-bold mb-4 flex items-center">
                    <FaChartBar className="mr-2 text-teal-600" />
                    Inmate Incident Statistics
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <h4 className="font-medium text-red-700">Total Incidents</h4>
                      <p className="text-2xl font-bold">{statisticsData.totalIncidents}</p>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-yellow-700">Most Recent</h4>
                      <p className="text-md font-bold">{new Date(statisticsData.mostRecentIncident.incidentDate).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-700">Most Frequent Type</h4>
                      <p className="text-md font-bold">{statisticsData.mostFrequentType}</p>
                    </div>
                    
                    <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                      <h4 className="font-medium text-teal-700">Trend Analysis</h4>
                      <p className={`text-md font-bold ${statisticsData.totalIncidents >= 5 ? 'text-red-600' : statisticsData.totalIncidents >= 3 ? 'text-orange-600' : 'text-yellow-600'}`}>
                        {statisticsData.totalIncidents >= 5 ? 'Critical Risk' : 
                         statisticsData.totalIncidents >= 3 ? 'High Risk' : 'Medium Risk'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Incidents Table */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <FaHistory className="mr-2 text-teal-600" />
                  Incident History
                </h3>
                
                <DataTable
                  columns={incidentColumns}
                  data={inmateIncidents}
                  pagination
                  customStyles={customStyles}
                  highlightOnHover
                />
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-4 flex items-center text-red-600">
                <FaUserAlt className="mr-2" />
                Inmates with Repeated Incidents
              </h3>
              
              {repeatOffenders.length === 0 ? (
                <p className="text-center py-6 text-gray-500">No repeat offenders found.</p>
              ) : (
                <DataTable
                  columns={offenderColumns}
                  data={repeatOffenders}
                  pagination
                  customStyles={customStyles}
                  highlightOnHover
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddModal open={viewIncident} setOpen={setViewIncident}>
        {selectedIncidentId && <ViewIncident setView={setViewIncident} id={selectedIncidentId} />}
      </AddModal>
    </div>
  );
};

export default RepeatOffenders; 