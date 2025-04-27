import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FaGlobe, FaExclamationTriangle } from 'react-icons/fa';
import { TranslationStatus } from './TranslatedText';

/**
 * A dropdown component for language selection
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showLabel - Whether to show the "Language" label
 * @param {boolean} props.darkMode - Whether to use dark mode styling
 * @param {Function} props.onChange - Callback function when language changes
 * @param {boolean} props.showStatus - Whether to show the translation status message
 */
const LanguageSelector = ({ 
  className = '', 
  showLabel = false, 
  darkMode = false,
  onChange = null,
  showStatus = true
}) => {
  const { 
    currentLanguage, 
    changeLanguage, 
    LANGUAGE_CODES, 
    translationStatus,
    refreshTranslationService
  } = useLanguage();

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    changeLanguage(newLanguage);
    if (onChange && typeof onChange === 'function') {
      onChange(newLanguage);
    }
  };

  // Define styles based on dark mode
  const selectClasses = darkMode 
    ? 'bg-gray-800 text-white border-gray-700 focus:border-blue-500' 
    : 'bg-white text-gray-800 border-gray-300 focus:border-blue-500';

  // Determine if we need to show a warning icon
  const showWarning = currentLanguage !== LANGUAGE_CODES.ENGLISH && 
                     (!translationStatus.working || translationStatus.offlineMode);

  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-2">
        {showLabel && (
          <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Language:
          </label>
        )}

        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
            <FaGlobe className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>

          <select
            value={currentLanguage}
            onChange={handleLanguageChange}
            className={`pl-8 pr-10 py-1.5 rounded border ${selectClasses} appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500`}
            aria-label="Select language"
          >
            <option value={LANGUAGE_CODES.ENGLISH}>English</option>
            <option value={LANGUAGE_CODES.AMHARIC}>አማርኛ</option>
          </select>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {showWarning ? (
              <FaExclamationTriangle 
                className="w-4 h-4 text-yellow-500 mr-1" 
                title={translationStatus.offlineMode ? "Offline mode - using local dictionary" : "Translation service issue"} 
              />
            ) : (
              <svg 
                className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
        
        {showWarning && (
          <button
            onClick={refreshTranslationService}
            className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-1 px-2 rounded"
            title="Retry translation service connection"
          >
            Retry
          </button>
        )}
      </div>
      
      {showStatus && <TranslationStatus />}
    </div>
  );
};

export default LanguageSelector; 