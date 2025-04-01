import React from "react";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";

// Custom hooks
import useVisitScheduleData from "../../hooks/useVisitScheduleData";
import useVisitScheduleActions from "../../hooks/useVisitScheduleActions";

// Partial components
import FilterBar from "./partials/FilterBar";
import ScheduleList from "./partials/ScheduleList";
import ScheduleDetailModal from "./partials/ScheduleDetailModal";
import CancelConfirmationModal from "./partials/CancelConfirmationModal";
import ScheduleForm from "./partials/ScheduleForm";

function VisitSchedules() {
  // Get sidebar state from Redux
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  
  // Get data and state from custom hooks
  const {
    filteredSchedules,
    loading,
    error,
    filter,
    visitorLoading,
    fetchSchedules,
    fetchVisitors,
    handleFilterChange,
    handleCancelSchedule,
    handleDeleteSchedule,
    getStatusColor
  } = useVisitScheduleData();
  
  const {
    selectedSchedule,
    showScheduleForm,
    showDetailModal,
    viewSchedule,
    showCancelModal,
    scheduleToCancel,
    handleViewSchedule,
    closeDetailModal,
    handleUpdateSchedule,
    handleCloseForm,
    openCancelConfirmation,
    closeCancelModal,
    confirmCancelSchedule,
    openNewScheduleForm
  } = useVisitScheduleActions(handleCancelSchedule, fetchSchedules);

  // Handle refresh action
  const handleRefresh = () => {
    const refreshId = toast.loading("Refreshing data...");
    Promise.all([fetchVisitors(), fetchSchedules()])
      .then(() => {
        toast.dismiss(refreshId);
        toast.success("Data refreshed successfully");
      })
      .catch(() => {
        toast.dismiss(refreshId);
        toast.error("Failed to refresh data");
      });
  };

  return (
    <div className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'} p-4 md:p-6`}>
      {/* Header and Filter Bar */}
      <div className="mt-10">
        <FilterBar
          filter={filter}
          onFilterChange={handleFilterChange}
          onAddNew={openNewScheduleForm}
          onRefresh={handleRefresh}
          loading={loading}
          visitorLoading={visitorLoading}
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Error loading schedules</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Schedules List */}
      <ScheduleList
        schedules={filteredSchedules}
        loading={loading}
        getStatusColor={getStatusColor}
        onView={handleViewSchedule}
        onDelete={handleDeleteSchedule}
      />

      {/* Schedule Form Modal */}
      <ScheduleForm
        isOpen={showScheduleForm}
        onClose={handleCloseForm}
        schedule={selectedSchedule}
        onSuccess={() => {
          toast.success(selectedSchedule ? "Visit updated successfully" : "Visit scheduled successfully");
          setTimeout(() => {
            const refreshId = toast.loading("Refreshing schedules...");
            fetchSchedules()
              .then(() => {
                toast.dismiss(refreshId);
              })
              .catch(() => {
                toast.dismiss(refreshId);
                toast.error("Failed to refresh schedules");
              });
          }, 1000);
        }}
      />

      {/* Detail View Modal */}
      <ScheduleDetailModal
        isOpen={showDetailModal}
        onClose={closeDetailModal}
        schedule={viewSchedule}
        onUpdate={handleUpdateSchedule}
        onCancel={openCancelConfirmation}
      />

      {/* Cancel Confirmation Modal */}
      <CancelConfirmationModal
        isOpen={showCancelModal}
        onClose={closeCancelModal}
        schedule={scheduleToCancel}
        onConfirm={confirmCancelSchedule}
      />
    </div>
  );
}

export default VisitSchedules;
