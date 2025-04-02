import '../../styles/responsive.css';
import '../../styles/table.css';
import { useMediaQuery } from 'react-responsive';

/**
 * Helper function to determine if the current device is mobile
 * @returns {boolean} True if the device is mobile (screen width < 640px)
 */
export const useIsMobile = () => {
  const isMobile = useMediaQuery({ query: '(max-width: 639px)' });
  return isMobile;
};

/**
 * Helper function to determine if the current device is a tablet
 * @returns {boolean} True if the device is a tablet (screen width between 640px and 1023px)
 */
export const useIsTablet = () => {
  const isTablet = useMediaQuery({ query: '(min-width: 640px) and (max-width: 1023px)' });
  return isTablet;
};

/**
 * Helper function to determine if the current device is desktop
 * @returns {boolean} True if the device is desktop (screen width >= 1024px)
 */
export const useIsDesktop = () => {
  const isDesktop = useMediaQuery({ query: '(min-width: 1024px)' });
  return isDesktop;
};

/**
 * Helper function to get the appropriate number of grid columns based on screen size
 * @param {object} options Configuration options
 * @param {number} options.mobile Number of columns on mobile (default: 1)
 * @param {number} options.tablet Number of columns on tablet (default: 2)
 * @param {number} options.desktop Number of columns on desktop (default: 3)
 * @returns {number} The number of columns to use
 */
export const useResponsiveColumns = (options = {}) => {
  const { mobile = 1, tablet = 2, desktop = 3 } = options;
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  if (isMobile) return mobile;
  if (isTablet) return tablet;
  return desktop;
};

/**
 * Helper function to truncate text for mobile displays
 * @param {string} text Text to truncate
 * @param {number} length Maximum length on mobile (default: 25)
 * @returns {string} Truncated text on mobile, full text otherwise
 */
export const useResponsiveText = (text, length = 25) => {
  const isMobile = useIsMobile();
  
  if (isMobile && text && text.length > length) {
    return `${text.substring(0, length)}...`;
  }
  
  return text;
};

/**
 * Adds classes to the main container based on sidebar state
 * @param {boolean} isCollapsed Whether the sidebar is collapsed
 * @returns {string} CSS classes to apply to the main container
 */
export const getContainerClasses = (isCollapsed) => {
  return `visitor-container ${isCollapsed ? 'ml-16' : 'ml-64'}`;
}; 