"""
Admin Authentication Middleware for TravelRover
Provides secure access control for admin endpoints
"""

from rest_framework.permissions import BasePermission
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class IsAdminUser(BasePermission):
    """
    Custom permission to only allow admin users to access admin endpoints.
    
    For production, implement:
    - Firebase Admin SDK authentication
    - JWT token validation
    - Role-based access control (RBAC)
    """
    
    def has_permission(self, request, view):
        """
        Check if user has admin privileges
        
        Current Implementation (Development):
        - Allows authenticated Django staff/superusers
        - For production: Add Firebase Admin token validation
        
        Returns:
            bool: True if user is authorized, False otherwise
        """
        
        # Development mode: Check Django admin status
        if hasattr(request, 'user') and request.user.is_authenticated:
            if request.user.is_staff or request.user.is_superuser:
                logger.info(f"✅ Admin access granted to {request.user.email}")
                return True
        
        # Production TODO: Add Firebase Admin SDK validation
        # from firebase_admin import auth
        # try:
        #     token = request.headers.get('Authorization', '').replace('Bearer ', '')
        #     decoded_token = auth.verify_id_token(token)
        #     uid = decoded_token['uid']
        #     
        #     # Check if user has admin role in Firebase custom claims
        #     if decoded_token.get('admin') == True:
        #         return True
        # except Exception as e:
        #     logger.error(f"Firebase auth failed: {str(e)}")
        #     return False
        
        logger.warning(f"❌ Unauthorized admin access attempt from {request.META.get('REMOTE_ADDR')}")
        return False


class IsAdminOrReadOnly(BasePermission):
    """
    Allow read-only access to authenticated users, 
    but write access only to admins
    """
    
    def has_permission(self, request, view):
        # Read permissions for any authenticated user
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user and request.user.is_authenticated
        
        # Write permissions only for admin users
        return IsAdminUser().has_permission(request, view)


class SecureAPIKeyAccess(BasePermission):
    """
    Secure access for API key monitoring endpoints
    Only accessible by verified admin users
    """
    
    def has_permission(self, request, view):
        # Stricter check for sensitive endpoints
        if not (hasattr(request, 'user') and request.user.is_authenticated):
            return False
        
        if not request.user.is_superuser:
            logger.warning(
                f"⚠️ Non-superuser {request.user.email} attempted to access API key monitoring"
            )
            return False
        
        return True
