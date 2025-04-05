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

  // Show tutorial for first-time visitors
  useEffect(() => {
    if (isFirstVisit.current) {
      setShowTutorial(true);
      localStorage.setItem('face_tutorial_shown', 'true');
    }
    
    // Check browser compatibility
    const support = detectBrowserSupport();
    setBrowserSupport(support);
  }, []);

  // Load models only once during component mount
  useEffect(() => {
    if (!hasLoadedModels.current) {
      loadModelsFn();
    }
    
    // Cleanup function to ensure camera is turned off when component unmounts
    return () => {
      forceStopCamera();
    };
  }, []); // Empty dependency array to run only on mount

  // Force stop camera and clear all resources
  const forceStopCamera = () => {
    if (stream) {
      console.log("Cleanup: Stopping all video tracks");
      stream.getTracks().forEach(track => {
        track.stop();
        console.log("Track stopped:", track.kind);
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Clear any pending intervals
    if (livenessCheckInterval.current) {
      clearInterval(livenessCheckInterval.current);
      livenessCheckInterval.current = null;
    }
    
    // Clear any processing timeouts
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    
    // Reset buffers and state
    frameBuffer.current = [];
    stablePositionHistory.current = [];
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
        
        {/* Stability indicator */}
        {faceStability > 0 && (
          <div className="status-badge status-badge-info">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mr-2 overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-300 ease-out" 
                style={{width: `${Math.min(100, faceStability * 20)}%`}}
              ></div>
            </div>
            <span>Stability</span>
          </div>
        )}
        
        {/* Capture count */}
        {captureCount > 0 && (
          <div className="status-badge bg-indigo-500/90 text-white">
            <span>
              Captures: {captureCount}/5
            </span>
          </div>
        )}
      </div>
    );
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
      
      <h3 className="face-recognition-header">Face Registration</h3>
      
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
                {modelLoading ? "Loading face detection..." : "Click Start to register your face"}
              </p>
            </div>
          </div>
        )}
        
        {/* Guide overlay when capturing */}
        {isCapturing && (
          <div className="face-guide"></div>
        )}
      </div>
      
      <div className="flex flex-col items-center w-full space-y-4">
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
              
              <div className="flex space-x-2">
                <div className="tooltip">
                  <button
                    type="button"
                    onClick={() => setAutoCapture(!autoCapture)}
                    className={`px-3 py-1.5 text-xs rounded-md font-medium flex items-center ${
                      autoCapture 
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    <span className={`inline-block w-3 h-3 rounded-full mr-1.5 ${
                      autoCapture ? 'bg-indigo-500' : 'bg-gray-400'
                    }`}></span>
                    Auto-Capture
                  </button>
                  <span className="tooltip-text">Let the app capture face automatically</span>
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
                  <span className="tooltip-text">Show face registration tutorial</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={captureFace}
                disabled={isProcessing || !modelsLoaded}
                className={`face-recognition-button ${
                  isProcessing || !modelsLoaded ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <span className="spinner mr-2"></span>
                    Processing...
                  </span>
                ) : captureCount > 0 ? `Capture (${captureCount}/5)` : 'Capture Face'}
              </button>
              
              <button
                type="button"
                onClick={toggleCapture}
                className="face-recognition-secondary-button"
              >
                Cancel
              </button>
            </div>
            
            <div className="text-center mt-2">
              <p className="text-sm text-gray-700 font-medium">
                Look directly at the camera and keep still
              </p>
              <p className="text-xs text-gray-500 mt-1">
                We'll need to take 5 captures to complete registration
              </p>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleCapture}
              disabled={!modelsLoaded || modelLoading}
              className={`face-recognition-button w-full ${
                !modelsLoaded || modelLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {modelLoading ? (
                <span className="flex items-center justify-center">
                  <span className="spinner mr-2"></span>
                  Loading Face Recognition...
                </span>
              ) : (
                'Start Face Registration'
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
              How does face registration work?
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FaceCapture; 