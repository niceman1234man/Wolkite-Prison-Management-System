import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { TiArrowBack } from "react-icons/ti";
import { toast } from 'react-toastify'; 
import ConfirmModal from "../Modals/ConfirmModal";
import { FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaPrint, FaEdit } from "react-icons/fa";

function ViewClearance({id}) {
    // const { id } = useParams();
    const navigate = useNavigate();
 
    const [formData, setFormData] = useState({
      date: new Date().toISOString().substring(0, 10),
      reason: "",
      remark: "",
      inmate: "", 
      registrar: "",
      sign: "",
      clearanceId: "",
      propertyStatus: "Returned",
      fineStatus: "No Outstanding",
      medicalStatus: "Cleared",
      notes: ""
    });

    const [loading, setLoading] = useState(true);
    const [openDelete, setOpenDelete] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchClearanceDetails = async () => {
          setLoading(true);
          try {
            const response = await axiosInstance.get(`/clearance/getClearance/${id}`);
           
            if (response.data && response.data.clearance) {
                const clearance = response.data.clearance;
              setFormData({
                date: new Date(clearance.date).toLocaleDateString(),
                reason: clearance.reason || "",
                remark: clearance.remark || "",
                inmate: clearance.inmate || "", 
                registrar: clearance.registrar || "",
                sign: clearance.sign || "",
                clearanceId: clearance.clearanceId || "",
                propertyStatus: clearance.propertyStatus || "Returned",
                fineStatus: clearance.fineStatus || "No Outstanding",
                medicalStatus: clearance.medicalStatus || "Cleared",
                notes: clearance.notes || "",
                createdAt: clearance.createdAt ? new Date(clearance.createdAt).toLocaleDateString() : ""
              });
            } else {
              setError("No clearance data found");
            }
          } catch (error) {
            console.error("Error fetching clearance details:", error);
            setError("Failed to load clearance data");
            toast.error("Failed to load clearance data");
          } finally {
            setLoading(false);
          }
        };
    
        if (id) {
          fetchClearanceDetails();
        }
      }, [id]);

      const deleteClearance = async () => {
        try {
          
            const deletedClearance = await axiosInstance.delete(`/clearance/delete-clearance/${id}`);
            if (deletedClearance) {
              toast.success("clearance deleted successfully!");
              navigate("/securityStaff-dashboard/clearance");  // Ensure you redirect to the correct page
            
          }
        } catch (error) {
          setError(error.response?.data?.error || "Error deleting Instruction");
        }
      };

      const printClearance = () => {
        const printWindow = window.open('', '_blank');
        
        // Create a styled clearance document
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Clearance Certificate - ${formData.clearanceId || 'N/A'}</title>
            <style>
              body {
                font-family: 'Arial', sans-serif;
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
                text-transform: uppercase;
              }
              .clearance-id {
                font-size: 14px;
                margin-top: 5px;
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
              .status {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 3px;
                font-size: 12px;
                font-weight: bold;
              }
              .status-good {
                background-color: #d4edda;
                color: #155724;
              }
              .status-warning {
                background-color: #fff3cd;
                color: #856404;
              }
              .status-bad {
                background-color: #f8d7da;
                color: #721c24;
              }
              .footer {
                margin-top: 40px;
                border-top: 1px solid #ddd;
                padding-top: 20px;
                font-size: 12px;
                text-align: center;
              }
              .signature-section {
                margin-top: 60px;
              }
              .signature-line {
                border-top: 1px solid #333;
                width: 200px;
                display: inline-block;
                margin-top: 50px;
              }
              .signature-name {
                margin-top: 5px;
                font-weight: bold;
              }
              .date-issued {
                margin-top: 5px;
                font-style: italic;
              }
              @media print {
                body {
                  font-size: 12pt;
                }
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">Prison Management System</div>
              <div class="subtitle">Inmate Clearance Certificate</div>
              <div class="clearance-id">Certificate ID: ${formData.clearanceId || 'N/A'}</div>
            </div>
            
            <div class="section">
              <div class="section-title">BASIC INFORMATION</div>
              <div class="grid">
                <div class="field">
                  <div class="field-label">Inmate Name:</div>
                  <div class="field-value">${formData.inmate}</div>
                </div>
                <div class="field">
                  <div class="field-label">Date Issued:</div>
                  <div class="field-value">${formData.date}</div>
                </div>
                <div class="field">
                  <div class="field-label">Registrar:</div>
                  <div class="field-value">${formData.registrar || 'N/A'}</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">CLEARANCE STATUS</div>
              <div class="grid">
                <div class="field">
                  <div class="field-label">Property Status:</div>
                  <div class="field-value">
                    <span class="status ${
                      formData.propertyStatus === 'Returned' ? 'status-good' : 
                      formData.propertyStatus === 'Partial' ? 'status-warning' : 'status-bad'
                    }">
                      ${formData.propertyStatus}
                    </span>
                  </div>
                </div>
                <div class="field">
                  <div class="field-label">Fine Status:</div>
                  <div class="field-value">
                    <span class="status ${
                      formData.fineStatus === 'No Outstanding' ? 'status-good' : 
                      formData.fineStatus === 'Partial' ? 'status-warning' : 'status-bad'
                    }">
                      ${formData.fineStatus}
                    </span>
                  </div>
                </div>
                <div class="field">
                  <div class="field-label">Medical Status:</div>
                  <div class="field-value">
                    <span class="status ${
                      formData.medicalStatus === 'Cleared' ? 'status-good' : 
                      formData.medicalStatus === 'Pending' ? 'status-warning' : 'status-bad'
                    }">
                      ${formData.medicalStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">REASON FOR CLEARANCE</div>
              <div class="field-value">${formData.reason}</div>
            </div>
            
            <div class="section">
              <div class="section-title">REMARKS</div>
              <div class="field-value">${formData.remark}</div>
            </div>
            
            ${formData.notes ? `
            <div class="section">
              <div class="section-title">ADDITIONAL NOTES</div>
              <div class="field-value">${formData.notes}</div>
            </div>
            ` : ''}
            
            <div class="signature-section">
              <div style="text-align: right;">
                <div class="signature-line"></div>
                <div class="signature-name">${formData.registrar || 'Authorized Signature'}</div>
                <div class="date-issued">Date: ${formData.date}</div>
              </div>
            </div>
            
            <div class="footer">
              This clearance certificate was issued by the Prison Management System. 
              Document generated on ${new Date().toLocaleDateString()}.
            </div>
          </body>
          </html>
        `);
        
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };

      // Status badge helper function
      const getStatusBadge = (status, type) => {
        let color = "bg-gray-100 text-gray-800";
        
        if (type === "property") {
          color = status === "Returned" ? "bg-green-100 text-green-800" : 
                  status === "Partial" ? "bg-yellow-100 text-yellow-800" : 
                  "bg-red-100 text-red-800";
        } else if (type === "fine") {
          color = status === "No Outstanding" ? "bg-green-100 text-green-800" : 
                  status === "Partial" ? "bg-yellow-100 text-yellow-800" : 
                  "bg-red-100 text-red-800";
        } else if (type === "medical") {
          color = status === "Cleared" ? "bg-green-100 text-green-800" : 
                  status === "Pending" ? "bg-yellow-100 text-yellow-800" : 
                  "bg-red-100 text-red-800";
        }
        
        const icon = status === "Cleared" || status === "Returned" || status === "No Outstanding" ? 
                    <FaCheckCircle className="mr-1" /> : 
                    status === "Pending" || status === "Partial" ? 
                    <FaHourglassHalf className="mr-1" /> : 
                    <FaTimesCircle className="mr-1" />;
        
        return (
          <span className={`px-3 py-1 inline-flex items-center rounded-full text-sm font-medium ${color}`}>
            {icon} {status}
          </span>
        );
      };

      if (loading) {
        return (
          <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-md shadow-md">
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          </div>
        );
      }

      if (error) {
  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-md shadow-md">
            <div className="text-center text-red-600 font-semibold">{error}</div>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 bg-gray-200 text-gray-700 py-2 px-4 rounded font-medium hover:bg-gray-300 transition duration-200"
            >
              Go Back
            </button>
          </div>
        );
      }

      return (
        <div className="w-full mx-auto mt-6 bg-white p-8 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Clearance Details</h2>
            <div className="flex space-x-2">
              <button
                className="bg-blue-600 text-white py-2 px-4 rounded font-medium flex items-center hover:bg-blue-700 transition duration-200"
                onClick={printClearance}
              >
                <FaPrint className="mr-2" /> Print
              </button>
              <button
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded font-medium hover:bg-gray-300 transition duration-200"
                onClick={() => navigate(-1)}
              >
                <TiArrowBack className="inline-block mr-1" /> Back
              </button>
            </div>
          </div>

          {/* Clearance ID and Date */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex flex-col md:flex-row justify-between">
              <div>
                <span className="text-sm text-gray-500">Clearance ID</span>
                <h3 className="text-lg font-semibold text-gray-800">{formData.clearanceId || "N/A"}</h3>
              </div>
              <div>
                <span className="text-sm text-gray-500">Date Issued</span>
                <h3 className="text-lg font-semibold text-gray-800">{formData.date}</h3>
              </div>
              <div>
                <span className="text-sm text-gray-500">Created On</span>
                <h3 className="text-lg font-semibold text-gray-800">{formData.createdAt || "N/A"}</h3>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-200">Basic Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                <p className="text-sm text-gray-500">Inmate Name</p>
                <p className="text-lg font-medium text-gray-800">{formData.inmate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Registrar</p>
                <p className="text-lg font-medium text-gray-800">{formData.registrar || "N/A"}</p>
              </div>
            </div>
               </div>
   
          {/* Status Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-200">Clearance Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-2">Property Status</p>
                {getStatusBadge(formData.propertyStatus, "property")}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Fine Status</p>
                {getStatusBadge(formData.fineStatus, "fine")}
              </div>
               <div>
                <p className="text-sm text-gray-500 mb-2">Medical Status</p>
                {getStatusBadge(formData.medicalStatus, "medical")}
              </div>
            </div>
               </div>
               
          {/* Clearance Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-200">Clearance Details</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Reason for Clearance</p>
              <div className="p-3 bg-gray-50 rounded-md text-gray-800">
                {formData.reason}
              </div>
               </div>
   
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Remarks</p>
              <div className="p-3 bg-gray-50 rounded-md text-gray-800">
                   {formData.remark}
              </div>
               </div>
   
            {formData.notes && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
                <div className="p-3 bg-gray-50 rounded-md text-gray-800">
                  {formData.notes}
                </div>
              </div>
            )}
               </div>
   
          {/* Signature */}
          {formData.sign && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-200">Digital Signature</h3>
              <div className="flex justify-center p-4 bg-gray-50 rounded-md">
                <img 
                  src={`http://localhost:4000/uploads/${formData.sign}`} 
                  alt="Digital Signature" 
                  className="max-h-24 object-contain"
                />
              </div>
             </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-8">
            <button
              className="bg-teal-600 text-white py-2 px-4 rounded font-medium flex items-center hover:bg-teal-700 transition duration-200"
              onClick={() => navigate(`/securityStaff-dashboard/update-clearance/${id}`)}
            >
              <FaEdit className="mr-2" /> Edit
            </button>
               <button
              className="bg-red-600 text-white py-2 px-4 rounded font-medium flex items-center hover:bg-red-700 transition duration-200"
              onClick={() => setOpenDelete(true)}
               >
              <FaTimesCircle className="mr-2" /> Delete
               </button>
          </div>

               {/* Conditional rendering of the ConfirmModal */}
               {openDelete && (
                 <ConfirmModal
                   message="Do you want to delete this clearance? This action cannot be undone."
                   onConfirm={() => {
                     deleteClearance();
                     setOpenDelete(false);
                   }}
                   onCancel={() => setOpenDelete(false)}
                 />
               )}
             </div>
      );
}

export default ViewClearance