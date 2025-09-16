import React from 'react'

function PlacesToVisit({trip}) {
  return (
    <div>
      <h2 className='font-bold tex-lg'>Places to Visit</h2>

      <div>
        {trip.tripData?.itinerary.map((item,index)=>(

            <div>
                

            </div>

        ))}
      </div>
    </div>
  )
}

export default PlacesToVisit
