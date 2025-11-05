"""
Philippine Time (PHT) utilities for Django backend
Ensures all datetime operations use Asia/Manila timezone (UTC+8)
"""
from datetime import datetime, date, timedelta
from zoneinfo import ZoneInfo
from typing import Optional, Union

# Philippine Time Zone
PHT_TIMEZONE = ZoneInfo('Asia/Manila')


def get_pht_now() -> datetime:
    """
    Get current time in Philippine Time (PHT)
    
    Returns:
        datetime: Current time in PHT timezone
    """
    return datetime.now(PHT_TIMEZONE)


def to_pht(dt: Union[datetime, date, str]) -> datetime:
    """
    Convert datetime to Philippine Time
    
    Args:
        dt: Datetime object, date object, or ISO format string
        
    Returns:
        datetime: Datetime converted to PHT timezone
    """
    if isinstance(dt, str):
        # Parse ISO format string
        try:
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        except ValueError:
            # Try parsing date-only string
            try:
                dt = datetime.strptime(dt, '%Y-%m-%d')
            except ValueError:
                raise ValueError(f"Invalid date format: {dt}")
    
    if isinstance(dt, date) and not isinstance(dt, datetime):
        # Convert date to datetime at midnight
        dt = datetime.combine(dt, datetime.min.time())
    
    # If naive (no timezone), assume UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=ZoneInfo('UTC'))
    
    # Convert to PHT
    return dt.astimezone(PHT_TIMEZONE)


def parse_date_pht(date_str: str) -> Optional[date]:
    """
    Parse date string as PHT date
    
    Args:
        date_str: Date string in YYYY-MM-DD format
        
    Returns:
        date: Date object or None if invalid
    """
    if not date_str:
        return None
        
    try:
        dt = datetime.strptime(date_str, '%Y-%m-%d')
        # Convert to PHT and return date part
        pht_dt = dt.replace(tzinfo=PHT_TIMEZONE)
        return pht_dt.date()
    except (ValueError, TypeError):
        return None


def format_pht_date(dt: Union[datetime, date, str]) -> str:
    """
    Format datetime as YYYY-MM-DD in PHT
    
    Args:
        dt: Datetime, date, or string to format
        
    Returns:
        str: Formatted date string
    """
    if isinstance(dt, str):
        # Already a string, validate and return
        parsed = parse_date_pht(dt)
        return dt if parsed else ""
    
    if isinstance(dt, date) and not isinstance(dt, datetime):
        return dt.strftime('%Y-%m-%d')
    
    if isinstance(dt, datetime):
        pht_dt = to_pht(dt)
        return pht_dt.strftime('%Y-%m-%d')
    
    return ""


def calculate_pht_days(start_date: Union[str, date], end_date: Union[str, date]) -> int:
    """
    Calculate number of days between two dates in PHT (inclusive)
    
    Args:
        start_date: Start date (string or date object)
        end_date: End date (string or date object)
        
    Returns:
        int: Number of days (inclusive), 0 if invalid
    """
    start = parse_date_pht(start_date) if isinstance(start_date, str) else start_date
    end = parse_date_pht(end_date) if isinstance(end_date, str) else end_date
    
    if not start or not end:
        return 0
    
    diff = (end - start).days
    return diff + 1 if diff >= 0 else 0


def is_past_date_pht(date_to_check: Union[str, date, datetime]) -> bool:
    """
    Check if date is in the past (PHT)
    
    Args:
        date_to_check: Date to check
        
    Returns:
        bool: True if date is before today (PHT)
    """
    check_date = parse_date_pht(date_to_check) if isinstance(date_to_check, str) else date_to_check
    
    if not check_date:
        return False
    
    if isinstance(check_date, datetime):
        check_date = check_date.date()
    
    today = get_pht_now().date()
    return check_date < today


def add_days_pht(base_date: Union[str, date], days: int) -> date:
    """
    Add days to a date in PHT
    
    Args:
        base_date: Base date
        days: Number of days to add
        
    Returns:
        date: New date
    """
    parsed = parse_date_pht(base_date) if isinstance(base_date, str) else base_date
    
    if not parsed:
        return None
    
    if isinstance(parsed, datetime):
        parsed = parsed.date()
    
    return parsed + timedelta(days=days)


def get_pht_info() -> dict:
    """
    Get PHT timezone information
    
    Returns:
        dict: Timezone information
    """
    return {
        'timezone': 'Asia/Manila',
        'offset': '+08:00',
        'name': 'Philippine Time',
        'abbreviation': 'PHT'
    }


# Convenience function for common use case
def validate_date_range_pht(start_date: str, end_date: str) -> dict:
    """
    Validate date range in PHT
    
    Args:
        start_date: Start date string (YYYY-MM-DD)
        end_date: End date string (YYYY-MM-DD)
        
    Returns:
        dict: Validation result with errors if any
    """
    result = {
        'valid': True,
        'errors': [],
        'duration': 0
    }
    
    start = parse_date_pht(start_date)
    end = parse_date_pht(end_date)
    
    if not start:
        result['valid'] = False
        result['errors'].append('Invalid start date format')
        return result
    
    if not end:
        result['valid'] = False
        result['errors'].append('Invalid end date format')
        return result
    
    if is_past_date_pht(start):
        result['valid'] = False
        result['errors'].append('Start date cannot be in the past')
    
    if end < start:
        result['valid'] = False
        result['errors'].append('End date must be after start date')
    
    if result['valid']:
        result['duration'] = calculate_pht_days(start_date, end_date)
    
    return result
