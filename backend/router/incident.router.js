import express from 'express'
import { authenticateToken } from '../utilities.js';
import { addnewIncident, deleteIncident, getAllIncidents, getIncident, updateIncident, getIncidentsByInmate, getInmatesWithRepeatIncidents, getInmateIncidentStatistics, getIncidentsByInmateId } from '../controller/incident.controller.js';
import { upload } from '../fileMiddleware.js';
export const incidentRouter=express.Router();
incidentRouter.post('/new-incident', upload.single("attachment") ,authenticateToken,addnewIncident);
incidentRouter.get('/allIncidents',authenticateToken,getAllIncidents);
incidentRouter.get('/get-incident/:id',authenticateToken,getIncident);
incidentRouter.put('/update-incident/:id',authenticateToken,updateIncident);
incidentRouter.delete('/delete-incident/:id',authenticateToken,deleteIncident);
// New endpoints for repeat incidents
incidentRouter.get('/inmate-incidents/:inmate',authenticateToken,getIncidentsByInmate);
incidentRouter.get('/repeat-offenders',authenticateToken,getInmatesWithRepeatIncidents);

// Simple test endpoint that doesn't require authentication
incidentRouter.get('/test', (req, res) => {
  res.status(200).json({ message: "Incident router is working correctly!" });
});

// New endpoints for inmate incidents
incidentRouter.get('/inmate/:inmateId',authenticateToken,getIncidentsByInmate);
incidentRouter.get('/inmate/:inmateId/statistics',authenticateToken,getInmateIncidentStatistics);

// Alternative endpoint that doesn't require authentication (for testing)
incidentRouter.get('/inmate-demo/:inmateId', getIncidentsByInmateId);
