/**
 * Design System Constants for Places to Visit Components
 * 
 * Centralized design tokens to ensure consistency across all components
 * This file establishes a unified visual language for the travel itinerary system
 */

// Primary color scheme - Travel themed blue gradients
export const COLORS = {
  // Primary gradients for main components
  primary: {
    gradient: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700',
    lightGradient: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    hover: 'hover:border-blue-300 dark:hover:border-blue-700',
  },
  
  // Secondary gradients for accent components  
  secondary: {
    gradient: 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600',
    lightGradient: 'bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    hover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
  },
  
  // Edit state - Warm amber for editing mode
  editing: {
    gradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500',
    lightGradient: 'bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-red-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    ring: 'ring-2 ring-amber-100 dark:ring-amber-900/50',
  },
  
  // Success states - Green for confirmations
  success: {
    gradient: 'bg-gradient-to-r from-green-500 to-emerald-600',
    lightGradient: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  
  // Info states - Cool blues for information
  info: {
    gradient: 'bg-gradient-to-r from-sky-500 to-blue-600', 
    lightGradient: 'bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30',
    text: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-800',
  },
  
  // Warning states - Warm amber for alerts and important info
  warning: {
    gradient: 'bg-gradient-to-r from-amber-500 to-orange-600',
    lightGradient: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  
  // Badge color system for consistent activity badges
  badges: {
    pricing: {
      bg: 'bg-green-100 dark:bg-green-950/30',
      text: 'text-green-800 dark:text-green-400',
      border: 'border-green-300 dark:border-green-800',
      hover: 'hover:bg-green-200 dark:hover:bg-green-900/50',
    },
    time: {
      bg: 'bg-orange-100 dark:bg-orange-950/30', 
      text: 'text-orange-800 dark:text-orange-400',
      border: 'border-orange-300 dark:border-orange-800',
      hover: 'hover:bg-orange-200 dark:hover:bg-orange-900/50',
    },
    rating: {
      bg: 'bg-yellow-100 dark:bg-yellow-950/30',
      text: 'text-yellow-800 dark:text-yellow-400', 
      border: 'border-yellow-300 dark:border-yellow-800',
      hover: 'hover:bg-yellow-200 dark:hover:bg-yellow-900/50',
    },
    general: {
      bg: 'bg-blue-100 dark:bg-blue-950/30',
      text: 'text-blue-800 dark:text-blue-400',
      border: 'border-blue-300 dark:border-blue-800', 
      hover: 'hover:bg-blue-200 dark:hover:bg-blue-900/50',
    }
  }
};

// Spacing system for consistent layouts
export const SPACING = {
  // Component padding
  padding: {
    small: 'p-3',
    medium: 'p-4 sm:p-6', 
    large: 'p-6 sm:p-8',
  },
  
  // Margins between components
  margin: {
    small: 'mb-3',
    medium: 'mb-4 sm:mb-6',
    large: 'mb-6 sm:mb-8',
  },
  
  // Grid gaps
  gap: {
    small: 'gap-2 sm:gap-3',
    medium: 'gap-3 sm:gap-4', 
    large: 'gap-4 sm:gap-6',
  }
};

// Typography system
export const TYPOGRAPHY = {
  heading: {
    h1: 'text-2xl sm:text-3xl font-bold',
    h2: 'text-xl sm:text-2xl font-bold', 
    h3: 'text-lg sm:text-xl font-semibold',
    h4: 'text-base sm:text-lg font-semibold',
  },
  
  body: {
    large: 'text-base leading-relaxed',
    medium: 'text-sm leading-relaxed',
    small: 'text-xs leading-relaxed',
  },
  
  accent: {
    badge: 'text-xs font-medium',
    caption: 'text-xs text-muted-foreground',
  }
};

// Component patterns for consistency
export const PATTERNS = {
  // Card designs
  card: {
    base: 'bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden',
    hover: 'hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-sky-500/10 transition-all duration-300',
    interactive: 'cursor-pointer hover:border-primary/30 dark:hover:border-sky-600',
  },
  
  // Section headers  
  sectionHeader: {
    base: 'relative overflow-hidden rounded-lg shadow-md',
    content: 'relative z-10',
    decoration: 'absolute inset-0 opacity-5 pointer-events-none',
  },
  
  // Icon containers
  iconContainer: {
    small: 'w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center',
    medium: 'w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center', 
    large: 'w-12 h-12 bg-white/25 backdrop-blur-md rounded-lg flex items-center justify-center',
  },
  
  // Action buttons
  button: {
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    secondary: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  }
};

// Animation presets
export const ANIMATIONS = {
  // Hover effects
  hover: {
    scale: 'hover:scale-105 transition-transform duration-300',
    lift: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-300',
    glow: 'hover:shadow-md hover:shadow-primary/20 transition-all duration-300',
  },
  
  // State transitions
  transition: {
    fast: 'transition-all duration-200',
    medium: 'transition-all duration-300', 
    slow: 'transition-all duration-500',
  },
  
  // Loading states
  loading: {
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
  }
};

// Breakpoint helpers for responsive design
export const RESPONSIVE = {
  grid: {
    auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    stats: 'grid-cols-2 lg:grid-cols-4',
    cards: 'grid-cols-1 md:grid-cols-2',
  },
  
  flex: {
    responsive: 'flex-col sm:flex-row',
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
  }
};

// Accessibility helpers
export const A11Y = {
  // ARIA roles and properties
  roles: {
    navigation: 'role="navigation"',
    region: 'role="region"', 
    banner: 'role="banner"',
    article: 'role="article"',
  },
  
  // Focus management
  focus: {
    ring: 'focus:ring-2 focus:ring-primary/50 focus:outline-none',
    visible: 'focus-visible:ring-2 focus-visible:ring-primary/50',
  },
  
  // Screen reader helpers
  screenReader: {
    only: 'sr-only',
    hidden: 'aria-hidden="true"',
  }
};

// Common component combinations
export const COMPOSED_STYLES = {
  // Interactive cards with consistent styling
  interactiveCard: `${PATTERNS.card.base} ${PATTERNS.card.hover} ${PATTERNS.card.interactive} ${A11Y.focus.ring}`,
  
  // Section headers with gradients
  primarySection: `${PATTERNS.sectionHeader.base} ${COLORS.primary.gradient}`,
  secondarySection: `${PATTERNS.sectionHeader.base} ${COLORS.secondary.gradient}`,
  
  // Stats containers  
  statCard: `${PATTERNS.card.base} ${SPACING.padding.medium} text-center group ${ANIMATIONS.hover.lift}`,
  
  // Icon badges
  iconBadge: `${PATTERNS.iconContainer.medium} ${ANIMATIONS.hover.scale} group-hover:bg-white/35 ${ANIMATIONS.transition.medium}`,
}