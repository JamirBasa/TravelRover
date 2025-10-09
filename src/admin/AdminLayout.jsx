import { Outlet } from "react-router-dom";
import CustomToaster from "../components/common/CustomToaster";

const AdminLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* No Header component for admin pages */}
      <CustomToaster />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
