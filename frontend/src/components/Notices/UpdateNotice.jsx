import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaArrowLeft } from "react-icons/fa"; // Back Icon
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UpdateNotice = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roles, setRoles] = useState([]);
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState("Normal");
  const navigate = useNavigate();
  const { id } = useParams();
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const response = await axiosInstance.get(`/notice/get-notice/${id}`);
        const notice = response.data.notice;

        if (notice) {
          setTitle(notice.title);
          setDescription(notice.description);
          setDate(notice.date);
          setPriority(notice.priority);
          setRoles(notice.roles);
        }
      } catch (error) {
        toast.error("Failed to load notice details");
      }
    };
    fetchNotice();
  }, [id]);

  const roleOptions = ["Visitor", "Police Officer", "Security Staff", "Admin", "Court"];
  const priorityOptions = ["Low", "Normal", "High", "Urgent"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !date || roles.length === 0) {
      alert("Please fill in all fields and select at least one role.");
      return;
    }

    try {
      await axiosInstance.put(`/notice/update-notice/${id}`, {
        title,
        description,
        date,
        priority,
        roles,
      });
      toast.success("Notice updated successfully!");
      navigate("/Inspector-dashboard/notices");
    } catch (error) {
      alert("Failed to update notice.");
    }
  };

  return (
    <div className="flex">
      {/* Sidebar Spacing */}
      <div className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`} />

      {/* Main Content */}
      <div className="flex-1 relative min-h-screen">
        
        {/* Fixed Header */}
        <div
          className={`bg-white shadow-md p-4 fixed top-14 z-20 flex items-center justify-between transition-all duration-300 ml-2 ${
            isCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"
          }`}
        >
          {/* Back Button */}
          <button
            className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition duration-300"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="mr-2 text-lg" /> Back
          </button>

          {/* Centered Header */}
          <h3 className="text-2xl font-bold text-gray-800 text-center flex-1">
            Update Notice
          </h3>

          {/* Placeholder for balance */}
          <div className="w-24" />
        </div>

        {/* Push content down to prevent overlap */}
        <div className="p-6 mt-32 flex justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
            <form onSubmit={handleSubmit}>
              {/* Notice Title */}
              <input
                type="text"
                placeholder="Notice Title"
                className="w-full p-3 mb-4 border border-gray-300 rounded-lg shadow-inner focus:ring-2 focus:ring-teal-500 transition-all"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              {/* Notice Description */}
              <textarea
                placeholder="Notice Description"
                className="w-full p-3 mb-4 border border-gray-300 rounded-lg shadow-inner focus:ring-2 focus:ring-teal-500 transition-all"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />

              {/* Date */}
              <input
                type="date"
                className="w-full p-3 mb-4 border border-gray-300 rounded-lg shadow-inner focus:ring-2 focus:ring-teal-500 transition-all"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />

              {/* Priority */}
              <select
                className="w-full p-3 mb-4 border border-gray-300 rounded-lg shadow-inner focus:ring-2 focus:ring-teal-500 transition-all"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {priorityOptions.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>

              {/* Roles Selection */}
              <label className="block font-bold text-lg mb-4 text-center">Select Roles:</label>
              <div className="grid grid-cols-2 gap-2">
                {roleOptions.map((role) => (
                  <label key={role} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={role}
                      checked={roles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRoles([...roles, role]);
                        } else {
                          setRoles(roles.filter((r) => r !== role));
                        }
                      }}
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all"
              >
                Update Notice
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotice;
