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
  const { translate, currentLanguage, LANGUAGE_CODES } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  
  // Set a source language if not provided
  const source = sourceLanguage || LANGUAGE_CODES.ENGLISH;
  
  useEffect(() => {
    // Skip translation if the text is empty or source language is the same as target
    if (!text || text.trim() === '' || source === currentLanguage) {
      setTranslatedText(text);
      return;
    }
    
    const translateText = async () => {
      setIsLoading(true);
      try {
        const result = await translate(text, source);
        setTranslatedText(result);
      } catch (error) {
        console.error('Translation failed:', error);
        setTranslatedText(text); // Fallback to original text
      } finally {
        setIsLoading(false);
      }
    };
    
    translateText();
  }, [text, currentLanguage, source, translate]);
  
  // Render the appropriate HTML element with the translated text
  const Element = as;
  
  return (
    <Element {...props}>
      {isLoading ? (
        <>
          <span className="opacity-50">{text}</span>
          <span className="ml-2 inline-block animate-pulse">...</span>
        </>
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

export default TranslatedText; 