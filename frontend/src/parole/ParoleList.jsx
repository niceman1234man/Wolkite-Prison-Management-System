import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance"; // Axios utility
import { useSelector } from "react-redux"; // To access sidebar state
const behaviorRules = [
  { id: 1, label: "የማ/ቤቱ አባሎች የሚያከብር", options: [1, 2, 3, 4, 5] },
  { id: 2, label: "በማንኛውም የአድማ ሥራ ላይ የማይግኝ", options: [1, 2, 3, 4, 5] },
  { id: 3, label: "ከማረሚያ ቤቱ ለማምለጥ የማይሞክር", options: [1, 2, 3, 4, 5] },
  { id: 4, label: "በማረሚያ ካሉ አካል መ/በኩል የሚሰጠው የሚቀበል", options: [1, 2, 3, 4, 5] },
  { id: 5, label: "በተመደበበት ቦታ ላይ ትጉህና አርያ የሚሆን", options: [1, 2, 3, 4, 5] },
  { id: 6, label: "በአድራጎት የተፀፀተ ማህበራዊ ኑሮ ዝንባሌ ያለው ", options: [1, 2, 3, 4, 5] },
  { id: 7, label: "እውነተኛ ጉዳይ የሚያቀርብና የሚያስተባብር ", options: [1, 2, 3, 4, 5] },
  { id: 8, label: "ለወንጀል የሚያገለግል መሣሪያ ይዞ የማይገኝ  ", options: [1, 2, 3, 4, 5] },
  { id: 9, label: "የተረከበውን እቃ ልብስ በጥንቃቄ የሚይዝ ", options: [1, 2, 3, 4, 5] },
  {
    id: 10,
    label: "በማረሚያ ቤቱ በነበረበት ጊዜ ማንኛውምንም ሰው የማይሰድብ ",
    options: [1, 2, 3, 4, 5],
  },
  { id: 11, label: "ማያጭበረብር የማይሰርቅ ", options: [1, 2, 3, 4, 5] },
  { id: 12, label: "ቁማር የማይጫወት ", options: [1, 2, 3, 4, 5] },
  {
    id: 13,
    label: "የመሸጥ የመለወጥ የማጭበርበር ተግባር የማይፈጽም ",
    options: [1, 2, 3, 4, 5],
  },
  { id: 14, label: "ጸጥታና ስነስርዓት የሚያውቅ ", options: [1, 2, 3, 4, 5] },
  { id: 15, label: "ራሱንና የግቢው ጽዳት የሚጠብቅ ", options: [1, 2, 3, 4, 5] },
  { id: 16, label: "የታሠረበትን የእግር ብረት ለመስበር የማይሞክር ", options: [1, 2, 3, 4, 5] },
  { id: 17, label: "አደንዛዥ እጽ የማይጠቀም ", options: [1, 2, 3, 4, 5] },
  { id: 18, label: "አልኮል ነክ ነገሮች የማያስገባና የማይጠቅም", options: [1, 2, 3, 4, 5] },
  { id: 19, label: "በገዛ እጅ ራሱን ለማጥፋት የማይሞክር ", options: [1, 2, 3, 4, 5] },
  { id: 20, label: "ራሱን ለማሻሻል የሚያደርገው ጥረት ", options: [1, 2, 3, 4, 5] },
  { id: 21, label: "ከዚህ በላይ የተዘረዘሩት አክብሮ የሚገኝ ", options: [1, 2, 3, 4, 5] },
];

const InmateBehavior = () => {
  const { inmateId } = useParams(); 
  const navigate = useNavigate();
  const [inmateDetails, setInmateDetails] = useState(null);
  const [selectedBehaviors, setSelectedBehaviors] = useState({}); 
  const [paroleScore, setParoleScore] = useState(null);
  const [loadingInmates, setLoadingInmates] = useState(false); 
  const [trackedDays, setTrackedDays] = useState(0); 
  const [signature, setSignature] = useState(null);
  const [formdata, setFormData] = useState({
    committeeName: ""
  });
  
  // Sidebar collapse state from Redux
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  // Add this helper function at the top of your component
  const formatToLocalDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString();
  };

  // Fetch inmate details based on the inmate ID
  const fetchInmateById = async () => {
    setLoadingInmates(true);
    try {
      const response = await axiosInstance.get(
        `/inmates/get-inmate/${inmateId}`
      );
      
      if (response.data?.inmate) {
        const inmate = response.data.inmate;
        setInmateDetails({
          _id: inmate._id,
          inmate_name: inmate.firstName + " " + inmate.middleName + " " + inmate.lastName || "N/A",
          age: inmate.age || "N/A",
          sentenceYear: inmate.sentenceYear,
          gender: inmate.gender || "N/A",
          sentence: inmate.caseType || "N/A", 
          releaseDate: inmate.releasedDate || "N/A",
          startDate: inmate.startDate || "N/A",
          paroleDate: inmate.paroleDate || "N/A",
          durationToParole: inmate.durationToParole || "N/A",
          durationFromParoleToEnd: inmate.durationFromParoleToEnd || "N/A"
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

  const handleRadioChange = (ruleId, value) => {
    setSelectedBehaviors((prev) => ({
      ...prev,
      [ruleId]: value,
    }));
  };
  
  const calculateTrackedDays = (behaviorLogs) => {
    if (!behaviorLogs || behaviorLogs.length === 0) return 0;
    const dates = behaviorLogs.map((log) => new Date(log.date).toDateString());
    const uniqueDates = [...new Set(dates)];
    return uniqueDates.length;
  };

  // Fetch behavior logs and calculate tracked days
  const fetchBehaviorLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found. Please log in again.");
        return;
      }

      const response = await axiosInstance.get(`/parole-tracking/${inmateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.behaviorLogs) {
        const trackedDaysCount = calculateTrackedDays(
          response.data.behaviorLogs
        );
        setTrackedDays(trackedDaysCount);
      }
    } catch (error) {
      console.error("Error fetching behavior logs:", error);
      alert("Failed to fetch behavior logs.");
    }
  };

  useEffect(() => {
    fetchBehaviorLogs(); 
  }, [inmateId]);

  // Function to calculate parole eligibility
  const checkParoleEligibility = () => {
    if (!inmateDetails?.sentence || !selectedBehaviors) return null;

    const totalSentenceYears = parseInt(inmateDetails.sentence); // Assuming sentence is in years
    const pointsEarnedThisYear = Object.values(selectedBehaviors).reduce(
      (acc, points) => acc + points,
      0
    );
    const totalPossiblePoints = behaviorRules.length * 10; // 10 points max per behavior rule

    // 2/3 sentence completion check
    const twoThirdsSentence = (totalSentenceYears * 2) / 3;
    const paroleEligible =
      pointsEarnedThisYear >= totalPossiblePoints * 0.75 &&
      totalSentenceYears >= twoThirdsSentence;

    return paroleEligible;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  
  // Submit behavior log
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validate if at least one behavior is selected
    if (Object.keys(selectedBehaviors).length === 0) {
      alert("Please select at least one behavior.");
      return;
    }
  
    try {
      // Prepare behavior logs
      const behaviorLogs = Object.entries(selectedBehaviors).map(([id, points]) => {
        const rule = behaviorRules.find((rule) => rule.id === parseInt(id));
        return {
          behaviorType: rule.label,
          points,
        };
      });
  
      // Create a FormData object
      const formData = new FormData();
  
      // Append existing inmate details
      formData.append('fullName', inmateDetails.inmate_name);
      formData.append('age', inmateDetails.age);
      formData.append('gender', inmateDetails.gender);
      formData.append('caseType', inmateDetails.sentence);
      formData.append('sentenceYear', inmateDetails.sentenceYear);
      
      // Append new parole-related fields
      formData.append('startDate', inmateDetails.startDate);
      formData.append('releasedDate', inmateDetails.releaseDate);
      formData.append('paroleDate', inmateDetails.paroleDate);
      formData.append('durationToParole', inmateDetails.durationToParole);
      formData.append('durationFromParoleToEnd', inmateDetails.durationFromParoleToEnd);
      
      // Append existing behavior logs and committee data
      formData.append('behaviorLogs', JSON.stringify(behaviorLogs));
      formData.append('committeeNames', formdata.committeeName);
      
      // Append signature file if it exists - using exact field name expected by backend
      if (signature) {
        formData.append('signature', signature);
      }
  
      // Log form data for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
  
      // Send data to the backend
      const response = await axiosInstance.post(`/parole-tracking/add/${inmateDetails._id}`, formData, {
        headers: { 
          "Content-Type": "multipart/form-data"
        }
      });
    
      if (response.status === 201) {
        alert("Behavior log submitted successfully!");
        navigate(`/policeOfficer-dashboard/parole`);
      } else {
        alert("Failed to submit behavior log.");
      }
    } catch (error) {
      console.error("Error submitting behavior log:", error);
      alert(`Error submitting behavior log: ${error.message}`);
    }
  };

  return (
    <div
      className={`max-w-7xl mx-auto mt-12 bg-white rounded-lg shadow-md ${
        isCollapsed ? "ml-16" : "ml-64"
      } transition-all duration-300`}
    >
      <div className="bg-teal-600 text-white py-4 px-6 rounded-t-lg">
        <h2 className="text-2xl font-bold text-center">
          Inmate Behavior Tracking
        </h2>
      </div>

      {loadingInmates ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
          <span className="ml-3 text-gray-600">Loading inmate details...</span>
        </div>
      ) : inmateDetails ? (
        <div className="p-6">
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
            <h3 className="text-xl font-semibold mb-4 text-teal-700 border-b pb-2">
              Inmate Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="mb-2">
                  <span className="font-semibold">የህግ ታራሚው ስም:</span> {inmateDetails.inmate_name}
                </p>
                <p className="mb-2">
                  <span className="font-semibold">Age:</span> {inmateDetails.age}
                </p>
                <p className="mb-2">
                  <span className="font-semibold">Gender:</span> {inmateDetails.gender}
                </p>
              </div>
              <div>
                <p className="mb-2">
                  <span className="font-semibold">Sentence:</span> {inmateDetails.sentence}
                </p>
                <p className="mb-2">
                  <span className="font-semibold">Start Date:</span> {formatToLocalDate(inmateDetails.startDate)}
                </p>
                <p className="mb-2">
                  <span className="font-semibold">Released Date:</span> {formatToLocalDate(inmateDetails.releaseDate)}
                </p>
              </div>
            </div>
            
            <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-200">
              <h3 className="text-lg font-semibold mb-2 text-blue-700">Parole Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <p><span className="font-semibold">Parole Date:</span> {formatToLocalDate(inmateDetails.paroleDate)}</p>
                <p><span className="font-semibold">Duration Until Parole:</span> {inmateDetails.durationToParole}</p>
                <p><span className="font-semibold">Duration After Parole:</span> {inmateDetails.durationFromParoleToEnd}</p>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <div className="inline-block bg-teal-100 px-4 py-2 rounded-full">
                <span className="font-semibold">Tracked Days:</span> {trackedDays}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 mb-6">
              <table className="w-full border-collapse table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-b border-r border-gray-300 p-3 text-left">Rule</th>
                    {behaviorRules[0].options.map((opt) => (
                      <th
                        key={opt}
                        className="border-b border-r border-gray-300 p-3 text-center w-16"
                      >
                        {opt} pts
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {behaviorRules.map((rule, index) => (
                    <tr
                      key={rule.id}
                      className={`border-b border-gray-300 ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-gray-100`}
                    >
                      <td className="border-r border-gray-300 p-3 font-semibold">
                        {rule.label}
                      </td>
                      {rule.options.map((opt) => (
                        <td
                          key={opt}
                          className="border-r border-gray-300 p-3 text-center"
                        >
                          <input
                            type="radio"
                            name={`rule-${rule.id}`}
                            value={opt}
                            checked={selectedBehaviors[rule.id] === opt}
                            onChange={(e) =>
                              handleRadioChange(rule.id, parseInt(e.target.value))
                            }
                            className="form-radio h-4 w-4 text-teal-600"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-3 bg-yellow-50 text-sm italic border-t border-yellow-200">
                ➢ ማሳሰቢያ ከዚህ በላይ የተመለከቱት ቁጥሮች እያንዳንዳቸው መሥፈርት የሚሆኑ ማጣሪያ ነጥቦች ግን 75 ሲሆን ነው፡፡
              </div>
            </div>
          
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-teal-700">Committee Signature</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">የአመክሮ ኮሚቴ ስም</label>
                  <input 
                    type="text" 
                    name="committeeName" 
                    onChange={handleChange} 
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter committee name"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">ፌርማ</label>
                  <input 
                    type="file" 
                    name="signature"  
                    onChange={(e) => setSignature(e.target.files[0])}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0 file:text-sm file:font-semibold
                    file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  />
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 shadow-md"
              >
                Submit Behavior Log
              </button>
            </div>
          </form>

          {paroleScore !== null && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md text-center">
              <h3 className="text-xl font-semibold">
                Parole Eligibility: {paroleScore}%
              </h3>
              {paroleScore >= 75 ? (
                <p className="text-green-600 font-bold">Eligible for Parole</p>
              ) : (
                <p className="text-red-600 font-bold">Not Eligible for Parole</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-600 p-10">Inmate not found.</div>
      )}
    </div>
  );
};

export default InmateBehavior;
