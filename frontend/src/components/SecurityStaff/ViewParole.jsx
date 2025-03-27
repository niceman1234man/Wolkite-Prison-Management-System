import axiosInstance from "../../utils/axiosInstance";
import React, { useState, useEffect } from "react";
import ParoleRequestForm from "@/parole/ParoleRequestForm";

const ViewParole = ({ id }) => {
  const [inmates, setInmates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openAccept, setOpenAccept] = useState(false);

  // Fetch parole details
  const fetchInmates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/parole-tracking/${id}`);
      console.log(response);

      if (response.data && response.data.parole) {
        setInmates(response.data.parole);
      } else {
        console.error("Invalid API response:", response);
        setInmates(null);
      }
    } catch (error) {
      console.error("Error fetching parole:", error);
      setInmates(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInmates();
  }, [id]); // ✅ Include id in dependency array

  // Handle parole request
  const requestHandle = async () => {
    try {
      const response = await axiosInstance.post(`/parole-request`, { inmateId: id });
      alert("Parole request submitted successfully!");
      setOpenAccept(false);
    } catch (error) {
      console.error("Error submitting parole request:", error);
      alert(error.response?.data?.message || "Failed to submit parole request.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-lg font-semibold animate-pulse">Loading parole details...</p>
      </div>
    );
  }


  const parole={
    name:inmates.fullName,
    case:inmates.caseType,
    start:new Date (inmates.startDate).toLocaleDateString(),
    end:new Date(inmates.releasedDate).toLocaleDateString(),
    point:inmates.totalPoints,
    year:inmates.sentenceYear
  }

  return (
    <div className="w-full mx-auto bg-white p-8 rounded-md shadow-md">
      <h2 className="text-2xl font-bold mb-8 text-center">Parole Details</h2>

      {inmates ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-lg font-bold">
                Inmate Full Name: <span className="font-medium">{inmates.fullName}</span>
              </p>
              <p className="text-lg font-bold">
                Age: <span className="font-medium">{inmates.age}</span>
              </p>
              <p className="text-lg font-bold">
                Gender: <span className="font-medium">{inmates.gender}</span>
              </p>
              <p className="text-lg font-bold">
                Status:{" "}
                <span className="font-medium">{inmates.paroleEligible ? "Eligible" : "Not Eligible"}</span>
              </p>
              <p className="text-lg font-bold">
                Total Points: <span className="font-medium">{inmates.totalPoints}</span>
              </p>
              <p className="text-lg font-bold">
                Case Type: <span className="font-medium">{inmates.caseType}</span>
              </p>
              <p className="text-lg font-bold">
                Start Date: <span className="font-medium">{new Date (inmates.startDate).toLocaleDateString()}</span>
              </p>
              <p className="text-lg font-bold">
                Release Date: <span className="font-medium">{new Date(inmates.releasedDate).toLocaleDateString()}</span>
              </p>
              <p className="text-lg font-bold">
                Sentence Year: <span className="font-medium">{inmates.sentenceYear}</span>
              </p>
            
            </div>
          </div>
              

          {/* Action Buttons */}
          <div className="flex justify-center mt-6">
            <button
              className="py-2 px-4 rounded font-semibold bg-green-600 text-white hover:bg-green-700 transition"
              onClick={() => setOpenAccept(true)}
            >
              Request Parole
            </button>
          </div>

          {/* Parole Request Form */}
          <ParoleRequestForm
            isOpen={openAccept}
            parole={parole}
            onClose={() => setOpenAccept(false)}
            onSubmit={requestHandle}
          />
        </>
      ) : (
        <p className="text-center text-gray-500">No parole data available.</p>
      )}
    </div>
  );
};

export default ViewParole;
