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
    { value: "date-newest", label: "Date Created: Newest" },
    { value: "date-oldest", label: "Date Created: Oldest" },
    { value: "travel-earliest", label: "Travel Date: Earliest" },
    { value: "travel-latest", label: "Travel Date: Latest" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ArrowUpDown className="h-4 w-4" />
          <span className="hidden sm:inline">Sort</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-gray-700 mb-2 px-2">
            Sort By
          </div>
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                sortBy === option.value
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{option.label}</span>
              {sortBy === option.value && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default SortPopover;