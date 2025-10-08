import { useEffect } from 'react';

/**
 * Custom hook to dynamically update the page title
 * @param {string} title - The title for the current page
 * @param {string} suffix - Optional suffix (defaults to "Travel Rover")
 */
export const usePageTitle = (title, suffix = "Travel Rover") => {
  useEffect(() => {
    const prevTitle = document.title;
    
    if (title) {
      document.title = `${title} | ${suffix}`;
    } else {
      document.title = suffix;
    }

    // Cleanup function to restore previous title if needed
    return () => {
      // Optional: You can restore the previous title or keep the new one
      document.title = prevTitle;
    };
  }, [title, suffix]);
};

export default usePageTitle;