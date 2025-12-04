import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import CreateTrip from "./create-trip/index.jsx";
import SetProfile from "./set-profile/index.jsx";
import Settings from "./settings/index.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ViewTrip from "./view-trip/[tripId]/index.jsx";
import MyTrips from "./my-trips/index.jsx";
import Home from "./home/home.jsx";
import Admin from "./admin/Admin.jsx";
import AdminLogin from "./admin/AdminLogin.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import PrivacyAndTerms from "./legal/PrivacyAndTerms.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { initializeCacheVersion } from "./utils/cacheVersionManager.js";

// ==========================================
// React Query Configuration - Modern Cache Strategy
// ==========================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered "fresh"
      staleTime: 5 * 60 * 1000, // 5 minutes (optimal for travel data)

      // Cache time: How long unused data stays in memory
      cacheTime: 30 * 60 * 1000, // 30 minutes

      // Refetch on window focus for real-time updates
      refetchOnWindowFocus: true,

      // Refetch on reconnect after network loss
      refetchOnReconnect: true,

      // Retry failed requests
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Prevent duplicate requests
      refetchOnMount: true,

      // Enable structural sharing for performance
      structuralSharing: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// ==========================================
// Initialize Cache Version System on App Load
// ==========================================
initializeCacheVersion()
  .then((result) => {
    if (result.migrated) {
      console.log(
        `✅ Cache migrated from ${result.from || "legacy"} to ${result.to}`
      );
    }
  })
  .catch((error) => {
    console.error("❌ Cache initialization error:", error);
  });

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />, // Home page accessible to everyone (logged in or not)
      },
      {
        path: "home",
        element: <Home />, // Keep /home route for compatibility
      },
      {
        path: "set-profile",
        element: <SetProfile />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "create-trip",
        element: <CreateTrip />,
      },
      {
        path: "view-trip/:tripId",
        element: <ViewTrip />,
      },
      {
        path: "my-trips",
        element: <MyTrips />,
      },
      {
        path: "legal",
        element: <PrivacyAndTerms />,
      },
    ],
  },

  // ADMIN ROUTES - Separate layout without header
  {
    path: "/admin",
    element: <AdminLayout />, // Now properly imported
    children: [
      {
        index: true,
        element: <Admin />,
      },
      {
        path: "login",
        element: <AdminLogin />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider
        clientId={import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID}
      >
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </GoogleOAuthProvider>

      {/* React Query DevTools - Only in development */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  </StrictMode>
);
