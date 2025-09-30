import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { AlertTriangle, Trash2 } from "lucide-react";

function DeleteConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  tripData, 
  isDeleting = false 
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Delete Trip?
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Trip Details */}
        {tripData && (
          <div className="bg-gray-50 rounded-lg p-4 my-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-lg">📍</span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-gray-900 truncate">
                  {tripData.userSelection?.location || "Unknown Destination"}
                </h4>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <span>
                    🗓️ {tripData.userSelection?.duration || "N/A"} days
                  </span>
                  <span>
                    👥 {tripData.userSelection?.travelers || "N/A"}
                  </span>
                </div>
                {tripData.createdAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Created: {new Date(tripData.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogDescription className="text-sm text-gray-700 leading-relaxed">
          Are you sure you want to permanently delete this trip? All trip data including:
        </DialogDescription>

        <ul className="text-sm text-gray-600 space-y-1 ml-4">
          <li>• Travel itinerary and activities</li>
          <li>• Hotel recommendations</li>
          <li>• Flight information (if any)</li>
          <li>• All personalized preferences</li>
        </ul>

        <DialogFooter className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Trip
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteConfirmDialog;