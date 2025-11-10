import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { PenTool, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BloggerProtectedRouteProps {
  children: React.ReactNode;
}

export function BloggerProtectedRoute({ children }: BloggerProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isBlogger, setIsBlogger] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          navigate("/");
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (error || profile?.role !== "blogger") {
          setIsBlogger(false);
        } else {
          setIsBlogger(true);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsBlogger(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          navigate("/");
        } else if (event === "SIGNED_IN") {
          checkAuth();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verifying blogger access...</p>
        </div>
      </div>
    );
  }

  if (!isBlogger) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
                <p className="text-muted-foreground">
                  You need blogger privileges to access this page.
                </p>
              </div>
              <Button 
                onClick={() => navigate("/")} 
                className="w-full"
              >
                Return to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}