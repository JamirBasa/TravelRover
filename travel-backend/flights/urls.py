# flights/urls.py
from django.urls import path
from .views import FlightSearchView, AirportSearchView

urlpatterns = [
    path('search-flights/', FlightSearchView.as_view(), name='search-flights'),
    path('airports/', AirportSearchView.as_view(), name='airports'),
]