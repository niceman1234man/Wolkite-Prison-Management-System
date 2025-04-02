import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import { useSelector } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";

const PostNotice = ({setOpen}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roles, setRoles] = useState([]);
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [isPosted, setIsPosted] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  const roleOptions = ["Visitor", "Police Officer", "Security Staff", "Admin", "Court"];
  const priorityOptions = ["Low", "Normal", "High", "Urgent"];

  // Function to determine target audience based on selected roles
  const determineTargetAudience = (selectedRoles) => {
    if (selectedRoles.length === 0) return "all";
    
    // If only one role is selected, map it to the corresponding audience
    if (selectedRoles.length === 1) {
      const role = selectedRoles[0];
      if (role === "Visitor") return "visitors";
      if (role === "Police Officer") return "staff";
      if (role === "Security Staff") return "security";
      if (role === "Admin") return "admin";
      if (role === "Court") return "court";
    }
    
    // If all roles are selected, target all
    if (selectedRoles.length === roleOptions.length) return "all";
    
    // If multiple but not all roles are selected, determine best match
    // For now default to "all" for mixed selections
    return "all";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !date || roles.length === 0) {
      toast.error("Please fill in all fields and select at least one role.");
      return;
    }
    
    setLoading(true);
    try {
      // Determine target audience based on selected roles
      const targetAudience = determineTargetAudience(roles);
      
      // Format data to match backend expectations
      const noticeData = {
        title,
        description,
        date,
        priority,
        roles,
        isPosted,
        targetAudience
      };
      
      console.log("Submitting notice with data:", noticeData);
      
      const response = await axiosInstance.post("/notice/add-notice", noticeData);
      console.log("API Response:", response.data);
      
      if (response.data && response.data.success) {
        toast.success("Notice created successfully!");
        
        // If the notice was set to be posted immediately, show a special message
        if (isPosted) {
          toast.success("Notice published and is now visible to users!");
        }
        
        if (setOpen) {
          setOpen(false);
        }
        
        // Reset form
        setTitle("");
        setDescription("");
        setDate("");
        setPriority("Normal");
        setRoles([]);
        setIsPosted(false);
        
        // Navigate back to notices list if not in a modal
        if (!setOpen) {
          navigate("/Inspector-dashboard/notices");
        }
      } else {
        throw new Error(response.data?.message || "Failed to create notice");
      }
    } catch (error) {
      console.error("Error creating notice:", error);
      toast.error(error.response?.data?.message || "Failed to create notice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full flex flex-col transition-all mt-12 duration-300 }`}>
      <div
        className={`bg-white shadow-md p-4 fixed top-14 z-20 transition-all duration-300 ml-2 ${isCollapsed ? "left-10 w-[calc(100%-5rem)]" : "left-40 w-[calc(100%-17rem)]"}`}
      >
        <div className="flex items-center justify-between">
          
          <h3 className="text-2xl font-bold text-gray-800 text-center flex-1">Post a Notice</h3>
          <div className="w-24" />
        </div>
      </div>

      <div className="flex justify-center items-center min-h-screen p-6 mt-20">
        <div className="max-w-lg w-full bg-white p-8 shadow-lg rounded-md">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Notice Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                rows="4"
                required
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
              >
                {priorityOptions.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Mark as Posted</label>
              <div className="flex items-center mt-1">
                <input
                  type="checkbox"
                  checked={isPosted}
                  onChange={() => setIsPosted(!isPosted)}
                  className="mr-2 h-4 w-4"
                />
                <span>{isPosted ? "Yes - This notice will be visible immediately" : "No - Save as draft"}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Select Target Audience</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
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
                      className="h-4 w-4"
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Depending on which roles you select, the notice will be shown in the appropriate dashboards.
              </p>
              {roles.length === 0 && <p className="text-xs text-red-500 mt-1">Please select at least one role</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Notice"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostNotice;
