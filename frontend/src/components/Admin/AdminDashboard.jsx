import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaArchive, FaUsers, FaCog, FaEnvelope, FaBan, FaUserCheck } from 'react-icons/fa';

function AdminDashboard() {
  return (
    <div>
      <h1 className="border-b p-5 text-2xl font-bold">Welcome, Admin!</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        <div className="border p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-2">
            <FaUserCheck className="text-green-600 text-xl mr-2" />
            <h3 className="font-semibold text-gray-800">Active Users</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">23</p>
        </div>
        
        <div className="border p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-2">
            <FaUsers className="text-blue-600 text-xl mr-2" />
            <h3 className="font-semibold text-gray-800">All Users</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">21</p>
        </div>
        
        <div className="border p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-2">
            <FaBan className="text-red-600 text-xl mr-2" />
            <h3 className="font-semibold text-gray-800">Blocked Users</h3>
          </div>
          <p className="text-2xl font-bold text-red-600">4</p>
        </div>
        
        <div className="border p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-2">
            <FaEnvelope className="text-purple-600 text-xl mr-2" />
            <h3 className="font-semibold text-gray-800">Messages</h3>
          </div>
          <p className="text-2xl font-bold text-purple-600">5</p>
        </div>
        
        <Link to="/archive" className="border p-4 rounded-lg shadow-md hover:shadow-lg hover:bg-blue-50 transition-all duration-300 flex flex-col">
          <div className="flex items-center mb-2">
            <FaArchive className="text-amber-600 text-xl mr-2" />
            <h3 className="font-semibold text-gray-800">Archive System</h3>
          </div>
          <p className="text-sm text-gray-600">View and restore deleted items</p>
        </Link>
        
        <div className="border p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center mb-2">
            <FaCog className="text-gray-600 text-xl mr-2" />
            <h3 className="font-semibold text-gray-800">Settings</h3>
          </div>
          <p className="text-sm text-gray-600">System configuration</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;