import React from 'react';
import { getTripTypeLabel, getTripTypeIcon } from '../../../utils/activityPersonalization';

/**
 * PersonalizationBadge Component
 * Shows a badge when an activity matches user's preferred trip types
 * 
 * @param {Object} props
 * @param {Array<string>} props.matches - Array of matching trip type IDs
 * @param {string} props.primaryMatch - Primary matching trip type
 * @param {string} props.size - Badge size ('sm' | 'md' | 'lg')
 * @param {boolean} props.showIcon - Whether to show emoji icon
 * @param {boolean} props.showLabel - Whether to show trip type label
 */
const PersonalizationBadge = ({ 
  matches = [], 
  primaryMatch = null,
  size = 'sm',
  showIcon = true,
  showLabel = true
}) => {
  if (matches.length === 0 || !primaryMatch) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const icon = getTripTypeIcon(primaryMatch);

  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 text-white font-medium shadow-sm ${sizeClasses[size]}`}
      title={`Matches your ${matches.map(getTripTypeLabel).join(', ')} preference${matches.length > 1 ? 's' : ''}`}
    >
      {showIcon && <span className={iconSizes[size]}>{icon}</span>}
      {showLabel && <span>For You</span>}
      {matches.length > 1 && (
        <span className="text-white/80 text-xs">+{matches.length - 1}</span>
      )}
    </span>
  );
};

export default PersonalizationBadge;
