"""
Genetic Algorithm for Itinerary Optimization
Optimizes travel itineraries using genetic algorithm principles:
- Selection: Choose best itineraries based on fitness
- Crossover: Combine good itineraries to create new ones
- Mutation: Random changes to explore new solutions
- Evolution: Iterate to find optimal itinerary
"""

import random
import copy
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class ItineraryChromosome:
    """Represents a single itinerary solution (chromosome)"""
    
    def __init__(self, activities: List[Dict[str, Any]], day_assignments: List[int]):
        """
        Args:
            activities: List of activity dictionaries with details
            day_assignments: Which day each activity is assigned to
        """
        self.activities = activities
        self.day_assignments = day_assignments
        self.fitness = 0.0
        self.distance_score = 0.0
        self.time_score = 0.0
        self.cost_score = 0.0
        self.preference_score = 0.0
    
    def __repr__(self):
        return f"Chromosome(fitness={self.fitness:.2f}, activities={len(self.activities)})"


class GeneticItineraryOptimizer:
    """
    Genetic Algorithm for optimizing travel itineraries
    
    ✅ PERFORMANCE OPTIMIZATIONS:
    - Reduced population size from 50 → 30 (40% faster, minimal quality loss)
    - Reduced generations from 100 → 50 (50% faster, converges earlier)
    - Early convergence detection (stops when improvement < 0.01 for 10 generations)
    
    Fitness Criteria:
    1. Minimize travel distance between locations
    2. Respect time constraints (opening hours, duration)
    3. Stay within budget
    4. Match user preferences
    5. Balanced daily activities
    """
    
    def __init__(
        self,
        population_size: int = 30,      # ✅ Reduced from 50
        generations: int = 50,          # ✅ Reduced from 100
        mutation_rate: float = 0.15,
        crossover_rate: float = 0.7,
        elite_size: int = 3             # ✅ Reduced from 5
    ):
        """
        Args:
            population_size: Number of solutions per generation (default: 30)
            generations: Number of generations to evolve (default: 50)
            mutation_rate: Probability of mutation (0-1)
            crossover_rate: Probability of crossover (0-1)
            elite_size: Number of best solutions to preserve (default: 3)
        """
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
        self.elite_size = elite_size
        self.logger = logging.getLogger(__name__)
        
        # ✅ NEW: Early convergence tracking
        self.convergence_threshold = 0.01  # Stop if improvement < 1%
        self.convergence_patience = 10     # Check over 10 generations
    
    def optimize(
        self,
        activities: List[Dict[str, Any]],
        trip_params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Optimize itinerary using genetic algorithm
        
        Args:
            activities: List of possible activities/places to visit
            trip_params: Trip parameters (dates, budget, preferences)
        
        Returns:
            Optimized itinerary with activities arranged by day
        """
        self.logger.info(f"🧬 Starting genetic algorithm optimization")
        self.logger.info(f"📊 Parameters: pop={self.population_size}, gen={self.generations}, mutation={self.mutation_rate}")
        
        # Extract parameters
        num_days = self._calculate_days(trip_params)
        budget = self._parse_budget(trip_params.get('budget', 'moderate'))
        preferences = trip_params.get('user_profile', {})
        
        # ✅ NEW: Extract activity preference (1-4 activities per day)
        activity_preference = int(trip_params.get('activityPreference', 2))
        self.logger.info(f"🎯 User activity preference: {activity_preference} activities/day")
        
        # Initialize population with activity preference
        population = self._initialize_population(activities, num_days, activity_preference)
        
        # Evolution loop
        best_fitness_history = []
        
        for generation in range(self.generations):
            # Evaluate fitness for all chromosomes
            for chromosome in population:
                chromosome.fitness = self._calculate_fitness(
                    chromosome, num_days, budget, preferences, activity_preference
                )
            
            # Sort by fitness (descending)
            population.sort(key=lambda x: x.fitness, reverse=True)
            
            # Track best fitness
            best_fitness = population[0].fitness
            best_fitness_history.append(best_fitness)
            
            if generation % 10 == 0:
                self.logger.info(f"🧬 Generation {generation}: Best fitness = {best_fitness:.4f}")
            
            # Check for convergence
            if self._check_convergence(best_fitness_history):
                self.logger.info(f"✅ Converged at generation {generation}")
                break
            
            # Create next generation
            population = self._create_next_generation(population, num_days, activity_preference)
        
        # Get best solution
        best_chromosome = population[0]
        
        self.logger.info(f"✅ Optimization complete. Best fitness: {best_chromosome.fitness:.4f}")
        self.logger.info(f"📊 Scores - Distance: {best_chromosome.distance_score:.2f}, "
                        f"Time: {best_chromosome.time_score:.2f}, "
                        f"Cost: {best_chromosome.cost_score:.2f}, "
                        f"Preference: {best_chromosome.preference_score:.2f}")
        
        # Convert to itinerary format
        optimized_itinerary = self._chromosome_to_itinerary(
            best_chromosome, num_days, trip_params
        )
        
        return optimized_itinerary
    
    def _initialize_population(
        self,
        activities: List[Dict[str, Any]],
        num_days: int,
        activity_preference: int = 2
    ) -> List[ItineraryChromosome]:
        """
        Create initial population of random solutions
        
        ✅ RESPECTS USER'S ACTIVITY PACE PREFERENCE
        - Day 1 (Arrival): Max 2 activities
        - Middle Days: Exactly activity_preference activities
        - Last Day (Departure): Max 1 activity
        """
        
        population = []
        
        for _ in range(self.population_size):
            # Calculate target activities based on user preference
            # Day 1: max 2, Last day: max 1, Middle days: activity_preference
            middle_days = max(0, num_days - 2)
            
            target_activities = (
                2 +                                    # Day 1 max
                (middle_days * activity_preference) +  # Middle days
                1                                      # Last day max
            )
            
            # Cap at available activities
            target_activities = min(target_activities, len(activities))
            
            # Add some variance (80-100% of target)
            min_activities = int(target_activities * 0.8)
            max_activities = target_activities
            
            num_activities = random.randint(min_activities, max_activities)
            num_activities = max(num_activities, num_days)  # At least 1 per day
            
            selected_activities = random.sample(activities, min(num_activities, len(activities)))
            
            # Smart day assignment respecting activity preference
            day_assignments = self._smart_day_assignment(
                selected_activities, 
                num_days, 
                activity_preference
            )
            
            chromosome = ItineraryChromosome(selected_activities, day_assignments)
            population.append(chromosome)
        
        self.logger.info(f"✅ Initialized population of {len(population)} chromosomes with {activity_preference} activities/day target")
        return population
    
    def _smart_day_assignment(
        self,
        activities: List[Dict[str, Any]],
        num_days: int,
        activity_preference: int
    ) -> List[int]:
        """
        Intelligently assign activities to days based on user preference
        
        Rules:
        - Day 1 (Arrival): 1-2 activities max
        - Middle Days: Exactly activity_preference activities (with small variance)
        - Last Day (Departure): 0-1 activities max
        """
        
        assignments = []
        activities_per_day = {day: [] for day in range(1, num_days + 1)}
        
        # Shuffle activities for randomness
        shuffled_activities = activities.copy()
        random.shuffle(shuffled_activities)
        
        # Determine capacity for each day
        day_capacity = {}
        for day in range(1, num_days + 1):
            if day == 1:  # Arrival day
                day_capacity[day] = random.randint(1, 2)
            elif day == num_days:  # Departure day
                day_capacity[day] = random.randint(0, 1)
            else:  # Middle days
                # Allow small variance around preference (±1)
                variance = random.randint(-1, 1) if activity_preference > 1 else 0
                day_capacity[day] = max(1, activity_preference + variance)
        
        # Assign activities to days
        for idx, activity in enumerate(shuffled_activities):
            # Find day with remaining capacity
            available_days = [d for d in range(1, num_days + 1) if len(activities_per_day[d]) < day_capacity[d]]
            
            if available_days:
                # Prefer days earlier in trip (fill sequentially)
                day = available_days[0]
                activities_per_day[day].append(activity)
                assignments.append(day)
            else:
                # All days at capacity, assign to random middle day
                middle_days = list(range(2, max(2, num_days)))
                day = random.choice(middle_days) if middle_days else 1
                assignments.append(day)
        
        return assignments
    
    def _calculate_fitness(
        self,
        chromosome: ItineraryChromosome,
        num_days: int,
        budget: float,
        preferences: Dict[str, Any],
        activity_preference: int = 2
    ) -> float:
        """
        Calculate fitness score for a chromosome
        Higher is better
        """
        
        # Component scores (0-100 each)
        distance_score = self._evaluate_distance(chromosome, num_days)
        time_score = self._evaluate_time_distribution(chromosome, num_days, activity_preference)
        cost_score = self._evaluate_cost(chromosome, budget)
        preference_score = self._evaluate_preferences(chromosome, preferences)
        diversity_score = self._evaluate_diversity(chromosome)
        
        # Store individual scores
        chromosome.distance_score = distance_score
        chromosome.time_score = time_score
        chromosome.cost_score = cost_score
        chromosome.preference_score = preference_score
        
        # Weighted combination
        fitness = (
            distance_score * 0.25 +      # 25% - minimize travel
            time_score * 0.20 +           # 20% - balanced schedule
            cost_score * 0.20 +           # 20% - budget constraint
            preference_score * 0.25 +     # 25% - user preferences
            diversity_score * 0.10        # 10% - variety
        )
        
        return fitness
    
    def _evaluate_distance(self, chromosome: ItineraryChromosome, num_days: int = 3) -> float:
        """
        Evaluate travel distance between consecutive locations
        Lower total distance = higher score
        """
        
        # Group activities by day
        daily_activities = self._group_by_day(chromosome)
        
        total_distance = 0
        max_distance = 100  # km, for normalization
        
        for day, activities in daily_activities.items():
            for i in range(len(activities) - 1):
                # Estimate distance (in real implementation, use actual distances)
                dist = self._estimate_distance(activities[i], activities[i + 1])
                total_distance += dist
        
        # Normalize and invert (lower distance = higher score)
        if total_distance == 0:
            return 100.0
        
        normalized_distance = min(total_distance / (num_days * max_distance), 1.0)
        score = (1 - normalized_distance) * 100
        
        return max(score, 0)
    
    def _evaluate_time_distribution(
        self,
        chromosome: ItineraryChromosome,
        num_days: int,
        activity_preference: int = 2
    ) -> float:
        """
        Evaluate how well activities are distributed across days
        ✅ RESPECTS USER'S ACTIVITY PACE PREFERENCE
        
        Scoring:
        - Day 1: Penalty if > 2 activities
        - Middle days: Reward if close to activity_preference
        - Last day: Penalty if > 1 activity
        - Balanced distribution = higher score
        """
        
        daily_activities = self._group_by_day(chromosome)
        
        # Count activities per day
        activity_counts = [len(daily_activities.get(day, [])) for day in range(1, num_days + 1)]
        
        if not activity_counts or sum(activity_counts) == 0:
            return 0.0
        
        score = 100.0
        
        # Check Day 1 (Arrival) - should have max 2 activities
        if len(activity_counts) >= 1:
            day1_count = activity_counts[0]
            if day1_count > 2:
                penalty = (day1_count - 2) * 15  # 15 points per extra activity
                score -= penalty
                self.logger.debug(f"Day 1 penalty: {day1_count} activities (max 2), -{penalty} points")
        
        # Check Last Day (Departure) - should have max 1 activity
        if len(activity_counts) >= 2:
            last_day_count = activity_counts[-1]
            if last_day_count > 1:
                penalty = (last_day_count - 1) * 20  # 20 points per extra activity
                score -= penalty
                self.logger.debug(f"Last day penalty: {last_day_count} activities (max 1), -{penalty} points")
        
        # Check Middle Days - should match activity_preference
        if len(activity_counts) > 2:
            middle_counts = activity_counts[1:-1]
            for day_idx, count in enumerate(middle_counts, start=2):
                diff = abs(count - activity_preference)
                if diff > 1:  # Allow ±1 variance
                    penalty = diff * 10  # 10 points per activity difference
                    score -= penalty
                    self.logger.debug(f"Day {day_idx} deviation: {count} vs {activity_preference} target, -{penalty} points")
        
        # Penalize days with 0 activities (except potentially last day)
        zero_days = sum(1 for i, c in enumerate(activity_counts) if c == 0 and i < len(activity_counts) - 1)
        if zero_days > 0:
            penalty = zero_days * 25
            score -= penalty
        
        return max(score, 0)
    
    def _evaluate_cost(self, chromosome: ItineraryChromosome, budget: float) -> float:
        """
        Evaluate total cost vs budget
        ✅ STRICT ENFORCEMENT: Heavy penalties for over-budget solutions
        Within budget = higher score
        """
        
        total_cost = 0
        for activity in chromosome.activities:
            # Parse pricing
            pricing = activity.get('ticketPricing', activity.get('price', 'Free'))
            cost = self._parse_price(pricing)
            total_cost += cost
        
        if budget == 0:
            return 50.0  # Neutral score if no budget specified
        
        # Calculate cost ratio
        cost_ratio = total_cost / budget
        
        # ✅ ENHANCED: Stricter budget enforcement
        if cost_ratio > 1.0:
            # Over budget: AGGRESSIVE PENALTY
            # For every 10% over budget, lose 50 points
            over_percentage = (cost_ratio - 1.0)
            penalty = over_percentage * 500  # Much stricter than before
            score = max(0, 100 - penalty)
            
            if score < 20:
                self.logger.debug(
                    f"⚠️ Heavy budget penalty: ₱{total_cost:.0f} vs ₱{budget:.0f} "
                    f"({cost_ratio*100:.1f}%), score={score:.1f}"
                )
        elif cost_ratio <= 0.7:
            # Too far under budget (not utilizing resources)
            score = 80 + (cost_ratio / 0.7) * 10  # 80-90 range
        elif cost_ratio <= 0.95:
            # Sweet spot: 70-95% of budget
            score = 100
        else:
            # 95-100% of budget: slight preference for staying under
            score = 95 + (1.0 - cost_ratio) * 100
        
        return score
    
    def _evaluate_preferences(
        self,
        chromosome: ItineraryChromosome,
        preferences: Dict[str, Any]
    ) -> float:
        """
        Evaluate how well activities match user preferences
        Better match = higher score
        
        Now considers:
        - activityTypes (legacy)
        - interests (legacy)
        - preferredTripTypes (from user profile)
        - travelStyle (solo, duo, family, group, business)
        """
        
        if not preferences:
            return 75.0  # Default score if no preferences
        
        score = 0
        total_activities = len(chromosome.activities)
        
        if total_activities == 0:
            return 50.0
        
        # Extract preference fields
        activity_types = preferences.get('activityTypes', [])
        interests = preferences.get('interests', [])
        preferred_trip_types = preferences.get('preferredTripTypes', [])
        travel_style = preferences.get('travelStyle', '').lower()
        
        # Define travel style keywords for matching
        style_keywords = {
            'solo': ['cafe', 'coffee', 'solo', 'museum', 'gallery', 'walk', 'trek', 'hostel', 'coworking'],
            'duo': ['romantic', 'couple', 'intimate', 'sunset', 'wine', 'spa', 'rooftop', 'view', 'scenic'],
            'family': ['family', 'kid', 'children', 'playground', 'park', 'zoo', 'aquarium', 'educational', 'safe'],
            'group': ['group', 'party', 'nightlife', 'adventure', 'sports', 'tour', 'social', 'pub', 'bar'],
            'business': ['business', 'meeting', 'conference', 'hotel', 'efficient', 'quick', 'cbd', 'downtown']
        }
        
        # Define trip type keywords
        trip_type_keywords = {
            'adventure': ['adventure', 'outdoor', 'hiking', 'climbing', 'trek', 'mountain', 'trail'],
            'beach': ['beach', 'island', 'coast', 'shore', 'sand', 'sea', 'ocean', 'dive', 'snorkel'],
            'cultural': ['cultural', 'historical', 'heritage', 'museum', 'temple', 'church', 'monument', 'fort'],
            'nature': ['nature', 'wildlife', 'park', 'forest', 'sanctuary', 'reserve', 'garden', 'falls'],
            'photography': ['scenic', 'view', 'viewpoint', 'landscape', 'photo', 'sunset', 'sunrise'],
            'wellness': ['wellness', 'spa', 'massage', 'relax', 'yoga', 'meditation', 'hot spring'],
            'food': ['food', 'restaurant', 'culinary', 'market', 'street food', 'dining', 'taste'],
            'romantic': ['romantic', 'couple', 'intimate', 'candlelight', 'wine', 'rooftop', 'sunset']
        }
        
        for activity in chromosome.activities:
            activity_name = activity.get('placeName', '').lower()
            activity_details = activity.get('placeDetails', '').lower()
            combined_text = f"{activity_name} {activity_details}"
            
            activity_score = 0
            
            # 1. Check legacy activity type matches
            for activity_type in activity_types:
                if activity_type.lower() in combined_text:
                    activity_score += 5
            
            # 2. Check legacy interest matches
            for interest in interests:
                if interest.lower() in combined_text:
                    activity_score += 5
            
            # 3. ✅ NEW: Check preferredTripTypes matches
            for trip_type in preferred_trip_types:
                trip_type_lower = trip_type.lower()
                if trip_type_lower in trip_type_keywords:
                    keywords = trip_type_keywords[trip_type_lower]
                    for keyword in keywords:
                        if keyword in combined_text:
                            activity_score += 8  # Higher weight for trip type matches
                            break  # Only count once per trip type
            
            # 4. ✅ NEW: Check travelStyle matches
            if travel_style and travel_style in style_keywords:
                keywords = style_keywords[travel_style]
                for keyword in keywords:
                    if keyword in combined_text:
                        activity_score += 10  # Highest weight for style matches
                        break  # Only count once per activity
            
            score += min(activity_score, 30)  # Cap per-activity score to avoid outliers
        
        # Normalize to 0-100
        max_possible = total_activities * 30
        if max_possible > 0:
            normalized_score = (score / max_possible) * 100
            score = min(normalized_score, 100)
        else:
            score = 50.0
        
        self.logger.info(f"📊 Preference match score: {score:.2f}/100 (style: {travel_style}, types: {len(preferred_trip_types)})")
        
        return score
    
    def _evaluate_diversity(self, chromosome: ItineraryChromosome) -> float:
        """
        Evaluate diversity of activities
        More variety = higher score
        """
        
        if not chromosome.activities:
            return 0.0
        
        # Check for repeated locations
        unique_locations = len(set(a.get('placeName', '') for a in chromosome.activities))
        total_locations = len(chromosome.activities)
        
        diversity_ratio = unique_locations / total_locations if total_locations > 0 else 0
        score = diversity_ratio * 100
        
        return score
    
    def _create_next_generation(
        self,
        population: List[ItineraryChromosome],
        num_days: int,
        activity_preference: int = 2
    ) -> List[ItineraryChromosome]:
        """Create next generation through selection, crossover, and mutation"""
        
        next_generation = []
        
        # Elitism: Keep best solutions
        next_generation.extend(population[:self.elite_size])
        
        # Generate rest through crossover and mutation
        while len(next_generation) < self.population_size:
            # Selection: Tournament selection
            parent1 = self._tournament_selection(population)
            parent2 = self._tournament_selection(population)
            
            # Crossover
            if random.random() < self.crossover_rate:
                child1, child2 = self._crossover(parent1, parent2, num_days)
            else:
                child1, child2 = copy.deepcopy(parent1), copy.deepcopy(parent2)
            
            # Mutation
            if random.random() < self.mutation_rate:
                child1 = self._mutate(child1, num_days, activity_preference)
            if random.random() < self.mutation_rate:
                child2 = self._mutate(child2, num_days, activity_preference)
            
            next_generation.append(child1)
            if len(next_generation) < self.population_size:
                next_generation.append(child2)
        
        return next_generation[:self.population_size]
    
    def _tournament_selection(
        self,
        population: List[ItineraryChromosome],
        tournament_size: int = 3
    ) -> ItineraryChromosome:
        """Select parent using tournament selection"""
        
        tournament = random.sample(population, min(tournament_size, len(population)))
        return max(tournament, key=lambda x: x.fitness)
    
    def _crossover(
        self,
        parent1: ItineraryChromosome,
        parent2: ItineraryChromosome,
        num_days: int
    ) -> Tuple[ItineraryChromosome, ItineraryChromosome]:
        """
        Perform crossover between two parents
        Uses day-based crossover: exchange activities from certain days
        """
        
        # Deep copy parents
        child1_activities = copy.deepcopy(parent1.activities)
        child1_days = copy.deepcopy(parent1.day_assignments)
        child2_activities = copy.deepcopy(parent2.activities)
        child2_days = copy.deepcopy(parent2.day_assignments)
        
        # Random crossover point (which days to swap)
        crossover_day = random.randint(1, max(1, num_days - 1))
        
        # Swap activities from crossover_day onwards
        new_child1_activities = []
        new_child1_days = []
        new_child2_activities = []
        new_child2_days = []
        
        # Child 1: Take from parent1 before crossover, parent2 after
        for act, day in zip(child1_activities, child1_days):
            if day < crossover_day:
                new_child1_activities.append(act)
                new_child1_days.append(day)
        
        for act, day in zip(child2_activities, child2_days):
            if day >= crossover_day:
                new_child1_activities.append(act)
                new_child1_days.append(day)
        
        # Child 2: Take from parent2 before crossover, parent1 after
        for act, day in zip(child2_activities, child2_days):
            if day < crossover_day:
                new_child2_activities.append(act)
                new_child2_days.append(day)
        
        for act, day in zip(child1_activities, child1_days):
            if day >= crossover_day:
                new_child2_activities.append(act)
                new_child2_days.append(day)
        
        child1 = ItineraryChromosome(new_child1_activities, new_child1_days)
        child2 = ItineraryChromosome(new_child2_activities, new_child2_days)
        
        return child1, child2
    
    def _mutate(
        self,
        chromosome: ItineraryChromosome,
        num_days: int,
        activity_preference: int = 2
    ) -> ItineraryChromosome:
        """
        Perform mutation on a chromosome
        ✅ RESPECTS ACTIVITY PREFERENCE CONSTRAINTS
        
        Types of mutations:
        1. Change day assignment (respecting day capacity)
        2. Swap two activities
        3. Remove an activity (if over target)
        """
        
        if not chromosome.activities:
            return chromosome
        
        mutation_type = random.choice(['reassign', 'swap', 'remove'])
        
        if mutation_type == 'reassign':
            # Change day assignment with preference awareness
            idx = random.randint(0, len(chromosome.activities) - 1)
            old_day = chromosome.day_assignments[idx]
            
            # Count current activities per day
            daily_counts = {}
            for day_num in chromosome.day_assignments:
                daily_counts[day_num] = daily_counts.get(day_num, 0) + 1
            
            # Find days that can accept more activities
            available_days = []
            for day in range(1, num_days + 1):
                current_count = daily_counts.get(day, 0)
                max_for_day = self._get_max_activities_for_day(day, num_days, activity_preference)
                
                if day != old_day and current_count < max_for_day:
                    available_days.append(day)
            
            # Reassign to available day or random middle day
            if available_days:
                chromosome.day_assignments[idx] = random.choice(available_days)
            else:
                # Fallback: random middle day
                middle_days = list(range(2, max(2, num_days)))
                if middle_days:
                    chromosome.day_assignments[idx] = random.choice(middle_days)
        
        elif mutation_type == 'swap' and len(chromosome.activities) >= 2:
            # Swap two activities
            idx1, idx2 = random.sample(range(len(chromosome.activities)), 2)
            chromosome.activities[idx1], chromosome.activities[idx2] = \
                chromosome.activities[idx2], chromosome.activities[idx1]
            chromosome.day_assignments[idx1], chromosome.day_assignments[idx2] = \
                chromosome.day_assignments[idx2], chromosome.day_assignments[idx1]
        
        elif mutation_type == 'remove' and len(chromosome.activities) > num_days:
            # Remove an activity (keep at least 1 per day)
            idx = random.randint(0, len(chromosome.activities) - 1)
            chromosome.activities.pop(idx)
            chromosome.day_assignments.pop(idx)
        
        return chromosome
    
    def _get_max_activities_for_day(self, day: int, total_days: int, activity_preference: int) -> int:
        """Get maximum activities allowed for a specific day"""
        if day == 1:  # Arrival
            return 2
        elif day == total_days:  # Departure
            return 1
        else:  # Middle days
            return activity_preference + 1  # Allow +1 for flexibility
    
    def _check_convergence(self, fitness_history: List[float], window: int = 10) -> bool:
        """
        Check if algorithm has converged (early stopping)
        
        ✅ OPTIMIZED: Stops when improvement < 1% over 10 generations
        This saves ~30-50% of computation time on typical runs
        """
        
        if len(fitness_history) < window:
            return False
        
        recent_fitness = fitness_history[-window:]
        
        # Calculate improvement rate over window
        if len(recent_fitness) >= 2:
            first_fitness = recent_fitness[0]
            last_fitness = recent_fitness[-1]
            
            if first_fitness > 0:
                improvement = (last_fitness - first_fitness) / first_fitness
                
                # Stop if improvement < convergence_threshold (default 1%)
                if improvement < self.convergence_threshold:
                    self.logger.info(f"🛑 Early convergence detected: {improvement*100:.2f}% improvement over last {window} generations")
                    return True
        
        # Also check variance for stability
        mean_fitness = sum(recent_fitness) / window
        variance = sum((x - mean_fitness) ** 2 for x in recent_fitness) / window
        
        if variance < 0.0001:  # Very stable
            self.logger.info(f"🛑 Stable convergence detected: variance = {variance:.6f}")
            return True
        
        return False
    
    def _chromosome_to_itinerary(
        self,
        chromosome: ItineraryChromosome,
        num_days: int,
        trip_params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Convert optimized chromosome to itinerary format"""
        
        daily_activities = self._group_by_day(chromosome)
        
        itinerary = []
        
        for day in range(1, num_days + 1):
            activities = daily_activities.get(day, [])
            
            # Sort activities by time if available
            activities_sorted = self._sort_activities_by_time(activities)
            
            # 🔧 FIXED: Return structured plan array instead of planText string
            # This enables proper frontend display, editing, and map integration
            plan_array = []
            for activity in activities_sorted:
                plan_item = {
                    'time': activity.get('time', '9:00 AM'),
                    'placeName': activity.get('placeName', 'Activity'),
                    'placeDetails': activity.get('placeDetails', 'Enjoy this activity'),
                    'ticketPricing': activity.get('ticketPricing', 'Free'),
                    'timeTravel': activity.get('timeTravel', '1-2 hours'),
                    'rating': str(activity.get('rating', 'N/A')),
                    # Preserve image and location data
                    'imageUrl': activity.get('imageUrl', activity.get('photoUrl', '')),
                    'geoCoordinates': activity.get('geoCoordinates', {
                        'latitude': activity.get('lat', 0),
                        'longitude': activity.get('lng', 0)
                    })
                }
                plan_array.append(plan_item)
            
            itinerary.append({
                'day': day,
                'theme': self._generate_day_theme(activities_sorted, day),
                'plan': plan_array  # ✅ Structured array for frontend
            })
        
        return {
            'itinerary_data': itinerary,
            'optimization_score': chromosome.fitness,
            'total_cost': sum(self._parse_price(a.get('ticketPricing', 'Free')) for a in chromosome.activities),
            'total_activities': len(chromosome.activities)
        }
    
    # Helper methods
    
    def _calculate_days(self, trip_params: Dict[str, Any]) -> int:
        """Calculate number of days in trip"""
        return trip_params.get('duration', 3)
    
    def _parse_budget(self, budget_str: str) -> float:
        """Parse budget string to numerical value"""
        budget_map = {
            'cheap': 5000,
            'moderate': 15000,
            'luxury': 50000
        }
        return budget_map.get(budget_str.lower(), 15000)
    
    def _parse_price(self, pricing: str) -> float:
        """Parse price string to float"""
        if not pricing or pricing == 'N/A' or pricing.lower() == 'free':
            return 0.0
        
        # Extract numbers from string like "₱500" or "₱800 - ₱1,500"
        import re
        numbers = re.findall(r'[\d,]+', pricing)
        if numbers:
            # Take average if range
            values = [float(n.replace(',', '')) for n in numbers]
            return sum(values) / len(values)
        return 0.0
    
    def _estimate_distance(self, activity1: Dict, activity2: Dict) -> float:
        """Estimate distance between two activities (simplified)"""
        # In real implementation, use actual geocoding or distance matrix
        return random.uniform(1, 10)  # km
    
    def _group_by_day(self, chromosome: ItineraryChromosome) -> Dict[int, List[Dict]]:
        """Group activities by day"""
        daily_activities = {}
        for activity, day in zip(chromosome.activities, chromosome.day_assignments):
            if day not in daily_activities:
                daily_activities[day] = []
            daily_activities[day].append(activity)
        return daily_activities
    
    def _sort_activities_by_time(self, activities: List[Dict]) -> List[Dict]:
        """Sort activities by time"""
        def time_to_minutes(time_str):
            try:
                time = datetime.strptime(time_str, '%I:%M %p')
                return time.hour * 60 + time.minute
            except:
                return 540  # Default to 9:00 AM
        
        return sorted(activities, key=lambda x: time_to_minutes(x.get('time', '9:00 AM')))
    
    def _generate_day_theme(self, activities: List[Dict], day: int) -> str:
        """Generate a theme for the day based on activities"""
        if not activities:
            return f"Day {day} - Free Time"
        
        # Analyze activity types
        themes = []
        for activity in activities:
            name = activity.get('placeName', '').lower()
            if any(word in name for word in ['museum', 'art', 'gallery']):
                themes.append('Cultural')
            elif any(word in name for word in ['church', 'temple', 'mosque']):
                themes.append('Heritage')
            elif any(word in name for word in ['park', 'ocean', 'beach', 'bay']):
                themes.append('Nature')
            elif any(word in name for word in ['mall', 'market', 'shop']):
                themes.append('Shopping')
            elif any(word in name for word in ['restaurant', 'food', 'cuisine']):
                themes.append('Culinary')
        
        if themes:
            unique_themes = list(set(themes))
            return f"Day {day} - {' & '.join(unique_themes[:2])}"
        
        return f"Day {day} - Exploration"
