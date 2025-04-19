import axiosInstance from "../../utils/axiosInstance";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmModal from "../Modals/ConfirmModal";
import { FaUserEdit, FaTrash, FaSpinner, FaEnvelope, FaTag, FaVenusMars, FaBuilding, FaToggleOn, FaToggleOff } from "react-icons/fa";
  
const ViewUser = ({ id }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDelete, setOpenDelete] = useState(false);
const [openActivate, setOpenActivate] = useState(false);
  

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get(`/user/get-user/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUser(response.data.user);
        
        // Fetch prison details if user has prison ID
      
      } catch (error) {
        toast.error(error.response?.data?.error || "Error fetching user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const deleteUser = async () => {
      try {
        await axiosInstance.delete(`/user/delete-user/${id}`);
        navigate("/admin-dashboard/users");
        setOpenDelete(false);
        toast.success("User deleted successfully!");
       
      } catch (error) {
        toast.error(error.response?.data?.error || "Error deleting user");
      }
  };

  const toggleActivation = async () => {
      try {
        await axiosInstance.put(`/user/activate-user/${id}`, { isactivated: !user.isactivated });
        setUser((prevUser) => ({ ...prevUser, isactivated: !prevUser.isactivated }));
        setOpenActivate(false);
        toast.success(`User account ${user.isactivated ? "deactivated" : "activated"} successfully!`);
      } catch (error) {
        console.error("API Error:", error.response?.data); 
        toast.error(error.response?.data?.error || "Error updating user status");
      }
  };

  // Get role display text
  const getRoleDisplay = (role) => {
    switch (role) {
      case 'security': return 'Security Staff';
      case 'police-officer': return 'Police Officer';
      case 'inspector': return 'Inspector';
      case 'court': return 'Court';
      case 'woreda': return 'Woreda';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="text-center">
          <FaSpinner className="animate-spin text-teal-600 text-4xl mx-auto mb-4" />
          <p className="text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {user && (
        <>
          {/* Header with status indicator */}
          <div className="relative bg-gradient-to-r from-teal-600 to-teal-700 p-6">
            <div className="absolute top-4 right-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                user.isactivated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.isactivated ? (
                  <><FaToggleOn className="mr-1" /> Active</>
                ) : (
                  <><FaToggleOff className="mr-1" /> Inactive</>
                )}
              </span>
            </div>
            
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-white p-1">
                  {user.photo ? (
                    <img 
                      src={user.photo.startsWith('http') ? user.photo : `http://localhost:5001/uploads/${user.photo}`}
                      alt={`${user.firstName}'s profile`}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/150?text=No+Image";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full">
                      <span className="text-3xl font-bold text-gray-400">
                        {user.firstName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-white text-center md:text-left">
                <h1 className="text-2xl font-bold">
                  {user.firstName} {user.middleName} {user.lastName}
                </h1>
                <p className="text-teal-100 flex items-center justify-center md:justify-start mt-1">
                  <span className="bg-teal-800 bg-opacity-50 px-2 py-1 rounded text-sm flex items-center">
                    <FaTag className="mr-1" /> {getRoleDisplay(user.role)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* User information section */}
          <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">
                  Personal Information
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                      <FaEnvelope className="text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="text-gray-800 font-medium break-all">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                      <FaVenusMars className="text-teal-600" />
                    </div>
            <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="text-gray-800 font-medium capitalize">{user.gender}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">
                  System Information
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                      <FaTag className="text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">User Role</p>
                      <p className="text-gray-800 font-medium">{getRoleDisplay(user.role)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {user.role === 'security' && 'Responsible for maintaining order and safety within the facility.'}
                        {user.role === 'police-officer' && 'Handles case management and coordinates with external law enforcement.'}
                        {user.role === 'inspector' && 'Performs regular audits and ensures compliance with regulations.'}
                        {user.role === 'court' && 'Manages legal documentation and hearing schedules.'}
                        {user.role === 'woreda' && 'Coordinates with local government entities.'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                      <FaBuilding className="text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Assigned Prison</p>
                      <p className="text-gray-800 font-medium">
                        { user.prison ? user.prison : 'Not assigned'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional information cards */}
            <div className="mt-6 bg-gray-50 p-5 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">
                Account Status
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${user.isactivated ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-gray-800">
                    This account is currently <span className="font-medium">{user.isactivated ? 'active' : 'inactive'}</span>
                  </span>
                </div>
                
                <button
                  onClick={() => setOpenActivate(true)}
                  className={`px-4 py-2 rounded-md text-white text-sm font-medium flex items-center ${
                    user.isactivated ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {user.isactivated ? (
                    <><FaToggleOff className="mr-2" /> Deactivate</>
                  ) : (
                    <><FaToggleOn className="mr-2" /> Activate</>
                  )}
                </button>
              </div>
              
              <p className="text-sm text-gray-500 mt-2">
                {user.isactivated 
                  ? 'User can currently log in and access the system according to their role permissions.'
                  : 'User cannot log in or access the system while their account is inactive.'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="border-t p-6 flex flex-col sm:flex-row justify-end gap-3">
            
            
          <button
              className="flex-1 sm:flex-none px-5 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center"
              onClick={() => setOpenDelete(true)}
>
              <FaTrash className="mr-2" />
              Delete User
</button>
          </div>

          {/* Confirmation Modals */}
<ConfirmModal
  open={openActivate}
  onConfirm={toggleActivation}
  onCancel={() => setOpenActivate(false)}
  message={`Do you want to ${user.isactivated ? "deactivate" : "activate"} this user account?`}
/>

<ConfirmModal
  open={openDelete}
  onConfirm={deleteUser}
  onCancel={() => setOpenDelete(false)}
  message="Do you really want to delete this user? This action cannot be undone."
/>
        </>
      )}
    </div>
  );
};

export default ViewUser;
