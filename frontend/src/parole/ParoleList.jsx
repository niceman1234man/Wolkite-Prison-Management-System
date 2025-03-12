import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance"; // Axios utility

const behaviorRules = [
  { id: 1, label: "Following prison rules", options: [1, 3, 5, 10] },
  { id: 2, label: "Attending rehabilitation programs", options: [1, 3, 5, 10] },
  { id: 3, label: "Helping other inmates", options: [1, 3, 5, 10] },
  { id: 4, label: "Addiction", options: [1, 3, 5, 10] },
  { id: 5, label: "No Fighting or violence", options: [1, 3, 5, 10] },
  { id: 6, label: "Not Attempting escape", options: [1, 3, 5, 10] },
];

const InmateBehavior = () => {
  const { inmateId } = useParams(); 
  const [inmateDetails, setInmateDetails] = useState(null);  
  const [selectedBehaviors, setSelectedBehaviors] = useState({});
  const [paroleScore, setParoleScore] = useState(null);
  const [loadingInmates, setLoadingInmates] = useState(false);

  // Fetch inmate details by ID
  const fetchInmateById = async () => {
    setLoadingInmates(true);
    try {
      const response = await axiosInstance.get(`/inmates/get-inmate/${inmateId}`);
      if (response.data?.inmate) {
        const inmate = response.data.inmate;
        setInmateDetails({
          _id: inmate._id,
          inmate_name: inmate.fullName || "N/A",
          age: inmate.age || "N/A",
          gender: inmate.gender || "N/A",
          sentence: inmate.releaseReason || "N/A",
        });
      } else {
        console.error("Inmate data not found", response);
      }
    } catch (error) {
      console.error("Error fetching inmate:", error);
      alert(error.response?.data?.error || "Failed to fetch inmate data.");
    } finally {
      setLoadingInmates(false);
    }
  };

  useEffect(() => {
    if (inmateId) {
      fetchInmateById();
    }
  }, [inmateId]);

  // Handle behavior selection
  const handleRadioChange = (ruleId, value) => {
    setSelectedBehaviors((prev) => ({
      ...prev,
      [ruleId]: value,
    }));
  };

  // Submit behavior log
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(selectedBehaviors).length === 0) {
      alert("Please select at least one behavior.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found. Please log in again.");
        return;
      }

      const behaviorLogs = Object.entries(selectedBehaviors).map(([id, points]) => {
        const rule = behaviorRules.find((rule) => rule.id === parseInt(id));
        return {
          behaviorType: rule.label,
          points,
          date: new Date(),
        };
      });

      console.log("Submitting behavior logs:", behaviorLogs);

      // Send behavior logs
      const addBehaviorResponse = await axiosInstance.post(
        `/parole-tracking/add/${inmateId}`, 
        { behaviorLogs } // Corrected payload structure
      );

      if (addBehaviorResponse.status === 200) {
        alert("Behavior logged successfully!");
      } else {
        alert("Failed to log behavior.");
      }

      // Fetch updated parole score
      const scoreResponse = await axiosInstance.get(`/parole-tracking/${inmateId}`);
      console.log("Score response:", scoreResponse);

      if (scoreResponse.data.success) {
        setParoleScore(scoreResponse.data.paroleScore);
      }
    } catch (error) {
      console.error("Error submitting behavior log:", error);
      alert("Error submitting behavior log. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-20 bg-white p-8 pt-3 rounded-md shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Inmate Behavior Tracking</h2>

      {loadingInmates ? (
        <div className="text-center text-gray-600">Loading inmate details...</div>
      ) : inmateDetails ? (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4 text-center">Inmate Details</h3>
          <div className="flex space-x-8 text-center">
            <div className="flex-1">
              <p><strong>Name:</strong> {inmateDetails.inmate_name}</p>
              <p><strong>Age:</strong> {inmateDetails.age}</p>
            </div>
            <div className="flex-1">
              <p><strong>Gender:</strong> {inmateDetails.gender}</p>
              <p><strong>Sentence:</strong> {inmateDetails.sentence}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-600">Inmate not found.</div>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2">Rule</th>
                {behaviorRules[0].options.map((opt) => (
                  <th key={opt} className="border border-gray-300 p-2">{opt} pts</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {behaviorRules.map((rule) => (
                <tr key={rule.id} className="border border-gray-300">
                  <td className="border border-gray-300 p-2 font-semibold">{rule.label}</td>
                  {rule.options.map((opt) => (
                    <td key={opt} className="border border-gray-300 p-2 text-center">
                      <input
                        type="radio"
                        name={`rule-${rule.id}`}
                        value={opt}
                        checked={selectedBehaviors[rule.id] === opt}
                        onChange={(e) => handleRadioChange(rule.id, parseInt(e.target.value))}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="submit" className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded">
          Submit Behavior Log
        </button>
      </form>

      {paroleScore !== null && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md text-center">
          <h3 className="text-xl font-semibold">Parole Eligibility: {paroleScore}%</h3>
          {paroleScore >= 75 ? (
            <p className="text-green-600 font-bold">Eligible for Parole</p>
          ) : (
            <p className="text-red-600 font-bold">Not Eligible for Parole</p>
          )}
        </div>
      )}
    </div>
  );
};

export default InmateBehavior;
