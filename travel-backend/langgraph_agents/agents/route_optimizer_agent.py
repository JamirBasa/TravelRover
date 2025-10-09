# langgraph_agents/agents/route_optimizer_agent.py
from typing import Dict, Any, List, Tuple
import asyncio
import math
from datetime import datetime, timedelta
import json
import logging
from .base_agent import BaseAgent
from .genetic_optimizer import GeneticItineraryOptimizer

logger = logging.getLogger(__name__)

class RouteOptimizerAgent(BaseAgent):
    """LangGraph Route Optimization Agent - Optimizes daily itineraries for travel efficiency"""
    
    def __init__(self, session_id: str, use_genetic_algorithm: bool = True):
        super().__init__(session_id, 'route_optimizer')
        
        # Genetic Algorithm optimizer
        self.use_genetic_algorithm = use_genetic_algorithm
        self.genetic_optimizer = GeneticItineraryOptimizer(
            population_size=50,
            generations=100,
            mutation_rate=0.15,
            crossover_rate=0.7,
            elite_size=5
        )
        
        # Activity type mappings for intelligent routing
        self.activity_types = {
            'ATTRACTION': {'base_time': 120, 'priority': 3, 'time_slots': ['MORNING', 'AFTERNOON', 'EVENING']},
            'RESTAURANT': {'base_time': 90, 'priority': 2, 'time_slots': ['LUNCH', 'DINNER']},
            'MUSEUM': {'base_time': 180, 'priority': 4, 'time_slots': ['MORNING', 'AFTERNOON']},
            'PARK': {'base_time': 120, 'priority': 3, 'time_slots': ['MORNING', 'AFTERNOON']},
            'SHOPPING': {'base_time': 90, 'priority': 2, 'time_slots': ['AFTERNOON', 'EVENING']},
            'ENTERTAINMENT': {'base_time': 150, 'priority': 3, 'time_slots': ['AFTERNOON', 'EVENING']},
            'HOTEL': {'base_time': 30, 'priority': 1, 'time_slots': ['MORNING', 'EVENING']},
            'DEFAULT': {'base_time': 120, 'priority': 3, 'time_slots': ['AFTERNOON']}
        }
        
        # Optimal time slots for activities
        self.time_slots = {
            'MORNING': {'start': 9, 'end': 12, 'label': 'Morning'},
            'LUNCH': {'start': 12, 'end': 14, 'label': 'Lunch'},
            'AFTERNOON': {'start': 14, 'end': 17, 'label': 'Afternoon'},
            'DINNER': {'start': 18, 'end': 21, 'label': 'Dinner'},
            'EVENING': {'start': 17, 'end': 21, 'label': 'Evening'}
        }
    
    async def _execute_logic(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optimize routes for daily itineraries during trip creation
        
        Args:
            input_data: Contains itinerary data with daily activities
            
        Returns:
            Optimized itinerary with route data
        """
        try:
            logger.info("🚗 Starting route optimization for itinerary")
            
            # Extract itinerary data
            itinerary_data = input_data.get('itinerary_data', {})
            trip_params = input_data.get('trip_params', {})
            
            # Check if we should use genetic algorithm
            if self.use_genetic_algorithm and self._can_use_genetic_algorithm(itinerary_data):
                logger.info("🧬 Using Genetic Algorithm for itinerary optimization")
                return await self._optimize_with_genetic_algorithm(itinerary_data, trip_params)
            
            # Fallback to traditional optimization
            logger.info("🔄 Using traditional route optimization")
            
            # Process daily itineraries
            optimized_days = []
            
            for day_num, day_data in itinerary_data.items():
                if isinstance(day_data, dict) and 'activities' in day_data:
                    optimized_day = await self._optimize_daily_route(
                        day_num, 
                        day_data['activities'],
                        trip_params
                    )
                    optimized_days.append(optimized_day)
            
            # Generate optimization summary
            summary = self._generate_optimization_summary(optimized_days)
            
            return {
                'optimized_itinerary': {day['day']: day for day in optimized_days},
                'optimization_summary': summary,
                'route_efficiency_score': summary['average_efficiency_score'],
                'total_travel_time_minutes': summary['total_travel_time'],
                'recommendations': summary['recommendations']
            }
            
        except Exception as e:
            logger.error(f"❌ Route optimization failed: {str(e)}")
            return {
                'error': str(e),
                'fallback_itinerary': input_data.get('itinerary_data', {}),
                'optimization_applied': False
            }
    
    def _can_use_genetic_algorithm(self, itinerary_data: Dict) -> bool:
        """Check if genetic algorithm can be used for this itinerary"""
        
        # Count total activities
        total_activities = 0
        for day_num, day_data in itinerary_data.items():
            if isinstance(day_data, dict) and 'activities' in day_data:
                total_activities += len(day_data['activities'])
        
        # Use GA only if we have enough activities (>= 5)
        return total_activities >= 5
    
    async def _optimize_with_genetic_algorithm(
        self,
        itinerary_data: Dict[str, Any],
        trip_params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Optimize itinerary using genetic algorithm
        """
        try:
            logger.info("🧬 Starting genetic algorithm optimization")
            
            # Extract all activities from itinerary
            all_activities = []
            for day_num, day_data in itinerary_data.items():
                if isinstance(day_data, dict) and 'activities' in day_data:
                    activities = day_data['activities']
                    # Enhance activities with metadata
                    for activity in activities:
                        enhanced_activity = self._prepare_activity_for_ga(activity)
                        all_activities.append(enhanced_activity)
            
            logger.info(f"📊 Total activities for GA optimization: {len(all_activities)}")
            
            # Run genetic algorithm
            optimized_result = self.genetic_optimizer.optimize(
                activities=all_activities,
                trip_params=trip_params
            )
            
            logger.info(f"✅ GA optimization complete. Score: {optimized_result.get('optimization_score', 0):.2f}")
            
            # Convert GA result to our standard format
            optimized_itinerary = self._convert_ga_result_to_standard_format(
                optimized_result,
                trip_params
            )
            
            return {
                'optimized_itinerary': optimized_itinerary,
                'optimization_summary': {
                    'total_days_optimized': len(optimized_result.get('itinerary_data', [])),
                    'total_travel_time': 0,  # Calculate if needed
                    'average_efficiency_score': int(optimized_result.get('optimization_score', 0)),
                    'total_cost': optimized_result.get('total_cost', 0),
                    'total_activities': optimized_result.get('total_activities', 0),
                    'recommendations': [
                        {
                            'type': 'genetic_optimization',
                            'message': f'Itinerary optimized using genetic algorithm. Optimization score: {optimized_result.get("optimization_score", 0):.2f}/100',
                            'priority': 'high'
                        }
                    ],
                    'optimization_applied': True,
                    'optimization_method': 'genetic_algorithm'
                },
                'route_efficiency_score': int(optimized_result.get('optimization_score', 0)),
                'total_travel_time_minutes': 0,
                'recommendations': []
            }
            
        except Exception as e:
            logger.error(f"❌ Genetic algorithm optimization failed: {str(e)}")
            logger.info("🔄 Falling back to traditional optimization")
            
            # Fallback to traditional method
            return await self._execute_logic_traditional(itinerary_data, trip_params)
    
    def _prepare_activity_for_ga(self, activity: Dict) -> Dict:
        """Prepare activity data for genetic algorithm"""
        
        # Enhance with metadata
        activity_type = self._detect_activity_type(activity)
        coords = self._extract_coordinates(activity)
        duration = self._estimate_activity_duration(activity, activity_type)
        
        return {
            **activity,
            'activity_type': activity_type,
            'coordinates': coords,
            'estimated_duration': duration,
            'time': activity.get('time', '9:00 AM')
        }
    
    def _convert_ga_result_to_standard_format(
        self,
        ga_result: Dict[str, Any],
        trip_params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Convert GA result to standard itinerary format"""
        
        itinerary_data = ga_result.get('itinerary_data', [])
        
        optimized_itinerary = {}
        
        for day_entry in itinerary_data:
            day_num = day_entry.get('day', 1)
            
            optimized_itinerary[f"day_{day_num}"] = {
                'day': f"Day {day_num}",
                'theme': day_entry.get('theme', f"Day {day_num}"),
                'activities': [],
                'planText': day_entry.get('planText', ''),
                'route_segments': [],
                'total_travel_time': 0,
                'optimization_score': 100,
                'optimization_method': 'genetic_algorithm'
            }
        
        return optimized_itinerary
    
    async def _execute_logic_traditional(
        self,
        itinerary_data: Dict[str, Any],
        trip_params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Traditional optimization method (fallback)"""
        
        optimized_days = []
        
        for day_num, day_data in itinerary_data.items():
            if isinstance(day_data, dict) and 'activities' in day_data:
                optimized_day = await self._optimize_daily_route(
                    day_num, 
                    day_data['activities'],
                    trip_params
                )
                optimized_days.append(optimized_day)
        
        summary = self._generate_optimization_summary(optimized_days)
        
        return {
            'optimized_itinerary': {day['day']: day for day in optimized_days},
            'optimization_summary': summary,
            'route_efficiency_score': summary['average_efficiency_score'],
            'total_travel_time_minutes': summary['total_travel_time'],
            'recommendations': summary['recommendations']
        }
    
    async def _optimize_daily_route(self, day_num: str, activities: List[Dict], trip_params: Dict) -> Dict[str, Any]:
        """Optimize route for a single day's activities"""
        
        try:
            logger.info(f"🗓️ Optimizing route for {day_num} with {len(activities)} activities")
            
            if not activities or len(activities) <= 1:
                return {
                    'day': day_num,
                    'activities': activities,
                    'route_segments': [],
                    'total_travel_time': 0,
                    'optimization_score': 100 if len(activities) <= 1 else 0
                }
            
            # Step 1: Enhance activities with routing metadata
            enhanced_activities = self._enhance_activities_with_metadata(activities)
            
            # Step 2: Apply time-slot optimization
            time_optimized = self._optimize_by_time_slots(enhanced_activities)
            
            # Step 3: Apply geographic clustering and routing
            route_optimized = await self._optimize_geographic_route(time_optimized)
            
            # Step 4: Calculate route segments and travel times
            route_segments = self._calculate_route_segments(route_optimized)
            
            # Step 5: Generate time schedule
            scheduled_activities = self._generate_time_schedule(route_optimized, route_segments)
            
            return {
                'day': day_num,
                'activities': scheduled_activities,
                'route_segments': route_segments,
                'total_travel_time': sum(seg['duration_minutes'] for seg in route_segments),
                'optimization_score': self._calculate_day_efficiency_score(route_segments, scheduled_activities),
                'optimization_method': 'time_slot_geographic_hybrid'
            }
            
        except Exception as e:
            logger.error(f"❌ Daily route optimization failed for {day_num}: {str(e)}")
            return {
                'day': day_num,
                'activities': activities,
                'route_segments': [],
                'total_travel_time': 0,
                'optimization_score': 0,
                'error': str(e)
            }
    
    def _enhance_activities_with_metadata(self, activities: List[Dict]) -> List[Dict]:
        """Enhance activities with routing and timing metadata"""
        
        enhanced = []
        
        for i, activity in enumerate(activities):
            # Detect activity type
            activity_type = self._detect_activity_type(activity)
            
            # Extract coordinates
            coords = self._extract_coordinates(activity)
            
            # Estimate duration
            duration = self._estimate_activity_duration(activity, activity_type)
            
            enhanced_activity = {
                **activity,
                'routing_metadata': {
                    'original_index': i,
                    'activity_type': activity_type,
                    'coordinates': coords,
                    'estimated_duration_minutes': duration,
                    'preferred_time_slots': self.activity_types.get(activity_type, {}).get('time_slots', ['AFTERNOON']),
                    'priority': self.activity_types.get(activity_type, {}).get('priority', 3)
                }
            }
            
            enhanced.append(enhanced_activity)
        
        return enhanced
    
    def _detect_activity_type(self, activity: Dict) -> str:
        """Detect activity type from activity data"""
        
        # Check various fields that might contain activity type information
        text_fields = [
            activity.get('placeName', ''),
            activity.get('placeDetails', ''),
            activity.get('category', ''),
            activity.get('type', ''),
            activity.get('name', '')
        ]
        
        combined_text = ' '.join(text_fields).lower()
        
        # Activity type detection logic
        if any(word in combined_text for word in ['restaurant', 'food', 'dining', 'cafe', 'eat']):
            return 'RESTAURANT'
        elif any(word in combined_text for word in ['museum', 'gallery', 'exhibit', 'art']):
            return 'MUSEUM'
        elif any(word in combined_text for word in ['park', 'garden', 'nature', 'outdoor']):
            return 'PARK'
        elif any(word in combined_text for word in ['shop', 'market', 'mall', 'store']):
            return 'SHOPPING'
        elif any(word in combined_text for word in ['hotel', 'accommodation', 'resort', 'stay']):
            return 'HOTEL'
        elif any(word in combined_text for word in ['cinema', 'theater', 'entertainment', 'show']):
            return 'ENTERTAINMENT'
        else:
            return 'ATTRACTION'
    
    def _extract_coordinates(self, activity: Dict) -> Dict[str, float]:
        """Extract coordinates from activity data with Google Places enhancement"""
        
        # Try different coordinate field patterns
        coords = {'lat': 0.0, 'lng': 0.0}
        
        # Check geoCoordinates
        if 'geoCoordinates' in activity:
            geo = activity['geoCoordinates']
            coords['lat'] = float(geo.get('latitude', 0))
            coords['lng'] = float(geo.get('longitude', 0))
        
        # Check direct lat/lng fields
        elif 'latitude' in activity and 'longitude' in activity:
            coords['lat'] = float(activity.get('latitude', 0))
            coords['lng'] = float(activity.get('longitude', 0))
        
        # Check location field
        elif 'location' in activity and isinstance(activity['location'], dict):
            loc = activity['location']
            coords['lat'] = float(loc.get('lat', loc.get('latitude', 0)))
            coords['lng'] = float(loc.get('lng', loc.get('longitude', 0)))
        
        # If coordinates are still default/zero, try to get real coordinates
        if coords['lat'] == 0.0 and coords['lng'] == 0.0:
            place_name = activity.get('placeName') or activity.get('name', '')
            if place_name:
                real_coords = self._get_real_coordinates(place_name)
                if real_coords:
                    coords = real_coords
        
        return coords
    
    def _get_real_coordinates(self, place_name: str) -> Dict[str, float]:
        """Get real coordinates using Google Geocoding API"""
        try:
            import requests
            from django.conf import settings
            
            api_key = getattr(settings, 'GOOGLE_PLACES_API_KEY', None)
            if not api_key:
                return None
            
            url = f"https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                'address': place_name,
                'key': api_key
            }
            
            response = requests.get(url, params=params, timeout=5)
            data = response.json()
            
            if data.get('results'):
                location = data['results'][0]['geometry']['location']
                logger.info(f"📍 Real coordinates for {place_name}: {location}")
                return {
                    'lat': location['lat'],
                    'lng': location['lng']
                }
            
            return None
            
        except Exception as e:
            logger.warning(f"Failed to get real coordinates for {place_name}: {e}")
            return None
    
    def _estimate_activity_duration(self, activity: Dict, activity_type: str) -> int:
        """Estimate activity duration in minutes"""
        
        # Check if duration is already specified
        if 'estimatedDuration' in activity:
            try:
                return int(activity['estimatedDuration'])
            except:
                pass
        
        # Use type-based estimation
        base_duration = self.activity_types.get(activity_type, {}).get('base_time', 120)
        
        # Adjust based on activity details
        details = activity.get('placeDetails', '').lower()
        
        if 'large' in details or 'major' in details:
            return int(base_duration * 1.3)
        elif 'small' in details or 'quick' in details:
            return int(base_duration * 0.7)
        elif 'famous' in details or 'popular' in details:
            return int(base_duration * 1.2)
        
        return base_duration
    
    def _optimize_by_time_slots(self, activities: List[Dict]) -> List[Dict]:
        """Optimize activity order by preferred time slots"""
        
        # Group activities by preferred time slots
        time_groups = {
            'MORNING': [],
            'LUNCH': [],
            'AFTERNOON': [],
            'DINNER': [],
            'EVENING': []
        }
        
        for activity in activities:
            metadata = activity.get('routing_metadata', {})
            preferred_slots = metadata.get('preferred_time_slots', ['AFTERNOON'])
            
            # Assign to the first preferred slot
            primary_slot = preferred_slots[0]
            time_groups[primary_slot].append(activity)
        
        # Sort within each group by priority
        for slot in time_groups:
            time_groups[slot].sort(
                key=lambda a: a.get('routing_metadata', {}).get('priority', 3),
                reverse=True
            )
        
        # Combine in logical time order
        ordered_activities = []
        for slot in ['MORNING', 'LUNCH', 'AFTERNOON', 'DINNER', 'EVENING']:
            ordered_activities.extend(time_groups[slot])
        
        return ordered_activities
    
    async def _optimize_geographic_route(self, activities: List[Dict]) -> List[Dict]:
        """Optimize route geographically using nearest neighbor with clustering"""
        
        if len(activities) <= 2:
            return activities
        
        # Apply geographic clustering within time slots
        optimized = []
        current_time_slot = None
        current_group = []
        
        for activity in activities:
            metadata = activity.get('routing_metadata', {})
            preferred_slots = metadata.get('preferred_time_slots', ['AFTERNOON'])
            activity_time_slot = preferred_slots[0]
            
            # If we're still in the same time slot, add to current group
            if current_time_slot == activity_time_slot:
                current_group.append(activity)
            else:
                # Process the previous group geographically
                if current_group:
                    optimized.extend(self._apply_nearest_neighbor_clustering(current_group))
                
                # Start new group
                current_time_slot = activity_time_slot
                current_group = [activity]
        
        # Process the last group
        if current_group:
            optimized.extend(self._apply_nearest_neighbor_clustering(current_group))
        
        return optimized
    
    def _apply_nearest_neighbor_clustering(self, activities: List[Dict]) -> List[Dict]:
        """Apply nearest neighbor algorithm to a group of activities"""
        
        if len(activities) <= 1:
            return activities
        
        # Use nearest neighbor algorithm
        unvisited = activities[:]
        route = []
        
        # Start with the first activity
        current = unvisited.pop(0)
        route.append(current)
        
        while unvisited:
            # Find nearest unvisited activity
            current_coords = current.get('routing_metadata', {}).get('coordinates', {'lat': 0, 'lng': 0})
            
            nearest = min(unvisited, key=lambda a: self._calculate_distance(
                current_coords,
                a.get('routing_metadata', {}).get('coordinates', {'lat': 0, 'lng': 0})
            ))
            
            route.append(nearest)
            unvisited.remove(nearest)
            current = nearest
        
        return route
    
    def _calculate_distance(self, coord1: Dict, coord2: Dict) -> float:
        """Calculate haversine distance between two coordinates"""
        
        lat1, lng1 = coord1.get('lat', 0), coord1.get('lng', 0)
        lat2, lng2 = coord2.get('lat', 0), coord2.get('lng', 0)
        
        # Haversine formula
        R = 6371  # Earth's radius in km
        
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        
        a = (math.sin(dlat/2) * math.sin(dlat/2) + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlng/2) * math.sin(dlng/2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    def _calculate_route_segments(self, activities: List[Dict]) -> List[Dict]:
        """Calculate route segments between consecutive activities"""
        
        segments = []
        
        for i in range(len(activities) - 1):
            current = activities[i]
            next_activity = activities[i + 1]
            
            current_coords = current.get('routing_metadata', {}).get('coordinates', {'lat': 0, 'lng': 0})
            next_coords = next_activity.get('routing_metadata', {}).get('coordinates', {'lat': 0, 'lng': 0})
            
            # Calculate distance and estimated travel time
            distance_km = self._calculate_distance(current_coords, next_coords)
            travel_time_minutes = self._estimate_travel_time(distance_km)
            
            segment = {
                'from': {
                    'name': current.get('placeName', 'Unknown'),
                    'coordinates': current_coords
                },
                'to': {
                    'name': next_activity.get('placeName', 'Unknown'),
                    'coordinates': next_coords
                },
                'distance_km': round(distance_km, 2),
                'duration_minutes': travel_time_minutes,
                'travel_mode': 'driving',
                'google_maps_url': self._generate_maps_url(current_coords, next_coords)
            }
            
            segments.append(segment)
        
        return segments
    
    def _estimate_travel_time(self, distance_km: float) -> int:
        """Estimate travel time based on distance"""
        
        # Base speed assumptions (km/h)
        if distance_km <= 2:
            speed = 20  # City traffic
        elif distance_km <= 10:
            speed = 30  # Urban areas
        else:
            speed = 50  # Highway/longer distances
        
        time_hours = distance_km / speed
        time_minutes = time_hours * 60
        
        # Add buffer time for stops, traffic, etc.
        buffer_minutes = min(15, distance_km * 2)
        
        return int(time_minutes + buffer_minutes)
    
    def _generate_maps_url(self, from_coords: Dict, to_coords: Dict) -> str:
        """Generate Google Maps URL for navigation"""
        
        from_str = f"{from_coords['lat']},{from_coords['lng']}"
        to_str = f"{to_coords['lat']},{to_coords['lng']}"
        
        return f"https://www.google.com/maps/dir/{from_str}/{to_str}"
    
    def _generate_time_schedule(self, activities: List[Dict], route_segments: List[Dict]) -> List[Dict]:
        """Generate time schedule for activities"""
        
        scheduled = []
        current_time = 9 * 60  # Start at 9 AM (in minutes from midnight)
        
        for i, activity in enumerate(activities):
            # Calculate start time
            start_time = current_time
            
            # Get activity duration
            metadata = activity.get('routing_metadata', {})
            duration = metadata.get('estimated_duration_minutes', 120)
            
            # Calculate end time
            end_time = start_time + duration
            
            # Add schedule info to activity
            scheduled_activity = {
                **activity,
                'schedule': {
                    'start_time': self._minutes_to_time_string(start_time),
                    'end_time': self._minutes_to_time_string(end_time),
                    'duration_minutes': duration
                }
            }
            
            scheduled.append(scheduled_activity)
            
            # Update current time for next activity (including travel time)
            current_time = end_time
            if i < len(route_segments):
                travel_time = route_segments[i]['duration_minutes']
                current_time += travel_time
        
        return scheduled
    
    def _minutes_to_time_string(self, minutes: int) -> str:
        """Convert minutes from midnight to time string"""
        hours = minutes // 60
        mins = minutes % 60
        
        # Handle day overflow
        if hours >= 24:
            hours = hours % 24
        
        return f"{hours:02d}:{mins:02d}"
    
    def _calculate_day_efficiency_score(self, route_segments: List[Dict], activities: List[Dict]) -> int:
        """Calculate efficiency score for a day's route (0-100)"""
        
        if not route_segments:
            return 100
        
        # Calculate metrics
        total_distance = sum(seg['distance_km'] for seg in route_segments)
        total_travel_time = sum(seg['duration_minutes'] for seg in route_segments)
        total_activity_time = sum(
            act.get('routing_metadata', {}).get('estimated_duration_minutes', 120) 
            for act in activities
        )
        
        # Efficiency factors
        distance_score = max(0, 100 - (total_distance * 2))  # Penalty for long distances
        time_ratio_score = min(100, (total_activity_time / max(1, total_travel_time)) * 20)  # Favor more activity time vs travel
        
        # Combine scores
        efficiency_score = int((distance_score + time_ratio_score) / 2)
        
        return max(0, min(100, efficiency_score))
    
    def _generate_optimization_summary(self, optimized_days: List[Dict]) -> Dict[str, Any]:
        """Generate optimization summary for the entire itinerary"""
        
        total_travel_time = sum(day.get('total_travel_time', 0) for day in optimized_days)
        average_score = sum(day.get('optimization_score', 0) for day in optimized_days) / max(1, len(optimized_days))
        
        # Generate recommendations
        recommendations = []
        
        # High travel time warning
        if total_travel_time > 240:  # > 4 hours total
            recommendations.append({
                'type': 'travel_time',
                'message': f'High total travel time ({total_travel_time // 60}h {total_travel_time % 60}m). Consider grouping activities by location.',
                'priority': 'high'
            })
        
        # Efficiency recommendations
        if average_score >= 80:
            recommendations.append({
                'type': 'efficiency',
                'message': 'Excellent route optimization achieved! Your itinerary is well-organized.',
                'priority': 'low'
            })
        elif average_score >= 60:
            recommendations.append({
                'type': 'efficiency',
                'message': 'Good route optimization. Some minor improvements possible.',
                'priority': 'medium'
            })
        else:
            recommendations.append({
                'type': 'efficiency',
                'message': 'Route could be optimized further. Consider regrouping activities.',
                'priority': 'high'
            })
        
        return {
            'total_days_optimized': len(optimized_days),
            'total_travel_time': total_travel_time,
            'average_efficiency_score': int(average_score),
            'recommendations': recommendations,
            'optimization_applied': True
        }