import axiosInstance from "../../utils/axiosInstance";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddPrison = ({ setOpen }) => {
  const [prisonData, setPrisonData] = useState({
    prison_name: "",
    location: "",
    description: "",
    capacity: 0,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    
    setPrisonData((prevState) => ({
      ...prevState,
      [name]: name === "capacity" ? Number(value) : value,
    }));
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    // Check for empty fields
    if (!prisonData.prison_name.trim()) {
      newErrors.prison_name = "Prison name is required";
    }
    
    if (!prisonData.location.trim()) {
      newErrors.location = "Location is required";
    }
    
    if (!prisonData.description.trim()) {
      newErrors.description = "Description is required";
    }
    
    // Validate capacity
    if (isNaN(prisonData.capacity) || prisonData.capacity < 0) {
      newErrors.capacity = "Capacity must be a positive number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setLoading(true);

    try {
      // Ensure capacity is a number
      const formattedData = {
        ...prisonData,
        capacity: Number(prisonData.capacity)
      };

      console.log("Submitting prison data:", formattedData);

      const response = await axiosInstance.post(
        "/prison/new-prison",
        formattedData
      );

      if (response.data?.success) {
        toast.success("Prison added successfully!");
        setOpen(false);
        navigate("/inspector-dashboard/prisons");
      }
    } catch (error) {
      console.error("Error:", error);
      
      // Handle specific error messages from the server
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        navigate("/login");
      } else {
        toast.error("Failed to add prison. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} id="prisonForm" className="space-y-6">
      {/* Prison Name */}
      <div className="space-y-2">
        <label
          htmlFor="prison_name"
          className="block text-sm font-medium text-gray-700"
        >
          Prison Name
        </label>
        <input
          type="text"
          id="prison_name"
          name="prison_name"
          value={prisonData.prison_name}
          onChange={handleChange}
          placeholder="Enter prison name"
          className={`w-full p-3 border ${
            errors.prison_name ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
          required
        />
        {errors.prison_name && (
          <p className="text-sm text-red-500">{errors.prison_name}</p>
        )}
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label
          htmlFor="location"
          className="block text-sm font-medium text-gray-700"
        >
          Location / Woreda
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={prisonData.location}
          onChange={handleChange}
          placeholder="Enter location or woreda"
          className={`w-full p-3 border ${
            errors.location ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
          required
        />
        {errors.location && (
          <p className="text-sm text-red-500">{errors.location}</p>
        )}
      </div>

      {/* Capacity */}
      <div className="space-y-2">
        <label
          htmlFor="capacity"
          className="block text-sm font-medium text-gray-700"
        >
          Capacity
        </label>
        <input
          type="number"
          id="capacity"
          name="capacity"
          value={prisonData.capacity}
          onChange={handleChange}
          placeholder="Enter prison capacity"
          className={`w-full p-3 border ${
            errors.capacity ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
          min="0"
          required
        />
        {errors.capacity && (
          <p className="text-sm text-red-500">{errors.capacity}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={prisonData.description}
          onChange={handleChange}
          placeholder="Provide details about the prison"
          className={`w-full p-3 border ${
            errors.description ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
          rows="4"
          required
        ></textarea>
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description}</p>
        )}
      </div>
    </form>
  );
};

export default AddPrison;
