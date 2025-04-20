import { WoredaInmate } from "../model/woredaInmate.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

// Register new inmate
export const registerWoredaInmate = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    console.log("Received files:", req.files ? req.files.length : 0);

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
        console.log(`Attempting to upload ${files.length} files`);
        
        // Process files one by one to better handle errors
        for (const file of files) {
          try {
            console.log(`Processing file: ${file.originalname}, size: ${file.size} bytes, path: ${file.path}`);
            
            // Check if the file exists
            if (!fs.existsSync(file.path)) {
              console.error(`File not found at path: ${file.path}`);
              continue;
            }
            
            const result = await uploadToCloudinary(file.path);
            console.log(`Successfully uploaded ${file.originalname} to Cloudinary: ${result.secure_url}`);
            documentUrls.push(result.secure_url);
          } catch (fileError) {
            console.error(`Error uploading file ${file.originalname}:`, fileError);
            // Don't throw here - continue with other files and log the error
          }
        }
        
        if (documentUrls.length === 0 && files.length > 0) {
          return res.status(400).json({
            success: false,
            error: "Failed to upload any of the provided files",
          });
        }
      } catch (uploadError) {
        console.error("Error in bulk file processing:", uploadError);
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

    console.log("Creating new inmate with data:", {
      ...newInmate.toObject(),
      documents: documentUrls.length ? `${documentUrls.length} documents uploaded` : "No documents",
    });

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

// Release inmate
export const releaseInmate = async (req, res) => {
  try {
    const { id } = req.params;
    const { releaseReason } = req.body;
    
    // Find inmate
    const inmate = await WoredaInmate.findById(id);
    
    if (!inmate) {
      return res.status(404).json({
        success: false,
        error: "Inmate not found",
      });
    }
    
    // Check if inmate has an approved or under review transfer
    if (inmate.transferStatus) {
      const status = typeof inmate.transferStatus === 'string' 
        ? inmate.transferStatus.toLowerCase() 
        : (inmate.transferStatus.status || '').toLowerCase();
      
      if (status.includes('approve') || status.includes('review')) {
        return res.status(400).json({
          success: false,
          error: "Cannot release an inmate with an approved or under review transfer",
        });
      }
    }
    
    // Update inmate status to Released
    inmate.status = "Released";
    inmate.releaseDate = new Date();
    inmate.releaseReason = releaseReason || "Sentence completed";
    
    await inmate.save();
    
    res.status(200).json({
      success: true,
      message: "Inmate released successfully",
      inmate,
    });
  } catch (error) {
    console.error("Error releasing inmate:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to release inmate",
    });
  }
};
