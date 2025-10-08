import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { FaRoute, FaClock, FaMapMarkerAlt, FaArrowRight, FaCogs, FaExternalLinkAlt } from 'react-icons/fa';

const RouteVisualization = ({ optimizedRoute, onOpenRoute }) => {
  const [expandedStep, setExpandedStep] = useState(null);

  if (!optimizedRoute?.optimizedRoute || optimizedRoute.optimizedRoute.length === 0) {
    return null;
  }

  const { optimizedRoute: route, routeDetails, totalEstimatedTime, suggestions } = optimizedRoute;

  return (
    <div className="space-y-4">
      {/* Route Header */}
      <div className="brand-card p-4 shadow-lg border-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <FaRoute className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-800">Optimized Route</h3>
              <p className="text-sm text-green-600 flex items-center gap-2">
                <FaClock className="w-4 h-4" />
                <span>Estimated time: {totalEstimatedTime}</span>
              </p>
            </div>
          </div>
          
          <Button
            onClick={onOpenRoute}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
            size="sm"
          >
            <FaExternalLinkAlt className="w-4 h-4 mr-2" />
            Open in Maps
          </Button>
        </div>

        {/* Route Steps */}
        <div className="space-y-3">
          {route.map((location, index) => {
            const isExpanded = expandedStep === index;
            const detail = routeDetails?.[index];
            const nextLocation = route[index + 1];
            
            return (
              <div key={index} className="relative">
                {/* Step Card */}
                <div
                  className={`bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border transition-all cursor-pointer ${
                    isExpanded 
                      ? 'border-green-300 shadow-md' 
                      : 'border-green-200 hover:border-green-300 hover:shadow-sm'
                  }`}
                  onClick={() => setExpandedStep(isExpanded ? null : index)}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Step Number */}
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {index + 1}
                      </div>
                      
                      {/* Location Info */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-800">
                          {location.location || location.placeName}
                        </h4>
                        <p className="text-sm text-green-600">
                          {location.time || 'All Day'}
                          {detail?.estimatedDuration && (
                            <span className="ml-2">• {detail.estimatedDuration}</span>
                          )}
                        </p>
                      </div>

                      {/* Timing Info */}
                      <div className="text-right">
                        {detail?.estimatedDuration && (
                          <p className="text-xs text-green-700 font-medium">
                            {detail.estimatedDuration}
                          </p>
                        )}
                        {detail?.travelTimeToNext && (
                          <p className="text-xs text-green-600">
                            +{detail.travelTimeToNext}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && detail && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-green-800 mb-2">Activity Details</h5>
                            <p className="text-sm text-green-700">
                              {location.placeDetails || location.description || 'No additional details available'}
                            </p>
                          </div>
                          
                          {detail.suggestions && detail.suggestions.length > 0 && (
                            <div>
                              <h5 className="font-medium text-green-800 mb-2">💡 Tips</h5>
                              <ul className="space-y-1">
                                {detail.suggestions.slice(0, 2).map((tip, tipIndex) => (
                                  <li key={tipIndex} className="text-xs text-green-600">
                                    • {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection Arrow */}
                {nextLocation && (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-2 text-green-500">
                      <div className="w-4 h-0.5 bg-green-300"></div>
                      <FaArrowRight className="w-3 h-3" />
                      <div className="w-4 h-0.5 bg-green-300"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Route Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="brand-card p-4 shadow-md border-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">💡</span>
            </div>
            <h4 className="font-semibold text-amber-800">Smart Recommendations</h4>
          </div>
          
          <div className="grid gap-3">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200"
              >
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-sm">{suggestion.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-amber-800 font-medium capitalize">
                    {suggestion.type} Tip
                  </p>
                  <p className="text-sm text-amber-700">
                    {suggestion.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Route Statistics */}
      <div className="brand-card p-4 shadow-md border-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">📊</span>
          </div>
          <h4 className="font-semibold text-blue-800">Route Statistics</h4>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">{route.length}</p>
            <p className="text-xs text-blue-600">Total Stops</p>
          </div>
          
          <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
            <p className="text-2xl font-bold text-green-700">{totalEstimatedTime}</p>
            <p className="text-xs text-green-600">Est. Duration</p>
          </div>
          
          <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-700">
              {route.filter(r => r.time && r.time !== 'All Day').length}
            </p>
            <p className="text-xs text-purple-600">Timed Activities</p>
          </div>
          
          <div className="text-center p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-700">{suggestions?.length || 0}</p>
            <p className="text-xs text-amber-600">Smart Tips</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteVisualization;