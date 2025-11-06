/**
 * Form Persistence Utility
 * Saves and restores form progress to/from localStorage
 * Uses Philippine Time (PHT) for all timestamps
 */

import { getPHTNow, formatPHTDisplay } from './philippineTime';

const FORM_DRAFT_KEY = 'travelrover_trip_draft';
const DRAFT_EXPIRY_HOURS = 24; // Expire drafts after 24 hours

/**
 * Get current time in Philippine Time (PHT/UTC+8)
 */
const getPHTTimestamp = () => {
  return getPHTNow().getTime();
};

/**
 * Format PHT timestamp for display
 */
const formatPHTTimestamp = (timestamp) => {
  return formatPHTDisplay(new Date(timestamp), 'full');
};

/**
 * Save form progress to localStorage
 */
export const saveDraft = (formState) => {
  try {
    const draft = {
      ...formState,
      timestamp: getPHTTimestamp(),
      version: '1.0' // For future compatibility
    };
    
    localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draft));
    console.log('💾 Draft saved (PHT):', formatPHTTimestamp(draft.timestamp));
    return true;
  } catch {
    console.error('Failed to save draft');
    return false;
  }
};

/**
 * Load form progress from localStorage
 * Returns null if no draft or expired
 */
export const loadDraft = () => {
  try {
    const stored = localStorage.getItem(FORM_DRAFT_KEY);
    if (!stored) return null;
    
    const draft = JSON.parse(stored);
    
    // Check expiry using PHT
    const now = getPHTTimestamp();
    const age = now - draft.timestamp;
    const maxAge = DRAFT_EXPIRY_HOURS * 60 * 60 * 1000;
    
    if (age > maxAge) {
      console.log('⏰ Draft expired (PHT), clearing...');
      clearDraft();
      return null;
    }
    
    console.log('✅ Draft loaded from (PHT):', formatPHTTimestamp(draft.timestamp));
    return draft;
  } catch {
    console.error('Failed to load draft');
    return null;
  }
};

/**
 * Clear saved draft
 */
export const clearDraft = () => {
  try {
    localStorage.removeItem(FORM_DRAFT_KEY);
    console.log('🗑️ Draft cleared');
    return true;
  } catch {
    console.error('Failed to clear draft');
    return false;
  }
};

/**
 * Check if a draft exists
 */
export const hasDraft = () => {
  const draft = loadDraft();
  return draft !== null;
};

/**
 * Get draft age in hours
 */
export const getDraftAge = () => {
  try {
    const stored = localStorage.getItem(FORM_DRAFT_KEY);
    if (!stored) return null;
    
    const draft = JSON.parse(stored);
    const now = getPHTTimestamp();
    const ageMs = now - draft.timestamp;
    return ageMs / (60 * 60 * 1000); // Convert to hours
  } catch {
    return null;
  }
};

/**
 * Format draft age for display
 */
export const formatDraftAge = () => {
  const ageHours = getDraftAge();
  if (ageHours === null) return '';
  
  if (ageHours < 1) {
    const minutes = Math.floor(ageHours * 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (ageHours < 24) {
    const hours = Math.floor(ageHours);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    return 'more than a day ago';
  }
};
