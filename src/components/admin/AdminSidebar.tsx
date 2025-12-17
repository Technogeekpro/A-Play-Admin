import {
  LayoutDashboard,
  Calendar,
  Building2,
  Users,
  MessageSquare,
  Trophy,
  CreditCard,
  Settings,
  BarChart3,
  Gift,
  LogOut,
  ChevronRight,
  Crown,
  Sparkles,
  Mic,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "events",
    label: "Events",
    icon: Calendar,
  },
  {
    id: "clubs",
    label: "Clubs",
    icon: Building2,
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
  },
  {
    id: "feeds",
    label: "Social Feeds",
    icon: MessageSquare,
  },
  {
    id: "bookings",
    label: "Bookings",
    icon: CreditCard,
  },
  {
    id: "points",
    label: "Points System",
    icon: Trophy,
    disabled: true,
    badge: "Soon",
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    icon: Crown,
    badge: "Pro",
  },
  {
    id: "concierge",
    label: "Concierge",
    icon: Gift,
  },
  {
    id: "podcast",
    label: "Podcast",
    icon: Mic,
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
  },
];

export function AdminSidebar({ activeView, setActiveView }: AdminSidebarProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <Sidebar className="border-r border-border/40 bg-gradient-to-b from-white via-gray-50/30 to-white dark:from-gray-950 dark:via-gray-900/30 dark:to-gray-950 shadow-lg">
      <SidebarHeader className="border-b border-border/40 px-6 py-6 bg-gradient-to-r from-primary/5 via-primary/8 to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/website_logo.png"
                alt="Club Hub Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <SidebarTrigger className="md:hidden hover:bg-primary/10 transition-colors duration-200" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-6 space-y-2 overflow-y-auto sidebar-scroll">
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
            Navigation
          </p>
        </div>
        <SidebarMenu className="space-y-1">
          {menuItems.map((item, index) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => !item.disabled && setActiveView(item.id)}
                isActive={activeView === item.id}
                disabled={item.disabled}
                className={cn(
                  "group relative w-full justify-start h-12 rounded-xl transition-all duration-300 ease-in-out",
                  !item.disabled && "hover:scale-[1.02] hover:shadow-md hover:shadow-primary/10",
                  "transform-gpu will-change-transform",
                  item.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : activeView === item.id
                    ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/20 scale-[1.02]"
                    : "hover:bg-primary/5 text-muted-foreground hover:text-foreground hover:shadow-sm"
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: "slideInLeft 0.5s ease-out forwards",
                }}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
                    activeView === item.id
                      ? "bg-white/20 backdrop-blur-sm"
                      : "bg-transparent group-hover:bg-primary/10"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 transition-all duration-300",
                      activeView === item.id
                        ? "text-white scale-110"
                        : "scale-100 group-hover:scale-110 group-hover:text-primary"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "hidden lg:block font-medium transition-all duration-300",
                    activeView === item.id ? "text-white font-semibold" : ""
                  )}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "hidden lg:block ml-auto text-xs transition-all duration-300",
                      activeView === item.id
                        ? "bg-white/20 text-white border-white/30"
                        : "bg-primary/10 text-primary border-primary/20"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
                <ChevronRight
                  className={cn(
                    "hidden lg:block h-4 w-4 ml-auto transition-all duration-300",
                    activeView === item.id
                      ? "text-white/80 translate-x-1"
                      : "text-transparent group-hover:text-primary/60 group-hover:translate-x-1"
                  )}
                />

                {/* Active indicator */}
                <div
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-white/80 to-white/60 rounded-r-full transition-all duration-300",
                    activeView === item.id
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-0"
                  )}
                />
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/40 bg-gradient-to-r from-gray-50/30 via-white to-gray-50/30 dark:from-gray-900/30 dark:via-gray-950 dark:to-gray-900/30">
        <div className="mb-3 hidden lg:block">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/8 border border-primary/10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm shadow-primary/20">
              <Crown className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Admin Account
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Full Access
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start h-11 rounded-xl transition-all duration-300",
            "text-destructive hover:text-destructive hover:bg-destructive/10",
            "hover:scale-[1.02] hover:shadow-md hover:shadow-destructive/10",
            "border border-transparent hover:border-destructive/20"
          )}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-colors duration-300">
            <LogOut className="h-4 w-4" />
          </div>
          <span className="hidden lg:block ml-2 font-medium">Sign Out</span>
        </Button>
      </SidebarFooter>

      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        /* Custom scrollbar styles */
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thumb-primary\\/20::-webkit-scrollbar-thumb {
          background-color: rgba(255, 71, 7, 0.2);
          border-radius: 2px;
        }
        
        .hover\\:scrollbar-thumb-primary\\/30:hover::-webkit-scrollbar-thumb {
          background-color: rgba(255, 71, 7, 0.3);
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 71, 7, 0.4);
        }
      `}</style>
    </Sidebar>
  );
}
