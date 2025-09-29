import { Outlet } from "react-router-dom";
import Header from "./custom/Header";
import { Toaster } from "sonner";

const Layout = () => {
  return (
    <>
      <Header />
      <Toaster />
      <Outlet />
    </>
  );
};

export default Layout;
