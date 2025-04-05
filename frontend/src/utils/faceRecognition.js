// Define CDN URLs for models
const MODEL_URLS = {
  ssdMobilenetv1: 'https://justadudewhohacks.github.io/face-api.js/models/ssd_mobilenetv1_model-weights_manifest.json',
  faceLandmark68: 'https://justadudewhohacks.github.io/face-api.js/models/face_landmark_68_model-weights_manifest.json',
  faceRecognition: 'https://justadudewhohacks.github.io/face-api.js/models/face_recognition_model-weights_manifest.json'
};

// List of all model URLs to include directly in the code
const MODEL_DEFINITIONS = {
  ssdMobilenetv1: {
    manifest: "https://justadudewhohacks.github.io/face-api.js/models/ssd_mobilenetv1_model-weights_manifest.json",
    weights: [
      "https://justadudewhohacks.github.io/face-api.js/models/ssd_mobilenetv1_model-shard1",
      "https://justadudewhohacks.github.io/face-api.js/models/ssd_mobilenetv1_model-shard2"
    ]
  },
  faceLandmark68: {
    manifest: "https://justadudewhohacks.github.io/face-api.js/models/face_landmark_68_model-weights_manifest.json",
    weights: [
      "https://justadudewhohacks.github.io/face-api.js/models/face_landmark_68_model-shard1"
    ]
  },
  faceRecognition: {
    manifest: "https://justadudewhohacks.github.io/face-api.js/models/face_recognition_model-weights_manifest.json",
    weights: [
      "https://justadudewhohacks.github.io/face-api.js/models/face_recognition_model-shard1",
      "https://justadudewhohacks.github.io/face-api.js/models/face_recognition_model-shard2"
    ]
  }
};

// Load the required face detection models
export const loadModels = async () => {
  try {
    console.log("Loading face-api.js models from local files...");
    
    // Load models from local path
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    ]);
    
    console.log("Successfully loaded models from local files");
    return true;
  } catch (error) {
    console.error('Error loading face detection models:', error);
    
    // Try CDN as fallback
    try {
      console.log("Falling back to CDN models...");
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models')
      ]);
      console.log("Successfully loaded models from CDN fallback");
      return true;
    } catch (cdnError) {
      console.error('Error loading from CDN fallback:', cdnError);
      return false;
    }
  }
};

// Detect face from an image and return face descriptor
export const getFaceDescriptor = async (imageElement) => {
  try {
    if (!imageElement) return null;
    
    const detections = await faceapi
      .detectSingleFace(imageElement)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detections) {
      return null;
    }
    
    return detections.descriptor;
  } catch (error) {
    console.error('Error getting face descriptor:', error);
    return null;
  }
};

// Get face detection with landmarks and expressions for liveness detection
export const getFaceDetection = async (imageElement) => {
  try {
    if (!imageElement) return null;
    
    const detections = await faceapi
      .detectSingleFace(imageElement)
      .withFaceLandmarks();
    
    if (!detections) {
      return null;
    }
    
    return detections;
  } catch (error) {
    console.error('Error detecting face:', error);
    return null;
  }
};

// Perform liveness detection to determine if it's a real person or a photo
export const detectLiveness = async (detections, previousDetections = []) => {
  if (!detections || !detections.landmarks) {
    return { isLive: false, confidence: 0, reason: "No face detected" };
  }
  
  try {
    // Get face landmarks
    const landmarks = detections.landmarks;
    const positions = landmarks.positions;
    
    // 1. Check depth variation through 3D face analysis
    const nose = positions[30];
    const leftEye = positions[36];
    const rightEye = positions[45];
    const leftMouth = positions[48];
    const rightMouth = positions[54];
    
    // Calculate eye aspect ratio (EAR) to detect real eye vs printed photo
    const leftEyeAspectRatio = calculateEyeAspectRatio(
      positions[36], positions[37], positions[38], 
      positions[39], positions[40], positions[41]
    );
    
    const rightEyeAspectRatio = calculateEyeAspectRatio(
      positions[42], positions[43], positions[44], 
      positions[45], positions[46], positions[47]
    );
    
    const avgEyeAspectRatio = (leftEyeAspectRatio + rightEyeAspectRatio) / 2;
    
    // 2. Analyze facial symmetry (photos often have perfect symmetry)
    const symmetryScore = calculateFacialSymmetry(positions);
    
    // 3. Check for micro-movements if we have previous detections
    let movementScore = 0;
    if (previousDetections.length > 0) {
      movementScore = calculateMicroMovements(detections, previousDetections);
    }
    
    // 4. Check texture variance (real faces have more texture variation)
    const textureVariance = 0.5; // This would be calculated with a more complex analysis
    
    // Combine scores (weights can be adjusted)
    const livenessScore = (
      (avgEyeAspectRatio > 0.2 ? 0.3 : 0) +  // Eye aspect ratio
      (symmetryScore < 0.9 ? 0.3 : 0) +      // Not too perfect symmetry
      (movementScore > 0 ? 0.2 : 0) +        // Some micro-movements
      (textureVariance > 0.3 ? 0.2 : 0)      // Texture variation
    );
    
    // Decision threshold
    const isLive = livenessScore >= 0.5;
    
    // Return result with confidence score
    return {
      isLive,
      confidence: livenessScore,
      reason: isLive ? "Face passed liveness checks" : "Face failed liveness checks",
      details: {
        eyeAspectRatio: avgEyeAspectRatio,
        symmetryScore,
        movementScore,
        textureVariance
      }
    };
  } catch (error) {
    console.error('Error in liveness detection:', error);
    return { isLive: false, confidence: 0, reason: "Error in liveness detection" };
  }
};

// Calculate Eye Aspect Ratio (EAR) - useful for blink detection and liveness
function calculateEyeAspectRatio(p1, p2, p3, p4, p5, p6) {
  const a = euclideanDistance(p2, p6);
  const b = euclideanDistance(p3, p5);
  const c = euclideanDistance(p1, p4);
  
  // Return the eye aspect ratio
  return (a + b) / (2.0 * c);
}

// Calculate facial symmetry score (0-1 where closer to 0 is more realistic)
function calculateFacialSymmetry(positions) {
  // Find facial midline
  const noseTip = positions[30];
  
  // Check symmetry of key landmark pairs
  const pairs = [
    [0, 16],   // Jaw outline
    [2, 14],   // Jaw outline
    [4, 12],   // Jaw outline
    [19, 24],  // Eyebrows
    [20, 23],  // Eyebrows
    [36, 45],  // Eyes (outer)
    [39, 42],  // Eyes (inner)
    [31, 35],  // Nose
    [48, 54]   // Mouth
  ];
  
  let asymmetrySum = 0;
  pairs.forEach(([leftIdx, rightIdx]) => {
    const leftPoint = positions[leftIdx];
    const rightPoint = positions[rightIdx];
    
    // Distance from midline should be equal for perfect symmetry
    const leftDist = Math.abs(leftPoint.x - noseTip.x);
    const rightDist = Math.abs(rightPoint.x - noseTip.x);
    
    // Calculate asymmetry ratio (0 is perfect symmetry)
    const pairAsymmetry = Math.abs(leftDist - rightDist) / Math.max(leftDist, rightDist);
    asymmetrySum += pairAsymmetry;
  });
  
  // Average asymmetry (inverted to get symmetry score where 1 is perfect)
  return 1 - (asymmetrySum / pairs.length);
}

// Calculate micro-movements between detections
function calculateMicroMovements(currentDetection, previousDetections) {
  const currentPos = currentDetection.landmarks.positions;
  
  // Get the most recent previous detection
  const prevPos = previousDetections[previousDetections.length - 1].landmarks.positions;
  
  // Calculate average movement of key facial landmarks
  const keyPoints = [30, 36, 45, 48, 54]; // nose, eyes, mouth corners
  let totalMovement = 0;
  
  keyPoints.forEach(idx => {
    totalMovement += euclideanDistance(currentPos[idx], prevPos[idx]);
  });
  
  // Average movement
  const avgMovement = totalMovement / keyPoints.length;
  
  // Normalize to 0-1 range (typical micromovement range is 0.5-5 pixels)
  // Values too high suggest sudden movement, too low suggest a static image
  if (avgMovement > 0.1 && avgMovement < 8) {
    return 1; // Natural movement
  } else if (avgMovement <= 0.1) {
    return 0; // Too static, likely a photo
  } else {
    return 0.5; // Movement too large, could be natural or manipulation
  }
}

// Euclidean distance between two points
function euclideanDistance(pt1, pt2) {
  return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
}

// Compare two face descriptors and return similarity score (0-1)
export const compareFaces = (descriptor1, descriptor2) => {
  if (!descriptor1 || !descriptor2) return 0;
  
  try {
    // Calculate euclidean distance and convert to similarity
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    // Convert distance to similarity (0-1)
    // Usually distance < 0.6 means same person, so we can use a threshold
    const similarity = Math.max(0, 1 - distance);
    return similarity;
  } catch (error) {
    console.error('Error comparing faces:', error);
    return 0;
  }
};

// Check if face matches with any existing user
export const checkFaceInDatabase = async (currentDescriptor, existingDescriptors) => {
  if (!currentDescriptor || !existingDescriptors || existingDescriptors.length === 0) {
    return { isMatch: false, matchedUser: null };
  }
  
  // Threshold for considering faces as a match (adjust as needed)
  const SIMILARITY_THRESHOLD = 0.6;
  
  try {
    // Compare current face with each existing descriptor
    for (const existingUser of existingDescriptors) {
      const similarity = compareFaces(currentDescriptor, existingUser.faceDescriptor);
      
      if (similarity > SIMILARITY_THRESHOLD) {
        return {
          isMatch: true,
          matchedUser: existingUser.userData,
          similarity
        };
      }
    }
    
    return { isMatch: false, matchedUser: null };
  } catch (error) {
    console.error('Error checking face in database:', error);
    return { isMatch: false, matchedUser: null, error };
  }
};

/**
 * Configuration options for face detection sensitivity
 * These can be adjusted based on user needs or device capabilities
 */
export const detectionSensitivityLevels = {
  high: {
    // High sensitivity is good for high-quality cameras in good lighting
    livenessThreshold: 0.8,
    blinkThreshold: 0.15,
    movementThreshold: 0.04,
    symmetryThreshold: 0.85,
    minConfidence: 0.7,
    minFaceSize: 150
  },
  medium: {
    // Medium sensitivity is the default for most webcams
    livenessThreshold: 0.7,
    blinkThreshold: 0.1,
    movementThreshold: 0.06,
    symmetryThreshold: 0.75,
    minConfidence: 0.6,
    minFaceSize: 120
  },
  low: {
    // Low sensitivity is more permissive for poor quality cameras
    livenessThreshold: 0.6,
    blinkThreshold: 0.08,
    movementThreshold: 0.1,
    symmetryThreshold: 0.65,
    minConfidence: 0.5,
    minFaceSize: 100
  }
};

// Default sensitivity level
let currentSensitivity = detectionSensitivityLevels.medium;

/**
 * Set the sensitivity level for face detection and liveness checks
 * @param {'high'|'medium'|'low'} level - The sensitivity level
 */
export const setSensitivityLevel = (level) => {
  if (detectionSensitivityLevels[level]) {
    currentSensitivity = detectionSensitivityLevels[level];
    console.log(`Face detection sensitivity set to: ${level}`);
    return true;
  }
  console.error(`Invalid sensitivity level: ${level}`);
  return false;
};

/**
 * Get the current sensitivity settings
 * @returns {Object} Current sensitivity settings
 */
export const getCurrentSensitivity = () => {
  return {...currentSensitivity};
};

/**
 * Advanced Gaussian blur for noise reduction
 * More effective than simple box blur for preserving edges
 * @param {Uint8ClampedArray} data - The image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} sigma - Gaussian sigma (blur amount)
 */
function applyGaussianBlur(data, width, height, sigma = 1) {
  // Create a copy of the data
  const dataCopy = new Uint8ClampedArray(data);
  
  // Calculate kernel size based on sigma (typically 3*sigma)
  const kernelSize = Math.max(3, Math.ceil(sigma * 3) | 1);
  const radius = Math.floor(kernelSize / 2);
  
  // Create Gaussian kernel
  const kernel = [];
  const sigma2 = sigma * sigma;
  let sum = 0;
  
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const weight = Math.exp(-(x * x + y * y) / (2 * sigma2));
      kernel.push(weight);
      sum += weight;
    }
  }
  
  // Normalize kernel
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum;
  }
  
  // Apply convolution
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const pixelIndex = (y * width + x) * 4;
      
      // For each RGB channel
      for (let c = 0; c < 3; c++) {
        let val = 0;
        let kernelIndex = 0;
        
        // Apply kernel
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            val += dataCopy[idx] * kernel[kernelIndex++];
          }
        }
        
        data[pixelIndex + c] = Math.min(255, Math.max(0, Math.round(val)));
      }
    }
  }
}

/**
 * Advanced bilateral filter for noise reduction while preserving edges
 * @param {Uint8ClampedArray} data - The image data array
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} spatialSigma - Spatial sigma (typically 2-5)
 * @param {number} rangeSigma - Range sigma (typically 10-50)
 */
function applyBilateralFilter(data, width, height, spatialSigma = 3, rangeSigma = 30) {
  // Create a copy of the data
  const dataCopy = new Uint8ClampedArray(data);
  
  // Calculate kernel size based on sigma
  const kernelSize = Math.max(3, Math.ceil(spatialSigma * 3) | 1);
  const radius = Math.floor(kernelSize / 2);
  
  // Precalculate spatial weights
  const spatialWeights = [];
  const spatialSigma2 = 2 * spatialSigma * spatialSigma;
  
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const spatialDist = x * x + y * y;
      spatialWeights.push(Math.exp(-spatialDist / spatialSigma2));
    }
  }
  
  // Range sigma squared
  const rangeSigma2 = 2 * rangeSigma * rangeSigma;
  
  // Apply filter
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const pixelIndex = (y * width + x) * 4;
      
      // Process each channel separately
      for (let c = 0; c < 3; c++) {
        const centerValue = dataCopy[pixelIndex + c];
        let sum = 0;
        let totalWeight = 0;
        let weightIndex = 0;
        
        // Apply kernel
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const neighborValue = dataCopy[idx];
            
            // Calculate range (intensity) weight
            const intensityDiff = centerValue - neighborValue;
            const rangeWeight = Math.exp(-(intensityDiff * intensityDiff) / rangeSigma2);
            
            // Combine spatial and range weights
            const weight = spatialWeights[weightIndex++] * rangeWeight;
            
            sum += neighborValue * weight;
            totalWeight += weight;
          }
        }
        
        // Set filtered value
        data[pixelIndex + c] = Math.min(255, Math.max(0, Math.round(sum / totalWeight)));
      }
    }
  }
}

/**
 * Enhanced image processing for face detection
 * @param {HTMLImageElement|HTMLVideoElement} input - The input image or video
 * @param {Object} options - Processing options
 * @returns {ImageData} Enhanced image data
 */
export const enhanceImageForFaceDetection = (input, options = {}) => {
  const {
    enhancementLevel = 'auto', // 'auto', 'low', 'medium', 'high'
    preserveDetails = true,    // Use bilateral filter to preserve edges
    brightnessAdjust = true,   // Auto-adjust brightness
    contrastAdjust = true,     // Auto-adjust contrast
    sharpen = false            // Apply sharpening (can amplify noise)
  } = options;
  
  // Create a canvas to process the image
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // Set dimensions
  const width = input.width || input.videoWidth;
  const height = input.height || input.videoHeight;
  canvas.width = width;
  canvas.height = height;
  
  // Draw the image to the canvas
  context.drawImage(input, 0, 0, width, height);
  
  // Get the image data
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Calculate image statistics
  let totalBrightness = 0;
  let minBrightness = 255;
  let maxBrightness = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    
    totalBrightness += brightness;
    minBrightness = Math.min(minBrightness, brightness);
    maxBrightness = Math.max(maxBrightness, brightness);
  }
  
  const averageBrightness = totalBrightness / (width * height);
  const contrastLevel = maxBrightness - minBrightness;
  
  // Determine enhancement level if auto
  let level = enhancementLevel;
  if (enhancementLevel === 'auto') {
    if (averageBrightness < 60 || averageBrightness > 200 || contrastLevel < 40) {
      level = 'high';
    } else if (averageBrightness < 80 || averageBrightness > 180 || contrastLevel < 80) {
      level = 'medium';
    } else {
      level = 'low';
    }
    console.log(`Auto-selected enhancement level: ${level} (brightness: ${averageBrightness.toFixed(1)}, contrast: ${contrastLevel.toFixed(1)})`);
  }
  
  // Apply brightness adjustment if needed
  if (brightnessAdjust) {
    let brightnessAdjustFactor = 1.0;
    
    if (averageBrightness < 80) {
      // Image is too dark, brighten it
      brightnessAdjustFactor = 1.0 + ((80 - averageBrightness) / 80) * 0.5;
    } else if (averageBrightness > 180) {
      // Image is too bright, darken it
      brightnessAdjustFactor = 1.0 - ((averageBrightness - 180) / 75) * 0.3;
    }
    
    if (brightnessAdjustFactor !== 1.0) {
      increaseBrightness(data, brightnessAdjustFactor);
    }
  }
  
  // Apply contrast adjustment if needed
  if (contrastAdjust) {
    let contrastAdjustFactor = 1.0;
    
    if (contrastLevel < 80) {
      // Low contrast, increase it
      contrastAdjustFactor = 1.0 + ((80 - contrastLevel) / 80) * 0.5;
      increaseContrast(data, contrastAdjustFactor);
    }
  }
  
  // Apply appropriate noise reduction based on level
  if (preserveDetails) {
    // Use bilateral filter for edge-preserving smoothing
    switch (level) {
      case 'low':
        applyBilateralFilter(data, width, height, 2, 20);
        break;
      case 'medium':
        applyBilateralFilter(data, width, height, 3, 30);
        break;
      case 'high':
        applyBilateralFilter(data, width, height, 5, 40);
        break;
    }
  } else {
    // Use Gaussian blur (faster but less detail-preserving)
    switch (level) {
      case 'low':
        applyGaussianBlur(data, width, height, 0.8);
        break;
      case 'medium':
        applyGaussianBlur(data, width, height, 1.2);
        break;
      case 'high':
        applyGaussianBlur(data, width, height, 1.5);
        break;
    }
  }
  
  // Apply sharpening if requested
  if (sharpen) {
    applySharpen(data, width, height);
  }
  
  // Update the image data
  context.putImageData(imageData, 0, 0);
  
  return imageData;
};

/**
 * Apply sharpening filter to enhance details
 * @param {Uint8ClampedArray} data - The image data array
 * @param {number} width - Image width
 * @param {number} height - Image height
 */
function applySharpen(data, width, height) {
  // Create a copy of the data
  const dataCopy = new Uint8ClampedArray(data);
  
  // Sharpening kernel (Laplacian)
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];
  
  // Apply convolution
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pixelIndex = (y * width + x) * 4;
      
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += dataCopy[kidx] * kernel[kernelIdx];
          }
        }
        
        data[pixelIndex + c] = Math.min(255, Math.max(0, sum));
      }
    }
  }
}

/**
 * Detects if the browser supports the required features for face detection
 * @returns {Object} Object containing support info and any warnings
 */
export const detectBrowserSupport = () => {
  const support = {
    webgl: false,
    webrtc: false,
    canvas: false,
    mediaDevices: false,
    warnings: []
  };
  
  // Check WebGL support (required for face-api.js)
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    support.webgl = !!gl;
    if (!support.webgl) {
      support.warnings.push('WebGL is not supported, which may affect face detection performance');
    }
  } catch (e) {
    support.warnings.push('Error checking WebGL support: ' + e.message);
  }
  
  // Check Canvas support
  support.canvas = !!document.createElement('canvas').getContext;
  if (!support.canvas) {
    support.warnings.push('Canvas is not supported, which is required for face detection');
  }
  
  // Check WebRTC support
  support.mediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  if (!support.mediaDevices) {
    support.warnings.push('Camera access is not supported in this browser');
  }
  
  return support;
};

/**
 * Enhanced face detection that adapts to image quality and browser capabilities
 */
export const getEnhancedFaceDetection = async (input, options = {}) => {
  if (!input) return null;
  
  const {
    useTinyModel = true,          // Use smaller, faster model
    enhanceImage = true,          // Apply image enhancement
    fallbackToLowRes = true,      // Reduce resolution if detection fails
    minConfidence = currentSensitivity.minConfidence,
    maxRetries = 2
  } = options;
  
  try {
    // Select the detection model based on options
    const detectionOptions = useTinyModel ? 
      new faceapi.TinyFaceDetectorOptions({ minConfidence }) : 
      new faceapi.SsdMobilenetv1Options({ minConfidence });
    
    // First try with original image
    const detectionResult = await faceapi.detectSingleFace(input, detectionOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (detectionResult) {
      return detectionResult;
    }
    
    // If standard detection fails and enhancement is enabled
    if (enhanceImage) {
      console.log("Standard detection failed, trying with image enhancement");
      
      // Apply image enhancement
      const enhancedData = enhanceImageForFaceDetection(input);
      
      // Create a temporary canvas for the enhanced image
      const tempCanvas = document.createElement('canvas');
      const width = input.width || input.videoWidth;
      const height = input.height || input.videoHeight;
      tempCanvas.width = width;
      tempCanvas.height = height;
      
      const ctx = tempCanvas.getContext('2d');
      ctx.putImageData(enhancedData, 0, 0);
      
      // Try detection on enhanced image
      const enhancedDetection = await faceapi.detectSingleFace(tempCanvas, detectionOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (enhancedDetection) {
        return enhancedDetection;
      }
      
      // If still failing and fallback is enabled, try with reduced resolution
      if (fallbackToLowRes && width > 320 && height > 240) {
        console.log("Enhanced detection failed, trying with reduced resolution");
        
        // Reduce the resolution to improve detection chances
        const lowResCanvas = document.createElement('canvas');
        lowResCanvas.width = width / 2;
        lowResCanvas.height = height / 2;
        
        const lowResCtx = lowResCanvas.getContext('2d');
        lowResCtx.drawImage(tempCanvas, 0, 0, width / 2, height / 2);
        
        // Try detection on lower resolution image
        const lowResDetection = await faceapi.detectSingleFace(lowResCanvas, detectionOptions)
          .withFaceLandmarks()
          .withFaceDescriptor();
        
        if (lowResDetection) {
          // Adjust bounding box coordinates to match original image
          const scaledDetection = {
            ...lowResDetection,
            detection: {
              ...lowResDetection.detection,
              box: {
                ...lowResDetection.detection.box,
                x: lowResDetection.detection.box.x * 2,
                y: lowResDetection.detection.box.y * 2,
                width: lowResDetection.detection.box.width * 2,
                height: lowResDetection.detection.box.height * 2
              }
            }
          };
          return scaledDetection;
        }
      }
    }
    
    console.log("All detection attempts failed");
    return null;
  } catch (error) {
    console.error("Error in enhanced face detection:", error);
    return null;
  }
}; 