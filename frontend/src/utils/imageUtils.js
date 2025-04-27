/**
 * Utility functions for handling image URLs and paths
 */

/**
 * Converts a relative or partial image path to a full URL
 * @param {string} imagePath - The image path to convert
 * @returns {string|null} - The full image URL or null if no path provided
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // Debug the path for troubleshooting
  console.log("Processing image path:", imagePath);
  
  // If it already starts with http/https, it's a full URL
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Use environment variable for API URL or fallback to localhost
  const apiBaseUrl = 'http://localhost:5001';
  
  // If it's a relative path starting with /uploads or /api
  if (imagePath.startsWith('/uploads') || imagePath.startsWith('/api')) {
    return `${apiBaseUrl}${imagePath}`;
  }
  
  // For other relative paths, just prepend the API base URL
  return `${apiBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

/**
 * Creates a placeholder URL for missing images
 * @param {string} text - Text to display on the placeholder
 * @returns {string} - Placeholder URL
 */
export const getPlaceholderUrl = (text = 'No Image') => {
  return `https://via.placeholder.com/150?text=${encodeURIComponent(text)}`;
};

/**
 * Error handler for image loading problems
 * @param {Event} error - The error event
 * @param {string} type - The type of image (e.g., 'ID', 'Visitor')
 * @param {string} path - Original image path that failed
 */
export const handleImageError = (error, type = 'Image', path = '') => {
  console.error(`Failed to load ${type} from:`, error.target.src);
  
  // Reset the error handler to prevent infinite loops
  error.target.onerror = null;
  
  // Set a placeholder image
  error.target.src = getPlaceholderUrl(`No ${type}`);
  
  // Style the error state
  error.target.className = "w-full h-full object-contain rounded-lg shadow-md border border-red-200";
  
  // Optionally add an error message below the image
  const parent = error.target.parentElement;
  if (parent) {
    const errorText = document.createElement('p');
    errorText.className = "text-xs text-red-500 mt-2";
    errorText.textContent = `Error loading ${type.toLowerCase()}. Path: ${path}`;
    parent.appendChild(errorText);
  }
}; 