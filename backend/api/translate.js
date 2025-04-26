const express = require('express');
const axios = require('axios');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Cache for storing translations to reduce API calls
const translationCache = {
  en: {}, // English to Amharic
  am: {}  // Amharic to English
};

// Fallback dictionary for common phrases
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
    'System': 'ሲስተም',
    'Prison': 'እስር ቤት',
    'Recovery': 'መልሶ ማግኘት',
    'Incremental': 'ጭማሪ',
    'Full': 'ሙሉ',
    'Create': 'ፍጠር',
    'Update': 'አዘምን',
    'Schedule': 'መርሃግብር',
    'History': 'ታሪክ',
    'Download': 'አውርድ',
  },
  // Amharic to English - will be populated automatically
  am: {}
};

// Populate the reverse dictionary automatically
Object.keys(fallbackDictionary.en).forEach(key => {
  fallbackDictionary.am[fallbackDictionary.en[key]] = key;
});

/**
 * Translate text using external API
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code (am/en)
 * @param {string} sourceLanguage - Source language code
 * @returns {Promise<string>} Translated text
 */
async function translateWithExternalAPI(text, targetLanguage, sourceLanguage) {
  try {
    // Try using LibreTranslate API (free and open source)
    const response = await axios.post('https://libretranslate.com/translate', {
      q: text,
      source: sourceLanguage,
      target: targetLanguage,
      format: 'text',
      api_key: '' // Intentionally blank for public access
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 second timeout
    });
    
    if (response.data && response.data.translatedText) {
      return response.data.translatedText;
    }
    
    throw new Error('Translation failed');
  } catch (error) {
    console.error('External translation error:', error);
    
    // Fallback to Google Translate API (if you have an API key)
    // Uncomment and configure if you have a Google Cloud Translation API key
    /*
    try {
      const googleResponse = await axios.post(
        `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
        {
          q: text,
          source: sourceLanguage,
          target: targetLanguage,
          format: 'text'
        }
      );
      
      if (googleResponse.data && 
          googleResponse.data.data && 
          googleResponse.data.data.translations && 
          googleResponse.data.data.translations[0]) {
        return googleResponse.data.data.translations[0].translatedText;
      }
    } catch (googleError) {
      console.error('Google translation error:', googleError);
    }
    */
    
    // If all APIs fail, check if we have a fallback translation
    const fallbackDict = sourceLanguage === 'en' ? fallbackDictionary.en : fallbackDictionary.am;
    if (fallbackDict[text]) {
      return fallbackDict[text];
    }
    
    // Try to find partial matches in the dictionary
    for (const key of Object.keys(fallbackDict)) {
      if (text.toLowerCase().includes(key.toLowerCase())) {
        return text.replace(new RegExp(key, 'gi'), fallbackDict[key]);
      }
    }
    
    // Last resort: return the original text
    return text;
  }
}

/**
 * @route   POST /api/translate/text
 * @desc    Translate a single text string
 * @access  Public
 */
router.post('/text', [
  check('text', 'Text is required').not().isEmpty(),
  check('targetLanguage', 'Target language is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { text, targetLanguage, sourceLanguage = '' } = req.body;
  
  // Skip translation if the text is empty
  if (!text || text.trim() === '') {
    return res.json({ success: true, translation: text });
  }
  
  // Skip if source and target languages are the same
  if (sourceLanguage && sourceLanguage === targetLanguage) {
    return res.json({ success: true, translation: text });
  }
  
  try {
    // Determine source language if not provided
    const source = sourceLanguage || (targetLanguage === 'am' ? 'en' : 'am');
    
    // Check cache first
    const cacheKey = `${source}_${targetLanguage}_${text}`;
    if (translationCache[targetLanguage] && translationCache[targetLanguage][text]) {
      return res.json({ 
        success: true, 
        translation: translationCache[targetLanguage][text],
        cached: true
      });
    }
    
    // Check fallback dictionary
    if (fallbackDictionary[source] && fallbackDictionary[source][text]) {
      return res.json({
        success: true,
        translation: fallbackDictionary[source][text],
        fromDictionary: true
      });
    }
    
    // Translate using external API
    const translation = await translateWithExternalAPI(text, targetLanguage, source);
    
    // Cache the result
    if (!translationCache[targetLanguage]) {
      translationCache[targetLanguage] = {};
    }
    translationCache[targetLanguage][text] = translation;
    
    return res.json({ success: true, translation });
  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Translation failed',
      original: text
    });
  }
});

/**
 * @route   POST /api/translate/batch
 * @desc    Translate multiple text strings in a batch
 * @access  Public
 */
router.post('/batch', [
  check('texts', 'Texts array is required').isArray(),
  check('targetLanguage', 'Target language is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { texts, targetLanguage, sourceLanguage = '' } = req.body;
  
  try {
    // Determine source language if not provided
    const source = sourceLanguage || (targetLanguage === 'am' ? 'en' : 'am');
    
    // Process each text in parallel
    const promises = texts.map(async (text) => {
      // Skip empty texts
      if (!text || text.trim() === '') {
        return text;
      }
      
      // Check cache
      if (translationCache[targetLanguage] && translationCache[targetLanguage][text]) {
        return translationCache[targetLanguage][text];
      }
      
      // Check dictionary
      if (fallbackDictionary[source] && fallbackDictionary[source][text]) {
        return fallbackDictionary[source][text];
      }
      
      // Translate
      try {
        const translation = await translateWithExternalAPI(text, targetLanguage, source);
        
        // Cache result
        if (!translationCache[targetLanguage]) {
          translationCache[targetLanguage] = {};
        }
        translationCache[targetLanguage][text] = translation;
        
        return translation;
      } catch (error) {
        console.error(`Error translating "${text}":`, error);
        return text;
      }
    });
    
    const translations = await Promise.all(promises);
    
    return res.json({ success: true, translations });
  } catch (error) {
    console.error('Batch translation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Batch translation failed',
      originals: texts
    });
  }
});

/**
 * @route   POST /api/translate/object
 * @desc    Translate all string values in an object
 * @access  Public
 */
router.post('/object', [
  check('object', 'Object is required').isObject(),
  check('targetLanguage', 'Target language is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { object, targetLanguage, sourceLanguage = '' } = req.body;
  
  try {
    // Determine source language if not provided
    const source = sourceLanguage || (targetLanguage === 'am' ? 'en' : 'am');
    
    // Get all string values from the object
    const keys = Object.keys(object);
    const values = keys.map(key => typeof object[key] === 'string' ? object[key] : '');
    
    // Translate all string values
    const translatedValues = await Promise.all(
      values.map(async (value, index) => {
        if (typeof value !== 'string' || !value.trim()) {
          return values[index];
        }
        
        // Check cache
        if (translationCache[targetLanguage] && translationCache[targetLanguage][value]) {
          return translationCache[targetLanguage][value];
        }
        
        // Check dictionary
        if (fallbackDictionary[source] && fallbackDictionary[source][value]) {
          return fallbackDictionary[source][value];
        }
        
        // Translate
        try {
          const translation = await translateWithExternalAPI(value, targetLanguage, source);
          
          // Cache result
          if (!translationCache[targetLanguage]) {
            translationCache[targetLanguage] = {};
          }
          translationCache[targetLanguage][value] = translation;
          
          return translation;
        } catch (error) {
          console.error(`Error translating "${value}":`, error);
          return value;
        }
      })
    );
    
    // Reconstruct the object with translated values
    const translation = {};
    keys.forEach((key, index) => {
      translation[key] = typeof object[key] === 'string' ? translatedValues[index] : object[key];
    });
    
    return res.json({ success: true, translation });
  } catch (error) {
    console.error('Object translation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Object translation failed',
      original: object
    });
  }
});

/**
 * @route   GET /api/translate/languages
 * @desc    Get supported languages
 * @access  Public
 */
router.get('/languages', (req, res) => {
  return res.json({
    success: true,
    languages: [
      { code: 'en', name: 'English' },
      { code: 'am', name: 'Amharic' },
    ]
  });
});

/**
 * @route   GET /api/translate/cache/stats
 * @desc    Get translation cache statistics
 * @access  Admin
 */
router.get('/cache/stats', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    const stats = {
      en: Object.keys(translationCache.en || {}).length,
      am: Object.keys(translationCache.am || {}).length,
      total: Object.keys(translationCache.en || {}).length + Object.keys(translationCache.am || {}).length,
      dictionarySize: {
        en: Object.keys(fallbackDictionary.en || {}).length,
        am: Object.keys(fallbackDictionary.am || {}).length
      }
    };
    
    return res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route   DELETE /api/translate/cache
 * @desc    Clear translation cache
 * @access  Admin
 */
router.delete('/cache', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    // Clear cache
    translationCache.en = {};
    translationCache.am = {};
    
    return res.json({ success: true, message: 'Translation cache cleared' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router; 