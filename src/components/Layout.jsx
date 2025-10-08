import { Outlet } from "react-router-dom";
import Header from "./custom/Header";
import Footer from "./custom/Footer";
import CustomToaster from "./common/CustomToaster";

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
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
