// src/view-trip/components/TripHeader.jsx
import { Clock, MapPin } from "lucide-react";
import TripActions from "./TripActions";

function TripHeader({ trip, onShare, onDownload, onEdit, isDownloading }) {
  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Compact Trip Title Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 brand-gradient rounded-lg flex items-center justify-center shadow-md">
                <MapPin className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1
                  className="text-lg sm:text-xl lg:text-2xl font-bold brand-gradient-text leading-tight break-words"
                  aria-label={`Trip to ${
                    trip?.userSelection?.location || "destination"
                  }`}
                >
                  {trip?.userSelection?.location || "Your Adventure"}
                </h1>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <Clock className="h-3 w-3" />
                  <span>Created {formatDate(trip?.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Action Buttons */}
          <div className="flex-shrink-0">
            <TripActions
              onShare={onShare}
              onDownload={onDownload}
              onEdit={onEdit}
              isDownloading={isDownloading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TripHeader;
