import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FiSearch, FiSave, FiX, FiEdit, FiTrash2, FiRefreshCw } from "react-icons/fi";
import { FaUsers, FaUserShield, FaUserCheck, FaUserPlus, FaUserTimes } from "react-icons/fa";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";

const ParoleCommite = () => {
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [loading, setLoading] = useState(false);
  const [policeOfficers, setPoliceOfficers] = useState([]);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [pendingParoleApplications, setPendingParoleApplications] = useState(0);

  // Fetch police officers and current committee members on component mount
  useEffect(() => {
    fetchPoliceOfficers();
    fetchCommitteeMembers();
    fetchPendingParoleApplications();
  }, []);

  const fetchPoliceOfficers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/user/getAlluser?role=police-officer");
      setPoliceOfficers(response.data.user.filter(user => user.role === "police-officer") || []);
    } catch (error) {
      console.error("Error fetching police officers:", error);
      toast.error("Failed to load police officers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCommitteeMembers = async () => {
    setLoading(true);
    try {
      console.log("Fetching committee members from backend...");
      const response = await axiosInstance.get("/parole-committee/members");
      
      // Log what we received from the server
      console.log("Committee data received:", response.data);
      
      if (response.data.members && response.data.members.length > 0) {
        console.log(`Loaded ${response.data.members.length} committee members`);
        setCommitteeMembers(response.data.members);
        
        // If we received committee members but there aren't 5, show a warning
        if (response.data.members.length < 5) {
          toast.warning(`Only ${response.data.members.length} of 5 committee members are assigned. Please select all 5 members.`);
          // Enable edit mode if we don't have a complete committee
          setIsEditMode(true);
        } else {
          // We have a complete committee, ensure edit mode is off
          setIsEditMode(false);
        }
      } else {
        // No committee members found
        console.log("No committee members found in database");
        setCommitteeMembers([]);
        // Enable edit mode so user can add members
        setIsEditMode(true);
        toast.info("No parole committee members found. Please add 5 members to form a committee.");
      }
    } catch (error) {
      console.error("Error fetching committee members:", error);
      // If there's an error or no committee exists yet, set empty array
      setCommitteeMembers([]);
      
      // Show error based on response
      if (error.response && error.response.status === 404) {
        toast.info("No parole committee found. Please create one.");
        setIsEditMode(true);
      } else {
        toast.error("Failed to load committee members. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingParoleApplications = async () => {
    try {
      const response = await axiosInstance.get("/parole-tracking?status=pending");
      setPendingParoleApplications(response.data.parole?.length || 0);
    } catch (error) {
      console.error("Error fetching pending parole applications:", error);
      setPendingParoleApplications(0);
    }
  };

  const handleAddMember = (officer) => {
    // Check if we already have 5 members
    if (committeeMembers.length >= 5 && !isEditMode) {
      toast.error("Cannot add more than 5 committee members");
      return;
    }

    // Check if officer is already a committee member
    if (committeeMembers.some(member => member._id === officer._id)) {
      toast.error("This officer is already a committee member");
      return;
    }

    // Add officer to committee
    const updatedMembers = [...committeeMembers, officer];
    setCommitteeMembers(updatedMembers);
    
    // Don't close modal yet if we're in edit mode and don't have 5 members yet
    if (isEditMode && updatedMembers.length < 5) {
      toast.info(`Added ${officer.firstName} ${officer.lastName}. ${5 - updatedMembers.length} more needed.`);
    } else {
      setShowAddMemberModal(false);
      
      // Auto-save if we've just added the 5th member
      if (isEditMode && updatedMembers.length === 5) {
        // Call handleSaveCommittee directly with the updated members
        handleSaveCommitteeWithMembers(updatedMembers);
      }
    }
  };

  const handleRemoveMember = (officerId) => {
    setCommitteeMembers(prev => prev.filter(member => member._id !== officerId));
  };

  // New function to handle saving with specified members
  const handleSaveCommitteeWithMembers = async (members) => {
    if (members.length !== 5) {
      toast.error("Please select exactly 5 committee members");
      return;
    }

    setLoading(true);
    try {
      // Map to get just the IDs and add signature fields
      const memberIds = members.map(member => ({
        memberId: member._id,
        hasSigned: false,
        signatureDate: null
      }));
      
      // Ensure we have a valid token in localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication error. Please log in again.");
        setLoading(false);
        return;
      }
      
      // Make API call to save committee members with explicit authorization header
      const response = await axiosInstance.post(
        "/parole-committee/save", 
        { members: memberIds },
        { 
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      if (response.data) {
        toast.success("Parole committee members saved successfully to database");
        setIsEditMode(false);
        
        // Refresh the committee members to show the updated list
        await fetchCommitteeMembers();
      } else {
        toast.error("Failed to save committee members to database. Please try again.");
      }
    } catch (error) {
      console.error("Error saving committee members:", error);
      
      // More detailed error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 401) {
          toast.error("Authentication error. Please log in again.");
        } else if (error.response.status === 403) {
          toast.error("You don't have permission to save committee members.");
        } else {
          toast.error(error.response.data?.message || "Failed to save committee members");
        }
      } else if (error.request) {
        // The request was made but no response was received
        toast.error("Server did not respond. Please try again later.");
      } else {
        // Something happened in setting up the request that triggered an Error
        toast.error("Error setting up the request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCommittee = () => {
    handleSaveCommitteeWithMembers(committeeMembers);
  };

  const filteredOfficers = policeOfficers.filter(officer => {
    // Ensure we have both firstName and lastName before searching
    const fullName = `${officer.firstName || ''} ${officer.lastName || ''}`.toLowerCase();
    return searchTerm === '' || fullName.includes(searchTerm.toLowerCase());
  });

  const handleReplaceAllMembers = () => {
    setCommitteeMembers([]);
    setIsEditMode(true);
  };

  return (
    <div className={`p-6 ${isCollapsed ? "ml-20" : "ml-64"} transition-all duration-300 mt-20`}>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center border-b pb-4">
          <FaUsers className="mr-3 text-teal-600" />
          Parole Committee Management
        </h2>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-teal-50 p-5 rounded-lg border border-teal-100 shadow-sm">
            <h3 className="text-lg font-medium text-teal-700 mb-2">Current Committee</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-teal-100 mr-4">
                  <FaUserShield className="text-teal-600 text-xl" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-teal-700">{committeeMembers.length}</span>
                  <p className="text-sm text-teal-600">of 5 members selected</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditMode(true)}
                className="px-3 py-1.5 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors flex items-center text-sm"
                disabled={isEditMode}
              >
                <FiEdit className="mr-2" />
                {isEditMode ? "Editing..." : "Edit Committee"}
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 shadow-sm">
            <h3 className="text-lg font-medium text-blue-700 mb-2">Available Officers</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 mr-4">
                  <FaUserShield className="text-blue-600 text-xl" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-blue-700">{policeOfficers.length}</span>
                  <p className="text-sm text-blue-600">registered officers</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddMemberModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm"
                disabled={committeeMembers.length >= 5 && !isEditMode}
              >
                <FaUserPlus className="mr-2" />
                Add Member
              </button>
            </div>
          </div>
          
          <div className="bg-amber-50 p-5 rounded-lg border border-amber-100 shadow-sm">
            <h3 className="text-lg font-medium text-amber-700 mb-2">Pending Applications</h3>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-100 mr-4">
                <FaUserCheck className="text-amber-600 text-xl" />
              </div>
              <div>
                <span className="text-2xl font-bold text-amber-700">{pendingParoleApplications}</span>
                <p className="text-sm text-amber-600">awaiting review</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Current Committee Members */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-700 flex items-center">
              <FaUsers className="mr-2 text-teal-600" />
              Current Committee Members
            </h3>
            
            {isEditMode && (
              <div className="flex space-x-2">
                <button
                  onClick={handleReplaceAllMembers}
                  className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center text-sm"
                >
                  <FaUserTimes className="mr-2" />
                  Replace All
                </button>
                <button
                  onClick={handleSaveCommittee}
                  disabled={committeeMembers.length !== 5 || loading}
                  className={`px-4 py-1.5 rounded-md flex items-center text-sm
                    ${committeeMembers.length === 5 
                      ? "bg-green-600 text-white hover:bg-green-700" 
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    } transition-colors`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2" />
                      Save Committee
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    fetchCommitteeMembers(); // Reset to saved committee
                  }}
                  className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-200 transition-colors flex items-center text-sm"
                >
                  <FiX className="mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>
          
          {committeeMembers.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 text-center">
              <FaUsers className="mx-auto text-4xl text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">No committee members selected yet</p>
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors inline-flex items-center text-sm"
              >
                <FaUserPlus className="mr-2" />
                Add Committee Member
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prison
                    </th>
                    {isEditMode && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {committeeMembers.map((member, index) => (
                    <tr key={member._id || index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                            <FaUserShield className="text-teal-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-sm text-gray-500">Police Officer</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.phone || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.prison?.prison_name || "N/A"}</div>
                      </td>
                      {isEditMode && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRemoveMember(member._id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <FiTrash2 className="inline" /> Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal for adding committee members */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-teal-600 text-white rounded-t-lg">
              <h2 className="text-xl font-bold flex items-center">
                <FaUserPlus className="mr-2" />
                Add Committee Member
              </h2>
              <button 
                onClick={() => setShowAddMemberModal(false)}
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-5">
              <div className="mb-4">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <div className="pl-4 pr-2">
                    <FiSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    className="w-full p-3 focus:outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="p-3 text-gray-400 hover:text-gray-600"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prison
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOfficers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <FiSearch className="text-3xl mb-2 text-gray-300" />
                            <p>No police officers found matching your search.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOfficers.map((officer) => (
                        <tr key={officer._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <FaUserShield className="text-blue-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {officer.firstName} {officer.lastName}
                                </div>
                                <div className="text-sm text-gray-500">Police Officer</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{officer.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{officer.phone || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{officer.prison?.prison_name || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleAddMember(officer)}
                              disabled={committeeMembers.some(m => m._id === officer._id)}
                              className={`px-3 py-1.5 rounded-md ${
                                committeeMembers.some(m => m._id === officer._id)
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-teal-600 text-white hover:bg-teal-700"
                              }`}
                            >
                              {committeeMembers.some(m => m._id === officer._id) ? (
                                "Added"
                              ) : (
                                <>
                                  <FaUserPlus className="inline mr-1" /> Add to Committee
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  
                  // Auto-save if we have exactly 5 members in edit mode
                  if (isEditMode && committeeMembers.length === 5) {
                      handleSaveCommittee();
                  } else if (isEditMode) {
                    // Inform user if we don't have 5 members yet
                    toast.info(`Committee has ${committeeMembers.length} of 5 required members. Add ${5 - committeeMembers.length} more to save.`);
                  }
                }}
                className={`px-4 py-2 rounded-md text-white transition-colors ${
                  isEditMode && committeeMembers.length === 5 
                    ? "bg-teal-600 hover:bg-teal-700"
                    : "bg-teal-600 hover:bg-teal-700"
                }`}
              >
                {isEditMode && committeeMembers.length === 5 ? "Done & Save" : "Done"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParoleCommite;