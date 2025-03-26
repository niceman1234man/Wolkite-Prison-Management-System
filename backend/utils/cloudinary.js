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
      throw new Error("File not found");
    }

    // Get file size
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);

    // Check file size (max 10MB)
    if (fileSizeInMB > 10) {
      throw new Error("File size exceeds 10MB limit");
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: "woreda-inmates",
      resource_type: "auto",
      timeout: 60000, // 60 second timeout
    });

    // Clean up the temporary file
    fs.unlinkSync(filePath);

    return result;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);

    // Clean up the temporary file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    if (error.message.includes("File size exceeds")) {
      throw new Error(error.message);
    }
    throw new Error("Failed to upload file to Cloudinary");
  }
};
