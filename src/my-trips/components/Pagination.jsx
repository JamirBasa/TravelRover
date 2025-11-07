import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
}) {
  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Maximum visible page numbers

    if (totalPages <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= Math.min(4, totalPages - 1); i++) {
          pages.push(i);
        }
        pages.push("ellipsis-end");
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("ellipsis-start");
        for (let i = Math.max(totalPages - 3, 2); i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push("ellipsis-start");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis-end");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Don't show navigation if only one page, but keep the info bar
  const showNavigation = totalPages > 1;

  return (
    <div className="brand-card border-gray-200/80 dark:border-slate-700/50 rounded-xl p-5 sm:p-6 mt-10 shadow-lg dark:shadow-slate-900/50 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
        {/* Results Info */}
        <div className="text-sm text-gray-600 dark:text-gray-400 w-full sm:w-auto text-center sm:text-left">
          <span className="font-medium tracking-wide">
            Showing{" "}
            <span className="text-sky-600 dark:text-sky-400 font-semibold">
              {startItem}-{endItem}
            </span>{" "}
            of{" "}
            <span className="text-sky-600 dark:text-sky-400 font-semibold">
              {totalItems}
            </span>{" "}
            {totalItems === 1 ? "trip" : "trips"}
          </span>
        </div>

        {/* Page Navigation - Only show if multiple pages */}
        {showNavigation && (
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center">
            {/* First Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="h-9 w-9 p-0 border-gray-300 dark:border-slate-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:border-sky-300 dark:hover:border-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Previous Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-9 w-9 p-0 border-gray-300 dark:border-slate-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:border-sky-300 dark:hover:border-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page Numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {pageNumbers.map((page, index) => {
                if (typeof page === "string") {
                  // Ellipsis
                  return (
                    <span
                      key={`${page}-${index}`}
                      className="px-2 text-gray-400 dark:text-gray-600 font-medium"
                    >
                      ...
                    </span>
                  );
                }

                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className={`h-9 min-w-[36px] px-3 font-semibold tracking-wide transition-all ${
                      currentPage === page
                        ? "brand-gradient text-white shadow-md shadow-sky-500/30 dark:shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/40"
                        : "border-gray-300 dark:border-slate-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:border-sky-300 dark:hover:border-sky-700"
                    }`}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            {/* Mobile: Current Page Display */}
            <div className="sm:hidden flex items-center gap-2 px-3.5 py-1.5 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/50 rounded-lg">
              <span className="text-sm font-semibold text-sky-700 dark:text-sky-300 tracking-wide">
                {currentPage} / {totalPages}
              </span>
            </div>

            {/* Next Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-9 w-9 p-0 border-gray-300 dark:border-slate-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:border-sky-300 dark:hover:border-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-9 w-9 p-0 border-gray-300 dark:border-slate-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:border-sky-300 dark:hover:border-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Hint (Desktop Only) - Only show if navigation is visible */}
      {showNavigation && (
        <div className="hidden lg:flex items-center justify-center gap-4 mt-5 pt-5 border-t border-gray-200/60 dark:border-slate-800/60">
          <span className="text-xs text-gray-500 dark:text-gray-500 tracking-wide font-medium">
            Keyboard shortcuts:
          </span>
          <div className="flex items-center gap-2">
            <kbd className="px-2.5 py-1.5 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-xs font-mono text-gray-600 dark:text-gray-400 shadow-sm">
              ←
            </kbd>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              Previous
            </span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2.5 py-1.5 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-xs font-mono text-gray-600 dark:text-gray-400 shadow-sm">
              →
            </kbd>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              Next
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pagination;
