import { Link } from 'react-router-dom';

function Hotels({ trip }) {
  return (
    <div>
      <h2 className="font-bold text-xl mt-5">Hotel Recommendations</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-3">
        {trip?.tripData?.tripData?.accommodations?.map((hotel, index) => (
          <Link to={'https://www.google.com/maps/search/?api=1&query=' + hotel?.name} target="_blank">
          <div key={index} className="border rounded-lg shadow p-3 hover:scale-105 transition-all cursor-pointer">
            <img
              src= "/placeholder.png"
              alt={hotel?.name}
              className="w-full h-40 object-cover rounded"
            />
            <h3 className="font-semibold mt-2">{hotel?.name}</h3>
            <p className="text-sm text-gray-600">{hotel?.address}</p>
            <p className="text-sm text-gray-800">{hotel?.pricePerNight || hotel?.priceRange}</p>
            <p className="text-yellow-500 text-sm">⭐ {hotel?.rating}</p>
          </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Hotels;