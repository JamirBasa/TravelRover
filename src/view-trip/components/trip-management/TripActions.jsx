// src/view-trip/components/TripActions.jsx
import { Button } from "@/components/ui/button";
import { Share2, Download, Edit, MoreHorizontal, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function TripActions({ onShare, onDownload, onEdit, isDownloading }) {
  return (
    <div className="flex items-center gap-2">
      {/* Primary Action - Share Link */}
      <Button
        onClick={onShare}
        size="sm"
        className="brand-button px-3 py-2 text-sm font-medium"
        aria-label="Share this trip link with others"
        title="Copy trip link to share with friends and family"
      >
        <Share2 className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Share Link</span>
        <span className="sm:hidden">Share</span>
      </Button>

      {/* Mobile: More actions in popover, Desktop: Individual buttons */}
      <div className="hidden sm:flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          disabled={isDownloading}
          className="px-3 py-2 text-sm font-medium"
          aria-label={
            isDownloading
              ? "Generating PDF..."
              : "Download trip itinerary as PDF file"
          }
          title={
            isDownloading
              ? "Creating your PDF file..."
              : "Save trip as PDF document"
          }
        >
          {isDownloading ? (
            <>
              <div
                style={{
                  animation: "spin 1s linear infinite",
                  display: "inline-block",
                  marginRight: "0.25rem",
                }}
              >
                <Loader2 className="h-4 w-4" />
              </div>
              Creating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-1" />
              Download PDF
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="px-3 py-2 text-sm font-medium"
          aria-label="View detailed itinerary"
          title="Go to itinerary tab to see day-by-day activities"
        >
          <Edit className="h-4 w-4 mr-1" />
          Itinerary
        </Button>
      </div>

      {/* Mobile: More actions popover */}
      <div className="sm:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="px-2 py-2"
              aria-label="More trip actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-40 p-2">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                disabled={isDownloading}
                className="w-full justify-start text-left"
                title={
                  isDownloading ? "Creating your PDF..." : "Save trip as PDF"
                }
              >
                {isDownloading ? (
                  <>
                    <div
                      style={{
                        animation: "spin 1s linear infinite",
                        display: "inline-block",
                        marginRight: "0.5rem",
                      }}
                    >
                      <Loader2 className="h-4 w-4" />
                    </div>
                    Creating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="w-full justify-start text-left"
                title="Go to itinerary tab"
              >
                <Edit className="h-4 w-4 mr-2" />
                View Itinerary
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default TripActions;
