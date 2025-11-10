
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Shield } from "lucide-react";

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in and redirect based on role
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        
        if (profile?.role === "admin") {
          navigate("/admin");
        } else if (profile?.role === "blogger") {
          navigate("/blogger");
        }
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Ensure a profile exists; if missing, upsert a minimal profile
        const { data: initialProfile, error: initialProfileError } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", data.user.id)
          .single();

        if (initialProfileError || !initialProfile) {
          try {
            await supabase
              .from("profiles")
              .upsert({
                id: data.user.id,
                email: data.user.email ?? email,
              }, { onConflict: "id" });
          } catch (profileUpsertError) {
            // If RLS prevents upsert, proceed to role check and show access message
            console.warn("Profile upsert failed:", profileUpsertError);
          }
        }

        // Check user role and redirect accordingly (refetch after potential upsert)
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", data.user.id)
          .single();

        if (profile?.role === "admin") {
          toast.success("Welcome back, Admin!");
          navigate("/admin");
        } else if (profile?.role === "blogger") {
          const fullName = profile.full_name || 'Blogger';
          toast.success(`Welcome back, ${fullName}!`);
          navigate("/blogger");
        } else {
          await supabase.auth.signOut();
          throw new Error("Access denied. You don't have the required privileges.");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center p-3">
            <img 
              src="/logo.png" 
              alt="A Play Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">A Play Portal</CardTitle>
            <p className="text-muted-foreground">Sign in to access your dashboard</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Admin:</strong> admin@example.com / password
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Blogger:</strong> blogger@example.com / password
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
