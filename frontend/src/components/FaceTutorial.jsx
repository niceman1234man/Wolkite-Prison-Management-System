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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4">
          <h2 className="text-xl font-semibold">{currentTutorialStep.title}</h2>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Browser compatibility warnings */}
          {browserSupport && browserSupport.warnings.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                Browser Compatibility Warning
              </h3>
              <ul className="text-xs text-yellow-700 list-disc list-inside">
                {browserSupport.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Tutorial image */}
          <div className="flex justify-center mb-6">
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              {/* Placeholder for tutorial images */}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1} 
                stroke="currentColor" 
                className="w-24 h-24 text-gray-400"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
          </div>
          
          {/* Step content */}
          <p className="text-gray-700 mb-6 text-center">
            {currentTutorialStep.content}
          </p>
          
          {/* Progress dots */}
          <div className="flex justify-center mb-4">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full mx-1 ${
                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={goToPrevStep}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Back
            </button>
            
            <button
              onClick={goToNextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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