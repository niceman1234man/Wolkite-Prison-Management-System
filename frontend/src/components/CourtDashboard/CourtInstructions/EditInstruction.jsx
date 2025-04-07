import React, { useState, useEffect } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FiEdit, FiFile, FiFileText, FiCalendar, FiCheckCircle, FiUpload, FiArrowLeft, FiSave } from "react-icons/fi";

const EditInstruction = ({ setOpen, id }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    courtCaseNumber: "",
    judgeName: "",
    prisonName: "",
    verdict: "",
    instructions: "",
    hearingDate: new Date().toISOString().substring(0, 10),
    effectiveDate: new Date().toISOString().substring(0, 10),
    sendDate: new Date().toISOString().substring(0, 10),
  });

  const [signature, setSignature] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState({});

  // Fetch existing instruction data
  useEffect(() => {
    if (!id) return;

    const fetchInstruction = async () => {
      try {
        const response = await axiosInstance.get(`/instruction/get-instruct/${id}`);
        if (response.data?.instruction) {
          const instructionData = response.data.instruction;
          setOriginalData(instructionData);
          
          setFormData({
            courtCaseNumber: instructionData.courtCaseNumber || "",
            judgeName: instructionData.judgeName || "",
            prisonName: instructionData.prisonName || "",
            verdict: instructionData.verdict || "",
            instructions: instructionData.instructions || "",
            hearingDate: instructionData.hearingDate ? instructionData.hearingDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
            effectiveDate: instructionData.effectiveDate ? instructionData.effectiveDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
            sendDate: instructionData.sendDate ? instructionData.sendDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
          });
          
          // Set previews for existing files
          if (instructionData.signature) {
            setSignaturePreview(`https://localhost:4000/uploads/${instructionData.signature}`);
          }
          
          if (instructionData.attachment) {
            setAttachmentPreview(`https://localhost:4000/uploads/${instructionData.attachment}`);
          }
        }
      } catch (error) {
        console.error("Error fetching instruction:", error);
        toast.error("Failed to fetch instruction details.");
      }
    };

    fetchInstruction();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === "signature") {
      setSignature(file);
      const reader = new FileReader();
      reader.onload = () => {
        setSignaturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setAttachment(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAttachmentPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("token");
      const formdata = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        formdata.append(key, value);
      });
      
      // Only append files if they've been changed
      if (signature) formdata.append("signature", signature);
      if (attachment) formdata.append("attachment", attachment);

      const response = await axiosInstance.put(`/instruction/edit/${id}`, formdata, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        toast.success("Instruction updated successfully!");
        setOpen(false);
        navigate("/court-dashboard/list");
      } else {
        toast.error("Failed to update instruction.");
      }
    } catch (error) {
      console.error("Error updating instruction:", error);
      toast.error("An error occurred while updating instruction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 w-full mx-auto bg-white shadow-lg rounded-lg border border-gray-100">
      <div className="bg-gradient-to-r from-indigo-700 to-purple-500 -mx-6 -mt-6 px-6 py-4 rounded-t-lg mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Update Court Instruction</h2>
          <button
            onClick={() => setOpen(false)}
            className="bg-white bg-opacity-20 p-2 rounded-full text-white hover:bg-opacity-30 transition-colors"
          >
            <FiArrowLeft />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Case Information Section */}
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6">
          <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center">
            <FiFileText className="mr-2" /> Case Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Court Case Number */}
            <div>
              <label htmlFor="courtCaseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Court Case Number
              </label>
              <input
                type="text"
                id="courtCaseNumber"
                name="courtCaseNumber"
                value={formData.courtCaseNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Judge Name */}
            <div>
              <label htmlFor="judgeName" className="block text-sm font-medium text-gray-700 mb-1">
                Judge Name
              </label>
              <input
                type="text"
                id="judgeName"
                name="judgeName"
                value={formData.judgeName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Prison Name */}
            <div>
              <label htmlFor="prisonName" className="block text-sm font-medium text-gray-700 mb-1">
                Prison Name
              </label>
              <input
                type="text"
                id="prisonName"
                name="prisonName"
                value={formData.prisonName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Verdict Selection */}
            <div>
              <label htmlFor="verdict" className="block text-sm font-medium text-gray-700 mb-1">
                Verdict
              </label>
            <select
                id="verdict"
              name="verdict"
              value={formData.verdict}
              onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Verdict</option>
              <option value="guilty">Guilty</option>
              <option value="not_guilty">Not Guilty</option>
            </select>
          </div>
          </div>
        </div>

        {/* Dates Section */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
            <FiCalendar className="mr-2" /> Important Dates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            {/* Hearing Date */}
            <div>
              <label htmlFor="hearingDate" className="block text-sm font-medium text-gray-700 mb-1">
                Hearing Date
              </label>
              <input
                type="date"
                id="hearingDate"
                name="hearingDate"
                value={formData.hearingDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Effective Date */}
            <div>
              <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700 mb-1">
                Effective Date
              </label>
              <input
                type="date"
                id="effectiveDate"
                name="effectiveDate"
                value={formData.effectiveDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Send Date */}
            <div>
              <label htmlFor="sendDate" className="block text-sm font-medium text-gray-700 mb-1">
                Send Date
              </label>
              <input
                type="date"
                id="sendDate"
                name="sendDate"
                value={formData.sendDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
            <FiCheckCircle className="mr-2" /> Instruction Details
          </h3>
          <div>
          <textarea
              id="instructions"
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter details regarding the verdict or instructions to the prison"
            required
            ></textarea>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-6">
          <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
            <FiFile className="mr-2" /> Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Reporter Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reporter Signature</label>
              <div className="flex items-center space-x-2">
                <label className="flex-1 cursor-pointer">
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 flex items-center justify-center">
                    <FiUpload className="mr-2" />
                    <span className="text-sm">Upload New Signature</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    name="signature"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "signature")}
                  />
                </label>
              </div>
              {signaturePreview && (
                <div className="mt-2 p-2 border border-gray-200 rounded bg-white">
                  <img src={signaturePreview} alt="Signature Preview" className="h-20 mx-auto" />
                </div>
              )}
            </div>

            {/* Attachment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
              <div className="flex items-center space-x-2">
                <label className="flex-1 cursor-pointer">
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 flex items-center justify-center">
                    <FiUpload className="mr-2" />
                    <span className="text-sm">Upload New Attachment</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    name="attachment"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, "attachment")}
                  />
                </label>
              </div>
              {attachmentPreview && (
                <div className="mt-2 p-2 border border-gray-200 rounded bg-white">
                  {attachment?.name && <div className="text-xs text-gray-500 truncate">{attachment.name}</div>}
                  {attachmentPreview.startsWith('data:image/') || attachmentPreview.includes('/uploads/') ? (
                    <img src={attachmentPreview} alt="Attachment Preview" className="h-20 mx-auto mt-1" />
                  ) : (
                    <div className="text-center text-xs text-gray-500">File attached</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mr-3 px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 transition shadow-md disabled:opacity-70 flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </>
            ) : (
              <>
                <FiSave className="mr-2" /> Save Changes
              </>
            )}
        </button>
        </div>
      </form>
    </div>
  );
};

export default EditInstruction;
