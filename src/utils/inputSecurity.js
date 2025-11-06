/**
 * Input Security & Sanitization Utilities
 * Prevents prompt injection attacks and XSS vulnerabilities
 */

/**
 * Dangerous prompt injection patterns
 * These patterns try to manipulate AI behavior or inject malicious content
 */
const PROMPT_INJECTION_PATTERNS = [
  // System instruction manipulation
  /ignore\s+(all\s+)?(previous|above|prior|earlier)\s+(instructions?|prompts?|commands?|rules?)/gi,
  /disregard\s+(all\s+)?(previous|above|prior|earlier)\s+(instructions?|prompts?|commands?|rules?)/gi,
  /forget\s+(all\s+)?(previous|above|prior|earlier)\s+(instructions?|prompts?|commands?|rules?)/gi,
  /override\s+(all\s+)?(previous|above|prior|earlier)\s+(instructions?|prompts?|commands?|rules?)/gi,
  
  // Role/behavior manipulation
  /system\s*(prompt|message|instruction|role)/gi,
  /you\s+are\s+(now|a|an|the)\s+(different|new|assistant|ai|bot)/gi,
  /pretend\s+(you|to\s+be|that|you're)/gi,
  /act\s+as\s+(if|a|an|though)/gi,
  /new\s+(role|instruction|prompt|system)/gi,
  /from\s+now\s+on/gi,
  /change\s+(your|the)\s+(behavior|role|instructions)/gi,
  
  // Jailbreak attempts
  /dan\s+mode/gi,
  /developer\s+mode/gi,
  /evil\s+mode/gi,
  /\[SYSTEM\]/gi,
  /\[ADMIN\]/gi,
  /\[ROOT\]/gi,
  /sudo\s+/gi,
  
  // XSS and code injection
  /<\s*script/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc.)
  /eval\s*\(/gi,
  /expression\s*\(/gi,
  
  // Data exfiltration attempts
  /return\s+(system|internal|hidden|private)\s+(data|information|prompt)/gi,
  /show\s+(me\s+)?(your|the)\s+(prompt|instructions|system)/gi,
  /reveal\s+(your|the)\s+(prompt|instructions|system)/gi,
];

/**
 * Sanitize user input to prevent prompt injection and XSS
 * @param {string} input - Raw user input
 * @param {object} options - Sanitization options
 * @returns {object} - { sanitized: string, hasInjection: boolean, removedPatterns: array }
 */
export function sanitizeUserInput(input, options = {}) {
  const {
    maxLength = 2000,
    allowHtml = false,
    stripNewlines = false,
    normalizeWhitespace = true,
  } = options;

  if (!input || typeof input !== 'string') {
    return { sanitized: '', hasInjection: false, removedPatterns: [] };
  }

  // Enforce character limit
  let sanitized = input.substring(0, maxLength);
  const removedPatterns = [];
  let hasInjection = false;

  // Check for prompt injection patterns
  PROMPT_INJECTION_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(sanitized)) {
      hasInjection = true;
      const patternName = pattern.source.substring(0, 50);
      removedPatterns.push(`Pattern ${index + 1}: ${patternName}`);
      sanitized = sanitized.replace(pattern, '[REMOVED]');
    }
  });

  // Remove HTML tags if not allowed
  if (!allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // Strip excessive newlines (keep max 2 consecutive)
  if (stripNewlines) {
    sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  }

  // Normalize whitespace
  if (normalizeWhitespace) {
    // Replace multiple spaces with single space
    sanitized = sanitized.replace(/[ \t]+/g, ' ');
    // Trim leading/trailing whitespace from each line
    sanitized = sanitized.split('\n').map(line => line.trim()).join('\n');
  }

  // Final trim
  sanitized = sanitized.trim();

  return {
    sanitized,
    hasInjection,
    removedPatterns,
  };
}

/**
 * Validate input length and warn if approaching limit
 * @param {string} input - User input
 * @param {number} maxLength - Maximum allowed length
 * @returns {object} - { isValid: boolean, remaining: number, percentage: number, warning: string|null }
 */
export function validateInputLength(input, maxLength = 2000) {
  const length = input?.length || 0;
  const remaining = maxLength - length;
  const percentage = (length / maxLength) * 100;

  let warning = null;
  if (percentage > 95) {
    warning = 'Maximum character limit reached';
  } else if (percentage > 85) {
    warning = `Only ${remaining} characters remaining`;
  } else if (percentage > 75) {
    warning = 'Approaching character limit';
  }

  return {
    isValid: length <= maxLength,
    remaining,
    percentage,
    warning,
  };
}

/**
 * Sanitize specific requests for AI prompt injection
 * Specialized for travel itinerary user inputs
 * @param {string} requests - User's specific travel requests
 * @returns {object} - { sanitized: string, hasInjection: boolean, warnings: array }
 */
export function sanitizeTravelRequests(requests) {
  const result = sanitizeUserInput(requests, {
    maxLength: 2000,
    allowHtml: false,
    stripNewlines: false,
    normalizeWhitespace: true,
  });

  const warnings = [];

  if (result.hasInjection) {
    warnings.push({
      type: 'prompt_injection',
      message: 'Suspicious content detected and removed. Please describe places naturally without system instructions.',
      severity: 'error',
    });
  }

  // Check for overly long single line (spam detection)
  const lines = result.sanitized.split('\n');
  const hasLongLine = lines.some(line => line.length > 300);
  if (hasLongLine) {
    warnings.push({
      type: 'formatting',
      message: 'Consider breaking long descriptions into separate lines for better readability.',
      severity: 'info',
    });
  }

  // Check for excessive repetition (spam detection)
  const words = result.sanitized.toLowerCase().split(/\s+/);
  const wordCounts = {};
  words.forEach(word => {
    if (word.length > 3) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });
  const maxRepetition = Math.max(...Object.values(wordCounts));
  if (maxRepetition > 10) {
    warnings.push({
      type: 'repetition',
      message: 'Detected excessive repetition. Vary your descriptions for better results.',
      severity: 'warning',
    });
  }

  return {
    sanitized: result.sanitized,
    hasInjection: result.hasInjection,
    warnings,
  };
}

/**
 * Escape special characters for safe AI prompt insertion
 * Adds an additional safety layer when including user input in AI prompts
 * @param {string} input - Sanitized user input
 * @returns {string} - Escaped input safe for AI prompts
 */
export function escapeForPrompt(input) {
  if (!input || typeof input !== 'string') return '';

  // Escape curly braces used in prompt templates
  let escaped = input.replace(/{/g, '\\{').replace(/}/g, '\\}');

  // Escape backticks used in code blocks
  escaped = escaped.replace(/`/g, '\\`');

  // Remove any markdown formatting that could disrupt the prompt
  escaped = escaped.replace(/\*\*/g, ''); // Bold
  escaped = escaped.replace(/\*/g, ''); // Italic
  escaped = escaped.replace(/~~~/g, ''); // Code blocks

  return escaped;
}

/**
 * Rate limit check for input submissions
 * Helps prevent abuse and spam
 */
export class InputRateLimiter {
  constructor(maxAttempts = 10, windowMs = 60000) {
    this.attempts = [];
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Check if input submission is allowed
   * @returns {object} - { allowed: boolean, remaining: number, resetIn: number }
   */
  checkLimit() {
    const now = Date.now();
    // Remove old attempts outside the time window
    this.attempts = this.attempts.filter(timestamp => now - timestamp < this.windowMs);

    const allowed = this.attempts.length < this.maxAttempts;
    const remaining = Math.max(0, this.maxAttempts - this.attempts.length);
    const oldestAttempt = this.attempts[0] || now;
    const resetIn = Math.max(0, this.windowMs - (now - oldestAttempt));

    if (allowed) {
      this.attempts.push(now);
    }

    return {
      allowed,
      remaining,
      resetIn,
    };
  }

  reset() {
    this.attempts = [];
  }
}

export default {
  sanitizeUserInput,
  validateInputLength,
  sanitizeTravelRequests,
  escapeForPrompt,
  InputRateLimiter,
};
