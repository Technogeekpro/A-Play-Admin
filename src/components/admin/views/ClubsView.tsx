
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClubEditDialog } from "@/components/admin/ClubEditDialog";
import { Building2, Search, Plus, Eye, Edit, Trash2, Calendar, MapPin } from "lucide-react";

export function ClubsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClub, setEditingClub] = useState<string | null>(null);

  const { data: clubs, isLoading } = useQuery({
    queryKey: ["admin-clubs", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("clubs")
        .select(`
          *,
          events (count),
          club_tables (count)
        `)
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Clubs Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-muted rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded mb-1"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Clubs</h1>
          <p className="text-sm text-muted-foreground">{clubs?.length || 0} clubs</p>
        </div>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clubs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2">
        {clubs?.map((club) => (
          <div key={club.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
            <img
              src={club.logo_url || "https://images.unsplash.com/photo-1563841930606-67e2bce48b78?auto=format&fit=crop&w=200&h=200&q=80"}
              alt={club.name}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{club.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {club.description || "No description"}
              </p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {club.events?.[0]?.count || 0} events
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {club.club_tables?.[0]?.count || 0} tables
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Eye className="h-4 w-4" />
              </Button>
              <ClubEditDialog 
                club={club}
                open={editingClub === club.id}
                onOpenChange={(open) => setEditingClub(open ? club.id : null)}
              >
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Edit className="h-4 w-4" />
                </Button>
              </ClubEditDialog>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {clubs?.length === 0 && (
        <div className="text-center py-8">
          <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-sm font-medium mb-1">No clubs found</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first club"}
          </p>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Add Club
          </Button>
        </div>
      )}
    </div>
  );
}
