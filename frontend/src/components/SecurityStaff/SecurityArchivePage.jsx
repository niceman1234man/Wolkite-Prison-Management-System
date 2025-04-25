import React from 'react';
import { Navigate } from 'react-router-dom';
import ArchiveList from '../Archive/ArchiveList';
import { useSelector } from 'react-redux';

const SecurityArchivePage = () => {
  // Check user auth from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  
  // Only allow security staff to access this page
  if (!user || user.role !== 'security') {
    return <Navigate to="/login" />;
  }
  
  return <ArchiveList />;
};

export default SecurityArchivePage; 