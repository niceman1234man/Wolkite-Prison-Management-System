import { Incident } from "../model/Incident.model.js";
export const addnewIncident = async (req, res) => {
  try {
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
    if (!inmate || !reporter || !incidentType) {
      return res.status(400).json("all fields required");
    }

    const newIncident = new Incident({
      attachment,
      description,
      incidentDate,
      incidentId,
      incidentType,
      inmate,
      reporter,
      status,
    });
    await newIncident.save();

    return res.status(201).json({
      error: false,
      message: "New Incident registered successfully",
    });
  } catch (error) {
    console.log(error);
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

export const getIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const incidentInfo = await Incident.findOne({ _id: id });
    if (!incidentInfo) {
      return res.status(400).json({ message: "Incident does not exist" });
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
