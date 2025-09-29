import React from "react";
import { Button } from "@/components/ui/button";
import { Search, X, DollarSign, Calendar, Users } from "lucide-react";

function ActiveFilters({ searchTerm, setSearchTerm, filters, setFilters, clearFilters }) {
  const hasActiveFilters = searchTerm || Object.values(filters).some(f => f);

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
      <span className="text-sm text-gray-600 font-medium">Active:</span>
      
      {/* Search Term Badge */}
      {searchTerm && (
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
          <Search className="h-3 w-3" />
          <span className="font-medium">Search:</span> "{searchTerm}"
          <button
            onClick={() => setSearchTerm("")}
            className="ml-1 hover:bg-green-200 rounded-full p-0.5 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Filter Badges */}
      {Object.entries(filters).map(([key, value]) => 
        value && (
          <div key={key} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
            {key === "budget" && <DollarSign className="h-3 w-3" />}
            {key === "duration" && <Calendar className="h-3 w-3" />}
            {key === "travelers" && <Users className="h-3 w-3" />}
            <span className="font-medium capitalize">{key}:</span>
            <span>
              {key === "duration" ? 
                (value === "short" ? "1-3 days" : value === "medium" ? "4-7 days" : "8+ days") : 
                value
              }
            </span>
            <button
              onClick={() => setFilters(prev => ({ ...prev, [key]: "" }))}
              className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )
      )}

      {/* Clear All Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={clearFilters}
        className="text-gray-600 hover:text-gray-800 text-sm ml-2"
      >
        Clear All
      </Button>
    </div>
  );
}

export default ActiveFilters;