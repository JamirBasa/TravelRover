// TypeScript type definitions for drag and drop functionality
// Note: Since this is a .jsx file, these are JSDoc comments for better IDE support

/**
 * @typedef {Object} Activity
 * @property {string} [placeName] - Name of the place/activity
 * @property {string} [time] - Time of the activity (e.g., "9:00 AM")
 * @property {string} [placeDetails] - Description of the activity
 * @property {string} [ticketPricing] - Pricing information
 * @property {string} [timeTravel] - Duration of the activity
 * @property {number|string} [rating] - Rating of the activity
 * @property {string} [geoCoordinates] - Geographic coordinates
 * @property {string} [placeImageUrl] - Image URL for the place
 */

/**
 * @typedef {Object} DayItinerary
 * @property {number} day - Day number
 * @property {string} [theme] - Theme or description for the day
 * @property {Activity[]} plan - Array of activities for the day
 * @property {string} [planText] - Legacy text format (pipe-separated)
 */

/**
 * @typedef {Object} DragData
 * @property {"activity"|"day"} type - Type of dragged item
 * @property {number} dayIndex - Index of the day
 * @property {number} [activityIndex] - Index of the activity (for activity type)
 * @property {Activity} [activity] - Activity object (for activity type)
 */

/**
 * @typedef {Object} DragEvent
 * @property {Object} active - Active dragged item
 * @property {string} active.id - ID of the dragged item
 * @property {Object} active.data - Data of the dragged item
 * @property {DragData} active.data.current - Current drag data
 * @property {Object} [over] - Item being dragged over
 * @property {string} [over.id] - ID of the item being dragged over
 * @property {Object} [over.data] - Data of the item being dragged over
 * @property {DragData} [over.data.current] - Current over data
 */

/**
 * @typedef {Object} SortableActivityProps
 * @property {Activity} activity - The activity object
 * @property {number} dayIndex - Index of the day containing this activity
 * @property {number} activityIndex - Index of this activity within the day
 * @property {boolean} isDragging - Whether this activity is currently being dragged
 */

/**
 * @typedef {Object} DroppableDayProps
 * @property {React.ReactNode} children - Child elements
 * @property {number} dayIndex - Index of this day
 * @property {boolean} [isOver] - Whether something is being dragged over this day
 */

/**
 * @typedef {Object} PlacesToVisitProps
 * @property {Object} trip - Trip object containing itinerary and places data
 * @property {Object} trip.tripData - Trip data object
 * @property {DayItinerary[]|string} trip.tripData.itinerary - Itinerary data (array or JSON string)
 * @property {Object[]|string} trip.tripData.placesToVisit - Places to visit data
 * @property {Object} [trip.userSelection] - User selection data
 * @property {string|number} [trip.userSelection.duration] - Trip duration
 * @property {boolean} [trip.hasRealFlights] - Whether trip has real flight data
 */

/**
 * @typedef {Object} PerDayEditState
 * @property {number|null} editingDay - Index of the day currently being edited (null if none)
 * @property {Set<number>} expandedDays - Set of day indices that are expanded
 * @property {function} startEditingDay - Function to start editing a specific day
 * @property {function} saveDayChanges - Function to save changes for a specific day
 * @property {function} cancelDayEdit - Function to cancel editing for a specific day
 * @property {function} toggleDayExpansion - Function to expand/collapse a specific day
 */

/**
 * @typedef {Object} DragSensors
 * @property {Object} PointerSensor - Mouse/touch sensor configuration
 * @property {Object} KeyboardSensor - Keyboard navigation sensor
 * @property {Object} TouchSensor - Enhanced touch sensor for mobile
 */

/**
 * @typedef {Object} AccessibilityAnnouncements
 * @property {function} onDragStart - Announced when drag starts
 * @property {function} onDragOver - Announced during drag over events
 * @property {function} onDragEnd - Announced when drag completes
 */

/**
 * @typedef {Object} EnhancedActivityProps
 * @property {Activity} activity - The activity object
 * @property {number} dayIndex - Index of the day containing this activity
 * @property {number} activityIndex - Index of this activity within the day
 * @property {boolean} isDragging - Whether this activity is currently being dragged
 * @property {boolean} isEditable - Whether this activity can be edited (day is in edit mode)
 * @property {boolean} isVisited - Whether this activity has been completed
 * @property {string} [notes] - User notes for this activity
 * @property {function} [onToggleVisited] - Callback to toggle visited status
 * @property {function} [onUpdateNotes] - Callback to update activity notes
 */

/**
 * @typedef {Object} DayHeaderProps
 * @property {Object} dayItem - The day item object from itinerary
 * @property {number} dayIndex - Index of this day in the itinerary
 * @property {boolean} isEditing - Whether this day is currently being edited
 * @property {boolean} isExpanded - Whether this day's activities are expanded
 * @property {function} onStartEdit - Callback to start editing this day
 * @property {function} onSaveChanges - Callback to save changes for this day
 * @property {function} onCancelEdit - Callback to cancel editing this day
 * @property {function} onToggleExpansion - Callback to expand/collapse this day
 */

/**
 * @typedef {Object} PerformanceOptimizations
 * @property {boolean} memoizedComponents - Components wrapped in React.memo
 * @property {boolean} stableKeys - Consistent key generation for React reconciliation
 * @property {boolean} batchedUpdates - State updates are batched for performance
 * @property {boolean} optimisticUI - Immediate visual feedback during operations
 */

/**
 * @typedef {Object} MultiDayItineraryData
 * @property {number} day - Day number
 * @property {string} title - Day title/description
 * @property {Activity[]} activities - Array of activities for this day
 */

/**
 * @typedef {Object} ItineraryStatistics
 * @property {number} totalActivities - Total number of activities across all days
 * @property {number} visitedCount - Number of completed activities
 * @property {number} completionRate - Percentage of activities completed (0-100)
 * @property {number} totalDays - Total number of days in the itinerary
 */


export {};