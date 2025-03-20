import Transfer from "../model/Transfer.js"; // Import the Transfer model
import Prisoner from "../model/Prisoner.js"; // Import the Prisoner model
import { validationResult } from "express-validator"; // For request validation

/**
 * @desc    Get all transfer requests
 * @route   GET /api/transfer/getall-transfers
 * @access  Private (Admin, Police Officer, Security Staff)
 */
export const getAllTransfers = async (req, res) => {
  try {
    const transfers = await Transfer.find()
      .populate("prisoner", "firstName lastName")
      .populate("fromPrison", "prisonName")
      .populate("toPrison", "prisonName")
      .populate("escortStaff", "firstName lastName")
      .populate("vehicle", "vehicleType licensePlate");

    res.status(200).json({ success: true, transfers });
  } catch (error) {
    console.error("Error fetching transfers:", error);
    res.status(500).json({ success: false, error: "Failed to fetch transfers" });
  }
};

/**
 * @desc    Get a single transfer request by ID
 * @route   GET /api/transfer/get-transfer/:id
 * @access  Private (Admin, Police Officer, Security Staff)
 */
export const getTransferById = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate("prisoner", "firstName lastName")
      .populate("fromPrison", "prisonName")
      .populate("toPrison", "prisonName")
      .populate("escortStaff", "firstName lastName")
      .populate("vehicle", "vehicleType licensePlate");

    if (!transfer) {
      return res
        .status(404)
        .json({ success: false, error: "Transfer not found" });
    }

    res.status(200).json({ success: true, transfer });
  } catch (error) {
    console.error("Error fetching transfer:", error);
    res.status(500).json({ success: false, error: "Failed to fetch transfer" });
  }
};

/**
 * @desc    Create a new transfer request
 * @route   POST /api/transfer/new-transfer
 * @access  Private (Admin, Police Officer)
 */
export const createTransfer = async (req, res) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const {
      prisonerId,
      fromPrisonId,
      toPrisonId,
      escortStaffId,
      vehicleId,
      transferDate,
      reason,
    } = req.body;

    // Check if the prisoner exists
    const prisoner = await Prisoner.findById(prisonerId);
    if (!prisoner) {
      return res
        .status(404)
        .json({ success: false, error: "Prisoner not found" });
    }

    // Create a new transfer request
    const transfer = new Transfer({
      prisoner: prisonerId,
      fromPrison: fromPrisonId,
      toPrison: toPrisonId,
      escortStaff: escortStaffId,
      vehicle: vehicleId,
      transferDate,
      reason,
      status: "Pending", // Default status
    });

    // Save the transfer request to the database
    await transfer.save();

    res
      .status(201)
      .json({ success: true, message: "Transfer request created successfully", transfer });
  } catch (error) {
    console.error("Error creating transfer:", error);
    res.status(500).json({ success: false, error: "Failed to create transfer" });
  }
};

/**
 * @desc    Update a transfer request by ID
 * @route   PUT /api/transfer/update-transfer/:id
 * @access  Private (Admin, Police Officer)
 */
export const updateTransfer = async (req, res) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const transfer = await Transfer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!transfer) {
      return res
        .status(404)
        .json({ success: false, error: "Transfer not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Transfer request updated successfully", transfer });
  } catch (error) {
    console.error("Error updating transfer:", error);
    res.status(500).json({ success: false, error: "Failed to update transfer" });
  }
};

/**
 * @desc    Delete a transfer request by ID
 * @route   DELETE /api/transfer/delete-transfer/:id
 * @access  Private (Admin)
 */
export const deleteTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findByIdAndDelete(req.params.id);

    if (!transfer) {
      return res
        .status(404)
        .json({ success: false, error: "Transfer not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Transfer request deleted successfully" });
  } catch (error) {
    console.error("Error deleting transfer:", error);
    res.status(500).json({ success: false, error: "Failed to delete transfer" });
  }
};