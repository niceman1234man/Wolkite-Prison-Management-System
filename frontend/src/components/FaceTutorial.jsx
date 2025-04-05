import React, { useState } from 'react';
import { detectBrowserSupport } from '../utils/faceRecognition';

/**
 * Component to provide a tutorial for face registration/authentication 
 * for first-time users and check browser compatibility
 */
const FaceTutorial = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [browserSupport, setBrowserSupport] = useState(null);
  
  // Check browser support when component mounts
  React.useEffect(() => {
    const support = detectBrowserSupport();
    setBrowserSupport(support);
  }, []);
  
  // Tutorial steps
  const tutorialSteps = [
    {
      title: "Welcome to Face Recognition",
      content: "This tutorial will guide you through the face recognition setup process.",
      image: "/images/tutorial/welcome.svg"
    },
    {
      title: "Position Your Face",
      content: "Center your face within the circle. Make sure your face is fully visible and well-lit.",
      image: "/images/tutorial/position.svg"
    },
    {
      title: "Blink Naturally",
      content: "The system will ask you to blink to verify you're a real person. Just blink normally when prompted.",
      image: "/images/tutorial/blink.svg"
    },
    {
      title: "Stay Still",
      content: "Hold steady for a moment while your face is captured. Try not to move too much.",
      image: "/images/tutorial/steady.svg"
    },
    {
      title: "Complete Registration",
      content: "We'll take multiple captures to ensure accuracy. This helps make your login secure and reliable.",
      image: "/images/tutorial/complete.svg"
    }
  ];
  
  // Get current step data
  const currentTutorialStep = tutorialSteps[currentStep];
  
  // Navigate between steps
  const goToNextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };
  
  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="glass-card modal-content max-w-md w-full mx-4 overflow-hidden animate-fadeIn">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-5">
          <h2 className="text-2xl font-bold">{currentTutorialStep.title}</h2>
          <div className="h-1 w-16 bg-white/30 rounded-full mt-2"></div>
        </div>
        
        {/* Content */}
        <div className="p-8">
          {/* Browser compatibility warnings */}
          {browserSupport && browserSupport.warnings.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg shadow-sm">
              <h3 className="text-sm font-semibold text-yellow-800 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Browser Compatibility Warning
              </h3>
              <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1 mt-2">
                {browserSupport.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Tutorial image */}
          <div className="flex justify-center mb-8">
            <div className="w-56 h-56 bg-gradient-to-b from-blue-50 to-gray-50 rounded-2xl flex items-center justify-center shadow-inner border border-gray-100">
              {/* Placeholder for tutorial images */}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1} 
                stroke="currentColor" 
                className="w-28 h-28 text-blue-400"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
          </div>
          
          {/* Step content */}
          <p className="text-gray-700 mb-8 text-center text-lg leading-relaxed">
            {currentTutorialStep.content}
          </p>
          
          {/* Progress dots */}
          <div className="progress-dots mb-8">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`progress-dot ${
                  index === currentStep 
                    ? 'active' 
                    : index < currentStep 
                      ? 'complete' 
                      : ''
                }`}
              />
            ))}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={goToPrevStep}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-lg transition-all duration-200 ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
              }`}
            >
              Back
            </button>
            
            <button
              onClick={goToNextStep}
              className="btn-gradient-primary px-6 py-3 text-white rounded-lg font-medium"
            >
              {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceTutorial; 