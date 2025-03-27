import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify"; // Import toast
import "react-toastify/dist/ReactToastify.css"; // Import toast CSS
import { TiArrowBack } from "react-icons/ti";

const VisitorRegister = () => {
  const navigate = useNavigate();

  const initialUser = {
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    gender: "",
    role: "Visitor",
    password: "",
    photo: null,
  };

  const [user, setUsers] = useState(initialUser);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Cleanup URL.createObjectURL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (e) => {
    if (e.target.name === "photo") {
      const file = e.target.files[0];
      setUsers({ ...user, photo: file });

      if (file) {
        const fileUrl = URL.createObjectURL(file);
        setPreviewUrl(fileUrl);
      }
    } else {
      setUsers({ ...user, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("firstName", user.firstName);
      formData.append("middleName", user.middleName);
      formData.append("lastName", user.lastName);
      formData.append("email", user.email);
      formData.append("gender", user.gender);
      formData.append("role", "Visitor");
      formData.append("password", user.password);
      if (user.photo) {
        formData.append("photo", user.photo);
      }

      const response = await axiosInstance.post("/user/create-account", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        toast.success("Visitor Registered Successfully!");
        navigate("/login");
      }
    } catch (error) {
      console.error(error?.response?.data?.message || "Registration error, try again.");
      toast.error(error?.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="bg-gray-200 w-screen h-screen flex flex-col fixed">
      {/* Header */}
      <header className="bg-green-600 text-white text-center py-4">
        <h1 className="text-xl font-bold">Welcome to Wolkite Prison Management</h1>
      </header>

      {/* Form Container */}
      <div className="w-[70%] mx-auto bg-white px-5 py-6 rounded-md shadow-md overflow-y-scroll">
        <TiArrowBack 
          size={50} 
          className="cursor-pointer mb-4"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))} 
        />
        <h2 className="text-2xl font-bold mb-6">Register Visitor</h2>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="firstName"
                value={user.firstName}
                placeholder="Enter First name"
                onChange={handleChange}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                required
              />
            </div>

            {/* Middle Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={user.middleName}
                placeholder="Enter Middle name"
                onChange={handleChange}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={user.lastName}
                placeholder="Enter Last name"
                onChange={handleChange}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={user.email}
                placeholder="Enter email"
                onChange={handleChange}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                required
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                value={user.gender}
                onChange={handleChange}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                value={user.password}
                placeholder="******"
                onChange={handleChange}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                required
              />
            </div>

            {/* Profile Image Upload */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Upload Profile Picture</label>
              <div className="mt-1 flex items-center space-x-4">
                {previewUrl && (
                  <div className="w-20 h-20 rounded-full overflow-hidden">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  onChange={handleChange}
                  className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Visitor
          </button>
        </form>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-4">
        <p className="text-sm">&copy; {new Date().getFullYear()} Wolkite Prison Management. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default VisitorRegister;
