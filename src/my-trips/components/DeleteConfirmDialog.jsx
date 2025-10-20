import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Trash2 } from "lucide-react";

function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  tripData,
  isDeleting = false,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Delete Trip?
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Trip Details */}
        {tripData && (
          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 my-4 border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 text-lg">
                  📍
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {tripData.userSelection?.location || "Unknown Destination"}
                </h4>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    🗓️ {tripData.userSelection?.duration || "N/A"} days
                  </span>
                  <span>👥 {tripData.userSelection?.travelers || "N/A"}</span>
                </div>
                {tripData.createdAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Created: {new Date(tripData.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogDescription className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Are you sure you want to permanently delete this trip? All trip data
          including:
        </DialogDescription>

        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
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
            className="flex-1 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 flex items-center gap-2 bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 text-white"
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
