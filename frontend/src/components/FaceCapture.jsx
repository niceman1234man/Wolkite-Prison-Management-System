import React, { useRef, useState, useEffect } from 'react';
import { loadModels, getFaceDescriptor, getFaceDetection, detectLiveness, getEnhancedFaceDetection, setSensitivityLevel, getCurrentSensitivity, detectBrowserSupport } from '../utils/faceRecognition';
import { toast } from 'react-hot-toast';
import FaceTutorial from './FaceTutorial';

const FaceCapture = ({ onFaceDetected, onError }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelLoadingError, setModelLoadingError] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [facesDetected, setFacesDetected] = useState([]);
  const [faceDetections, setFaceDetections] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState(null);
  const [performingLivenessCheck, setPerformingLivenessCheck] = useState(false);
  const [livenessScore, setLivenessScore] = useState(null);
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [prompt, setPrompt] = useState('');
  const hasLoadedModels = useRef(false);
  
  // Live detection settings
  const livenessFrameCount = 10;
  const livenessCheckInterval = useRef(null);
  const frameBuffer = useRef([]);

  const [autoCapture, setAutoCapture] = useState(true);
  const [captureQuality, setCaptureQuality] = useState('medium');
  const [detectionStability, setDetectionStability] = useState(0);
  const stableDetectionThreshold = 5; // Number of stable frames needed before auto-capture
  const stablePositionHistory = useRef([]);
  const processingTimeoutRef = useRef(null);
  const [faceStability, setFaceStability] = useState(0);
  
  // Add new state variables
  const [showTutorial, setShowTutorial] = useState(false);
  const [sensitivityLevel, setSensitivityLevel] = useState('medium');
  const [browserSupport, setBrowserSupport] = useState(null);
  const [hasDismissedWarnings, setHasDismissedWarnings] = useState(false);
  const isFirstVisit = useRef(localStorage.getItem('face_tutorial_shown') !== 'true');
  
  // Adaptive settings based on camera quality
  const getQualitySettings = () => {
    switch (captureQuality) {
      case 'low':
        return {
          detectionInterval: 500, // ms between detections
          minSize: 100, // minimum face size to detect
          detectionThreshold: 0.5, // confidence threshold
          blurTolerance: 30, // higher tolerance for blur
          brightnessMin: 50, // lower brightness requirement
          brightnessMax: 220,
          stabilityThreshold: 0.15, // more tolerance for position changes
        };
      case 'high':
        return {
          detectionInterval: 200,
          minSize: 150,
          detectionThreshold: 0.7,
          blurTolerance: 10,
          brightnessMin: 90,
          brightnessMax: 200,
          stabilityThreshold: 0.05,
        };
      default: // medium
        return {
          detectionInterval: 300,
          minSize: 120,
          detectionThreshold: 0.6,
          blurTolerance: 20,
          brightnessMin: 70,
          brightnessMax: 210,
          stabilityThreshold: 0.1,
        };
    }
  };

  // Function to auto-detect optimal quality settings
  const detectOptimalQuality = () => {
    if (!videoRef.current) return;
    
    const startTime = performance.now();
    const testDetection = async () => {
      try {
        if (videoRef.current) {
          const detection = await getFaceDetection(videoRef.current);
          const endTime = performance.now();
          const detectionTime = endTime - startTime;
          
          // Determine camera quality based on detection time and result
          if (!detection) {
            setCaptureQuality('low');
          } else if (detectionTime > 300) {
            setCaptureQuality('low');
          } else if (detectionTime < 100) {
            setCaptureQuality('high');
          } else {
            setCaptureQuality('medium');
          }
          
          console.log(`Camera quality set to: ${captureQuality} (detection time: ${detectionTime.toFixed(2)}ms)`);
        }
      } catch (error) {
        console.error("Error detecting camera quality:", error);
        setCaptureQuality('low'); // Fallback to low quality settings
      }
    };
    
    // Run quality detection only once when video is available
    if (videoRef.current.readyState >= 2) {
      testDetection();
    } else {
      videoRef.current.onloadeddata = testDetection;
    }
  };

  // Load face-api models
  const loadModelsFn = async () => {
    // Prevent multiple loading
    if (hasLoadedModels.current || modelLoading) return;
    
    try {
      setModelLoading(true);
      setModelLoadingError(false);
      
      console.log("Initializing face detection models from local files...");
      const loaded = await loadModels();
      
      if (loaded) {
        console.log("Models loaded successfully");
        setModelsLoaded(true);
        setModelLoadingError(false);
        hasLoadedModels.current = true; // Mark as loaded to prevent duplicate loading
        
        // Let the user know models were loaded (only once)
        toast.success('Face detection models loaded successfully!', {
          duration: 2000,
          id: 'models-loaded' // Add an ID to prevent duplicate toasts
        });
        
        // Once models are loaded, detect optimal quality settings
        if (videoRef.current) {
          setTimeout(detectOptimalQuality, 1000); // Give video time to initialize
        }
      } else {
        console.error("Failed to load models");
        setModelsLoaded(false);
        setModelLoadingError(true);
        onError?.('Failed to load face detection models');
        toast.error('Failed to load face detection models. Please try again.', {
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error initializing face detection models:', error);
      setModelsLoaded(false);
      setModelLoadingError(true);
      onError?.(`Failed to load face detection models: ${error.message}`);
      toast.error('Failed to load face detection models. Please check your connection and try again.', {
        duration: 5000
      });
    } finally {
      setModelLoading(false);
    }
  };

  // Load models only once during component mount
  useEffect(() => {
    if (!hasLoadedModels.current) {
      loadModelsFn();
    }
    
    // Cleanup function to ensure camera is turned off when component unmounts
    return () => {
      if (stream) {
        console.log("Cleanup: Stopping all video tracks");
        stream.getTracks().forEach(track => {
          track.stop();
          console.log("Track stopped:", track.kind);
        });
      }
      
      // Clear any pending intervals
      if (livenessCheckInterval.current) {
        clearInterval(livenessCheckInterval.current);
      }
    };
  }, []); // Empty dependency array to run only on mount

  // Initialize and clean up webcam
  useEffect(() => {
    const setupWebcam = async () => {
      if (isCapturing) {
        try {
          console.log("Starting webcam capture");
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { 
              width: 640, 
              height: 480, 
              facingMode: 'user',
              frameRate: { ideal: 30 }  // Higher frame rate for smoother detection
            }
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            setStream(mediaStream);
            console.log("Webcam stream initialized");
            
            // Start liveness detection after webcam is initialized
            startLivenessDetection();
          }
        } catch (error) {
          console.error('Error accessing webcam:', error);
          toast.error('Could not access webcam. Please check permissions and try again.');
          setIsCapturing(false);
          onError?.('Could not access webcam');
        }
      } else if (stream) {
        // Clean up stream when not capturing
        console.log("Stopping webcam capture");
        stream.getTracks().forEach(track => {
          track.stop();
          console.log("Track stopped:", track.kind);
        });
        setStream(null);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          console.log("Video element srcObject cleared");
        }
        
        // Clear liveness detection
        if (livenessCheckInterval.current) {
          clearInterval(livenessCheckInterval.current);
          livenessCheckInterval.current = null;
        }
        frameBuffer.current = [];
      }
    };

    setupWebcam();
  }, [isCapturing]); // Remove onError from dependencies

  // Start continuous liveness detection with auto-capture
  const startLivenessDetection = () => {
    // Clear any existing interval
    if (livenessCheckInterval.current) {
      clearInterval(livenessCheckInterval.current);
    }
    
    frameBuffer.current = [];
    setLivenessScore(null);
    setBlinkDetected(false);
    setPrompt("Please look at the camera and keep your face centered");
    
    const settings = getQualitySettings();
    
    // Set up liveness check interval with adaptive timing
    livenessCheckInterval.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;
      
      try {
        // Get current frame
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Set canvas dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Process frame for liveness detection using enhanced detection for better results
        const detection = await getEnhancedFaceDetection(video);
        
        if (detection) {
          // Check face position and stability for auto-capture
          const faceBox = detection.detection.box;
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;
          
          // Calculate face position relative to center
          const faceCenterX = faceBox.x + faceBox.width / 2;
          const faceCenterY = faceBox.y + faceBox.height / 2;
          const centerOffsetX = Math.abs((faceCenterX / videoWidth) - 0.5);
          const centerOffsetY = Math.abs((faceCenterY / videoHeight) - 0.5);
          
          // Check if face is centered and large enough
          const isCentered = centerOffsetX < 0.15 && centerOffsetY < 0.15;
          const faceSize = Math.min(faceBox.width, faceBox.height);
          const isLargeEnough = faceSize > 100;
          
          // Add position to history for stability check
          stablePositionHistory.current.push({x: faceCenterX, y: faceCenterY});
          
          // Keep only recent positions
          if (stablePositionHistory.current.length > 10) {
            stablePositionHistory.current.shift();
          }
          
          // Check stability if we have enough history
          let isStable = false;
          if (stablePositionHistory.current.length >= 5) {
            const recent = stablePositionHistory.current.slice(-5);
            let maxDiffX = 0;
            let maxDiffY = 0;
            
            for (let i = 1; i < recent.length; i++) {
              const diffX = Math.abs(recent[i].x - recent[i-1].x) / videoWidth;
              const diffY = Math.abs(recent[i].y - recent[i-1].y) / videoHeight;
              maxDiffX = Math.max(maxDiffX, diffX);
              maxDiffY = Math.max(maxDiffY, diffY);
            }
            
            isStable = maxDiffX < 0.01 && maxDiffY < 0.01;
          }
          
          // Update UI with guidance based on face position
          if (!isCentered) {
            setPrompt("Please center your face in the frame");
            setFaceStability(0);
          } else if (!isLargeEnough) {
            setPrompt("Please move closer to the camera");
            setFaceStability(0);
          } else if (!isStable) {
            setPrompt("Please hold still");
            setFaceStability(Math.max(0, faceStability - 1));
          } else {
            if (blinkDetected) {
              setPrompt("Perfect! Ready to capture");
              setFaceStability(faceStability + 1);
            } else {
              setPrompt("Perfect! Please blink once");
            }
          }
          
          // Add detection to buffer (limited to livenessFrameCount frames)
          frameBuffer.current.push(detection);
          if (frameBuffer.current.length > livenessFrameCount) {
            frameBuffer.current.shift(); // Remove oldest frame
          }
          
          // Once we have enough frames, perform liveness check
          if (frameBuffer.current.length >= 3) {
            const livenessResult = await detectLiveness(detection, frameBuffer.current.slice(0, -1));
            
            // Update liveness score
            setLivenessScore(livenessResult);
            
            // Check for blink - detect low eye aspect ratio
            if (!blinkDetected && frameBuffer.current.length > 5) {
              const earValues = frameBuffer.current.map(frame => {
                const landmarks = frame.landmarks.positions;
                const leftEar = calculateEyeAspectRatio(
                  landmarks[36], landmarks[37], landmarks[38], 
                  landmarks[39], landmarks[40], landmarks[41]
                );
                const rightEar = calculateEyeAspectRatio(
                  landmarks[42], landmarks[43], landmarks[44], 
                  landmarks[45], landmarks[46], landmarks[47]
                );
                return (leftEar + rightEar) / 2;
              });
              
              // Detect significant drop in EAR (blink)
              const minEar = Math.min(...earValues);
              const maxEar = Math.max(...earValues);
              if (maxEar - minEar > 0.1) {
                setBlinkDetected(true);
                setPrompt("Great! Please remain still for auto-capture");
              }
            }
            
            // Auto-capture when all conditions are met
            if (autoCapture && 
                isCentered && 
                isLargeEnough && 
                isStable && 
                blinkDetected && 
                livenessResult?.isLive && 
                faceStability >= stableDetectionThreshold) {
              
              // Prevent multiple auto-captures
              if (!isProcessing && !processingTimeoutRef.current) {
                setPrompt("Auto-capturing your face...");
                
                // Slight delay to ensure stability
                processingTimeoutRef.current = setTimeout(() => {
                  captureFace();
                  processingTimeoutRef.current = null;
                }, 500);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error in liveness detection:", error);
      }
    }, 200);
  };
  
  // Helper function for eye aspect ratio calculation
  const calculateEyeAspectRatio = (p1, p2, p3, p4, p5, p6) => {
    const a = euclideanDistance(p2, p6);
    const b = euclideanDistance(p3, p5);
    const c = euclideanDistance(p1, p4);
    return (a + b) / (2.0 * c);
  };
  
  // Helper function for euclidean distance
  const euclideanDistance = (pt1, pt2) => {
    return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
  };

  // Capture face from video stream with liveness check
  const captureFace = async () => {
    if (!videoRef.current || !modelsLoaded || isProcessing) return;
    
    // Check if we have liveness score
    if (livenessScore && !livenessScore.isLive) {
      toast.error('Liveness check failed. Please ensure you are a real person and not using a photo.', {
        duration: 5000
      });
      return;
    }
    
    // If blink hasn't been detected, prompt user
    if (!blinkDetected) {
      toast.error('Please blink your eyes first for liveness verification.', {
        duration: 3000
      });
      setPrompt("Please blink your eyes once");
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Draw current frame to canvas for processing
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!canvas || !video) {
        toast.error('Video or canvas element not available');
        setIsProcessing(false);
        return;
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data from canvas
      const imageSrc = canvas.toDataURL('image/jpeg');
      
      // Create image element to process with face-api
      const img = new Image();
      img.src = imageSrc;
      
      img.onload = async () => {
        // Use enhanced detection for better results with poor quality cameras
        const detection = await getEnhancedFaceDetection(img);
        
        if (!detection) {
          toast.error('No face detected. Please center your face in the camera and try again.');
          setIsProcessing(false);
          return;
        }
        
        // Extract descriptor from detection
        const descriptor = detection.descriptor;
        
        // Add detected face to the array
        const newFaces = [...facesDetected, { descriptor, imageSrc }];
        setFacesDetected(newFaces);
        setCaptureCount(prevCount => prevCount + 1);
        
        // If we have enough faces, calculate average descriptor
        if (newFaces.length >= 3) {
          // Average all descriptors for better accuracy
          const averageDescriptor = calculateAverageDescriptor(newFaces.map(face => face.descriptor));
          
          // Include liveness score in the data sent back
          onFaceDetected?.({ 
            descriptor: averageDescriptor, 
            imageSrc: newFaces[newFaces.length - 1].imageSrc,
            livenessScore: livenessScore,
            isLive: blinkDetected && (livenessScore ? livenessScore.isLive : true)
          });
          
          // Clear liveness detection interval
          if (livenessCheckInterval.current) {
            clearInterval(livenessCheckInterval.current);
            livenessCheckInterval.current = null;
          }
          
          setIsCapturing(false);
        } else {
          // Inform user to continue capturing
          toast.success(`Face captured ${newFaces.length}/3. Please capture ${3 - newFaces.length} more.`);
        }
        
        setIsProcessing(false);
      };
      
      img.onerror = () => {
        toast.error('Failed to process captured image.');
        setIsProcessing(false);
      };
      
    } catch (error) {
      console.error('Error capturing face:', error);
      toast.error('An error occurred while capturing your face.');
      setIsProcessing(false);
    }
  };

  // Calculate average descriptor from multiple captures
  const calculateAverageDescriptor = (descriptors) => {
    if (!descriptors || descriptors.length === 0) return null;
    
    // Each descriptor is a Float32Array with 128 values
    const result = new Float32Array(128);
    
    // Sum up all values at each position
    descriptors.forEach(descriptor => {
      for (let i = 0; i < 128; i++) {
        result[i] += descriptor[i];
      }
    });
    
    // Divide by the number of descriptors to get average
    for (let i = 0; i < 128; i++) {
      result[i] /= descriptors.length;
    }
    
    return result;
  };

  // Start/stop face capture
  const toggleCapture = () => {
    if (isCapturing) {
      setIsCapturing(false);
      // Ensure camera is stopped
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
      
      // Clear liveness detection
      if (livenessCheckInterval.current) {
        clearInterval(livenessCheckInterval.current);
        livenessCheckInterval.current = null;
      }
      
      frameBuffer.current = [];
    } else {
      setIsCapturing(true);
      setFacesDetected([]);
      setCaptureCount(0);
      setLivenessScore(null);
      setBlinkDetected(false);
      setPrompt("Please look at the camera");
    }
  };

  // Enhance face detection with brightness and blur checks
  const enhancedCaptureFace = async () => {
    if (!videoRef.current || !modelsLoaded || isProcessing) return;
    
    // Check if we have liveness score
    if (livenessScore && !livenessScore.isLive) {
      toast.error('Liveness check failed. Please ensure you are a real person and not using a photo.', {
        duration: 5000
      });
      return;
    }
    
    // If blink hasn't been detected, prompt user
    if (!blinkDetected) {
      toast.error('Please blink your eyes first for liveness verification.', {
        duration: 3000
      });
      setPrompt("Please blink your eyes once");
      return;
    }
    
    try {
      setIsProcessing(true);
      const settings = getQualitySettings();
      
      // Draw current frame to canvas for processing
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!canvas || !video) {
        toast.error('Video or canvas element not available');
        setIsProcessing(false);
        return;
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Check image quality
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Calculate brightness
      let brightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        brightness += (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
      }
      brightness = brightness / (data.length / 4);
      
      // Calculate blur (approximate using edge detection)
      const blurScore = calculateBlurScore(imageData);
      
      // Validate brightness and blur
      if (brightness < settings.brightnessMin) {
        toast.warning('Image too dark. Please use better lighting.', { duration: 3000 });
        setIsProcessing(false);
        return;
      }
      
      if (brightness > settings.brightnessMax) {
        toast.warning('Image too bright. Please reduce lighting.', { duration: 3000 });
        setIsProcessing(false);
        return;
      }
      
      if (blurScore < settings.blurTolerance) {
        toast.warning('Image too blurry. Please hold steady.', { duration: 3000 });
        setIsProcessing(false);
        return;
      }
      
      // Get image data from canvas
      const imageSrc = canvas.toDataURL('image/jpeg');
      
      // Create image element to process with face-api
      const img = new Image();
      img.src = imageSrc;
      
      img.onload = async () => {
        // Get face descriptor
        const descriptor = await getFaceDescriptor(img);
        
        if (!descriptor) {
          toast.error('No face detected. Please center your face in the camera and try again.');
          setIsProcessing(false);
          return;
        }
        
        // Add detected face to the array
        const newFaces = [...facesDetected, { descriptor, imageSrc }];
        setFacesDetected(newFaces);
        setCaptureCount(prevCount => prevCount + 1);
        
        // If we have enough faces, calculate average descriptor
        if (newFaces.length >= 3) {
          // Average all descriptors for better accuracy
          const averageDescriptor = calculateAverageDescriptor(newFaces.map(face => face.descriptor));
          
          // Include liveness score in the data sent back
          onFaceDetected?.({ 
            descriptor: averageDescriptor, 
            imageSrc: newFaces[newFaces.length - 1].imageSrc,
            livenessScore: livenessScore,
            isLive: blinkDetected && (livenessScore ? livenessScore.isLive : true)
          });
          
          // Clear liveness detection interval
          if (livenessCheckInterval.current) {
            clearInterval(livenessCheckInterval.current);
            livenessCheckInterval.current = null;
          }
          
          setIsCapturing(false);
        } else {
          // Inform user to continue capturing
          toast.success(`Face captured ${newFaces.length}/3. Please capture ${3 - newFaces.length} more.`);
        }
        
        setIsProcessing(false);
      };
      
      img.onerror = () => {
        toast.error('Failed to process captured image.');
        setIsProcessing(false);
      };
      
    } catch (error) {
      console.error('Error capturing face:', error);
      toast.error('An error occurred while capturing your face.');
      setIsProcessing(false);
    }
  };
  
  // Helper function to calculate blur score
  const calculateBlurScore = (imageData) => {
    const { width, height, data } = imageData;
    let edgeSum = 0;
    
    // Basic Sobel edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // For simplicity, just use grayscale value
        const gray = 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
        
        // Check horizontal edge
        const grayLeft = 0.299 * data[idx-4] + 0.587 * data[idx-3] + 0.114 * data[idx-2];
        const grayRight = 0.299 * data[idx+4] + 0.587 * data[idx+5] + 0.114 * data[idx+6];
        const edgeH = Math.abs(grayLeft - grayRight);
        
        // Check vertical edge
        const grayUp = 0.299 * data[idx-width*4] + 0.587 * data[idx-width*4+1] + 0.114 * data[idx-width*4+2];
        const grayDown = 0.299 * data[idx+width*4] + 0.587 * data[idx+width*4+1] + 0.114 * data[idx+width*4+2];
        const edgeV = Math.abs(grayUp - grayDown);
        
        edgeSum += Math.max(edgeH, edgeV);
      }
    }
    
    // Normalize by area
    return edgeSum / ((width - 2) * (height - 2));
  };

  // Add effect to check browser support and show tutorial for first-time users
  useEffect(() => {
    // Check browser compatibility
    const support = detectBrowserSupport();
    setBrowserSupport(support);
    
    // Show tutorial for first-time users
    if (isFirstVisit.current) {
      setShowTutorial(true);
      localStorage.setItem('face_tutorial_shown', 'true');
    }
  }, []);
  
  // Handle sensitivity level change
  const handleSensitivityChange = (level) => {
    setSensitivityLevel(level);
    setSensitivityLevel(level); // Set in the faceRecognition module
    console.log(`Face detection sensitivity set to: ${level}`);
  };
  
  // Close tutorial
  const handleCloseTutorial = () => {
    setShowTutorial(false);
  };

  // Render error state with retry button
  if (modelLoadingError) {
    return (
      <div className="flex flex-col items-center p-6 bg-red-50 rounded-lg shadow border border-red-200">
        <h3 className="text-lg font-semibold mb-3 text-red-600">Face Detection Error</h3>
        <p className="text-sm text-red-700 mb-4 text-center">
          Unable to load face detection models. This could be due to network issues or browser 
          compatibility problems.
        </p>
        <div className="flex flex-col items-center space-y-2 w-full">
          <button
            type="button"
            onClick={loadModelsFn}
            disabled={modelLoading}
            className="py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 
                     transition flex items-center justify-center min-w-[180px]"
          >
            {modelLoading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Loading...
              </>
            ) : (
              'Retry Loading Models'
            )}
          </button>
          <p className="text-xs text-gray-600 text-center mt-2">
            Please ensure you have a stable internet connection and try again.
          </p>
        </div>
      </div>
    );
  }

  // Render liveness indicator if available
  const renderLivenessIndicator = () => {
    if (!isCapturing) return null;
    
    return (
      <div className="absolute top-2 right-2 flex flex-col items-end">
        {/* Liveness score display */}
        {livenessScore && (
          <div className={`text-xs px-2 py-1 rounded-full mb-1 ${
            livenessScore.isLive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {livenessScore.isLive ? 'Real Person' : 'Possible Fake'}
          </div>
        )}
        
        {/* Blink detection indicator */}
        <div className={`text-xs px-2 py-1 rounded-full ${
          blinkDetected ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
        }`}>
          {blinkDetected ? 'Blink Detected' : 'Waiting for Blink'}
        </div>
      </div>
    );
  };

  // Add cleanup for the new timeout
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      
      // Existing cleanup code will remain here
    };
  }, []);

  // Add browser compatibility warning component
  const renderCompatibilityWarning = () => {
    if (!browserSupport || browserSupport.warnings.length === 0 || hasDismissedWarnings) {
      return null;
    }
    
    return (
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex justify-between">
          <h3 className="text-sm font-semibold text-yellow-800 mb-1">
            Browser Compatibility Warning
          </h3>
          <button 
            onClick={() => setHasDismissedWarnings(true)}
            className="text-yellow-600 hover:text-yellow-800"
          >
            <span className="sr-only">Dismiss</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        <ul className="text-xs text-yellow-700 list-disc list-inside">
          {browserSupport.warnings.map((warning, index) => (
            <li key={index}>{warning}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg shadow">
      {/* Show tutorial if it's the first visit */}
      {showTutorial && <FaceTutorial onClose={handleCloseTutorial} />}
      
      <h3 className="text-lg font-semibold mb-3">Face Registration</h3>
      
      {/* Display browser compatibility warnings */}
      {renderCompatibilityWarning()}
      
      <div className="relative mb-4 bg-black rounded-lg overflow-hidden">
        {isCapturing ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-[320px] h-[240px]"
            />
            {/* Hidden canvas for processing */}
            <canvas 
              ref={canvasRef} 
              className="hidden"
            />
            
            {/* Liveness indicators */}
            {renderLivenessIndicator()}
            
            {/* Stability indicator */}
            {isCapturing && (
              <div className="absolute bottom-10 left-2 right-2 flex justify-center">
                <div className="bg-black/50 rounded-full h-1.5 w-48 overflow-hidden">
                  <div 
                    className="bg-green-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (faceStability/stableDetectionThreshold) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* User prompt */}
            {prompt && (
              <div className="absolute bottom-2 left-2 right-2 bg-black/50 text-white p-2 text-sm text-center rounded">
                {prompt}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center w-[320px] h-[240px] bg-gray-800">
            <p className="text-white text-sm text-center">
              {facesDetected.length >= 3 
                ? "Face captured successfully!" 
                : "Camera is turned off"}
            </p>
          </div>
        )}
        
        {/* Guide overlay when capturing */}
        {isCapturing && (
          <div className="absolute inset-0 border-2 border-dashed border-white opacity-70 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/5 h-3/5 border-2 border-green-400 rounded-full"></div>
          </div>
        )}
        
        {/* Add quality indicator */}
        {isCapturing && (
          <div className="absolute top-2 left-2 flex items-center bg-black/60 text-white text-xs px-2 py-1 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
            Camera: {captureQuality === 'low' ? 'Low' : captureQuality === 'high' ? 'High' : 'Medium'}
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-center w-full">
        {isCapturing ? (
          <div className="space-y-3 w-full">
            {/* Auto-capture toggle */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-lg mb-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCapture}
                  onChange={() => setAutoCapture(!autoCapture)}
                  className="sr-only peer"
                />
                <div className="relative w-10 h-5 bg-gray-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ms-3 text-sm font-medium text-gray-700">Auto-Capture</span>
              </label>
            </div>
            
            {/* Add sensitivity selector */}
            <div className="flex items-center text-sm text-gray-700 mb-3">
              <span className="mr-2">Sensitivity:</span>
              <div className="flex space-x-1">
                {['low', 'medium', 'high'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleSensitivityChange(level)}
                    className={`px-2 py-1 text-xs rounded ${
                      sensitivityLevel === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowTutorial(true)}
                className="ml-auto text-blue-600 text-xs flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
                Help
              </button>
            </div>
            
            {/* Quality selector */}
            <div className="flex items-center text-sm text-gray-700 mb-3">
              <span className="mr-2">Camera Quality:</span>
              <div className="flex space-x-1">
                {['low', 'medium', 'high'].map((quality) => (
                  <button
                    key={quality}
                    type="button"
                    onClick={() => setCaptureQuality(quality)}
                    className={`px-2 py-1 text-xs rounded ${
                      captureQuality === quality
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Manual capture button */}
            <button
              type="button"
              onClick={enhancedCaptureFace}
              disabled={isProcessing || !modelsLoaded}
              className={`w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition ${
                isProcessing || !modelsLoaded ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? 'Processing...' : `Capture Face (${captureCount}/3)`}
            </button>
            
            <button
              type="button"
              onClick={toggleCapture}
              className="w-full py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            
            <p className="text-xs text-gray-600 text-center mt-2">
              Position your face within the circle, blink naturally, and hold still for automatic capture
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">
              If your camera quality is low, try using better lighting or move closer to the camera
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleCapture}
              disabled={!modelsLoaded || modelLoading}
              className={`w-full py-2 px-4 ${
                facesDetected.length >= 3 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white rounded transition ${
                !modelsLoaded || modelLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {modelLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Loading Models...
                </span>
              ) : (
                facesDetected.length >= 3 
                  ? 'Face Registered ✓' 
                  : modelsLoaded ? 'Start Face Registration' : 'Loading Models...'
              )}
            </button>
            
            {/* Show help button for non-first-time users when not capturing */}
            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="mt-2 text-blue-600 text-sm flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              How does face registration work?
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FaceCapture; 