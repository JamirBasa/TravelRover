import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import { GetPlaceDetails, PHOTO_REF_URL } from '@/config/GlobalApi';

function HotelCardItem({ hotel }) {

const [photoUrl, setPhotoUrl] = useState('');
useEffect(()=>{
    hotel&&GetPlacePhoto();
},[hotel])

const GetPlacePhoto=async()=>{

    const data={
        textQuery: hotel?.name
    }
    
    const result=await GetPlaceDetails(data).then(resp=>{
        console.log(resp.data.places[0].photos[3].name);
        const PhotoUrl=PHOTO_REF_URL.replace('{NAME}', resp.data.places[0].photos[0].name);
        setPhotoUrl(PhotoUrl);
    })
}   
  return (
    <div>
    <Link to={'https://www.google.com/maps/search/?api=1&query=' + hotel?.name} target="_blank">
        <div className="border rounded-lg shadow p-3 hover:scale-105 transition-all cursor-pointer">
            <img
              src={photoUrl || '../placeholder.png'}
              alt={hotel?.name}
              className="w-full h-40 object-cover rounded"
            />
            <h3 className="font-semibold mt-2">{hotel?.name}</h3>
            <p className="text-sm text-gray-600">{hotel?.address}</p>
            <p className="text-sm text-gray-800">{hotel?.pricePerNight || hotel?.priceRange}</p>
            <p className="text-yellow-500 text-sm">⭐ {hotel?.rating}</p>
        </div>
    </Link>
    </div>
  )
}

export default HotelCardItem
