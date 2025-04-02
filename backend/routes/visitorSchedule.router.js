// Visitor capacity management routes
visitorScheduleRouter.get("/capacity", controller.getVisitorCapacity);
visitorScheduleRouter.put("/capacity", controller.updateVisitorCapacity); 