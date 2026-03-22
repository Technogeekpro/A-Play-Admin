
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminContent } from "@/components/admin/AdminContent";
import { MobileHeader } from "@/components/admin/MobileHeader";

const Admin = () => {
  const [activeView, setActiveView] = useState("dashboard");

  return (
    <div className="h-screen overflow-hidden bg-background">
      <SidebarProvider className="h-full">
        <div className="flex h-full w-full">
          <AdminSidebar activeView={activeView} setActiveView={setActiveView} />
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            <MobileHeader />
            <AdminContent activeView={activeView} />
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Admin;
