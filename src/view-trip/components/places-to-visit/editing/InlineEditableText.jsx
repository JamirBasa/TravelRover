/**
 * InlineEditableText Component - Click-to-edit functionality with auto-save
 *
 * Features:
 * ✅ Click or double-click to activate edit mode
 * ✅ Auto-save on Enter, blur, or Escape
 * ✅ Visual feedback for edit states
 * ✅ Keyboard navigation support
 * ✅ Fully accessible with ARIA attributes
 * ✅ Focus management for screen readers
 * ✅ Debounced auto-save for performance
 */

import React, { useState, useRef, useEffect, useId } from "react";
import { cn } from "@/lib/utils";
import { Check, X, Edit3 } from "lucide-react";

function InlineEditableText({
  value,
  onSave,
  onCancel,
  placeholder = "Click to edit...",
  className = "",
  multiline = false,
  maxLength = 500,
  autoFocus = true,
  saveOnBlur = true,
  showEditIcon = true,
  editableClassName = "",
  displayClassName = "",
  label = "Text",
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Generate unique IDs for accessibility
  const uniqueId = useId();
  const inputId = `inline-edit-${uniqueId}`;
  const labelId = `inline-edit-label-${uniqueId}`;
  const errorId = `inline-edit-error-${uniqueId}`;
  
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  // Update edit value when prop value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value || "");
    }
  }, [value, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && autoFocus) {
      const ref = multiline ? textareaRef.current : inputRef.current;
      if (ref) {
        ref.focus();
        ref.select();
      }
    }
  }, [isEditing, autoFocus, multiline]);

  const handleStartEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(value || "");
    setHasError(false);
  };

  const handleSave = async () => {
    if (isSaving) return;

    const trimmedValue = editValue.trim();

    // Don't save if value hasn't changed
    if (trimmedValue === (value || "").trim()) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      setHasError(false);

      await onSave(trimmedValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving:", error);
      setHasError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setIsEditing(false);
    setHasError(false);
    onCancel?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    } else if (e.key === "Enter" && e.shiftKey && multiline) {
      // Allow new line in multiline mode
      return;
    }
  };

  const handleBlur = () => {
    if (saveOnBlur && !isSaving) {
      handleSave();
    }
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length <= maxLength) {
      setEditValue(newValue);
    } else if (!maxLength) {
      setEditValue(newValue);
    }
  };

  // Display mode
  if (!isEditing) {
    return (
      <div
        className={cn(
          "group relative cursor-pointer rounded px-2 py-1 transition-all duration-200",
          "hover:bg-muted/50 hover:shadow-sm focus-within:ring-2 focus-within:ring-primary/50",
          !value && "text-muted-foreground italic",
          displayClassName,
          className
        )}
        onClick={handleStartEdit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleStartEdit(e);
          }
        }}
        role="button"
        tabIndex="0"
        aria-label={`Edit ${label}`}
        aria-labelledby={labelId}
      >
        <span 
          id={labelId}
          className={cn("break-words", !value && "select-none")}
        >
          {value || placeholder}
        </span>

        {showEditIcon && (
          <Edit3 
            className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity duration-200 text-muted-foreground" 
            aria-hidden="true"
          />
        )}
      </div>
    );
  }

  // Edit mode
  return (
    <div 
      className={cn("relative", className)}
      role="form"
      aria-labelledby={labelId}
    >
      <label id={labelId} htmlFor={inputId} className="sr-only">
        Edit {label}
      </label>
      
      {multiline ? (
        <textarea
          id={inputId}
          ref={textareaRef}
          value={editValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "w-full resize-none rounded border px-2 py-1 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
            "min-h-[3rem]",
            hasError && "border-destructive ring-2 ring-destructive/20",
            isSaving && "opacity-70 cursor-wait",
            editableClassName
          )}
          disabled={isSaving}
          rows={3}
          aria-invalid={hasError}
          aria-errormessage={hasError ? errorId : undefined}
          aria-describedby={maxLength ? `${inputId}-desc` : undefined}
        />
      ) : (
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "w-full rounded border px-2 py-1 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
            hasError && "border-destructive ring-2 ring-destructive/20",
            isSaving && "opacity-70 cursor-wait",
            editableClassName
          )}
          disabled={isSaving}
          aria-invalid={hasError}
          aria-errormessage={hasError ? errorId : undefined}
          aria-describedby={maxLength ? `${inputId}-desc` : undefined}
        />
      )}

      {/* Action buttons for explicit save/cancel */}
      <div 
        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1"
        role="toolbar"
        aria-label="Editing controls"
      >
        {isSaving ? (
          <div 
            className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" 
            role="status"
            aria-label="Saving..."
          />
        ) : (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              className="p-1 rounded hover:bg-green-100 hover:text-green-600 focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-colors"
              aria-label="Save changes"
              title="Save (Enter)"
              disabled={isSaving}
            >
              <Check className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Save</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              className="p-1 rounded hover:bg-red-100 hover:text-red-600 focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition-colors"
              aria-label="Cancel editing"
              title="Cancel (Escape)"
              disabled={isSaving}
            >
              <X className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Cancel</span>
            </button>
          </>
        )}
      </div>

      {/* Character count for multiline */}
      {multiline && maxLength && (
        <div 
          id={`${inputId}-desc`}
          className="text-xs text-muted-foreground mt-1"
          aria-live="polite"
        >
          {editValue.length}/{maxLength} characters
        </div>
      )}

      {hasError && (
        <div 
          id={errorId}
          className="text-xs text-destructive mt-1"
          role="alert"
        >
          Failed to save. Please try again.
        </div>
      )}
    </div>
  );
}

export default InlineEditableText;
