import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";

const AdminLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* No Header component for admin pages */}
      <Toaster />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;