import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useSelector } from "react-redux";
import { FaArrowLeft, FaSearch, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-hot-toast";

const InspectorHomepageSettings = () => {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  const fetchMessages = async () => {
    try {
      const response = await axiosInstance.get("/managemessages/get-messages");
      if (response.data && response.data.messages) {
        setMessages(response.data.messages);
        setFilteredMessages(response.data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to fetch messages");
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    const filtered = messages.filter((msg) =>
      msg.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMessages(filtered);
  }, [searchQuery, messages]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const addMessage = async () => {
    if (!newMessage.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    const formData = new FormData();
    formData.append("text", newMessage);
    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    try {
      await axiosInstance.post("/managemessages/add-messages", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setNewMessage("");
      setSelectedImage(null);
      setPreviewImage(null);
      setIsAddModalOpen(false);
      fetchMessages();
      toast.success("Message added successfully");
    } catch (error) {
      console.error("Error adding message:", error);
      toast.error("Failed to add message");
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    try {
      await axiosInstance.delete(`/managemessages/delete-messages/${id}`);
      fetchMessages();
      toast.success("Message deleted successfully");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  const updateMessage = async (id) => {
    if (!editingText.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    const formData = new FormData();
    formData.append("text", editingText);
    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    try {
      await axiosInstance.put(`/managemessages/update-messages/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setEditingMessageId(null);
      setEditingText("");
      setSelectedImage(null);
      setPreviewImage(null);
      fetchMessages();
      toast.success("Message updated successfully");
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Failed to update message");
    }
  };

  const startEditing = (id, text, image) => {
    setEditingMessageId(id);
    setEditingText(text);
    if (image) {
      setPreviewImage(image);
    }
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText("");
    setSelectedImage(null);
    setPreviewImage(null);
  };

  return (
    <div className="p-5 transition-all duration-300">
      {/* Header Section */}
      <div
        className={`bg-white shadow-md p-4 fixed top-14 z-20 flex flex-wrap items-center justify-between transition-all duration-300 ml-2 gap-2 ${
          isCollapsed ? "left-16 w-[calc(100%-5rem)]" : "left-64 w-[calc(100%-17rem)]"
        }`}
      >
        <button
          className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 mr-6 py-2 rounded-lg shadow-md transition duration-300"
          onClick={() => window.history.back()}
        >
          <FaArrowLeft className="mr-2 text-lg" /> Back
        </button>
        <h3 className="text-2xl font-bold text-gray-800 hidden text-center sm:block">
          Manage Homepage Messages
        </h3>

        <div className="flex-1" />
        <div className="relative flex items-center w-60 md:w-1/3">
          <FaSearch className="absolute left-3 text-gray-500" />
          <input
            type="text"
            placeholder="Search messages"
            className="h-10 px-4 py-2 border border-gray-300 rounded-md w-1/3 md:w-full pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="h-10 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center justify-center min-w-[150px] md:w-auto"
        >
          Add New Message
        </button>
      </div>

      {/* Main Content */}
      <div className={`mt-32 transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-64"}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMessages.map((msg) => (
            <div key={msg._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {msg.image && (
                <img
                  src={msg.image}
                  alt="Message"
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                {editingMessageId === msg._id ? (
                  <div className="space-y-4">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                      rows="3"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                    {previewImage && (
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded"
                      />
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateMessage(msg._id)}
                        className="bg-green-600 text-white px-4 py-2 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="bg-gray-500 text-white px-4 py-2 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-800 mb-4">{msg.text}</p>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEditing(msg._id, msg.text, msg.image)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEdit className="text-xl" />
                      </button>
                      <button
                        onClick={() => deleteMessage(msg._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash className="text-xl" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Message Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Message</h2>
            <textarea
              placeholder="Enter new message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              rows="4"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-40 object-cover rounded mb-4"
              />
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewMessage("");
                  setSelectedImage(null);
                  setPreviewImage(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={addMessage}
                className="bg-teal-600 text-white px-4 py-2 rounded"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectorHomepageSettings;