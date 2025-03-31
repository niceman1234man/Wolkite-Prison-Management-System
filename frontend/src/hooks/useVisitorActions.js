import { useState } from "react";
import { toast } from "react-hot-toast";
import { handleApprove, handleReject, handlePostpone } from "../utils/visitorActions.js";

const useVisitorActions = (fetchVisitorsFunc) => {
  const [actionInProgress, setActionInProgress] = useState(false);
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [viewVisitor, setViewVisitor] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Get ID from either a visitor object or direct ID
  const getVisitorId = (visitorOrId) => {
    if (!visitorOrId) return null;
    return typeof visitorOrId === 'object' ? visitorOrId._id : visitorOrId;
  };

  // Handle approve action
  const handleApproveClick = async (visitorOrId) => {
    const scheduleId = getVisitorId(visitorOrId);
    if (!scheduleId) {
      toast.error("Invalid visitor data");
      return;
    }

    setActionInProgress(true);
    const success = await handleApprove(scheduleId);
    if (success) {
      // Close modals
      setShowDetailModal(false);
      // Refresh data
      fetchVisitorsFunc();
    }
    setActionInProgress(false);
  };

  // Handle reject action
  const handleRejectClick = async (visitorOrId) => {
    const scheduleId = getVisitorId(visitorOrId);
    if (!scheduleId) {
      toast.error("Invalid visitor data");
      return;
    }

    setActionInProgress(true);
    const success = await handleReject(scheduleId);
    if (success) {
      // Close modals
      setShowDetailModal(false);
      // Refresh data
      fetchVisitorsFunc();
    }
    setActionInProgress(false);
  };

  // Handle postpone click
  const handlePostponeClick = (visitorOrId) => {
    const scheduleId = getVisitorId(visitorOrId);
    if (!scheduleId) {
      toast.error("Invalid visitor data");
      return;
    }

    setSelectedScheduleId(scheduleId);
    setShowPostponeModal(true);
  };

  // Handle postpone submit
  const handlePostponeSubmit = async (newDate) => {
    if (!newDate) {
      toast.error("Please select a new date");
      return;
    }

    if (!selectedScheduleId) {
      toast.error("No visitor selected for postponement");
      return;
    }

    setActionInProgress(true);
    const success = await handlePostpone(selectedScheduleId, newDate);
    if (success) {
      // Close modals
      setShowPostponeModal(false);
      setShowDetailModal(false);
      // Refresh data
      fetchVisitorsFunc();
    }
    setActionInProgress(false);
  };

  // Handle view details
  const handleViewDetails = (visitor) => {
    setViewVisitor(visitor);
    setShowDetailModal(true);
  };

  // Close detail modal
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setViewVisitor(null);
  };

  // Close postpone modal
  const closePostponeModal = () => {
    setShowPostponeModal(false);
    setSelectedScheduleId(null);
  };

  return {
    actionInProgress,
    showPostponeModal,
    selectedScheduleId,
    viewVisitor,
    showDetailModal,
    handleApproveClick,
    handleRejectClick,
    handlePostponeClick,
    handlePostponeSubmit,
    handleViewDetails,
    closeDetailModal,
    closePostponeModal,
    setViewVisitor,
    setShowDetailModal
  };
};

export default useVisitorActions; 