import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import { TiArrowBack } from "react-icons/ti";
import ConfirmModal from "../Modals/ConfirmModal";

const ViewInmate = ({id}) => {
  const [inmateData, setInmateData] = useState(null);
  const [loading, setLoading] = useState(true);
   const [openDelete, setOpenDelete] = useState(false);
  const navigate = useNavigate();

  // Function to calculate parole date
  const calculateParoleDate = (startDate, sentenceYear) => {
    if (!startDate || !sentenceYear) return null;
    
    const start = new Date(startDate);
    const twoThirdsYears = (parseFloat(sentenceYear) * 2) / 3;
    
    // Split the two-thirds years into full years and months
    const fullYears = Math.floor(twoThirdsYears);
    const fractionalYear = twoThirdsYears - fullYears;
    const months = Math.round(fractionalYear * 12);
    
    // Add full years and months to the start date
    start.setFullYear(start.getFullYear() + fullYears);
    start.setMonth(start.getMonth() + months);
    
    return start.toISOString().split('T')[0];
  };

  // Function to calculate duration between two dates in years and months
  const calculateDuration = (date1, date2) => {
    if (!date1 || !date2) return null;
    
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // Calculate years
    let years = d2.getFullYear() - d1.getFullYear();
    let months = d2.getMonth() - d1.getMonth();
    
    // Adjust for negative months
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // If months is 0, just return years
    if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    
    return `${years} year${years !== 1 ? 's' : ''} and ${months} month${months !== 1 ? 's' : ''}`;
  };

  // Add this helper function at the top of your component
  const formatToLocalDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString();
  };

  useEffect(() => {
    const fetchInmateDetails = async () => {
      try {
        const response = await axiosInstance.get(`/inmates/get-inmate/${id}`);
        setInmateData(response.data.inmate);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching inmate details:", error);
        toast.error("Failed to load inmate details.");
        setLoading(false);
      }
    };

    fetchInmateDetails();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>; 
  }

  if (!inmateData) {
    return <div className="flex justify-center items-center h-screen">No data available</div>;
  }

   const handleDelete = async (id) => {
      try {
        const response = await axiosInstance.delete(
        `/inmate/delete-inmate/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
  
        if (response.data) {
          toast.success("Inmate record deleted successfully.");
        setOpenDelete(false);
          navigate("/securityStaff-dashboard/inmates");
        } else {
          toast.error("Failed to delete the inmate record.");
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error(error.response?.data?.error || "Error deleting the inmate record.");
      }
    };
  
  // Calculate dates and durations
  const paroleDate = calculateParoleDate(inmateData.startDate, inmateData.sentenceYear);
  const durationToParole = calculateDuration(inmateData.startDate, paroleDate);
  const durationFromParoleToEnd = calculateDuration(paroleDate, inmateData.releasedDate);

  return (
    <div className="max-w-5xl mx-auto mt-10 bg-white p-8 rounded-md shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Inmate Details</h2>
        <button
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => setOpenDelete(true)}
        >
          Delete
        </button>
      </div>

      {/* Personal Information Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4 border-b pb-2">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Full Name</h4>
            <p className="text-gray-900">{inmateData.firstName} {inmateData.middleName} {inmateData.lastName}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Age</h4>
            <p className="text-gray-900">{inmateData.age}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Birth Date</h4>
            <p className="text-gray-900">{formatToLocalDate(inmateData.birthDate)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Mother's Name</h4>
            <p className="text-gray-900">{inmateData.motherName}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Gender</h4>
            <p className="text-gray-900">{inmateData.gender}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Marital Status</h4>
            <p className="text-gray-900">{inmateData.maritalStatus}</p>
          </div>
        </div>
      </div>

      {/* Location Information Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4 border-b pb-2">Location Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <h4 className="text-xl font-medium mb-3">Birth Place</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-700">Region</h5>
                <p className="text-gray-900">{inmateData.birthRegion}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-700">Zone</h5>
                <p className="text-gray-900">{inmateData.birthZone}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-700">Wereda</h5>
                <p className="text-gray-900">{inmateData.birthWereda}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-700">Kebele</h5>
                <p className="text-gray-900">{inmateData.birthKebele}</p>
              </div>
            </div>
        </div>
        <div>
            <h4 className="text-xl font-medium mb-3">Current Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-700">Region</h5>
                <p className="text-gray-900">{inmateData.currentRegion}</p>
        </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-700">Zone</h5>
                <p className="text-gray-900">{inmateData.currentZone}</p>
        </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-700">Wereda</h5>
                <p className="text-gray-900">{inmateData.currentWereda}</p>
        </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-700">Kebele</h5>
                <p className="text-gray-900">{inmateData.currentKebele}</p>
        </div>
        </div>
        </div>
        </div>
        </div>

      {/* Physical Characteristics Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4 border-b pb-2">Physical Characteristics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Height</h4>
            <p className="text-gray-900">{inmateData.height} cm</p>
        </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Hair Type</h4>
            <p className="text-gray-900">{inmateData.hairType}</p>
        </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Face</h4>
            <p className="text-gray-900">{inmateData.face}</p>
        </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Eye Color</h4>
            <p className="text-gray-900">{inmateData.eyeColor}</p>
        </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Special Symbol</h4>
            <p className="text-gray-900">{inmateData.specialSymbol}</p>
        </div>
        </div>
        </div>

      {/* Contact Information Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4 border-b pb-2">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Contact Name</h4>
            <p className="text-gray-900">{inmateData.contactName}</p>
        </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Phone Number</h4>
            <p className="text-gray-900">{inmateData.phoneNumber}</p>
        </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Contact Region</h4>
            <p className="text-gray-900">{inmateData.contactRegion}</p>
        </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Contact Zone</h4>
            <p className="text-gray-900">{inmateData.contactZone}</p>
        </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Contact Wereda</h4>
            <p className="text-gray-900">{inmateData.contactWereda}</p>
        </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Contact Kebele</h4>
            <p className="text-gray-900">{inmateData.contactKebele}</p>
        </div>
        </div>
        </div>

      {/* Case Information Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4 border-b pb-2">Case Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Case Type</h4>
            <p className="text-gray-900">{inmateData.caseType}</p>
        </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Sentence Year</h4>
            <p className="text-gray-900">{inmateData.sentenceYear} years</p>
        </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Start Date</h4>
            <p className="text-gray-900">{formatToLocalDate(inmateData.startDate)}</p>
        </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Parole Date (2/3 of sentence)</h4>
            <p className="text-gray-900">{formatToLocalDate(paroleDate) || 'Not available'}</p>
        </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Duration Until Parole</h4>
            <p className="text-gray-900">{durationToParole || 'Not available'}</p>
        </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Duration From Parole to Release</h4>
            <p className="text-gray-900">{durationFromParoleToEnd || 'Not available'}</p>
        </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Released Date</h4>
            <p className="text-gray-900">{formatToLocalDate(inmateData.releasedDate) || 'Not released'}</p>
        </div>
          <div className="bg-gray-50 p-4 rounded-lg md:col-span-2 lg:col-span-3">
            <h4 className="text-lg font-medium text-gray-700">Sentence Reason</h4>
            <p className="text-gray-900">{inmateData.sentenceReason}</p>
        </div>
        </div>
        </div>

      {/* Registrar Information Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4 border-b pb-2">Registrar Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700">Registrar Worker Name</h4>
            <p className="text-gray-900">{inmateData.registrarWorkerName}</p>
        </div>
          {inmateData.signature && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-700">Signature</h4>
              <img src={inmateData.signature} alt="Registrar Signature" className="max-h-20" />
        </div>
          )}
        </div>
      </div>

        <ConfirmModal
                    open={openDelete}
                    setOpen={setOpenDelete}
                    onDelete={() => handleDelete(id)}
                    message="Do you really want to delete this Inmate? This action cannot be undone."
                  />
    </div>
  );
};

export default ViewInmate;


