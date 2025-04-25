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
    current_population: 0,
    status: "active"
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
      [name]: name === "capacity" || name === "current_population" ? Number(value) : value,
    }));
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    // Prison name validation
    if (!prisonData.prison_name.trim()) {
      newErrors.prison_name = "Prison name is required";
    } else if (prisonData.prison_name.trim().length < 3) {
      newErrors.prison_name = "Prison name must be at least 3 characters";
    } else if (prisonData.prison_name.trim().length > 50) {
      newErrors.prison_name = "Prison name cannot exceed 50 characters";
    } else if (!/^[A-Za-z0-9\s\-_.()]+$/.test(prisonData.prison_name.trim())) {
      newErrors.prison_name = "Prison name contains invalid characters";
    }
    
    // Location validation
    if (!prisonData.location.trim()) {
      newErrors.location = "Location is required";
    } else if (prisonData.location.trim().length < 3) {
      newErrors.location = "Location must be at least 3 characters";
    } else if (prisonData.location.trim().length > 100) {
      newErrors.location = "Location cannot exceed 100 characters";
    }
    
    // Description validation
    if (!prisonData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (prisonData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (prisonData.description.trim().length > 500) {
      newErrors.description = "Description cannot exceed 500 characters";
    }
    
    // Capacity validation
    if (isNaN(prisonData.capacity) || prisonData.capacity <= 0) {
      newErrors.capacity = "Capacity must be a positive number";
    } else if (prisonData.capacity > 10000) {
      newErrors.capacity = "Capacity cannot exceed 10,000";
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
      // Ensure numeric fields are properly converted to numbers
      const formattedData = {
        ...prisonData,
        capacity: Number(prisonData.capacity),
        current_population: Number(prisonData.current_population),
        status: prisonData.status?.toLowerCase() || "active"
      };

      console.log("Submitting prison data:", formattedData);

      const response = await axiosInstance.post(
        "/prison/new-prison",
        formattedData
      );

      console.log("Server response:", response.data);

      if (response.data?.success) {
        toast.success("Prison added successfully!");
        setOpen(false);
        // Dispatch event to refresh prison list with slight delay
        setTimeout(() => {
          window.dispatchEvent(new Event('prisonsUpdated'));
        }, 100);
        navigate("/inspector-dashboard/prisons");
      }
    } catch (error) {
      console.error("Error:", error.response?.data || error);
      
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
          } rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors`}
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
          } rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors`}
          required
        />
        {errors.location && (
          <p className="text-sm text-red-500">{errors.location}</p>
        )}
      </div>

      {/* Two-column layout for Capacity and Current Population */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            } rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors`}
            min="1"
            required
          />
          {errors.capacity && (
            <p className="text-sm text-red-500">{errors.capacity}</p>
          )}
        </div>

        {/* Current Population */}
        <div className="space-y-2">
          <label
            htmlFor="current_population"
            className="block text-sm font-medium text-gray-700"
          >
            Current Population
          </label>
          <input
            type="number"
            id="current_population"
            name="current_population"
            value={prisonData.current_population}
            onChange={handleChange}
            placeholder="Enter current population"
            className={`w-full p-3 border ${
              errors.current_population ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors`}
            min="0"
          />
          {errors.current_population && (
            <p className="text-sm text-red-500">{errors.current_population}</p>
          )}
        </div>
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
          } rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors`}
          rows="4"
          required
        ></textarea>
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description}</p>
        )}
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-700"
        >
          Status
        </label>
        <select
          id="status"
          name="status"
          value={prisonData.status || "active"}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors flex items-center"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </>
          ) : (
            "Add Prison"
          )}
        </button>
      </div>
    </form>
  );
};

export default AddPrison;
