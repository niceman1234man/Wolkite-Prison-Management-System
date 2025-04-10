import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axiosInstance from "../../utils/axiosInstance";
import { useSelector } from "react-redux";

const PoliceOfficerReports = () => {
  const [visitors, setVisitors] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedReport, setSelectedReport] = useState("visitors");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      axiosInstance.get("/visitor/allVisitors"),
      axiosInstance.get("/incidents/allIncidents")
    ]).then(([visitorRes, incidentRes]) => {
      setVisitors(visitorRes.data.visitors);
      setIncidents(incidentRes.data.incidents);
      setIsLoading(false);
    }).catch(error => {
      console.error("Error fetching data:", error);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      if (selectedReport === "visitors") {
        filterVisitors();
      } else if (selectedReport === "incidents") {
        filterIncidents();
      }
    }
  }, [selectedReport, startDate, endDate]);

  const filterVisitors = () => {
    if (!startDate || !endDate) return;
    let vn0 = 0;
    const filtered = visitors
      .map((visitor) => ({
        vn0: ++vn0,
        ...visitor,
      }))
      .filter((visitor) => {
        const visitDate = new Date(visitor.date);
        return visitDate >= new Date(startDate) && visitDate <= new Date(endDate);
      });
    setFilteredData(filtered);
  };

  const filterIncidents = (status = null) => {
    if (!startDate || !endDate) return;
    let In0 = 0;
    const filtered = incidents
      .map((incident) => ({
        I_No: ++In0,
        ...incident,
      }))
      .filter((incident) => {
        const reportDate = new Date(incident.incidentDate);
        return (
          reportDate >= new Date(startDate) &&
          reportDate <= new Date(endDate) &&
          (!status || incident.status === status)
        );
      });
    setFilteredData(filtered);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text(`Police Officer ${selectedReport === "visitors" ? "Visitor" : "Incident"} Report`, 14, 10);
    doc.text(`From: ${new Date(startDate).toLocaleDateString()} - To: ${new Date(endDate).toLocaleDateString()}`, 14, 20);

    const tableColumn =
      selectedReport === "visitors"
        ? ["No", "First Name", "Last Name", "Phone", "Inmate", "Relation", "Date"]
        : ["No", "Inmate", "Reporter", "Type", "Status", "Date", "Description"];
    
    const tableRows = filteredData.map((item, index) =>
      selectedReport === "visitors"
        ? [
            index + 1, 
            item.firstName, 
            item.lastName, 
            item.phone, 
            item.inmate, 
            item.relation, 
            new Date(item.date).toLocaleDateString()
          ]
        : [
            index + 1, 
            item.inmate, 
            item.reporter, 
            item.incidentType, 
            item.status, 
            new Date(item.incidentDate).toLocaleDateString(),
            item.description?.substring(0, 30) + (item.description?.length > 30 ? "..." : "")
          ]
    );

    doc.autoTable({ 
      head: [tableColumn], 
      body: tableRows,
      startY: 25,
      margin: { top: 25 },
      styles: { overflow: 'linebreak' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    doc.save(`${selectedReport}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const visitorColumns = [
    { name: "No", selector: (row) => row.vn0, sortable: true, width: "60px" },
    { name: "First Name", selector: (row) => row.firstName, sortable: true },
    { name: "Last Name", selector: (row) => row.lastName, sortable: true },
    { name: "Phone", selector: (row) => row.phone, sortable: true },
    { name: "Inmate", selector: (row) => row.inmate, sortable: true },
    { name: "Relation", selector: (row) => row.relation, sortable: true },
    {
      name: "Visit Date",
      selector: (row) => new Date(row.date).toLocaleDateString(),
      sortable: true,
    },
  ];

  const incidentColumns = [
    { name: "No", selector: (row) => row.I_No, sortable: true, width: "60px" },
    { name: "Inmate", selector: (row) => row.inmate, sortable: true },
    { name: "Reporter", selector: (row) => row.reporter, sortable: true },
    { name: "Type", selector: (row) => row.incidentType, sortable: true },
    { name: "Status", selector: (row) => row.status, sortable: true },
    {
      name: "Reported On",
      selector: (row) => new Date(row.incidentDate).toLocaleDateString(),
      sortable: true,
    },
    { 
      name: "Description", 
      selector: (row) => row.description,
      sortable: true,
      wrap: true,
      cell: row => <div className="truncate max-w-xs" title={row.description}>{row.description}</div> 
    },
  ];

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setFilteredData([]);
  };

  return (
    <div className={`p-6 bg-white shadow-md rounded-md mt-12 ${isCollapsed ? "ml-16" : "ml-64"}`}>
      {/* Fixed Header */}
      <div className={`bg-white shadow-md p-4 fixed top-14 z-20 flex justify-center items-center transition-all duration-300 ml-2 ${isCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"}`}>
        <h3 className="text-2xl font-bold text-gray-800 text-center">Police Officer Reports</h3>
      </div>

      <div className="mt-20 mb-6">
        {/* Card for Report Options */}
        <div className="bg-white shadow-sm rounded-lg p-5 border border-gray-200 mb-6">
          <h4 className="text-lg font-semibold text-gray-700 mb-4">Report Type</h4>
          <div className="flex flex-wrap gap-3">
            <button
              className={`px-4 py-2 rounded-md transition-colors ${selectedReport === "visitors" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              onClick={() => setSelectedReport("visitors")}
            >
              Visitor Reports
            </button>
            <button
              className={`px-4 py-2 rounded-md transition-colors ${selectedReport === "incidents" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              onClick={() => setSelectedReport("incidents")}
            >
              Incident Reports
            </button>
          </div>
        </div>

        {/* Card for Date Range */}
        <div className="bg-white shadow-sm rounded-lg p-5 border border-gray-200 mb-6">
          <h4 className="text-lg font-semibold text-gray-700 mb-4">Date Range</h4>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex space-x-4 items-end">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  onClick={selectedReport === "visitors" ? filterVisitors : () => filterIncidents()}
                  disabled={!startDate || !endDate}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Generate Report
                </button>
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  onClick={handleReset}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      {filteredData.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-md mb-6 flex flex-wrap gap-3 items-center">
          <span className="text-gray-700 font-medium">Export:</span>
          <CSVLink 
            data={filteredData} 
            filename={`${selectedReport}-report-${new Date().toISOString().split('T')[0]}.csv`} 
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </CSVLink>
          <button 
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center" 
            onClick={generatePDF}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            PDF
          </button>
        </div>
      )}

      {/* Data Results */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-700">
            {selectedReport === "visitors" ? "Visitor Records" : "Incident Records"}
            {filteredData.length > 0 && <span className="text-sm font-normal text-gray-500 ml-2">({filteredData.length} records)</span>}
          </h4>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            {startDate && endDate ? "No data available for the selected date range." : "Select a date range to generate a report."}
          </div>
        ) : (
          <DataTable
            columns={selectedReport === "visitors" ? visitorColumns : incidentColumns}
            data={filteredData}
            pagination
            responsive
            highlightOnHover
            pointerOnHover
            defaultSortFieldId={1}
            defaultSortAsc={true}
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 20, 30, 50]}
          />
        )}
      </div>
    </div>
  );
};

export default PoliceOfficerReports;
