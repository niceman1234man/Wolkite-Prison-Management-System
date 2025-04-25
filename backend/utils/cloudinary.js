import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (filePath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    // Get file size
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    console.log(`File size: ${fileSizeInMB.toFixed(2)}MB for file: ${filePath}`);

    // Check file size (max 10MB)
    if (fileSizeInMB > 10) {
      throw new Error(`File size exceeds 10MB limit: ${fileSizeInMB.toFixed(2)}MB`);
    }

    // Log Cloudinary configuration
    console.log("Cloudinary Configuration:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? "API Key exists" : "API Key missing",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "API Secret exists" : "API Secret missing",
    });

    console.log(`Attempting to upload file: ${filePath} to Cloudinary`);
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "woreda-inmates",
      resource_type: "auto",
      timeout: 120000, // Increase timeout to 120 seconds
    });

    console.log(`Upload successful, result:`, {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      resource_type: result.resource_type,
    });

    // Clean up the temporary file
    fs.unlinkSync(filePath);

    return result;
  } catch (error) {
    // More detailed error logging
    console.error("Error uploading to Cloudinary:", {
      message: error.message,
      stack: error.stack,
      error: error.toString(),
      details: error.response?.data || "No additional details",
    });

    // Clean up the temporary file if it exists
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Temporary file removed: ${filePath}`);
      } catch (unlinkError) {
        console.error(`Error removing temporary file: ${unlinkError.message}`);
      }
    }

    if (error.message.includes("File size exceeds")) {
      throw new Error(error.message);
    }
    
    // Include original error details in the thrown error
    throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
  }
};
