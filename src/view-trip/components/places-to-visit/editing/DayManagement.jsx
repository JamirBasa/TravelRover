/**
 * DayManagement Component - Add, delete, reorder days without drag-and-drop
 *
 * Features:
 * ✅ Add new days with templates
 * ✅ Delete days with confirmation
 * ✅ Reorder days with up/down arrows
 * ✅ Auto-adjust dates when days change
 * ✅ Day templates for quick setup
 */

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { COLORS, PATTERNS, ANIMATIONS } from "../constants/designSystem";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Calendar,
  MapPin,
  Plane,
  Bed,
  Camera,
  Coffee,
  Copy,
} from "lucide-react";

const DAY_TEMPLATES = [
  {
    id: "travel",
    name: "Travel Day",
    icon: Plane,
    theme: "🚀 Travel & Transit",
    activities: [
      {
        time: "Morning",
        placeName: "Airport/Transportation Hub",
        placeDetails: "Departure and travel to destination",
        ticketPricing: "Varies",
        timeTravel: "3-8 hours",
        rating: "4.0",
      },
      {
        time: "Evening",
        placeName: "Hotel Check-in",
        placeDetails: "Arrive and settle into accommodation",
        ticketPricing: "Included",
        timeTravel: "1 hour",
        rating: "4.5",
      },
    ],
  },
  {
    id: "sightseeing",
    name: "Sightseeing Day",
    icon: Camera,
    theme: "🎯 Sightseeing & Exploration",
    activities: [
      {
        time: "09:00 AM",
        placeName: "Major Attraction",
        placeDetails: "Explore the main tourist attractions and landmarks",
        ticketPricing: "₱200-500",
        timeTravel: "3-4 hours",
        rating: "4.5",
      },
      {
        time: "02:00 PM",
        placeName: "Cultural Site",
        placeDetails: "Visit museums, cultural centers, or historic sites",
        ticketPricing: "₱100-300",
        timeTravel: "2-3 hours",
        rating: "4.0",
      },
    ],
  },
  {
    id: "relaxation",
    name: "Rest Day",
    icon: Coffee,
    theme: "☕ Relaxation & Local Life",
    activities: [
      {
        time: "10:00 AM",
        placeName: "Local Café",
        placeDetails: "Enjoy local coffee and people-watching",
        ticketPricing: "₱100-200",
        timeTravel: "1-2 hours",
        rating: "4.2",
      },
      {
        time: "03:00 PM",
        placeName: "Spa or Beach",
        placeDetails: "Relax and recharge for upcoming adventures",
        ticketPricing: "₱500-1000",
        timeTravel: "2-3 hours",
        rating: "4.7",
      },
    ],
  },
  {
    id: "custom",
    name: "Custom Day",
    icon: MapPin,
    theme: "📝 Plan Your Own Adventure",
    activities: [
      {
        time: "All Day",
        placeName: "Your Choice",
        placeDetails: "Create your own unique itinerary for this day",
        ticketPricing: "Varies",
        timeTravel: "Flexible",
        rating: "5.0",
      },
    ],
  },
];

function DayManagement({
  itinerary,
  onAddDay,
  onDeleteDay,
  onReorderDay,
  onCopyDay,
  startDate,
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dayToDelete, setDayToDelete] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleAddDay = (template) => {
    const newDayIndex = itinerary.length;
    const newDay = {
      day: newDayIndex + 1,
      theme: template.theme,
      plan: template.activities,
    };

    onAddDay(newDay);
    setShowAddDialog(false);
    setSelectedTemplate(null);
  };

  const handleDeleteConfirm = () => {
    if (dayToDelete !== null) {
      onDeleteDay(dayToDelete);
      setShowDeleteDialog(false);
      setDayToDelete(null);
    }
  };

  const handleMoveDay = (dayIndex, direction) => {
    const newIndex = direction === "up" ? dayIndex - 1 : dayIndex + 1;
    if (newIndex >= 0 && newIndex < itinerary.length) {
      onReorderDay(dayIndex, newIndex);
    }
  };

  const getDateForDay = (dayNumber) => {
    if (!startDate) return null;
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayNumber - 1);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Day Management Controls */}
      <div className="flex items-center justify-between bg-muted/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-7 w-7 text-primary" />
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Day Management
            </h3>
            <p className="text-base font-medium text-muted-foreground">
              {itinerary.length} day{itinerary.length !== 1 ? "s" : ""} planned
            </p>
          </div>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-3 px-6 py-3">
              <Plus className="h-6 w-6" />
              <span className="text-base font-semibold">Add Day</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Day</DialogTitle>
              <DialogDescription>
                Choose a template to quickly set up your new day, or start with
                a custom day.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              {DAY_TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <div
                    key={template.id}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all duration-200",
                      "hover:border-primary hover:shadow-md",
                      selectedTemplate?.id === template.id &&
                        "border-primary bg-primary/5 shadow-md"
                    )}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-foreground mb-2">
                          {template.name}
                        </h4>
                        <p className="text-base font-medium text-muted-foreground mb-3">
                          {template.theme}
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-sm px-2 py-1 font-semibold"
                        >
                          {template.activities.length} activities
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setSelectedTemplate(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  selectedTemplate && handleAddDay(selectedTemplate)
                }
                disabled={!selectedTemplate}
              >
                Add Day
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Individual Day Controls */}
      {itinerary.map((day, index) => (
        <div
          key={`day-${index}`}
          className="flex items-center justify-between bg-card border rounded-lg p-3"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-lg font-bold">
              {day.day}
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">
                Day {day.day}
              </h4>
              <p className="text-base font-medium text-muted-foreground">
                {getDateForDay(day.day) || "Date not set"}
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-sm px-3 py-1 font-semibold"
            >
              {day.plan?.length || 0} activities
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            {/* Copy Day */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyDay(index)}
              title="Copy day"
              className="h-10 w-10 p-0"
            >
              <Copy className="h-5 w-5" />
            </Button>

            {/* Move Up */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMoveDay(index, "up")}
              disabled={index === 0}
              title="Move up"
              className="h-10 w-10 p-0"
            >
              <ChevronUp className="h-5 w-5" />
            </Button>

            {/* Move Down */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMoveDay(index, "down")}
              disabled={index === itinerary.length - 1}
              title="Move down"
              className="h-10 w-10 p-0"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>

            {/* Delete Day */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDayToDelete(index);
                setShowDeleteDialog(true);
              }}
              disabled={itinerary.length <= 1}
              title="Delete day"
              className="h-10 w-10 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ))}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Day</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Day{" "}
              {dayToDelete !== null ? dayToDelete + 1 : ""}? This action cannot
              be undone and will remove all activities for this day.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDayToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DayManagement;
