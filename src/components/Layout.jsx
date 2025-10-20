import { Outlet } from "react-router-dom";
import Header from "./custom/Header";
import Footer from "./custom/Footer";
import CustomToaster from "./common/CustomToaster";

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header />
      <CustomToaster />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
