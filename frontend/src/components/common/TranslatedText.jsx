import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * A component that displays text in the selected language using Azure Translator
 * @param {Object} props - Component props
 * @param {string} props.text - The text to display and translate
 * @param {string} props.sourceLanguage - Source language code (defaults to English)
 * @param {string} props.as - The HTML element to render (default: span)
 * @param {Object} props.props - Additional props to pass to the rendered element
 */
const TranslatedText = ({ 
  text, 
  sourceLanguage, 
  as = 'span', 
  ...props 
}) => {
  const { translate, currentLanguage, LANGUAGE_CODES, translationStatus } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Set a source language if not provided
  const source = sourceLanguage || LANGUAGE_CODES.ENGLISH;
  
  useEffect(() => {
    // Skip translation if the text is empty or source language is the same as target
    if (!text || text.trim() === '' || source === currentLanguage) {
      setTranslatedText(text);
      return;
    }
    
    // Skip translation if we're in offline mode and using fallback dictionary
    if (translationStatus.offlineMode && !text.includes(' ')) {
      // For single words, set text directly to avoid unnecessary API calls
      setTranslatedText(text);
      return;
    }
    
    const translateText = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await translate(text, source);
        setTranslatedText(result);
      } catch (error) {
        console.error('Translation failed:', error);
        setError(error.message);
        setTranslatedText(text); // Fallback to original text
      } finally {
        setIsLoading(false);
      }
    };
    
    translateText();
  }, [text, currentLanguage, source, translate, translationStatus.offlineMode]);
  
  // Render the appropriate HTML element with the translated text
  const Element = as;
  
  return (
    <Element {...props}>
      {isLoading ? (
        <>
          <span className="opacity-50">{text}</span>
          <span className="ml-2 inline-block animate-pulse">...</span>
        </>
      ) : error ? (
        <span title={`Translation error: ${error}`}>
          {text}
          <span className="ml-1 text-red-500 text-xs">!</span>
        </span>
      ) : (
        translatedText
      )}
    </Element>
  );
};

/**
 * A simpler version of TranslatedText that only handles static texts
 * and doesn't show loading state - useful for UI labels
 */
export const T = ({ children, ...props }) => {
  const { translate, currentLanguage, LANGUAGE_CODES, isEnglish } = useLanguage();
  const [translatedText, setTranslatedText] = useState(children);
  
  useEffect(() => {
    // Skip translation for English or empty text
    if (isEnglish() || !children || typeof children !== 'string') {
      setTranslatedText(children);
      return;
    }
    
    translate(children, LANGUAGE_CODES.ENGLISH)
      .then(result => setTranslatedText(result))
      .catch(() => setTranslatedText(children));
  }, [children, currentLanguage, translate, isEnglish]);
  
  return <span {...props}>{translatedText}</span>;
};

/**
 * A component that displays translation service status
 */
export const TranslationStatus = () => {
  const { translationStatus, refreshTranslationService, currentLanguage, LANGUAGE_CODES } = useLanguage();
  
  // Don't show anything if we're using English or translation is working
  if (currentLanguage === LANGUAGE_CODES.ENGLISH || translationStatus.working) {
    return null;
  }
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mb-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            Translation service is {translationStatus.offlineMode ? 'in offline mode' : 'not working'}. 
            {translationStatus.error && <span className="font-medium"> Error: {translationStatus.error}</span>}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <button
            type="button"
            onClick={refreshTranslationService}
            className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-1 px-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranslatedText; 