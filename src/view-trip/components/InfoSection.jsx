import React from 'react'

function InfoSection({trip}) {
  return (
    <div>
        <img src='https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80' alt='Trip' className='w-full h-[300px] object-cover rounded-lg mb-4' />
        
        <div className='my-5 flex flex-col gap-2'>
            <h2 className='font-bold text-2xl '>{trip?.userSelection?.location}</h2>
            <div>
                <h2 className='p-1 px-3 bg-gray-200 rounded-full text-gray-500'> {trip?.userSelection?.duration} days</h2>
            </div>
        </div>
    
    </div>
  )
}

export default InfoSection
