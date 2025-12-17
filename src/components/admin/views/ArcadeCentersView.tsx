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
import { Plus, Search, Edit, Trash2, Star, Eye, Gamepad2 } from "lucide-react";
import { CreateArcadeCenterForm } from "../forms/CreateArcadeCenterForm";
import { EditArcadeCenterForm } from "../forms/EditArcadeCenterForm";

export function ArcadeCentersView() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingArcadeCenter, setEditingArcadeCenter] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch arcade centers with filtering
  const { data: arcadeCenters, isLoading } = useQuery({
    queryKey: ["admin-arcade-centers", searchTerm, statusFilter, currentPage, pageSize],
    queryFn: async () => {
      let query = supabase
        .from("arcade_centers")
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
      const { error } = await supabase.from("arcade_centers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-arcade-centers"] });
      toast.success("Arcade Center deleted successfully");
      setDeleteConfirm(null);
    },
    onError: (error) => {
      console.error("Error deleting arcade center:", error);
      toast.error("Failed to delete arcade center");
    },
  });

  // Toggle featured mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
      const { error } = await supabase
        .from("arcade_centers")
        .update({ is_featured: !isFeatured })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-arcade-centers"] });
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
        .from("arcade_centers")
        .update({ is_active: !isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-arcade-centers"] });
      toast.success("Active status updated");
    },
    onError: (error) => {
      console.error("Error updating active status:", error);
      toast.error("Failed to update active status");
    },
  });

  const totalPages = arcadeCenters?.count ? Math.ceil(arcadeCenters.count / pageSize) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 sm:h-8 sm:w-8" />
            Arcade Centers
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage arcade center venues and their details
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Arcade Center
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
                placeholder="Search arcade centers..."
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
                <SelectItem value="all">All Arcade Centers</SelectItem>
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

      {/* Arcade Centers Table (Desktop) */}
      <Card className="hidden lg:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arcade Center</TableHead>
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
                    Loading arcade centers...
                  </TableCell>
                </TableRow>
              ) : arcadeCenters?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No arcade centers found
                  </TableCell>
                </TableRow>
              ) : (
                arcadeCenters?.data?.map((arcadeCenter) => (
                  <TableRow key={arcadeCenter.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {arcadeCenter.cover_image && (
                          <img
                            src={arcadeCenter.cover_image}
                            alt={arcadeCenter.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{arcadeCenter.name}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {arcadeCenter.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{arcadeCenter.location}</TableCell>
                    <TableCell>
                      {arcadeCenter.price_range && (
                        <Badge variant="outline">{arcadeCenter.price_range}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={arcadeCenter.is_active ? "default" : "secondary"}
                        size="sm"
                        onClick={() =>
                          toggleActiveMutation.mutate({
                            id: arcadeCenter.id,
                            isActive: arcadeCenter.is_active,
                          })
                        }
                      >
                        {arcadeCenter.is_active ? "Active" : "Inactive"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleFeaturedMutation.mutate({
                            id: arcadeCenter.id,
                            isFeatured: arcadeCenter.is_featured,
                          })
                        }
                      >
                        <Star
                          className={`h-4 w-4 ${
                            arcadeCenter.is_featured ? "fill-yellow-400 text-yellow-400" : ""
                          }`}
                        />
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingArcadeCenter(arcadeCenter)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(arcadeCenter.id)}
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
            <CardContent className="p-6 text-center">Loading arcade centers...</CardContent>
          </Card>
        ) : arcadeCenters?.data?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">No arcade centers found</CardContent>
          </Card>
        ) : (
          arcadeCenters?.data?.map((arcadeCenter) => (
            <Card key={arcadeCenter.id}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  {arcadeCenter.cover_image && (
                    <img
                      src={arcadeCenter.cover_image}
                      alt={arcadeCenter.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{arcadeCenter.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {arcadeCenter.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{arcadeCenter.location}</span>
                  </div>
                  {arcadeCenter.price_range && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price Range:</span>
                      <Badge variant="outline">{arcadeCenter.price_range}</Badge>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <Button
                      variant={arcadeCenter.is_active ? "default" : "secondary"}
                      size="sm"
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          id: arcadeCenter.id,
                          isActive: arcadeCenter.is_active,
                        })
                      }
                    >
                      {arcadeCenter.is_active ? "Active" : "Inactive"}
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
                        id: arcadeCenter.id,
                        isFeatured: arcadeCenter.is_featured,
                      })
                    }
                  >
                    <Star
                      className={`h-4 w-4 mr-2 ${
                        arcadeCenter.is_featured ? "fill-yellow-400 text-yellow-400" : ""
                      }`}
                    />
                    {arcadeCenter.is_featured ? "Featured" : "Feature"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingArcadeCenter(arcadeCenter)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(arcadeCenter.id)}
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
            Page {currentPage + 1} of {totalPages} ({arcadeCenters?.count} total)
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
        <CreateArcadeCenterForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            queryClient.invalidateQueries({ queryKey: ["admin-arcade-centers"] });
          }}
        />
      )}

      {/* Edit Form Modal */}
      {editingArcadeCenter && (
        <EditArcadeCenterForm
          arcadeCenter={editingArcadeCenter}
          onClose={() => setEditingArcadeCenter(null)}
          onSuccess={() => {
            setEditingArcadeCenter(null);
            queryClient.invalidateQueries({ queryKey: ["admin-arcade-centers"] });
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this arcade center. This action cannot be undone.
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
