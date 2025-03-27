import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { getInitials } from "../getNameInitials.js";
import { FaBars, FaBell, FaDungeon } from "react-icons/fa"; // Prison Icon
import { FiSettings, FiHelpCircle, FiLogOut } from "react-icons/fi";
import { AiOutlineUser } from "react-icons/ai";
import axiosInstance from "../../utils/axiosInstance.js";
import "./Navbar.css"; // Import CSS for styling

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);
  const fullName = user ? `${user.firstName} ${user.middleName}` : "Loading...";
  const initial = user ? getInitials(fullName) : "";

  const [notices, setNotices] = useState([]);
  const [unreadNotices, setUnreadNotices] = useState([]);
  const [showNoticeDropdown, setShowNoticeDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await axiosInstance.get("/notice/getAllNotices");
        if (response.data) {
          const allNotices = response.data.notices.filter((n) => n.isPosted);
          const unread = allNotices.filter((n) => !n.isRead);

          setNotices(allNotices);
          setUnreadNotices(unread);
        }
      } catch (error) {
        console.error("Error fetching notices:", error);
      }
    };

    fetchNotices();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNoticeClick = (notice) => {
    setUnreadNotices((prev) => prev.filter((n) => n._id !== notice._id));
  };

  const onLogout = () => {
    localStorage.clear();
    navigate("/", { state: { fromLogout: true } });
  };

  return (
    <div className="navbar flex items-center justify-between px-4 py-2 bg-white shadow-md relative">
      {/* Hamburger Menu (Small Screens) */}
      <button
        className="md:hidden text-gray-700 hover:text-gray-900 transition-colors p-2 rounded-lg"
        onClick={toggleSidebar}
      >
        <FaBars size={24} />
      </button>

      {/* Prison Logo and Name */}
      <div className="flex items-center gap-2 md:pl-0 pl-12">
        <FaDungeon size={30} className="text-[#31708E] hover:text-[#27596E] transition-colors duration-300" />
        <span className="text-xl font-bold text-[#374151] hover:text-[#1F2937] transition-colors duration-300 hidden sm:inline">
          Wolkite Prison
        </span>
      </div>

      {/* Welcome Message (Hidden on Small Screens) */}
      <p className="navbar-welcome hidden md:block">{`Welcome, ${fullName}`}</p>

      {/* Right Section */}
      <div className="navbar-right flex items-center gap-4">
        {/* Notification Bell */}
        <div
          className="relative cursor-pointer"
          onClick={() => setShowNoticeDropdown(!showNoticeDropdown)}
        >
          <FaBell size={22} className="text-gray-700 hover:text-[#31708E] transition-colors duration-300" />
          {unreadNotices.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
              {unreadNotices.length}
            </span>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <div className="relative">
              {user?.photo ? (
                <img
                  src={`http://localhost:5000/uploads/${user.photo}`}
                  className="w-10 h-10 rounded-full border border-gray-300"
                  alt="User"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold">
                  {initial}
                </div>
              )}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
            <span className="text-gray-700 font-medium hidden md:inline">{fullName}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                showProfileDropdown ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {showProfileDropdown && (
            <div className="dropdown-menu profile-menu absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md p-2 z-50">
              <div className="dropdown-header border-b border-gray-200 pb-2 mb-2">
                <p className="font-semibold">{fullName}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <button 
                className="dropdown-item flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 rounded-md" 
                onClick={() => {
                  navigate("update-profile");
                  setShowProfileDropdown(false);
                }}
              >
                <AiOutlineUser /> Update Profile
              </button>
              <button 
                className="dropdown-item flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 rounded-md" 
                onClick={() => {
                  navigate("settingsPage");
                  setShowProfileDropdown(false);
                }}
              >
                <FiSettings /> Settings
              </button>
              <button 
                className="dropdown-item flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 rounded-md" 
                onClick={() => {
                  navigate("help");
                  setShowProfileDropdown(false);
                }}
              >
                <FiHelpCircle /> Help
              </button>
              <hr className="dropdown-divider my-1" />
              <button 
                className="dropdown-item flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 rounded-md text-red-500" 
                onClick={() => {
                  onLogout();
                  setShowProfileDropdown(false);
                }}
              >
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notices Dropdown */}
      {showNoticeDropdown && (
        <div className="dropdown-menu notice-menu absolute right-5 mt-2 w-64 bg-white shadow-lg rounded-md p-2">
          <div className="dropdown-header font-semibold">Unread Notices</div>
          {unreadNotices.length > 0 ? (
            unreadNotices.map((notice) => (
              <div
                key={notice._id}
                className="dropdown-item unread p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleNoticeClick(notice)}
              >
                {notice.title}
              </div>
            ))
          ) : (
            <p className="dropdown-item no-notices p-2 text-gray-600">No new notices</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Navbar;
