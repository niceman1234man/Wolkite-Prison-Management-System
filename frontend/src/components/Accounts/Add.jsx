import React, { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import { useNavigate } from "react-router-dom";
import { TiArrowBack } from "react-icons/ti";
import { validateUserForm } from "../../utils/formValidation";

const AddUser = ({setOpen}) => {
  const [photo, setPhoto] = useState("");
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial user state
  const initialUser = {
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    gender: "",
    role: "",
    password: "",
  };

  const [user, setUsers] = useState(initialUser);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUsers({ ...user, [name]: value });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateUserForm(user);
    setErrors(validationErrors);
    
    // Check if there are any errors
    if (Object.keys(validationErrors).length > 0) {
      // Display error toast for the first error
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError);
      return;
    }
    
    setIsSubmitting(true);
  
    const formData = new FormData();
    formData.append("firstName", user.firstName);
    formData.append("middleName", user.middleName);
    formData.append("lastName", user.lastName);
    formData.append("email", user.email);
    formData.append("role", user.role);
    formData.append("gender", user.gender);
    formData.append("password", user.password);
    formData.append("photo", photo);
  
    try {
      const response = await axiosInstance.post("/user/create-account", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      if (response.data && response.data.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        toast.success("User Registered Successfully!");
        setOpen(false);
        navigate("/admin-dashboard/users");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="w-full mx-auto mt-10 bg-white p-8 rounded-md shadow-md">
      <h2 className="text-2xl font-bold mb-6">Add New System User</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              name="firstName"
              placeholder="Enter First name"
              value={user.firstName}
              onChange={handleChange}
              className={`mt-1 p-2 block w-full border ${errors.firstName ? "border-red-500" : "border-gray-300"} rounded-md`}
              required
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* Middle Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Middle Name</label>
            <input
              type="text"
              name="middleName"
              placeholder="Enter Middle name"
              value={user.middleName}
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
              placeholder="Enter Last name"
              value={user.lastName}
              onChange={handleChange}
              className={`mt-1 p-2 block w-full border ${errors.lastName ? "border-red-500" : "border-gray-300"} rounded-md`}
              required
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={user.email}
              onChange={handleChange}
              className={`mt-1 p-2 block w-full border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-md`}
              required
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select
              name="gender"
              value={user.gender}
              onChange={handleChange}
              className={`mt-1 p-2 block w-full border ${errors.gender ? "border-red-500" : "border-gray-300"} rounded-md`}
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {errors.gender && (
              <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              placeholder="******"
              value={user.password}
              onChange={handleChange}
              className={`mt-1 p-2 block w-full border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-md`}
              required
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
            <p className="text-red-500 text-xs mt-1">
              Password must be at least 8 characters and include uppercase, lowercase, and number
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Role</label>
            <select
              name="role"
              value={user.role}
              onChange={handleChange}
              className={`mt-1 p-2 block w-full border ${errors.role ? "border-red-500" : "border-gray-300"} rounded-md`}
              required
            >
              <option value="">Select Role</option>
              <option value="security">Security Staff</option>
              <option value="police-officer">Police Officer</option>
              <option value="inspector">Inspector</option>
              <option value="court">Court</option>
              <option value="woreda">Woreda</option>
            </select>
            {errors.role && (
              <p className="text-red-500 text-xs mt-1">{errors.role}</p>
            )}
          </div>

          {/* Profile Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Upload Profile Picture</label>
            <input
              type="file"
              name="photo"
              onChange={(e) => setPhoto(e.target.files[0])}
              className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full mt-6 ${
                isSubmitting ? "bg-gray-400" : "bg-teal-600 hover:bg-teal-700"
              } text-white font-bold py-2 px-4 rounded`}
            >
              {isSubmitting ? "Adding User..." : "Add User"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddUser;
