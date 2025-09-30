// Places to Visit Components - Centralized exports
// This index file provides clean imports for all components

// Main Component (orchestrating component)
export { default as PlacesToVisit } from './PlacesToVisit';

// Overview Components
export { default as TripOverviewStats } from './overview/TripOverviewStats';
export { default as PlacesToVisitSection } from './overview/PlacesToVisitSection';

// Itinerary Components  
export { default as DayHeader } from './itinerary/DayHeader';
export { default as DayActivities } from './itinerary/DayActivities';

// Activities Components - Using inline editing only
export { default as ActivitiesRenderer } from './activities/ActivitiesRenderer';
export { default as RegularActivity } from './activities/RegularActivity';
export { default as Activity } from './activities/Activity';
export { default as ActivitiesContainer } from './activities/ActivitiesContainer';

// Shared Components
export { default as EmptyStateComponent } from './shared/EmptyStateComponent';
export { default as ItineraryNavigationHelper } from './shared/ItineraryNavigationHelper';
export { default as TravelTipsSection } from './shared/TravelTipsSection';
export { default as PlaceCardItem } from '../shared/PlaceCardItem';