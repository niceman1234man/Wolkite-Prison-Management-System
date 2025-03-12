import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UpdateNotice = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roles, setRoles] = useState([]);
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState("Normal");
  const navigate=useNavigate();
  const { id } = useParams();

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
        console.error("Error fetching notice details:", error);
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
      console.error("Error:", error);
      alert("Failed to update notice.");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-20 p-6 bg-white shadow-md rounded-md">
      <h2 className="font-bold mb-6 text-center text-2xl">Update Notice</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Notice Title"
          className="w-full p-2 mb-4 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="Notice Description"
          className="w-full p-2 mb-4 border rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <input
          type="date"
          className="w-full p-2 mb-4 border rounded"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <select
          className="w-full p-2 mb-4 border rounded"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          {priorityOptions.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>

        <label className="block font-bold text-2xl mb-10 text-center">Select Roles:</label>
        <div className="grid grid-cols-2 gap-2 text-center mx-auto">
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

        <button
          type="submit"
          className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded"
        >
          Update Notice
        </button>
      </form>
    </div>
  );
};

export default UpdateNotice;
