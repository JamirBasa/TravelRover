import React from "react";
import { Toaster } from "sonner";
import { TOAST_CONFIG, TOAST_ICON_STYLES } from "@/utils/constants";

/**
 * Centralized Toaster component with consistent design system
 * Used across all layouts for unified notification experience
 */
const CustomToaster = () => {
  // Create icon components from configuration
  const icons = {
    success: (
      <div className={TOAST_ICON_STYLES.success.className}>
        {TOAST_ICON_STYLES.success.symbol}
      </div>
    ),
    error: (
      <div className={TOAST_ICON_STYLES.error.className}>
        {TOAST_ICON_STYLES.error.symbol}
      </div>
    ),
    warning: (
      <div className={TOAST_ICON_STYLES.warning.className}>
        {TOAST_ICON_STYLES.warning.symbol}
      </div>
    ),
    info: (
      <div className={TOAST_ICON_STYLES.info.className}>
        {TOAST_ICON_STYLES.info.symbol}
      </div>
    ),
    loading: <div className={TOAST_ICON_STYLES.loading.className}></div>,
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
