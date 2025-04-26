import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { 
  FiUser, 
  FiCalendar, 
  FiTarget, 
  FiInfo, 
  FiArrowRight,
  FiCheckCircle, 
  FiAlertCircle,
  FiX,
  FiUpload,
  FiFile
} from "react-icons/fi";
import { 
  FaBalanceScale, 
  FaCalendarCheck, 
  FaFileContract, 
  FaUserClock,
  FaHandHoldingHeart,
  FaClipboardCheck,
  FaRegThumbsUp,
  FaSignature,
  FaUsers,
  FaPen,
  FaStamp,
  FaUserTie,
  FaFileUpload,
  FaFileImage,
  FaCheck,
  FaUserShield
} from "react-icons/fa";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

const CommitteeForm = ({ isOpen, onClose, onSubmit, inmateData }) => {
  const initialCommittee = [
    { name: "", committeeId: "", position: "Chairperson", signature: null, fileName: "" },
    { name: "", committeeId: "", position: "Security Officer", signature: null, fileName: "" },
    { name: "", committeeId: "", position: "Rehabilitation Officer", signature: null, fileName: "" },
    { name: "", committeeId: "", position: "Social Worker", signature: null, fileName: "" },
    { name: "", committeeId: "", position: "Prison Administrator", signature: null, fileName: "" }
  ];
  
  const [committee, setCommittee] = useState(initialCommittee);
  const [loading, setLoading] = useState(false);
  const [signaturePreviews, setSignaturePreviews] = useState([null, null, null, null, null]);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [loadingCommittee, setLoadingCommittee] = useState(false);
  
  // Fetch committee members when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCommitteeMembers();
    }
  }, [isOpen]);
  
  const fetchCommitteeMembers = async () => {
    setLoadingCommittee(true);
    try {
      const response = await axiosInstance.get("/parole-committee/members");
      setCommitteeMembers(response.data.members || []);
      
      // If we have committee members, pre-fill the form
      if (response.data.members && response.data.members.length === 5) {
        const newCommittee = [...committee];
        response.data.members.forEach((member, index) => {
          if (index < 5) {
            newCommittee[index] = { 
              ...newCommittee[index], 
              name: `${member.firstName} ${member.lastName}`,
              committeeId: member._id
            };
          }
        });
        setCommittee(newCommittee);
      } else {
        toast.warning("No complete parole committee found. Please contact an administrator.");
      }
    } catch (error) {
      console.error("Error fetching committee members:", error);
      toast.error("Failed to load committee members. Please try again.");
    } finally {
      setLoadingCommittee(false);
    }
  };
  
  const handleSignatureUpload = (index, event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload an image (JPEG/PNG) or PDF file");
      return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }
    
    // Update committee data with file
    const newCommittee = [...committee];
    newCommittee[index] = { 
      ...newCommittee[index], 
      signature: file,
      fileName: file.name
    };
    setCommittee(newCommittee);
    
    // Create preview URL for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPreviews = [...signaturePreviews];
        newPreviews[index] = e.target.result;
        setSignaturePreviews(newPreviews);
      };
      reader.readAsDataURL(file);
    } else {
      // For PDFs, just set a placeholder
      const newPreviews = [...signaturePreviews];
      newPreviews[index] = "pdf";
      setSignaturePreviews(newPreviews);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all committee members have names
    const hasEmptyNames = committee.some(member => !member.name.trim());
    if (hasEmptyNames) {
      toast.error("Please wait for committee members to load or refresh the form");
      return;
    }
    
    // Validate all signatures
    const hasUnsigned = committee.some(member => !member.signature);
    if (hasUnsigned) {
      toast.error("All committee members must upload signature files");
      return;
    }
    
    setLoading(true);
    
    try {
      // Convert files to base64 for API submission
      const committeeWithBase64 = await Promise.all(
        committee.map(async (member) => {
          const base64 = await convertFileToBase64(member.signature);
          return {
            ...member,
            signature: base64,
            // Send only relevant data to API
            signatureType: member.signature.type,
          };
        })
      );
      
      // Submit to backend with committee data
      await onSubmit(committeeWithBase64);
      setCommittee(initialCommittee); // Reset form
      setSignaturePreviews([null, null, null, null, null]);
      onClose(); // Close modal
    } catch (error) {
      console.error("Error submitting committee form:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to convert file to base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-teal-600 text-white rounded-t-lg">
          <h2 className="text-xl font-bold flex items-center">
            <FaUsers className="mr-2" />
            Parole Committee Signatures
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 focus:outline-none"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className="p-5">
          {inmateData && (
            <div className="mb-6 bg-teal-50 p-4 rounded-lg border border-teal-100">
              <h3 className="font-medium text-teal-800 mb-2 flex items-center">
                <FaUserClock className="mr-2" />
                Inmate Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Name:</p>
                  <p className="font-semibold">{inmateData.fullName} {inmateData.lastName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Parole Date:</p>
                  <p className="font-semibold">{new Date(inmateData.paroleDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Points:</p>
                  <p className="font-semibold">{inmateData.totalPoints} points</p>
                </div>
                <div>
                  <p className="text-gray-600">Case Type:</p>
                  <p className="font-semibold">{inmateData.caseType || "N/A"}</p>
                </div>
              </div>
            </div>
          )}
          
          {loadingCommittee ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-teal-500 rounded-full mr-3"></div>
              <span className="text-gray-600">Loading committee members...</span>
            </div>
          ) : (
            committeeMembers.length === 0 ? (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-4 text-center">
                <FaUserShield className="text-yellow-500 text-2xl mx-auto mb-2" />
                <p className="text-yellow-700 font-medium">No parole committee has been formed yet</p>
                <p className="text-yellow-600 text-sm mt-1">
                  Please contact your administrator to establish a parole committee before proceeding.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <p className="text-gray-700 mb-2 flex items-center">
                    <FaFileUpload className="mr-2 text-teal-600" />
                    Upload signed documents from all committee members:
                  </p>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-gray-700 font-medium">Position</th>
                          <th className="px-4 py-3 text-left text-gray-700 font-medium">Name</th>
                          <th className="px-4 py-3 text-left text-gray-700 font-medium">Signature File</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {committee.map((member, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-3 flex items-center">
                              <FaUserTie className="mr-2 text-gray-500" />
                              {member.position}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <FaUserShield className="mr-2 text-teal-500" />
                                <span>{member.name || "Loading..."}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              {!member.signature ? (
                                <label className="flex items-center justify-center px-3 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                                  <FiUpload className="mr-2 text-gray-500" />
                                  <span className="text-gray-500">Upload signature</span>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={(e) => handleSignatureUpload(index, e)}
                                  />
                                </label>
                              ) : (
                                <div className="flex flex-col space-y-2">
                                  <div className="flex items-center text-sm text-gray-600">
                                    {signaturePreviews[index] === "pdf" ? (
                                      <FaFileContract className="mr-2 text-red-500" />
                                    ) : (
                                      <FaFileImage className="mr-2 text-blue-500" />
                                    )}
                                    <span className="truncate max-w-[150px]">{member.fileName}</span>
                                    <FaCheck className="ml-2 text-green-500" />
                                  </div>
                                  
                                  {signaturePreviews[index] && signaturePreviews[index] !== "pdf" && (
                                    <div className="mt-1 border rounded-md overflow-hidden w-24 h-12">
                                      <img 
                                        src={signaturePreviews[index]} 
                                        alt="Signature preview" 
                                        className="object-contain w-full h-full"
                                      />
                                    </div>
                                  )}
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newCommittee = [...committee];
                                      newCommittee[index] = { ...newCommittee[index], signature: null, fileName: "" };
                                      setCommittee(newCommittee);
                                      
                                      const newPreviews = [...signaturePreviews];
                                      newPreviews[index] = null;
                                      setSignaturePreviews(newPreviews);
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800"
                                  >
                                    Replace file
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Accepted file types: JPG, PNG, PDF (max 2MB)
                  </p>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || committeeMembers.length < 5}
                    className={`px-4 py-2 rounded-md flex items-center transition-colors ${
                      loading || committeeMembers.length < 5 
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                        : "bg-teal-600 text-white hover:bg-teal-700"
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaStamp className="mr-2" />
                        Submit Committee Approval
                      </>
                    )}
                  </button>
                </div>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
};

const RequestParole = () => {
  const [eligibleInmates, setEligibleInmates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportedInmates, setReportedInmates] = useState(new Set());
  const [showCommitteeForm, setShowCommitteeForm] = useState(false);
  const [selectedInmate, setSelectedInmate] = useState(null);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  useEffect(() => {
    const fetchEligibleInmates = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/parole-tracking');
        
        // Initialize reported inmates set
        console.log("Response data:", response.data);
        const reported = new Set(
          response.data.parole
            .filter(inmate => inmate.isReported)
            .map(inmate => inmate.inmateId)
        );
        setReportedInmates(reported);
        
        setEligibleInmates(response.data.parole);
        setError(null);
      } catch (err) {
        console.error("Error fetching eligible inmates:", err);
        setError("Failed to fetch eligible inmates. Please try again later.");
        toast.error("Error loading eligible inmates");
      } finally {
        setLoading(false);
      }
    };

    fetchEligibleInmates();
  }, []);

  const handleReportButtonClick = (inmate) => {
    setSelectedInmate(inmate);
    setShowCommitteeForm(true);
  };

  const handleCommitteeSubmit = async (committeeData) => {
    try {
      console.log("Reporting parole for inmate ID:", selectedInmate.inmateId);
      
      // Create FormData to handle file uploads
      const formData = new FormData();
      formData.append('isReported', true);
      
      // Process each committee member's data
      committeeData.forEach((member, index) => {
        // Add member data as separate fields
        formData.append(`committee[${index}].name`, member.name);
        formData.append(`committee[${index}].position`, member.position);
        
        // Add signature file if exists
        if (member.signature) {
          formData.append(`signatures`, member.signature);
          formData.append(`committee[${index}].signatureType`, member.signature.type || 'application/octet-stream');
        }
      });
      
      const response = await axiosInstance.put(
        `/parole-tracking/update-report/${selectedInmate.inmateId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data) {
        setReportedInmates(prev => new Set([...prev, selectedInmate.inmateId]));
        toast.success("Parole Request Sent Successfully with Committee Approval!");
      }
    } catch (error) {
      console.error("Error reporting parole:", error);
      toast.error(error.message || "Failed to send parole request");
      throw error;
    }
  };

  return (
    <div className={`p-6 mt-12 transition-all duration-300 ease-in-out ml-3 ${
      isCollapsed ? "pl-16" : "pl-64"
    }`}>
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center">
          <FaBalanceScale className="mr-3 text-white" size={24} />
          Eligible Inmates for Parole
        </h1>
        <p className="text-white text-opacity-90 mt-2 ml-9">
          Inmates who have reached their parole date and have accumulated 75 or more parole points
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : eligibleInmates.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
          No inmates currently meet the criteria for parole eligibility.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eligibleInmates.map((inmate) => (
            <div 
              key={inmate._id} 
              className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="border-b border-gray-200 px-4 py-3 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-green-100 text-green-700 flex items-center justify-center rounded-full">
                    <FaUserClock size={18} />
                  </div>
                  <span className="ml-3 font-semibold text-gray-800">{inmate.fullName} {inmate.lastName}</span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center">
                        <FaCalendarCheck className="mr-1" size={12} />
                        Parole Date
                      </p>
                      <p className="font-medium text-gray-800">
                        {new Date(inmate.paroleDate).toLocaleDateString()}
                      </p>
                    </div>
        <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center">
                        <FaClipboardCheck className="mr-1" size={12} />
                        Parole Points
                      </p>
                      <p className="font-medium text-gray-800">
                        <span className={`inline-block px-2 py-0.5 rounded ${
                          inmate.totalPoints >= 90 ? "bg-green-100 text-green-800" :
                          inmate.totalPoints >= 80 ? "bg-blue-100 text-blue-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {inmate.totalPoints} points
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1 flex items-center">
                    <FaFileContract className="mr-1" size={12} />
                    Case Summary
                  </p>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {inmate.caseType || "No case summary available."}
                  </p>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => reportedInmates.has(inmate.inmateId) ? null : handleReportButtonClick(inmate)}
                    disabled={reportedInmates.has(inmate.inmateId)}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white transition-colors ${
                      reportedInmates.has(inmate.inmateId)
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {reportedInmates.has(inmate.inmateId) ? (
                      <>
                        <FaRegThumbsUp className="mr-2" />
                        Reported
                      </>
                    ) : (
                      <>
                        <FaHandHoldingHeart className="mr-2" />
                        Report Parole Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Committee Modal Form */}
      <CommitteeForm 
        isOpen={showCommitteeForm}
        onClose={() => setShowCommitteeForm(false)}
        onSubmit={handleCommitteeSubmit}
        inmateData={selectedInmate}
      />
    </div>
  );
};

export default RequestParole;