import React, { useState, useCallback, useMemo } from "react";
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
 * Multi-Day Itinerary with Cross-Day Drag and Drop
 * This demonstrates scaling to multiple days with activities moving between days
 */

/**
 * Sortable Activity Component for Multi-Day
 */
function MultiDayActivityItem({ activity, dayIndex, activityIndex }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${dayIndex}-${activityIndex}`,
    data: {
      type: "activity",
      activity,
      dayIndex,
      activityIndex,
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
        bg-white border border-gray-200 rounded-lg p-3 mb-2 
        cursor-grab active:cursor-grabbing
        hover:shadow-md hover:border-blue-300 
        transition-all duration-200
        ${isDragging ? "shadow-lg ring-2 ring-blue-400" : ""}
      `}
      {...attributes}
      {...listeners}
      role="listitem"
      aria-label={`${activity.name} on day ${dayIndex + 1}, position ${
        activityIndex + 1
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">{activity.name}</h4>
          {activity.time && (
            <span className="text-xs text-gray-500">{activity.time}</span>
          )}
        </div>
        <div className="w-4 h-4 text-gray-400">
          <svg viewBox="0 0 12 12" fill="currentColor">
            <path d="M2 2h2v2H2V2zm4 0h2v2H6V2zm4 0h2v2h-2V2zM2 6h2v2H2V6zm4 0h2v2H6V6zm4 0h2v2h-2V6zM2 10h2v2H2v-2zm4 0h2v2H6v-2zm4 0h2v2h-2v-2z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/**
 * Droppable Day Container
 */
function DroppableDay({ children, dayIndex, dayTitle, isOver }) {
  const { setNodeRef, isOver: isDroppableOver } = useSortable({
    id: `day-${dayIndex}`,
    data: {
      type: "day",
      dayIndex,
    },
  });

  const showDropIndicator = isOver || isDroppableOver;

  return (
    <div
      ref={setNodeRef}
      className={`
        border-2 border-dashed rounded-lg p-4 min-h-[200px]
        transition-all duration-200
        ${
          showDropIndicator
            ? "border-blue-400 bg-blue-50"
            : "border-gray-200 bg-gray-50"
        }
      `}
    >
      <h3
        className={`font-semibold mb-3 text-sm ${
          showDropIndicator ? "text-blue-700" : "text-gray-700"
        }`}
      >
        📅 {dayTitle}
      </h3>

      <div role="list" aria-label={`Activities for ${dayTitle}`}>
        {children}
      </div>

      {showDropIndicator && (
        <div className="mt-2 p-2 border border-blue-300 bg-blue-100 rounded text-center">
          <span className="text-blue-700 text-xs font-medium">
            Drop activity here
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Main Multi-Day Itinerary Component
 */
function MultiDayItinerary() {
  // Sample multi-day data structure
  const [itinerary, setItinerary] = useState([
    {
      day: 1,
      title: "Day 1 - Arrival & City Center",
      activities: [
        { id: "1-1", name: "Check-in Hotel", time: "10:00 AM" },
        { id: "1-2", name: "Central Park Walk", time: "11:30 AM" },
        { id: "1-3", name: "Lunch at Local Café", time: "1:00 PM" },
        { id: "1-4", name: "Metropolitan Museum", time: "2:30 PM" },
      ],
    },
    {
      day: 2,
      title: "Day 2 - Downtown Exploration",
      activities: [
        { id: "2-1", name: "Statue of Liberty", time: "9:00 AM" },
        { id: "2-2", name: "Wall Street Tour", time: "12:00 PM" },
        { id: "2-3", name: "Brooklyn Bridge Walk", time: "3:00 PM" },
      ],
    },
    {
      day: 3,
      title: "Day 3 - Culture & Entertainment",
      activities: [
        { id: "3-1", name: "Broadway Show", time: "2:00 PM" },
        { id: "3-2", name: "Times Square", time: "5:00 PM" },
        { id: "3-3", name: "Dinner at Rooftop Restaurant", time: "7:00 PM" },
      ],
    },
  ]);

  const [activeId, setActiveId] = useState(null);
  const [draggedActivity, setDraggedActivity] = useState(null);
  const [overDayIndex, setOverDayIndex] = useState(null);

  // Configure sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Memoized activity items for all days (performance optimization)
  const allActivityIds = useMemo(() => {
    const ids = [];
    itinerary.forEach((day, dayIndex) => {
      day.activities.forEach((_, activityIndex) => {
        ids.push(`${dayIndex}-${activityIndex}`);
      });
    });
    return ids;
  }, [itinerary]);

  // Handle drag start
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setActiveId(active.id);

    const activeData = active.data.current;
    if (activeData?.type === "activity") {
      setDraggedActivity(activeData.activity);
    }
  }, []);

  // Handle drag over (for cross-day movement)
  const handleDragOver = useCallback(
    (event) => {
      const { active, over } = event;

      if (!over) {
        setOverDayIndex(null);
        return;
      }

      const activeData = active.data.current;
      const overData = over.data.current;

      if (!activeData || activeData.type !== "activity") return;

      const activeDayIndex = activeData.dayIndex;
      const activeActivityIndex = activeData.activityIndex;

      let overDayIndex, overActivityIndex;

      if (overData?.type === "activity") {
        overDayIndex = overData.dayIndex;
        overActivityIndex = overData.activityIndex;
      } else if (overData?.type === "day") {
        overDayIndex = overData.dayIndex;
        overActivityIndex = itinerary[overDayIndex]?.activities.length || 0;
        setOverDayIndex(overDayIndex);
      } else {
        return;
      }

      // Don't do anything if we're in the same position
      if (
        activeDayIndex === overDayIndex &&
        activeActivityIndex === overActivityIndex
      ) {
        return;
      }

      // Move activity between days
      setItinerary((prev) => {
        const newItinerary = [...prev];

        // Remove activity from current day
        const [movedActivity] = newItinerary[activeDayIndex].activities.splice(
          activeActivityIndex,
          1
        );

        // Add to target day
        newItinerary[overDayIndex].activities.splice(
          overActivityIndex,
          0,
          movedActivity
        );

        return newItinerary;
      });
    },
    [itinerary]
  );

  // Handle drag end
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    setActiveId(null);
    setDraggedActivity(null);
    setOverDayIndex(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || activeData.type !== "activity") return;

    const activeDayIndex = activeData.dayIndex;
    const activeActivityIndex = activeData.activityIndex;

    // Handle same-day reordering
    if (overData?.type === "activity" && overData.dayIndex === activeDayIndex) {
      const overActivityIndex = overData.activityIndex;

      if (activeActivityIndex !== overActivityIndex) {
        setItinerary((prev) => {
          const newItinerary = [...prev];
          const dayActivities = [...newItinerary[activeDayIndex].activities];

          const reorderedActivities = arrayMove(
            dayActivities,
            activeActivityIndex,
            overActivityIndex
          );
          newItinerary[activeDayIndex].activities = reorderedActivities;

          return newItinerary;
        });
      }
    }
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalActivities = itinerary.reduce(
      (sum, day) => sum + day.activities.length,
      0
    );
    const totalDays = itinerary.length;

    return { totalActivities, totalDays };
  }, [itinerary]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🗺️ Multi-Day Trip Itinerary
        </h1>
        <p className="text-gray-600 mb-4">
          Drag activities within days or between different days to customize
          your trip
        </p>

        {/* Statistics */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            <span>📅</span>
            <span>{stats.totalDays} days planned</span>
          </div>
          <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
            <span>🎯</span>
            <span>{stats.totalActivities} activities total</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-indigo-900 mb-2">
          🔧 Multi-Day Features:
        </h3>
        <div className="grid md:grid-cols-2 gap-2 text-sm text-indigo-800">
          <div>✅ Drag activities within the same day to reorder</div>
          <div>🔄 Move activities between different days</div>
          <div>⌨️ Full keyboard navigation support</div>
          <div>📱 Touch-friendly for mobile devices</div>
        </div>
      </div>

      {/* Drag and Drop Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements: {
            onDragStart: ({ active }) => {
              const data = active.data.current;
              return `Started dragging ${data?.activity?.name} from day ${
                (data?.dayIndex || 0) + 1
              }`;
            },
            onDragOver: ({ active, over }) => {
              const activeData = active.data.current;
              const overData = over?.data.current;
              if (overData?.type === "day") {
                return `Moving ${activeData?.activity?.name} over day ${
                  (overData.dayIndex || 0) + 1
                }`;
              }
              return "";
            },
            onDragEnd: ({ active, over }) => {
              const activeData = active.data.current;
              const overData = over?.data.current;
              if (overData) {
                const targetDay =
                  overData.type === "day"
                    ? overData.dayIndex + 1
                    : overData.dayIndex + 1;
                return `Moved ${activeData?.activity?.name} to day ${targetDay}`;
              }
              return `Dropped ${activeData?.activity?.name}`;
            },
          },
        }}
      >
        {/* Multi-Day Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {itinerary.map((day, dayIndex) => (
            <div key={day.day} className="bg-white rounded-lg shadow-sm p-4">
              <SortableContext
                items={day.activities.map((_, index) => `${dayIndex}-${index}`)}
                strategy={verticalListSortingStrategy}
              >
                <DroppableDay
                  dayIndex={dayIndex}
                  dayTitle={day.title}
                  isOver={overDayIndex === dayIndex}
                >
                  {day.activities.map((activity, activityIndex) => (
                    <MultiDayActivityItem
                      key={`${dayIndex}-${activityIndex}`}
                      activity={activity}
                      dayIndex={dayIndex}
                      activityIndex={activityIndex}
                    />
                  ))}

                  {day.activities.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      <span className="text-2xl mb-2 block">📝</span>
                      <span className="text-sm">No activities yet</span>
                    </div>
                  )}
                </DroppableDay>
              </SortableContext>
            </div>
          ))}
        </div>

        {/* Enhanced Drag Overlay */}
        <DragOverlay>
          {draggedActivity ? (
            <div className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-xl opacity-95 rotate-2 scale-110 max-w-xs">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">📍</span>
                <h4 className="font-medium text-gray-900 text-sm">
                  {draggedActivity.name}
                </h4>
              </div>
              {draggedActivity.time && (
                <p className="text-xs text-gray-500 mt-1">
                  {draggedActivity.time}
                </p>
              )}
              <div className="mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Moving between days...
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Summary */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📊 Trip Summary
        </h2>
        <div className="space-y-4">
          {itinerary.map((day, index) => (
            <div key={day.day} className="border-l-4 border-blue-400 pl-4">
              <h3 className="font-semibold text-gray-800">{day.title}</h3>
              <div className="text-sm text-gray-600 mt-1">
                {day.activities.length} activities planned
                {day.activities.length > 0 && (
                  <span className="ml-2">
                    ({day.activities[0].time} -{" "}
                    {day.activities[day.activities.length - 1].time})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Debug Output */}
      <details className="mt-6 bg-gray-900 text-green-400 rounded-lg p-4 text-xs">
        <summary className="cursor-pointer text-white font-medium mb-2">
          🔍 Current Itinerary Structure (JSON)
        </summary>
        <pre className="overflow-auto max-h-64">
          {JSON.stringify(itinerary, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default MultiDayItinerary;
