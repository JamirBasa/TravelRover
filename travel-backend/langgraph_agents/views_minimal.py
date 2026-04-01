"""Minimal health check view for debugging"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class MinimalHealthCheckView(APIView):
    """Ultra-simple health check - no async, no imports, no database"""
    
    def get(self, request):
        """Return basic health status"""
        return Response({
            'status': 'ok',
            'message': 'Backend is responding'
        }, status=status.HTTP_200_OK)
