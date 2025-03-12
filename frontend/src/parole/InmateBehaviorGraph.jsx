import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import axiosInstance from "../utils/axiosInstance";
import { useParams } from "react-router-dom";

const InmateBehaviorGraph = () => {
  const  inmateId = useParams(); // Extract the inmateId correctly
  const [behaviorData, setBehaviorData] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBehaviorData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("No token found. Please log in again.");
          return;
        }

        const response = await axiosInstance.get(`/parole-tracking/${inmateId._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data) {
          const formattedData = response.data.behaviorLogs.map((log) => ({
            name: log.rule, // Use 'rule' as label
            points: log.points,
          }));

          // Calculate total points
          const total = formattedData.reduce((sum, log) => sum + log.points, 0);

          setBehaviorData(formattedData);
          setTotalPoints(total);
        }
      } catch (error) {
        console.error("Error fetching behavior data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (inmateId) {
      fetchBehaviorData();
    }
  }, [inmateId]);

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white p-6 rounded-md shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Inmate Behavior Report</h2>

      {loading ? (
        <p className="text-center text-gray-600">Loading behavior data...</p>
      ) : behaviorData.length > 0 ? (
        <>
          <div className="text-center mb-4 text-lg font-semibold text-gray-700">
            Total Points: <span className="text-green-600">{totalPoints}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={behaviorData}>
              <XAxis dataKey="name" tick={{ fontSize: 14 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="points" fill="#4CAF50" barSize={40} name="Points Earned" />
            </BarChart>
          </ResponsiveContainer>
        </>
      ) : (
        <p className="text-center text-gray-600">No behavior data available.</p>
      )}
    </div>
  );
};

export default InmateBehaviorGraph;
