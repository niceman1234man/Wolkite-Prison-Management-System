import axiosInstance from './axiosInstance';

/**
 * Translate a single text string
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code (am for Amharic, en for English)
 * @param {string} sourceLanguage - Source language code (optional)
 * @returns {Promise<string>} Translated text
 */
export const translateText = async (text, targetLanguage, sourceLanguage = '') => {
  try {
    const response = await axiosInstance.post('/translate/text', {
      text,
      targetLanguage,
      sourceLanguage
    });
    
    if (response.data && response.data.success) {
      return response.data.translation;
    }
    return text; // Return original text if translation failed
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
};

/**
 * Translate multiple text strings at once
 * @param {string[]} texts - Array of texts to translate
 * @param {string} targetLanguage - Target language code (am for Amharic, en for English)
 * @param {string} sourceLanguage - Source language code (optional)
 * @returns {Promise<string[]>} Array of translated texts
 */
export const translateMultipleTexts = async (texts, targetLanguage, sourceLanguage = '') => {
  try {
    const response = await axiosInstance.post('/translate/batch', {
      texts,
      targetLanguage,
      sourceLanguage
    });
    
    if (response.data && response.data.success) {
      return response.data.translations;
    }
    return texts; // Return original texts if translation failed
  } catch (error) {
    console.error('Batch translation error:', error);
    return texts; // Return original texts on error
  }
};

/**
 * Translate all string values in an object
 * @param {Object} object - Object with string values to translate
 * @param {string} targetLanguage - Target language code (am for Amharic, en for English)
 * @param {string} sourceLanguage - Source language code (optional)
 * @returns {Promise<Object>} Object with translated string values
 */
export const translateObject = async (object, targetLanguage, sourceLanguage = '') => {
  try {
    const response = await axiosInstance.post('/translate/object', {
      object,
      targetLanguage,
      sourceLanguage
    });
    
    if (response.data && response.data.success) {
      return response.data.translation;
    }
    return object; // Return original object if translation failed
  } catch (error) {
    console.error('Object translation error:', error);
    return object; // Return original object on error
  }
};

/**
 * Language codes for supported languages
 */
export const LANGUAGE_CODES = {
  ENGLISH: 'en',
  AMHARIC: 'am'
};

/**
 * Get human-readable language name from code
 * @param {string} code - Language code 
 * @returns {string} Language name
 */
export const getLanguageName = (code) => {
  switch (code) {
    case LANGUAGE_CODES.ENGLISH:
      return 'English';
    case LANGUAGE_CODES.AMHARIC:
      return 'Amharic';
    default:
      return code;
  }
}; 