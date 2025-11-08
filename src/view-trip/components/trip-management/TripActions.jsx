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
      {/* Primary Action - Share */}
      <Button
        onClick={onShare}
        size="sm"
        className="brand-button px-3 py-2 text-sm font-medium"
        aria-label="Share this trip with others"
      >
        <Share2 className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Share</span>
      </Button>

      {/* Mobile: More actions in popover, Desktop: Individual buttons */}
      <div className="hidden sm:flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          disabled={isDownloading}
          className="px-3 py-2 text-sm font-medium"
          aria-label={isDownloading ? "Generating PDF..." : "Download trip as PDF"}
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-1" />
              PDF
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="px-3 py-2 text-sm font-medium"
          aria-label="Edit this trip"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
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
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
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
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Trip
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default TripActions;
