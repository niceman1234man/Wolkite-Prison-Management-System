import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useParams } from "react-router-dom";

const InmateBehaviorGraph = () => {
  const { _id: inmateId } = useParams(); // Destructure inmateId correctly
  const [behaviorData, setBehaviorData] = useState([]); // Store behavior logs
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  // Add new state for parole data
  const [paroleData, setParoleData] = useState({
    sentenceYear: 0,
    fullName: "",
    age: "",
    caseType: "",
    startDate: null,
    paroleDate: null,
    releasedDate: null,
    durationToParole: '',
    durationFromParoleToEnd: ''
  });

  // Fetch behavior data and inmate details
  useEffect(() => {
    const fetchInmateData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("No token found. Please log in again.");
          return;
        }

        const paroleResponse = await axiosInstance.get(`/parole-tracking/${inmateId}`);
        if (paroleResponse.data) {
          const behaviorLogs = paroleResponse.data.parole.behaviorLogs || [];
          const formattedData = behaviorLogs.map((log) => ({
            name: log.rule, 
            points: log.points,
            date: log.date, 
          }));
         
          const total = formattedData.reduce((sum, log) => sum + log.points, 0);
          setBehaviorData(formattedData);
          setTotalPoints(total);

          // Set parole data
          setParoleData({
            sentenceYear: Number(paroleResponse.data.parole.sentenceYear),
            fullName: paroleResponse.data.parole.fullName,
            age: paroleResponse.data.parole.age,
            caseType: paroleResponse.data.parole.caseType,
            startDate: paroleResponse.data.parole.startDate,
            paroleDate: paroleResponse.data.parole.paroleDate,
            releasedDate: paroleResponse.data.parole.releasedDate,
            durationToParole: paroleResponse.data.parole.durationToParole,
            durationFromParoleToEnd: paroleResponse.data.parole.durationFromParoleToEnd
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (inmateId) {
      fetchInmateData();
    }
  }, [inmateId]);
  
  const calculateTrackedDays = () => {
    if (behaviorData.length > 0) {
      const firstDate = new Date(behaviorData[0].date);
      const lastDate = new Date(behaviorData[behaviorData.length - 1].date);
      return (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    }
    return 0;
  };
  
  const trackedDays = calculateTrackedDays();
  const averagePointsPerDay = trackedDays > 0 ? totalPoints / trackedDays : 0;
  const totalSentenceDays = paroleData.sentenceYear * 365;
  const maxPointsPerDay = 105;
  const progressPercentage = (averagePointsPerDay / maxPointsPerDay) * 100;

  const progressBarPerDay = (trackedDays / totalSentenceDays) * 100;
  const progressBarPerMonth = (trackedDays / (totalSentenceDays / 12)) * 100;
  const progressBarParole = paroleData.startDate && paroleData.paroleDate 
    ? ((new Date() - new Date(paroleData.startDate)) / (new Date(paroleData.paroleDate) - new Date(paroleData.startDate))) * 100 
    : 0;
    const labels = ["Progress", "Per Day", "Per Month", "Parole Progress"];
  const getProgressBarColor = (percentage) => {
    if (percentage >= 80) return "bg-green-600";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-600";
  };

  return (
    <div className="flex flex-col lg:flex-row max-w-full mx-auto mt-10 bg-white p-6 rounded-md shadow-md ml-60">
      <div className="flex-1 lg:w-3/4">
        <h2 className="text-2xl font-bold mb-4 text-center">Inmate Behavior Report</h2>
        {loading ? (
          <p className="text-center text-gray-600">Loading behavior data...</p>
        ) : (
          <>
           <div className="text-center mb-4 font-semibold">Full Name: {paroleData.fullName}</div>
            <div className="text-center mb-4 font-semibold">Age: {paroleData.age}</div>
            <div className="text-center mb-4 font-semibold">Case: {paroleData.caseType}</div>
            <div className="text-center mb-4 font-semibold">Start Date: {new Date(paroleData.startDate).toLocaleDateString()}</div>
            <div className="text-center mb-4 font-semibold">End Date: { new Date(paroleData.releasedDate).toLocaleDateString()}</div>
            <div className="text-center mb-4 font-semibold">Parole Date: { new Date(paroleData.paroleDate).toLocaleDateString()}</div>
            <div className="text-center mb-4 font-semibold">Start to Parole Date: {paroleData.durationToParole}</div>
            <div className="text-center mb-4 font-semibold">Parole to End Date: {paroleData.durationFromParoleToEnd}</div>
            <div className="text-center mb-4 font-semibold">Total Points: {totalPoints}</div>
            <div className="text-center mb-4 font-semibold">Average Points Per Day: {averagePointsPerDay.toFixed(2)}</div>
            <div className="text-center mb-4 font-semibold">Tracked Days: {trackedDays}</div>
          </>
        )}
      </div>

      <div className="flex-1 lg:w-1/4 mt-6 lg:mt-0 flex justify-center items-center space-x-6">
        {[progressPercentage, progressBarPerDay, progressBarPerMonth, progressBarParole].map((value, index) => (
          <div key={index} className="flex flex-col items-center">
          <div className="w-16 h-96 bg-gray-300 rounded-full relative mb-2">
              <div className={`${getProgressBarColor(value)} rounded-full absolute bottom-0 w-full`} style={{ height: `${value}%` }}></div>
          </div>
            <p className="text-sm font-semibold text-center">{value.toFixed(2)}%</p>
            <p className="text-xs text-gray-600">{labels[index]}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InmateBehaviorGraph;
