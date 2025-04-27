import React from 'react';
import { Navigate } from 'react-router-dom';
import ArchiveDetail from '../Archive/ArchiveDetail';
import { useSelector } from 'react-redux';

const SecurityArchiveDetailPage = () => {
  // Check user auth from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  
  // Only allow security staff to access this page
  if (!user || user.role !== 'security') {
    return <Navigate to="/login" />;
  }
  
  return <ArchiveDetail />;
};

export default SecurityArchiveDetailPage; 