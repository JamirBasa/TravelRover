import React from "react";
import { Toaster } from "sonner";
import { TOAST_CONFIG, TOAST_ICON_STYLES } from "@/utils/constants";

/**
 * Enhanced Toaster component with modern, glassmorphic design
 * Features:
 * - Icon positioned on left side for standard notification pattern
 * - Gradient backgrounds with soft colors
 * - Smooth animations and transitions
 * - Brand-consistent sky-blue color scheme
 * - Backdrop blur effect for depth
 */
const CustomToaster = () => {
  // Create modern icon components with enhanced styling
  // Gap is controlled by toastOptions.style.gap in constants.js for consistency
  const icons = {
    success: (
      <div className={TOAST_ICON_STYLES.success.className}>
        <span className={TOAST_ICON_STYLES.success.textSize}>
          {TOAST_ICON_STYLES.success.symbol}
        </span>
      </div>
    ),
    error: (
      <div className={TOAST_ICON_STYLES.error.className}>
        <span className={TOAST_ICON_STYLES.error.textSize}>
          {TOAST_ICON_STYLES.error.symbol}
        </span>
      </div>
    ),
    warning: (
      <div className={TOAST_ICON_STYLES.warning.className}>
        <span className={TOAST_ICON_STYLES.warning.textSize}>
          {TOAST_ICON_STYLES.warning.symbol}
        </span>
      </div>
    ),
    info: (
      <div className={TOAST_ICON_STYLES.info.className}>
        <span className={TOAST_ICON_STYLES.info.textSize}>
          {TOAST_ICON_STYLES.info.symbol}
        </span>
      </div>
    ),
    loading: (
      <div className={TOAST_ICON_STYLES.loading.className}>
        <div
          className="w-6 h-6 border-[3px] border-sky-200 border-t-sky-600 rounded-full"
          style={{ animation: "spin 1s linear infinite" }}
        ></div>
      </div>
    ),
  };

  return (
    <Toaster
      position={TOAST_CONFIG.position}
      richColors={TOAST_CONFIG.richColors}
      expand={TOAST_CONFIG.expand}
      duration={TOAST_CONFIG.duration}
      gap={TOAST_CONFIG.gap}
      visibleToasts={TOAST_CONFIG.visibleToasts}
      closeButton={true}
      toastOptions={TOAST_CONFIG.toastOptions}
      icons={icons}
    />
  );
};

export default CustomToaster;
