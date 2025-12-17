
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminContent } from "@/components/admin/AdminContent";
import { MobileHeader } from "@/components/admin/MobileHeader";

const Admin = () => {
  const [activeView, setActiveView] = useState("dashboard");

  return (
    <div className="min-h-screen w-full bg-background">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AdminSidebar activeView={activeView} setActiveView={setActiveView} />
          <div className="flex-1 flex flex-col">
            <MobileHeader />
            <AdminContent activeView={activeView} />
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Admin;
