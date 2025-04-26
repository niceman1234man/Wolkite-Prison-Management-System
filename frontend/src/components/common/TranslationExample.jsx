import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSelector from './LanguageSelector';
import TranslatedText, { T } from './TranslatedText';
import { FaExchangeAlt, FaCheck, FaSpinner } from 'react-icons/fa';

/**
 * A demonstration component for Amharic-English translation
 */
const TranslationExample = () => {
  const { translate, currentLanguage, LANGUAGE_CODES } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [manualTranslation, setManualTranslation] = useState('');
  const [textDirection, setTextDirection] = useState('ltr'); // ltr or rtl
  
  // Determine if the current language is Amharic
  const isAmharic = currentLanguage === LANGUAGE_CODES.AMHARIC;
  
  // Handle text input changes
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    // Auto-detect direction based on first character
    if (e.target.value) {
      const firstChar = e.target.value.charAt(0);
      const amharicRange = /[\u1200-\u137F]/; // Amharic Unicode range
      setTextDirection(amharicRange.test(firstChar) ? 'rtl' : 'ltr');
    }
  };
  
  // Translate the input text
  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    
    setIsTranslating(true);
    try {
      // Detect source language based on text direction
      const sourceLanguage = textDirection === 'rtl' ? LANGUAGE_CODES.AMHARIC : LANGUAGE_CODES.ENGLISH;
      const targetLanguage = sourceLanguage === LANGUAGE_CODES.AMHARIC ? LANGUAGE_CODES.ENGLISH : LANGUAGE_CODES.AMHARIC;
      
      const result = await translate(inputText, sourceLanguage);
      setTranslatedText(result);
      setManualTranslation(result);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto my-8">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          <T>Translation Tool</T>
        </h2>
        <LanguageSelector />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <T>Enter text to translate</T>
        </label>
        <textarea
          value={inputText}
          onChange={handleInputChange}
          dir={textDirection}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          rows="4"
          placeholder={isAmharic ? "ለመተርጎም ጽሑፍ ያስገቡ..." : "Enter text to translate..."}
        ></textarea>
      </div>
      
      <div className="mb-4 flex justify-center">
        <button
          onClick={handleTranslate}
          disabled={isTranslating || !inputText.trim()}
          className={`px-4 py-2 rounded-md flex items-center justify-center ${
            isTranslating || !inputText.trim()
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-teal-600 text-white hover:bg-teal-700"
          }`}
        >
          {isTranslating ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              <T>Translating...</T>
            </>
          ) : (
            <>
              <FaExchangeAlt className="mr-2" />
              <T>Translate</T>
            </>
          )}
        </button>
      </div>
      
      {translatedText && (
        <div className="mt-6">
          <h3 className="text-md font-medium text-gray-700 mb-2">
            <T>Translation Result</T>
          </h3>
          <div
            className="bg-gray-50 border border-gray-200 rounded-md p-4"
            dir={textDirection === 'rtl' ? 'ltr' : 'rtl'}
          >
            {translatedText}
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <T>Edit Translation</T>
            </label>
            <textarea
              value={manualTranslation}
              onChange={(e) => setManualTranslation(e.target.value)}
              dir={textDirection === 'rtl' ? 'ltr' : 'rtl'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              rows="3"
            ></textarea>
            <div className="mt-2 text-right">
              <button 
                className="px-3 py-1 bg-green-50 text-green-700 rounded-md border border-green-200 hover:bg-green-100 flex items-center justify-center inline-flex"
                onClick={() => setTranslatedText(manualTranslation)}
              >
                <FaCheck className="mr-1" />
                <T>Update</T>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 border-t border-gray-200 pt-4">
        <h3 className="text-md font-medium text-gray-700 mb-2">
          <T>Common Phrases</T>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-700">
              <T>Hello</T>
            </div>
            <div className="text-sm text-gray-500">
              {isAmharic ? "Hello" : "ሰላም"}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-700">
              <T>Welcome</T>
            </div>
            <div className="text-sm text-gray-500">
              {isAmharic ? "Welcome" : "እንኳን ደህና መጣህ"}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-700">
              <T>Thank you</T>
            </div>
            <div className="text-sm text-gray-500">
              {isAmharic ? "Thank you" : "አመሰግናለሁ"}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-700">
              <T>How are you?</T>
            </div>
            <div className="text-sm text-gray-500">
              {isAmharic ? "How are you?" : "እንዴት ነህ?"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationExample; 