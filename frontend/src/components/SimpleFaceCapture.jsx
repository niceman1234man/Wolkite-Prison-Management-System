import React, { useRef, useState, useEffect } from 'react';
import { loadModels, getFaceDescriptor, getFaceDetection, detectLiveness, getEnhancedFaceDetection, setSensitivityLevel, detectBrowserSupport } from '../utils/faceRecognition';
import { toast } from 'react-hot-toast';
import FaceTutorial from './FaceTutorial';

const SimpleFaceCapture = ({ onFaceDetected, onError }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelLoadingError, setModelLoadingError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState(null);
  const hasLoadedModels = useRef(false);
  
  // Liveness detection state
  const [livenessScore, setLivenessScore] = useState(null);
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [prompt, setPrompt] = useState('');
  const livenessCheckInterval = useRef(null);
  const frameBuffer = useRef([]);
  
  // Add new state variables
  const [showTutorial, setShowTutorial] = useState(false);
  const [sensitivityLevel, setSensitivityLevel] = useState('medium');
  const [browserSupport, setBrowserSupport] = useState(null);
  const [hasDismissedWarnings, setHasDismissedWarnings] = useState(false);
  
  // Load face-api models
  const loadModelsFn = async () => {
    // Prevent multiple calls to load models
    if (hasLoadedModels.current || modelLoading) return;
    
    try {
      setModelLoading(true);
      setModelLoadingError(false);
      
      console.log("Loading face detection models from local files...");
      const loaded = await loadModels();
      
      if (loaded) {
        console.log("Models loaded successfully");
        setModelsLoaded(true);
        setModelLoadingError(false);
        hasLoadedModels.current = true;
        
        // Let the user know models were loaded (only once)
        toast.success('Face detection models loaded successfully!', {
          duration: 1500,
          id: 'models-loaded-simple' // Add an ID to prevent duplicate toasts
        });
      } else {
        console.error("Failed to load models");
        setModelsLoaded(false);
        setModelLoadingError(true);
        onError?.('Failed to load face detection models');
      }
    } catch (error) {
      console.error('Error loading face detection models:', error);
      setModelsLoaded(false);
      setModelLoadingError(true);
      onError?.(`Failed to load face detection models: ${error.message}`);
    } finally {
      setModelLoading(false);
    }
  };

  // Load models once on mount
  useEffect(() => {
    if (!hasLoadedModels.current) {
      loadModelsFn();
    }
    
    // Cleanup function to ensure camera is turned off when component unmounts
    return () => {
      forceStopCamera();
    };
  }, []);

  // Force stop camera and clear all resources
  const forceStopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Clear any liveness detection interval
    if (livenessCheckInterval.current) {
      clearInterval(livenessCheckInterval.current);
      livenessCheckInterval.current = null;
    }
    
    frameBuffer.current = [];
  };

  // Initialize and clean up webcam
  useEffect(() => {
    const setupWebcam = async () => {
      if (isCapturing) {
        try {
          console.log("Starting webcam capture for authentication");
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { 
              width: 640, 
              height: 480, 
              facingMode: 'user',
              frameRate: { ideal: 30 }  // Higher frame rate for smoother liveness detection
            }
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            setStream(mediaStream);
            
            // Start liveness detection once webcam is ready
            startLivenessDetection();
          }
        } catch (error) {
          console.error('Error accessing webcam:', error);
          toast.error('Could not access webcam. Please check permissions and try again.');
          setIsCapturing(false);
          onError?.('Could not access webcam');
        }
      } else {
        forceStopCamera();
      }
    };

    setupWebcam();
  }, [isCapturing]); // Only re-run when isCapturing changes

  // Start continuous liveness detection
  const startLivenessDetection = () => {
    // Clear any existing interval
    if (livenessCheckInterval.current) {
      clearInterval(livenessCheckInterval.current);
    }
    
    frameBuffer.current = [];
    setLivenessScore(null);
    setBlinkDetected(false);
    setPrompt("Please look at the camera");
    
    // Set up liveness check interval (run every 200ms)
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
        
        // Process frame for liveness detection with enhanced detection
        const detection = await getEnhancedFaceDetection(video);
        
        if (detection) {
          // Add detection to buffer (limited to 10 frames)
          frameBuffer.current.push(detection);
          if (frameBuffer.current.length > 10) {
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
                setPrompt("Great! Now turn your head slightly");
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

  // Capture face for authentication
  const captureFace = async () => {
    if (!videoRef.current || !modelsLoaded || isProcessing) return;
    
    // Basic liveness check
    if (livenessScore && !livenessScore.isLive) {
      toast.error('Liveness check failed. Please ensure you are a real person and not using a photo.', {
        duration: 3000
      });
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
        // Use enhanced detection for better results with lower quality cameras
        const detection = await getEnhancedFaceDetection(img);
        
        if (!detection) {
          toast.error('No face detected. Please center your face in the camera.');
          setIsProcessing(false);
          return;
        }
        
        // Extract the descriptor from the detection
        const descriptor = detection.descriptor;
        
        // Pass descriptor and liveness data to parent component
        onFaceDetected?.({ 
          descriptor, 
          imageSrc,
          livenessScore: livenessScore,
          isLive: blinkDetected && (livenessScore ? livenessScore.isLive : true)
        });
        
        // Stop capturing
        setIsCapturing(false);
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

  // Start/stop face capture
  const toggleCapture = () => {
    if (isCapturing) {
      setIsCapturing(false);
      forceStopCamera();
    } else {
      setIsCapturing(true);
      setLivenessScore(null);
      setBlinkDetected(false);
      setPrompt("Please look at the camera");
    }
  };

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

  // Add effect to check browser support
  useEffect(() => {
    // Check browser compatibility
    const support = detectBrowserSupport();
    setBrowserSupport(support);
  }, []);
  
  // Handle sensitivity level change
  const handleSensitivityChange = (level) => {
    setSensitivityLevel(level);
    setSensitivityLevel(level); // Set in the faceRecognition module
  };
  
  // Close tutorial
  const handleCloseTutorial = () => {
    setShowTutorial(false);
  };

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

  // Render error state with retry button
  if (modelLoadingError) {
    return (
      <div className="flex flex-col items-center p-6 bg-red-50 rounded-lg shadow border border-red-200">
        <h3 className="text-lg font-semibold mb-3 text-red-600">Face Recognition Error</h3>
        <p className="text-sm text-red-700 mb-4 text-center">
          Unable to initialize face recognition. This could be due to browser compatibility issues.
        </p>
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
            'Retry'
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg shadow">
      {/* Show tutorial if requested */}
      {showTutorial && <FaceTutorial onClose={handleCloseTutorial} />}
      
      <h3 className="text-lg font-semibold mb-3">Face Authentication</h3>
      
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
              {modelLoading ? "Loading face detection..." : "Click Start to authenticate with your face"}
            </p>
          </div>
        )}
        
        {/* Guide overlay when capturing */}
        {isCapturing && (
          <div className="absolute inset-0 border-2 border-dashed border-white opacity-70 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/5 h-3/5 border-2 border-green-400 rounded-full"></div>
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-center w-full">
        {isCapturing ? (
          <div className="space-y-3 w-full">
            {/* Add sensitivity selector */}
            <div className="flex items-center justify-between text-sm text-gray-700 mb-3 px-3 py-2 bg-gray-100 rounded-lg">
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
                className="text-blue-600 text-xs flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
                Help
              </button>
            </div>
            
            <button
              type="button"
              onClick={captureFace}
              disabled={isProcessing || !modelsLoaded || !blinkDetected}
              className={`w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition ${
                isProcessing || !modelsLoaded || !blinkDetected ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? 'Processing...' : blinkDetected ? 'Verify Face' : 'Please Blink First'}
            </button>
            
            <button
              type="button"
              onClick={toggleCapture}
              className="w-full py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            
            <p className="text-sm text-gray-600 text-center mt-2">
              Please blink naturally for liveness detection, then click to verify
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">
              If detection fails, try better lighting or move closer to the camera
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleCapture}
              disabled={!modelsLoaded || modelLoading}
              className={`w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition ${
                !modelsLoaded || modelLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {modelLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Loading Face Recognition...
                </span>
              ) : (
                'Start Face Authentication'
              )}
            </button>
            
            {/* Show help button */}
            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="mt-2 text-blue-600 text-sm flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              How does face authentication work?
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SimpleFaceCapture; 