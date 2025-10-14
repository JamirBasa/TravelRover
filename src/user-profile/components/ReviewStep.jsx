import {
  FaCheck,
  FaUser,
  FaHeart,
  FaUtensils,
  FaShieldAlt,
} from "react-icons/fa";

const ReviewStep = ({ profileData }) => {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Almost done! Let's review your profile
        </h2>
        <p className="text-gray-600">
          Make sure everything looks good before we save
        </p>
      </div>

      <div className="space-y-6">
        {/* Personal Info Section */}
        <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaUser className="mr-2 text-xl" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <span className="font-medium">Name:</span> {profileData.firstName}{" "}
              {profileData.middleName ? `${profileData.middleName} ` : ""}
              {profileData.lastName}
            </div>
            <div>
              <span className="font-medium">Age:</span>{" "}
              {profileData.age || "Not specified"}
            </div>
            <div>
              <span className="font-medium">Gender:</span>{" "}
              {profileData.gender
                ? profileData.gender.charAt(0).toUpperCase() +
                  profileData.gender.slice(1).replace("_", " ")
                : "Not specified"}
            </div>
            <div>
              <span className="font-medium">Phone:</span>{" "}
              {profileData.phone || "Not specified"}
            </div>
            <div>
              <span className="font-medium">Location:</span>{" "}
              {profileData.address.city}
              {profileData.address.region && `, ${profileData.address.region}`}
              {profileData.address.country &&
                `, ${profileData.address.country}`}
            </div>
          </div>
        </div>

        {/* Travel Style Section */}
        <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaHeart className="mr-2 text-xl" />
            Travel Preferences
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <span className="font-medium">Trip Types:</span>{" "}
              {profileData.preferredTripTypes.join(", ")}
            </div>
            <div>
              <span className="font-medium">Budget:</span>{" "}
              {profileData.budgetRange}
            </div>
            <div>
              <span className="font-medium">Style:</span>{" "}
              {profileData.travelStyle}
            </div>
            <div>
              <span className="font-medium">Accommodation:</span>{" "}
              {profileData.accommodationPreference || "No preference"}
            </div>
          </div>
        </div>

        {/* Food & Culture Section */}
        <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaUtensils className="mr-2 text-xl" />
            Food & Cultural Preferences
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <span className="font-medium">Dietary:</span>{" "}
              {profileData.dietaryRestrictions.join(", ")}
            </div>
            <div>
              <span className="font-medium">Halal Required:</span>{" "}
              {profileData.isHalal ? "Yes" : "No"}
            </div>
            <div>
              <span className="font-medium">Cultural:</span>{" "}
              {profileData.culturalPreferences.join(", ") || "None specified"}
            </div>
            <div>
              <span className="font-medium">Languages:</span>{" "}
              {profileData.languagePreferences.join(", ") || "None specified"}
            </div>
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaShieldAlt className="mr-2 text-xl" />
            Emergency Contact & Additional Info
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <span className="font-medium">Emergency Contact:</span>{" "}
              {profileData.emergencyContact.name}
            </div>
            <div>
              <span className="font-medium">Relationship:</span>{" "}
              {profileData.emergencyContact.relationship || "Not specified"}
            </div>
            <div>
              <span className="font-medium">Emergency Phone:</span>{" "}
              {profileData.emergencyContact.phone}
            </div>
            <div>
              <span className="font-medium">Travel Experience:</span>{" "}
              {profileData.travelExperience || "Not specified"}
            </div>
            {profileData.mobilityNeeds && (
              <div>
                <span className="font-medium">Mobility Needs:</span>{" "}
                {profileData.mobilityNeeds}
              </div>
            )}
            {profileData.bucketListDestinations && (
              <div>
                <span className="font-medium">Dream Destinations:</span>{" "}
                {profileData.bucketListDestinations}
              </div>
            )}
          </div>
        </div>

        {/* Success Message */}
        <div className="border-sky-500 bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md p-6 rounded-xl text-center">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <FaCheck className="text-xl" />
            <span className="text-xl font-semibold">Profile Complete!</span>
          </div>
          <p className="text-gray-300">
            Your profile is ready. You can now create personalized trips based
            on your preferences.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
