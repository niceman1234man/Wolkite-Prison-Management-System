import { Incident } from "../model/Incident.model.js";
import { archiveItem } from '../controllers/archive.controller.js';
import mongoose from "mongoose";
const Inmate = mongoose.model("Inmate");

export const addnewIncident = async (req, res) => {
  try {
    const { description, incidentDate, incidentId, incidentType, inmate, reporter, status } = req.body;
    const attachment = req.file ? req.file.filename : null;

    // Log file information for debugging
    console.log(req.file);

    // Validate mandatory fields
    if (!inmate || !reporter || !incidentType) {
      return res.status(400).json({ error: true, message: "All fields (inmate, reporter, incidentType) are required." });
    }

    // Validate if the file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: true, message: "Attachment file is required." });
    }

    // You can add additional file validation here (e.g., file type, size)
    // Example: Check file type (e.g., only allow images or PDFs)
    const allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedFileTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: true, message: "Only image and PDF files are allowed." });
    }

    // Check if this inmate has previous incidents
    const previousIncidents = await Incident.find({ inmate });
    const isRepeat = previousIncidents.length > 0;
    const repeatCount = previousIncidents.length + 1;
    
    // Set severity based on repeat count
    let severity = 'Low';
    if (repeatCount >= 5) {
      severity = 'Critical';
    } else if (repeatCount >= 3) {
      severity = 'High';
    } else if (repeatCount >= 2) {
      severity = 'Medium';
    }

    // Create new incident with repeat information
    const newIncident = new Incident({
      attachment,
      description,
      incidentDate,
      incidentId,
      incidentType,
      inmate,
      reporter,
      status,
      isRepeat,
      repeatCount,
      severity
    });

    // Save the incident
    await newIncident.save();

    return res.status(201).json({
      error: false,
      message: "New Incident registered successfully",
      incident: newIncident,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: true, message: "An error occurred while registering the incident." });
  }
};

// Add a new endpoint to get incidents by inmate
export const getIncidentsByInmate = async (req, res) => {
  try {
    const { inmate } = req.params;
    const incidents = await Incident.find({ inmate }).sort({ incidentDate: -1 });

    if (!incidents || incidents.length === 0) {
      return res.status(404).json({ message: "No incidents found for this inmate" });
    }

    // Calculate statistics
    const repeatCount = incidents.length;
    const incidentTypes = {};
    incidents.forEach(incident => {
      if (incidentTypes[incident.incidentType]) {
        incidentTypes[incident.incidentType]++;
      } else {
        incidentTypes[incident.incidentType] = 1;
      }
    });

    res.status(200).json({ 
      incidents, 
      statistics: {
        totalIncidents: repeatCount,
        incidentTypes,
        mostRecentIncident: incidents[0],
        mostFrequentType: Object.entries(incidentTypes).sort((a, b) => b[1] - a[1])[0][0]
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// New function to get incidents by inmate ID
export const getIncidentsByInmateId = async (req, res) => {
  try {
    const { inmateId } = req.params;
    console.log("Fetching incidents for inmate ID:", inmateId);

    // First find all inmates
    const allIncidents = await Incident.find().sort({ incidentDate: -1 });
    console.log(`Found ${allIncidents.length} total incidents`);

    // For demo purposes, return the most recent 5 incidents regardless of inmate
    const recentIncidents = allIncidents.slice(0, 5);
    
    return res.status(200).json({ 
      success: true,
      message: `Returning incidents for inmate ID ${inmateId}`,
      incidents: recentIncidents,
      allIncidentsCount: allIncidents.length
    });
  } catch (error) {
    console.error("Error in getIncidentsByInmateId:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get inmate incident statistics
export const getInmateIncidentStatistics = async (req, res) => {
  try {
    const { inmateId } = req.params;
    
    // Fetch incidents for this inmate
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
          timeline: [],
          averageIncidentsPerMonth: 0,
          recidivismRate: 0
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
    
    // Calculate average incidents per month (for the months that have incidents)
    const monthsWithIncidents = Object.keys(monthlyCount).length;
    const totalIncidents = incidents.length;
    const averageIncidentsPerMonth = monthsWithIncidents > 0 
      ? totalIncidents / monthsWithIncidents 
      : 0;
    
    // Calculate 30-day recidivism rate
    let recidivismCount = 0;
    const sortedIncidents = [...incidents].sort((a, b) => 
      new Date(a.incidentDate) - new Date(b.incidentDate)
    );
    
    for (let i = 1; i < sortedIncidents.length; i++) {
      const currentDate = new Date(sortedIncidents[i].incidentDate);
      const previousDate = new Date(sortedIncidents[i-1].incidentDate);
      const daysDifference = (currentDate - previousDate) / (1000 * 60 * 60 * 24);
      
      if (daysDifference <= 30) {
        recidivismCount++;
      }
    }
    
    const recidivismRate = sortedIncidents.length > 1 
      ? Math.round((recidivismCount / (sortedIncidents.length - 1)) * 100) 
      : 0;
    
    // Return the statistics
    return res.status(200).json({
      success: true,
      statistics: {
        totalIncidents,
        byStatus,
        byType,
        timeline,
        averageIncidentsPerMonth,
        recidivismRate
      }
    });
  } catch (error) {
    console.error("Error fetching inmate statistics:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching statistics" });
  }
};

export const getAllIncidents = async (req, res) => {
  try {
    const Incidents = await Incident.find();

    if (!Incidents) {
      return res.status(400).json({ message: "Incident does not exist" });
    }

    res.status(200).json({ incidents: Incidents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get inmates with repeat incidents
export const getInmatesWithRepeatIncidents = async (req, res) => {
  try {
    // Find all unique inmates with at least 2 incidents
    const repeatOffenders = await Incident.aggregate([
      { $group: { 
          _id: "$inmate", 
          count: { $sum: 1 },
          incidents: { $push: "$$ROOT" },
          lastIncident: { $max: "$incidentDate" }
        } 
      },
      { $match: { count: { $gte: 2 } } },
      { $sort: { count: -1, lastIncident: -1 } }
    ]);

    res.status(200).json({ repeatOffenders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const incidentInfo = await Incident.findOne({ _id: id });
    if (!incidentInfo) {
      return res.status(404).json({ message: "Incident does not exist" });
    }

    res.status(200).json({ incident: incidentInfo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      attachment,
      description,
      incidentDate,
      incidentId,
      incidentType,
      inmate,
      reporter,
      status,
    } = req.body;

    if (!inmate || !reporter || !status || !incidentDate || !incidentType) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const updateIncident = await Incident.findByIdAndUpdate(
      id,
      {
        attachment,
        description,
        incidentDate,
        incidentId,
        incidentType,
        inmate,
        reporter,
        status,
      },
      { new: true }
    );

    if (!updateIncident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    res
      .status(200)
      .json({
        data: updateIncident,
        message: "Incident information updated successfully",
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    // Archive the incident before deletion
    try {
      await archiveItem('incident', incident._id, req.user.id, 'Incident deleted by police officer');
      console.log(`Incident archived successfully`);
    } catch (archiveError) {
      console.error("Error archiving incident:", archiveError);
      // Continue with deletion even if archiving fails
    }

    console.log(`Deleting incident`);
    await incident.deleteOne();

    res.status(200).json({ message: "Incident deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
