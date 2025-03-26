import axiosInstance from "../../utils/axiosInstance";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";

const AddPrison = ({ setOpen }) => {
  const [prisonData, setPrisonData] = useState({
    prison_name: "",
    location: "",
    description: "",
    capacity: 0,
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPrisonData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (
        !prisonData.prison_name ||
        !prisonData.location ||
        !prisonData.description ||
        !prisonData.capacity
      ) {
        toast.error("All fields are required");
        return;
      }

      const response = await axiosInstance.post(
        "/prison/new-prison",
        prisonData
      );

      if (response.data?.success) {
        toast.success("Prison added successfully!");
        setOpen(false);
        navigate("/inspector-dashboard/prisons");
      }
    } catch (error) {
      console.error("Error:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        navigate("/login");
      } else {
        toast.error(
          error.response?.data?.error ||
            "Failed to add prison. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Prison</DialogTitle>
          <DialogDescription>
            Fill in the details below to register a new prison facility.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prison Name */}
          <div>
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
              className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              required
              aria-describedby="prison_name-description"
            />
            <p
              id="prison_name-description"
              className="mt-1 text-sm text-gray-500"
            >
              Enter the name of the prison facility
            </p>
          </div>

          {/* Location */}
          <div>
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
              className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              required
              aria-describedby="location-description"
            />
            <p id="location-description" className="mt-1 text-sm text-gray-500">
              Enter the location or woreda where the prison is situated
            </p>
          </div>

          {/* Capacity */}
          <div>
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
              className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              min="0"
              required
              aria-describedby="capacity-description"
            />
            <p id="capacity-description" className="mt-1 text-sm text-gray-500">
              Enter the maximum number of inmates the prison can accommodate
            </p>
          </div>

          {/* Description */}
          <div>
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
              className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              rows="4"
              required
              aria-describedby="description-description"
            ></textarea>
            <p
              id="description-description"
              className="mt-1 text-sm text-gray-500"
            >
              Provide additional details about the prison facility
            </p>
          </div>

          <DialogFooter>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Prison"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPrison;
