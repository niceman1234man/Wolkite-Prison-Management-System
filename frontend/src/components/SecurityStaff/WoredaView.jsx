import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TiArrowBack } from "react-icons/ti";

const WoredaView = ({ id }) => {
  // const { id } = useParams();
  const [inmateData, setInmateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [transferRequest, setTransferRequest] = useState(null);

  useEffect(() => {
    const fetchInmateDetails = async () => {
      try {
        const response = await axiosInstance.get(
          `/transfer/get-transfer/${id}`
        );
        setInmateData(response.data.transfer);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching inmate details:", error);
        toast.error("Failed to load inmate details.");
        setLoading(false);
      }
    };

    fetchInmateDetails();
  }, [id]);

  const fetchTransferRequest = async () => {
    try {
      const response = await axiosInstance.get(`/api/transfer/request/${id}`);
      if (response.data?.success) {
        setTransferRequest(response.data.transfer);
      }
    } catch (error) {
      console.error("Error fetching transfer request:", error);
      toast.error("Failed to fetch transfer request details");
    }
  };

  useEffect(() => {
    fetchTransferRequest();
  }, [id]);

  const handleAddToInmate = () => {
    const initialData = {
      fullName: `${inmateData.firstName} ${inmateData.middleName} ${inmateData.lastName}`,
      age: inmateData.age,
      birthDate: inmateData.dateOfBirth,
      gender: inmateData.gender,
      releaseReason: inmateData.reason,
      // Add other fields as needed
    };
    navigate("/securityStaff-dashboard/add-inmate", { state: { initialData } });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!inmateData) {
    return <div>No data available</div>;
  }
  return (
    <div className="max-w-5xl mx-auto mt-10 bg-white p-8 rounded-md shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-center">
        Inmate from Woreda Details
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h3 className="text-xl font-semibold">Full Name:</h3>
          <p>
            {inmateData.firstName} {inmateData.middleName} {inmateData.lastName}
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">Age:</h3>
          <p>{inmateData.age}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">Birth Date:</h3>
          <p>{new Date(inmateData.dateOfBirth).toLocaleDateString()}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">Crime:</h3>
          <p>{inmateData.crime}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">Gender:</h3>
          <p>{inmateData.gender}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">sentence Start:</h3>
          <p>{new Date(inmateData.sentenceStartnew).toLocaleDateString()}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">sentence End:</h3>
          <p>{new Date(inmateData.sentenceEnd).toLocaleDateString()}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">from Prison:</h3>
          <p>{inmateData.fromPrison}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">to Prison:</h3>
          <p>{inmateData.toPrison}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold"> reason:</h3>
          <p>{inmateData.reason}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">status:</h3>
          <p>{inmateData.status}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">transfer Date:</h3>
          <p>{new Date(inmateData.transferDate).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="mt-6">
        <button
          onClick={handleAddToInmate}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded mr-4"
        >
          Add to Inmate
        </button>
      </div>
      {transferRequest && (
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Transfer Request Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Transfer Information</h3>
              <div className="space-y-2">
                <p>
                  <span className="text-gray-600">From Prison:</span>{" "}
                  {transferRequest.fromPrison}
                </p>
                <p>
                  <span className="text-gray-600">To Prison:</span>{" "}
                  {transferRequest.toPrison}
                </p>
                <p>
                  <span className="text-gray-600">Transfer Reason:</span>{" "}
                  {transferRequest.reason}
                </p>
                <p>
                  <span className="text-gray-600">Request Date:</span>{" "}
                  {new Date(
                    transferRequest.transferRequest.requestDate
                  ).toLocaleString()}
                </p>
                <p>
                  <span className="text-gray-600">Status:</span>{" "}
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${
                      transferRequest.transferRequest.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : transferRequest.transferRequest.status === "Accepted"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {transferRequest.transferRequest.status}
                  </span>
                </p>
              </div>
            </div>
            {transferRequest.transferRequest.securityStaffReview.status ===
              "Rejected" && (
              <div>
                <h3 className="font-semibold mb-2">Rejection Details</h3>
                <div className="space-y-2">
                  <p>
                    <span className="text-gray-600">Rejection Reason:</span>{" "}
                    {
                      transferRequest.transferRequest.securityStaffReview
                        .rejectionReason
                    }
                  </p>
                  <p>
                    <span className="text-gray-600">Review Date:</span>{" "}
                    {new Date(
                      transferRequest.transferRequest.securityStaffReview.reviewDate
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WoredaView;
