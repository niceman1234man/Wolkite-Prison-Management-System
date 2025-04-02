import React from 'react';

/**
 * A simple loading spinner component
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner ('sm', 'md', 'lg')
 * @param {string} props.color - Color of the spinner
 * @returns {JSX.Element} Loading spinner component
 */
const Loader = ({ size = 'md', color = 'blue' }) => {
  // Determine size class
  let sizeClass = 'h-8 w-8';
  if (size === 'sm') sizeClass = 'h-5 w-5';
  if (size === 'lg') sizeClass = 'h-12 w-12';
  
  // Determine color class
  let colorClass = 'border-blue-600';
  if (color === 'gray') colorClass = 'border-gray-600';
  if (color === 'green') colorClass = 'border-green-600';
  if (color === 'red') colorClass = 'border-red-600';
  if (color === 'yellow') colorClass = 'border-yellow-600';
  
  return (
    <div className="flex justify-center items-center p-4">
      <div className={`animate-spin rounded-full ${sizeClass} border-t-2 border-b-2 ${colorClass}`}></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Loader; 