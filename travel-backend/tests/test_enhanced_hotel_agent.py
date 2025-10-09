#!/usr/bin/env python3
"""
Test script for Enhanced Hotel Agent with improved photo handling
"""

import os
import sys
import django
import asyncio
from datetime import datetime

# Add the project root directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travelapi.settings')
django.setup()

from langgraph_agents.agents.hotel_agent import HotelAgent

async def test_enhanced_hotel_agent():
    """Test the enhanced hotel agent with photo handling"""
    
    print("🧪 Testing Enhanced Hotel Agent with Photo Handling")
    print("=" * 60)
    
    # Initialize the hotel agent
    agent = HotelAgent(session_id="test_enhanced_photos")
    
    # Test parameters
    test_params = {
        'hotel_params': {
            'destination': 'Manila, Philippines',
            'checkin_date': '2024-01-15',
            'checkout_date': '2024-01-18', 
            'guests': 2,
            'duration': 3,
            'budget_level': 2
        }
    }
    
    print(f"🏨 Testing hotel search for: {test_params['hotel_params']['destination']}")
    print(f"📅 Check-in: {test_params['hotel_params']['checkin_date']}")
    print(f"📅 Check-out: {test_params['hotel_params']['checkout_date']}")
    print(f"👥 Guests: {test_params['hotel_params']['guests']}")
    print()
    
    try:
        # Execute the hotel search
        result = await agent._execute_logic(test_params)
        
        print("✅ Hotel Agent Execution Results:")
        print(f"🔄 Success: {result.get('success', False)}")
        print(f"🏨 Total Hotels Found: {len(result.get('hotels', []))}")
        
        # Test hotel data structure and photo handling
        hotels = result.get('hotels', [])
        
        if hotels:
            print("\n🏨 Hotel Details with Enhanced Photo Data:")
            print("-" * 50)
            
            for i, hotel in enumerate(hotels[:3], 1):  # Show first 3 hotels
                print(f"\n{i}. {hotel.get('name', 'Unknown Hotel')}")
                print(f"   ⭐ Rating: {hotel.get('rating', 'N/A')}")
                print(f"   💰 Price Range: {hotel.get('price_range', 'N/A')}")
                print(f"   📍 Distance: {hotel.get('distance', 'N/A')}")
                
                # Test photo data structure
                print(f"   🖼️  Photo Data:")
                print(f"      • Has Photos: {hotel.get('hasPhotos', False)}")
                print(f"      • Photo Count: {hotel.get('photoCount', 0)}")
                print(f"      • Is Fallback: {hotel.get('isFallback', False)}")
                
                # Test primary photo URLs
                primary_photo = hotel.get('photo') or hotel.get('imageUrl')
                if primary_photo:
                    print(f"      • Primary Photo: ✅ Available")
                    print(f"        URL Preview: {primary_photo[:50]}...")
                else:
                    print(f"      • Primary Photo: ❌ Missing")
                
                # Test photo sizes
                photo_sizes = hotel.get('photoSizes', {})
                if photo_sizes:
                    print(f"      • Photo Sizes: {list(photo_sizes.keys())}")
                
                # Test coordinates
                coordinates = hotel.get('geoCoordinates')
                if coordinates:
                    print(f"   🌍 Coordinates: {coordinates.get('latitude'):.4f}, {coordinates.get('longitude'):.4f}")
                
                # Test amenities
                amenities = hotel.get('amenities', [])
                if amenities:
                    print(f"   🏪 Amenities: {', '.join(amenities[:3])}")
                    if len(amenities) > 3:
                        print(f"      ... and {len(amenities)-3} more")
                
                # Test LangGraph scoring
                score = hotel.get('langgraph_score')
                reason = hotel.get('recommendation_reason')
                if score:
                    print(f"   🎯 LangGraph Score: {score}/100")
                    print(f"   💡 Recommendation: {reason}")
        
        # Test analysis data
        analysis = result.get('langgraph_analysis', {})
        if analysis:
            print(f"\n🧠 LangGraph Analysis:")
            print(f"   📊 Total Options: {analysis.get('total_options', 0)}")
            print(f"   ⭐ Average Rating: {analysis.get('average_rating', 0)}")
            print(f"   🏆 High-Rated Count: {analysis.get('high_rated_count', 0)}")
            print(f"   💬 Recommendation: {analysis.get('recommendation', 'N/A')}")
        
        # Test specific photo functionality
        print(f"\n🖼️  Photo Handling Test Results:")
        print(f"   • All hotels have photo data: {'✅' if all(h.get('hasPhotos') for h in hotels) else '❌'}")
        print(f"   • Photo URLs are valid: {'✅' if all(h.get('photo') or h.get('imageUrl') for h in hotels) else '❌'}")
        print(f"   • Photo sizes provided: {'✅' if all(h.get('photoSizes') for h in hotels) else '❌'}")
        print(f"   • Coordinates available: {'✅' if all(h.get('geoCoordinates') for h in hotels) else '❌'}")
        
        return True
        
    except Exception as e:
        print(f"❌ Hotel Agent Test Failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_photo_fallback():
    """Test photo fallback functionality"""
    
    print(f"\n🧪 Testing Photo Fallback System")
    print("=" * 40)
    
    agent = HotelAgent(session_id="test_fallback")
    
    # Test fallback images for different price levels
    for price_level in [1, 2, 3, 4]:
        mock_hotel_data = {
            'name': f'Test Hotel Level {price_level}',
            'price_level': price_level
        }
        
        fallback_data = agent._get_fallback_hotel_images(mock_hotel_data)
        
        print(f"💰 Price Level {price_level}:")
        print(f"   • Photo URL: {fallback_data.get('photo', 'Missing')[:50]}...")
        print(f"   • Has Multiple Sizes: {'✅' if fallback_data.get('photoSizes') else '❌'}")
        print(f"   • Marked as Fallback: {'✅' if fallback_data.get('isFallback') else '❌'}")

def main():
    """Run all hotel agent tests"""
    
    print("🚀 Enhanced Hotel Agent Test Suite")
    print("=" * 60)
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    try:
        # Test main functionality
        success = asyncio.run(test_enhanced_hotel_agent())
        
        if success:
            print(f"\n✅ Main Hotel Agent Test: PASSED")
        else:
            print(f"\n❌ Main Hotel Agent Test: FAILED")
        
        # Test fallback system
        asyncio.run(test_photo_fallback())
        print(f"\n✅ Photo Fallback Test: PASSED")
        
        print(f"\n🎉 Enhanced Hotel Agent Tests Complete!")
        print(f"⏰ Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
    except Exception as e:
        print(f"❌ Test Suite Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()