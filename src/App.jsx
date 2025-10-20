import { usePageTitle } from "./hooks/usePageTitle";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Legacy Landing Page Component
 * Note: This component is no longer used as the main landing page.
 * The root path "/" now routes directly to the Home component.
 * This file is kept for potential future use or can be safely deleted.
 */
function App() {
  const navigate = useNavigate();

  // Set the page title for the landing page
  usePageTitle("Welcome");

  useEffect(() => {
    // Redirect to home page since this is no longer the landing page
    navigate("/", { replace: true });
  }, [navigate]);

  return null;
}

export default App;
