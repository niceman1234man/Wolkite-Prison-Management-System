import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { FiUser, FiCalendar, FiCheck, FiTarget, FiInfo, FiArrowRight } from "react-icons/fi";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
const RequestParole = () => {
  const [eligibleInmates, setEligibleInmates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  useEffect(() => {
    const fetchEligibleInmates = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('parole-tracking');
        
        // Filter inmates who have reached parole date and have points >= 75
        const filtered = response.data.parole.filter(inmate => 
          new Date(inmate.paroleDate) <= new Date() && 
          inmate.parolePoints >= 75
        );
        
        setEligibleInmates(filtered);
        setError(null);
      } catch (err) {
        console.error("Error fetching eligible inmates:", err);
        setError("Failed to fetch eligible inmates. Please try again later.");
        toast.error("Error loading eligible inmates");
      } finally {
        setLoading(false);
      }
    };

    fetchEligibleInmates();
  }, []);

  return (
    <div className={`p-6 mt-12 transition-all duration-300 ease-in-out ml-3 ${
      isCollapsed ? "pl-16" : "pl-64" // Adjust padding based on sidebar state
    }`}>
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-white">Eligible Inmates for Parole</h1>
        <p className="text-white text-opacity-90 mt-2">
          Inmates who have reached their parole date and have accumulated 75 or more parole points
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : eligibleInmates.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
          No inmates currently meet the criteria for parole eligibility.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eligibleInmates.map((inmate) => (
            <div 
              key={inmate._id} 
              className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="border-b border-gray-200 px-4 py-3 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-green-100 text-green-700 flex items-center justify-center rounded-full">
                    <FiUser size={20} />
                  </div>
                  <span className="ml-3 font-semibold text-gray-800">{inmate.firstName} {inmate.lastName}</span>
                </div>
                <div className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  ID: {inmate.inmateId}
                </div>
              </div>
              
              <div className="p-4">
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center">
                        <FiCalendar className="mr-1" size={12} />
                        Parole Date
                      </p>
                      <p className="font-medium text-gray-800">
                        {new Date(inmate.paroleDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center">
                        <FiTarget className="mr-1" size={12} />
                        Parole Points
                      </p>
                      <p className="font-medium text-gray-800">
                        <span className={`inline-block px-2 py-0.5 rounded ${
                          inmate.parolePoints >= 90 ? "bg-green-100 text-green-800" :
                          inmate.parolePoints >= 80 ? "bg-blue-100 text-blue-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {inmate.parolePoints} points
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1 flex items-center">
                    <FiInfo className="mr-1" size={12} />
                    Case Summary
                  </p>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {inmate.caseSummary || "No case summary available."}
                  </p>
                </div>

                <div className="flex justify-end mt-4">
                  <Link
                    to={`/parole/request/${inmate._id}`}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    Request Parole <FiArrowRight className="ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestParole;