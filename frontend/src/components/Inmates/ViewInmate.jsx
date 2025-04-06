import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 

import ConfirmModal from "../Modals/ConfirmModal";
import { FiUser, FiInfo, FiMapPin, FiPhoneCall, FiFileText, FiUserCheck, FiPrinter } from "react-icons/fi";

const ViewInmate = ({ _id, setOpen }) => {
  const [inmateData, setInmateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDelete, setOpenDelete] = useState(false);
  const navigate = useNavigate();
  const printRef = useRef();

  // Helper functions
  const calculateParoleDate = (startDate, sentenceYear) => {
    if (!startDate || !sentenceYear) return null;
    const start = new Date(startDate);
    const twoThirdsYears = (parseFloat(sentenceYear) * 2) / 3;
    const fullYears = Math.floor(twoThirdsYears);
    const fractionalYear = twoThirdsYears - fullYears;
    const months = Math.round(fractionalYear * 12);
    start.setFullYear(start.getFullYear() + fullYears);
    start.setMonth(start.getMonth() + months);
    return start.toISOString().split('T')[0];
  };

  const calculateDuration = (date1, date2) => {
    if (!date1 || !date2) return null;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    let years = d2.getFullYear() - d1.getFullYear();
    let months = d2.getMonth() - d1.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''} and ${months} month${months !== 1 ? 's' : ''}`;
  };

  const formatToLocalDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString();
  };

  // Handle print functionality
  const handlePrint = () => {
    const content = printRef.current;
    const originalContents = document.body.innerHTML;
    
    // Create a print-friendly version
    const printContent = `
      <html>
        <head>
          <title>Inmate Record - ${inmateData.firstName} ${inmateData.lastName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              padding: 20px;
            }
            .print-header {
              text-align: center;
              padding-bottom: 10px;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 5px;
            }
            .print-section {
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .print-section h2 {
              font-size: 18px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
              margin-bottom: 15px;
            }
            .print-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
            }
            .print-item {
              margin-bottom: 10px;
            }
            .print-label {
              font-weight: bold;
              display: block;
              font-size: 12px;
              color: #555;
            }
            .print-value {
              font-size: 14px;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>Inmate Record</h1>
            <p>ID: ${inmateData._id}</p>
            <p>Printed on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="print-section">
            <h2>Personal Information</h2>
            <div class="print-grid">
              <div class="print-item">
                <span class="print-label">Full Name</span>
                <span class="print-value">${inmateData.firstName} ${inmateData.middleName} ${inmateData.lastName}</span>
              </div>
              <div class="print-item">
                <span class="print-label">Age</span>
                <span class="print-value">${inmateData.age}</span>
              </div>
              <div class="print-item">
                <span class="print-label">Birth Date</span>
                <span class="print-value">${formatToLocalDate(inmateData.birthDate)}</span>
              </div>
              <div class="print-item">
                <span class="print-label">Mother's Name</span>
                <span class="print-value">${inmateData.motherName || "Not provided"}</span>
              </div>
              <div class="print-item">
                <span class="print-label">Gender</span>
                <span class="print-value">${inmateData.gender}</span>
              </div>
              <div class="print-item">
                <span class="print-label">Marital Status</span>
                <span class="print-value">${inmateData.maritalStatus || "Not provided"}</span>
              </div>
              <div class="print-item">
                <span class="print-label">Nationality</span>
                <span class="print-value">${inmateData.nationality || "Not provided"}</span>
              </div>
            </div>
          </div>
          
          <div class="print-section">
            <h2>Physical Characteristics</h2>
            <div class="print-grid">
              <div class="print-item">
                <span class="print-label">Height</span>
                <span class="print-value">${inmateData.height} cm</span>
              </div>
              <div class="print-item">
                <span class="print-label">Hair Type</span>
                <span class="print-value">${inmateData.hairType || "Not provided"}</span>
              </div>
              <div class="print-item">
                <span class="print-label">Face</span>
                <span class="print-value">${inmateData.face || "Not provided"}</span>
              </div>
              <div class="print-item">
                <span class="print-label">Eye Color</span>
                <span class="print-value">${inmateData.eyeColor || "Not provided"}</span>
              </div>
              <div class="print-item">
                <span class="print-label">Special Symbol</span>
                <span class="print-value">${inmateData.specialSymbol || "None"}</span>
              </div>
            </div>
          </div>
          
          <div class="print-section">
            <h2>Case Information</h2>
            <div class="print-grid">
              <div class="print-item">
                <span class="print-label">Case Type</span>
                <span class="print-value">${inmateData.caseType || "Not provided"}</span>
              </div>
              <div class="print-item">
                <span class="print-label">Sentence</span>
                <span class="print-value">${inmateData.sentenceYear} years</span>
              </div>
              <div class="print-item">
                <span class="print-label">Start Date</span>
                <span class="print-value">${formatToLocalDate(inmateData.startDate)}</span>
              </div>
              <div class="print-item">
                <span class="print-label">Parole Date</span>
                <span class="print-value">${formatToLocalDate(paroleDate)}</span>
              </div>
              <div class="print-item">
                <span class="print-label">Release Date</span>
                <span class="print-value">${formatToLocalDate(inmateData.releasedDate)}</span>
              </div>
            </div>
            <div class="print-item" style="margin-top: 15px;">
              <span class="print-label">Sentence Reason</span>
              <span class="print-value">${inmateData.sentenceReason || "Not provided"}</span>
            </div>
          </div>
          
          <div class="print-section">
            <h2>Contact Information</h2>
            <div class="print-grid">
              <div class="print-item">
                <span class="print-label">Contact Name</span>
                <span class="print-value">${inmateData.contactName || "Not provided"}</span>
              </div>
              <div class="print-item">
                <span class="print-label">Phone Number</span>
                <span class="print-value">${inmateData.phoneNumber || "Not provided"}</span>
              </div>
              <div class="print-item">
                <span class="print-label">Region</span>
                <span class="print-value">${inmateData.contactRegion || "Not provided"}</span>
              </div>
              <div class="print-item">
                <span class="print-label">Zone</span>
                <span class="print-value">${inmateData.contactZone || "Not provided"}</span>
              </div>
              <div class="print-item">
                <span class="print-label">Wereda</span>
                <span class="print-value">${inmateData.contactWereda || "Not provided"}</span>
              </div>
              <div class="print-item">
                <span class="print-label">Kebele</span>
                <span class="print-value">${inmateData.contactKebele || "Not provided"}</span>
              </div>
            </div>
          </div>
          
          <div class="print-section">
            <h2>Registrar Information</h2>
            <div class="print-item">
              <span class="print-label">Registrar Worker Name</span>
              <span class="print-value">${inmateData.registrarWorkerName || "Not provided"}</span>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #777;">
            <p>Wolkite Prison Management System</p>
          </div>
        </body>
      </html>
    `;
    
    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Trigger print when content is loaded
    printWindow.onload = function() {
      printWindow.print();
      printWindow.onafterprint = function() {
        printWindow.close();
      };
    };
  };

  useEffect(() => {
    const fetchInmateDetails = async () => {
      if (!_id) {
        console.error("No inmate ID provided");
        toast.error("Missing inmate ID");
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/inmates/get-inmate/${_id}`);
        setInmateData(response.data.inmate);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching inmate details:", error);
        toast.error("Failed to load inmate details.");
        setLoading(false);
      }
    };

    fetchInmateDetails();
  }, [_id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!inmateData) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-gray-500">
        <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h3 className="text-lg font-medium">No data available</h3>
        <p className="mt-2">Could not find inmate details.</p>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      const response = await axiosInstance.delete(
        `/inmate/delete-inmate/${_id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data) {
        toast.success("Inmate record deleted successfully.");
        setOpenDelete(false);
        navigate("/securityStaff-dashboard/inmates");
      } else {
        toast.error("Failed to delete the inmate record.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.error || "Error deleting the inmate record.");
    }
  };

  // Calculate dates and durations
  const paroleDate = calculateParoleDate(inmateData.startDate, inmateData.sentenceYear);
  const durationToParole = calculateDuration(inmateData.startDate, paroleDate);
  const durationFromParoleToEnd = calculateDuration(paroleDate, inmateData.releasedDate);

  // Display an info card with consistent styling
  const InfoCard = ({ title, value, className = "" }) => (
    <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${className}`}>
      <h4 className="text-sm font-medium text-gray-500 mb-1">{title}</h4>
      <p className="text-gray-900 font-medium">{value || "Not provided"}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto mt-8 animate-appear" ref={printRef}>
      {/* Header with profile summary */}
      <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0 bg-gradient-to-r from-teal-500 to-blue-500 text-white p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="h-24 w-24 rounded-full bg-white/20 mx-auto mb-4 flex items-center justify-center">
                <FiUser className="h-12 w-12" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                {inmateData.firstName} {inmateData.middleName} {inmateData.lastName}
              </h1>
              <p className="mt-1 text-white/80">ID: {inmateData._id?.substring(0, 8)}</p>
            </div>
          </div>
          
          <div className="p-6 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Inmate Details</h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  <FiPrinter className="mr-2" />
                  Print
                </button>
               
                <button
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  onClick={() => setOpenDelete(true)}
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard title="Age" value={inmateData.age} />
              <InfoCard title="Case Type" value={inmateData.caseType} />
              <InfoCard 
                title="Sentence" 
                value={`${inmateData.sentenceYear} years`} 
                className="bg-blue-50 border-blue-100" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content in sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Personal Information Section */}
          <section className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden border border-gray-100">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center">
              <FiUser className="text-teal-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard title="Full Name" value={`${inmateData.firstName} ${inmateData.middleName} ${inmateData.lastName}`} />
                <InfoCard title="Birth Date" value={formatToLocalDate(inmateData.birthDate)} />
                <InfoCard title="Mother's Name" value={inmateData.motherName} />
                <InfoCard title="Gender" value={inmateData.gender} />
                <InfoCard title="Nationality" value={inmateData.nationality} />
                <InfoCard title="Marital Status" value={inmateData.maritalStatus} />
              </div>
            </div>
          </section>

          {/* Physical Characteristics Section */}
          <section className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden border border-gray-100">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center">
              <FiInfo className="text-teal-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Physical Characteristics</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCard title="Height" value={`${inmateData.height} cm`} />
                <InfoCard title="Hair Type" value={inmateData.hairType} />
                <InfoCard title="Face" value={inmateData.face} />
                <InfoCard title="Eye Color" value={inmateData.eyeColor} />
                <InfoCard 
                  title="Special Symbol" 
                  value={inmateData.specialSymbol || "None"} 
                  className={inmateData.specialSymbol ? "col-span-full bg-yellow-50 border-yellow-100" : "col-span-full"} 
                />
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-1">
          {/* Case Information Card */}
          <section className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden border border-gray-100">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center">
              <FiFileText className="text-teal-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Case Information</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <InfoCard title="Start Date" value={formatToLocalDate(inmateData.startDate)} />
                <InfoCard 
                  title="Parole Date (2/3 of sentence)" 
                  value={formatToLocalDate(paroleDate)} 
                  className="bg-green-50 border-green-100" 
                />
                <InfoCard title="Time Until Parole" value={durationToParole || 'Not applicable'} />
                <InfoCard title="Duration After Parole" value={durationFromParoleToEnd || 'Not applicable'} />
                <InfoCard title="Release Date" value={formatToLocalDate(inmateData.releasedDate)} />
                
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Sentence Reason</h4>
                  <p className="text-gray-900 text-sm">{inmateData.sentenceReason || "Not provided"}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Information Card */}
          <section className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden border border-gray-100">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center">
              <FiPhoneCall className="text-teal-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Emergency Contact</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <InfoCard title="Contact Name" value={inmateData.contactName} />
                <InfoCard title="Phone Number" value={inmateData.phoneNumber} />
                <InfoCard 
                  title="Address" 
                  value={`${inmateData.contactKebele}, ${inmateData.contactWereda}, ${inmateData.contactZone}, ${inmateData.contactRegion}`} 
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Registrar Information Section */}
      <section className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden border border-gray-100">
        <div className="border-b border-gray-100 px-6 py-4 flex items-center">
          <FiUserCheck className="text-teal-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Registrar Information</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <InfoCard title="Registrar Worker Name" value={inmateData.registrarWorkerName} className="md:flex-grow md:mr-4" />
            
            {inmateData.signature && (
              <div className="mt-4 md:mt-0 md:ml-4 flex-shrink-0">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Signature</h4>
                <img 
                  src={inmateData.signature} 
                  alt="Registrar Signature" 
                  className="max-h-16 border border-gray-200 rounded p-1" 
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <ConfirmModal
        open={openDelete}
        setOpen={setOpenDelete}
        onDelete={handleDelete}
        message="Do you really want to delete this Inmate? This action cannot be undone."
      />
    </div>
  );
};

export default ViewInmate;


