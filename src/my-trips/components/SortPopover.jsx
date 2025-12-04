import React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowUpDown, Check } from "lucide-react";

function SortPopover({ sortBy, setSortBy }) {
  const sortOptions = [
    { value: "date-newest", label: "Newest First" },
    { value: "date-oldest", label: "Oldest First" },
    { value: "travel-earliest", label: "Travel: Soonest" },
    { value: "travel-latest", label: "Travel: Latest" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 h-11 px-4 cursor-pointer transition-colors border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
          aria-label="Sort trips"
        >
          <ArrowUpDown className="h-4 w-4" />
          <span className="hidden sm:inline">Sort</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] p-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-lg rounded-lg overflow-hidden"
        align="end"
        sideOffset={8}
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            Sort By
          </h3>
        </div>
        <div className="p-2 space-y-1">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between cursor-pointer ${
                sortBy === option.value
                  ? "bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              <span className="font-medium">{option.label}</span>
              {sortBy === option.value && (
                <Check className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default SortPopover;
