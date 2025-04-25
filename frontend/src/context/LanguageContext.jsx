import React, { createContext, useState, useContext, useEffect } from 'react';
import { LANGUAGE_CODES, translateText, translateObject } from '../utils/translationService';

// Create context
const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  // Get saved language from localStorage or default to English
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    return savedLanguage || LANGUAGE_CODES.ENGLISH;
  });

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('preferredLanguage', currentLanguage);
  }, [currentLanguage]);

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
    return await translateText(text, currentLanguage, sourceLanguage);
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

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        translate,
        translateTexts,
        isAmharic,
        isEnglish,
        LANGUAGE_CODES
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}; 