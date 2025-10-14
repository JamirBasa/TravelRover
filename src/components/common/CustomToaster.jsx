import React from "react";
import { Toaster } from "sonner";
import { TOAST_CONFIG, TOAST_ICON_STYLES } from "@/utils/constants";

/**
 * Enhanced Toaster component with modern, glassmorphic design
 * Features:
 * - Gradient backgrounds with soft colors
 * - Larger, more prominent icons with shadows
 * - Smooth animations and transitions
 * - Brand-consistent sky-blue color scheme
 * - Backdrop blur effect for depth
 */
const CustomToaster = () => {
  // Create modern icon components with enhanced styling
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
        <div className={TOAST_ICON_STYLES.loading.innerClassName}></div>
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
      toastOptions={TOAST_CONFIG.toastOptions}
      icons={icons}
    />
  );
};

export default CustomToaster;
