import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SecurityStaffDashboard from '../components/SecurityStaff/SecurityStaffDashboard';
import SecurityStaffReport from '../components/security/SecurityStaffReport';
import StaffReport from '../components/security/reports/StaffReport';
import IncidentReport from '../components/security/reports/IncidentReport';
import Court from '../components/SecurityStaff/Court';
import SecurityStaffDashboardSidebar from '../components/SecurityStaff/SecurityStaffDashboardSidebar';

const SecurityStaffRoutes = () => {
  return (
    <div className="flex">
      <SecurityStaffDashboardSidebar />
      <div className="flex-1">
        <Routes>
          <Route path="/dashboard" element={<SecurityStaffDashboard />} />
          
          {/* Reports Routes */}
          <Route path="/reports/overview" element={<SecurityStaffReport />} />
          <Route path="/reports/staff" element={<StaffReport />} />
          <Route path="/reports/incidents" element={<IncidentReport />} />
          
          <Route path="/court" element={<Court />} />
          {/* Add more security staff routes as needed */}
        </Routes>
      </div>
    </div>
  );
};

export default SecurityStaffRoutes; 