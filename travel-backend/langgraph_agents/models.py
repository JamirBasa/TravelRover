# langgraph_agents/models.py
from django.db import models
import uuid

class TravelPlanningSession(models.Model):
    """Track LangGraph execution sessions"""
    session_id = models.UUIDField(default=uuid.uuid4, unique=True)
    user_email = models.EmailField()
    destination = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    travelers = models.CharField(max_length=50)
    budget = models.CharField(max_length=50)
    
    # Agent execution tracking
    flight_search_requested = models.BooleanField(default=False)
    hotel_search_requested = models.BooleanField(default=False)
    flight_search_completed = models.BooleanField(default=False)
    hotel_search_completed = models.BooleanField(default=False)
    
    # Results
    optimization_score = models.IntegerField(default=0)
    total_estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    cost_efficiency = models.CharField(max_length=20, default='unknown')
    
    # Status
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ], default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']

class AgentExecutionLog(models.Model):
    """Log individual agent executions"""
    session = models.ForeignKey(TravelPlanningSession, on_delete=models.CASCADE, related_name='agent_logs')
    agent_type = models.CharField(max_length=20, choices=[
        ('coordinator', 'Coordinator'),
        ('flight', 'Flight Agent'),
        ('hotel', 'Hotel Agent'),
        ('optimizer', 'Optimizer')
    ])
    
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('running', 'Running'), 
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ], default='pending')
    
    input_data = models.JSONField()
    output_data = models.JSONField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    execution_time_ms = models.IntegerField(null=True, blank=True)
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['started_at']