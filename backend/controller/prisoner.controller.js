import { Prisoner } from "../model/Prisoner.js";
import multer from "multer";
import path from "path";

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Register new prisoner
export const registerPrisoner = async (req, res) => {
  try {
    const prisonerData = req.body;
    const files = req.files;

    // Handle file uploads
    const documentUrls = files ? files.map((file) => file.path) : [];

    // Create new prisoner with document URLs
    const newPrisoner = new Prisoner({
      ...prisonerData,
      documents: documentUrls,
      paroleEligibility: prisonerData.paroleEligibility === "true",
    });

    await newPrisoner.save();
    res.status(201).json({
      success: true,
      message: "Prisoner registered successfully",
      prisoner: newPrisoner,
    });
  } catch (error) {
    console.error("Error registering prisoner:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to register prisoner",
    });
  }
};

// Get all prisoners
export const getAllPrisoners = async (req, res) => {
  try {
    const prisoners = await Prisoner.find();
    res.status(200).json({
      success: true,
      inmates: prisoners,
    });
  } catch (error) {
    console.error("Error fetching prisoners:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch prisoners",
    });
  }
};

// Get single prisoner by ID
export const getPrisonerById = async (req, res) => {
  try {
    const prisoner = await Prisoner.findById(req.params.id);
    if (!prisoner) {
      return res.status(404).json({
        success: false,
        error: "Prisoner not found",
      });
    }
    res.status(200).json({
      success: true,
      prisoner,
    });
  } catch (error) {
    console.error("Error fetching prisoner:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch prisoner",
    });
  }
};

// Update prisoner
export const updatePrisoner = async (req, res) => {
  try {
    const prisoner = await Prisoner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!prisoner) {
      return res.status(404).json({
        success: false,
        error: "Prisoner not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Prisoner updated successfully",
      prisoner,
    });
  } catch (error) {
    console.error("Error updating prisoner:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update prisoner",
    });
  }
};

// Delete prisoner
export const deletePrisoner = async (req, res) => {
  try {
    const prisoner = await Prisoner.findByIdAndDelete(req.params.id);
    if (!prisoner) {
      return res.status(404).json({
        success: false,
        error: "Prisoner not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Prisoner deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting prisoner:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete prisoner",
    });
  }
};
