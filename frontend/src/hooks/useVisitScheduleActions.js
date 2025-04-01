import { useState } from "react";

const useVisitScheduleActions = (handleCancelSchedule, fetchSchedules) => {
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewSchedule, setViewSchedule] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [scheduleToCancel, setScheduleToCancel] = useState(null);

  // Handle view schedule details
  const handleViewSchedule = (schedule) => {
    setViewSchedule(schedule);
    setShowDetailModal(true);
  };

  // Close detail modal
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setViewSchedule(null);
  };

  // Handle update schedule
  const handleUpdateSchedule = (schedule) => {
    if (!schedule || !schedule._id) {
      return;
    }
    
    // Make a sanitized copy to prevent React errors
    const safeSchedule = {
      ...schedule,
      inmateId: schedule.inmateId || { _id: 'default_inmate' }
    };
    
    // Close any existing modals
    closeDetailModal();
    
    // Set the selected schedule for editing
    setSelectedSchedule(safeSchedule);
    
    // Open the form modal
    setShowScheduleForm(true);
  };

  // Close form
  const handleCloseForm = () => {
    setShowScheduleForm(false);
    setSelectedSchedule(null);
  };

  // Open cancel confirmation modal
  const openCancelConfirmation = (schedule) => {
    setScheduleToCancel(schedule);
    setShowCancelModal(true);
  };

  // Close cancel modal
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setScheduleToCancel(null);
  };

  // Confirm and process cancellation
  const confirmCancelSchedule = async () => {
    if (scheduleToCancel && scheduleToCancel._id) {
      const success = await handleCancelSchedule(scheduleToCancel._id);
      closeCancelModal();
      
      // If we're canceling from the detail view, close that too
      if (showDetailModal && success) {
        closeDetailModal();
      }
      
      return success;
    }
    return false;
  };

  // Handle new schedule form opening
  const openNewScheduleForm = () => {
    setSelectedSchedule(null);
    setShowScheduleForm(true);
  };

  return {
    // State
    selectedSchedule,
    showScheduleForm,
    showDetailModal,
    viewSchedule,
    showCancelModal,
    scheduleToCancel,
    
    // Setters
    setSelectedSchedule,
    setShowScheduleForm,
    setShowDetailModal,
    setViewSchedule,
    
    // Actions
    handleViewSchedule,
    closeDetailModal,
    handleUpdateSchedule,
    handleCloseForm,
    openCancelConfirmation,
    closeCancelModal,
    confirmCancelSchedule,
    openNewScheduleForm
  };
};

export default useVisitScheduleActions; 