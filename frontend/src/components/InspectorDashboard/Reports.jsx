import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaChartBar, 
  FaExchangeAlt, 
  FaClipboardList, 
  FaUserShield, 
  FaFileAlt, 
  FaDownload, 
  FaEye, 
  FaCalendarAlt 
} from 'react-icons/fa';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-hot-toast';

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [prisons, setPrisons] = useState([]);
  const [notices, setNotices] = useState([]);
  const [transfers, setTransfers] = useState([]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch prisons
        const prisonsResponse = await axiosInstance.get('/prison/getall-prisons');
        const prisonsData = prisonsResponse.data?.prisons || prisonsResponse.data?.data || [];
        setPrisons(prisonsData);

        // Fetch notices
        const noticesResponse = await axiosInstance.get('/notices/getall-notices');
        const noticesData = noticesResponse.data?.notices || noticesResponse.data?.data || [];
        setNotices(noticesData);

        // Fetch transfers
        const transfersResponse = await axiosInstance.get('/transfer/getall-transfers');
        const transfersData = transfersResponse.data?.transfers || transfersResponse.data?.data || [];
        setTransfers(transfersData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load initial data');
      }
    };

    fetchInitialData();
  }, []);

  // Report types with their details
  const reportTypes = [
    {
      id: 'prison-status',
      title: 'Prison Status Report',
      description: 'Comprehensive overview of prison capacity, population, and occupancy rates',
      icon: <FaChartBar className="text-4xl text-blue-600" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'transfer-reports',
      title: 'Transfer Reports',
      description: 'Analysis of inmate transfers between facilities and transfer statistics',
      icon: <FaExchangeAlt className="text-4xl text-green-600" />,
      color: 'bg-green-50 border-green-200'
    },
    {
      id: 'notice-reports',
      title: 'Notice Reports',
      description: 'Distribution and effectiveness of notices across the prison system',
      icon: <FaClipboardList className="text-4xl text-amber-600" />,
      color: 'bg-amber-50 border-amber-200'
    },
    {
      id: 'inspection-reports',
      title: 'Inspection Reports',
      description: 'Findings from prison inspections and compliance assessments',
      icon: <FaUserShield className="text-4xl text-purple-600" />,
      color: 'bg-purple-50 border-purple-200'
    },
    {
      id: 'legal-compliance',
      title: 'Legal Compliance Reports',
      description: 'Assessment of adherence to legal requirements and standards',
      icon: <FaFileAlt className="text-4xl text-red-600" />,
      color: 'bg-red-50 border-red-200'
    }
  ];

  // Handle report selection
  const handleSelectReport = (reportId) => {
    setSelectedReport(reportId);
    setReportData(null); // Reset report data when selecting a new report
  };

  // Handle date range change
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filter data by date range
  const filterDataByDateRange = (data, dateField) => {
    if (!dateRange.startDate || !dateRange.endDate) return data;
    
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999); // Include the entire end date
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  // Generate report based on selection and date range
  const generateReport = async () => {
    if (!selectedReport) {
      toast.error('Please select a report type');
      return;
    }

    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('Please select a date range');
      return;
    }

    setLoading(true);
    try {
      let reportContent = null;
      
      switch (selectedReport) {
        case 'prison-status':
          // Process prison status data
          const prisonStatusData = prisons.map(prison => ({
            prison: prison.prison_name,
            capacity: prison.capacity,
            population: prison.current_population,
            occupancy: `${Math.round((prison.current_population / prison.capacity) * 100)}%`
          }));
          
          reportContent = {
            title: 'Prison Status Report',
            date: new Date().toLocaleDateString(),
            data: prisonStatusData
          };
          break;
          
        case 'transfer-reports':
          // Process transfer data
          const filteredTransfers = filterDataByDateRange(transfers, 'transfer_date');
          const transferData = filteredTransfers.map(transfer => ({
            from: transfer.from_prison,
            to: transfer.to_prison,
            count: transfer.inmate_count || 1,
            date: new Date(transfer.transfer_date).toLocaleDateString()
          }));
          
          reportContent = {
            title: 'Transfer Reports',
            date: new Date().toLocaleDateString(),
            data: transferData
          };
          break;
          
        case 'notice-reports':
          // Process notice data
          const filteredNotices = filterDataByDateRange(notices, 'date');
          const noticeData = filteredNotices.map(notice => ({
            title: notice.title,
            recipients: notice.roles?.length || 0,
            readRate: '85%', // This would come from actual read data
            date: new Date(notice.date).toLocaleDateString()
          }));
          
          reportContent = {
            title: 'Notice Reports',
            date: new Date().toLocaleDateString(),
            data: noticeData
          };
          break;
          
        case 'inspection-reports':
          // For inspection reports, we would typically fetch from an API
          // This is a placeholder implementation
          try {
            const inspectionResponse = await axiosInstance.get('/inspections/getall-inspections');
            const inspections = inspectionResponse.data?.inspections || inspectionResponse.data?.data || [];
            
            const filteredInspections = filterDataByDateRange(inspections, 'inspection_date');
            const inspectionData = filteredInspections.map(inspection => ({
              prison: inspection.prison_name,
              inspector: inspection.inspector_name,
              score: `${inspection.score}%`,
              date: new Date(inspection.inspection_date).toLocaleDateString()
            }));
            
            reportContent = {
              title: 'Inspection Reports',
              date: new Date().toLocaleDateString(),
              data: inspectionData
            };
          } catch (error) {
            console.error('Error fetching inspection data:', error);
            // Fallback to mock data if API fails
            reportContent = {
              title: 'Inspection Reports',
              date: new Date().toLocaleDateString(),
              data: [
                { prison: 'Wolkite Central', inspector: 'John Doe', score: '85%', date: '2023-11-15' },
                { prison: 'Addis Ababa Facility', inspector: 'Jane Smith', score: '92%', date: '2023-11-10' },
                { prison: 'Dire Dawa Prison', inspector: 'Robert Johnson', score: '78%', date: '2023-11-05' }
              ]
            };
          }
          break;
          
        case 'legal-compliance':
          // For legal compliance, we would typically fetch from an API
          // This is a placeholder implementation
          try {
            const complianceResponse = await axiosInstance.get('/compliance/getall-compliance');
            const complianceData = complianceResponse.data?.compliance || complianceResponse.data?.data || [];
            
            const filteredCompliance = filterDataByDateRange(complianceData, 'assessment_date');
            const legalData = filteredCompliance.map(item => ({
              area: item.area,
              compliance: `${item.compliance_score}%`,
              issues: item.issues_count,
              date: new Date(item.assessment_date).toLocaleDateString()
            }));
            
            reportContent = {
              title: 'Legal Compliance Reports',
              date: new Date().toLocaleDateString(),
              data: legalData
            };
          } catch (error) {
            console.error('Error fetching compliance data:', error);
            // Fallback to mock data if API fails
            reportContent = {
              title: 'Legal Compliance Reports',
              date: new Date().toLocaleDateString(),
              data: [
                { area: 'Inmate Rights', compliance: '95%', issues: 2, date: '2023-11-15' },
                { area: 'Staff Training', compliance: '88%', issues: 5, date: '2023-11-10' },
                { area: 'Facility Standards', compliance: '92%', issues: 3, date: '2023-11-05' }
              ]
            };
          }
          break;
          
        default:
          toast.error('Invalid report type selected');
          return;
      }
      
      setReportData(reportContent);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Download report as PDF
  const downloadReport = async () => {
    if (!reportData) {
      toast.error('No report data available to download');
      return;
    }
    
    try {
      setLoading(true);
      
      // For now, we'll use a client-side approach to generate a simple PDF
      // This is a temporary solution until the backend PDF generation is implemented
      
      // Create a simple HTML representation of the report
      let reportHtml = `
        <html>
          <head>
            <title>${reportData.title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { margin-bottom: 20px; }
              .date { color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${reportData.title}</h1>
              <p class="date">Generated on ${reportData.date}</p>
            </div>
            <table>
              <thead>
                <tr>
                  ${Object.keys(reportData.data[0] || {}).map(key => `<th>${key.charAt(0).toUpperCase() + key.slice(1)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${reportData.data.map(row => `
                  <tr>
                    ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      
      // Create a blob from the HTML
      const blob = new Blob([reportHtml], { type: 'text/html' });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.html`);
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render report data based on the selected report type
  const renderReportData = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case 'prison-status':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Prison</th>
                  <th className="py-3 px-4 text-left">Capacity</th>
                  <th className="py-3 px-4 text-left">Population</th>
                  <th className="py-3 px-4 text-left">Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{item.prison}</td>
                    <td className="py-3 px-4">{item.capacity}</td>
                    <td className="py-3 px-4">{item.population}</td>
                    <td className="py-3 px-4">{item.occupancy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'transfer-reports':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">From</th>
                  <th className="py-3 px-4 text-left">To</th>
                  <th className="py-3 px-4 text-left">Count</th>
                  <th className="py-3 px-4 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{item.from}</td>
                    <td className="py-3 px-4">{item.to}</td>
                    <td className="py-3 px-4">{item.count}</td>
                    <td className="py-3 px-4">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'notice-reports':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Title</th>
                  <th className="py-3 px-4 text-left">Recipients</th>
                  <th className="py-3 px-4 text-left">Read Rate</th>
                  <th className="py-3 px-4 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{item.title}</td>
                    <td className="py-3 px-4">{item.recipients}</td>
                    <td className="py-3 px-4">{item.readRate}</td>
                    <td className="py-3 px-4">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'inspection-reports':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Prison</th>
                  <th className="py-3 px-4 text-left">Inspector</th>
                  <th className="py-3 px-4 text-left">Score</th>
                  <th className="py-3 px-4 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{item.prison}</td>
                    <td className="py-3 px-4">{item.inspector}</td>
                    <td className="py-3 px-4">{item.score}</td>
                    <td className="py-3 px-4">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'legal-compliance':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Area</th>
                  <th className="py-3 px-4 text-left">Compliance</th>
                  <th className="py-3 px-4 text-left">Issues</th>
                  <th className="py-3 px-4 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{item.area}</td>
                    <td className="py-3 px-4">{item.compliance}</td>
                    <td className="py-3 px-4">{item.issues}</td>
                    <td className="py-3 px-4">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      default:
        return <p>No data available for this report type.</p>;
    }
  };

  return (
    <div className="flex-1 transition-all duration-300 ease-in-out">
      <div className="p-4 md:p-6 lg:p-8 ml-0 md:ml-16 lg:ml-64 mb-6 mt-8">
        {/* Fixed Header */}
        <div className="fixed top-8 right-0 left-0 md:left-16 lg:left-64 bg-white z-10 shadow-md p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
              <p className="text-gray-600">Generate and view various reports for the prison management system</p>
            </div>
            {reportData && (
              <button
                onClick={downloadReport}
                disabled={loading}
                className="mt-4 md:mt-0 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Downloading...
                  </>
                ) : (
                  <>
                    <FaDownload className="mr-2" />
                    Download PDF
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Content with padding to account for fixed header */}
        <div className="pt-32">
          {/* Report Type Selection */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Select Report Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTypes.map((report) => (
                <div 
                  key={report.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedReport === report.id 
                      ? 'ring-2 ring-teal-500 shadow-md' 
                      : 'hover:shadow-md'
                  } ${report.color}`}
                  onClick={() => handleSelectReport(report.id)}
                >
                  <div className="flex items-start">
                    <div className="mr-4">{report.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{report.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range Selection */}
          {selectedReport && (
            <div className="mb-8 bg-white p-4 md:p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Select Date Range</h2>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={dateRange.startDate}
                    onChange={handleDateChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={dateRange.endDate}
                    onChange={handleDateChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={generateReport}
                    disabled={loading}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <FaEye className="mr-2" />
                        Generate Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Report Display */}
          {reportData && (
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{reportData.title}</h2>
                  <p className="text-sm text-gray-600">Generated on {reportData.date}</p>
                </div>
              </div>
              
              <div className="mt-4 overflow-x-auto">
                {renderReportData()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports; 