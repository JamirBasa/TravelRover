import { Button } from '@/components/ui/button'
import React from 'react'
import { Link } from 'react-router-dom'


function Hero() {
  return (
    <div className='flex flex-col items-center mx-56 gap-9'>
      <h1
      className='font-extrabold text-[55px] text-center mt-20'>
       Discover amazing destinations and create unforgettable memories with our <span className='text-[#1D3557]'> AI-powered travel planner.</span>  
      </h1>
      <p className="text-2xl text-gray-500 text-center">Your personal AI travel companion - from inspiration to itinerary in minutes.</p>
      <Link to={'/create-trip'}>
        <Button>Get Started</Button>
      </Link>
    </div>
  )
}

export default Hero
