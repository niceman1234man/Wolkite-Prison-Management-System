import { WoredaInmate } from "../model/woredaInmate.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

// Register new inmate
export const registerWoredaInmate = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    console.log("Received files:", req.files);

    const inmateData = req.body;
    const files = req.files;

    // Validate required fields
    const requiredFields = [
      "firstName",
      "middleName",
      "lastName",
      "dateOfBirth",
      "gender",
      "crime",
      "sentenceStart",
      "sentenceEnd",
      "riskLevel",
      "intakeDate",
      "arrestingOfficer",
      "holdingCell",
    ];

    const missingFields = requiredFields.filter((field) => !inmateData[field]);
    if (missingFields.length > 0) {
      console.log("Missing required fields:", missingFields);
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Upload documents to Cloudinary if files exist
    let documentUrls = [];
    if (files && files.length > 0) {
      try {
        documentUrls = await Promise.all(
          files.map(async (file) => {
            try {
              const result = await uploadToCloudinary(file.path);
              return result.secure_url;
            } catch (uploadError) {
              console.error(
                `Error uploading file ${file.originalname}:`,
                uploadError
              );
              throw new Error(
                `Failed to upload ${file.originalname}: ${uploadError.message}`
              );
            }
          })
        );
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          error: uploadError.message || "Failed to upload files",
        });
      }
    }

    // Create new inmate with document URLs
    const newInmate = new WoredaInmate({
      ...inmateData,
      documents: documentUrls,
      status: "Active",
    });

    console.log("Creating new inmate with data:", newInmate);

    await newInmate.save();

    res.status(201).json({
      success: true,
      message: "Inmate registered successfully",
      inmate: newInmate,
    });
  } catch (error) {
    console.error("Error registering inmate:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to register inmate",
    });
  }
};

// Get all inmates
export const getAllWoredaInmates = async (req, res) => {
  try {
    const inmates = await WoredaInmate.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      inmates,
    });
  } catch (error) {
    console.error("Error fetching inmates:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch inmates",
    });
  }
};

// Get single inmate
export const getWoredaInmateById = async (req, res) => {
  try {
    const inmate = await WoredaInmate.findById(req.params.id);

    if (!inmate) {
      return res.status(404).json({
        success: false,
        error: "Inmate not found",
      });
    }

    res.status(200).json({
      success: true,
      inmate,
    });
  } catch (error) {
    console.error("Error fetching inmate:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch inmate",
    });
  }
};

// Update inmate
export const updateWoredaInmate = async (req, res) => {
  try {
    const inmateData = req.body;
    const files = req.files;

    let documentUrls = [];
    if (files && files.length > 0) {
      documentUrls = await Promise.all(
        files.map(async (file) => {
          const result = await uploadToCloudinary(file.path);
          return result.secure_url;
        })
      );
    }

    const inmate = await WoredaInmate.findByIdAndUpdate(
      req.params.id,
      {
        ...inmateData,
        ...(documentUrls.length > 0 && { documents: documentUrls }),
      },
      { new: true, runValidators: true }
    );

    if (!inmate) {
      return res.status(404).json({
        success: false,
        error: "Inmate not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Inmate updated successfully",
      inmate,
    });
  } catch (error) {
    console.error("Error updating inmate:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update inmate",
    });
  }
};

// Delete inmate
export const deleteWoredaInmate = async (req, res) => {
  try {
    const inmate = await WoredaInmate.findByIdAndDelete(req.params.id);

    if (!inmate) {
      return res.status(404).json({
        success: false,
        error: "Inmate not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Inmate deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting inmate:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete inmate",
    });
  }
};
