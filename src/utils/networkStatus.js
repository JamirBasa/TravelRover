/**
 * Network Status Utility
 * 
 * Monitors network connectivity and provides helpful feedback
 */

/**
 * Check if the browser is online
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Check if Firebase is accessible
 * Performs a quick connectivity test
 */
export const checkFirebaseConnectivity = async () => {
  try {
    // Try to reach Firebase (simple fetch test)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch('https://firestore.googleapis.com/', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache'
    });
    
    clearTimeout(timeoutId);
    return response.ok || response.status === 404; // 404 is ok, means Firebase is reachable
  } catch (error) {
    console.warn('Firebase connectivity check failed:', error.message);
    return false;
  }
};

/**
 * Get user-friendly network status message
 */
export const getNetworkStatusMessage = () => {
  if (!navigator.onLine) {
    return {
      status: 'offline',
      message: 'No internet connection',
      suggestion: 'Please check your WiFi or mobile data connection.',
      canRetry: false
    };
  }
  
  return {
    status: 'online',
    message: 'Connected',
    suggestion: null,
    canRetry: true
  };
};

/**
 * Add network status listeners
 */
export const addNetworkListeners = (onOnline, onOffline) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

/**
 * Test Firebase connectivity with timeout
 * Returns promise that resolves to boolean
 */
export const testFirebaseConnection = (timeoutMs = 5000) => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(false);
    }, timeoutMs);
    
    checkFirebaseConnectivity().then((isConnected) => {
      clearTimeout(timeout);
      resolve(isConnected);
    }).catch(() => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
};
