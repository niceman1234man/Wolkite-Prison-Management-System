import axiosInstance from "../../utils/axiosInstance";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TiArrowBack } from "react-icons/ti";

const EditPrison = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [prisonData, setPrisonData] = useState({
    prison_name: "",
    location: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPrisonData((prevState) => ({ ...prevState, [name]: value }));
  };

  // Fetch prison data when component mounts
  useEffect(() => {
    const fetchPrisonData = async () => {
      try {
        const response = await axiosInstance.get(`/prison/get-prison/${id}`);
        if (response.data.prison) {
          setPrisonData(response.data.prison);
        } else {
          toast.error("Prison data not found.");
          navigate(-1);
        }
      } catch (error) {
        console.error("Error fetching prison data:", error);
        toast.error("Failed to fetch prison data.");
        navigate(-1);
      }
    };
    fetchPrisonData();
  }, [id, navigate]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axiosInstance.put(`/prison/update-prison/${id}`, prisonData);
      toast.success("Prison updated successfully!");
      navigate("/inspector-dashboard/prisons");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.error || "Failed to update prison. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-20 bg-white p-8 rounded-md shadow-lg">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-all mb-4"
      >
        <TiArrowBack size={24} />
        <span className="text-lg font-semibold">Go Back</span>
      </button>

      {/* Form Title */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Update Prison</h2>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Prison Name */}
        <div className="mb-4">
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
        <div className="mb-4">
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

        {/* Description */}
        <div className="mb-6">
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
            required
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Prison"}
        </button>
      </form>
    </div>
  );
};

export default EditPrison;
