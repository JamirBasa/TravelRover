/**
 * Design System Consistency Checker
 * Validates consistent usage of TravelRover brand design system
 */

export class DesignSystemChecker {
  
  /**
   * Standard brand colors and classes used throughout the app
   */
  static BRAND_SYSTEM = {
    colors: {
      primary: {
        sky: '#0ea5e9',
        blue: '#0284c7',
      },
      gradients: {
        brandGradient: 'brand-gradient', // Sky to blue gradient background
        brandGradientText: 'brand-gradient-text', // Gradient text effect
      },
      semantic: {
        success: 'emerald-500',
        warning: 'amber-500', 
        error: 'red-500',
        info: 'blue-500',
      }
    },
    
    components: {
      card: 'brand-card', // Glassmorphic card with backdrop blur
      button: 'brand-button', // Styled button with gradient
      iconContainer: 'brand-gradient p-2.5 rounded-full', // Standard icon container
      selectionState: 'border-sky-500 bg-gradient-to-r from-sky-50 to-blue-50',
    },
    
    typography: {
      headers: 'text-2xl font-bold brand-gradient-text mb-3',
      infoCards: 'brand-card p-5 shadow-lg border-sky-200',
    }
  };

  /**
   * Validate component uses consistent brand classes
   * @param {string} componentPath - Path to component file
   * @param {string} content - Component content to check
   * @returns {Object} Validation results
   */
  static validateBrandConsistency(componentPath, content) {
    const issues = [];
    const suggestions = [];

    // Check for deprecated gradients
    const deprecatedGradients = [
      'from-purple-500 to-pink-500',
      'bg-purple-600',
      'text-purple-600'
    ];

    deprecatedGradients.forEach(deprecated => {
      if (content.includes(deprecated)) {
        issues.push({
          type: 'deprecated-gradient',
          message: `Found deprecated gradient "${deprecated}" - use brand-gradient instead`,
          suggestion: 'Replace with brand-gradient or brand-gradient-text'
        });
      }
    });

    // Check for proper header structure
    const headerPattern = /className="text-2xl font-bold[^"]*"/g;
    const headers = content.match(headerPattern) || [];
    
    headers.forEach(header => {
      if (!header.includes('brand-gradient-text')) {
        issues.push({
          type: 'inconsistent-header',
          message: `Header "${header}" should use brand-gradient-text`,
          suggestion: 'Add brand-gradient-text class to headers'
        });
      }
    });

    // Check for proper icon container usage
    const iconContainerPattern = /className="[^"]*p-2\.5 rounded-full[^"]*"/g;
    const iconContainers = content.match(iconContainerPattern) || [];
    
    iconContainers.forEach(container => {
      if (!container.includes('brand-gradient')) {
        suggestions.push({
          type: 'icon-container-style',
          message: 'Consider using brand-gradient for icon containers',
          example: 'className="brand-gradient p-2.5 rounded-full"'
        });
      }
    });

    // Check for selection state consistency
    if (content.includes('border-blue-500') && !content.includes('border-sky-500')) {
      issues.push({
        type: 'selection-border',
        message: 'Use border-sky-500 instead of border-blue-500 for selection states',
        suggestion: 'Replace border-blue-500 with border-sky-500'
      });
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
      componentPath
    };
  }

  /**
   * Check user profile data handling consistency
   * @param {string} content - Component content to check
   * @returns {Object} Profile handling validation results
   */
  static validateProfileHandling(content) {
    const issues = [];
    const suggestions = [];

    // Check for direct profile access instead of using service
    const directProfileAccess = [
      'userProfile.address?.city',
      'userProfile.address?.regionCode',
      'userProfile.address?.region',
      'userProfile.accommodationPreference',
      'getRegionName("PH"'
    ];

    directProfileAccess.forEach(pattern => {
      if (content.includes(pattern)) {
        issues.push({
          type: 'direct-profile-access',
          pattern,
          message: `Direct profile access detected: ${pattern}`,
          suggestion: 'Use UserProfileService for consistent profile data handling'
        });
      }
    });

    // Check for duplicate region handling logic
    if (content.includes('regionCode') && content.includes('getRegionName')) {
      suggestions.push({
        type: 'region-handling',
        message: 'Consider using UserProfileService.extractDepartureLocation() for region handling',
        benefit: 'Eliminates duplicate region parsing logic'
      });
    }

    // Check for manual auto-population logic
    if (content.includes('auto-populate') || content.includes('Auto-populate')) {
      if (!content.includes('UserProfileService.autoPopulate')) {
        suggestions.push({
          type: 'auto-population',
          message: 'Consider using UserProfileService auto-population methods',
          methods: ['autoPopulateFlightData', 'autoPopulateHotelData']
        });
      }
    }

    return {
      isConsistent: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Generate design system usage report
   * @param {Array} components - Array of component validation results
   * @returns {Object} Comprehensive report
   */
  static generateReport(components) {
    const totalComponents = components.length;
    const validComponents = components.filter(c => c.isValid).length;
    const consistentProfileComponents = components.filter(c => 
      c.profileValidation?.isConsistent
    ).length;

    const allIssues = components.flatMap(c => c.issues || []);
    const allSuggestions = components.flatMap(c => c.suggestions || []);

    const issueTypes = {};
    allIssues.forEach(issue => {
      issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
    });

    return {
      summary: {
        totalComponents,
        validComponents,
        consistentProfileComponents,
        designConsistencyRate: (validComponents / totalComponents * 100).toFixed(1),
        profileConsistencyRate: (consistentProfileComponents / totalComponents * 100).toFixed(1)
      },
      
      issues: {
        total: allIssues.length,
        byType: issueTypes,
        details: allIssues
      },
      
      suggestions: {
        total: allSuggestions.length,
        details: allSuggestions
      },

      recommendations: [
        totalComponents - validComponents > 0 && 
          `${totalComponents - validComponents} components need brand system updates`,
        
        totalComponents - consistentProfileComponents > 0 &&
          `${totalComponents - consistentProfileComponents} components should use UserProfileService`,
          
        Object.keys(issueTypes).length > 0 &&
          `Most common issues: ${Object.keys(issueTypes).join(', ')}`,
      ].filter(Boolean)
    };
  }
}

/**
 * Quick validation helpers for common patterns
 */
export const DesignValidators = {
  
  /**
   * Check if component uses proper brand gradient
   */
  hasBrandGradient: (content) => 
    content.includes('brand-gradient') || content.includes('brand-gradient-text'),

  /**
   * Check if component uses deprecated purple gradients  
   */
  hasDeprecatedGradients: (content) =>
    content.includes('purple-') && content.includes('gradient'),

  /**
   * Check if profile access is centralized
   */
  usesCentralizedProfile: (content) =>
    content.includes('UserProfileService') && !content.includes('userProfile.address?.'),

  /**
   * Check if component follows header pattern
   */
  hasConsistentHeaders: (content) => {
    const headers = content.match(/text-2xl font-bold/g) || [];
    return headers.every(header => 
      content.includes('brand-gradient-text')
    );
  }
};