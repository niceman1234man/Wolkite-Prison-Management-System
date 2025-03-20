import Prisoner from "../model/Prisoner.js"; // Import the Prisoner model
import { validationResult } from "express-validator"; // For request validation

/**
 * @desc    Get all prisoners
 * @route   GET /api/prisoner/getall-prisoners
 * @access  Private (Admin, Police Officer, Security Staff)
 */
export const getAllPrisoners = async (req, res) => {
  try {
    const prisoners = await Prisoner.find().populate("cell", "cellNumber"); // Populate cell information
    res.status(200).json({ success: true, prisoners });
  } catch (error) {
    console.error("Error fetching prisoners:", error);
    res.status(500).json({ success: false, error: "Failed to fetch prisoners" });
  }
};

/**
 * @desc    Get a single prisoner by ID
 * @route   GET /api/prisoner/get-prisoner/:id
 * @access  Private (Admin, Police Officer, Security Staff)
 */
export const getPrisonerById = async (req, res) => {
  try {
    const prisoner = await Prisoner.findById(req.params.id).populate(
      "cell",
      "cellNumber"
    );

    if (!prisoner) {
      return res
        .status(404)
        .json({ success: false, error: "Prisoner not found" });
    }

    res.status(200).json({ success: true, prisoner });
  } catch (error) {
    console.error("Error fetching prisoner:", error);
    res.status(500).json({ success: false, error: "Failed to fetch prisoner" });
  }
};

/**
 * @desc    Create a new prisoner
 * @route   POST /api/prisoner/new-prisoner
 * @access  Private (Admin, Police Officer)
 */
export const createPrisoner = async (req, res) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const {
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      gender,
      crime,
      sentenceStart,
      sentenceEnd,
      paroleEligibility,
      medicalConditions,
      riskLevel,
      specialRequirements,
      cell,
    } = req.body;

    // Create a new prisoner
    const prisoner = new Prisoner({
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      gender,
      crime,
      sentenceStart,
      sentenceEnd,
      paroleEligibility,
      medicalConditions,
      riskLevel,
      specialRequirements,
      cell,
    });

    // Save the prisoner to the database
    await prisoner.save();

    res
      .status(201)
      .json({ success: true, message: "Prisoner created successfully", prisoner });
  } catch (error) {
    console.error("Error creating prisoner:", error);
    res.status(500).json({ success: false, error: "Failed to create prisoner" });
  }
};

/**
 * @desc    Update a prisoner by ID
 * @route   PUT /api/prisoner/update-prisoner/:id
 * @access  Private (Admin, Police Officer)
 */
export const updatePrisoner = async (req, res) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const prisoner = await Prisoner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!prisoner) {
      return res
        .status(404)
        .json({ success: false, error: "Prisoner not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Prisoner updated successfully", prisoner });
  } catch (error) {
    console.error("Error updating prisoner:", error);
    res.status(500).json({ success: false, error: "Failed to update prisoner" });
  }
};

/**
 * @desc    Delete a prisoner by ID
 * @route   DELETE /api/prisoner/delete-prisoner/:id
 * @access  Private (Admin)
 */
export const deletePrisoner = async (req, res) => {
  try {
    const prisoner = await Prisoner.findByIdAndDelete(req.params.id);

    if (!prisoner) {
      return res
        .status(404)
        .json({ success: false, error: "Prisoner not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Prisoner deleted successfully" });
  } catch (error) {
    console.error("Error deleting prisoner:", error);
    res.status(500).json({ success: false, error: "Failed to delete prisoner" });
  }
};