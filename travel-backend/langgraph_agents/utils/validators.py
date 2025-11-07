"""
Data validation utilities for LangGraph agents
Uses Philippine Time (PHT, UTC+8) for all date operations
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import re

from ..exceptions import DataValidationError
from .timezone import parse_date_pht, validate_date_range_pht, to_pht, is_past_date_pht


def _extract_travelers_number(travelers_input) -> int:
    """
    Extract numeric value from travelers input, handling various formats
    
    Args:
        travelers_input: Input in various formats (int, "2", "2 People", "3 to 5 People", etc.)
        
    Returns:
        Integer number of travelers
        
    Raises:
        ValueError: If no valid number can be extracted
    """
    if isinstance(travelers_input, int):
        return travelers_input
    
    if isinstance(travelers_input, str):
        # Handle formats like "1", "2 People", "3 to 5 People", "Solo Traveler"
        
        # First try direct conversion
        travelers_input = travelers_input.strip()
        if travelers_input.isdigit():
            return int(travelers_input)
        
        # Extract first number from string
        import re
        match = re.search(r'(\d+)', travelers_input)
        if match:
            return int(match.group(1))
        
        # Handle special cases
        lower_input = travelers_input.lower()
        if any(keyword in lower_input for keyword in ['solo', 'single', 'one', 'myself']):
            return 1
        elif any(keyword in lower_input for keyword in ['couple', 'duo', 'two', 'pair']):
            return 2
    
    raise ValueError(f"Cannot extract number from travelers input: {travelers_input}")


def validate_trip_params(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and sanitize trip parameters
    
    Args:
        params: Dictionary of trip parameters
        
    Returns:
        Validated and sanitized parameters
        
    Raises:
        DataValidationError: If validation fails
    """
    required_fields = ['destination', 'travelers', 'budget']
    
    # Check required fields
    for field in required_fields:
        if field not in params or not params[field]:
            raise DataValidationError(f"Missing required field: {field}", field_name=field)
    
    validated_params = params.copy()
    
    # Validate destination
    if not isinstance(params['destination'], str) or len(params['destination'].strip()) < 3:
        raise DataValidationError("Destination must be at least 3 characters long", field_name='destination')
    
    validated_params['destination'] = params['destination'].strip()
    
    # Validate travelers - use enhanced extraction
    try:
        travelers_count = _extract_travelers_number(params['travelers'])
        if travelers_count < 1 or travelers_count > 20:
            raise DataValidationError("Travelers count must be between 1 and 20", field_name='travelers')
        validated_params['travelers'] = travelers_count
    except (ValueError, TypeError) as e:
        raise DataValidationError(f"Travelers must be a valid number (got: {params['travelers']})", field_name='travelers')
    
    # Validate dates if provided (using PHT)
    if 'startDate' in params and params['startDate']:
        start_date = parse_date_pht(params['startDate'])
        if not start_date:
            raise DataValidationError("Invalid start date format", field_name='startDate')
        
        # Check if date is in the past (PHT)
        if is_past_date_pht(start_date):
            raise DataValidationError("Start date cannot be in the past (PHT)", field_name='startDate')
        
        validated_params['startDate'] = start_date.isoformat()
    
    if 'endDate' in params and params['endDate']:
        end_date = parse_date_pht(params['endDate'])
        if not end_date:
            raise DataValidationError("Invalid end date format", field_name='endDate')
        
        validated_params['endDate'] = end_date.isoformat()
        
        # Check if end date is after start date (using PHT)
        if 'startDate' in validated_params:
            start_date = parse_date_pht(validated_params['startDate'])
            if start_date and end_date <= start_date:
                raise DataValidationError("End date must be after start date (PHT)", field_name='endDate')
    
    # Validate budget
    budget_levels = ['budget', 'moderate', 'luxury', 'Budget', 'Moderate', 'Luxury']
    if params['budget'] not in budget_levels and not params['budget'].startswith('Custom:'):
        raise DataValidationError(f"Budget must be one of {budget_levels} or start with 'Custom:'", field_name='budget')
    
    return validated_params


def validate_coordinates(lat: float, lng: float) -> tuple[float, float]:
    """
    Validate geographical coordinates
    
    Args:
        lat: Latitude
        lng: Longitude
        
    Returns:
        Tuple of validated (latitude, longitude)
        
    Raises:
        DataValidationError: If coordinates are invalid
    """
    try:
        lat = float(lat)
        lng = float(lng)
    except (ValueError, TypeError):
        raise DataValidationError("Coordinates must be valid numbers")
    
    if not (-90 <= lat <= 90):
        raise DataValidationError(f"Latitude must be between -90 and 90, got {lat}")
    
    if not (-180 <= lng <= 180):
        raise DataValidationError(f"Longitude must be between -180 and 180, got {lng}")
    
    return lat, lng


def validate_email(email: str) -> str:
    """
    Validate email format with development fallback
    
    Args:
        email: Email address to validate
        
    Returns:
        Validated email address
        
    Raises:
        DataValidationError: If email is invalid
    """
    # ✅ ALLOW GUEST EMAIL FOR DEVELOPMENT
    if not email or not isinstance(email, str):
        import os
        if os.getenv('DJANGO_SETTINGS_MODULE') == 'travelapi.settings' and os.getenv('DEBUG', 'True') == 'True':
            # Development mode: use guest email
            return "guest@travelrover.com"
        raise DataValidationError("Email is required")
    
    email = email.strip().lower()
    
    # Basic email validation regex
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_pattern, email):
        raise DataValidationError(f"Invalid email format: {email}")
    
    return email


def sanitize_response_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize response data to ensure it's safe for storage and transmission
    
    Args:
        data: Data to sanitize
        
    Returns:
        Sanitized data
    """
    if not isinstance(data, dict):
        return data
    
    sanitized = {}
    
    for key, value in data.items():
        # Sanitize key
        safe_key = re.sub(r'[^\w\-_.]', '_', str(key))
        
        # Sanitize value
        if isinstance(value, dict):
            sanitized[safe_key] = sanitize_response_data(value)
        elif isinstance(value, list):
            sanitized[safe_key] = [
                sanitize_response_data(item) if isinstance(item, dict) else item
                for item in value
            ]
        elif isinstance(value, str):
            # Remove potentially dangerous characters but preserve useful ones
            sanitized[safe_key] = re.sub(r'[<>]', '', value).strip()
        else:
            sanitized[safe_key] = value
    
    return sanitized


def validate_hotel_preferences(prefs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate hotel preference data
    
    Args:
        prefs: Hotel preferences dictionary
        
    Returns:
        Validated preferences
        
    Raises:
        DataValidationError: If validation fails
    """
    validated = prefs.copy()
    
    # Validate accommodation type
    valid_types = ['hotel', 'resort', 'hostel', 'apartment', 'any']
    if 'preferredType' in prefs:
        if prefs['preferredType'] not in valid_types:
            raise DataValidationError(f"Accommodation type must be one of {valid_types}")
    
    # Validate budget level
    valid_budgets = ['budget', 'mid-range', 'upscale', 'luxury']
    if 'budgetLevel' in prefs:
        if prefs['budgetLevel'] not in valid_budgets:
            raise DataValidationError(f"Budget level must be one of {valid_budgets}")
    
    return validated


def validate_flight_preferences(prefs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate flight preference data
    
    Args:
        prefs: Flight preferences dictionary
        
    Returns:
        Validated preferences
        
    Raises:
        DataValidationError: If validation fails
    """
    validated = prefs.copy()
    
    # Validate class preferences
    valid_classes = ['economy', 'premium_economy', 'business', 'first']
    if 'preferredClass' in prefs:
        if prefs['preferredClass'] not in valid_classes:
            raise DataValidationError(f"Flight class must be one of {valid_classes}")
    
    # Validate departure/arrival locations
    for field in ['from', 'to']:
        if field in prefs and prefs[field]:
            if not isinstance(prefs[field], dict) or 'description' not in prefs[field]:
                raise DataValidationError(f"Invalid format for {field} location")
    
    return validated