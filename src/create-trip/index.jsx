import React, { useState } from 'react'
import GooglePlacesAutocomplete from 'react-google-places-autocomplete'
import { Input } from "@/components/ui/input"
import { SelectBudgetOptions } from '../constants/options';

function CreateTrip() {
  const [place,setPlace]=useState(null);
  return (
    <div className='sm:px-10 md:px-32 lg:px-56 xl:px-72 px-5 mt-10'>
      <h2 className='text-3xl font-bold'>Customize your adventure</h2>
      <p className='mt-3 text-gray-500 text-xl'>Tell us a little about yourself, and Travel Rover will craft a personalized itinerary designed around your preferences.</p>
    
      <div className='mt-20 flex flex-col gap-10'>
          <div>
            <h2 className='text-xl my-3 font-medium'>Where would you like to go?</h2>
            <GooglePlacesAutocomplete
              apiKey={import.meta.env.VITE_GOOGLE_PLACE_API_KEY}
              autocompletionRequest={{
                componentRestrictions: {
                  country: ['ph']
                }
              }}
              selectProps={{
                value: place,
                onChange: (v) => { setPlace(v); console.log(v); }
              }}

            />
          </div>


          <div>
            <h2 className='text-xl my-3 font-medium'>How many days will your trip last?</h2>
              <Input placeholder={''} type='number' />
          </div>
      </div>

      <div>
        <h2 className='text-xl my-3 font-medium'>Enter your estimated budget</h2>
        <div>
          {SelectBudgetOptions.map((item,index)=>(
            <div key={index}>
              <h2>{item.icon}</h2>
              <h2>{item.title}</h2>
              <h2>{item.desc}</h2>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CreateTrip
