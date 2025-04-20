import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { useParams, useNavigate } from "react-router-dom";
import { FaPrint, FaFilePdf, FaCheck, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import ParoleRejectModal from "./ParoleRejectModal";
import ParoleAccept from "./ParoleAccept";
import { Card, CardContent } from "@/components/ui/card";

const ViewParole = ({ id }) => {
  const [inmateData, setInmateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [openAccept, setOpenAccept] = useState(false);
  const printableContentRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInmateDetails = async () => {
      try {
        const response = await axiosInstance.get(`/parole-tracking/${id}`);
        setInmateData(response.data.parole);
      } catch (error) {
        console.error("Error fetching inmate details:", error);
        toast.error("Failed to load inmate details.");
      } finally {
        setLoading(false);
      }
    };

    fetchInmateDetails();
  }, [id]);

  const handleRejectParole = async ({ reason, date }) => {
    try {
      const status="rejected"
      await axiosInstance.put(`/parole-tracking/update/${id}`, { reason, date, status });
      toast.success("Parole request rejected successfully.");
    } catch (error) {
      toast.error("Failed to reject parole request.");
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toISOString().split('T')[0];
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  const handlePrint = () => {
    const printContent = printableContentRef.current;
    if (!printContent) return;

    const contentClone = printContent.cloneNode(true);
    
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Parole Request Document</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700&display=swap');
            
            body {
              font-family: 'Noto Sans Ethiopic', Arial, sans-serif;
              padding: 20px;
              line-height: 1.5;
              color: #333;
            }
            
            .document-container {
              max-width: 800px;
              margin: 0 auto;
              position: relative;
              padding: 20px;
              background-color: white;
            }
            
            .card-content {
              position: relative;
            }
            
            .header-right {
              position: absolute;
              top: 0;
              right: 0;
              text-align: right;
            }
            
            .field-value {
              display: inline-block;
              padding: 2px 6px;
              background-color: #f8fafc;
              border-radius: 4px;
              font-weight: 600;
              margin: 0 5px;
              border: 1px solid #cbd5e1;
              color: #1e293b;
            }
            
            .main-content {
              margin-top: 120px;
            }
            
            .recipient-section {
              margin-bottom: 30px;
            }
            
            .case-details {
              margin-top: 30px;
            }
            
            .leading-loose {
              line-height: 2;
            }
            
            .mt-3 { margin-top: 0.75rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-10 { margin-top: 2.5rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-8 { margin-bottom: 2rem; }
            .my-4 { margin-top: 1rem; margin-bottom: 1rem; }
            .mx-2 { margin-left: 0.5rem; margin-right: 0.5rem; }
            .mr-3 { margin-right: 0.75rem; }
            .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .pt-32 { padding-top: 8rem; }
            
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-end { justify-content: flex-end; }
            .float-end { float: right; }
            .text-right { text-align: right; }
            .font-medium { font-weight: 500; }
            .rounded { border-radius: 0.25rem; }
            .bg-gray-50 { background-color: #f9fafb; }
            .space-y-4 > * + * { margin-top: 1rem; }
            
            .signature {
              text-align: right;
              margin-top: 30px;
              margin-right: 0.75rem;
            }
            
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              
              .document-container {
                box-shadow: none;
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="document-container">
            ${contentClone.innerHTML}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!inmateData) {
    return (
      <div className="flex flex-col justify-center items-center h-[500px]">
        <div className="text-xl text-gray-600">No data available</div>
        <button 
          onClick={() => navigate(-1)} 
          className="mt-4 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  const acceptParole = async({ reason, date }) => {
    try {
      const status="accepted"
      await axiosInstance.put(`/parole-tracking/update/${id}`, { reason, date, status });
      toast.success("Parole request Accept successfully.");
    } catch (error) {
      toast.error("Failed to accept parole request.");
    }
  };

  return (
    <div className="w-full mx-auto bg-white p-4 lg:p-8 rounded-lg shadow-lg">
      {/* Header with title and document controls */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Parole Request Details
          </h2>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-200 px-3 py-1 rounded-md">
              <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
              <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                inmateData.status === "accepted" 
                  ? "bg-green-100 text-green-800" 
                  : inmateData.status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {inmateData.status ? inmateData.status.charAt(0).toUpperCase() + inmateData.status.slice(1) : "Pending"}
              </span>
            </div>
            
            <button 
              onClick={handlePrint} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center transition-all duration-200 shadow-sm"
            >
              <FaPrint className="mr-2" /> Print
            </button>
          </div>
        </div>
      </div>

      {/* Document content */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div ref={printableContentRef}>
          <CardContent className="card-content">
            {/* Header with number and date - positioned to the right */}
            <div className="header-right float-end">
              <div className="flex mb-2 justify-end">
                <span className="mr-3 font-medium text-slate-800">ቁጥር</span>
                <span className="field-value font-medium px-2 py-1 bg-slate-100 rounded shadow-sm border border-slate-300 text-slate-900">{inmateData.request.number}</span>
              </div>
              <div className="flex mb-4 justify-end">
                <span className="mr-3 font-medium text-slate-800">ቀን</span> 
                <span className="field-value font-medium px-2 py-1 bg-slate-100 rounded shadow-sm border border-slate-300 text-slate-900">{formatDate(inmateData.request.date)}</span>
              </div>
            </div>
            
            {/* Main content with spacing matching the page view */}
            <div className="main-content pt-32 mt-10">
              {/* Recipient section */}
              <div className="recipient-section mb-8">
                <div className="flex mb-2">
                  <span className="text-slate-800 font-medium">ለ</span>
                  <span className="field-value font-medium px-2 py-1 mx-2 bg-slate-100 rounded shadow-sm border border-slate-300 text-slate-900">{inmateData.request.receiverName}</span>
                  <span className="text-slate-800 font-medium">ፍ/ቤት</span>
                </div>
                
                <div className="flex mb-4">
                  <span className="text-slate-800 font-medium">የወ/መ/ቁ</span>
                  <span className="field-value font-medium px-2 py-1 mx-2 bg-slate-100 rounded shadow-sm border border-slate-300 text-slate-900">{inmateData.request.referenceNumber}</span>
                </div>
              </div>
              
              {/* Case details section */}
              <div className="case-details mt-10">
                <p className="leading-loose text-slate-800">
                  የህግ ታራሚ ስም:
                  <span className="field-value font-medium px-2 py-1 mx-2 bg-slate-100 rounded inline-block shadow-sm border border-slate-300 text-slate-900">{inmateData.fullName}</span>
                  የተባለው የህግ ታራሚ በአመክሮ መፈቻ ጥያቄ በተከሰሰበት
                  <span className="field-value font-medium px-2 py-1 mx-2 bg-slate-100 rounded inline-block shadow-sm border border-slate-300 text-slate-900">{inmateData.caseType}</span>
                  ወንጀል እስራት እንዲቀጣ በወሰነው መሠረት ከዚህ ውስጥ 2/3ኛው
                  <span className="field-value font-medium px-2 py-1 mx-2 bg-slate-100 rounded inline-block shadow-sm border border-slate-300 text-slate-900">{inmateData.durationToParole}</span>
                  በእስራት የፈጸመ ሲሆን 1/3ኛውን
                  <span className="field-value font-medium px-2 py-1 mx-2 bg-slate-100 rounded inline-block shadow-sm border border-slate-300 text-slate-900">{inmateData.durationFromParoleToEnd}</span>
                  ቅናሽ አግጋቶዋል፡፡ አሁንም በጠቅላላው ከተፈረደበት የእስራት ጊዜ ውስጥ ወደፊት የሚቀረው
                  <span className="field-value font-medium px-2 py-1 mx-2 bg-slate-100 rounded inline-block shadow-sm border border-slate-300 text-slate-900">{inmateData.durationFromParoleToEnd}</span>
                </p>
              </div>
              
              <p className="my-4 text-slate-800 font-medium">
                በዚህ መሠረት የህግ ታራሚው ጠቅላይ ፍርድ 2/3ኛውን የታሠረ በመሆኑ በአከሮ ለመፈታት የደረሰ ሆኖ
                ተገኝቶዋል፡፡የኸውም የህግ ታራሚው በዚህ ማቤት በኖረባቸው ዘመኖች መልካም ፀባይ ይዞ የቆየ መሆኑንና የታዘዘውን
                ሥራ በቅን የሠራ ነው እንዲሁም ፀባዩን ያረመና ወደ ማህበራዊ ኑሮ ተመልሶ ለመቀላቀል የሚበቃ ሆኖ ተገኝቶዋል፡፡
              </p>
              
              <p className="mt-3 mb-2 text-slate-800 font-medium">በዚሁ ረገድ በቆየበት ጊዜ ያሣየውን መልካም ፀባዩን የሚያረጋግጥ</p>
              
              <div className="flex mb-2 items-center">
                <span className="text-slate-800 font-medium">1/ታራሚው ማ/ቤት የገባበት</span>
                <span className="field-value font-medium px-2 py-1 mx-2 bg-slate-100 rounded shadow-sm border border-slate-300 text-slate-900">{formatDate(inmateData.startDate)}</span>
              </div>
              
              <div className="flex mb-2 items-center">
                <span className="text-slate-800 font-medium">2/ ታራሚው አስራቱ ጨርሶ የሚፈታው</span>
                <span className="field-value font-medium px-2 py-1 mx-2 bg-slate-100 rounded shadow-sm border border-slate-300 text-slate-900">{formatDate(inmateData.releasedDate)}</span>
              </div>
              
              <div className="flex mb-2 items-center">
                <span className="text-slate-800 font-medium">3/ በአመክሮ የሚፈታው</span>
                <span className="field-value font-medium px-2 py-1 mx-2 bg-slate-100 rounded shadow-sm border border-slate-300 text-slate-900">{formatDate(inmateData.paroleDate)}</span>
              </div>
              
              <div className="flex mb-2 items-center">
                <span className="text-slate-800 font-medium">4/ በፀባይ ነጥብ መስጨ የተገኘ</span>
                <span className="field-value font-medium px-2 py-1 mx-2 bg-slate-100 rounded shadow-sm border border-slate-300 text-slate-900">{inmateData.totalPoints}</span>
              </div>
              
              <p className="my-4 text-slate-800 font-medium">
                5/ ስለጉዳት ካሣና እርቅ ማዉረድ የተሠጠ መግለጫ 6 ስለ ሙያና ሥራ ችሎታ ስለ መተዳደሪያ ከተቀመጠው ኮሚቴ
                የተሠጠው የምስክርነት በአጠቃላይ ያቀረብን በ997 በወጣው የኢፊድሪ የወ/መ/ህ/ቁጥር 12 በአንቀጽ 13 በወ/መ/ቁ
                206 በአንቀጽ 201207 በአንቀጽ 202 209 እና 204 በወንጀል ህጉ መሠረት በአመክሮ እንዲፈታ
                እንጠይቃለን፡፡
              </p>
              
              <p className="signature text-right mt-4 mr-3 font-semibold text-slate-800">ከሠላምታ ጋር</p>
            </div>
          </CardContent>
        </div>
      </div>

      {/* Action section */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-md action-buttons-container">
        {/* Inmate info summary */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-md shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Inmate Information</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium text-gray-700">Name:</div>
              <div className="text-sm font-semibold text-slate-900 bg-slate-50 py-1 px-2 rounded border border-slate-200">{inmateData.fullName}</div>
              
              <div className="text-sm font-medium text-gray-700">Crime Type:</div>
              <div className="text-sm font-semibold text-slate-900 bg-slate-50 py-1 px-2 rounded border border-slate-200">{inmateData.caseType}</div>
              
              <div className="text-sm font-medium text-gray-700">Total Points:</div>
              <div className="text-sm font-semibold text-slate-900 bg-slate-50 py-1 px-2 rounded border border-slate-200">{inmateData.totalPoints}</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-md shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Important Dates</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium text-gray-700">Start Date:</div>
              <div className="text-sm font-semibold text-slate-900 bg-slate-50 py-1 px-2 rounded border border-slate-200">{formatDate(inmateData.startDate)}</div>
              
              <div className="text-sm font-medium text-gray-700">Parole Date:</div>
              <div className="text-sm font-semibold text-slate-900 bg-slate-50 py-1 px-2 rounded border border-slate-200">{formatDate(inmateData.paroleDate)}</div>
              
              <div className="text-sm font-medium text-gray-700">Release Date:</div>
              <div className="text-sm font-semibold text-slate-900 bg-slate-50 py-1 px-2 rounded border border-slate-200">{formatDate(inmateData.releasedDate)}</div>
            </div>
          </div>
        </div>
        
        {/* Status Message */}
        {(inmateData.status === "accepted" || inmateData.status === "rejected") && (
          <div className="mb-6 p-4 bg-gray-100 border-l-4 border-blue-500 rounded-md">
            <div className="flex items-start">
              <div className="mr-3 text-blue-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  This parole request has already been {inmateData.status}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  No further action is required for this request.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => {
              if (inmateData.status === "accepted" || inmateData.status === "rejected") {
                toast.info(`This parole request has already been ${inmateData.status}`, {
                  position: "top-right",
                  autoClose: 3000,
                });
              } else {
                setOpenAccept(true);
              }
            }}
            className={`w-full sm:w-auto font-bold py-3 px-6 rounded-md flex items-center justify-center ${
              inmateData.status === "accepted" || inmateData.status === "rejected"
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            }`}
            disabled={inmateData.status === "accepted" || inmateData.status === "rejected"}
          >
            <FaCheck className="mr-2" /> Accept Parole
          </button>

          <button
            onClick={() => {
              if (inmateData.status === "accepted" || inmateData.status === "rejected") {
                toast.info(`This parole request has already been ${inmateData.status}`, {
                  position: "top-right",
                  autoClose: 3000,
                });
              } else {
                setIsRejectModalOpen(true);
              }
            }}
            className={`w-full sm:w-auto font-bold py-3 px-6 rounded-md flex items-center justify-center ${
              inmateData.status === "accepted" || inmateData.status === "rejected"
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            }`}
            disabled={inmateData.status === "accepted" || inmateData.status === "rejected"}
          >
            <FaTimes className="mr-2" /> Reject Parole
          </button>
        </div>
      </div>

      {/* Modals */}
      <ParoleAccept
        isOpen={openAccept}
        onClose={() => setOpenAccept(false)}
        onSubmit={acceptParole}
      />

      <ParoleRejectModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onSubmit={handleRejectParole}
      />
    </div>
  );
};

export default ViewParole;

