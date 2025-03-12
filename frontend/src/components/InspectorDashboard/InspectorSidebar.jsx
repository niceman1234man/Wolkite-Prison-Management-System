import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebar, setSidebarState } from "../../redux/sidebarSlice";
import {
  FaBars,
  FaBuilding,
  FaExclamationCircle,
  FaTachometerAlt,
  FaUsers,
} from "react-icons/fa";

const InspectorSidebar = () => {
  const dispatch = useDispatch();
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);

  useEffect(() => {
    const handleResize = () => {
      dispatch(setSidebarState(window.innerWidth < 768));
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  return (
    <div className="w-auto">
      {/* Mobile Menu Button */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-teal-600 text-white hover:bg-teal-700 transition-colors"
      >
        <FaBars className="text-2xl" />
      </button>

      <div
        className={`bg-gray-800 text-white h-screen fixed left-0 top-0 transition-width duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-64"
        } z-20`}
      >
        {/* Sidebar Header */}
        <div className="bg-teal-600 h-12 flex items-center justify-center">
          {!isCollapsed && <h3 className="text-center font-bold">Wolkite Prison MS</h3>}
        </div>

        {/* Navigation Links */}
        <nav className="mt-4 space-y-1 px-2">
          <NavLink
            to="/Inspector-dashboard"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg hover:bg-teal-600 transition-colors ${
                isActive ? "bg-teal-600" : ""
              } ${isCollapsed ? "justify-center" : "justify-start"}`
            }
            end
          >
            <FaTachometerAlt />
            {!isCollapsed && <span className="ml-3">Dashboard</span>}
          </NavLink>

          <NavLink
            to="/Inspector-dashboard/prisons"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg hover:bg-teal-600 transition-colors ${
                isActive ? "bg-teal-600" : ""
              } ${isCollapsed ? "justify-center" : "justify-start"}`
            }
          >
            <FaUsers />
            {!isCollapsed && <span className="ml-3">Prisons</span>}
          </NavLink>

          <NavLink
            to="/Inspector-dashboard/notices"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg hover:bg-teal-600 transition-colors ${
                isActive ? "bg-teal-600" : ""
              } ${isCollapsed ? "justify-center" : "justify-start"}`
            }
          >
            <FaBuilding />
            {!isCollapsed && <span className="ml-3">Manage Notices</span>}
          </NavLink>

          <NavLink
            to="/Inspector-dashboard/settings"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg hover:bg-teal-600 transition-colors ${
                isActive ? "bg-teal-600" : ""
              } ${isCollapsed ? "justify-center" : "justify-start"}`
            }
          >
            <FaExclamationCircle />
            {!isCollapsed && <span className="ml-3">Settings</span>}
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default InspectorSidebar;
