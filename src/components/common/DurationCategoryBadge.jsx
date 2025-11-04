/**
 * Duration Category Badge Component
 * Cross-platform compatible badge with emoji fallback support
 *
 * Features:
 * - Responsive design (hides label on small screens)
 * - Emoji fallback for older devices
 * - Accessible with aria-label
 * - Dark mode support
 */

import React from "react";

/**
 * Display a duration category badge with emoji
 * @param {Object} category - Category object from tripDurationLimits
 * @param {boolean} showLabel - Whether to show full label (default: true)
 * @param {string} size - Size variant: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} className - Additional CSS classes
 */
export const DurationCategoryBadge = ({
  category,
  showLabel = true,
  size = "md",
  className = "",
}) => {
  if (!category) return null;

  // Size variants
  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  // Use emoji with fallback to icon (without variation selector)
  const displayIcon = category.emoji || category.icon || "📍";

  return (
    <span
      className={`
        inline-flex items-center gap-1
        font-semibold 
        text-sky-700 dark:text-sky-400 
        bg-sky-100 dark:bg-sky-900/50 
        rounded-full
        whitespace-nowrap
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label={category.label}
      title={category.label}
    >
      {/* Emoji with fallback */}
      <span
        className="inline-block"
        role="img"
        aria-hidden="true"
        style={{
          fontFamily:
            "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
          fontSize: size === "sm" ? "0.75em" : "1em",
        }}
      >
        {displayIcon}
      </span>

      {/* Full label - hidden on tiny screens if needed */}
      {showLabel && <span className="hidden sm:inline">{category.label}</span>}

      {/* Short label - shown on tiny screens */}
      {showLabel && category.shortLabel && (
        <span className="inline sm:hidden">{category.shortLabel}</span>
      )}

      {/* Icon-only mode for compact display */}
      {!showLabel && <span className="sr-only">{category.label}</span>}
    </span>
  );
};

/**
 * Display multiple category badges in a responsive grid
 */
export const DurationCategoryList = ({ categories, size = "sm" }) => {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category, index) => (
        <DurationCategoryBadge key={index} category={category} size={size} />
      ))}
    </div>
  );
};

export default DurationCategoryBadge;
