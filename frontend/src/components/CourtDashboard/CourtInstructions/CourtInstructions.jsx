// CourtInstructions.jsx
import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const CourtInstructions = () => {
  // Initialize form state with additional fields
  const [formData, setFormData] = useState({
    prisonerId: "",
    prisonerName: "",
    courtCaseNumber: "",
    judgeName: "",
    prisonName: "",
    verdict: "",
    instructions: "",
    hearingDate: new Date().toISOString().substring(0, 10),
    effectiveDate: new Date().toISOString().substring(0, 10),
  });

  // Update form data for any input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Retrieve authentication token if needed
      const token = localStorage.getItem("token");

      // Send form data to backend API endpoint
      const response = await axios.post("http://localhost:5000/api/court/instructions", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        toast.success("Instruction sent successfully!");
        // Reset form to default values after successful submission
        setFormData({
          prisonerId: "",
          prisonerName: "",
          courtCaseNumber: "",
          judgeName: "",
          prisonName: "",
          verdict: "",
          instructions: "",
          hearingDate: new Date().toISOString().substring(0, 10),
          effectiveDate: new Date().toISOString().substring(0, 10),
        });
      } else {
        toast.error("Failed to send instruction.");
      }
    } catch (error) {
      console.error("Error sending instruction:", error);
      toast.error("An error occurred while sending instruction.");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white shadow rounded-md mt-16">
      <h2 className="text-2xl font-bold mb-4 text-center">Court Instruction</h2>
      <form onSubmit={handleSubmit}>
        {/* Grid for multiple inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prisoner ID */}
          <div className="mb-4">
            <label htmlFor="prisonerId" className="block text-sm font-medium text-gray-700">
              Prisoner ID
            </label>
            <input
              type="text"
              id="prisonerId"
              name="prisonerId"
              placeholder="Enter prisonerId"
              value={formData.prisonerId}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          {/* Prisoner Name */}
          <div className="mb-4">
            <label htmlFor="prisonerName" className="block text-sm font-medium text-gray-700">
              Prisoner Name
            </label>
            <input
              type="text"
              id="prisonerName"
              name="prisonerName"
              placeholder="Enter Prisoner Name"
              value={formData.prisonerName}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          {/* Court Case Number */}
          <div className="mb-4">
            <label htmlFor="courtCaseNumber" className="block text-sm font-medium text-gray-700">
              Court Case Number
            </label>
            <input
              type="text"
              id="courtCaseNumber"
              name="courtCaseNumber"
              placeholder="Inter case number"
              value={formData.courtCaseNumber}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          {/* Judge Name */}
          <div className="mb-4">
            <label htmlFor="judgeName" className="block text-sm font-medium text-gray-700">
              Judge Name
            </label>
            <input
              type="text"
              id="judgeName"
              name="judgeName"
              placeholder="Enter Judge name"
              value={formData.judgeName}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-b-md shadow-sm"
              required
            />
          </div>
          {/* Prison Name */}
          <div className="mb-4">
            <label htmlFor="prisonName" className="block text-sm font-medium text-gray-700">
              Prison Name
            </label>
            <input
              type="text"
              id="prisonName"
              name="prisonName"
              placeholder="Enter Prison name"
              value={formData.prisonName}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          {/* Verdict Selection */}
          <div className="mb-4">
            <label htmlFor="verdict" className="block text-sm font-medium text-gray-700">
              Verdict
            </label>
            <select
              id="verdict"
              name="verdict"
              value={formData.verdict}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              required
            >
              <option value="">Select Verdict</option>
              <option value="guilty">Guilty</option>
              <option value="not_guilty">Not Guilty</option>
              {/* <option value="hung_jury">Hung Jury</option> */}
            </select>
          </div>
          {/* Hearing Date */}
          <div className="mb-4">
            <label htmlFor="hearingDate" className="block text-sm font-medium text-gray-700">
              Hearing Date
            </label>
            <input
              type="date"
              id="hearingDate"
              name="hearingDate"
              value={formData.hearingDate}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          {/* Effective Date */}
          <div className="mb-4">
            <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700">
              Effective Date
            </label>
            <input
              type="date"
              id="effectiveDate"
              name="effectiveDate"
              value={formData.effectiveDate}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          {/* Send Date */}
          <div className="mb-4">
            <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700">
              Send Date
            </label>
            <input
              type="date"
              id="effectiveDate"
              name="effectiveDate"
              value={formData.effectiveDate}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reporter Signature</label>
            <input
              type="file"
              name="signature"
              accept="image/*"
              onChange={handleChange}
              className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
            />
          </div>
          {/* Attachment */}
          <div className="mb-4">
            <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700">
             Attachment
            </label>
            <input
              type="file"
              id="attachment"
              name="attachment"            
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
        </div>

        {/* Instruction Details */}
        <div className="mb-4">
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
            Instruction Details
          </label>
          <textarea
            id="instructions"
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            rows="4"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            placeholder="Enter details regarding the verdict or instructions to the prison"
            required
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-teal-600 text-white py-2 px-4 rounded hover:bg-teal-700 transition-colors"
        >
          Send Instruction
        </button>
      </form>
    </div>
  );
};

export default CourtInstructions;
