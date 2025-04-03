import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from 'react-toastify'; // Import toast
import 'react-toastify/dist/ReactToastify.css'; // Import toast CS
import { TiArrowBack } from "react-icons/ti";
import { CloudCog } from "lucide-react";

const UpdateInmate = ({setOpen,id}) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    birthDate: "",
    age: "",
    motherName: "",
    gender: "",
    birthRegion: "",
    birthZone: "",
    birthWereda: "",
    birthKebele: "",
    currentRegion: "",
    currentZone: "",
    currentWereda: "",
    currentKebele: "",
    degreeLevel: "",
    work: "",
    nationality: "",
    religion: "",
    maritalStatus: "",
    height: "",
    hairType: "",
    face: "",
    foreHead: "",
    nose: "",
    eyeColor: "",
    teeth: "",
    lip: "",
    ear: "",
    specialSymbol: "",
    contactName: "",
    contactRegion: "",
    contactZone: "",
    contactWereda: "",
    contactKebele: "",
    phoneNumber: "",
    registrarWorkerName: "",
    caseType: "",
    startDate: "",
    sentenceYear: "",
    releaseReason: "",
    releasedDate: ""
  });

  // Separate state for file uploads
  const [signature, setSignature] = useState(null);

  // Fetch the inmate details to populate the form
  useEffect(() => {
    const fetchInmateData = async () => {
      try {
        const response = await axiosInstance.get(`/inmates/get-inmate/${id}`);
        const inmateData = response.data.inmate;
        
        if (!inmateData) {
          toast.error("No inmate data found.");
          return;
        }

        // Format dates with null checks
        const formattedBirthDate = inmateData.birthDate ? inmateData.birthDate.split('T')[0] : '';
        const formattedStartDate = inmateData.startDate ? inmateData.startDate.split('T')[0] : '';
        const formattedReleasedDate = inmateData.releasedDate ? inmateData.releasedDate.split('T')[0] : '';

        setFormData({
          ...inmateData,
          birthDate: formattedBirthDate,
          startDate: formattedStartDate,
          releasedDate: formattedReleasedDate
        });
      } catch (error) {
        console.error("Error fetching inmate data:", error);
        toast.error("Failed to fetch inmate data.");
      }
    };
    fetchInmateData();
  }, [id]);

  // Handle changes for both text and file inputs
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "signature") {
      setSignature(files[0]);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  // Handle form submission with multipart/form-data
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    
    // Add all form data directly without combining names
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });
    
    if (signature) {
      data.append("signature", signature);
    }

    try {
      const response = await axiosInstance.put(
        `/inmates/update-inmate/${id}`,
        data,
      );

      if (response.data) {
        navigate("/securityStaff-dashboard/inmates");
        setOpen(false);
        toast.success("Inmate updated successfully!");
      } else {
        toast.error("Failed to update inmate.");
      }
    } catch (error) {
      console.error("Error updating inmate:", error);
      toast.error(error.response?.data?.error || "An error occurred while updating the inmate.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Update Inmate</h2>
        <button
          onClick={() => navigate("/securityStaff-dashboard/inmates")}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <TiArrowBack className="mr-2" />
          Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                placeholder="Enter First Name"
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                placeholder="Enter Middle name"
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
                name="lastName"
                value={formData.lastName}
                placeholder="Enter Last name"
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              placeholder="Enter age"
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                readOnly
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
            <input
              type="text"
              name="motherName"
              value={formData.motherName}
              placeholder="Enter mother's name"
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            </div>
          </div>
        </div>

        {/* Location Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Location Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-medium mb-4 text-gray-700">Birth Place</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
              <input
                type="text"
                name="birthRegion"
                value={formData.birthRegion}
                placeholder="Enter birth region"
                onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
              <input
                type="text"
                name="birthZone"
                value={formData.birthZone}
                placeholder="Enter birth zone"
                onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wereda</label>
              <input
                type="text"
                name="birthWereda"
                value={formData.birthWereda}
                placeholder="Enter birth wereda"
                onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kebele</label>
              <input
                type="text"
                name="birthKebele"
                value={formData.birthKebele}
                placeholder="Enter birth kebele"
                onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
        </div>
            <div>
              <h4 className="text-xl font-medium mb-4 text-gray-700">Current Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
              <input
                type="text"
                name="currentRegion"
                value={formData.currentRegion}
                placeholder="Enter current region"
                onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
              <input
                type="text"
                name="currentZone"
                value={formData.currentZone}
                placeholder="Enter current zone"
                onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wereda</label>
              <input
                type="text"
                name="currentWereda"
                value={formData.currentWereda}
                placeholder="Enter current wereda"
                onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kebele</label>
              <input
                type="text"
                name="currentKebele"
                value={formData.currentKebele}
                placeholder="Enter current kebele"
                onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
        </div>
          </div>
        </div>

        {/* Physical Characteristics Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Physical Characteristics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
            <input
              type="number"
              name="height"
              value={formData.height}
              placeholder="Enter height"
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hair Type</label>
            <input
              type="text"
              name="hairType"
              value={formData.hairType}
              placeholder="Enter hair type"
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Face</label>
            <input
              type="text"
              name="face"
              value={formData.face}
              placeholder="Describe face features"
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Forehead</label>
            <input
              type="text"
              name="foreHead"
              value={formData.foreHead}
              placeholder="Describe forehead"
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nose</label>
            <input
              type="text"
              name="nose"
              value={formData.nose}
              placeholder="Describe nose"
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eye Color</label>
            <input
              type="text"
              name="eyeColor"
              value={formData.eyeColor}
              placeholder="Enter eye color"
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teeth</label>
            <input
              type="text"
              name="teeth"
              value={formData.teeth}
              placeholder="Describe teeth"
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lip</label>
            <input
              type="text"
              name="lip"
              value={formData.lip}
              placeholder="Describe lip"
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ear</label>
            <input
              type="text"
              name="ear"
              value={formData.ear}
              placeholder="Describe ear"
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Symbol</label>
            <input
              type="text"
              name="specialSymbol"
              value={formData.specialSymbol}
              placeholder="Enter special symbol"
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                placeholder="Enter contact name"
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Region</label>
              <input
                type="text"
                name="contactRegion"
                value={formData.contactRegion}
                placeholder="Enter contact region"
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Zone</label>
              <input
                type="text"
                name="contactZone"
                value={formData.contactZone}
                placeholder="Enter contact zone"
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Wereda</label>
              <input
                type="text"
                name="contactWereda"
                value={formData.contactWereda}
                placeholder="Enter contact wereda"
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Kebele</label>
              <input
                type="text"
                name="contactKebele"
                value={formData.contactKebele}
                placeholder="Enter contact kebele"
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                placeholder="Enter phone number"
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Case Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Case Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
            <input
              type="text"
              name="caseType"
              value={formData.caseType}
              placeholder="Enter case type"
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
                name="startDate"
                value={formData.startDate}
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sentence Year</label>
              <input
                type="number"
                name="sentenceYear"
                value={formData.sentenceYear}
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                step="0.5"
              />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Released Date</label>
            <input
              type="date"
              name="releasedDate"
              value={formData.releasedDate}
              onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                readOnly
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sentence Reason</label>
              <textarea
                name="sentenceReason"
                value={formData.sentenceReason}
                placeholder="Enter sentence reason"
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => navigate("/securityStaff-dashboard/inmates")}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Update Inmate
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateInmate;
