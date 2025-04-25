import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Azure Translator API credentials from environment variables
const AZURE_TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY;
const AZURE_TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION || 'eastus';
const AZURE_TRANSLATOR_ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';

/**
 * Translates text between English and Amharic
 * 
 * @param {string} text - The text to translate
 * @param {string} targetLanguage - Target language code ('am' for Amharic, 'en' for English)
 * @param {string} sourceLanguage - Source language code (optional, auto-detected if not provided)
 * @returns {Promise<string>} - Translated text
 */
export const translateText = async (text, targetLanguage, sourceLanguage = '') => {
  try {
    if (!AZURE_TRANSLATOR_KEY) {
      throw new Error('Azure Translator API key is not configured');
    }

    if (!text || text.trim() === '') {
      return text;
    }

    const url = `${AZURE_TRANSLATOR_ENDPOINT}/translate`;

    const requestBody = [{
      text: text
    }];

    const params = new URLSearchParams({
      'api-version': '3.0',
      'to': targetLanguage
    });

    if (sourceLanguage) {
      params.append('from', sourceLanguage);
    }

    const response = await axios({
      method: 'post',
      url: `${url}?${params.toString()}`,
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_TRANSLATOR_KEY,
        'Ocp-Apim-Subscription-Region': AZURE_TRANSLATOR_REGION,
        'Content-Type': 'application/json'
      },
      data: requestBody,
      responseType: 'json'
    });

    const translation = response.data[0].translations[0].text;
    return translation;
  } catch (error) {
    console.error('Azure Translator API Error:', error.message);
    return text; // Return original text if translation fails
  }
};

/**
 * Translate multiple texts at once
 * 
 * @param {string[]} texts - Array of texts to translate
 * @param {string} targetLanguage - Target language code ('am' for Amharic, 'en' for English)
 * @param {string} sourceLanguage - Source language code (optional)
 * @returns {Promise<string[]>} - Array of translated texts
 */
export const translateMultipleTexts = async (texts, targetLanguage, sourceLanguage = '') => {
  try {
    if (!Array.isArray(texts) || texts.length === 0) {
      return texts;
    }

    if (!AZURE_TRANSLATOR_KEY) {
      throw new Error('Azure Translator API key is not configured');
    }

    const url = `${AZURE_TRANSLATOR_ENDPOINT}/translate`;

    const requestBody = texts.map(text => ({ text }));

    const params = new URLSearchParams({
      'api-version': '3.0',
      'to': targetLanguage
    });

    if (sourceLanguage) {
      params.append('from', sourceLanguage);
    }

    const response = await axios({
      method: 'post',
      url: `${url}?${params.toString()}`,
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_TRANSLATOR_KEY,
        'Ocp-Apim-Subscription-Region': AZURE_TRANSLATOR_REGION,
        'Content-Type': 'application/json'
      },
      data: requestBody,
      responseType: 'json'
    });

    return response.data.map(item => item.translations[0].text);
  } catch (error) {
    console.error('Azure Translator API Error:', error.message);
    return texts; // Return original texts if translation fails
  }
};

/**
 * Translate a structured object's string values
 * 
 * @param {Object} obj - Object to translate values for
 * @param {string} targetLanguage - Target language code ('am' for Amharic, 'en' for English)
 * @param {string} sourceLanguage - Source language code (optional)
 * @returns {Promise<Object>} - Object with translated values
 */
export const translateObject = async (obj, targetLanguage, sourceLanguage = '') => {
  try {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // Create a copy of the object
    const result = { ...obj };
    const keys = Object.keys(result);
    const translateValues = [];
    const translateKeys = [];

    // Extract all string values that need translation
    for (const key of keys) {
      if (typeof result[key] === 'string' && result[key].trim() !== '') {
        translateValues.push(result[key]);
        translateKeys.push(key);
      }
    }

    if (translateValues.length > 0) {
      // Translate all values at once
      const translatedValues = await translateMultipleTexts(
        translateValues,
        targetLanguage,
        sourceLanguage
      );

      // Update the object with translated values
      for (let i = 0; i < translateKeys.length; i++) {
        result[translateKeys[i]] = translatedValues[i];
      }
    }

    return result;
  } catch (error) {
    console.error('Object translation error:', error.message);
    return obj; // Return original object if translation fails
  }
};

export default {
  translateText,
  translateMultipleTexts,
  translateObject
}; 