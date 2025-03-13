import axiosInstance from "../../utils/axiosInstance";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ViewUser = () => {
  
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get(`/user/get-user/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUser(response.data.user);
      } catch (error) {
        toast.error(error.response?.data?.error || "Error fetching user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const deleteUser = async () => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axiosInstance.delete(`/user/delete-user/${id}`);
        toast.success("User deleted successfully!");
        navigate("/admin-dashboard/users");
      } catch (error) {
        toast.error(error.response?.data?.error || "Error deleting user");
      }
    }
  };

  const toggleActivation = async () => {
    if (window.confirm(`Do you want to ${user.isactivated ? "deactivate" : "activate"} this user account?`)) {
      try {
        await axiosInstance.put(`/user/activate-user/${id}`, { isactivated: !user.isactivated });
        setUser((prevUser) => ({ ...prevUser, isactivated: !prevUser.isactivated }));
        toast.success(`User account ${user.isactivated ? "deactivated" : "activated"} successfully!`);
      } catch (error) {
        console.error("API Error:", error.response?.data); 
        toast.error(error.response?.data?.error || "Error updating user status");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-lg font-semibold animate-pulse">Loading user details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-24 bg-white p-8 rounded-md shadow-md">
      <button
        className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition duration-300"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="mr-2 text-lg" /> Back
      </button>
      <h2 className="text-2xl font-bold mb-8 text-center">User Account Details</h2>

      {user && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Image */}
            <div>
              {console.log(user.photo)}
              <img
                src={`http://localhost:5000/uploads/${user.photo}`}
                
                alt="Profile"
                className="w-40 h-40 object-cover rounded-full mx-auto"
              />
            </div>

            {/* User Details */}
            <div>
              <p className="text-lg font-bold">Name: <span className="font-medium">{user.firstName} {user.middleName} {user.lastName}</span></p>
              <p className="text-lg font-bold">Email: <span className="font-medium">{user.email}</span></p>
              <p className="text-lg font-bold">Gender: <span className="font-medium">{user.gender}</span></p>
              <p className="text-lg font-bold">Role: <span className="font-medium">{user.role}</span></p>
              <p className="text-lg font-bold">Status: <span className="font-medium">{user.isactivated?"Activated":"DeActivated"}</span></p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-6">
            <button
              className={`py-2 px-3 rounded font-semibold w-1/2 ${user.isactivated ? "bg-red-400" : "bg-green-600"} text-white`}
              onClick={toggleActivation}
            >
              {user.isactivated ? "Deactivate" : "Activate"}
            </button>
            <button className="bg-red-600 text-white py-2 px-3 rounded font-semibold w-1/2" onClick={deleteUser}>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ViewUser;
