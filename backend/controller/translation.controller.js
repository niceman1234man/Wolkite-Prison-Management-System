import { translateText, translateMultipleTexts, translateObject } from '../utils/azureTranslator.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * Translate a single text from one language to another
 */
export const translateSingleText = async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }
    
    if (!targetLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Target language is required'
      });
    }
    
    const translatedText = await translateText(text, targetLanguage, sourceLanguage);
    
    // Log the translation activity
    if (req.user) {
      await logActivity({
        userId: req.user._id,
        action: 'translate',
        description: `Translated text from ${sourceLanguage || 'auto'} to ${targetLanguage}`,
        resourceType: 'translation',
        resourceId: null,
        metadata: { textLength: text.length }
      });
    }
    
    res.status(200).json({
      success: true,
      translation: translatedText,
      source: text,
      targetLanguage,
      sourceLanguage: sourceLanguage || 'auto-detected'
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate text',
      error: error.message
    });
  }
};

/**
 * Translate multiple texts in a batch
 */
export const translateMultipleTextsEndpoint = async (req, res) => {
  try {
    const { texts, targetLanguage, sourceLanguage } = req.body;
    
    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({
        success: false,
        message: 'Texts array is required'
      });
    }
    
    if (!targetLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Target language is required'
      });
    }
    
    const translatedTexts = await translateMultipleTexts(texts, targetLanguage, sourceLanguage);
    
    // Log the bulk translation activity
    if (req.user) {
      await logActivity({
        userId: req.user._id,
        action: 'translate-bulk',
        description: `Translated ${texts.length} texts from ${sourceLanguage || 'auto'} to ${targetLanguage}`,
        resourceType: 'translation',
        resourceId: null,
        metadata: { count: texts.length }
      });
    }
    
    res.status(200).json({
      success: true,
      translations: translatedTexts,
      sources: texts,
      targetLanguage,
      sourceLanguage: sourceLanguage || 'auto-detected'
    });
  } catch (error) {
    console.error('Bulk translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate texts',
      error: error.message
    });
  }
};

/**
 * Translate all string values in an object
 */
export const translateObjectEndpoint = async (req, res) => {
  try {
    const { object, targetLanguage, sourceLanguage } = req.body;
    
    if (!object || typeof object !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Object is required'
      });
    }
    
    if (!targetLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Target language is required'
      });
    }
    
    const translatedObject = await translateObject(object, targetLanguage, sourceLanguage);
    
    // Log the object translation activity
    if (req.user) {
      await logActivity({
        userId: req.user._id,
        action: 'translate-object',
        description: `Translated object values from ${sourceLanguage || 'auto'} to ${targetLanguage}`,
        resourceType: 'translation',
        resourceId: null,
        metadata: { keyCount: Object.keys(object).length }
      });
    }
    
    res.status(200).json({
      success: true,
      translation: translatedObject,
      source: object,
      targetLanguage,
      sourceLanguage: sourceLanguage || 'auto-detected'
    });
  } catch (error) {
    console.error('Object translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate object',
      error: error.message
    });
  }
}; 