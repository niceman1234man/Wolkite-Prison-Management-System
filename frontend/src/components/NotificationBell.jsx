const isNoticeReadByUser = (notice) => {
  // First, make sure we have a valid user ID
  const userId = user?.id || user?._id;
  if (!userId) {
    console.warn("No user ID available to check if notice is read");
    return false;
  }
  
  // Check if the notice has been read by this user
  if (notice.readBy && Array.isArray(notice.readBy)) {
    // Check if user's ID is in the readBy array (using either id or _id format)
    return notice.readBy.some(readerId => 
      readerId === userId || 
      (readerId._id && (readerId._id === userId || readerId._id.toString() === userId)) ||
      (readerId.id && (readerId.id === userId || readerId.id.toString() === userId))
    );
  }
  
  // Check locally marked notices
  return locallyReadNotices.includes(notice._id);
}; 