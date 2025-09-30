import React, { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Minimal Sortable Activity Item
 * @param {Object} props - Component props
 * @param {Object} props.activity - Activity data
 * @param {number} props.index - Activity index
 * @param {string} props.id - Unique identifier for the activity
 */
function SortableActivityItem({ activity, index, id }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: "activity",
      activity,
      index,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white border border-gray-200 rounded-lg p-4 mb-3 
        cursor-grab active:cursor-grabbing
        hover:shadow-md hover:border-blue-300 
        transition-all duration-200
        ${isDragging ? "shadow-lg ring-2 ring-blue-400" : ""}
      `}
      {...attributes}
      {...listeners}
      role="listitem"
      tabIndex={0}
      aria-label={`Activity: ${activity.name}, position ${index + 1}`}
    >
      {/* Drag Handle */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{activity.name}</h3>
        <div className="w-6 h-6 text-gray-400 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 12 12">
            <path
              fill="currentColor"
              d="M2 2h2v2H2V2zm4 0h2v2H6V2zm4 0h2v2h-2V2zM2 6h2v2H2V6zm4 0h2v2H6V6zm4 0h2v2h-2V6zM2 10h2v2H2v-2zm4 0h2v2H6v-2zm4 0h2v2h-2v-2z"
            />
          </svg>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-2">{activity.description}</p>

      {activity.time && (
        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
          🕐 {activity.time}
        </span>
      )}
    </div>
  );
}

/**
 * Minimal Single Day Itinerary with Drag and Drop
 * This demonstrates the core functionality for one day
 */
function SingleDayItinerary() {
  // Sample data for one day
  const [activities, setActivities] = useState([
    {
      id: "1",
      name: "Central Park",
      description: "Start your day with a peaceful walk in Central Park",
      time: "9:00 AM",
    },
    {
      id: "2",
      name: "Metropolitan Museum",
      description: "Explore world-class art collections",
      time: "11:00 AM",
    },
    {
      id: "3",
      name: "Times Square",
      description: "Experience the bustling heart of NYC",
      time: "2:00 PM",
    },
    {
      id: "4",
      name: "Top of the Rock",
      description: "Enjoy panoramic views of the city",
      time: "4:00 PM",
    },
  ]);

  const [activeId, setActiveId] = useState(null);
  const [draggedActivity, setDraggedActivity] = useState(null);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance to activate drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (event) => {
      const { active } = event;
      setActiveId(active.id);

      const draggedItem = activities.find(
        (activity) => activity.id === active.id
      );
      setDraggedActivity(draggedItem);

      console.log(`Started dragging: ${draggedItem?.name}`);
    },
    [activities]
  );

  // Handle drag end
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    setActiveId(null);
    setDraggedActivity(null);

    if (!over || active.id === over.id) {
      return; // No change needed
    }

    setActivities((prevActivities) => {
      const oldIndex = prevActivities.findIndex(
        (activity) => activity.id === active.id
      );
      const newIndex = prevActivities.findIndex(
        (activity) => activity.id === over.id
      );

      const reorderedActivities = arrayMove(prevActivities, oldIndex, newIndex);

      console.log(
        `Moved ${prevActivities[oldIndex].name} from position ${
          oldIndex + 1
        } to ${newIndex + 1}`
      );

      return reorderedActivities;
    });
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          📅 Day 1 - NYC Exploration
        </h1>
        <p className="text-gray-600 text-sm mb-4">
          Drag and drop activities to reorder your itinerary
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>🎯 {activities.length} activities planned</span>
          <span>⏱️ Full day adventure</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>🖱️ Click and drag activities to reorder them</li>
          <li>
            ⌨️ Use Tab to navigate, Space/Enter to grab, Arrow keys to move
          </li>
          <li>📱 Touch and drag works on mobile devices</li>
          <li>♿ Fully accessible with screen reader support</li>
        </ul>
      </div>

      {/* Drag and Drop Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements: {
            onDragStart: ({ active }) => {
              const activity = activities.find((a) => a.id === active.id);
              return `Started dragging ${activity?.name}`;
            },
            onDragEnd: ({ active, over }) => {
              const activity = activities.find((a) => a.id === active.id);
              if (over) {
                return `${activity?.name} was moved to new position`;
              }
              return `${activity?.name} was dropped`;
            },
          },
        }}
      >
        {/* Activities Container */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Activities
          </h2>

          <SortableContext
            items={activities.map((activity) => activity.id)}
            strategy={verticalListSortingStrategy}
          >
            <div role="list" aria-label="Activities for Day 1">
              {activities.map((activity, index) => (
                <SortableActivityItem
                  key={activity.id}
                  id={activity.id}
                  activity={activity}
                  index={index}
                />
              ))}
            </div>
          </SortableContext>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedActivity ? (
            <div className="bg-white border-2 border-blue-400 rounded-lg p-4 shadow-xl opacity-90 rotate-2 scale-105">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">
                  {draggedActivity.name}
                </h3>
                <span className="text-blue-600">📍</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-1">
                {draggedActivity.description}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Current Order Display */}
      <div className="mt-6 bg-gray-100 rounded-lg p-4">
        <h3 className="font-semibold text-gray-700 mb-2">Current Order:</h3>
        <ol className="text-sm text-gray-600 space-y-1">
          {activities.map((activity, index) => (
            <li key={activity.id} className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </span>
              <span>{activity.name}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{activity.time}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* JSON Output (for development) */}
      <details className="mt-6 bg-gray-900 text-green-400 rounded-lg p-4 text-xs">
        <summary className="cursor-pointer text-white font-medium mb-2">
          📊 Current State (JSON)
        </summary>
        <pre className="overflow-auto">
          {JSON.stringify(activities, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default SingleDayItinerary;
