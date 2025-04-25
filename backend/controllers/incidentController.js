// Get incidents for a specific inmate
exports.getInmateIncidents = async (req, res) => {
  try {
    const { inmateId } = req.params;
    
    // Fetch the inmate details
    const inmate = await Inmate.findById(inmateId);
    if (!inmate) {
      return res.status(404).json({ success: false, message: "Inmate not found" });
    }
    
    // Get inmate's full name
    const inmateFullName = `${inmate.firstName} ${inmate.middleName} ${inmate.lastName}`.trim();
    
    // Fetch all incidents related to this inmate
    const incidents = await Incident.find({ inmate: inmateFullName })
      .sort({ incidentDate: -1 }); // Sort by date in descending order
    
    return res.status(200).json({ success: true, incidents, inmate });
  } catch (error) {
    console.error("Error fetching inmate incidents:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching inmate incidents" });
  }
};

// Get incident statistics for a specific inmate
exports.getInmateIncidentStatistics = async (req, res) => {
  try {
    const { inmateId } = req.params;
    
    // Fetch the inmate details
    const inmate = await Inmate.findById(inmateId);
    if (!inmate) {
      return res.status(404).json({ success: false, message: "Inmate not found" });
    }
    
    // Get inmate's full name
    const inmateFullName = `${inmate.firstName} ${inmate.middleName} ${inmate.lastName}`.trim();
    
    // Fetch all incidents related to this inmate
    const incidents = await Incident.find({ inmate: inmateFullName });
    
    if (!incidents.length) {
      return res.status(200).json({ 
        success: true, 
        statistics: {
          totalIncidents: 0,
          byStatus: {},
          byType: {},
          timeline: []
        }
      });
    }
    
    // Calculate statistics
    const byStatus = {};
    const byType = {};
    const monthlyCount = {};
    
    // Process each incident
    incidents.forEach(incident => {
      // Count by status
      byStatus[incident.status] = (byStatus[incident.status] || 0) + 1;
      
      // Count by incident type
      byType[incident.incidentType] = (byType[incident.incidentType] || 0) + 1;
      
      // Create monthly timeline
      const date = new Date(incident.incidentDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyCount[monthYear] = (monthlyCount[monthYear] || 0) + 1;
    });
    
    // Create timeline data for last 12 months
    const timeline = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i);
      const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      timeline.unshift({
        month: monthYear,
        count: monthlyCount[monthYear] || 0
      });
    }
    
    // Calculate severity distribution if available
    const bySeverity = {};
    incidents.forEach(incident => {
      if (incident.severity) {
        bySeverity[incident.severity] = (bySeverity[incident.severity] || 0) + 1;
      }
    });
    
    // Calculate recidivism rate (repeat incidents within 30 days)
    const sortedIncidents = [...incidents].sort((a, b) => 
      new Date(a.incidentDate) - new Date(b.incidentDate)
    );
    
    let repeatIncidents = 0;
    
    for (let i = 1; i < sortedIncidents.length; i++) {
      const currentDate = new Date(sortedIncidents[i].incidentDate);
      const previousDate = new Date(sortedIncidents[i-1].incidentDate);
      
      // Calculate days between incidents
      const diffTime = Math.abs(currentDate - previousDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 30) {
        repeatIncidents++;
      }
    }
    
    const recidivismRate = sortedIncidents.length > 1 
      ? (repeatIncidents / (sortedIncidents.length - 1)) * 100 
      : 0;
    
    // Return statistics
    return res.status(200).json({
      success: true,
      statistics: {
        totalIncidents: incidents.length,
        byStatus,
        byType,
        bySeverity,
        timeline,
        recidivismRate: Math.round(recidivismRate),
        averageIncidentsPerMonth: incidents.length / 12
      }
    });
    
  } catch (error) {
    console.error("Error fetching inmate incident statistics:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching inmate incident statistics" });
  }
}; 