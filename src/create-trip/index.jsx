import React, { useState, useEffect } from 'react'
import GooglePlacesAutocomplete from 'react-google-places-autocomplete'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SelectBudgetOptions, SelectTravelList, AI_PROMPT } from '../constants/options';
import { toast } from "sonner"

function CreateTrip() {
  const [place,setPlace]=useState(null);
  const [formData, setFormData]= useState({});
  const handleInputChange=(name,value)=>{

    setFormData({ 
      ...formData,
      [name]:value
    })
  }
  useEffect(()=>{
    console.log(formData)  
  },[formData])


  const onGenerateTrip=()=>{
    if(formData?.duration>5&&!formData?.location ||!formData?.budget&& !formData?.travelers){
      toast("Please fill all the details.")
      return;
    }
    const FINAL_PROMPT=AI_PROMPT
    .replace('{location}', formData?.location)
    .replace('{duration}', formData?.duration)
    .replace('{travelers}', formData?.travelers)
    .replace('{budget}', formData?.budget)

    console.log(FINAL_PROMPT);

  }


  return (
    <div className='sm:px-10 md:px-32 lg:px-56 xl:px-72 px-5 mt-10'>
      <h2 className='text-3xl font-bold'>Customize your adventure</h2>
      <p className='mt-3 text-gray-500 text-xl'>Tell us a little about yourself, and Travel Rover will craft a personalized itinerary designed around your preferences.</p>
    
      <div className='mt-20 flex flex-col gap-10'>
          <div className='mb-8'>
            <h2 className='text-xl mb-3 font-medium'>Where would you like to go?</h2>
            <GooglePlacesAutocomplete
              apiKey={import.meta.env.VITE_GOOGLE_PLACE_API_KEY}
              autocompletionRequest={{
                componentRestrictions: {
                  country: ['ph']
                }
              }}
              selectProps={{
                value: place,
                onChange: (v) => { setPlace(v);  handleInputChange('location', v.label)} ,
              }}
            />
          </div>

          <div className='mb-8'>
            <h2 className='text-xl mb-3 font-medium'>How many days will your trip last?</h2>
            <Input placeholder={''} type='number' 
              onChange={(e)=>handleInputChange('duration', e.target.value)}
            />
          </div>
          
          <div className='mb-8'>
            <h2 className='text-xl mb-3 font-medium'>Enter your estimated budget</h2>
            <div className='grid grid-cols-3 gap-5 mt-5'>
              {SelectBudgetOptions.map((item,index)=>(
                <div key={index} 
                onClick={()=>handleInputChange('budget', item.title)}
                className={`p-4 cursor-pointer border rounded-lg hover:shadow-lg
                ${formData?.budget==item.title&&'shadow-lg border-black'}
                `}>
                  <h2 className='text-4xl'>{item.icon}</h2>
                  <h2 className='font-bold text-lg'>{item.title}</h2>
                  <h2 className='text-sm text-gray'>{item.desc}</h2>
                </div>
              ))}
            </div>
          </div>


          <div className='mb-8'>
            <h2 className='text-xl mb-3 font-medium'>Who will be joining you on your adventure?</h2>
            <div className='grid grid-cols-3 gap-5 mt-5'>
              {SelectTravelList.map((item,index)=>(
                <div key={index} 
                onClick={()=>handleInputChange('travelers', item.people)}
                className={`p-4 cursor-pointer border rounded-lg hover:shadow-lg
                ${formData?.travelers==item.people&&'shadow-lg border-black'}
                `}>
                  <h2 className='text-4xl'>{item.icon}</h2>
                  <h2 className='font-bold text-lg'>{item.title}</h2>
                  <h2 className='text-sm text-gray'>{item.desc}</h2>
                </div>
              ))}
            </div>
          </div>
          
          <div className='my-10 flex justify-end'>
            <Button onClick={onGenerateTrip}>Generate Trip</Button>
          </div>
          

      </div>
    </div>
  )
}

export default CreateTrip
