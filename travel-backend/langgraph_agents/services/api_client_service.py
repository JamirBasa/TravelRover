"""
API client service for external integrations
"""

import aiohttp
import asyncio
from typing import Dict, Any, Optional
from urllib.parse import urlencode

from ..utils import get_agent_logger
from ..exceptions import ServiceUnavailableError, RateLimitError, APIKeyMissingError


class APIClientService:
    """
    Service for making API calls to external services
    """
    
    def __init__(self):
        self.logger = get_agent_logger("APIClientService")
        self.session = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session"""
        if self.session is None or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=30)
            self.session = aiohttp.ClientSession(timeout=timeout)
        return self.session
    
    async def close_session(self):
        """Close the aiohttp session"""
        if self.session and not self.session.closed:
            await self.session.close()
    
    async def make_request(
        self, 
        method: str, 
        url: str, 
        headers: Dict[str, str] = None,
        params: Dict[str, Any] = None,
        data: Dict[str, Any] = None,
        service_name: str = "external_api"
    ) -> Dict[str, Any]:
        """
        Make HTTP request with error handling
        
        Args:
            method: HTTP method (GET, POST, etc.)
            url: Request URL
            headers: Request headers
            params: URL parameters
            data: Request body data
            service_name: Name of the service for logging
            
        Returns:
            Response data
            
        Raises:
            ServiceUnavailableError: If service is unavailable
            RateLimitError: If rate limit is exceeded
        """
        session = await self._get_session()
        
        try:
            self.logger.debug(f"🔗 API call to {service_name}: {method} {url}")
            
            async with session.request(
                method=method,
                url=url,
                headers=headers or {},
                params=params,
                json=data
            ) as response:
                
                # Handle rate limiting
                if response.status == 429:
                    retry_after = int(response.headers.get('Retry-After', 60))
                    raise RateLimitError(service_name, retry_after)
                
                # Handle service unavailable
                if response.status >= 500:
                    raise ServiceUnavailableError(service_name, status_code=response.status)
                
                # Handle client errors
                if response.status >= 400:
                    error_text = await response.text()
                    self.logger.warning(f"❌ API call failed: {response.status} - {error_text}")
                    raise ServiceUnavailableError(
                        service_name, 
                        status_code=response.status
                    )
                
                # Success - parse response
                if response.content_type == 'application/json':
                    result = await response.json()
                else:
                    result = {'data': await response.text()}
                
                self.logger.debug(f"✅ API call to {service_name} successful")
                return result
                
        except aiohttp.ClientError as e:
            self.logger.error(f"❌ Network error calling {service_name}: {str(e)}")
            raise ServiceUnavailableError(service_name)
        
        except asyncio.TimeoutError:
            self.logger.error(f"❌ Timeout calling {service_name}")
            raise ServiceUnavailableError(service_name)
    
    async def google_places_request(
        self, 
        endpoint: str, 
        api_key: str, 
        params: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Make request to Google Places API
        
        Args:
            endpoint: API endpoint (e.g., 'textsearch', 'details')
            api_key: Google Places API key
            params: Request parameters
            
        Returns:
            API response data
            
        Raises:
            APIKeyMissingError: If API key is missing
            ServiceUnavailableError: If service call fails
        """
        if not api_key:
            raise APIKeyMissingError("Google Places API", "HotelAgent")
        
        base_url = "https://maps.googleapis.com/maps/api/place"
        url = f"{base_url}/{endpoint}/json"
        
        request_params = {
            'key': api_key,
            **(params or {})
        }
        
        return await self.make_request(
            method='GET',
            url=url,
            params=request_params,
            service_name='Google Places API'
        )
    
    async def serpapi_request(
        self, 
        api_key: str, 
        params: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Make request to SerpAPI
        
        Args:
            api_key: SerpAPI key
            params: Request parameters
            
        Returns:
            API response data
            
        Raises:
            APIKeyMissingError: If API key is missing
            ServiceUnavailableError: If service call fails
        """
        if not api_key:
            raise APIKeyMissingError("SerpAPI", "FlightAgent")
        
        url = "https://serpapi.com/search"
        
        request_params = {
            'api_key': api_key,
            'engine': 'google_flights',
            **(params or {})
        }
        
        return await self.make_request(
            method='GET',
            url=url,
            params=request_params,
            service_name='SerpAPI'
        )
    
    async def batch_requests(
        self, 
        requests: list[Dict[str, Any]], 
        max_concurrent: int = 5
    ) -> list[Dict[str, Any]]:
        """
        Make multiple API requests concurrently with rate limiting
        
        Args:
            requests: List of request configurations
            max_concurrent: Maximum concurrent requests
            
        Returns:
            List of response data
        """
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def bounded_request(request_config):
            async with semaphore:
                try:
                    return await self.make_request(**request_config)
                except Exception as e:
                    self.logger.error(f"❌ Batch request failed: {str(e)}")
                    return {'error': str(e), 'success': False}
        
        tasks = [bounded_request(req) for req in requests]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results and handle exceptions
        processed_results = []
        for result in results:
            if isinstance(result, Exception):
                processed_results.append({
                    'error': str(result),
                    'success': False
                })
            else:
                processed_results.append(result)
        
        return processed_results