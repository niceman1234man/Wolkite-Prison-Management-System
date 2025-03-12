import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axiosInstance from "../../utils/axiosInstance";

const PoliceOfficerReports = () => {
  // State for Visitors & Incidents
  const [visitors, setVisitors] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedReport, setSelectedReport] = useState("visitors");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  // Fetch Visitors & Incidents from API
  useEffect(() => {
    axiosInstance.get("/visitor/allVisitors").then((res) => setVisitors(res.data.visitors));
    axiosInstance.get("/incidents/allIncidents").then((res) => setIncidents(res.data.incidents));
  }, []);
console.log(visitors,incidents)
  // Filter Visitors by Date Range
  const filterVisitors = () => {
    if (!startDate || !endDate) return;
    let vn0 = 1; // Initialize visitor number counter
    const filtered = visitors.map((visitor, index) => ({
      vn0: vn0++, // Assign vn0
      ...visitor, // Spread visitor data
    })).filter(visitor => {
      const visitDate = new Date(visitor.date);
      return visitDate >= new Date(startDate) && visitDate <= new Date(endDate);
    });
  
    console.log("Filtered Visitors:", filtered);
    setFilteredData(filtered);
  };
  

  // Filter Incidents by Date & Status
  const filterIncidents = (status = null) => {
    let In0 = 1; 
    if (!startDate || !endDate) return;
    const filtered = incidents.map((incident,index)=>({I_No:In0++,...incident})).filter((incident) => {
      const reportDate = new Date(incident.incidentDate);
      return (
        reportDate >= new Date(startDate) &&
        reportDate <= new Date(endDate) &&
        (!status || incident.status === status)
      );
    });
    console.log("Filtered Incidents:", filtered);
    setFilteredData(filtered);
  };

  // Export to PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text(`Police Officer ${selectedReport === "visitors" ? "Visitor" : "Incident"} Report`, 14, 10);

    const tableColumn =
    selectedReport === "visitors"
    ? [ "First Name", "Last Name", "Phone","Relation" ,"Date"]
    : [ "Reporter", "Type", "Status", "Date"];
    let vn0 = 1; // Declare vn0 as let so it can be incremented
const tableRows = filteredData.map((item) =>
  selectedReport === "visitors"
    ? [vn0++, item.firstName, item.lastName, item.inmate, item.phone, item.relation, new Date(item.date).toLocaleDateString()]
    : [I_No++,item.reporter, item.incidentType, item.status, new Date(item.incidentDate).toLocaleDateString()]
);


    doc.autoTable({ head: [tableColumn], body: tableRows });
    doc.save(`${selectedReport}-report.pdf`);
  };

  // Table Columns
  const visitorColumns = [
    { name: "V_No", selector: (row) => row.vn0, sortable: true },
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
    { name: "I_NO", selector: (row) => row.I_No, sortable: true },
    { name: "Inmate", selector: (row) => row.inmate, sortable: true },
    { name: "Reporter", selector: (row) => row.reporter, sortable: true },
    { name: "Type", selector: (row) => row.incidentType, sortable: true },
    { name: "Status", selector: (row) => row.status, sortable: true },
    {
      name: "Reported On",
      selector: (row) => new Date(row.incidentDate).toLocaleDateString(),
      sortable: true,
    },
    { name: "Description", selector: (row) => row.description, sortable: true },
  ];

  return (
    <div className="p-6 bg-white shadow-md rounded-md mt-12">
      <h2 className="text-2xl font-bold text-center mb-4">Police Officer Reports</h2>

      {/* Report Selection */}
      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded-md ${selectedReport === "visitors" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
          onClick={() => {
            setSelectedReport("visitors");
            setFilteredData([]);
          }}
        >
          Visitor Reports
        </button>
        <button
          className={`px-4 py-2 rounded-md ${selectedReport === "incidents" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
          onClick={() => {
            setSelectedReport("incidents");
            setFilteredData([]);
          }}
        >
          Incident Reports
        </button>
      </div>

      {/* Date Filters */}
      <div className="flex items-center space-x-3 mb-4">
        <input type="date" className="px-4 py-2 border rounded-md" onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" className="px-4 py-2 border rounded-md" onChange={(e) => setEndDate(e.target.value)} />

        {selectedReport === "visitors" ? (
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700" onClick={filterVisitors}>
            Generate Visitor Report
          </button>
        ) : (
          <>
            <button className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700" onClick={() => filterIncidents("Pending")}>
              Pending Incidents
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700" onClick={() => filterIncidents("Resolved")}>
              Resolved Incidents
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" onClick={() => filterIncidents("Escalated")}>
              Escalated Incidents
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" onClick={() => filterIncidents()}>
              All Incidents
            </button>
          </>
        )}
      </div>

      {/* Export Buttons */}
      {filteredData.length > 0 && (
        <div className="flex space-x-4 mb-4">
          <CSVLink data={filteredData} filename={`${selectedReport}-report.csv`} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            Export as CSV
          </CSVLink>
          <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" onClick={generatePDF}>
            Export as PDF
          </button>
        </div>
      )}

      {/* Data Table */}
      {filteredData.length === 0 ? (
        <p className="text-center text-gray-500">No data available for the selected criteria.</p>
      ) : (
        <DataTable columns={selectedReport === "visitors" ? visitorColumns : incidentColumns} data={filteredData} pagination />
      )}
    </div>
  );
};

export default PoliceOfficerReports;
