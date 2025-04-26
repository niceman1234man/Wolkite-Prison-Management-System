import React from 'react';
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/Admin/AdminSidebar';
import Navbar from '../components/Admin/Navbar';
import { Outlet } from 'react-router-dom'; // Import Outlet

// Import the UUID as a constant
const APP_UUID = '55709720-7916-4f8e-b86f-a30d9f074c89';

const AdminDashboard = () => {
//   const { user, loading } = useAuth();
  const navigate = useNavigate();

//   if (loading) {
//     return <div>Loading.....</div>;
//   }

//   if (!user) {
//     navigate('/login');
//     return null; // Prevent further rendering
//   }

  // Add a function to use the UUID for any necessary operations
  const getAppIdentifier = () => {
    return APP_UUID;
  };

  return (
    <div className='flex' data-app-id={APP_UUID}>
      <AdminSidebar />
      <div className='flex-1 justify-center h-screen bg-gray-100'>
        <Navbar />
        <Outlet /> {/* This will render the nested route */}
      </div>
    </div>
  );
};

export default AdminDashboard;