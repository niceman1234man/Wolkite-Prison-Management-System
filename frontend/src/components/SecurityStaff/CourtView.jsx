import React, { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaCalendarAlt, FaGavel, FaFileAlt, FaCheck, FaBuilding, FaSignature, FaArrowLeft, FaUserPlus } from "react-icons/fa";

const CourtView = ({ id }) => {
  const navigate = useNavigate();
  const [instruction, setInstruction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
  useEffect(() => {
    const fetchInstruction = async () => {
      try {
        const response = await axiosInstance.get(`/instruction/get-instruct/${id}`);
        if (response.data && response.data.instruction) {
          setInstruction(response.data.instruction);
        } else {
          setError("Instruction details not found.");
        }
      } catch (error) {
        console.error("Error fetching instruction details:", error);
        setError(error.response?.data?.error || "An error occurred while fetching instruction details.");
      } finally {
        setLoading(false);
      }
    };

    fetchInstruction();
  }, [id]);
 
  const handleAddToInmate = () => {
    const initialData = {
      fullName: instruction.inmate, // Assuming inmate name is stored in instruction.inmate
    };
    navigate("/securityStaff-dashboard/add-inmate", { state: { initialData } });
    toast.success("Inmate details prepared for adding");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-10 bg-red-50 p-6 rounded-lg border border-red-200 text-center">
        <div className="text-red-600 font-semibold mb-4">{error}</div>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          <FaArrowLeft className="inline mr-2" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6 mb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-t-lg shadow-md">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 bg-white bg-opacity-20 text-white p-2 rounded-full hover:bg-opacity-30 transition-colors"
            >
              <FaArrowLeft />
            </button>
            <h2 className="text-xl font-bold text-white">Court Instruction Details</h2>
          </div>
          
          <button
            onClick={handleAddToInmate}
            className="bg-white text-blue-600 font-medium py-1.5 px-4 rounded-md hover:bg-blue-50 transition-colors flex items-center"
          >
            <FaUserPlus className="mr-2" /> Add To Inmate
          </button>
        </div>
        
        {/* Case Number Banner */}
        <div className="bg-white bg-opacity-10 text-white px-6 py-2 text-sm font-medium">
          <span className="mr-2">Case Number:</span>
          <span className="font-bold">{instruction.courtCaseNumber}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-white rounded-b-lg shadow-md p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Information Cards */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center">
              <FaBuilding className="mr-2 text-blue-500" /> Prison Name
            </h3>
            <p className="text-lg font-medium text-gray-800">{instruction.prisonName}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center">
              <FaGavel className="mr-2 text-blue-500" /> Judge Name
            </h3>
            <p className="text-lg font-medium text-gray-800">{instruction.inmate}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center">
              <FaCheck className="mr-2 text-blue-500" /> Verdict
            </h3>
            <p className={`text-lg font-medium ${
              instruction.verdict === "guilty" ? "text-red-600" : 
              instruction.verdict === "not_guilty" ? "text-green-600" : "text-gray-800"
            }`}>
              {instruction.verdict === "guilty" ? "Guilty" : 
              instruction.verdict === "not_guilty" ? "Not Guilty" : instruction.verdict}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center">
              <FaCalendarAlt className="mr-2 text-blue-500" /> Hearing Date
            </h3>
            <p className="text-lg font-medium text-gray-800">
              {new Date(instruction.hearingDate).toLocaleDateString()}
            </p>
          </div>

          {/* Full width instruction text */}
          <div className="md:col-span-2 bg-blue-50 p-5 rounded-lg border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-800 uppercase mb-3 flex items-center">
              <FaFileAlt className="mr-2 text-blue-500" /> Instructions
            </h3>
            <p className="text-gray-800 whitespace-pre-line">{instruction.instructions}</p>
          </div>

          {/* Additional dates */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center">
              <FaCalendarAlt className="mr-2 text-blue-500" /> Effective Date
            </h3>
            <p className="text-lg font-medium text-gray-800">
              {new Date(instruction.effectiveDate).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center">
              <FaCalendarAlt className="mr-2 text-blue-500" /> Send Date
            </h3>
            <p className="text-lg font-medium text-gray-800">
              {new Date(instruction.sendDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Document section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center">
              <FaFileAlt className="mr-2 text-blue-500" /> Attachment
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-center">
              <img
                src={`https://localhost:4000/uploads/${instruction.attachment}`}
                alt="Attachment"
                className="max-h-[300px] object-contain"
              />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center">
              <FaSignature className="mr-2 text-blue-500" /> Signature
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-center">
              <img
                src={`https://localhost:4000/uploads/${instruction.signature}`}
                alt="Signature"
                className="max-h-[200px] object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourtView;
