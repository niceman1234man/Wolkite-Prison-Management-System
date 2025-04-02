import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebar, setSidebarState } from "../../redux/sidebarSlice";
import { FaBars, FaHome, FaCalendarCheck, FaHistory, FaUserCog, FaBell } from "react-icons/fa";

const VisitorSidebar = () => {
  const dispatch = useDispatch();
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  useEffect(() => {
    const handleResize = () => {
      dispatch(setSidebarState(window.innerWidth < 768)); // Auto-collapse on small screens
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  return (
    <>
      {/* Hamburger Menu for Small Screens */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="md:hidden fixed top-4 left-4 z-[9999] p-2 bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-lg rounded"
      >
        <FaBars className="text-2xl" />
      </button>

      {/* Sidebar */}
      <div
        className={`bg-gray-800 text-white h-screen fixed left-0 top-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-64"
        } z-30 shadow-lg`}
      >
        {/* Sidebar Header */}
        <div className="bg-teal-600 h-12 flex items-center justify-center">
          {!isCollapsed && <h3 className="text-center font-bold">Wolkite Prison MS</h3>}
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="mt-4 space-y-1 px-2">
          <NavLink
            to="/visitor-dashboard"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg hover:bg-teal-600 transition-colors ${
                isActive ? "bg-teal-600" : ""
              } ${isCollapsed ? "justify-center" : "justify-start"}`
            }
            end
          >
            <FaHome className="h-6 w-6" />
            {!isCollapsed && <span className="ml-3">Dashboard</span>}
          </NavLink>

          <NavLink
            to="/visitor-dashboard/schedule-visit"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg hover:bg-teal-600 transition-colors ${
                isActive ? "bg-teal-600" : ""
              } ${isCollapsed ? "justify-center" : "justify-start"}`
            }
            end
          >
            <FaCalendarCheck className="h-6 w-6" />
            {!isCollapsed && <span className="ml-3">Schedule Visit</span>}
          </NavLink>

          <NavLink
            to="/visitor-dashboard/visit-history"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg hover:bg-teal-600 transition-colors ${
                isActive ? "bg-teal-600" : ""
              } ${isCollapsed ? "justify-center" : "justify-start"}`
            }
          >
            <FaHistory className="h-6 w-6" />
            {!isCollapsed && <span className="ml-3">Visit History</span>}
          </NavLink>

          <NavLink
            to="/visitor-dashboard/setting"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg hover:bg-teal-600 transition-colors ${
                isActive ? "bg-teal-600" : ""
              } ${isCollapsed ? "justify-center" : "justify-start"}`
            }
          >
            <FaUserCog className="h-6 w-6" />
            {!isCollapsed && <span className="ml-3">Profile Settings</span>}
          </NavLink>

          <NavLink
            to="/visitor-dashboard/notices"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg hover:bg-teal-600 transition-colors ${
                isActive ? "bg-teal-600" : ""
              } ${isCollapsed ? "justify-center" : "justify-start"}`
            }
          >
            <FaBell className="h-6 w-6" />
            {!isCollapsed && <span className="ml-3">Notices</span>}
          </NavLink>
        </nav>
      </div>
    </>
  );
};

export default VisitorSidebar;