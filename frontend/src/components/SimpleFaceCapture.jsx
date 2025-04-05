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
      <div className="absolute top-3 right-3 flex flex-col items-end space-y-2">
        {/* Liveness score display */}
        {livenessScore && (
          <div className={`status-badge ${livenessScore.isLive ? 'status-badge-success' : 'status-badge-error'}`}>
            <span className="indicator animate-pulse-slow"></span>
            <span>{livenessScore.isLive ? 'Real Person' : 'Possible Fake'}</span>
          </div>
        )}
        
        {/* Blink detection indicator */}
        <div className={`status-badge ${blinkDetected ? 'status-badge-success' : 'status-badge-warning'}`}>
          <span className={`indicator ${!blinkDetected && 'animate-pulse-slow'}`}></span>
          <span>{blinkDetected ? 'Blink Detected' : 'Waiting for Blink'}</span>
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
      <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg shadow-sm">
        <div className="flex justify-between">
          <h3 className="text-sm font-semibold text-yellow-800 mb-1 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-yellow-600">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            Browser Compatibility Warning
          </h3>
          <button 
            onClick={() => setHasDismissedWarnings(true)}
            className="text-yellow-600 hover:text-yellow-800 transition-colors"
          >
            <span className="sr-only">Dismiss</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        <ul className="text-xs text-yellow-700 list-disc list-inside mt-2 space-y-1">
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
      <div className="glass-card p-8 animate-fadeIn">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-3 text-red-700 text-center">Face Recognition Error</h3>
        <p className="text-sm text-red-600 mb-6 text-center max-w-md">
          Unable to initialize face recognition. This could be due to browser compatibility issues or network problems.
        </p>
        <button
          type="button"
          onClick={loadModelsFn}
          disabled={modelLoading}
          className="btn-gradient-primary w-full py-3 px-8 text-white rounded-lg flex items-center justify-center"
        >
          {modelLoading ? (
            <>
              <span className="spinner mr-3"></span>
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
    <div className="face-capture-container animate-fadeIn">
      {/* Show tutorial if requested */}
      {showTutorial && <FaceTutorial onClose={handleCloseTutorial} />}
      
      <h3 className="face-recognition-header">Face Authentication</h3>
      
      {/* Display browser compatibility warnings */}
      {renderCompatibilityWarning()}
      
      <div className="video-container mb-6">
        {isCapturing ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-[340px] h-[260px] object-cover"
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
              <div className="absolute bottom-3 left-3 right-3 glass-effect text-white p-3 text-sm text-center rounded-lg">
                {prompt}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center w-[340px] h-[260px] bg-gradient-to-b from-gray-800 to-gray-900">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mx-auto mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
              <p className="text-white text-sm px-8">
                {modelLoading ? "Loading face detection..." : "Click Start to authenticate with your face"}
              </p>
            </div>
          </div>
        )}
        
        {/* Guide overlay when capturing */}
        {isCapturing && (
          <div className="face-guide"></div>
        )}
      </div>
      
      <div className="flex flex-col items-center w-full">
        {isCapturing ? (
          <div className="space-y-4 w-full">
            {/* Add sensitivity selector */}
            <div className="flex items-center justify-between text-sm text-gray-700 mb-3 px-4 py-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="font-medium text-blue-800">Sensitivity:</span>
              <div className="flex space-x-2">
                {['low', 'medium', 'high'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleSensitivityChange(level)}
                    className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all duration-200 ${
                      sensitivityLevel === level
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
              <div className="tooltip">
                <button
                  type="button"
                  onClick={() => setShowTutorial(true)}
                  className="face-help-button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                  </svg>
                  Help
                </button>
                <span className="tooltip-text">Show face recognition tutorial</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={captureFace}
              disabled={isProcessing || !modelsLoaded || !blinkDetected}
              className={`face-recognition-button ${
                isProcessing || !modelsLoaded || !blinkDetected ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <span className="spinner mr-2"></span>
                  Processing...
                </span>
              ) : blinkDetected ? 'Verify Face' : 'Please Blink First'}
            </button>
            
            <button
              type="button"
              onClick={toggleCapture}
              className="face-recognition-secondary-button w-full"
            >
              Cancel
            </button>
            
            <div className="text-center mt-2">
              <p className="text-sm text-gray-700 font-medium">
                Please blink naturally for liveness detection
              </p>
              <p className="text-xs text-gray-500 mt-1">
                If detection fails, try better lighting or move closer to the camera
              </p>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleCapture}
              disabled={!modelsLoaded || modelLoading}
              className={`face-recognition-button ${
                !modelsLoaded || modelLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {modelLoading ? (
                <span className="flex items-center justify-center">
                  <span className="spinner mr-2"></span>
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
              className="face-help-button mt-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1.5">
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