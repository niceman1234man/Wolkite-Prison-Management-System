import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";

export default function PrisonerIntakeForm() {
  const [prisons, setPrisons] = useState([]);
  const [prisonerData, setPrisonerData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "male", // Default gender
    crime: "",
    sentenceStart: "",
    sentenceEnd: "",
    paroleEligibility: "false",
    medicalConditions: "",
    riskLevel: "Low",
    specialRequirements: "",
    intakeDate: new Date().toISOString().split("T")[0], // Default to today's date
    arrestingOfficer: "",
    holdingCell: "block 2", // To be assigned
    documents: [], // For uploaded files
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchPrisons();
  }, []);

  const fetchPrisons = async () => {
    try {
      const response = await axiosInstance.get("/prison/getall-prisons", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data?.prisons?.length > 0) {
        setPrisons(response.data.prisons);
      }
    } catch (error) {
      console.error("Error fetching prisons:", error);
      alert(error.response?.data?.error || "Failed to fetch prison data.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPrisonerData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setPrisonerData((prev) => ({
      ...prev,
      documents: files,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      // Append prisoner data to formData
      Object.entries(prisonerData).forEach(([key, value]) => {
        if (key === "documents") {
          prisonerData.documents.forEach((file) => formData.append("documents", file));
        } else {
          formData.append(key, value);
        }
      });

      // Submit the form data
      const response = await axiosInstance.post("/prisoner/new-prisoner", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data) {
        alert("Prisoner registered successfully!");
        navigate("/woreda-dashboard/inmates");
      }
    } catch (error) {
      console.error("Error registering prisoner:", error);
      alert("Failed to register prisoner.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h2 className="text-xl font-bold mb-4">Prisoner Intake Form</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {/* First Name */}
        <div className="col-span-1">
          <label className="block mb-2">First Name</label>
          <input
            type="text"
            name="firstName"
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Middle Name */}
        <div className="col-span-1">
          <label className="block mb-2">Middle Name</label>
          <input
            type="text"
            name="middleName"
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Last Name */}
        <div className="col-span-2">
          <label className="block mb-2">Last Name</label>
          <input
            type="text"
            name="lastName"
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Date of Birth */}
        <div className="col-span-1">
          <label className="block mb-2">Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Gender */}
        <div className="col-span-1">
          <label className="block mb-2">Gender</label>
          <select
            name="gender"
            value={prisonerData.gender}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        {/* Crime */}
        <div className="col-span-2">
          <label className="block mb-2">Crime</label>
          <input
            type="text"
            name="crime"
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Sentence Start */}
        <div className="col-span-1">
          <label className="block mb-2">Sentence Start</label>
          <input
            type="date"
            name="sentenceStart"
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Sentence End */}
        <div className="col-span-1">
          <label className="block mb-2">Sentence End</label>
          <input
            type="date"
            name="sentenceEnd"
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Parole Eligibility */}
        <div className="col-span-1">
          <label className="block mb-2">Parole Eligibility</label>
          <select
            name="paroleEligibility"
            value={prisonerData.paroleEligibility}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        {/* Medical Conditions */}
        <div className="col-span-1">
          <label className="block mb-2">Medical Conditions</label>
          <input
            type="text"
            name="medicalConditions"
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Risk Level */}
        <div className="col-span-1">
          <label className="block mb-2">Risk Level</label>
          <select
            name="riskLevel"
            value={prisonerData.riskLevel}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Special Requirements */}
        <div className="col-span-1">
          <label className="block mb-2">Special Requirements</label>
          <input
            type="text"
            name="specialRequirements"
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Intake Date */}
        <div className="col-span-1">
          <label className="block mb-2">Intake Date</label>
          <input
            type="date"
            name="intakeDate"
            value={prisonerData.intakeDate}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Arresting Officer */}
        <div className="col-span-1">
          <label className="block mb-2">Arresting Officer</label>
          <input
            type="text"
            name="arrestingOfficer"
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Holding Cell */}
        <div className="col-span-2">
          <label className="block mb-2">Assign Holding Cell</label>
          <select
            name="holdingCell"
            value={prisonerData.holdingCell}
            onChange={handleChange}
            className="w-full p-2 border rounded"
           
          >
            <option value="">Select Holding Cell</option>
            {prisons.map((prison) => (
              <option key={prison.id} value={prison.prison_name}>
                {prison.prison_name}
              </option>
            ))}
          </select>
        </div>

        {/* Upload Documents */}
        <div className="col-span-2">
          <label className="block mb-2">Upload Documents</label>
          <input
            type="file"
            name="documents"
            onChange={handleFileUpload}
            className="w-full p-2 border rounded"
            multiple
          />
        </div>

        {/* Submit Button */}
        <div className="col-span-2">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded"
          >
            Register Prisoner
          </button>
        </div>
      </form>
    </div>
  );
}