import axiosInstance from "../../utils/axiosInstance";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa";

const EditPrison = ({ setOpen, id: propId }) => {
  const { id: paramId } = useParams(); // Extract ID from URL parameters as fallback
  const navigate = useNavigate();
  
  // Use prop ID if provided, otherwise use URL param ID
  const id = propId || paramId;
  
  const [prisonData, setPrisonData] = useState({
    prison_name: "",
    location: "",
    description: "",
    capacity: "",
    current_population: "",
    status: ""
  });

  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPrisonData((prevState) => ({ ...prevState, [name]: value }));
  };

  // Fetch prison data when component mounts or ID changes
  useEffect(() => {
    const fetchPrisonData = async () => {
      try {
        console.log("Fetching prison with ID:", id);
        // Update the endpoint to match the backend router
        const response = await axiosInstance.get(`/prison/${id}`);
        if (response.data.prison) {
          setPrisonData({
            ...response.data.prison,
            // Ensure all fields are handled, even if some are missing from the response
            prison_name: response.data.prison.prison_name || "",
            location: response.data.prison.location || "",
            description: response.data.prison.description || "",
            capacity: response.data.prison.capacity || "",
            current_population: response.data.prison.current_population || "",
            status: response.data.prison.status || ""
          });
        } else {
          toast.error("Prison data not found.");
          handleClose();
        }
      } catch (error) {
        console.error("Error fetching prison data:", error);
        toast.error("Failed to fetch prison data.");
        handleClose();
      }
    };
    
    if (id) {
      fetchPrisonData();
    } else {
      toast.error("No prison ID provided.");
      handleClose();
    }
  }, [id]);

  // Handle closing the form/modal
  const handleClose = () => {
    if (setOpen) {
      setOpen(false); // If used in modal
    } else {
      navigate(-1); // If used standalone
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Updating prison with ID:", id);
      // Update the endpoint to match the backend router
      await axiosInstance.put(`/prison/${id}`, prisonData);
      toast.success("Prison updated successfully!");
      
      // Close modal or navigate away
      handleClose();
      
      // Refresh the prisons list if it was a modal
      if (setOpen) {
        // Typically we'd use a callback here, but as a workaround
        // we can dispatch a custom event
        window.dispatchEvent(new CustomEvent('prisonsUpdated'));
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.error || "Failed to update prison. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto bg-white p-4 md:p-8 rounded-md">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        {!setOpen && (
          <button
            onClick={handleClose}
            className="flex items-center text-gray-600 hover:text-blue-600"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
        )}
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 text-center flex-1">
          Update Prison
        </h2>
        {!setOpen && <div className="w-24" />}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Prison Name */}
        <div>
          <label htmlFor="prison_name" className="block text-sm font-medium text-gray-700">
            Prison Name
          </label>
          <input
            type="text"
            name="prison_name"
            value={prisonData.prison_name}
            onChange={handleChange}
            placeholder="Enter prison name"
            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location / Woreda
          </label>
          <input
            type="text"
            name="location"
            value={prisonData.location}
            onChange={handleChange}
            placeholder="Enter location or woreda"
            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>

        {/* Two-column layout for desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Capacity */}
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
              Capacity
            </label>
            <input
              type="number"
              name="capacity"
              value={prisonData.capacity}
              onChange={handleChange}
              placeholder="Enter capacity"
              className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Current Population */}
          <div>
            <label htmlFor="current_population" className="block text-sm font-medium text-gray-700">
              Current Population
            </label>
            <input
              type="number"
              name="current_population"
              value={prisonData.current_population}
              onChange={handleChange}
              placeholder="Enter current population"
              className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            name="status"
            value={prisonData.status}
            onChange={handleChange}
            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="" disabled>Select status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={prisonData.description}
            onChange={handleChange}
            placeholder="Provide details about the prison"
            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            rows="4"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Prison"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPrison;
