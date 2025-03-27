import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useParams } from "react-router-dom";

const InmateBehaviorGraph = () => {
  const { _id: inmateId } = useParams(); // Destructure inmateId correctly
  const [behaviorData, setBehaviorData] = useState([]); // Store behavior logs
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [inmateDetails, setInmateDetails] = useState(null); // To store inmate details
  // Add new state for parole data
  const [paroleData, setParoleData] = useState({
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

        const [paroleResponse, inmateResponse] = await Promise.all([
          axiosInstance.get(`/parole-tracking/${inmateId}`),
          axiosInstance.get(`/inmates/get-inmate/${inmateId}`)
        ]);

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
            startDate: paroleResponse.data.parole.startDate,
            paroleDate: paroleResponse.data.parole.paroleDate,
            releasedDate: paroleResponse.data.parole.releasedDate,
            durationToParole: paroleResponse.data.parole.durationToParole,
            durationFromParoleToEnd: paroleResponse.data.parole.durationFromParoleToEnd
          });
        }

        if (inmateResponse.data) {
          setInmateDetails(inmateResponse.data.inmate);
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
      const trackedDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24); 
      return trackedDays;
    }
    return 0;
  };

  
  const trackedDays = calculateTrackedDays();
  const averagePointsPerDay = trackedDays > 0 ? totalPoints / trackedDays : 0;

  const totalSentenceDays = inmateDetails ? inmateDetails.sentenceYear : 0;

  const maxPointsPerDay = 10; 
  const progressPercentage = (averagePointsPerDay / maxPointsPerDay) * 100;

  // Determine the color based on the progress percentage
  const getProgressBarColor = () => {
    if (progressPercentage >= 80) return "bg-green-600"; // Green for 80% and above
    if (progressPercentage >= 50) return "bg-yellow-500"; // Yellow for 50% to 79%
    return "bg-red-600"; // Red for below 50%
  };

  // Ensure valid data before performing calculations
  const progressBarPerDay = trackedDays > 0 && totalSentenceDays > 0 ? (trackedDays / totalSentenceDays) * 100 : 0;
  const progressBarTwoThirds = totalSentenceDays > 0 ? ((trackedDays / totalSentenceDays) * 100 / 730) * 100 : 0; // 730 is 2 years in days
  const progressBarPerMonth = totalSentenceDays > 0 && trackedDays > 0 ? (trackedDays / (totalSentenceDays / 30)) * 100 : 0; // Assuming 30 days in a month

  // Determine the level based on the percentage
  const determineLevel = () => {
    if (progressPercentage >= 80) return "High";
    if (progressPercentage >= 50) return "Medium";
    return "Low";
  };

  return (
    <div className="flex flex-col lg:flex-row max-w-full mx-auto mt-10 bg-white p-6 rounded-md shadow-md">
      {/* Inmate Details Section */}
      <div className="flex-1 lg:w-3/4">
        <h2 className="text-2xl font-bold mb-4 text-center">Inmate Behavior Report</h2>

        {/* Display Inmate ID and Details */}
        {inmateDetails && (
          <div className="text-center text-sm text-gray-600 mb-4">
           
            <p><strong>Name:</strong> {inmateDetails.firstName+" "+inmateDetails.middleName+" "+inmateDetails.lastName}</p>
            <p><strong>Age:</strong> {inmateDetails.age}</p>
            <p><strong>Sentence:</strong> {inmateDetails.releaseReason}</p>
            
            {/* Add Parole Information */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Parole Information</h3>
              <p><strong>Start Date:</strong> {new Date(paroleData.startDate).toLocaleDateString()}</p>
              <p><strong>Parole Date:</strong> {new Date(paroleData.paroleDate).toLocaleDateString()}</p>
              <p><strong>Release Date:</strong> {new Date(paroleData.releasedDate).toLocaleDateString()}</p>
              <p><strong>Duration Until Parole:</strong> {paroleData.durationToParole}</p>
              <p><strong>Duration From Parole to Release:</strong> {paroleData.durationFromParoleToEnd}</p>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-600">Loading behavior data...</p>
        ) : behaviorData.length > 0 ? (
          <>
            {/* Total Points Display */}
            <div className="text-center mb-4 text-lg font-semibold text-gray-700">
              Total Points: <span className="text-green-600">{totalPoints}</span>
            </div>

            {/* Average Points Per Day */}
            <div className="text-center mb-4 text-lg font-semibold text-gray-700">
              Average Points Per Day: <span className="text-blue-600">{averagePointsPerDay.toFixed(2)}</span>
            </div>

            {/* Tracked Days */}
            <div className="text-center mb-4 text-lg font-semibold text-gray-700">
              Tracked Days: <span className="text-orange-600">{trackedDays}</span>
            </div>

            {/* Level */}
            <div className="text-center mb-4 text-lg font-semibold text-gray-700">
              Level: <span className="text-purple-600">{determineLevel()} - {progressPercentage.toFixed(2)}%</span>
            </div>

            {/* Display the percentage progress */}
            <div className="text-center text-gray-600 mb-4">
              <p className="text-lg font-semibold">{progressPercentage.toFixed(2)}%</p>
              <p className="text-sm">Progress towards behavior goals</p>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-600">No behavior data available.</p>
        )}
      </div>

      {/* Progress Bars */}
      <div className="flex-1 lg:w-1/4 mt-6 lg:mt-0 flex justify-center items-center space-x-6">
        {/* Main Progress Bar */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-96 bg-gray-300 rounded-full relative mb-2">
            <div
              className={`${getProgressBarColor()} rounded-full absolute bottom-0 w-full`}
              style={{ height: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm font-semibold text-center">{progressPercentage.toFixed(2)}%</p>
          <p className="text-xs text-gray-600">Progress Status</p>
        </div>

        {/* Two-Thirds of Total Sentence Length Progress */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-96 bg-gray-300 rounded-full relative mb-2">
            <div
              className="bg-blue-500 rounded-full absolute bottom-0 w-full"
              style={{ height: `${progressBarTwoThirds}%` }}
            ></div>
          </div>
          <p className="text-sm font-semibold text-center">{progressBarTwoThirds.toFixed(2)}%</p>
          <p className="text-xs text-gray-600">2/3 of Sentence</p>
        </div>

        {/* Progress per Month */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-96 bg-gray-300 rounded-full relative mb-2">
            <div
              className="bg-yellow-500 rounded-full absolute bottom-0 w-full"
              style={{ height: `${progressBarPerMonth}%` }}
            ></div>
          </div>
          <p className="text-sm font-semibold text-center">{progressBarPerMonth.toFixed(2)}%</p>
          <p className="text-xs text-gray-600">Per Month</p>
        </div>

        {/* Progress per Day */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-96 bg-gray-300 rounded-full relative mb-2">
            <div
              className="bg-red-500 rounded-full absolute bottom-0 w-full"
              style={{ height: `${progressBarPerDay}%` }}
            ></div>
          </div>
          <p className="text-sm font-semibold text-center">{progressBarPerDay.toFixed(2)}%</p>
          <p className="text-xs text-gray-600">Per Day</p>
        </div>

        {/* Add new progress bar for parole progress */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-96 bg-gray-300 rounded-full relative mb-2">
            <div
              className="bg-purple-500 rounded-full absolute bottom-0 w-full"
              style={{ 
                height: `${paroleData.startDate && paroleData.paroleDate ? 
                  ((new Date() - new Date(paroleData.startDate)) / 
                  (new Date(paroleData.paroleDate) - new Date(paroleData.startDate))) * 100 : 0}%` 
              }}
            ></div>
          </div>
          <p className="text-sm font-semibold text-center">
            {paroleData.startDate && paroleData.paroleDate ? 
              (((new Date() - new Date(paroleData.startDate)) / 
              (new Date(paroleData.paroleDate) - new Date(paroleData.startDate))) * 100).toFixed(2) : 0}%
          </p>
          <p className="text-xs text-gray-600">Parole Progress</p>
        </div>
      </div>
    </div>
  );
};

export default InmateBehaviorGraph;