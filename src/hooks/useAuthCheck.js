import { useState, useCallback } from 'react';

/**
 * Custom hook to check authentication before executing actions
 * Returns:
 * - requireAuth: Function to wrap protected actions
 * - showAuthDialog: Boolean to control dialog visibility
 * - setShowAuthDialog: Function to manually control dialog
 * 
 * Usage:
 * const { requireAuth, showAuthDialog, setShowAuthDialog } = useAuthCheck();
 * 
 * <Button onClick={() => requireAuth(() => navigate('/create-trip'))}>
 *   Plan Trip
 * </Button>
 */
export const useAuthCheck = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  /**
   * Check if user is authenticated and execute action or show dialog
   * @param {Function} action - The action to execute if authenticated
   * @param {string} message - Optional custom message for the dialog
   */
  const requireAuth = useCallback((action, message = null) => {
    const user = localStorage.getItem('user');
    
    if (user && JSON.parse(user)?.email) {
      // User is authenticated, execute action immediately
      action();
    } else {
      // User not authenticated, store action and show dialog
      setPendingAction(() => action);
      setShowAuthDialog(true);
    }
  }, []);

  /**
   * Execute pending action after successful login
   */
  const executePendingAction = useCallback(() => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setShowAuthDialog(false);
  }, [pendingAction]);

  /**
   * Cancel authentication dialog
   */
  const cancelAuth = useCallback(() => {
    setPendingAction(null);
    setShowAuthDialog(false);
  }, []);

  return {
    requireAuth,
    showAuthDialog,
    setShowAuthDialog,
    executePendingAction,
    cancelAuth,
  };
};
