import React from 'react'

function PlaceCardItem({ place }) {
  return (
    <div className='border rounded-xl p-3 mt-2 flex gap-5'>
      <img src='/placeholder.png'
      className='w-[130px] h-[130px] rounded-xl'
      />
      <div>
        <h2 className='font-bold text-lg'>{place?.activity}</h2>
        <p className='text-sm text-gray-600'>{place?.description}</p>
      </div>
    </div>
  )
}

export default PlaceCardItem
