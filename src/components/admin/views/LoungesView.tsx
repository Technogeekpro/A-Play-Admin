import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Star, Eye, Building2 } from "lucide-react";
import { CreateLoungeForm } from "../forms/CreateLoungeForm";
import { EditLoungeForm } from "../forms/EditLoungeForm";

export function LoungesView() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLounge, setEditingLounge] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch lounges with filtering
  const { data: lounges, isLoading } = useQuery({
    queryKey: ["admin-lounges", searchTerm, statusFilter, currentPage, pageSize],
    queryFn: async () => {
      let query = supabase
        .from("lounges")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (statusFilter === "active") {
        query = query.eq("is_active", true);
      } else if (statusFilter === "inactive") {
        query = query.eq("is_active", false);
      } else if (statusFilter === "featured") {
        query = query.eq("is_featured", true);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count };
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lounges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lounges"] });
      toast.success("Lounge deleted successfully");
      setDeleteConfirm(null);
    },
    onError: (error) => {
      console.error("Error deleting lounge:", error);
      toast.error("Failed to delete lounge");
    },
  });

  // Toggle featured mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
      const { error } = await supabase
        .from("lounges")
        .update({ is_featured: !isFeatured })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lounges"] });
      toast.success("Featured status updated");
    },
    onError: (error) => {
      console.error("Error updating featured status:", error);
      toast.error("Failed to update featured status");
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("lounges")
        .update({ is_active: !isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lounges"] });
      toast.success("Active status updated");
    },
    onError: (error) => {
      console.error("Error updating active status:", error);
      toast.error("Failed to update active status");
    },
  });

  const totalPages = lounges?.count ? Math.ceil(lounges.count / pageSize) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 sm:h-8 sm:w-8" />
            Lounges
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage lounge venues and their details
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Lounge
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search lounges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lounges</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
                <SelectItem value="featured">Featured Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lounges Table (Desktop) */}
      <Card className="hidden lg:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lounge</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading lounges...
                  </TableCell>
                </TableRow>
              ) : lounges?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No lounges found
                  </TableCell>
                </TableRow>
              ) : (
                lounges?.data?.map((lounge) => (
                  <TableRow key={lounge.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {lounge.cover_image && (
                          <img
                            src={lounge.cover_image}
                            alt={lounge.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{lounge.name}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {lounge.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{lounge.location}</TableCell>
                    <TableCell>
                      {lounge.price_range && (
                        <Badge variant="outline">{lounge.price_range}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={lounge.is_active ? "default" : "secondary"}
                        size="sm"
                        onClick={() =>
                          toggleActiveMutation.mutate({
                            id: lounge.id,
                            isActive: lounge.is_active,
                          })
                        }
                      >
                        {lounge.is_active ? "Active" : "Inactive"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleFeaturedMutation.mutate({
                            id: lounge.id,
                            isFeatured: lounge.is_featured,
                          })
                        }
                      >
                        <Star
                          className={`h-4 w-4 ${
                            lounge.is_featured ? "fill-yellow-400 text-yellow-400" : ""
                          }`}
                        />
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingLounge(lounge)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(lounge.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center">Loading lounges...</CardContent>
          </Card>
        ) : lounges?.data?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">No lounges found</CardContent>
          </Card>
        ) : (
          lounges?.data?.map((lounge) => (
            <Card key={lounge.id}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  {lounge.cover_image && (
                    <img
                      src={lounge.cover_image}
                      alt={lounge.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{lounge.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {lounge.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{lounge.location}</span>
                  </div>
                  {lounge.price_range && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price Range:</span>
                      <Badge variant="outline">{lounge.price_range}</Badge>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <Button
                      variant={lounge.is_active ? "default" : "secondary"}
                      size="sm"
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          id: lounge.id,
                          isActive: lounge.is_active,
                        })
                      }
                    >
                      {lounge.is_active ? "Active" : "Inactive"}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      toggleFeaturedMutation.mutate({
                        id: lounge.id,
                        isFeatured: lounge.is_featured,
                      })
                    }
                  >
                    <Star
                      className={`h-4 w-4 mr-2 ${
                        lounge.is_featured ? "fill-yellow-400 text-yellow-400" : ""
                      }`}
                    />
                    {lounge.is_featured ? "Featured" : "Feature"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingLounge(lounge)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(lounge.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages} ({lounges?.count} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateLoungeForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            queryClient.invalidateQueries({ queryKey: ["admin-lounges"] });
          }}
        />
      )}

      {/* Edit Form Modal */}
      {editingLounge && (
        <EditLoungeForm
          lounge={editingLounge}
          onClose={() => setEditingLounge(null)}
          onSuccess={() => {
            setEditingLounge(null);
            queryClient.invalidateQueries({ queryKey: ["admin-lounges"] });
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this lounge. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
