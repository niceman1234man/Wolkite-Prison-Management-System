import axiosInstance from "../../utils/axiosInstance";
import React, { useState, useEffect } from "react";
import ParoleRequestForm from "@/parole/ParoleRequestForm";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ViewParole = ({ id }) => {
  const [inmates, setInmates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openAccept, setOpenAccept] = useState(false);

  // Fetch parole details
  const fetchInmates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/parole-tracking/${id}`);
      console.log("API Response:", response.data);

      if (response.data && response.data.parole) {
        setInmates(response.data.parole);
      } else {
        console.error("Invalid API response:", response.data);
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
  }, [id]); // ✅ Keep `id` in dependency array

  // Handle parole request
  const requestHandle = async () => {
    try {
      await axiosInstance.post(`/parole-request`, { inmateId: id });
      alert("Parole request submitted successfully!");
      setOpenAccept(false);
    } catch (error) {
      console.error("Error submitting parole request:", error);
      alert(error.response?.data?.message || "Failed to submit parole request.");
    }
  };

  // Calculate duration between two dates
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "Not available";
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start) || isNaN(end)) return "Invalid Date";

    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    
    const totalMonths = (yearDiff * 12) + monthDiff;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    return years && months ? `${years} years and ${months} months` : years ? `${years} years` : `${months} months`;
  };

  // Prepare parole object
  const parole = inmates
    ? {
        inmateId: id,
        name: inmates.fullName,
        case: inmates.caseType,
        start: inmates.startDate ? new Date(inmates.startDate).toLocaleDateString() : "N/A",
        paroleDate: inmates.paroleDate ? new Date(inmates.paroleDate).toLocaleDateString() : "N/A",
        end: inmates.releasedDate ? new Date(inmates.releasedDate).toLocaleDateString() : "N/A",
        point: inmates.totalPoints,
        year: inmates.sentenceYear,
        durationToParole: calculateDuration(inmates.startDate, inmates.paroleDate),
        durationFromParoleToEnd: calculateDuration(inmates.paroleDate, inmates.releasedDate),
      }
    : null;

  console.log(parole?.inmateId); 

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-lg font-semibold animate-pulse">Loading parole details...</p>
      </div>
    );
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
            </div>

            <div>
              <p className="text-lg font-bold">
                Start Date: <span className="font-medium">{parole?.start}</span>
              </p>
              <p className="text-lg font-bold">
                Parole Date: <span className="font-medium">{parole?.paroleDate}</span>
              </p>
              <p className="text-lg font-bold">
                Release Date: <span className="font-medium">{parole?.end}</span>
              </p>
              <p className="text-lg font-bold">
                Duration Until Parole: <span className="font-medium">{parole?.durationToParole}</span>
              </p>
              <p className="text-lg font-bold">
                Duration From Parole to Release: <span className="font-medium">{parole?.durationFromParoleToEnd}</span>
              </p>
              <p className="text-lg font-bold">
                Sentence Year: <span className="font-medium">{inmates.sentenceYear}</span>
              </p>
              <p className="text-lg font-bold">
                Status: <span className="font-medium">{inmates.status}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center mt-6">
            <button
              className={`py-2 px-4 rounded font-semibold ${
                inmates.status === "accepted" || inmates.status === "rejected"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              } text-white transition`}
              onClick={() => {
                if (inmates.status === "accepted" || inmates.status === "rejected") {
                  toast.info(`This parole request has already been ${inmates.status}`, {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                  });
                } else {
                  setOpenAccept(true);
                }
              }}
            >
              {inmates.status === "accepted" || inmates.status === "rejected"
                ? `Request ${inmates.status}`
                : "Request Parole"}
            </button>
            
            {(inmates.status === "accepted" || inmates.status === "rejected") && (
              <p className="text-sm text-gray-600 mt-2">
                This parole request has already been {inmates.status}
              </p>
            )}
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
