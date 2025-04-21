import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmModal from "@/components/Modals/ConfirmModal";
import { FiArrowLeft, FiTrash2, FiSend, FiPrinter, FiFilePlus, FiFileText, FiCalendar, FiUser, FiMapPin, FiBookOpen } from "react-icons/fi";

// Helper function to calculate age from birthdate
const calculateAge = (birthdate) => {
  if (!birthdate) return "N/A";
  
  const birthDate = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const ViewInstruction = ({ id }) => {
  const navigate = useNavigate();
  const [instruction, setInstruction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const contentRef = useRef(null);

  // Format date to localized string
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const deleteInstruct = async () => {
    try {
        const deletedInstruct = await axiosInstance.delete(
          `/instruction/delete/${id}`
        );
        if (deletedInstruct) {
          toast.success("Instruction deleted successfully!");
        setOpenDelete(false);
        navigate("/court-dashboard/list");
      }
    } catch (error) {
      setError(error.response?.data?.error || "Error deleting Instruction");
    }
  };

  const sendInstruction = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Use the same endpoint for both send and resend operations
      const response = await axiosInstance.post(`/instruction/send/${id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      if (response.data && response.data.success) {
        toast.success(instruction.status === 'sent' 
          ? "Instruction resent successfully!" 
          : "Instruction sent successfully!");
        
        // Update the instruction status
        setInstruction({
          ...instruction,
          status: 'sent'
        });
      } else {
        toast.error(response.data?.message || "Failed to send instruction");
      }
    } catch (error) {
      console.error("Error sending instruction:", error);
      toast.error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        "Error sending instruction"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const content = contentRef.current;
    const printWindow = window.open("", "", "height=600,width=800");
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Court Instruction - ${instruction?.courtCaseNumber || "Details"}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 10px;
              border-bottom: 2px solid #333;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .case-number {
              font-size: 16px;
              color: #555;
            }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-weight: bold;
              margin-bottom: 5px;
              font-size: 16px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            .field {
              margin-bottom: 15px;
            }
            .field-label {
              font-weight: bold;
              display: block;
              margin-bottom: 3px;
            }
            .field-value {
              padding: 5px;
              background-color: #f5f5f5;
              border-radius: 3px;
            }
            .full-width {
              grid-column: span 2;
            }
            .image-container {
              text-align: center;
              margin: 20px 0;
            }
            .image-container img {
              max-width: 100%;
              max-height: 300px;
              border: 1px solid #ddd;
              padding: 5px;
              background: white;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #777;
              border-top: 1px solid #ddd;
              padding-top: 10px;
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
          <div class="header">
            <div class="title">Court Instruction</div>
            <div class="case-number">Case Number: ${instruction?.courtCaseNumber || "N/A"}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Personal Information</div>
            <div class="grid">
              <div class="field">
                <div class="field-label">Name:</div>
                <div class="field-value">${instruction?.firstName || ""} ${instruction?.middleName || ""} ${instruction?.lastName || ""}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Gender:</div>
                <div class="field-value">${instruction?.gender || "N/A"}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Birth Date:</div>
                <div class="field-value">${formatDate(instruction?.birthdate)}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Age:</div>
                <div class="field-value">${calculateAge(instruction?.birthdate)}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Nationality:</div>
                <div class="field-value">${instruction?.nationality || "N/A"}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Marital Status:</div>
                <div class="field-value">${instruction?.maritalStatus || "N/A"}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Case Information</div>
            <div class="grid">
              <div class="field">
                <div class="field-label">Prison Name:</div>
                <div class="field-value">${instruction?.prisonName || "N/A"}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Judge Name:</div>
                <div class="field-value">${instruction?.judgeName || "N/A"}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Verdict:</div>
                <div class="field-value">${instruction?.verdict === "guilty" ? "Guilty" : instruction?.verdict === "not_guilty" ? "Not Guilty" : instruction?.verdict || "N/A"}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Hearing Date:</div>
                <div class="field-value">${formatDate(instruction?.hearingDate)}</div>
              </div>
              
              <div class="field full-width">
                <div class="field-label">Instructions:</div>
                <div class="field-value">${instruction?.instructions || "N/A"}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Effective Date:</div>
                <div class="field-value">${formatDate(instruction?.effectiveDate)}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Send Date:</div>
                <div class="field-value">${formatDate(instruction?.sendDate)}</div>
              </div>
            </div>
          </div>
          
          <div class="image-container">
            <div class="field-label">Attachment:</div>
            <img src="http://localhost:5001/uploads/${instruction?.attachment}" alt="Attachment" />
          </div>
          
          <div class="image-container">
            <div class="field-label">Signature:</div>
            <img src="http://localhost:5001/uploads/${instruction?.signature}" alt="Signature" />
          </div>
          
          <div class="footer">
            <p>Printed on ${new Date().toLocaleString()}</p>
            <p>This is an official court document</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Print after content loads
    printWindow.onload = function() {
      printWindow.print();
      printWindow.onafterprint = function() {
        printWindow.close();
      };
    };
  };

  useEffect(() => {
    const fetchInstruction = async () => {
      try {
        const response = await axiosInstance.get(
          `/instruction/get-instruct/${id}`
        );

        if (response.data && response.data.instruction) {
          setInstruction(response.data.instruction);
        } else {
          setError("Instruction details not found.");
        }
      } catch (error) {
        console.error("Error fetching instruction details:", error);
        setError(
          error.response?.data?.error ||
            "An error occurred while fetching instruction details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInstruction();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-10 bg-red-50 p-6 rounded-lg border border-red-200 text-center">
        <div className="text-red-600 font-semibold mb-4">{error}</div>
        <button
          onClick={() => navigate("/court-dashboard/list")}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          <FiArrowLeft className="inline mr-2" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6 mb-10" ref={contentRef}>
      {/* Header with actions */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-t-lg shadow-md">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/court-dashboard/list")}
              className="mr-4 bg-white bg-opacity-20 text-white p-2 rounded-full hover:bg-opacity-30 transition-colors"
              aria-label="Go back"
            >
              <FiArrowLeft />
            </button>
            <h2 className="text-xl font-bold text-white">Court Instruction</h2>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="bg-white text-blue-600 font-medium py-1.5 px-3 rounded-md hover:bg-blue-50 transition-colors flex items-center"
            >
              <FiPrinter className="mr-1" /> Print
            </button>
            <button
              onClick={() => {
                sendInstruction();
              }}
              className={`${
                instruction.status === 'sent' 
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              } font-medium py-1.5 px-3 rounded-md transition-colors flex items-center`}
              disabled={loading}
              title={instruction.status === 'sent' ? "Resend this instruction" : "Send instruction"}
            >
              <FiSend className="mr-1" /> 
              {loading ? "Sending..." : instruction.status === 'sent' ? "Resend" : "Send"}
            </button>
            <button
              onClick={() => setOpenDelete(true)}
              className="bg-red-600 text-white font-medium py-1.5 px-3 rounded-md hover:bg-red-700 transition-colors flex items-center"
            >
              <FiTrash2 className="mr-1" /> Delete
            </button>
          </div>
        </div>
        
        {/* Case Number Banner */}
        <div className="bg-white bg-opacity-10 text-white px-6 py-2 text-sm font-medium">
          <span className="mr-2">Case Number:</span>
          <span className="font-bold">{instruction.courtCaseNumber}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-white rounded-b-lg shadow-md p-6 border border-gray-200">
        {/* Personal Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center border-b pb-2">
            <FiUser className="mr-2" /> Personal Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Full Name</h4>
              <p className="text-base font-medium text-gray-800">
                {instruction.firstName} {instruction.middleName} {instruction.lastName}
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Birth Date</h4>
              <p className="text-base font-medium text-gray-800 flex items-center">
                <FiCalendar className="mr-2 text-gray-500" size={14} />
                {formatDate(instruction.birthdate)}
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Age</h4>
              <p className="text-base font-medium text-gray-800">
                {calculateAge(instruction.birthdate)}
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Gender</h4>
              <p className="text-base font-medium text-gray-800">
                {instruction.gender ? instruction.gender.charAt(0).toUpperCase() + instruction.gender.slice(1) : "N/A"}
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Nationality</h4>
              <p className="text-base font-medium text-gray-800">
                {instruction.nationality || "N/A"}
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Marital Status</h4>
              <p className="text-base font-medium text-gray-800">
                {instruction.maritalStatus ? instruction.maritalStatus.charAt(0).toUpperCase() + instruction.maritalStatus.slice(1) : "N/A"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Address Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center border-b pb-2">
            <FiMapPin className="mr-2" /> Address Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h4 className="text-sm font-semibold text-green-800 mb-2">Birth Address</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Region</p>
                  <p className="font-medium">{instruction.birthRegion || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Zone</p>
                  <p className="font-medium">{instruction.birthZone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Woreda</p>
                  <p className="font-medium">{instruction.birthWoreda || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Kebele</p>
                  <p className="font-medium">{instruction.birthKebele || "N/A"}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <h4 className="text-sm font-semibold text-amber-800 mb-2">Current Address</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Region</p>
                  <p className="font-medium">{instruction.currentRegion || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Zone</p>
                  <p className="font-medium">{instruction.currentZone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Woreda</p>
                  <p className="font-medium">{instruction.currentWoreda || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Kebele</p>
                  <p className="font-medium">{instruction.currentKebele || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Education/Occupation Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center border-b pb-2">
            <FiBookOpen className="mr-2" /> Education & Occupation
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Education Level</p>
                  <p className="font-medium">{instruction.educationLevel || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Occupation</p>
                  <p className="font-medium">{instruction.occupation || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Case Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center border-b pb-2">
            <FiFileText className="mr-2" /> Case Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Information Cards */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Prison Name</h3>
              <p className="text-lg font-medium text-gray-800">{instruction.prisonName}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Judge Name</h3>
              <p className="text-lg font-medium text-gray-800">{instruction.judgeName}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Case Type</h3>
              <p className="text-lg font-medium text-gray-800">{instruction.caseType || "N/A"}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Sentence (Years)</h3>
              <p className="text-lg font-medium text-gray-800">{instruction.sentenceYear || "N/A"}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Verdict</h3>
              <p className="text-lg font-medium text-gray-800">
                {instruction.verdict === "guilty" ? (
                  <span className="text-red-600 font-semibold">Guilty</span>
                ) : instruction.verdict === "not_guilty" ? (
                  <span className="text-green-600 font-semibold">Not Guilty</span>
                ) : (
                  instruction.verdict || "N/A"
                )}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Hearing Date</h3>
              <p className="text-lg font-medium text-gray-800 flex items-center">
                <FiCalendar className="mr-2 text-gray-500" size={14} />
                {formatDate(instruction.hearingDate)}
              </p>
            </div>
            
            <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100 mt-2">
              <h3 className="text-sm font-semibold text-blue-800 uppercase mb-2">Instructions</h3>
              <div className="bg-white p-3 rounded border border-blue-100 min-h-[100px] whitespace-pre-wrap">
                {instruction.instructions || "No specific instructions provided."}
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-800 uppercase mb-2">Effective Date</h3>
              <p className="text-base font-medium text-gray-800">{formatDate(instruction.effectiveDate)}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-800 uppercase mb-2">Send Date</h3>
              <p className="text-base font-medium text-gray-800">{formatDate(instruction.sendDate)}</p>
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
            <FiFilePlus className="mr-2" /> Attachments
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {instruction.attachment && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Case Attachment</h4>
                <div className="border rounded-md overflow-hidden">
                  <img 
                    src={`http://localhost:5001/uploads/${instruction.attachment}`} 
                    alt="Case Attachment"
                    className="max-w-full h-auto object-contain max-h-[300px]"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/300x200?text=Document+Not+Available";
                    }}
                  />
                </div>
                <div className="mt-2 text-center">
                  <a 
                    href={`http://localhost:5001/uploads/${instruction.attachment}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Full Size
                  </a>
                </div>
              </div>
            )}
            
            {instruction.signature && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Official Signature</h4>
                <div className="border rounded-md overflow-hidden">
                  <img 
                    src={`http://localhost:5001/uploads/${instruction.signature}`} 
                    alt="Signature"
                    className="max-w-full h-auto object-contain max-h-[200px]"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/300x200?text=Signature+Not+Available";
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Status Information */}
      <div className="mt-6 border-t pt-4">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Instruction Status</h3>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              instruction.status === 'sent' ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span className="font-medium">
              {instruction.status === 'sent' ? 'Sent' : 'Draft'}
            </span>
          </div>
        </div>
      </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          open={openDelete}
          message="Are you sure you want to delete this instruction?"
          onConfirm={deleteInstruct}
          onCancel={() => setOpenDelete(false)}
        />
      </div>
    </div>
  );
};

export default ViewInstruction;
