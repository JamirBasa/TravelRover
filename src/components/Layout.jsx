import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./custom/Header";
import Footer from "./custom/Footer";

function Layout() {
  const location = useLocation();
  const hideFooter = location.pathname.startsWith("/user-profile");

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

export default Layout;