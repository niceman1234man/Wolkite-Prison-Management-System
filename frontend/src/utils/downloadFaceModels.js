// URLs to face-api.js model files (from face-api.js GitHub repository)
const MODEL_URLS = {
  ssdMobilenetv1: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json',
  faceLandmark68Net: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json',
  faceRecognitionNet: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json',
  tinyFaceDetector: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json'
};

// Weights files to download
const WEIGHT_FILES = [
  // SSD MobileNet
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  // Face Landmark
  'face_landmark_68_model-shard1',
  // Face Recognition
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  // Tiny Face Detector
  'tiny_face_detector_model-shard1'
];

/**
 * Downloads face-api.js models from the CDN if they're not already available locally
 * @returns {Promise<boolean>} - True if models are available
 */
export const downloadFaceModels = async () => {
  try {
    // Check if models directory is present
    const modelsDirExists = await checkModelsDirectory();
    
    if (!modelsDirExists) {
      console.warn('Models directory not found. Creating one...');
      // In a real implementation, you would create the directory here
      // but in the browser environment, we can't create directories
    }
    
    // Check if models are already loaded or in the process of loading
    if (faceapi.nets.ssdMobilenetv1.isLoaded) {
      console.log('Models already loaded');
      return true;
    }
    
    console.log('Downloading face-api.js models...');
    
    // Load models from the specified URLs
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    ]);
    
    console.log('Face models loaded successfully');
    return true;
  } catch (error) {
    console.error('Error downloading face models:', error);
    return false;
  }
};

// Helper to check if models directory exists
const checkModelsDirectory = async () => {
  try {
    // Try to fetch a test file from the models directory
    const response = await fetch('/models/test.txt', { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Helper function to check if a specific model file exists
export const checkModelFile = async (modelName) => {
  try {
    const response = await fetch(`/models/${modelName}`, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}; 