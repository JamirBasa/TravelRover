# flights/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from serpapi import GoogleSearch
from django.conf import settings
import logging
import random

logger = logging.getLogger(__name__)

class FlightSearchView(APIView):
    def post(self, request):
        try:
            # Extract parameters
            from_airport = request.data.get('from_airport')
            to_airport = request.data.get('to_airport')
            departure_date = request.data.get('departure_date')
            return_date = request.data.get('return_date')
            adults = request.data.get('adults', 1)
            trip_type = request.data.get('trip_type', 'round-trip')

            # Validate required fields
            if not all([from_airport, to_airport, departure_date]):
                return Response({
                    'success': False,
                    'error': 'Missing required fields: from_airport, to_airport, departure_date'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if SerpAPI key is configured
            if not settings.SERPAPI_KEY:
                logger.warning("SerpAPI key not configured, using fallback data")
                return self.fallback_response(from_airport, to_airport, trip_type)

            try:
                # Search flights using SerpAPI
                flights_data = self.search_flights_serpapi(
                    from_airport, to_airport, departure_date, return_date, adults, trip_type
                )
                
                # ✅ NEW: Log raw SERP API response for monitoring
                logger.info(f"📊 SERP API returned {len(flights_data.get('flights', []))} flights")
                
                # ✅ NEW: Validate pricing data
                if flights_data.get('flights'):
                    self._log_price_validation(flights_data['flights'], from_airport, to_airport)
                
                # If no flights found, use fallback
                if not flights_data.get('flights'):
                    logger.info("No flights found in SerpAPI, using fallback")
                    fallback_data = self.fallback_response(from_airport, to_airport, trip_type)
                    fallback_data['note'] = 'No flights found for this route/date, showing sample data'
                    fallback_data['source'] = 'fallback_after_serpapi'
                    return Response(fallback_data)
                
                return Response(flights_data)
                
            except Exception as e:
                logger.error(f"SerpAPI error: {e}")
                fallback_data = self.fallback_response(from_airport, to_airport, trip_type)
                fallback_data['note'] = f'SerpAPI error: {str(e)}'
                fallback_data['source'] = 'fallback_error'
                return Response(fallback_data)

        except Exception as e:
            logger.error(f"General error: {e}")
            return Response({
                'success': False,
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def search_flights_serpapi(self, from_airport, to_airport, departure_date, return_date, adults, trip_type):
        """Search flights using SerpAPI Google Flights"""
        
        # Prepare search parameters
        params = {
            "engine": "google_flights",
            "departure_id": from_airport,
            "arrival_id": to_airport,
            "outbound_date": departure_date,
            "currency": "PHP",
            "adults": adults,
            "api_key": settings.SERPAPI_KEY
        }
        
        # ✅ FIXED: Correct trip type mapping
        if trip_type == 'round-trip' and return_date:
            params["return_date"] = return_date
            params["type"] = "1"  # ✅ 1 = Round trip
        else:
            params["type"] = "2"  # ✅ 2 = One way

        logger.info(f"SerpAPI search params: {params}")

        # Execute search
        search = GoogleSearch(params)
        results = search.get_dict()
        
        logger.info(f"SerpAPI results keys: {list(results.keys())}")
        
        # Check for errors in SerpAPI response
        if 'error' in results:
            logger.error(f"SerpAPI error: {results['error']}")
            raise Exception(f"SerpAPI error: {results['error']}")
        
        # Parse results
        flights = []
        
        # Process best flights
        if "best_flights" in results and results["best_flights"]:
            logger.info(f"Found {len(results['best_flights'])} best flights")
            for flight in results["best_flights"][:3]:
                parsed_flight = self.parse_flight_data(flight, is_best=True)
                if parsed_flight:
                    flights.append(parsed_flight)
        
        # Process other flights
        if "other_flights" in results and results["other_flights"]:
            logger.info(f"Found {len(results['other_flights'])} other flights")
            for flight in results["other_flights"][:5]:
                parsed_flight = self.parse_flight_data(flight, is_best=False)
                if parsed_flight:
                    flights.append(parsed_flight)
        
        # ✅ FIX: Deduplicate flights by flight number + departure time
        # SerpAPI often returns same flight in both best_flights and other_flights
        seen_flights = set()
        deduplicated_flights = []
        
        for flight in flights:
            flight_key = f"{flight.get('flight_number', 'N/A')}_{flight.get('departure', 'N/A')}"
            if flight_key not in seen_flights:
                seen_flights.add(flight_key)
                deduplicated_flights.append(flight)
            else:
                logger.info(f"Removed duplicate flight: {flight.get('name')} {flight.get('flight_number')}")
        
        logger.info(f"Deduplicated {len(flights)} flights to {len(deduplicated_flights)}")
        flights = deduplicated_flights
        
        # Get price insights
        price_insights = self.get_price_insights(results)
        
        return {
            'success': True,
            'flights': flights,
            'current_price': price_insights.get('price_level', 'typical'),
            'price_insights': price_insights,
            'search_params': {
                'from': from_airport,
                'to': to_airport,
                'departure': departure_date,
                'return': return_date,
                'type': trip_type
            },
            'source': 'serpapi',
            'total_results': len(flights)
        }

    def parse_flight_data(self, flight_data, is_best=False):
        """Parse individual flight data from SerpAPI response"""
        try:
            # Extract flight information
            flights_info = flight_data.get('flights', [])
            if not flights_info:
                return None
                
            first_flight = flights_info[0]
            
            # Get airline info
            airline = first_flight.get('airline', 'Unknown Airline')
            
            # Get price
            price = flight_data.get('price', 0)
            if not price:
                return None
                
            formatted_price = f"₱{price:,}"
            
            # Get departure and arrival times
            departure_airport = first_flight.get('departure_airport', {})
            arrival_airport = first_flight.get('arrival_airport', {})
            
            departure_time = departure_airport.get('time', 'N/A')
            arrival_time = arrival_airport.get('time', 'N/A')
            
            # Get duration
            duration = flight_data.get('total_duration', 'N/A')
            
            # Count stops
            stops = len(flights_info) - 1 if len(flights_info) > 1 else 0
            
            return {
                'name': airline,
                'price': formatted_price,
                'price_per_person': formatted_price,  # 🆕 SerpAPI prices are per-person by default
                'pricing_note': 'per person',  # 🆕 Explicit label for frontend
                'departure': departure_time,
                'arrival': arrival_time,
                'duration': duration,
                'stops': stops,
                'is_best': is_best,
                'flight_number': first_flight.get('flight_number', ''),
                'aircraft': first_flight.get('aircraft', ''),
                'carbon_emissions': flight_data.get('carbon_emissions', {})
            }
            
        except Exception as e:
            logger.error(f"Error parsing flight data: {e}")
            return None

    def get_price_insights(self, results):
        """Extract price insights from SerpAPI results"""
        insights = {}
        
        if "price_insights" in results:
            price_data = results["price_insights"]
            insights = {
                'lowest_price': price_data.get('lowest_price'),
                'price_level': price_data.get('price_level', 'typical'),
                'typical_price_range': price_data.get('typical_price_range'),
                'price_history': price_data.get('price_history', [])
            }
        
        return insights

    def fallback_response(self, from_airport, to_airport, trip_type):
        """Enhanced fallback when SerpAPI fails or returns no results"""
        
        # Generate realistic mock data based on route
        route_data = {
            'MNL-CEB': {'base_price': 3500, 'duration': '1h 30m'},
            'MNL-DVO': {'base_price': 4200, 'duration': '1h 45m'},
            'MNL-PPS': {'base_price': 3800, 'duration': '1h 20m'},
            'MNL-KLO': {'base_price': 3200, 'duration': '1h 15m'},
            'MNL-TAG': {'base_price': 4000, 'duration': '1h 35m'},
            'MNL-IAO': {'base_price': 5500, 'duration': '2h 10m'},
            'CEB-MNL': {'base_price': 3500, 'duration': '1h 30m'},
            'DVO-MNL': {'base_price': 4200, 'duration': '1h 45m'},
        }
        
        route = f"{from_airport}-{to_airport}"
        route_info = route_data.get(route, {'base_price': 4000, 'duration': '1h 30m'})
        
        mock_flights = []
        airlines = [
            {'name': 'Philippine Airlines', 'code': 'PR', 'time_offset': 0},
            {'name': 'Cebu Pacific', 'code': '5J', 'time_offset': 2},
            {'name': 'AirAsia Philippines', 'code': 'Z2', 'time_offset': 4}
        ]
        
        for i, airline_info in enumerate(airlines):
            price_variation = random.randint(-500, 800)
            departure_hour = 6 + airline_info['time_offset']
            
            # Calculate arrival time based on duration
            duration_parts = route_info['duration'].replace('h', '').replace('m', '').split()
            duration_minutes = int(duration_parts[0]) * 60 + int(duration_parts[1])
            arrival_hour = departure_hour + (duration_minutes / 60)
            
            mock_flights.append({
                'name': airline_info['name'],
                'price': f"₱{route_info['base_price'] + price_variation:,}",
                'departure': f"{int(departure_hour):02d}:{random.randint(0, 5)*10:02d}",
                'arrival': f"{int(arrival_hour):02d}:{random.randint(0, 5)*10:02d}",
                'duration': route_info['duration'],
                'stops': 0,
                'is_best': i == 1,  # Middle option is usually best value
                'flight_number': f"{airline_info['code']}{random.randint(100, 999)}",
                'aircraft': random.choice(['Airbus A320', 'Boeing 737', 'Airbus A321'])
            })
        
        return {
            'success': True,
            'flights': mock_flights,
            'current_price': 'typical',
            'source': 'fallback',
            'total_results': len(mock_flights),
            'search_params': {
                'from': from_airport,
                'to': to_airport,
                'type': trip_type
            }
        }
    
    def _log_price_validation(self, flights, from_airport, to_airport):
        """
        ✅ NEW: Log price validation metrics for monitoring
        Helps track SERP API data quality over time
        """
        prices = []
        invalid_count = 0
        
        for flight in flights:
            try:
                price_str = flight.get('price', '₱0').replace('₱', '').replace(',', '').strip()
                price = int(price_str)
                
                # Validate price range
                if price > 0 and 500 <= price <= 100000:
                    prices.append(price)
                else:
                    invalid_count += 1
                    if price <= 0:
                        logger.warning(f"⚠️ Invalid price (≤0) for flight: {flight.get('name', 'Unknown')}")
                    elif price < 500:
                        logger.warning(f"⚠️ Unrealistic low price (₱{price}) for flight: {flight.get('name', 'Unknown')}")
                    elif price > 100000:
                        logger.warning(f"⚠️ Unrealistic high price (₱{price:,}) for flight: {flight.get('name', 'Unknown')}")
                        
            except (ValueError, TypeError, AttributeError) as e:
                invalid_count += 1
                logger.warning(f"⚠️ Price parsing error for flight: {flight.get('name', 'Unknown')} - {str(e)}")
                continue
        
        if prices:
            avg_price = sum(prices) / len(prices)
            logger.info(
                f"✅ Price validation - Route: {from_airport}→{to_airport}, "
                f"Total flights: {len(flights)}, Valid prices: {len(prices)}, Invalid: {invalid_count}, "
                f"Avg: ₱{avg_price:,.0f}, Range: ₱{min(prices):,} - ₱{max(prices):,}"
            )
        else:
            logger.error(
                f"❌ Price validation failed - Route: {from_airport}→{to_airport}, "
                f"No valid prices found among {len(flights)} flights"
            )


class AirportSearchView(APIView):
    def get(self, request):
        query = request.query_params.get('q', '')
        
        # Philippine airports mapping
        airports = {
            'MNL': 'Manila - Ninoy Aquino International',
            'CEB': 'Cebu - Mactan International',
            'DVO': 'Davao - Francisco Bangoy International',
            'PPS': 'Puerto Princesa - Palawan',
            'KLO': 'Kalibo - Boracay',
            'TAG': 'Tagbilaran - Bohol',
            'IAO': 'Siargao - Sayak',
            'CRK': 'Clark International',
            'ILO': 'Iloilo International',
            'BCD': 'Bacolod-Silay International'
        }
        
        # Filter airports based on query
        filtered = [
            {'code': code, 'name': name}
            for code, name in airports.items()
            if query.lower() in name.lower() or query.lower() in code.lower()
        ]
        
        return Response({'airports': filtered})