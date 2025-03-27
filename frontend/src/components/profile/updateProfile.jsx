import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCamera } from "react-icons/fa";
import axiosInstance from "../../utils/axiosInstance.js";
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 

const UpdateProfile = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      if (photo) formDataToSend.append("photo", photo);

      await axiosInstance.put(`/user/update-user/${user._id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success("Profile updated successfully!");
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      window.location.reload();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.response?.data?.message || "Failed to update profile. Please try again.");
    }
  };

  return (
    <div className="mt-24 flex justify-center">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-md p-6">
        {/* Back Button */}
        <button
          className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition duration-300"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft className="mr-2 text-lg" /> Back
        </button>

        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Update Profile Picture</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Picture Display and Upload */}
          <div className="flex flex-col items-center space-y-4">
            {/* Current/Preview Profile Picture */}
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : user?.photo ? (
                <img
                  src={`http://localhost:5000/uploads/${user.photo}`}
                  alt="Current profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-500 text-4xl">
                    {user?.firstName?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Camera Icon Upload Button */}
              <label className="absolute bottom-0 right-0 bg-gray-800 bg-opacity-75 p-2 rounded-full cursor-pointer hover:bg-opacity-90 transition-all">
                <FaCamera className="text-white text-lg" />
                <input
                  type="file"
                  name="photo"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </label>
            </div>

            {/* File name display */}
            {photo && (
              <p className="text-sm text-gray-600">
                Selected: {photo.name}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`bg-teal-600 text-white font-semibold py-2 rounded-lg w-full transition duration-300 shadow-md ${
              !photo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-700'
            }`}
            disabled={!photo}
          >
            {photo ? 'Save Changes' : 'Select a photo to update'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;
