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
   const [signature1, setSignature1] = useState(null);
   const [signature2, setSignature2] = useState(null);
   const [signature3, setSignature3] = useState(null);
   const [signature4, setSignature4] = useState(null);
   const [signature5, setSignature5] = useState(null);
   const [formdata,setFormData]=useState({
    committeeName1:"",
    committeeName2:"",
    committeeName3:"",
    committeeName4:"",
    committeeName5:""
   

   })
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
      console.log(response.data.inmate)
      if (response.data?.inmate) {
        const inmate = response.data.inmate;
        setInmateDetails({
          _id: inmate._id,
          inmate_name:inmate.firstName +" "+ inmate.middleName+" "+inmate.lastName   || "N/A",
          age: inmate.age || "N/A",
          sentenceYear:inmate.sentenceYear,
          gender: inmate.gender || "N/A",
          sentence: inmate.caseType || "N/A", 
          releaseDate:inmate.releasedDate|| "N/A",
          startDate:inmate.startDate|| "N/A",
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
  console.log(inmateDetails);

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

    // Extract all dates from behavior logs
    const dates = behaviorLogs.map((log) => new Date(log.date).toDateString());

    // Remove duplicate dates to get the unique tracked days
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
  
      // Prepare committee names
      const committeeNames = [
        formdata.committeeName1,
        formdata.committeeName2,
        formdata.committeeName3,
        formdata.committeeName4,
        formdata.committeeName5,
      ];
      console.log(typeof committeeNames)
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
      formData.append('committeeNames', JSON.stringify(committeeNames));
      
      // Append signature files if they exist
      if (signature1) formData.append('signature1', signature1);
      if (signature2) formData.append('signature2', signature2);
      if (signature3) formData.append('signature3', signature3);
      if (signature4) formData.append('signature4', signature4);
      if (signature5) formData.append('signature5', signature5);
  
      // Send data to the backend
      const response = await axiosInstance.post(`/parole-tracking/add/${inmateDetails._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    
      if (response.status === 201) {
        alert("Behavior log submitted successfully!");
        navigate("/policeOfficer-dashboard/status/");
      } else {
        alert("Failed to submit behavior log.");
      }
    } catch (error) {
      console.error("Error submitting behavior log:", error);
      alert("Error submitting behavior log. Please try again.");
    }
  };

  return (
    <div
      className={`max-w-4xl mx-auto mt-10 bg-white p-8 pt-3 rounded-md shadow-md ${
        isCollapsed ? "ml-16" : "ml-64"
      }`}
    >
      <h2 className="text-2xl font-bold mb-6 text-center">
        Inmate Behavior Tracking
      </h2>

      {loadingInmates ? (
        <div className="text-center text-gray-600">
          Loading inmate details...
        </div>
      ) : inmateDetails ? (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4 text-center">
            Inmate Details
          </h3>
          <div className="flex flex-wrap sm:space-x-8 text-center">
            <div className="flex-1 mb-4 sm:mb-0">
              <p>
                <strong>የህግ ታራሚው ስም:</strong> {inmateDetails.inmate_name}
              </p>
              <p>
                <strong>Age:</strong> {inmateDetails.age}
              </p>
            </div>
            <div className="flex-1 mb-4 sm:mb-0">
              <p>
                <strong>Gender:</strong> {inmateDetails.gender}
              </p>
              <p>
                <strong>Sentence:</strong> {inmateDetails.sentence} 
              </p>
              
              <p>
                <strong>Start Date:</strong> {formatToLocalDate(inmateDetails.startDate)}
              </p>
              <p>
                <strong>Released Date:</strong> {formatToLocalDate(inmateDetails.releaseDate)}
              </p>
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Parole Information</h3>
            <p><strong>Parole Date:</strong> {formatToLocalDate(inmateDetails.paroleDate)}</p>
            <p><strong>Duration Until Parole:</strong> {inmateDetails.durationToParole}</p>
            <p><strong>Duration From Parole to Release:</strong> {inmateDetails.durationFromParoleToEnd}</p>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-600">Inmate not found.</div>
      )}

      {/* Display tracked days */}
      <div className="text-center text-lg font-semibold mt-4">
        <p>
          <strong>Tracked Days:</strong> {trackedDays}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-auto border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-3 text-left">Rule</th>
                {behaviorRules[0].options.map((opt) => (
                  <th
                    key={opt}
                    className="border border-gray-300 p-3 text-center"
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
                  className={`border border-gray-300 ${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <td className="border border-gray-300 p-3 font-semibold">
                    {rule.label}
                  </td>
                  {rule.options.map((opt) => (
                    <td
                      key={opt}
                      className="border border-gray-300 p-3 text-center"
                    >
                      <input
                        type="radio"
                        name={`rule-${rule.id}`}
                        value={opt}
                        checked={selectedBehaviors[rule.id] === opt}
                        onChange={(e) =>
                          handleRadioChange(rule.id, parseInt(e.target.value))
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            ➢ ማሳሰቢያ ከዚህ በላይ የተመለከቱት ቁጥሮች እያንዳንዳቸው መሥፈርት የሚሆኑ ማጣሪያ ነጥቦች ግን 75 ሲሆን
            ነው፡፡
          </table>
        </div>
       
        
          <div className="grid grid-cols-2 gap-5 mt-4">
          <p>የአመክሮ ኮሚቴ ስም</p> <p> ፌርማ</p>
          <input type="text" name="committeeName1" onChange={handleChange} className="border mb-3 p-2"/>
          <input type="file" name="signature1"  onChange={(e)=>setSignature1(e.target.files[0])}/>
          <input type="text"  name="committeeName2"  onChange={handleChange} className="border mb-3 p-2"/>
          <input type="file" name="signature2"  onChange={(e)=>setSignature2(e.target.files[0])} />
          <input type="text"  name="committeeName3"  onChange={handleChange} className="border mb-3 p-2" />
          <input type="file" name="signature3"  onChange={(e)=>setSignature3(e.target.files[0])} />
          <input type="text"  name="committeeName4"  onChange={handleChange} className="border mb-3 p-2"/>
          <input type="file" name="signature4"  onChange={(e)=>setSignature4(e.target.files[0])} />
          <input type="text"  name="committeeName5"  onChange={handleChange} className="border mb-3 p-2"/>
          <input type="file" name="signature5"  onChange={(e)=>setSignature5(e.target.files[0])} />
          </div>
        
        <button
          type="submit"
          className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
        >
          Submit Behavior Log
        </button>
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
  );
};

export default InmateBehavior;
