// Add route to get incidents for a specific inmate
router.get('/inmate/:inmateId', incidentController.getInmateIncidents);
 
// Add route to get incident statistics for a specific inmate
router.get('/inmate/:inmateId/statistics', incidentController.getInmateIncidentStatistics); 