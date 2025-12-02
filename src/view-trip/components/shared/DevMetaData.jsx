// src/view-trip/components/DevMetadata.jsx
import { Badge } from "@/components/ui/badge";

function DevMetadata({ trip }) {
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="mt-12 bg-gray-900 text-white rounded-lg p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-semibold text-gray-100">🔧 Development Info</h3>
        <Badge variant="outline" className="border-gray-600 text-gray-300">
          Dev Mode
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-gray-400 mb-1">Trip ID</div>
          <div className="font-mono text-gray-200 text-xs break-all">
            {trip.id}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-gray-400 mb-1">Created</div>
          <div className="text-gray-200">
            {new Date(trip.createdAt).toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-gray-400 mb-1">Real Flights</div>
          <div className="text-gray-200">
            {trip.hasRealFlights || trip?.realFlightData?.rerouted ? (
              <Badge className="bg-green-600 hover:bg-green-700">
                ✅ Yes{trip?.realFlightData?.rerouted ? " (Rerouted)" : ""}
              </Badge>
            ) : (
              <Badge variant="destructive">❌ No</Badge>
            )}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-gray-400 mb-1">User</div>
          <div className="text-gray-200 truncate text-xs">{trip.userEmail}</div>
        </div>
      </div>
    </div>
  );
}

export default DevMetadata;
