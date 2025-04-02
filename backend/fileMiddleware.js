import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set paths
const uploadPath = path.join(__dirname, 'uploads');
const assetsPath = path.join(__dirname, 'assets');
const defaultAvatarSource = path.join(assetsPath, 'default-avatar.png');
const defaultAvatarDest = path.join(uploadPath, 'default-avatar.png');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log('Uploads directory created at:', uploadPath);
}

// Create assets directory if it doesn't exist
if (!fs.existsSync(assetsPath)) {
  fs.mkdirSync(assetsPath, { recursive: true });
  console.log('Assets directory created at:', assetsPath);
}

// Check if default avatar exists in assets
if (!fs.existsSync(defaultAvatarSource)) {
  console.warn('Default avatar not found in assets folder:', defaultAvatarSource);
  console.warn('Please add a default-avatar.png file to the assets folder');
} else {
  console.log('Default avatar found in assets:', defaultAvatarSource);
  
  // Copy default avatar to uploads folder if it doesn't exist there
  if (!fs.existsSync(defaultAvatarDest)) {
    try {
      fs.copyFileSync(defaultAvatarSource, defaultAvatarDest);
      console.log('Default avatar copied to uploads folder:', defaultAvatarDest);
    } catch (error) {
      console.error('Error copying default avatar:', error);
    }
  } else {
    console.log('Default avatar already exists in uploads folder');
  }
}

// Define storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Export constants and functions
export const DEFAULT_AVATAR = 'default-avatar.png';
export const UPLOADS_PATH = uploadPath;

// Export the multer upload configuration
export const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Helper function to get file path (default or uploaded)
export const getFilePath = (req) => {
  if (req.file) {
    return req.file.path;
  }
  return defaultAvatarDest;
};

// Middleware to ensure a default avatar if none is uploaded
export const ensureDefaultAvatar = (req, res, next) => {
  if (!req.file) {
    // Create a mock file object
    req.file = {
      filename: DEFAULT_AVATAR,
      path: defaultAvatarDest
    };
  }
  next();
};

// Helper function to format user response with full photo URL
export const formatUserPhotoUrl = (user, apiBaseUrl) => {
  if (!user) return user;
  
  // If user is a Mongoose document, get the plain object
  const userData = user.toObject ? user.toObject() : { ...user };
  
  // Add the full photo URL
  if (userData.photo) {
    // Check if it's already a full URL
    if (!userData.photo.startsWith('http')) {
      userData.photo = `${apiBaseUrl}/uploads/${userData.photo}`;
    }
  } else {
    // If no photo, set default
    userData.photo = `${apiBaseUrl}/uploads/${DEFAULT_AVATAR}`;
  }
  
  return userData;
};
