import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '../../redux/sidebarSlice';
import {
  FaChartBar,
  FaUserShield,
  FaClipboardList,
  FaGavel,
  FaChartLine,
  FaBars,
  FaTimes,
  FaCaretDown,
  FaFileAlt,
  FaUserClock,
  FaExclamationTriangle
} from 'react-icons/fa';

const SecurityStaffDashboardSidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  const mainMenuItems = [
    {
      path: '/security/dashboard',
      name: 'Dashboard',
      icon: <FaChartBar className="w-5 h-5" />
    },
    {
      path: '/security/staff',
      name: 'Security Staff',
      icon: <FaUserShield className="w-5 h-5" />
    },
    {
      path: '/security/duties',
      name: 'Duty Management',
      icon: <FaClipboardList className="w-5 h-5" />
    },
    {
      path: '/security/court',
      name: 'Court Instructions',
      icon: <FaGavel className="w-5 h-5" />
    }
  ];

  const reportMenuItems = [
    {
      path: '/security/reports/overview',
      name: 'Overview Report',
      icon: <FaFileAlt className="w-4 h-4" />
    },
    {
      path: '/security/reports/staff',
      name: 'Staff Reports',
      icon: <FaUserClock className="w-4 h-4" />
    },
    {
      path: '/security/reports/incidents',
      name: 'Incident Reports',
      icon: <FaExclamationTriangle className="w-4 h-4" />
    }
  ];

  const isReportPath = location.pathname.includes('/security/reports');

  return (
    <div className={`fixed left-0 top-0 h-screen bg-gray-800 text-white transition-all duration-300 ease-in-out z-10 
      ${isCollapsed ? 'w-16' : 'w-64'}`}>
      
      {/* Toggle Button */}
      <button
        className="absolute right-0 top-3 transform translate-x-6 bg-gray-800 text-white p-2 rounded-full shadow-lg"
        onClick={() => dispatch(toggleSidebar())}
      >
        {isCollapsed ? <FaBars /> : <FaTimes />}
      </button>

      {/* Logo/Header */}
      <div className="p-4 border-b border-gray-700">
        {!isCollapsed && <h2 className="text-xl font-bold">Security Staff</h2>}
      </div>

      {/* Navigation Items */}
      <nav className="mt-6">
        {/* Main Menu Items */}
        {mainMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center py-3 px-4 transition-colors duration-200
              ${location.pathname === item.path
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'}
              ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          >
            <span className="inline-block">{item.icon}</span>
            {!isCollapsed && (
              <span className="ml-3 text-sm font-medium">{item.name}</span>
            )}
          </Link>
        ))}

        {/* Reports Section */}
        <div className="mt-2">
          <button
            onClick={() => !isCollapsed && setIsReportsOpen(!isReportsOpen)}
            className={`w-full flex items-center py-3 px-4 transition-colors duration-200
              ${isReportPath ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}
              ${isCollapsed ? 'justify-center' : 'justify-between'}`}
          >
            <div className="flex items-center">
              <FaChartLine className="w-5 h-5" />
              {!isCollapsed && (
                <span className="ml-3 text-sm font-medium">Reports & Analytics</span>
              )}
            </div>
            {!isCollapsed && (
              <FaCaretDown className={`w-4 h-4 transition-transform duration-200 
                ${isReportsOpen ? 'transform rotate-180' : ''}`}
              />
            )}
          </button>

          {/* Reports Submenu */}
          {!isCollapsed && isReportsOpen && (
            <div className="bg-gray-900 py-2">
              {reportMenuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center py-2 pl-12 pr-4 transition-colors duration-200
                    ${location.pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                >
                  {item.icon}
                  <span className="ml-3 text-sm">{item.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className={`absolute bottom-0 w-full p-4 border-t border-gray-700
        ${isCollapsed ? 'text-center' : ''}`}>
        {!isCollapsed && (
          <p className="text-sm text-gray-400">Security Management System</p>
        )}
      </div>
    </div>
  );
};

export default SecurityStaffDashboardSidebar; 