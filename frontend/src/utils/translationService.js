import axiosInstance from './axiosInstance';
import axios from 'axios';

// In-memory cache for translations to improve performance and reduce API calls
const translationCache = {
  en: {}, // English to Amharic
  am: {}  // Amharic to English
};

// Fallback dictionary for common phrases (helpful when API is unavailable)
const fallbackDictionary = {
  // English to Amharic
  en: {
    'Welcome': 'እንኳን ደህና መጣህ',
    'Login': 'ግባ',
    'Logout': 'ውጣ',
    'Dashboard': 'ዳሽቦርድ',
    'Inmates': 'እስረኞች',
    'Staff': 'ሰራተኞች',
    'Reports': 'ሪፖርቶች',
    'Settings': 'ቅንብሮች',
    'Profile': 'መገለጫ',
    'Save': 'አስቀምጥ',
    'Cancel': 'ይቅር',
    'Delete': 'ሰርዝ',
    'Edit': 'አስተካክል',
    'Submit': 'አስገባ',
    'Search': 'ፈልግ',
    'Name': 'ስም',
    'Email': 'ኢሜይል',
    'Password': 'የይለፍ ቃል',
    'Phone': 'ስልክ',
    'Address': 'አድራሻ',
    'Age': 'እድሜ',
    'Gender': 'ጾታ',
    'Date': 'ቀን',
    'Time': 'ሰዓት',
    'Status': 'ሁኔታ',
    'Active': 'ንቁ',
    'Inactive': 'ንቁ ያልሆነ',
    'Error': 'ስህተት',
    'Success': 'ስኬት',
    'Warning': 'ማስጠንቀቂያ',
    'Info': 'መረጃ',
    'Yes': 'አዎ',
    'No': 'አይ',
    'Backup': 'ተተኪ',
    'Restore': 'መመለስ',
    'Prison': 'እስር ቤት',
    'System': 'ሲስተም',
    'Parole': 'ፓሮል',
    'Committee': 'ኮሚቴ',
    // Additional words for enhanced offline translation
    'Home': 'ቤት',
    'Visitors': 'ጎብኝዎች',
    'Schedule': 'መርሃግብር',
    'Visit': 'ጉብኝት',
    'Register': 'መመዝገብ',
    'Registration': 'ምዝገባ',
    'Account': 'መለያ',
    'Cell': 'ክፍል',
    'Block': 'ብሎክ',
    'Section': 'ክፍል',
    'Guard': 'ጠባቂ',
    'Officer': 'መኮንን',
    'Admin': 'አስተዳዳሪ',
    'Administrator': 'አስተዳዳሪ',
    'User': 'ተጠቃሚ',
    'Case': 'ጉዳይ',
    'Court': 'ፍርድ ቤት',
    'Judge': 'ዳኛ',
    'Sentence': 'ፍርድ',
    'Crime': 'ወንጀል',
    'Criminal': 'ወንጀለኛ',
    'Release': 'መልቀቅ',
    'Date of Birth': 'የትውልድ ቀን',
    'First Name': 'የመጀመሪያ ስም',
    'Last Name': 'የአባት ስም',
    'Middle Name': 'የአያት ስም',
    'ID': 'መታወቂያ',
    'Identification': 'መታወቂያ',
    'Number': 'ቁጥር',
    'Male': 'ወንድ',
    'Female': 'ሴት',
    'Health': 'ጤና',
    'Medical': 'ሕክምና',
    'Doctor': 'ሐኪም',
    'Nurse': 'ነርስ',
    'Medication': 'መድሃኒት',
    'Treatment': 'ሕክምና',
    'Education': 'ትምህርት',
    'Training': 'ስልጠና',
    'Work': 'ሥራ',
    'Assignment': 'ስራ ድልድል',
    'Language': 'ቋንቋ',
    'English': 'እንግሊዘኛ',
    'Amharic': 'አማርኛ',
    'Change': 'ቀይር',
    'Apply': 'አመልክት',
    'Loading': 'በመጫን ላይ',
    'Please wait': 'እባክህ ጠብቅ',
    'Error': 'ስህተት',
    'Not found': 'አልተገኘም',
    'Unauthorized': 'ያልተፈቀደ',
    'Forbidden': 'የተከለከለ',
    'Server error': 'የሰርቨር ስህተት',
    'Connection error': 'የግንኙነት ስህተት',
    'Try again': 'እንደገና ሞክር',
    'Contact': 'አግኙን',
    'Help': 'እገዛ',
    'About': 'ስለ',
    'Guidelines': 'መመሪያዎች',
    'Terms': 'ውሎች',
    'Privacy': 'ግላዊነት',
    'Policy': 'ፖሊሲ',
    'Next': 'ቀጣይ',
    'Previous': 'ቀዳሚ',
    'First': 'መጀመሪያ',
    'Last': 'መጨረሻ',
    'Start': 'ጀምር',
    'End': 'ጨርስ',
    'Day': 'ቀን',
    'Week': 'ሳምንት',
    'Month': 'ወር',
    'Year': 'ዓመት',
    'Today': 'ዛሬ',
    'Tomorrow': 'ነገ',
    'Yesterday': 'ትላንት'
  },
  // Amharic to English (reverse of the above)
  am: {}
};

// Populate the reverse dictionary
Object.keys(fallbackDictionary.en).forEach(key => {
  fallbackDictionary.am[fallbackDictionary.en[key]] = key;
});

/**
 * Translate a single text string
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code (am for Amharic, en for English)
 * @param {string} sourceLanguage - Source language code (optional)
 * @returns {Promise<string>} Translated text
 */
export const translateText = async (text, targetLanguage, sourceLanguage = '') => {
  // Skip translation if text is empty or languages are the same
  if (!text || text.trim() === '' || targetLanguage === sourceLanguage) {
    return text;
  }

  // Determine source language if not provided
  const source = sourceLanguage || (targetLanguage === 'am' ? 'en' : 'am');
  
  // Check cache first
  if (translationCache[targetLanguage]?.[text]) {
    console.log('Translation found in cache');
    return translationCache[targetLanguage][text];
  }
  
  // Check fallback dictionary
  if (fallbackDictionary[source]?.[text]) {
    console.log('Translation found in fallback dictionary');
    return fallbackDictionary[source][text];
  }
  
  try {
    // First try our backend translation endpoint
    console.log('Attempting backend translation...');
    try {
      const response = await axiosInstance.post('/translate/text', {
        text,
        targetLanguage,
        sourceLanguage: source
      });
      
      if (response.data && response.data.success) {
        // Cache the result
        if (!translationCache[targetLanguage]) {
          translationCache[targetLanguage] = {};
        }
        translationCache[targetLanguage][text] = response.data.translation;
        
        return response.data.translation;
      }
    } catch (backendError) {
      console.error('Backend translation failed:', backendError);
      // Continue to LibreTranslate
    }
    
    // If backend translation fails, try external API
    console.log('Attempting LibreTranslate API...');
    try {
      // Try multiple LibreTranslate instances
      const instances = [
        'https://libretranslate.com',
        'https://translate.argosopentech.com',
        'https://translate.terraprint.co'
      ];
      
      let translatedText = null;
      
      // Try each instance until one works
      for (const instance of instances) {
        try {
          const externalResponse = await axios.post(`${instance}/translate`, {
            q: text,
            source: source === 'am' ? 'am' : 'en',
            target: targetLanguage === 'am' ? 'am' : 'en',
            format: 'text',
            api_key: '' // Intentionally blank for public access
          }, {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          });
          
          if (externalResponse.data && externalResponse.data.translatedText) {
            translatedText = externalResponse.data.translatedText;
            break; // Found a working instance
          }
        } catch (instanceError) {
          console.log(`Translation attempt failed for ${instance}:`, instanceError.message);
          // Try next instance
        }
      }
      
      if (translatedText) {
        // Cache the result
        if (!translationCache[targetLanguage]) {
          translationCache[targetLanguage] = {};
        }
        translationCache[targetLanguage][text] = translatedText;
        
        return translatedText;
      }
    } catch (libreError) {
      console.error('LibreTranslate API failed:', libreError);
    }
    
    // If all translation attempts fail, try text matching
    console.log('All translation APIs failed, trying fallback methods...');
    
    // When API fails, try to find similar entries in our dictionary
    const dictKeys = Object.keys(fallbackDictionary[source] || {});
    for (const key of dictKeys) {
      if (text.toLowerCase().includes(key.toLowerCase())) {
        return text.replace(new RegExp(key, 'gi'), fallbackDictionary[source][key]);
      }
    }
    
    // As a last resort, use simple word-by-word translation
    const words = text.split(' ');
    const translatedWords = words.map(word => {
      // Try to find this word in our dictionary
      return fallbackDictionary[source]?.[word] || word;
    });
    
    return translatedWords.join(' '); // Return the best effort translation
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
    // For small batches, translate one by one to leverage cache
    if (texts.length <= 5) {
      const results = [];
      for (const text of texts) {
        results.push(await translateText(text, targetLanguage, sourceLanguage));
      }
      return results;
    }
    
    // For larger batches, use the batch API
    const response = await axiosInstance.post('/translate/batch', {
      texts,
      targetLanguage,
      sourceLanguage
    });
    
    if (response.data && response.data.success) {
      // Cache individual translations
      response.data.translations.forEach((translation, index) => {
        if (!translationCache[targetLanguage]) {
          translationCache[targetLanguage] = {};
        }
        translationCache[targetLanguage][texts[index]] = translation;
      });
      
      return response.data.translations;
    }
    
    // If batch translation fails, translate one by one
    return Promise.all(texts.map(text => translateText(text, targetLanguage, sourceLanguage)));
  } catch (error) {
    console.error('Batch translation error:', error);
    return Promise.all(texts.map(text => translateText(text, targetLanguage, sourceLanguage)));
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
    const keys = Object.keys(object);
    const texts = keys.map(key => object[key]);
    
    // Translate all text values
    const translatedTexts = await translateMultipleTexts(texts, targetLanguage, sourceLanguage);
    
    // Reconstruct the object with translated values
    const translatedObject = {};
    keys.forEach((key, index) => {
      translatedObject[key] = translatedTexts[index];
    });
    
    return translatedObject;
  } catch (error) {
    console.error('Object translation error:', error);
    return object; // Return original object on error
  }
};

/**
 * Clear the translation cache
 */
export const clearTranslationCache = () => {
  translationCache.en = {};
  translationCache.am = {};
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