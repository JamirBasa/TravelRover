// src/create-trip/components/SpecificRequests.jsx
function SpecificRequests({ value, onChange }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl mb-3 font-medium">
        🎯 Specific Activities or Places (Optional)
      </h2>
      <p className="text-sm text-gray-600 mb-3">
        Tell us what you want to do on specific days or places you want to visit
      </p>
      <textarea
        className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        rows="4"
        placeholder="Examples:&#10;• Day 3: Visit Ocean Park&#10;• Day 4: Go to Palawan&#10;• Day 5: Island hopping in El Nido&#10;• Visit Underground River&#10;• Try local seafood"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-xs text-gray-500 mt-2">
        💡 You can mention specific days, activities, or places you want to
        include
      </p>
    </div>
  );
}

export default SpecificRequests;
