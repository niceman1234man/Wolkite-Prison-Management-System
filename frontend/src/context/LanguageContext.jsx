import React, { createContext, useState, useContext, useEffect } from 'react';
import { LANGUAGE_CODES, translateText, translateObject, clearTranslationCache } from '../utils/translationService';

// Create context
const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  // Get saved language from localStorage or default to English
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    return savedLanguage || LANGUAGE_CODES.ENGLISH;
  });
  
  // Track translation service status
  const [translationStatus, setTranslationStatus] = useState({
    working: true,
    error: null,
    offlineMode: false
  });

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('preferredLanguage', currentLanguage);
    
    // Clear translation cache when language changes
    clearTranslationCache();
    
    // Test translation service when language changes
    testTranslationService();
  }, [currentLanguage]);
  
  /**
   * Test if the translation service is working
   */
  const testTranslationService = async () => {
    if (currentLanguage === LANGUAGE_CODES.ENGLISH) {
      // If English is selected, assume translation service is working
      setTranslationStatus({
        working: true,
        error: null,
        offlineMode: false
      });
      return;
    }
    
    try {
      // Try a simple test translation
      const testText = "Hello";
      const translated = await translateText(testText, currentLanguage, LANGUAGE_CODES.ENGLISH);
      
      // If the translation is the same as the input but they should be different,
      // the service might not be working properly
      if (translated === testText && currentLanguage !== LANGUAGE_CODES.ENGLISH) {
        setTranslationStatus({
          working: false,
          error: "Translation service did not return a translated text",
          offlineMode: true
        });
      } else {
        setTranslationStatus({
          working: true,
          error: null,
          offlineMode: false
        });
      }
    } catch (error) {
      console.error("Translation service test failed:", error);
      setTranslationStatus({
        working: false,
        error: error.message,
        offlineMode: true
      });
    }
  };

  /**
   * Change the current language
   * @param {string} languageCode - The language code to switch to
   */
  const changeLanguage = (languageCode) => {
    if (Object.values(LANGUAGE_CODES).includes(languageCode)) {
      setCurrentLanguage(languageCode);
    } else {
      console.error(`Unsupported language code: ${languageCode}`);
    }
  };

  /**
   * Translate a text string to the current language
   * @param {string} text - Text to translate
   * @param {string} sourceLanguage - Source language (optional)
   * @returns {Promise<string>} Translated text
   */
  const translate = async (text, sourceLanguage = LANGUAGE_CODES.ENGLISH) => {
    // Don't translate if source language is the same as current language
    if (sourceLanguage === currentLanguage) {
      return text;
    }
    
    try {
      const result = await translateText(text, currentLanguage, sourceLanguage);
      return result;
    } catch (error) {
      console.error("Translation error in context:", error);
      // Update translation status on error
      setTranslationStatus({
        working: false,
        error: error.message,
        offlineMode: true
      });
      return text; // Return original text on error
    }
  };

  /**
   * Translate multiple texts to the current language
   * @param {string[]} texts - Array of texts to translate
   * @param {string} sourceLanguage - Source language (optional)
   * @returns {Promise<string[]>} Array of translated texts
   */
  const translateTexts = async (texts, sourceLanguage = LANGUAGE_CODES.ENGLISH) => {
    // Don't translate if source language is the same as current language
    if (sourceLanguage === currentLanguage) {
      return texts;
    }
    
    // Filter out empty strings
    const nonEmptyTexts = texts.filter(text => text && text.trim() !== '');
    if (nonEmptyTexts.length === 0) return texts;
    
    const translatedTexts = await translateObject(
      texts.reduce((obj, text, index) => ({ ...obj, [`key${index}`]: text }), {}),
      currentLanguage,
      sourceLanguage
    );
    
    return texts.map((text, index) => 
      text && text.trim() !== '' ? translatedTexts[`key${index}`] : text
    );
  };

  /**
   * Check if the current language is Amharic
   * @returns {boolean} True if current language is Amharic
   */
  const isAmharic = () => currentLanguage === LANGUAGE_CODES.AMHARIC;

  /**
   * Check if the current language is English
   * @returns {boolean} True if current language is English
   */
  const isEnglish = () => currentLanguage === LANGUAGE_CODES.ENGLISH;

  /**
   * Force refresh the translation service test
   */
  const refreshTranslationService = () => {
    testTranslationService();
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        translate,
        translateTexts,
        isAmharic,
        isEnglish,
        LANGUAGE_CODES,
        translationStatus,
        refreshTranslationService
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}; 