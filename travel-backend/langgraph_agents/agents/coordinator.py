# langgraph_agents/agents/coordinator.py
from typing import Dict, Any
import asyncio
import uuid
from datetime import datetime
from django.utils import timezone
from .base_agent import BaseAgent
from .flight_agent import FlightAgent
from .hotel_agent import HotelAgent
from .route_optimizer_agent import RouteOptimizerAgent
from .transport_mode_agent import TransportModeAgent
from ..models import TravelPlanningSession
import logging
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)

class CoordinatorAgent(BaseAgent):
    """LangGraph Coordinator Agent - Orchestrates all other agents"""
    
    def __init__(self, session_id: str, use_genetic_algorithm: bool = True, use_ga_first: bool = True):
        super().__init__(session_id, 'coordinator')
        self.flight_agent = FlightAgent(session_id)
        self.hotel_agent = HotelAgent(session_id)
        # Initialize route optimizer with genetic algorithm enabled by default
        self.route_optimizer = RouteOptimizerAgent(session_id, use_genetic_algorithm=use_genetic_algorithm)
        # ✅ NEW: Initialize transport mode agent
        self.transport_mode_agent = TransportModeAgent(session_id)
        self.use_ga_first = use_ga_first  # NEW: Enable GA-first itinerary generation
    
    def execute_sync(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Synchronous wrapper for the async execute method"""
        import asyncio
        try:
            # Create new event loop for this execution
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                return loop.run_until_complete(self._execute_logic(input_data))
            finally:
                loop.close()
        except RuntimeError:
            # If we're already in an async context, run in new loop
            return self._run_in_new_loop(input_data)
    
    def _run_in_new_loop(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run async logic in a new event loop"""
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self._execute_logic(input_data))
        finally:
            loop.close()
    
    async def _execute_logic(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Coordinate the entire travel planning workflow"""
        
        try:
            # Parse trip parameters
            trip_params = self._parse_trip_parameters(input_data)
            
            # Create/update session
            await self._update_session(trip_params)
            
            # ✅ NEW: Analyze transport mode FIRST (before GA or traditional workflow)
            transport_mode_result = await self._analyze_transport_mode(trip_params)
            trip_params['transport_mode_analysis'] = transport_mode_result
            logger.info(f"🚌 Transport mode analysis: {transport_mode_result.get('mode')} - {transport_mode_result.get('recommendation')}")
            
            # NEW: Check if we should use GA-first approach
            if self.use_ga_first:
                logger.info("🧬 Using GA-First approach for itinerary generation")
                return await self._execute_ga_first_workflow(trip_params)
            
            # ORIGINAL: Traditional workflow (flights/hotels → AI → optimize)
            logger.info("🔄 Using traditional workflow")
            
            # Create execution plan
            execution_plan = await self._create_execution_plan(trip_params)
            
            # Execute agents in parallel
            agent_results = await self._execute_agents_parallel(execution_plan)
            
            # Merge and optimize results
            merged_results = await self._merge_agent_results(agent_results, trip_params)
            optimized_results = await self._optimize_results(merged_results, trip_params)
            
            # Apply route optimization to itinerary if present
            if 'itinerary_data' in optimized_results:
                route_optimization_result = await self._apply_route_optimization(optimized_results, trip_params)
                optimized_results.update(route_optimization_result)
            
            # Update session with final results
            await self._finalize_session(optimized_results)
            
            return optimized_results
            
        except Exception as e:
            logger.error(f"Coordinator execution failed: {e}")
            await self._handle_failure(str(e))
            raise e
    
    def _parse_trip_parameters(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse and validate trip parameters"""
        
        # ✅ Support both camelCase and snake_case for compatibility
        return {
            'destination': input_data.get('destination'),
            'start_date': input_data.get('startDate') or input_data.get('start_date'),
            'end_date': input_data.get('endDate') or input_data.get('end_date'),
            'duration': input_data.get('duration', 3),
            'travelers': input_data.get('travelers'),
            'budget': input_data.get('budget'),
            'user_email': input_data.get('user_email'),
            'flight_data': input_data.get('flightData') or input_data.get('flight_data', {}),
            'hotel_data': input_data.get('hotelData') or input_data.get('hotel_data', {}),
            'user_profile': input_data.get('userProfile') or input_data.get('user_profile', {})
        }
    
    async def _update_session(self, trip_params: Dict[str, Any]) -> None:
        """Update the travel planning session"""
        
        @sync_to_async
        def get_or_create_session():
            try:
                session = TravelPlanningSession.objects.get(session_id=self.session_id)
                # Update status
                session.status = 'running'
                session.save()
                return session
            except TravelPlanningSession.DoesNotExist:
                # Create new session
                return TravelPlanningSession.objects.create(
                    session_id=self.session_id,
                    user_email=trip_params.get('user_email', ''),
                    destination=trip_params.get('destination', ''),
                    start_date=trip_params.get('start_date'),
                    end_date=trip_params.get('end_date'),
                    travelers=trip_params.get('travelers', ''),
                    budget=trip_params.get('budget', ''),
                    flight_search_requested=trip_params.get('flight_data', {}).get('includeFlights', False),
                    hotel_search_requested=trip_params.get('hotel_data', {}).get('includeHotels', False),
                    status='running'
                )
        
        await get_or_create_session()
    
    async def _analyze_transport_mode(self, trip_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze optimal transport mode for the given route.
        
        Args:
            trip_params: Dictionary containing destination and departure city
            
        Returns:
            Dict with transport mode analysis including:
            - mode: Recommended transport mode
            - recommendation: Human-readable message
            - search_flights: Boolean indicating if flight search should be performed
            - ground_transport: Ground transport details if available
        """
        try:
            destination = trip_params.get('destination', '')
            departure_city = trip_params.get('flight_data', {}).get('departureCity', 'Manila')
            include_flights = trip_params.get('flight_data', {}).get('includeFlights', True)
            
            # Call TransportModeAgent for analysis (synchronous call)
            analysis = self.transport_mode_agent.analyze_transport_mode(
                destination=destination,
                departure_city=departure_city,
                include_flights=include_flights
            )
            
            logger.info(f"🚌 Transport mode analysis: {analysis['mode']} from {departure_city} to {destination}")
            
            return analysis
            
        except Exception as e:
            logger.error(f"Transport mode analysis failed: {e}")
            # Return default: allow flight search
            return {
                'mode': 'flight_recommended',
                'recommendation': 'Transport mode analysis unavailable, defaulting to flight search.',
                'search_flights': True,
                'ground_transport': None
            }
    
    async def _create_execution_plan(self, trip_params: Dict[str, Any]) -> Dict[str, Any]:
        """Create execution plan for agents"""
        
        plan = {
            'coordinator': trip_params,
            'parallel_tasks': []
        }
        
        # ✅ NEW: Check transport mode analysis results
        transport_mode_analysis = trip_params.get('transport_mode_analysis', {})
        should_search_flights = transport_mode_analysis.get('search_flights', True)
        
        # Add flight task (default to True unless explicitly disabled OR ground transport preferred)
        include_flights = trip_params.get('flight_data', {}).get('includeFlights', True)
        
        # ✅ OPTIMIZATION: Skip flight search if ground transport is preferred
        if include_flights and should_search_flights:
            flight_params = self._build_flight_params(trip_params)
            plan['parallel_tasks'].append({
                'agent_type': 'flight',
                'params': {'flight_params': flight_params}
            })
            logger.info(f"🛫 Flight search enabled with params: {flight_params}")
        elif include_flights and not should_search_flights:
            logger.info(f"✅ Flight search SKIPPED - ground transport preferred for this route")
        
        # Add hotel task (default to True unless explicitly disabled)
        include_hotels = trip_params.get('hotel_data', {}).get('includeHotels', True)
        if include_hotels:
            hotel_params = self._build_hotel_params(trip_params)
            plan['parallel_tasks'].append({
                'agent_type': 'hotel',
                'params': {'hotel_params': hotel_params}
            })
            logger.info(f"🏨 Hotel search enabled with params: {hotel_params}")
        
        logger.info(f"Created execution plan with {len(plan['parallel_tasks'])} parallel tasks")
        return plan
    
    def _build_flight_params(self, trip_params: Dict[str, Any]) -> Dict[str, Any]:
        """Build flight search parameters"""
        
        flight_data = trip_params.get('flight_data', {})
        user_profile = trip_params.get('user_profile', {})
        
        # Extract departure city from flight data or user profile
        departure_city = flight_data.get('departureCity', '')
        if not departure_city and user_profile:
            # Try to extract from user profile city
            profile_city = user_profile.get('city', '')
            if profile_city:
                departure_city = profile_city
        
        destination = trip_params.get('destination', '')
        
        # Extract airport codes
        from_airport = self._extract_airport_code(departure_city) if departure_city else 'ZAM'  # Default to Zamboanga
        to_airport = self._extract_airport_code(destination)
        
        # Parse number of adults - now expects integer from validators
        travelers = trip_params.get('travelers', 1)
        adults = travelers if isinstance(travelers, int) else self._parse_adults(travelers)
        
        logger.info(f"Flight params: {departure_city} ({from_airport}) → {destination} ({to_airport}), adults={adults}")
        
        return {
            'from_airport': from_airport,
            'to_airport': to_airport,
            'departure_date': trip_params.get('start_date'),
            'return_date': trip_params.get('end_date'),
            'adults': adults,
            'trip_type': 'round-trip'
        }
    
    def _build_hotel_params(self, trip_params: Dict[str, Any]) -> Dict[str, Any]:
        """Build hotel search parameters"""
        
        hotel_data = trip_params.get('hotel_data', {})
        
        # Use numeric travelers directly, fallback to legacy mapping for backward compatibility
        travelers = trip_params.get('travelers', 1)
        if isinstance(travelers, int):
            guests = travelers
        else:
            # Legacy string format mapping
            guest_mapping = {
                'Just Me': 1,
                'A Couple': 2,
                'Duo': 2,
                'Family': 4,
                'Friends': 3
            }
            guests = guest_mapping.get(travelers, 1)
        
        return {
            'destination': trip_params.get('destination'),
            'checkin_date': trip_params.get('start_date'),
            'checkout_date': trip_params.get('end_date'),
            'guests': guests,
            'duration': trip_params.get('duration', 3),
            'preferred_type': hotel_data.get('preferredType'),
            'budget_level': hotel_data.get('budgetLevel', 2)
        }
    
    def _extract_airport_code(self, location: str) -> str:
        """
        Extract airport code from location with comprehensive Philippine airport coverage
        Synced with frontend flightAgent.jsx mapping
        """
        airport_mapping = {
            # Metro Manila and nearby
            'Manila': 'MNL',
            'Metro Manila': 'MNL',
            'Manila City': 'MNL',
            'Quezon': 'MNL',
            'Quezon City': 'MNL',
            'Pasay': 'MNL',
            'Makati': 'MNL',
            'Taguig': 'MNL',
            'San Juan': 'MNL',
            'Las Piñas': 'MNL',
            'Caloocan': 'MNL',
            'Parañaque': 'MNL',
            'Intramuros': 'MNL',
            
            # Central Luzon
            'Pampanga': 'CRK',
            'Angeles': 'CRK',
            'Angeles City': 'CRK',
            'Clark': 'CRK',
            'Subic': 'SFS',
            'Bulacan': 'MNL',
            'Tarlac': 'CRK',
            'Nueva Ecija': 'CRK',
            'Cabanatuan': 'CRK',
            'San Fernando (La Union)': 'MNL',
            'La Union': 'MNL',
            'Elyu': 'MNL',
            'Alaminos': 'MNL',
            'Hundred Islands': 'MNL',
            'Pangasinan': 'MNL',
            
            # North Luzon (Cordillera + Ilocos)
            'Baguio': 'BAG',
            'Baguio City': 'BAG',
            'La Trinidad': 'BAG',
            'Benguet': 'BAG',
            
            # Mountain Province cities → Tuguegarao (no local commercial airports)
            'Sagada': 'TUG',
            'Banaue': 'TUG',
            'Bontoc': 'TUG',
            'Mountain Province': 'TUG',
            'Ifugao': 'TUG',
            'Batad': 'TUG',
            
            # Ilocos Region
            'Abra': 'LAO',
            'Ilocos Norte': 'LAO',
            'Laoag': 'LAO',
            'Ilocos Sur': 'LAO',
            'Vigan': 'LAO',
            'Pagudpud': 'LAO',
            'Pagudpod': 'LAO',
            'Paoay': 'LAO',
            'Dagupan': 'CRK',
            'San Fernando': 'CRK',
            
            # Southern Luzon
            'Laguna': 'MNL',
            'San Pablo': 'MNL',
            'Batangas': 'BSO',
            'Batangas City': 'BSO',
            'Anilao': 'MNL',
            'Mabini': 'MNL',
            'Nasugbu': 'MNL',
            'Puerto Galera': 'MNL',
            'Mindoro': 'MNL',
            'San Jose (Mindoro)': 'MNL',
            'Lucena': 'MNL',
            'Quezon Province': 'MNL',
            'Naga': 'WNP',
            'Naga City': 'WNP',
            'Camarines Norte': 'LGP',
            'Daet': 'LGP',
            'Calaguas': 'LGP',
            'Calaguas Island': 'LGP',
            'Legazpi': 'LGP',
            'Legazpi City': 'LGP',
            'Albay': 'LGP',
            'Mayon': 'LGP',
            'Donsol': 'LGP',
            'Sorsogon': 'DRP',
            'Masbate': 'MBT',
            'Masbate City': 'MBT',
            
            # Visayas
            'Cebu': 'CEB',
            'Cebu City': 'CEB',
            'Moalboal': 'CEB',
            'Oslob': 'CEB',
            'Malapascua': 'CEB',
            'Bantayan': 'CEB',
            'Bantayan Island': 'CEB',
            'Camotes': 'CEB',
            'Camotes Islands': 'CEB',
            'Dumaguete': 'DGT',
            'Dumaguete City': 'DGT',
            'Siquijor': 'DGT',
            'Apo Island': 'DGT',
            'Dauin': 'DGT',
            'Bais': 'DGT',
            'Iloilo': 'ILO',
            'Iloilo City': 'ILO',
            'Guimaras': 'ILO',
            'Antique': 'ILO',
            'San Jose de Buenavista': 'ILO',
            'Bacolod': 'BCD',
            'Bacolod City': 'BCD',
            'Silay': 'BCD',
            'Bohol': 'TAG',
            'Tagbilaran': 'TAG',
            'Tagbilaran City': 'TAG',
            'Panglao': 'TAG',
            'Anda': 'TAG',
            'Chocolate Hills': 'TAG',
            'Kalibo': 'KLO',
            'Boracay': 'MPH',
            'Caticlan': 'MPH',
            'Malay': 'MPH',
            'Roxas': 'RXS',
            'Roxas City': 'RXS',
            'Capiz': 'RXS',
            
            # Mindanao
            'Davao': 'DVO',
            'Davao City': 'DVO',
            'Samal': 'DVO',
            'Samal Island': 'DVO',
            'Mati': 'DVO',
            'City of Mati': 'DVO',
            'Cagayan': 'CGY',
            'Cagayan de Oro': 'CGY',
            'CDO': 'CGY',
            'Iligan': 'CGY',
            'Bukidnon': 'CGY',
            'Malaybalay': 'CGY',
            'Camiguin': 'CGY',
            'Butuan': 'BXU',
            'Surigao': 'SUG',
            'Siargao': 'IAO',
            'Siargao Island': 'IAO',
            'General Luna': 'IAO',
            'Cloud 9': 'IAO',
            'Dapa': 'IAO',
            'Zamboanga': 'ZAM',
            'Zamboanga City': 'ZAM',
            'Pagadian': 'PAG',
            'Pagadian City': 'PAG',
            'Zamboanga del Sur': 'ZAM',
            'Dipolog': 'DPL',
            'Dipolog City': 'DPL',
            'Cotabato': 'CBO',
            'GenSan': 'GES',
            'General Santos': 'GES',
            'South Cotabato': 'GES',
            'Lake Sebu': 'GES',
            'Tboli': 'GES',
            'Koronadal': 'GES',
            
            # Palawan & Tourist destinations
            'Siargao': 'IAO',
            'Puerto Princesa': 'PPS',
            'Palawan': 'PPS',
            'El Nido': 'PPS',
            'Coron': 'USU',
            'Busuanga': 'USU',
            'Sabang': 'PPS',
            'Underground River': 'PPS',
            'Port Barton': 'PPS',
            'San Vicente': 'PPS',
            'Balabac': 'PPS',
            'Cuyo': 'PPS',
        }
        
        # Normalize location for flexible matching
        location_lower = location.lower() if location else ''
        
        # Check for exact matches first (case-insensitive)
        for city, code in airport_mapping.items():
            if city.lower() == location_lower:
                logger.info(f"✈️ Exact airport match: {location} → {code}")
                return code
        
        # Check for partial matches (city name in location string)
        for city, code in airport_mapping.items():
            if city.lower() in location_lower or location_lower in city.lower():
                logger.info(f"✈️ Partial airport match: {location} → {code} (from {city})")
                return code
        
        # Default to Manila
        logger.warning(f"⚠️ No airport code found for '{location}', defaulting to MNL")
        return 'MNL'
    
    def _parse_adults(self, travelers) -> int:
        """
        Parse number of adults from travelers input (LEGACY - for backward compatibility)
        Note: New code should pass numeric values directly. This maintains compatibility with old data.
        """
        # If already numeric, return it
        if isinstance(travelers, int):
            return travelers
            
        # Try string-to-int conversion
        if isinstance(travelers, str):
            try:
                return int(travelers)
            except ValueError:
                pass
        
        # Legacy preset mapping
        mapping = {
            'Just Me': 1,
            'A Couple': 2,
            'Duo': 2,
            'Family': 3,
            'Friends': 4
        }
        return mapping.get(travelers, 1)
    
    async def _execute_agents_parallel(self, execution_plan: Dict[str, Any]) -> Dict[str, Any]:
        """Execute all agents in parallel"""
        
        results = {}
        
        if not execution_plan['parallel_tasks']:
            logger.info("No parallel tasks to execute")
            return results
        
        # Create tasks for parallel execution
        tasks = []
        task_names = []
        
        for task in execution_plan['parallel_tasks']:
            agent_type = task['agent_type']
            params = task['params']
            
            if agent_type == 'flight':
                task_coro = self.flight_agent.execute(params)
                tasks.append(task_coro)
                task_names.append('flight')
            elif agent_type == 'hotel':
                task_coro = self.hotel_agent.execute(params)
                tasks.append(task_coro)
                task_names.append('hotel')
        
        # Execute tasks in parallel
        if tasks:
            logger.info(f"Executing {len(tasks)} agents in parallel")
            task_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            for i, result in enumerate(task_results):
                task_name = task_names[i]
                
                if isinstance(result, Exception):
                    logger.error(f"Agent {task_name} failed: {result}")
                    results[task_name] = {
                        'success': False,
                        'error': str(result)
                    }
                else:
                    logger.info(f"Agent {task_name} completed successfully")
                    # Unwrap the data field from BaseAgent response
                    if result.get('success') and 'data' in result:
                        results[task_name] = result['data']
                    else:
                        results[task_name] = result
        
        return results
    
    async def _merge_agent_results(self, agent_results: Dict[str, Any], trip_params: Dict[str, Any]) -> Dict[str, Any]:
        """Merge results from all agents"""
        
        # ✅ NEW: Include transport mode analysis
        transport_mode_analysis = trip_params.get('transport_mode_analysis', {})
        
        merged = {
            'session_id': self.session_id,
            'trip_params': trip_params,
            'agent_results': agent_results,
            'flights': agent_results.get('flight'),
            'hotels': agent_results.get('hotel'),
            'transport_mode': transport_mode_analysis,  # ✅ Add transport analysis
            'total_estimated_cost': 0,
            'cost_breakdown': {},
            'agent_errors': []
        }
        
        # Calculate total estimated cost
        flight_cost = 0
        hotel_cost = 0
        
        # Extract flight cost
        if merged['flights'] and merged['flights'].get('success'):
            flights = merged['flights'].get('flights', [])
            if flights:
                # Use cheapest flight for cost estimation
                cheapest_flight = min(flights, key=lambda f: self._extract_price(f.get('price', '₱0')))
                flight_cost = self._extract_price(cheapest_flight.get('price', '₱0'))
                merged['recommended_flight'] = cheapest_flight
        
        # Extract hotel cost
        # 🔧 FIX: Ensure first hotel (index 0) is marked as primary check-in hotel
        if merged['hotels'] and merged['hotels'].get('success'):
            hotels = merged['hotels'].get('hotels', [])
            if hotels:
                # Use best scored hotel for cost estimation
                best_hotel = max(hotels, key=lambda h: h.get('langgraph_score', 0))
                hotel_cost = self._estimate_hotel_cost(best_hotel.get('price_range', ''))
                merged['recommended_hotel'] = best_hotel
                
                # 🆕 Mark first hotel as primary for Day 1 check-in
                if len(hotels) > 0:
                    hotels[0]['is_primary_checkin'] = True
                    hotels[0]['usage_note'] = 'Default hotel for Day 1 check-in in itinerary'
                    logger.info(f"✅ Marked {hotels[0].get('name', 'Unknown')} as primary check-in hotel")
        
        # ✅ NEW: Include ground transport cost if applicable
        ground_transport_cost = 0
        if transport_mode_analysis.get('mode') == 'ground_preferred':
            ground_transport = transport_mode_analysis.get('ground_transport', {})
            if ground_transport:
                cost_range = ground_transport.get('cost', 'Unknown')
                # Extract average cost from range (e.g., "₱200-350" -> 275)
                if '-' in cost_range:
                    parts = cost_range.replace('₱', '').split('-')
                    try:
                        min_cost = float(parts[0].strip())
                        max_cost = float(parts[1].strip())
                        ground_transport_cost = (min_cost + max_cost) / 2
                    except (ValueError, IndexError):
                        ground_transport_cost = 0
        
        merged['total_estimated_cost'] = flight_cost + hotel_cost + ground_transport_cost
        merged['cost_breakdown'] = {
            'flights': flight_cost,
            'hotels': hotel_cost,
            'ground_transport': ground_transport_cost  # ✅ Add ground transport to breakdown
        }
        
        # Collect errors
        for agent_name, result in agent_results.items():
            if not result.get('success'):
                merged['agent_errors'].append({
                    'agent': agent_name,
                    'error': result.get('error', 'Unknown error')
                })
        
        return merged
    
    async def _optimize_results(self, merged_results: Dict[str, Any], trip_params: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize and score the results"""
        
        optimization = {
            'optimization_score': 0,
            'cost_efficiency': 'unknown',
            'convenience_score': 0,
            'personalization_score': 0,
            'recommendations': []
        }
        
        # Cost efficiency analysis
        total_cost = merged_results.get('total_estimated_cost', 0)
        budget_str = trip_params.get('budget', 'Moderate')
        
        budget_limits = {
            'Budget': 8000,
            'Moderate': 20000,
            'Luxury': 50000
        }
        
        # Extract custom budget if present
        if 'Custom:' in budget_str:
            try:
                custom_amount = int(budget_str.split('₱')[1].replace(',', ''))
                budget_limit = custom_amount
            except:
                budget_limit = budget_limits.get(budget_str, 20000)
        else:
            budget_limit = budget_limits.get(budget_str, 20000)
        
        if total_cost > 0 and budget_limit > 0:
            cost_ratio = total_cost / budget_limit
            
            if cost_ratio <= 0.7:
                optimization['cost_efficiency'] = 'excellent'
                optimization['optimization_score'] += 30
            elif cost_ratio <= 1.0:
                optimization['cost_efficiency'] = 'good'
                optimization['optimization_score'] += 20
            elif cost_ratio <= 1.3:
                optimization['cost_efficiency'] = 'acceptable'
                optimization['optimization_score'] += 10
            else:
                optimization['cost_efficiency'] = 'over_budget'
                optimization['optimization_score'] -= 10
        
        # Convenience scoring - Safe handling for None values
        flights_data = merged_results.get('flights') or {}
        flights = flights_data.get('flights', []) if isinstance(flights_data, dict) else []
        if flights:
            direct_flights = [f for f in flights if f.get('stops', 0) == 0]
            if direct_flights:
                optimization['convenience_score'] += 25
                optimization['recommendations'].append({
                    'type': 'convenience',
                    'message': f'Found {len(direct_flights)} direct flight options',
                    'priority': 'high'
                })
            else:
                optimization['convenience_score'] += 10
                optimization['recommendations'].append({
                    'type': 'convenience',
                    'message': 'Only connecting flights available - consider flexible dates',
                    'priority': 'medium'
                })
        
        hotels_data = merged_results.get('hotels') or {}
        hotels = hotels_data.get('hotels', []) if isinstance(hotels_data, dict) else []
        if hotels:
            high_rated = [h for h in hotels if h.get('rating', 0) >= 4.0]
            if high_rated:
                optimization['convenience_score'] += 20
                optimization['recommendations'].append({
                    'type': 'accommodation',
                    'message': f'Found {len(high_rated)} highly-rated hotel options',
                    'priority': 'high'
                })
        
        # Personalization scoring
        user_profile = trip_params.get('user_profile', {})
        if user_profile:
            optimization['personalization_score'] += 15
            optimization['recommendations'].append({
                'type': 'personalization',
                'message': 'Recommendations customized based on your travel preferences',
                'priority': 'medium'
            })
        
        # Add cost recommendations
        if optimization['cost_efficiency'] == 'over_budget':
            optimization['recommendations'].append({
                'type': 'budget',
                'message': 'Consider flexible dates or alternative accommodations to reduce costs',
                'priority': 'high'
            })
        elif optimization['cost_efficiency'] == 'excellent':
            optimization['recommendations'].append({
                'type': 'budget',
                'message': 'Great value options found within your budget!',
                'priority': 'low'
            })
        
        # Calculate final score
        optimization['optimization_score'] += optimization['convenience_score'] + optimization['personalization_score']
        
        # Merge optimization into results
        merged_results.update(optimization)
        
        return merged_results
    
    def _extract_price(self, price_str: str) -> int:
        """Extract numeric price from price string"""
        try:
            return int(price_str.replace('₱', '').replace(',', ''))
        except:
            return 0
    
    def _estimate_hotel_cost(self, price_range: str) -> int:
        """Estimate hotel cost from price range"""
        estimates = {
            'Budget (₱1,000-2,500)': 1750,
            'Mid-range (₱2,500-5,000)': 3750,
            'Upscale (₱5,000-10,000)': 7500,
            'Luxury (₱10,000+)': 15000
        }
        return estimates.get(price_range, 3000)
    
    async def _finalize_session(self, results: Dict[str, Any]) -> None:
        """Finalize the travel planning session"""
        
        @sync_to_async
        def finalize_session_data():
            try:
                session = TravelPlanningSession.objects.get(session_id=self.session_id)
                
                # Update session with results
                session.status = 'completed'
                session.optimization_score = results.get('optimization_score', 0)
                session.total_estimated_cost = results.get('total_estimated_cost', 0)
                session.cost_efficiency = results.get('cost_efficiency', 'unknown')
                session.completed_at = timezone.now()
                
                # Update completion flags
                if results.get('flights', {}).get('success'):
                    session.flight_search_completed = True
                if results.get('hotels', {}).get('success'):
                    session.hotel_search_completed = True
                
                session.save()
                
            except Exception as e:
                logger.error(f"Failed to finalize session: {e}")
        
        await finalize_session_data()
    
    async def _apply_route_optimization(self, merged_results: Dict[str, Any], trip_params: Dict[str, Any]) -> Dict[str, Any]:
        """Apply route optimization to the generated itinerary"""
        
        try:
            logger.info("🚗 Applying route optimization to itinerary")
            
            # Check if itinerary data exists
            itinerary_data = merged_results.get('itinerary_data')
            if not itinerary_data:
                logger.warning("No itinerary data found for route optimization")
                return {'route_optimization_applied': False, 'route_optimization_error': 'No itinerary data'}
            
            # Prepare input for route optimizer
            optimizer_input = {
                'itinerary_data': itinerary_data,
                'trip_params': trip_params,
                'session_id': self.session_id
            }
            
            # Execute route optimization
            optimization_result = await self.route_optimizer.execute(optimizer_input)
            
            if optimization_result.get('success') and 'data' in optimization_result:
                route_data = optimization_result['data']
                
                logger.info(f"✅ Route optimization completed with efficiency score: {route_data.get('route_efficiency_score', 'N/A')}")
                
                return {
                    'optimized_itinerary': route_data.get('optimized_itinerary', itinerary_data),
                    'route_optimization': {
                        'applied': True,
                        'efficiency_score': route_data.get('route_efficiency_score', 0),
                        'total_travel_time_minutes': route_data.get('total_travel_time_minutes', 0),
                        'optimization_summary': route_data.get('optimization_summary', {}),
                        'recommendations': route_data.get('recommendations', [])
                    },
                    # Replace original itinerary with optimized version
                    'itinerary_data': route_data.get('optimized_itinerary', itinerary_data)
                }
            else:
                logger.warning(f"Route optimization failed: {optimization_result.get('error', 'Unknown error')}")
                return {
                    'route_optimization': {
                        'applied': False,
                        'error': optimization_result.get('error', 'Unknown error')
                    }
                }
                
        except Exception as e:
            logger.error(f"❌ Route optimization error: {str(e)}")
            return {
                'route_optimization': {
                    'applied': False,
                    'error': str(e)
                }
            }
    
    async def _execute_ga_first_workflow(self, trip_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        NEW: GA-First Workflow
        Step 1: Fetch activity pool
        Step 2: GA generates optimal itinerary
        Step 3: (Optional) Gemini enhances descriptions
        Step 4: Parallel flights & hotels search
        """
        
        logger.info("🧬 Starting GA-First Workflow")
        import time
        start_time = time.time()
        
        try:
            # Step 1: Fetch comprehensive activity pool
            step_start = time.time()
            logger.info("📍 Step 1: Fetching activity pool...")
            from ..services.activity_fetcher import ActivityPoolFetcher
            
            activity_fetcher = ActivityPoolFetcher()
            activities = await activity_fetcher.fetch_activity_pool(
                destination=trip_params['destination'],
                user_preferences=trip_params.get('user_profile', {}),
                radius=15000,  # 15km (reduced from 20km for faster search)
                max_activities=50  # Reduced from 100 (still provides good variety)
            )
            
            if not activities:
                logger.warning("⚠️  No activities fetched, falling back to traditional workflow")
                return await self._execute_traditional_workflow(trip_params)
            
            step_duration = time.time() - step_start
            logger.info(f"✅ Fetched {len(activities)} activities in {step_duration:.2f}s")
            
            # Step 2: Generate optimal itinerary using Genetic Algorithm
            step_start = time.time()
            logger.info("🧬 Step 2: GA optimization...")
            from ..agents.genetic_optimizer import GeneticItineraryOptimizer
            
            # Optimized parameters for faster execution while maintaining quality
            ga_optimizer = GeneticItineraryOptimizer(
                population_size=30,      # Reduced from 50 (still good diversity)
                generations=50,          # Reduced from 100 (usually converges earlier)
                mutation_rate=0.15,
                crossover_rate=0.7,
                elite_size=3             # Reduced from 5 (keeps best solutions)
            )
            
            ga_result = ga_optimizer.optimize(
                activities=activities,
                trip_params=trip_params
            )
            
            step_duration = time.time() - step_start
            logger.info(f"✅ GA optimization complete in {step_duration:.2f}s. Score: {ga_result.get('optimization_score', 0):.2f}")
            
            # Step 2.5: Analyze transport mode (NEW: Ground Transport Analysis)
            step_start = time.time()
            logger.info("🚗 Step 2.5: Analyzing transport mode...")
            transport_mode_result = await self._analyze_transport_mode(trip_params)
            trip_params['transport_mode_analysis'] = transport_mode_result
            
            # Update execution plan based on transport mode
            if not transport_mode_result.get('search_flights', True):
                logger.info("🚗 Ground transport preferred - skipping flight search")
                trip_params['flight_data']['includeFlights'] = False
            
            step_duration = time.time() - step_start
            logger.info(f"✅ Transport mode analysis complete in {step_duration:.2f}s")
            
            # Step 3: Parallel execution of flights & hotels
            step_start = time.time()
            logger.info("✈️ Step 3: Fetching flights & hotels in parallel...")
            execution_plan = await self._create_execution_plan(trip_params)
            agent_results = await self._execute_agents_parallel(execution_plan)
            
            step_duration = time.time() - step_start
            logger.info(f"✅ Flights & hotels fetched in {step_duration:.2f}s")
            
            # Step 4: Merge results
            logger.info("🔄 Step 4: Merging results...")
            
            # 🔧 FIX: Properly handle disabled flights/hotels
            include_flights = trip_params.get('flight_data', {}).get('includeFlights', False)
            include_hotels = trip_params.get('hotel_data', {}).get('includeHotels', False)
            
            # Build flight response
            if include_flights:
                flights_data = agent_results.get('flight', {})
                if isinstance(flights_data, dict) and 'data' in flights_data:
                    flight_response = flights_data.get('data', {})
                else:
                    flight_response = flights_data
                
                # 🔍 DEBUG: Log initial flight response structure
                logger.info(f"🔍 DEBUG Initial flight_response: success={flight_response.get('success')}, has_flights={('flights' in flight_response)}, flights_count={len(flight_response.get('flights', []))}")
                
                # ✅ FIX: Check if flight search failed OR returned empty results
                # Both cases should trigger auto-reroute if airport_status has alternatives
                has_flight_issue = (
                    not flight_response.get('success', True) or  # FlightAgent returned failure
                    len(flight_response.get('flights', [])) == 0  # Or empty flights array
                )
                
                if flight_response and has_flight_issue:
                    logger.warning(f"⚠️  Flight issue detected: success={flight_response.get('success')}, flights_count={len(flight_response.get('flights', []))}")
                    
                    # Check if auto-reroute is possible
                    airport_status = flight_response.get('airport_status', {})
                    if airport_status.get('airport_type') == 'destination' and airport_status.get('alternatives'):
                        logger.info(f"🔄 Attempting auto-reroute to alternative airports...")
                        
                        # Try first alternative (usually the closest/best option)
                        best_alternative = airport_status['alternatives'][0]
                        alt_code = best_alternative['code']
                        alt_name = best_alternative['name']
                        
                        logger.info(f"✈️  Auto-rerouting: {trip_params['destination']} → {alt_name} ({alt_code})")
                        
                        # Retry flight search with alternative airport
                        try:
                            from_airport = flight_response.get('search_params', {}).get('from', 'MNL')
                            alternative_flight_params = {
                                'flight_params': {
                                    'from_airport': from_airport,
                                    'to_airport': alt_code,
                                    'departure_date': trip_params.get('start_date'),
                                    'return_date': trip_params.get('end_date'),
                                    'adults': trip_params.get('travelers', 1) if isinstance(trip_params.get('travelers', 1), int) else 1,
                                    'trip_type': 'round-trip'
                                }
                            }
                            
                            alternative_result = await self.flight_agent.execute(alternative_flight_params)
                            
                            if alternative_result.get('success') and alternative_result.get('data', {}).get('flights'):
                                alt_flights = alternative_result['data']['flights']
                                logger.info(f"✅ Found {len(alt_flights)} flights to {alt_name}!")
                                
                                # ✅ CRITICAL: Update flight response with rerouted flights AND mark as successful
                                flight_response = alternative_result['data']
                                flight_response['success'] = True  # Mark as successful after reroute!
                                flight_response['rerouted'] = True
                                flight_response['reroute_info'] = {
                                    'original_destination': trip_params['destination'],
                                    'alternative_airport': alt_code,
                                    'alternative_name': alt_name,
                                    'ground_transport': {
                                        'mode': airport_status.get('transport', 'bus'),
                                        'travel_time': airport_status.get('travel_time', 'Unknown'),
                                        'recommendation': airport_status.get('recommendation', '')
                                    }
                                }
                                
                                # 🔍 DEBUG: Verify flights array exists in response
                                logger.info(f"🔍 DEBUG flight_response keys: {list(flight_response.keys())}")
                                logger.info(f"🔍 DEBUG flight_response['flights'] length: {len(flight_response.get('flights', []))}")
                                if flight_response.get('flights'):
                                    logger.info(f"🔍 DEBUG First flight sample: {flight_response['flights'][0] if flight_response['flights'] else 'EMPTY'}")
                                
                                logger.info(f"🚌 Ground transport from {alt_name}: {airport_status.get('transport', 'bus')} ({airport_status.get('travel_time', 'Unknown')})")
                            else:
                                logger.warning(f"⚠️  Auto-reroute to {alt_name} also returned no flights")
                                flight_response['flight_search_failed'] = True
                                
                        except Exception as reroute_error:
                            logger.error(f"❌ Auto-reroute failed: {reroute_error}")
                            flight_response['flight_search_failed'] = True
                    else:
                        # No alternatives available - mark as failed
                        logger.warning(f"⚠️  No alternative airports available for auto-reroute")
                        flight_response['flight_search_failed'] = True
                
                # 🆕 CRITICAL FIX: Add pricing metadata for frontend budget calculator
                if flight_response and 'flights' in flight_response and flight_response.get('success'):
                    flights_list = flight_response.get('flights', [])
                    
                    travelers = trip_params.get('travelers', 1)
                    travelers_num = travelers if isinstance(travelers, int) else 1
                    
                    logger.info(f"✅ Processing {len(flights_list)} flights for pricing metadata")
                    
                    for flight in flights_list:
                        if 'price' in flight:
                            # ✅ CRITICAL FIX: Round-trip prices already include both legs!
                            # SerpAPI returns complete journey price per person - don't multiply again
                            try:
                                # Prefer pre-parsed numeric price (from views.py), fallback to string parsing
                                if 'price_numeric' in flight and flight['price_numeric']:
                                    price_numeric = flight['price_numeric']
                                else:
                                    # Fallback: parse from formatted string (for backward compatibility)
                                    price_str = str(flight['price']).replace('₱', '').replace(',', '').strip()
                                    price_numeric = int(price_str) if price_str else 0
                                
                                # 🔍 CRITICAL FIX: Detect if SerpAPI returned group total instead of per-person
                                # For domestic Philippine flights, per-person round-trip should be ₱3k-20k
                                # If price > ₱25k, it's likely already a GROUP TOTAL (2+ passengers)
                                per_person_numeric = flight.get('price_per_person_numeric', price_numeric)
                                
                                # Heuristic detection for already-multiplied prices
                                # Domestic round-trip: ₱3k-20k per person is normal
                                # If price > ₱25k for 2+ travelers, likely already includes all passengers
                                is_likely_group_total = (price_numeric > 25000 and travelers_num > 1)
                                
                                if is_likely_group_total:
                                    # Price appears to be for entire group already - DON'T multiply again
                                    logger.warning(f"⚠️ {flight.get('name')}: Price ₱{price_numeric:,} appears to be group total (>₱25k for {travelers_num} travelers) - NOT multiplying")
                                    flight['total_for_group_numeric'] = price_numeric  # Use as-is
                                    flight['total_for_group'] = f"₱{price_numeric:,}"
                                    flight['price_per_person_numeric'] = price_numeric / travelers_num
                                    flight['price_per_person'] = f"₱{int(price_numeric / travelers_num):,}"
                                    flight['is_group_total'] = True
                                    flight['pricing_note'] = 'group total (auto-detected, not multiplied)'
                                    logger.info(f"✈️ {flight.get('name')}: Using ₱{price_numeric:,} as group total → ₱{int(price_numeric / travelers_num):,} per person")
                                else:
                                    # Normal per-person price - multiply by travelers
                                    flight['total_for_group_numeric'] = price_numeric * travelers_num
                                    flight['total_for_group'] = f"₱{price_numeric * travelers_num:,}"
                                    flight['price_per_person_numeric'] = price_numeric
                                    flight['price_per_person'] = flight['price']
                                    flight['is_group_total'] = True
                                    
                                    trip_type = flight.get('trip_type', 'round-trip')
                                    logger.debug(f"✈️ {flight.get('name')}: ₱{price_numeric:,} per person ({trip_type}) × {travelers_num} travelers = ₱{price_numeric * travelers_num:,}")
                                
                                flight['travelers'] = travelers_num
                                # Keep existing pricing_note from views.py (includes trip type)
                                if 'pricing_note' not in flight or not flight['pricing_note']:
                                    flight['pricing_note'] = f'per person ({trip_type})'
                                
                            except Exception as e:
                                logger.warning(f"⚠️ Price calculation failed for {flight.get('name')}: {e}")
                                # Graceful degradation - ensure total_for_group exists
                                flight['price_per_person'] = flight['price']
                                flight['total_for_group'] = flight['price']  # Fallback: assume already total
                                flight['is_group_total'] = False  # ⚠️ Flag as uncertain
                                flight['travelers'] = travelers_num
                                flight['pricing_note'] = 'per person (fallback - verify pricing)'
                                logger.warning(f"⚠️ Using fallback pricing for {flight.get('name')} - frontend should validate")
                    
                    # ✅ CRITICAL FIX: Ensure processed flights are saved back to response
                    flight_response['flights'] = flights_list
                    logger.info(f"✅ Enhanced {len(flights_list)} flights with pricing metadata for {travelers_num} travelers")
                    logger.info(f"🔍 Final flight_response['flights'] length after processing: {len(flight_response.get('flights', []))}")
            else:
                # When flights not requested, return null (not success: false)
                flight_response = None
                logger.info("✈️  Flights not requested - setting to null")
            
            # Build hotel response
            if include_hotels:
                hotels_data = agent_results.get('hotel', {})
                if isinstance(hotels_data, dict) and 'data' in hotels_data:
                    hotel_response = hotels_data.get('data', {})
                else:
                    hotel_response = hotels_data
            else:
                # When hotels not requested, return null (not success: false)
                hotel_response = None
                logger.info("🏨 Hotels not requested - setting to null")
            
            # ✅ NEW: Calculate cost breakdown including ground transport
            transport_mode_analysis = trip_params.get('transport_mode_analysis', {})
            ground_transport_cost = 0
            
            if transport_mode_analysis.get('mode') == 'ground_preferred':
                ground_transport = transport_mode_analysis.get('ground_transport', {})
                if ground_transport:
                    cost_data = ground_transport.get('cost', {})
                    if isinstance(cost_data, dict):
                        try:
                            min_cost = float(cost_data.get('min', 0))
                            max_cost = float(cost_data.get('max', 0))
                            ground_transport_cost = (min_cost + max_cost) / 2
                        except (ValueError, TypeError):
                            ground_transport_cost = 0
            
            cost_breakdown = {
                'flights': 0,  # Will be calculated from flight_response if available
                'hotels': 0,   # Will be calculated from hotel_response if available
                'ground_transport': round(ground_transport_cost) if ground_transport_cost > 0 else 0
            }
            
            final_results = {
                # GA-generated itinerary
                'itinerary_data': ga_result.get('itinerary_data', []),
                'optimization_score': ga_result.get('optimization_score', 0),
                'total_cost': ga_result.get('total_cost', 0),
                'total_activities': ga_result.get('total_activities', 0),
                
                # Flight results (null if not requested)
                'flights': flight_response,
                
                # Hotel results (null if not requested)
                'hotels': hotel_response,
                
                # ✅ NEW: Ground transport mode analysis
                'transport_mode': transport_mode_analysis,
                
                # ✅ NEW: Cost breakdown with ground transport
                'cost_breakdown': cost_breakdown,
                
                # Trip parameters
                'trip_params': trip_params,
                
                # Metadata
                'workflow_type': 'ga_first',
                'genetic_algorithm_used': True,
                'optimization_method': 'genetic_algorithm',
                'flights_requested': include_flights,
                'hotels_requested': include_hotels
            }
            
            # 🔍 DEBUG: Log final response structure before returning
            if flight_response:
                logger.info(f"🔍 DEBUG final_results['flights'] keys: {list(flight_response.keys())}")
                logger.info(f"🔍 DEBUG final_results['flights']['flights'] length: {len(flight_response.get('flights', []))}")
                logger.info(f"🔍 DEBUG final_results['flights']['rerouted']: {flight_response.get('rerouted', False)}")
            else:
                logger.info("🔍 DEBUG final_results['flights'] is None/null")
            
            # Step 5: (Optional) Enhance with Gemini descriptions
            # This could be added as a future enhancement
            if trip_params.get('enhance_with_gemini', False):
                logger.info("✨ Step 5: Enhancing with Gemini descriptions...")
                final_results = await self._enhance_with_gemini(final_results, trip_params)
            
            # Update session with final results
            await self._finalize_session(final_results)
            
            total_duration = time.time() - start_time
            logger.info(f"✅ GA-First workflow completed successfully in {total_duration:.2f}s")
            return final_results
            
        except Exception as e:
            logger.error(f"❌ GA-First workflow failed: {str(e)}")
            logger.info("🔄 Falling back to traditional workflow")
            return await self._execute_traditional_workflow(trip_params)
    
    async def _execute_traditional_workflow(self, trip_params: Dict[str, Any]) -> Dict[str, Any]:
        """Traditional workflow as fallback"""
        
        # Create execution plan
        execution_plan = await self._create_execution_plan(trip_params)
        
        # Execute agents in parallel
        agent_results = await self._execute_agents_parallel(execution_plan)
        
        # Merge and optimize results
        merged_results = await self._merge_agent_results(agent_results, trip_params)
        optimized_results = await self._optimize_results(merged_results, trip_params)
        
        # Apply route optimization to itinerary if present
        if 'itinerary_data' in optimized_results:
            route_optimization_result = await self._apply_route_optimization(optimized_results, trip_params)
            optimized_results.update(route_optimization_result)
        
        # Update session with final results
        await self._finalize_session(optimized_results)
        
        return optimized_results
    
    async def _enhance_with_gemini(self, ga_results: Dict[str, Any], trip_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhance GA-generated itinerary with Gemini descriptions
        (Future enhancement)
        """
        # TODO: Implement Gemini enhancement
        # - Take GA-optimized itinerary
        # - Ask Gemini to add descriptions, tips, and context
        # - Merge enhanced descriptions back into itinerary
        
        logger.info("ℹ️  Gemini enhancement not yet implemented")
        return ga_results
    
    async def _handle_failure(self, error_message: str) -> None:
        """Handle coordinator failure"""
        
        @sync_to_async
        def update_failure_status():
            try:
                session = TravelPlanningSession.objects.get(session_id=self.session_id)
                session.status = 'failed'
                session.save()
            except Exception as e:
                logger.error(f"Failed to update session failure: {e}")
        
        await update_failure_status()