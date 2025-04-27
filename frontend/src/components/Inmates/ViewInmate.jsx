import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 

import ConfirmModal from "../Modals/ConfirmModal";
import { FiUser, FiInfo, FiMapPin, FiPhoneCall, FiFileText, FiUserCheck, FiPrinter, FiArrowLeft, FiArrowRight } from "react-icons/fi";

// CSS for animations
const styles = {
  fadeIn: `
    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(10px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out forwards;
    }
  `,
  hideScrollbar: `
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `
};

const ViewInmate = ({ _id, setOpen, onEdit }) => {
  const [inmateData, setInmateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDelete, setOpenDelete] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const navigate = useNavigate();
  const printRef = useRef();
  
  // Local placeholder image that doesn't require network
  const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ccircle cx='50' cy='40' r='20' fill='%23cbd5e1'/%3E%3Crect x='30' y='70' width='40' height='20' rx='10' fill='%23cbd5e1'/%3E%3C/svg%3E";

  /* 
  NOTE: Physical characteristic dropdowns should be implemented in UpdateInmate.jsx
  with the following options:
  
  hairType: ['Straight', 'Wavy', 'Curly', 'Coily', 'Bald', 'Thin', 'Thick', 'Other']
  face: ['Oval', 'Round', 'Square', 'Rectangle', 'Heart', 'Diamond', 'Triangle', 'Other']
  foreHead: ['Narrow', 'Average', 'Wide', 'High', 'Low', 'Prominent', 'Other']
  nose: ['Straight', 'Roman', 'Button', 'Nubian', 'Hawk', 'Snub', 'Greek', 'Other']
  eyeColor: ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Black', 'Other']
  teeth: ['Straight', 'Crowded', 'Gapped', 'Overbite', 'Underbite', 'Crooked', 'Other']
  lip: ['Thin', 'Medium', 'Full', 'Wide', 'Narrow', 'Heart-shaped', 'Bow-shaped', 'Other']
  ear: ['Attached', 'Detached', 'Small', 'Large', 'Round', 'Pointed', 'Other']
  */

  // Helper function to get proper image URL with improved logging
  const getImageUrl = (photoPath) => {
    console.log("Photo path received:", photoPath);
    console.log("Photo type:", typeof photoPath);
    
    if (!photoPath) {
      console.log("No photo path provided, using placeholder");
      return PLACEHOLDER_IMAGE;
    }
    
    // Special case: if the photo might be JSON stringified or have extra quotes
    if (photoPath.includes('"') || photoPath.includes('\\')) {
      try {
        // Try to parse if it's a JSON string
        const parsed = JSON.parse(photoPath);
        console.log("Parsed JSON photo:", parsed);
        return getImageUrl(parsed); // Recursive call with parsed value
      } catch (e) {
        // Not JSON, might have quotes that need to be removed
        const cleaned = photoPath.replace(/["'\\]/g, '');
        console.log("Cleaned photo path:", cleaned);
        
        if (cleaned !== photoPath) {
          return getImageUrl(cleaned); // Recursive call with cleaned value
        }
      }
    }
    
    // Handle different photo URL formats
    if (typeof photoPath === 'string') {
      if (photoPath.startsWith('http')) {
        console.log("Using direct URL:", photoPath);
        return photoPath;
      }
      
      // Check if it's just a filename or already has /uploads/ in it
      if (photoPath.includes('/uploads/')) {
        console.log("Photo already has /uploads/ path:", photoPath);
        // Check if it needs the server prefix
        if (!photoPath.startsWith('http')) {
          return `http://localhost:5001${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
        }
        return photoPath;
      }
      
      // Regular case - just a filename that needs the full path
      console.log("Using constructed URL with backend path");
      return `http://localhost:5001/uploads/${photoPath}`;
    }
    
    // Fallback
    console.log("Unhandled photo format, using placeholder");
    return PLACEHOLDER_IMAGE;
  };

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

  // States for parole calculation
  const [paroleDate, setParoleDate] = useState(null);
  const [durationToParole, setDurationToParole] = useState(null);
  const [durationFromParoleToEnd, setDurationFromParoleToEnd] = useState(null);
  const [error, setError] = useState(null);

  // Fetch inmate details
  useEffect(() => {
    const fetchInmateDetails = async () => {
      if (!_id) {
        setError("No inmate ID provided");
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/inmates/get-inmate/${_id}`);
        console.log("API Response:", response.data);
        
        const inmate = response.data.inmate;
        
        if (inmate) {
          console.log("RAW PHOTO FIELD VALUE:", inmate.photo);
          console.log("PHOTO TYPE:", typeof inmate.photo);
          
          // Set default photo if missing
          if (!inmate.photo) {
            console.log("Photo field is empty/null/undefined, setting default");
            inmate.photo = "default.png";
          }
          
          setInmateData(inmate);
          
          // Calculate parole date
          if (inmate.startDate && inmate.sentenceYear) {
            const calculatedParoleDate = calculateParoleDate(inmate.startDate, inmate.sentenceYear);
            setParoleDate(calculatedParoleDate);
            
            // Calculate time until parole
            const today = new Date();
            const paroleDate = new Date(calculatedParoleDate);
            if (paroleDate > today) {
              setDurationToParole(calculateDuration(today.toISOString(), calculatedParoleDate));
            } else {
              setDurationToParole("Eligible for parole");
            }
            
            // Calculate time from parole to end
            if (inmate.releasedDate) {
              setDurationFromParoleToEnd(calculateDuration(calculatedParoleDate, inmate.releasedDate));
            }
          }
        } else {
          setError("Inmate not found");
        }
      } catch (error) {
        console.error("Error fetching inmate details:", error);
        setError("Failed to fetch inmate details");
        toast.error("Failed to load inmate details");
      } finally {
        setLoading(false);
      }
    };

    fetchInmateDetails();
  }, [_id]);

  // Add styles to document head
  useEffect(() => {
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles.fadeIn + styles.hideScrollbar;
    document.head.appendChild(styleElement);
    
    // Clean up
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/inmates/delete-inmate/${_id}`);
      toast.success("Inmate deleted successfully");
      setOpenDelete(false);
      navigate(-1);
    } catch (error) {
      console.error("Error deleting inmate:", error);
      toast.error("Failed to delete inmate");
    }
  };

  // Define tabs for navigation
  const tabs = [
    { id: "personal", label: "Personal", icon: <FiUser className="mr-2" /> },
    { id: "location", label: "Location", icon: <FiMapPin className="mr-2" /> },
    { id: "physical", label: "Physical", icon: <FiInfo className="mr-2" /> },
    { id: "contact", label: "Contact", icon: <FiPhoneCall className="mr-2" /> },
    { id: "case", label: "Case", icon: <FiFileText className="mr-2" /> },
  ];

  // Handle tab navigation
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Navigate to next/previous tab
  const navigateTab = (direction) => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (direction === 'next' && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    } else if (direction === 'prev' && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error || !inmateData) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p>{error || "Failed to load inmate data"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg" ref={printRef}>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Header with Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              {inmateData ? (
                <img 
                  src={inmateData.photo 
                    ? `http://localhost:5001/uploads/${inmateData.photo}`
                    : PLACEHOLDER_IMAGE
                  }
                  alt={`${inmateData.firstName} ${inmateData.lastName}`}
                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 mr-4"
                  onError={(e) => {
                    console.log("ID-based image failed to load, trying filename approach");
                    // Try the usual filename approach as fallback
                    if (inmateData.photo) {
                      e.target.src = `http://localhost:5001/uploads/${inmateData.photo.replace(/^\/+/, '')}`;
                      
                      // Set second fallback
                      e.target.onerror = () => {
                        console.log("All image loading approaches failed, using placeholder");
                        e.target.onerror = null;
                        e.target.src = PLACEHOLDER_IMAGE;
                      };
                      return;
                    }
                    
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_IMAGE;
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 border-2 border-blue-500 mr-4 flex items-center justify-center">
                  <span className="text-gray-400">No img</span>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{inmateData.firstName} {inmateData.middleName} {inmateData.lastName}</h2>
                <p className="text-gray-600">
                  {inmateData.gender}, {inmateData.age} years old
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={handlePrint}
                className="px-3 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors flex items-center"
              >
                <FiPrinter className="mr-1" /> Print
              </button>
             
              <button
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                onClick={() => setOpenDelete(true)}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-200">
              <div className="flex overflow-x-auto hide-scrollbar">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-6 py-4 flex items-center whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="flex pr-2">
                <button
                  type="button"
                  onClick={() => navigateTab('prev')}
                  disabled={activeTab === tabs[0].id}
                  className={`p-2 rounded-full ${
                    activeTab === tabs[0].id
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FiArrowLeft />
                </button>
                <button
                  type="button"
                  onClick={() => navigateTab('next')}
                  disabled={activeTab === tabs[tabs.length - 1].id}
                  className={`p-2 rounded-full ${
                    activeTab === tabs[tabs.length - 1].id
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FiArrowRight />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div className="animate-fadeIn bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Full Name</h4>
                    <p className="mt-1">{inmateData.firstName} {inmateData.middleName} {inmateData.lastName}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Age</h4>
                    <p className="mt-1">{inmateData.age}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Birth Date</h4>
                    <p className="mt-1">{formatToLocalDate(inmateData.birthDate)}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Mother's Name</h4>
                    <p className="mt-1">{inmateData.motherName || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Gender</h4>
                    <p className="mt-1 capitalize">{inmateData.gender}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Nationality</h4>
                    <p className="mt-1">{inmateData.nationality || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Religion</h4>
                    <p className="mt-1">{inmateData.religion || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Marital Status</h4>
                    <p className="mt-1">{inmateData.maritalStatus || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Education Level</h4>
                    <p className="mt-1">{inmateData.degreeLevel || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Work/Occupation</h4>
                    <p className="mt-1">{inmateData.work || "Not provided"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Physical Characteristics Tab */}
            {activeTab === 'physical' && (
              <div className="animate-fadeIn bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Physical Characteristics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Height</h4>
                    <p className="mt-1">{inmateData.height ? `${inmateData.height} cm` : "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Hair Type</h4>
                    <p className="mt-1">{inmateData.hairType || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Face</h4>
                    <p className="mt-1">{inmateData.face || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Forehead</h4>
                    <p className="mt-1">{inmateData.foreHead || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Nose</h4>
                    <p className="mt-1">{inmateData.nose || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Eye Color</h4>
                    <p className="mt-1">{inmateData.eyeColor || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Teeth</h4>
                    <p className="mt-1">{inmateData.teeth || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Lip</h4>
                    <p className="mt-1">{inmateData.lip || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Ear</h4>
                    <p className="mt-1">{inmateData.ear || "Not provided"}</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500">Special Symbols or Marks</h4>
                  <p className="mt-1">{inmateData.specialSymbol || "None"}</p>
                </div>
              </div>
            )}

            {/* Case Information Tab Content */}
            {activeTab === 'case' && (
              <div className="animate-fadeIn bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Case Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Case Type</h4>
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block 
                        ${inmateData.caseType?.toLowerCase() === 'criminal' ? 'bg-red-100 text-red-800' : 
                          inmateData.caseType?.toLowerCase() === 'civil' ? 'bg-blue-100 text-blue-800' : 
                          inmateData.caseType?.toLowerCase() === 'administrative' ? 'bg-green-100 text-green-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {inmateData.caseType || "Not provided"}
                      </span>
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Sentence</h4>
                    <p className="mt-1 font-medium">{inmateData.sentenceYear ? `${inmateData.sentenceYear} year${inmateData.sentenceYear !== 1 ? 's' : ''}` : "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Start Date</h4>
                    <p className="mt-1">{formatToLocalDate(inmateData.startDate)}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Projected Release Date</h4>
                    <p className="mt-1">{formatToLocalDate(inmateData.releasedDate)}</p>
                  </div>
                  
                  {inmateData.startDate && inmateData.sentenceYear && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Parole Eligibility</h4>
                      <p className="mt-1">{formatToLocalDate(paroleDate)}</p>
                    </div>
                  )}
                  
                  {inmateData.startDate && inmateData.releasedDate && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Duration</h4>
                      <p className="mt-1">{calculateDuration(inmateData.startDate, inmateData.releasedDate)}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500">Sentence Reason</h4>
                  <p className="mt-1 bg-gray-50 p-3 rounded border border-gray-100">{inmateData.sentenceReason || "Not provided"}</p>
                </div>
              </div>
            )}

            {/* Contact Information Tab Content */}
            {activeTab === 'contact' && (
              <div className="animate-fadeIn bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Contact Name</h4>
                    <p className="mt-1">{inmateData.contactName || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Phone Number</h4>
                    <p className="mt-1">{inmateData.phoneNumber || "Not provided"}</p>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Contact Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Region</h4>
                    <p className="mt-1">{inmateData.contactRegion || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Zone</h4>
                    <p className="mt-1">{inmateData.contactZone || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Wereda</h4>
                    <p className="mt-1">{inmateData.contactWereda || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Kebele</h4>
                    <p className="mt-1">{inmateData.contactKebele || "Not provided"}</p>
                  </div>
                </div>
                
                {inmateData.registrarWorkerName && (
                  <div className="mt-8 border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Registrar Information</h3>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Registrar Name</h4>
                      <p className="mt-1">{inmateData.registrarWorkerName}</p>
                    </div>
                    
                    {inmateData.signature && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-500">Signature</h4>
                        <img 
                          src={inmateData.signature} 
                          alt="Signature" 
                          className="mt-2 max-h-16 border border-gray-200 p-1 rounded" 
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Location Information Tab Content */}
            {activeTab === 'location' && (
              <div className="animate-fadeIn bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Birth Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Region</h4>
                    <p className="mt-1">{inmateData.birthRegion || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Zone</h4>
                    <p className="mt-1">{inmateData.birthZone || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Wereda</h4>
                    <p className="mt-1">{inmateData.birthWereda || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Kebele</h4>
                    <p className="mt-1">{inmateData.birthKebele || "Not provided"}</p>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Current Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Region</h4>
                    <p className="mt-1">{inmateData.currentRegion || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Zone</h4>
                    <p className="mt-1">{inmateData.currentZone || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Wereda</h4>
                    <p className="mt-1">{inmateData.currentWereda || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Kebele</h4>
                    <p className="mt-1">{inmateData.currentKebele || "Not provided"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Navigation */}
            <div className="flex flex-col items-center mt-6 pt-4 border-t border-gray-200">
              {/* Step progress */}
              <div className="mb-2 text-sm text-gray-600">
                Tab {tabs.findIndex(tab => tab.id === activeTab) + 1} of {tabs.length}
              </div>

              {/* Tab dots navigation */}
              <div className="flex justify-center mb-4 space-x-2">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      activeTab === tab.id 
                        ? 'bg-blue-600 transform scale-125' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to ${tab.label} tab`}
                  />
                ))}
              </div>
              
              <div className="flex justify-between w-full">
                <div className="flex items-center">
                  {activeTab !== tabs[0].id && (
                    <button
                      type="button"
                      onClick={() => navigateTab('prev')}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors flex items-center"
                    >
                      <FiArrowLeft className="mr-2" />
                      Previous
                    </button>
                  )}
                </div>
                  
                <div className="flex items-center">
                  {activeTab !== tabs[tabs.length - 1].id && (
                    <button
                      type="button"
                      onClick={() => navigateTab('next')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center"
                    >
                      Next
                      <FiArrowRight className="ml-2" />
                    </button>
                  )}
                  
                  {activeTab === tabs[tabs.length - 1].id && onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(_id)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center"
                    >
                      Edit Inmate
                      <FiUserCheck className="ml-2" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        open={openDelete}
        setOpen={setOpenDelete}
        title="Delete Inmate"
        message="Are you sure you want to delete this inmate? This action will archive the inmate record and it can be restored from the archive system if needed."
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ViewInmate;


