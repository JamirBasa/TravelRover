import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import CreateTrip from "./create-trip/index.jsx";
import UserProfile from "./user-profile/index.jsx";
import Settings from "./settings/index.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ViewTrip from "./view-trip/[tripId]/index.jsx";
import MyTrips from "./my-trips/index.jsx";
import Home from "./home/home.jsx";
import Admin from "./admin/Admin.jsx";
import AdminLogin from "./admin/AdminLogin.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";

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
        path: "user-profile",
        element: <UserProfile />,
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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
