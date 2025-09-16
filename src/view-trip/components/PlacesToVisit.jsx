import React from 'react'
import PlaceCardItem from './PlaceCardItem'

function PlacesToVisit({trip}) {
  return (
    <div>
      <h2 className="font-bold text-xl mt-5">Places to Visit</h2>

      <div>
        {trip.tripData?.tripData?.itinerary?.map((item, index)=>(
            <div key={index}>
                <h2 className='font-medium text-lg'>{item.date}</h2>
                <div className='grid md:grid-cols-2 gap-5'>
                  {item.activities.map((activity, activityIndex) => (
                      <div key={activityIndex}>
                          <h2 className='font-md text-sm text-orange-600'>{activity?.time}</h2>
                          <PlaceCardItem place={activity} />
                      </div>
                  ))}
                </div>
            </div>
        ))}
      </div>
    </div>
  )
}

export default PlacesToVisit
