function Hotels({trip}) {
  return (
    <div>
      <h2 className='font-bold text-xl mt-5'>Hotel Recomendation</h2>
    
        <div className='grid grid-cols-2'>
            {trip?.tripData?.hotels?.map((item, index) => (
                <div>
                    <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" alt="Hotel" />
                </div>
            ))}
        </div>
    </div>
  )
}

export default Hotels
