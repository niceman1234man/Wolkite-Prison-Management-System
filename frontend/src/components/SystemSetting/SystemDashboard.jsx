import React from 'react';
import { Link } from 'react-router-dom';
import { FaArchive, FaUsers, FaCog, FaServer, FaChartLine, FaDatabase } from 'react-icons/fa';

function SystemDashboard() {
  return (
    <div>
      <h1 className="border-b p-5 text-2xl font-bold">System Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        <div className="border p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-2">
            <FaUsers className="text-blue-600 text-xl mr-2" />
            <h3 className="font-semibold text-gray-800">System Users</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">24</p>
          <p className="text-sm text-gray-600">Total registered users</p>
        </div>
        
        <div className="border p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-2">
            <FaServer className="text-green-600 text-xl mr-2" />
            <h3 className="font-semibold text-gray-800">System Status</h3>
          </div>
          <p className="text-sm font-medium text-green-600">Online</p>
          <p className="text-sm text-gray-600">All services running normally</p>
        </div>
        
        <div className="border p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-2">
            <FaChartLine className="text-purple-600 text-xl mr-2" />
            <h3 className="font-semibold text-gray-800">System Activity</h3>
          </div>
          <p className="text-2xl font-bold text-purple-600">152</p>
          <p className="text-sm text-gray-600">Actions in last 24 hours</p>
        </div>
        
        <Link to="/archive" className="border p-4 rounded-lg shadow-md hover:shadow-lg hover:bg-blue-50 transition-all duration-300 flex flex-col">
          <div className="flex items-center mb-2">
            <FaArchive className="text-amber-600 text-xl mr-2" />
            <h3 className="font-semibold text-gray-800">Archive System</h3>
          </div>
          <p className="text-sm text-gray-600">Manage and restore archived items</p>
        </Link>
        
        <div className="border p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-2">
            <FaDatabase className="text-red-600 text-xl mr-2" />
            <h3 className="font-semibold text-gray-800">Database</h3>
          </div>
          <p className="text-sm text-gray-600">Database management and backups</p>
        </div>
        
        <div className="border p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-2">
            <FaCog className="text-gray-600 text-xl mr-2" />
            <h3 className="font-semibold text-gray-800">System Settings</h3>
          </div>
          <p className="text-sm text-gray-600">Configure system parameters</p>
        </div>
      </div>
    </div>
  );
}

export default SystemDashboard; 