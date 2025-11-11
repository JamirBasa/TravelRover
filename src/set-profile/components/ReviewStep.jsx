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
        <h2 className="text-2xl font-bold brand-gradient-text mb-2">
          Almost done! Let's review your profile
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Make sure everything looks good before we save
        </p>
      </div>

      <div className="space-y-6">
        {/* Personal Info Section */}
        <div className="brand-card p-6 rounded-xl border-sky-200 dark:border-sky-700 hover:border-sky-300 dark:hover:border-sky-600 transition-all">
          <h3 className="text-lg font-semibold brand-gradient-text mb-4 flex items-center">
            <div className="brand-gradient p-2 rounded-lg mr-2">
              <FaUser className="text-white text-base" />
            </div>
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">Name:</span> {profileData.firstName}{" "}
              {profileData.middleName ? `${profileData.middleName} ` : ""}
              {profileData.lastName}
            </div>
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">Date of Birth:</span>{" "}
              {profileData.dateOfBirth || "Not specified"}
            </div>
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">Gender:</span>{" "}
              {profileData.gender
                ? profileData.gender.charAt(0).toUpperCase() +
                  profileData.gender.slice(1).replace("_", " ")
                : "Not specified"}
            </div>
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">Phone:</span>{" "}
              {profileData.phone || "Not specified"}
            </div>
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">Location:</span>{" "}
              {profileData.address.city}
              {profileData.address.region && `, ${profileData.address.region}`}
              {profileData.address.country &&
                `, ${profileData.address.country}`}
            </div>
          </div>
        </div>

        {/* Travel Style Section */}
        <div className="brand-card p-6 rounded-xl border-sky-200 dark:border-sky-700 hover:border-sky-300 dark:hover:border-sky-600 transition-all">
          <h3 className="text-lg font-semibold brand-gradient-text mb-4 flex items-center">
            <div className="brand-gradient p-2 rounded-lg mr-2">
              <FaHeart className="text-white text-base" />
            </div>
            Travel Preferences
          </h3>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">Trip Types:</span>{" "}
              {profileData.preferredTripTypes.join(", ")}
            </div>
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">Budget:</span>{" "}
              {profileData.budgetRange}
            </div>
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">Style:</span>{" "}
              {profileData.travelStyle}
            </div>
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">Accommodation:</span>{" "}
              {profileData.accommodationPreference || "No preference"}
            </div>
          </div>
        </div>

        {/* Food & Culture Section */}
        <div className="brand-card p-6 rounded-xl border-sky-200 dark:border-sky-700 hover:border-sky-300 dark:hover:border-sky-600 transition-all">
          <h3 className="text-lg font-semibold brand-gradient-text mb-4 flex items-center">
            <div className="brand-gradient p-2 rounded-lg mr-2">
              <FaUtensils className="text-white text-base" />
            </div>
            Food & Cultural Preferences
          </h3>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">Dietary:</span>{" "}
              {profileData.dietaryRestrictions.join(", ")}
            </div>
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">Halal Required:</span>{" "}
              {profileData.isHalal ? "Yes" : "No"}
            </div>
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">Cultural:</span>{" "}
              {profileData.culturalPreferences.join(", ") || "None specified"}
            </div>
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">Languages:</span>{" "}
              {profileData.languagePreferences.join(", ") || "None specified"}
            </div>
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="brand-card p-6 rounded-xl border-sky-200 dark:border-sky-700 hover:border-sky-300 dark:hover:border-sky-600 transition-all">
          <h3 className="text-lg font-semibold brand-gradient-text mb-4 flex items-center">
            <div className="brand-gradient p-2 rounded-lg mr-2">
              <FaShieldAlt className="text-white text-base" />
            </div>
            Emergency Contact & Additional Info
          </h3>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">Emergency Contact:</span>{" "}
              {profileData.emergencyContact.name}
            </div>
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">Relationship:</span>{" "}
              {profileData.emergencyContact.relationship || "Not specified"}
            </div>
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">Emergency Phone:</span>{" "}
              {profileData.emergencyContact.phone}
            </div>
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">Travel Experience:</span>{" "}
              {profileData.travelExperience || "Not specified"}
            </div>
            {profileData.mobilityNeeds && (
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-200">Mobility Needs:</span>{" "}
                {profileData.mobilityNeeds}
              </div>
            )}
            {profileData.bucketListDestinations && (
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-200">Dream Destinations:</span>{" "}
                {profileData.bucketListDestinations}
              </div>
            )}
          </div>
        </div>

        {/* Success Message */}
        <div className="brand-gradient text-white p-6 rounded-xl text-center shadow-lg">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <div className="bg-white/20 p-2 rounded-full">
              <FaCheck className="text-xl" />
            </div>
            <span className="text-xl font-semibold">Profile Complete!</span>
          </div>
          <p className="text-white/90">
            Your profile is ready. You can now create personalized trips based
            on your preferences.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;