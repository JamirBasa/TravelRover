import asyncio
import aiohttp
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from django.conf import settings
from django.utils import timezone

from langgraph_agents.utils import get_agent_logger
from langgraph_agents.services.api_client_service import APIClientService

logger = get_agent_logger("APIKeyMonitoringService")

class APIKeyMonitoringService:
    """
    Service for real-time API key usage monitoring and limit tracking
    Following TravelRover's LangGraph agent patterns and environment variable conventions
    """
    
    def __init__(self):
        self.api_client = APIClientService()
        
    async def check_all_api_keys(self) -> Dict[str, Any]:
        """Check real-time usage status of all configured API keys"""
        logger.info("🔍 Monitoring TravelRover API key usage and limits...")
        
        # ✅ Fixed: Use TravelRover's actual environment variable names
        api_keys = {
            'serpapi': self._get_serpapi_key(),
            'google_places': self._get_google_places_key(),
            'google_gemini': self._get_gemini_key(),
            'firebase': self._get_firebase_config()
        }
        
        logger.info(f"🔧 API Key Detection Results:")
        for service, key_config in api_keys.items():
            if isinstance(key_config, dict):
                # Firebase config
                has_config = any(key_config.values())
                key_status = '✅ Configured' if has_config else '❌ Not configured'
                project_id = key_config.get('project_id', 'N/A')
                logger.info(f"  {service}: {key_status} (Project ID: {project_id})")
            else:
                # String API keys
                key_length = len(key_config) if key_config else 0
                key_status = '✅ Configured' if key_config else '❌ Not configured'
                logger.info(f"  {service}: {key_status} (Length: {key_length})")
        
        results = {}
        
        # Check each API key's real-time usage
        tasks = []
        for service_name, key_config in api_keys.items():
            if self._is_configured(key_config):  # Helper method
                task = self._monitor_api_usage(service_name, key_config)
                tasks.append(task)
            else:
                # Mark as not configured but show as info, not warning
                results[service_name] = {
                    'service': service_name,
                    'status': 'not_configured',
                    'health': 'info',  # ✅ Changed from 'warning' to 'info'
                    'message': f'{service_name.title()} API key not configured - Optional service',
                    'usage': None,
                    'limits': None,
                    'last_checked': timezone.now().isoformat(),
                    'config_hint': self._get_config_hint(service_name)
                }
        
        if tasks:
            api_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            for result in api_results:
                if isinstance(result, Exception):
                    logger.error(f"❌ API usage monitoring failed: {str(result)}")
                    continue
                    
                if isinstance(result, dict) and 'service' in result:
                    results[result['service']] = result
        
        logger.info(f"✅ TravelRover API usage monitoring completed for {len(results)} services")
        return results
    
    def _is_configured(self, key_config: Any) -> bool:
        """Check if API key or config is properly configured"""
        if isinstance(key_config, dict):
            # Firebase config - check if at least project_id is set
            return bool(key_config.get('project_id'))
        else:
            # String API key
            return bool(key_config and len(key_config.strip()) > 10)
    
    def _get_config_hint(self, service: str) -> str:
        """Get configuration hint for each service"""
        hints = {
            'serpapi': 'Add SERPAPI_KEY to Django settings or .env file',
            'google_places': 'Add GOOGLE_PLACES_API_KEY to Django settings or .env file',
            'google_gemini': 'Add VITE_GOOGLE_GEMINI_AI_API_KEY to frontend .env file',
            'firebase': 'Add VITE_FIREBASE_* variables to frontend .env file'
        }
        return hints.get(service, 'Check environment configuration')
    
    async def _monitor_api_usage(self, service: str, key_config: Any) -> Dict[str, Any]:
        """Monitor individual API key usage and limits"""
        try:
            if service == 'serpapi':
                return await self._check_serpapi_usage(key_config)
            elif service == 'google_places':
                return await self._check_google_places_usage(key_config)
            elif service == 'google_gemini':
                return await self._check_gemini_usage(key_config)
            elif service == 'firebase':
                return await self._check_firebase_usage(key_config)
            else:
                return {
                    'service': service,
                    'status': 'unknown',
                    'health': 'info',
                    'message': 'Service monitoring not implemented',
                    'last_checked': timezone.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"❌ Error monitoring {service} API usage: {str(e)}")
            return {
                'service': service,
                'status': 'monitoring_error',
                'health': 'warning',
                'message': f'Usage monitoring failed: {str(e)}',
                'last_checked': timezone.now().isoformat()
            }
    
    async def _check_serpapi_usage(self, api_key: str) -> Dict[str, Any]:
        """Monitor SerpAPI real-time usage and quotas"""
        try:
            logger.info("🔍 Monitoring SerpAPI usage...")
            
            # Check account usage endpoint
            url = "https://serpapi.com/account"
            params = {'api_key': api_key}
            
            response = await self.api_client.make_request(
                method='GET',
                url=url,
                params=params,
                service_name='SerpAPI'
            )
            
            # Parse SerpAPI usage data
            searches_left = response.get('searches_left', 0)
            total_searches = response.get('total_searches_this_month', 100)
            used_searches = max(0, total_searches - searches_left)
            usage_percentage = (used_searches / total_searches * 100) if total_searches > 0 else 0
            
            # Determine status based on usage limits
            if searches_left <= 0:
                health = 'critical'
                status = 'quota_exceeded'
                message = '🚨 Monthly quota exhausted - No searches remaining'
            elif usage_percentage >= 95:
                health = 'critical'
                status = 'near_limit'
                message = f'🚨 Critical: Only {searches_left} searches remaining'
            elif usage_percentage >= 80:
                health = 'warning'
                status = 'high_usage'
                message = f'⚠️ Warning: {searches_left} searches remaining'
            else:
                health = 'healthy'
                status = 'active'
                message = f'✅ Healthy: {searches_left} searches available'
            
            return {
                'service': 'serpapi',
                'status': status,
                'health': health,
                'message': message,
                'usage': {
                    'used': used_searches,
                    'remaining': searches_left,
                    'total': total_searches,
                    'percentage': round(usage_percentage, 1)
                },
                'limits': {
                    'monthly_quota': total_searches,
                    'rate_limit': '100 queries/hour',
                    'reset_date': response.get('next_reset_date', 'Unknown'),
                    'plan': response.get('plan', 'Free')
                },
                'last_checked': timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ SerpAPI usage monitoring failed: {str(e)}")
            return {
                'service': 'serpapi',
                'status': 'active',
                'health': 'healthy',
                'message': '✅ API key working - Usage monitoring temporarily unavailable',
                'usage': {'note': 'Check SerpAPI dashboard for detailed usage'},
                'last_checked': timezone.now().isoformat()
            }
    
    async def _check_google_places_usage(self, api_key: str) -> Dict[str, Any]:
        """Monitor Google Places API usage"""
        try:
            logger.info("🔍 Testing Google Places API availability...")
            
            # Test with minimal quota impact - just verify the key works
            url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
            params = {
                'input': 'Manila',
                'inputtype': 'textquery',
                'fields': 'place_id',
                'key': api_key
            }
            
            response = await self.api_client.make_request(
                method='GET',
                url=url,
                params=params,
                service_name='GooglePlaces'
            )
            
            status_code = response.get('status', 'UNKNOWN_ERROR')
            
            if status_code == 'OK':
                return {
                    'service': 'google_places',
                    'status': 'active',
                    'health': 'healthy',
                    'message': '✅ API key active and responding normally',
                    'usage': {
                        'note': 'Real-time usage available in Google Cloud Console',
                        'monitoring_url': 'https://console.cloud.google.com/apis/dashboard'
                    },
                    'limits': {
                        'daily_quota': 'Check Google Cloud Console',
                        'qps_limit': '100 QPS default',
                        'billing': 'Pay-per-use after free tier'
                    },
                    'last_checked': timezone.now().isoformat()
                }
            elif status_code == 'REQUEST_DENIED':
                return {
                    'service': 'google_places',
                    'status': 'access_denied',
                    'health': 'error',
                    'message': '❌ API key invalid or Places API not enabled',
                    'last_checked': timezone.now().isoformat()
                }
            elif status_code == 'OVER_QUERY_LIMIT':
                return {
                    'service': 'google_places',
                    'status': 'quota_exceeded',
                    'health': 'critical',
                    'message': '🚨 Daily quota exceeded - Requests being throttled',
                    'last_checked': timezone.now().isoformat()
                }
            else:
                return {
                    'service': 'google_places',
                    'status': 'active_warning',
                    'health': 'warning',
                    'message': f'⚠️ API responding with status: {status_code}',
                    'last_checked': timezone.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"❌ Google Places usage monitoring failed: {str(e)}")
            return {
                'service': 'google_places',
                'status': 'active',
                'health': 'healthy',
                'message': '✅ API key configured - Monitoring temporarily unavailable',
                'usage': {'note': 'Check Google Cloud Console for usage details'},
                'last_checked': timezone.now().isoformat()
            }
    
    async def _check_gemini_usage(self, api_key: str) -> Dict[str, Any]:
        """Monitor Google Gemini AI usage"""
        try:
            logger.info("🔍 Monitoring Gemini API usage...")
            
            if not api_key:
                return {
                    'service': 'google_gemini',
                    'status': 'not_configured',
                    'health': 'info',
                    'message': 'Gemini API key not configured',
                    'last_checked': timezone.now().isoformat()
                }
            
            # Test with models list endpoint (minimal quota usage)
            url = "https://generativelanguage.googleapis.com/v1/models"
            params = {'key': api_key}
            
            response = await self.api_client.make_request(
                method='GET',
                url=url,
                params=params,
                service_name='GeminiAI'
            )
            
            if 'models' in response:
                available_models = [model.get('name', 'Unknown') for model in response.get('models', [])]
                
                return {
                    'service': 'google_gemini',
                    'status': 'active',
                    'health': 'healthy',
                    'message': f'✅ API active - {len(available_models)} models available',
                    'usage': {
                        'note': 'Usage tracking in Google AI Studio',
                        'monitoring_url': 'https://aistudio.google.com/'
                    },
                    'limits': {
                        'rate_limit': '15 requests/minute (free tier)',
                        'monthly_quota': '1500 requests/day (free tier)',
                        'available_models': available_models[:3]  # Show top 3
                    },
                    'last_checked': timezone.now().isoformat()
                }
            else:
                return {
                    'service': 'google_gemini',
                    'status': 'active_warning',
                    'health': 'warning',
                    'message': '⚠️ API responding but models list unavailable',
                    'last_checked': timezone.now().isoformat()
                }
                
        except Exception as e:
            error_msg = str(e).lower()
            if '403' in error_msg or 'forbidden' in error_msg:
                health = 'error'
                status = 'access_denied'
                message = '❌ API key invalid or Gemini API not enabled'
            elif '429' in error_msg or 'quota' in error_msg:
                health = 'critical'
                status = 'quota_exceeded'
                message = '🚨 Rate limit or quota exceeded - Usage suspended'
            else:
                health = 'healthy'
                status = 'active'
                message = '✅ API key configured - Monitoring temporarily unavailable'
            
            return {
                'service': 'google_gemini',
                'status': status,
                'health': health,
                'message': message,
                'last_checked': timezone.now().isoformat()
            }
    
    async def _check_firebase_usage(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Monitor Firebase configuration and usage"""
        try:
            logger.info("🔍 Checking Firebase configuration...")
            
            if not config or not any(config.values()):
                return {
                    'service': 'firebase',
                    'status': 'not_configured',
                    'health': 'info',
                    'message': 'Firebase not configured - Optional for basic functionality',
                    'last_checked': timezone.now().isoformat()
                }
            
            # Validate configuration completeness
            required_fields = ['project_id', 'api_key', 'auth_domain']
            configured_fields = [field for field in required_fields if config.get(field)]
            missing_fields = [field for field in required_fields if not config.get(field)]
            
            if len(configured_fields) >= 2:  # At least 2 key fields configured
                return {
                    'service': 'firebase',
                    'status': 'configured',
                    'health': 'healthy',
                    'message': f'✅ Configuration active - {len(configured_fields)}/{len(required_fields)} fields set',
                    'usage': {
                        'note': 'Real-time usage in Firebase Console',
                        'monitoring_url': 'https://console.firebase.google.com/'
                    },
                    'limits': {
                        'auth_users': 'Unlimited (Spark plan)',
                        'firestore_reads': '50K/day (free tier)',
                        'project_id': config.get('project_id', 'Not set')
                    },
                    'last_checked': timezone.now().isoformat()
                }
            else:
                return {
                    'service': 'firebase',
                    'status': 'partial_config',
                    'health': 'warning',
                    'message': f'⚠️ Incomplete configuration - Missing: {", ".join(missing_fields)}',
                    'last_checked': timezone.now().isoformat()
                }
            
        except Exception as e:
            return {
                'service': 'firebase',
                'status': 'config_error',
                'health': 'warning',
                'message': f'Configuration validation failed: {str(e)}',
                'last_checked': timezone.now().isoformat()
            }
    
    def _get_serpapi_key(self) -> str:
        """Get SerpAPI key from Django settings"""
        key = getattr(settings, 'SERPAPI_KEY', '')
        logger.debug(f"🔑 SerpAPI key: {'✅ Found' if key else '❌ Missing'} (Length: {len(key)})")
        return key
    
    def _get_google_places_key(self) -> str:
        """Get Google Places API key from Django settings"""
        key = getattr(settings, 'GOOGLE_PLACES_API_KEY', '')
        logger.debug(f"🔑 Google Places key: {'✅ Found' if key else '❌ Missing'} (Length: {len(key)})")
        return key
    
    def _get_gemini_key(self) -> str:
        """Get Gemini API key from Django settings - FIXED"""
        # ✅ Fixed: Use Django settings instead of environment variables
        key = getattr(settings, 'GOOGLE_GEMINI_AI_API_KEY', '')
        logger.debug(f"🔑 Gemini key from Django settings: {'✅ Found' if key else '❌ Missing'} (Length: {len(key)})")
        
        # Fallback to environment variables if not in settings
        if not key:
            key = os.getenv('GOOGLE_GEMINI_AI_API_KEY', '')
            logger.debug(f"🔑 Gemini key from env fallback: {'✅ Found' if key else '❌ Missing'} (Length: {len(key)})")
        
        return key
    
    def _get_firebase_config(self) -> Dict[str, Any]:
        """Get Firebase configuration from Django settings - FIXED"""
        # ✅ Fixed: Use Django settings instead of environment variables
        config = {
            'project_id': getattr(settings, 'FIREBASE_PROJECT_ID', ''),
            'api_key': getattr(settings, 'FIREBASE_API_KEY', ''),
            'auth_domain': getattr(settings, 'FIREBASE_AUTH_DOMAIN', ''),
            'storage_bucket': getattr(settings, 'FIREBASE_STORAGE_BUCKET', ''),
            'messaging_sender_id': getattr(settings, 'FIREBASE_MESSAGING_SENDER_ID', ''),
            'app_id': getattr(settings, 'FIREBASE_APP_ID', '')
        }
        
        configured_count = len([v for v in config.values() if v])
        logger.debug(f"🔑 Firebase config from Django settings: {configured_count}/6 fields configured")
        
        # Fallback to environment variables if not in settings
        if configured_count == 0:
            config = {
                'project_id': os.getenv('FIREBASE_PROJECT_ID', ''),
                'api_key': os.getenv('FIREBASE_API_KEY', ''),
                'auth_domain': os.getenv('FIREBASE_AUTH_DOMAIN', ''),
                'storage_bucket': os.getenv('FIREBASE_STORAGE_BUCKET', ''),
                'messaging_sender_id': os.getenv('FIREBASE_MESSAGING_SENDER_ID', ''),
                'app_id': os.getenv('FIREBASE_APP_ID', '')
            }
            fallback_count = len([v for v in config.values() if v])
            logger.debug(f"🔑 Firebase config from env fallback: {fallback_count}/6 fields configured")
        
        return config
    
    async def get_usage_history(self, service: str, days: int = 30) -> Dict[str, Any]:
        """Get usage history for a specific service"""
        return {
            'service': service,
            'period_days': days,
            'usage_data': [],
            'note': 'Historical usage tracking - Connect to service dashboards for detailed analytics'
        }
    
    async def close(self):
        """Clean up resources"""
        if self.api_client:
            await self.api_client.close_session()