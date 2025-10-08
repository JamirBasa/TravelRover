import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaTimes, FaCheckCircle, FaRobot } from 'react-icons/fa';

const GoogleMapsAPIStatus = ({ onClose }) => {
  const [apiStatus, setApiStatus] = useState('checking');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkAPIStatus();
  }, []);

  const checkAPIStatus = async () => {
    if (!window.google?.maps) {
      setApiStatus('not-loaded');
      return;
    }

    // Test Distance Matrix API
    const distanceService = new window.google.maps.DistanceMatrixService();
    
    distanceService.getDistanceMatrix({
      origins: ['Manila, Philippines'],
      destinations: ['Cebu, Philippines'],
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.METRIC,
    }, (response, status) => {
      if (status === 'REQUEST_DENIED') {
        setApiStatus('denied');
      } else if (status === 'OK') {
        setApiStatus('working');
        // Auto-close if working
        setTimeout(onClose, 2000);
      } else {
        setApiStatus('error');
      }
    });
  };

  if (apiStatus === 'working') {
    return (
      <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50 max-w-sm">
        <div className="flex items-center gap-3">
          <FaCheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <h4 className="font-semibold text-green-800">Google Maps Active</h4>
            <p className="text-sm text-green-600">Real-time travel data available</p>
          </div>
        </div>
      </div>
    );
  }

  if (apiStatus === 'checking') {
    return (
      <div className="fixed top-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-50 max-w-sm">
        <div className="flex items-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <div>
            <h4 className="font-semibold text-blue-800">Checking Maps API...</h4>
            <p className="text-sm text-blue-600">Testing Google Maps connectivity</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {apiStatus === 'denied' ? (
            <FaExclamationTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          ) : (
            <FaRobot className="w-5 h-5 text-amber-600 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-amber-800">
              {apiStatus === 'denied' ? 'Google Maps API Limited' : 'AI Travel Estimation'}
            </h4>
            <p className="text-sm text-amber-700 mb-2">
              {apiStatus === 'denied' 
                ? 'Using intelligent AI estimation for travel times'
                : 'Smart Philippines-aware travel calculations active'
              }
            </p>
            
            {!showDetails && (
              <button
                onClick={() => setShowDetails(true)}
                className="text-xs text-amber-600 hover:text-amber-800 underline"
              >
                Learn more →
              </button>
            )}

            {showDetails && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-amber-700">
                  <strong>✅ Currently Working:</strong>
                  <ul className="mt-1 ml-4 space-y-1">
                    <li>• Philippines-specific travel intelligence</li>
                    <li>• Airport connection estimates</li>
                    <li>• Inter-island travel calculations</li>
                    <li>• Traffic-aware city routing</li>
                  </ul>
                </div>
                
                {apiStatus === 'denied' && (
                  <div className="text-xs text-amber-700">
                    <strong>🔧 To Enable Real Google Maps:</strong>
                    <ul className="mt-1 ml-4 space-y-1">
                      <li>1. Go to Google Cloud Console</li>
                      <li>2. Enable "Distance Matrix API"</li>
                      <li>3. Enable "Directions API"</li>
                      <li>4. Refresh this page</li>
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => setShowDetails(false)}
                  className="text-xs text-amber-600 hover:text-amber-800 underline"
                >
                  ← Show less
                </button>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="text-amber-500 hover:text-amber-700 transition-colors"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default GoogleMapsAPIStatus;