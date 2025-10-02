import { Outlet } from "react-router-dom";
import Header from "./custom/Header";
import Footer from "./custom/Footer";
import { Toaster } from "sonner";

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Toaster />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
