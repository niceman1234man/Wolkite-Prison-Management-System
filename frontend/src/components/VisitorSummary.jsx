const fetchStats = async () => {
  try {
    const response = await axiosInstance.get('/visitor/schedule/schedules');
    
    if (response.data && response.data.success) {
      // Process data...
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
  }
}; 