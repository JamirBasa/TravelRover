// src/view-trip/components/TripActions.jsx
import { Button } from "@/components/ui/button";
import { Share2, Download, Edit } from "lucide-react";

function TripActions({ onShare, onDownload, onEdit }) {
  return (
    <div className="flex gap-3">
      <Button variant="outline" onClick={onShare} className="flex items-center gap-2">
        <Share2 className="h-4 w-4" />
        Share
      </Button>
      <Button variant="outline" onClick={onDownload} className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        Download
      </Button>
      <Button variant="outline" onClick={onEdit} className="flex items-center gap-2">
        <Edit className="h-4 w-4" />
        Edit
      </Button>
    </div>
  );
}

export default TripActions;