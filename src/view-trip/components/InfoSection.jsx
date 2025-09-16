import React, { useEffect } from 'react'
import { Share2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { GetPlaceDetails } from '@/config/GlobalApi';

function InfoSection({trip}) {

  useEffect(()=>{
    trip&&GetPlacePhoto();
  },[trip])

  const data={
    textQuery: trip?.userSelection?.location
  }

  const GetPlacePhoto=async()=>{
    const result=await GetPlaceDetails(data).then(resp=>{
      console.log(resp.data);
    })
  }

  return (
    <div>
        <img src='../placeholder.png' alt='Trip' className='w-full h-[300px] object-cover rounded-lg mb-4' />
        
      <div className='flex justify-between items-center'>
        <div className='my-5 flex flex-col gap-2'>
            <h2 className='font-bold text-2xl '>{trip?.userSelection?.location}</h2>
            <div className='flex items-center gap-2'>
                <span className='p-1 px-3 bg-gray-200 rounded-full text-gray-500 text-xs md:text-md'>📅 {trip?.userSelection?.duration} days</span>
                <span className='p-1 px-3 bg-gray-200 rounded-full text-gray-500 text-xs md:text-md'>🧑 No of Travelers: {trip?.userSelection?.travelers}</span>
                <span className='p-1 px-3 bg-gray-200 rounded-full text-gray-500 text-xs md:text-md'>💲 {trip?.userSelection?.budget}</span>
            </div>
        </div>  
        <Button><Share2 /></Button> 
     </div>
    </div>
  )
}

export default InfoSection
