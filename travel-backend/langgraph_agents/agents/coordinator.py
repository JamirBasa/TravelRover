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
            # If we're already in an async context, run in thread pool
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(self._run_in_new_loop, input_data)
                return future.result()
    
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
        
        return {
            'destination': input_data.get('destination'),
            'start_date': input_data.get('startDate'),
            'end_date': input_data.get('endDate'),
            'duration': input_data.get('duration', 3),
            'travelers': input_data.get('travelers'),
            'budget': input_data.get('budget'),
            'user_email': input_data.get('user_email'),
            'flight_data': input_data.get('flightData', {}),
            'hotel_data': input_data.get('hotelData', {}),
            'user_profile': input_data.get('userProfile', {})
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
    
    async def _create_execution_plan(self, trip_params: Dict[str, Any]) -> Dict[str, Any]:
        """Create execution plan for agents"""
        
        plan = {
            'coordinator': trip_params,
            'parallel_tasks': []
        }
        
        # Add flight task (default to True unless explicitly disabled)
        include_flights = trip_params.get('flight_data', {}).get('includeFlights', True)
        if include_flights:
            flight_params = self._build_flight_params(trip_params)
            plan['parallel_tasks'].append({
                'agent_type': 'flight',
                'params': {'flight_params': flight_params}
            })
            logger.info(f"🛫 Flight search enabled with params: {flight_params}")
        
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
        
        # Parse number of adults
        travelers = trip_params.get('travelers', 'Just Me')
        adults = self._parse_adults(travelers)
        
        logger.info(f"Flight params: {departure_city} ({from_airport}) → {destination} ({to_airport})")
        
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
        
        # Guest mapping
        guest_mapping = {
            'Just Me': 1,
            'A Couple': 2,
            'Family': 4,
            'Friends': 3
        }
        guests = guest_mapping.get(trip_params.get('travelers', 'Just Me'), 1)
        
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
        """Extract airport code from location (simplified)"""
        # This is a simplified version - you might want to use a proper airport database
        airport_mapping = {
            'Manila': 'MNL',
            'Intramuros': 'MNL',  # Intramuros is in Manila
            'Metro Manila': 'MNL',
            'Zamboanga': 'ZAM',
            'Cebu': 'CEB',
            'Davao': 'DVO',
            'Puerto Princesa': 'PPS',
            'Kalibo': 'KLO',
            'Boracay': 'KLO',
            'Tagbilaran': 'TAG',
            'Bohol': 'TAG',
            'Siargao': 'IAO',
            'Clark': 'CRK',
            'Iloilo': 'ILO',
            'Bacolod': 'BCD'
        }
        
        # Check for exact matches first
        for city, code in airport_mapping.items():
            if city.lower() in location.lower():
                return code
        
        return 'MNL'  # Default to Manila
    
    def _parse_adults(self, travelers: str) -> int:
        """Parse number of adults from travelers string"""
        mapping = {
            'Just Me': 1,
            'A Couple': 2,
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
        
        merged = {
            'session_id': self.session_id,
            'trip_params': trip_params,
            'agent_results': agent_results,
            'flights': agent_results.get('flight'),
            'hotels': agent_results.get('hotel'),
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
        if merged['hotels'] and merged['hotels'].get('success'):
            hotels = merged['hotels'].get('hotels', [])
            if hotels:
                # Use best scored hotel for cost estimation
                best_hotel = max(hotels, key=lambda h: h.get('langgraph_score', 0))
                hotel_cost = self._estimate_hotel_cost(best_hotel.get('price_range', ''))
                merged['recommended_hotel'] = best_hotel
        
        merged['total_estimated_cost'] = flight_cost + hotel_cost
        merged['cost_breakdown'] = {
            'flights': flight_cost,
            'hotels': hotel_cost
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
                
                # Trip parameters
                'trip_params': trip_params,
                
                # Metadata
                'workflow_type': 'ga_first',
                'genetic_algorithm_used': True,
                'optimization_method': 'genetic_algorithm',
                'flights_requested': include_flights,
                'hotels_requested': include_hotels
            }
            
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