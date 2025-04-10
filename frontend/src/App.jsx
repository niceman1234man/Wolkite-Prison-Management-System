import React from "react";
import { Routes, Route } from "react-router-dom";
import Welcome from "./components/Welcome";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Admin from "./page/Admin";
import Visitor from "./page/Visitor";
import VisitorRegister from "./page/VisitorRegister";
import ForegotPassword from "./components/auth/ForgotPassword.jsx";
import VisitorDashboard from "./page/VisitorDashboard";
import PoliceOfficerDashboard from "./page/PoliceOfficerDashboard";
import Inspector from "./page/Inspector";
import SecurityStaff from "./page/SecurityStaff";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import RegisterVisitor from "./components/Visitor/RegisterVisitor.jsx";
import Setting from "./components/PoliceOfficerDashboard/Setting";
import List from "./components/Visitor/VisitorList";
import InmateList from "./components/Inmates/List.jsx";
import Parole from "./parole/Prole.jsx";
import Insident from "./components/Incident/incident.jsx";
import PoliceOfficerReports from "./components/Reports/PoliceOfficerReports.jsx";
import PoliceOfficerSummary from "./components/PoliceOfficerDashboard/PoliceOfficerSummary.jsx";
import Add from "./components/Incident/Add.jsx";
import AddUser from "./components/Accounts/Add.jsx";
import AdminDashboard from "./page/AdminDashboard.jsx";
import AdminSummary from "./components/Admin/AdminSummary.jsx";
import CreateUserAccount from "./components/Accounts/CreateUserAccount.jsx";
import BackeUp from "./components/Accounts/BackeUp.jsx";
import ListofUsers from "./components/Accounts/List.jsx";
import AccountReport from "./components/Accounts/AccountReport.jsx";
import SystemSetting from "./components/SystemSetting/SystemSetting.jsx";
import InspectorSummary from "./components/InspectorDashboard/InspectorSummary.jsx";
import InspectorDashboard from "./page/InspectorDashboard.jsx";
import Notices from "./components/Notices/Notices.jsx";
import InspectorSetting from "./components/InspectorDashboard/InspectorSetting.jsx";
import PrisonsList from "./components/Prisons/PrisonsList.jsx";
import AddPrison from "./components/Prisons/AddPrison.jsx";
import AddInmate from "./components/Inmates/Add.jsx";
import CourtDashboard from "./page/CourtDashboard.jsx";
import CourtSummary from "./components/CourtDashboard/CourtSummary.jsx";
import CourtInstructions from "./components/CourtDashboard/CourtInstructions/CourtInstructions.jsx";
import SecurityStaffDashboard from "./page/SecurityStaffDashboard.jsx";
import VisitorHistory from "./components/History/VisitorHistory/visitorHistory.jsx";
import VisitSchedule from "./components/Schedule/visiteSchedule.jsx";
import VisitDashboard from "./page/visitDashboard.jsx";
import SecurityStaffSummary from "./components/SecurityStaff/SecurityStaffSummary.jsx";
import VisitorHistoryView from "./components/History/VisitorHistory/visitorHistory.jsx";
import SecurityStaffReports from "./components/Reports/SecurityStaffReports.jsx";
import InmateClearance from "./components/Clearance/InmateClearance.jsx";
import EditUser from "./components/Accounts/EditUser.jsx";
import ViewUser from "./components/Accounts/ViewUser.jsx";
import EditVisitor from "./components/Visitor/EditVisitor.jsx";
import ViewVisitor from "./components/Visitor/ViewVisitor.jsx";
import ViewIncident from "./components/Incident/ViewIncident.jsx";
import UpdateIncident from "./components/Incident/UpdateIncident.jsx";
import UpdateInmate from "./components/Inmates/UpdateInmate.jsx";
import ViewInmate from "./components/Inmates/ViewInmate.jsx";
import VisitorSummaryCard from "./components/visitorDashboaard/VisitorSummary.jsx";
import EditPrison from "./components/Prisons/EditPrison.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import ParoleList from "./parole/ParoleList.jsx";
import Block from "./components/Block.jsx";
import InmateBehavior from "./parole/ParoleList.jsx";
import InmateBehaviorGraph from "./parole/InmateBehaviorGraph.jsx";
import SecurityReport from "./components/security/SecurityReport.jsx";
import NoticesList from "./components/Notices/NoticeList.jsx";
import ClearancesList from "./components/Clearance/ClearanceList.jsx";
import UpdateNotice from "./components/Notices/UpdateNotice.jsx";
import ViewNotice from "./components/Notices/ViewNotice.jsx";
import ResetPassword from "./components/auth/ResetPassword.jsx";
import updateProfile from "./components/profile/updateProfile.jsx";
import UpdateProfile from "./components/profile/updateProfile.jsx";
import HelpPage from "./page/helpPage.jsx";
import SettingPage from "./page/settingsPage.jsx";
import ParoleRequest from "./components/CourtDashboard/CourtInstructions/ParoleRequest.jsx";
import InstructionList from "./components/CourtDashboard/CourtInstructions/InstructionList.jsx";
import ViewInstruction from "./components/CourtDashboard/CourtInstructions/ViewInstruction.jsx";
import EditInstruction from "./components/CourtDashboard/CourtInstructions/EditInstruction.jsx";
import ViewParole from "./components/CourtDashboard/CourtInstructions/ViewParole.jsx";
import WoredaDashboard from "./page/WoredaDashboard";
import InmateTransferForm from "./components/Woreda/NewTransfer";
import TransferList from "./components/Woreda/TransferList";
import ViewTransfer from "./components/Woreda/ViewTransfer";
import EditTransfer from "./components/Woreda/EditTransfer";
import UpdateClearance from "./components/Clearance/UpdateClearance";
import ViewClearance from "./components/Clearance/ViewClearance";
import Court from "./components/SecurityStaff/Court";
import ParoleSend from "./components/SecurityStaff/ParoleSend";
import CourtView from "./components/SecurityStaff/CourtView";
import InspectorHomepageSettings from "./page/InspectorHomepageSettings";
import Dashboard from "./page/Dashboard";
import PrisonerList from "./components/Woreda/PrisonerList";
import WoredaReports from "./components/Woreda/Reports";
import WoredaNotifications from "./components/Woreda/Notifications";
import AddWoredaInmate from "./components/Woreda/AddWoredaInmate";
import ViewWoredaInmate from "./components/Woreda/ViewWoredaInmate";
import ViewPrisoner from "./components/Woreda/ViewPrisoner";
import Reports from "./components/InspectorDashboard/Reports.jsx";
import TransferRequests from "./components/SecurityStaff/TransferRequests";
import ScheduleVisit from "./components/visitorDashboaard/ScheduleVisit";
import VisitHistory from "./components/visitorDashboaard/VisitHistory";
import VisitorProfile from "./components/visitorDashboaard/VisitorProfile";
import VisitSchedules from "./components/visitorDashboaard/VisitSchedules";
import VisitorList from "./components/Visitor/VisitorList";
import DashboardNoticeList from "./components/Notices/DashboardNoticeList";
import NoticeView from "./components/Notices/NoticeView";
import RequestParole from "./parole/RequestParole";
import SecurityStaffDashboardSidebar from "./components/SecurityStaff/SecurityStaffDashboardSidebar";
import SecurityStaffReport from "./components/SecurityStaff/SecurityStaffReport";
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import AuthContext from './context/authContext';

function App() {
  return (
    <>
      <AuthContext>
        <SocketProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/block" element={<Block />} />
            <Route path="/login" element={<Login isVisitor={false} />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password/:id/:token" element={<ResetPassword />} />
            <Route path="/visitor" element={<Visitor />} />
            <Route path="/register" element={<VisitorRegister />} />
            <Route path="/forgot-password" element={<ForegotPassword />} />
            <Route path="/visitor-dash" element={<VisitorDashboard />} />
            <Route path="/security" element={<SecurityStaff />} />
            <Route element={<PrivateRoute />}>
              {/* Police Officer Dashboard Routes */}
              <Route
                path="/policeOfficer-dashboard"
                element={<PoliceOfficerDashboard />}
              >
                <Route index element={<PoliceOfficerSummary />} />
                <Route path="visitors" element={<VisitorList />} />
                <Route path="add" element={<RegisterVisitor />} />
                <Route path="edit/:id" element={<EditVisitor />} />
                <Route path="view/:id" element={<ViewVisitor />} />
                <Route path="parole" element={<Parole />} />
                <Route path="parole-request" element={<RequestParole />} />
                <Route path="ParoleList/:inmateId" element={<ParoleList />} />
                <Route path="incident" element={<Insident />} />
                <Route path="reports" element={<PoliceOfficerReports />} />
                <Route path="add-incident" element={<Add />} />
                <Route path="incident-details/:id" element={<ViewIncident />} />
                <Route path="edit-incident/:id" element={<UpdateIncident />} />
                <Route path="status/:_id" element={<InmateBehaviorGraph />} />
                <Route path="update-profile" element={<UpdateProfile />} />
                <Route path="help" element={<HelpPage />} />
                <Route path="settingsPage" element={<SettingPage />} />
                <Route path="notices" element={<DashboardNoticeList dashboardType="police" />} />
                <Route path="notices/view/:id" element={<NoticeView />} />
              </Route>

              {/* Admin Dashboard Routes */}
              <Route path="/admin-dashboard" element={<AdminDashboard />}>
                <Route index element={<AdminSummary />} />
                <Route path="CreateAccount" element={<CreateUserAccount />} />
                <Route path="system-setting" element={<BackeUp />} />
                <Route path="users" element={<ListofUsers />} />
                <Route path="edit/:id" element={<EditUser />} />
                <Route path="users/:id" element={<ViewUser />} />
                <Route path="update-profile" element={<UpdateProfile />} />
                <Route path="help" element={<HelpPage />} />
                <Route path="settingsPage" element={<SettingPage />} />
                <Route path="reports" element={<AccountReport />} />
                <Route path="notices" element={<DashboardNoticeList dashboardType="admin" />} />
                <Route path="notices/view/:id" element={<NoticeView />} />
              </Route>

              {/* Inspector Dashboard Routes */}
              <Route path="/inspector-dashboard" element={<InspectorDashboard />}>
                <Route index element={<InspectorSummary />} />
                <Route path="prisons" element={<PrisonsList />} />
                <Route path="notices" element={<NoticesList />} />
                <Route path="reports" element={<Reports />} />
                <Route path="homepage-settings" element={<InspectorHomepageSettings />} />
              </Route>

              {/* Court Dashboard Routes */}
              <Route path="/court-dashboard" element={<CourtDashboard />}>
                <Route index element={<CourtSummary />} />
                <Route path="parole" element={<ParoleRequest />} />
                <Route path="list" element={<InstructionList />} />
                <Route path="view/:id" element={<ViewInstruction />} />
                <Route path="view-request/:id" element={<ViewParole />} />
                <Route path="edit/:id" element={<EditInstruction />} />
                <Route path="courtInstructions" element={<CourtInstructions />} />
                <Route path="update-profile" element={<UpdateProfile />} />
                <Route path="help" element={<HelpPage />} />
                <Route path="settingsPage" element={<SettingPage />} />
                <Route path="notices" element={<DashboardNoticeList dashboardType="court" />} />
                <Route path="notices/view/:id" element={<NoticeView />} />
              </Route>

              {/* Woreda Dashboard Routes */}
              <Route path="/woreda-dashboard" element={<WoredaDashboard />}>
                <Route index element={<Dashboard />} />
                <Route path="transfers" element={<PrisonerList />} />
                <Route path="reports" element={<WoredaReports />} />
                <Route path="notifications" element={<WoredaNotifications />} />
                <Route path="prisoners" element={<PrisonerList />} />
                <Route path="add" element={<InmateTransferForm />} />
                <Route path="inmates" element={<AddWoredaInmate />} />
                <Route path="inmates/:id" element={<ViewWoredaInmate />} />
                <Route path="edit/:id" element={<EditTransfer />} />
                <Route path="view/:id" element={<ViewTransfer />} />
                <Route path="update-profile" element={<UpdateProfile />} />
                <Route path="help" element={<HelpPage />} />
                <Route path="settingsPage" element={<SettingPage />} />
                <Route path="prisoner-list" element={<PrisonerList />} />
                <Route path="prisoner/:id" element={<ViewPrisoner />} />
                <Route path="notices" element={<DashboardNoticeList dashboardType="woreda" />} />
                <Route path="notices/view/:id" element={<NoticeView />} />
              </Route>

              {/* Visitor Dashboard Routes */}
              <Route path="/visitor-dashboard" element={<VisitDashboard />}>
                <Route index element={<VisitorSummaryCard />} />
                <Route path="schedules" element={<ScheduleVisit />} />
                <Route path="visit-history" element={<VisitHistory />} />
                <Route path="setting" element={<VisitorProfile />} />
                <Route path="schedule-visit" element={<VisitSchedules />} />
                <Route path="update-profile" element={<UpdateProfile />} />
                <Route path="help" element={<HelpPage />} />
                <Route path="notices" element={<DashboardNoticeList dashboardType="visitor" />} />
                <Route path="notices/view/:id" element={<NoticeView />} />
              </Route>

              {/* Security Staff Dashboard Routes */}
              <Route
                path="/securityStaff-dashboard"
                element={<SecurityStaffDashboard />}
              >
                <Route index element={<SecurityStaffSummary />} />
                <Route path="inmates" element={<InmateList />} />
                <Route path="court" element={<Court />} />
                <Route path="court-view/:id" element={<CourtView />} />
                <Route path="parole" element={<ParoleSend />} />
                <Route path="transfer-requests" element={<TransferRequests />} />
                <Route path="add-inmate" element={<AddInmate />} />
                <Route path="update-inmate/:id" element={<UpdateInmate />} />
                <Route path="view-inmate/:id" element={<ViewInmate />} />
                <Route path="reports" element={<SecurityStaffReport />} />
                <Route path="clearance" element={<ClearancesList />} />
                <Route path="add-clearance" element={<InmateClearance />} />
                <Route path="update-profile" element={<UpdateProfile />} />
                <Route path="help" element={<HelpPage />} />
                <Route path="settingsPage" element={<SettingPage />} />
                <Route path="edit-clearance/:id" element={<UpdateClearance />} />
                <Route path="view-clearance/:id" element={<ViewClearance />} />
                <Route path="notices" element={<DashboardNoticeList dashboardType="security" />} />
                <Route path="notices/view/:id" element={<NoticeView />} />
              </Route>
            </Route>
          </Routes>
        </SocketProvider>
      </AuthContext>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;
