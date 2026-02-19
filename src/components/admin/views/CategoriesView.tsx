import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Tags, X, Save, Trash2, Sparkles } from "lucide-react";

type CategoryRow = {
  id: string;
  name: string;
  display_name: string;
  icon: string | null;
  color: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

function toSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

const DEFAULT_CATEGORIES: Array<Pick<CategoryRow, "display_name" | "name" | "sort_order" | "is_active">> = [
  { display_name: "Restaurants", name: "restaurants", sort_order: 10, is_active: true },
  { display_name: "Clubs", name: "clubs", sort_order: 20, is_active: true },
  { display_name: "Lounges", name: "lounges", sort_order: 30, is_active: true },
  { display_name: "Pubs", name: "pubs", sort_order: 40, is_active: true },
  { display_name: "Live Shows", name: "live_shows", sort_order: 50, is_active: true },
  { display_name: "Arcade Centers", name: "arcade_centers", sort_order: 60, is_active: true },
  { display_name: "Beaches", name: "beaches", sort_order: 70, is_active: true },
];

export function CategoriesView() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["admin-profile-role"],
    queryFn: async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const userId = sessionData.session?.user?.id;
      if (!userId) return { role: null as string | null };
      const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).single();
      if (error) throw error;
      return { role: data?.role ?? null };
    },
  });

  const isAdmin = profile?.role === "admin";

  const [draft, setDraft] = useState<{
    id?: string;
    display_name: string;
    name: string;
    icon: string;
    color: string;
    sort_order: string;
    is_active: boolean;
  }>({
    display_name: "",
    name: "",
    icon: "",
    color: "",
    sort_order: "",
    is_active: true,
  });

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["admin-categories", searchTerm, statusFilter, currentPage, pageSize],
    queryFn: async () => {
      let query = supabase
        .from("categories")
        .select("*", { count: "exact" })
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("display_name", { ascending: true })
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

      if (searchTerm.trim()) {
        const term = searchTerm.trim();
        query = query.or(`name.ilike.%${term}%,display_name.ilike.%${term}%`);
      }

      if (statusFilter === "active") query = query.eq("is_active", true);
      if (statusFilter === "inactive") query = query.eq("is_active", false);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: (data ?? []) as CategoryRow[], count: count ?? 0 };
    },
    enabled: isAdmin,
  });

  const totalPages = useMemo(() => {
    const count = categoriesData?.count ?? 0;
    return Math.max(1, Math.ceil(count / pageSize));
  }, [categoriesData?.count, pageSize]);

  const closeModal = () => {
    setIsCreateOpen(false);
    setEditingCategory(null);
    setDraft({
      display_name: "",
      name: "",
      icon: "",
      color: "",
      sort_order: "",
      is_active: true,
    });
  };

  const openCreate = () => {
    setDraft({
      display_name: "",
      name: "",
      icon: "",
      color: "",
      sort_order: "",
      is_active: true,
    });
    setEditingCategory(null);
    setIsCreateOpen(true);
  };

  const openEdit = (category: CategoryRow) => {
    setDraft({
      id: category.id,
      display_name: category.display_name ?? "",
      name: category.name ?? "",
      icon: category.icon ?? "",
      color: category.color ?? "",
      sort_order: category.sort_order === null || category.sort_order === undefined ? "" : String(category.sort_order),
      is_active: category.is_active !== false,
    });
    setEditingCategory(category);
    setIsCreateOpen(true);
  };

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const displayName = draft.display_name.trim();
      const name = (draft.name.trim() || toSlug(displayName)).trim();
      if (!displayName) throw new Error("Display name is required");
      if (!name) throw new Error("Name is required");

      const sortOrder = draft.sort_order.trim() ? Number(draft.sort_order) : null;
      if (draft.sort_order.trim() && (Number.isNaN(sortOrder) || !Number.isFinite(sortOrder))) {
        throw new Error("Sort order must be a valid number");
      }

      const payload = {
        display_name: displayName,
        name,
        icon: draft.icon.trim() ? draft.icon.trim() : null,
        color: draft.color.trim() ? draft.color.trim() : null,
        sort_order: sortOrder,
        is_active: draft.is_active,
        updated_at: new Date().toISOString(),
      };

      if (editingCategory?.id) {
        const { data, error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingCategory.id)
          .select()
          .single();
        if (error) throw error;
        return data as CategoryRow;
      }

      const { data, error } = await supabase.from("categories").insert([payload]).select().single();
      if (error) throw error;
      return data as CategoryRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success(editingCategory ? "Category updated" : "Category created");
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to save category");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category deleted");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete category");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update status");
    },
  });

  const addDefaultsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("categories").select("name");
      if (error) throw error;
      const existing = new Set((data ?? []).map((r: any) => String(r.name)));
      const toInsert = DEFAULT_CATEGORIES.filter((c) => !existing.has(c.name)).map((c) => ({
        ...c,
        icon: null,
        color: null,
        updated_at: new Date().toISOString(),
      }));
      if (toInsert.length === 0) return 0;
      const { error: insertError } = await supabase.from("categories").insert(toInsert);
      if (insertError) throw insertError;
      return toInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      if (count === 0) toast.success("Default categories already exist");
      else toast.success(`Added ${count} default categories`);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add default categories");
    },
  });

  if (isProfileLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">Loading...</CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center text-muted-foreground">
          You don’t have permission to manage categories.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Tags className="h-6 w-6 sm:h-8 sm:w-8" />
            Categories
          </h2>
          <p className="text-muted-foreground mt-1">
            Create and manage structured categories for events and venues
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => addDefaultsMutation.mutate()} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Add Defaults
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(0);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(0);
              }}
            >
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display Name</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    Loading categories...
                  </TableCell>
                </TableRow>
              ) : categoriesData?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    No categories found
                  </TableCell>
                </TableRow>
              ) : (
                categoriesData?.data?.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{category.display_name}</span>
                        {category.color ? (
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{category.name}</TableCell>
                    <TableCell>{category.sort_order ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={category.is_active === false ? "secondary" : "default"}>
                        {category.is_active === false ? "Inactive" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(category)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            toggleActiveMutation.mutate({ id: category.id, isActive: category.is_active !== false })
                          }
                        >
                          {category.is_active === false ? "Activate" : "Deactivate"}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="gap-2">
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Category</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the category "{category.display_name}".
                                If this category is linked to events, deletion may fail until those links are removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(category.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {categoriesData?.count ? `${categoriesData.count} total` : "0 total"}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage <= 0}
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage + 1 >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {isCreateOpen ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Tags className="h-5 w-5" />
                {editingCategory ? "Edit Category" : "Create Category"}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={closeModal} className="h-8 w-8 sm:h-9 sm:w-9">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name *</Label>
                  <Input
                    id="display_name"
                    value={draft.display_name}
                    onChange={(e) => {
                      const next = e.target.value;
                      setDraft((d) => ({
                        ...d,
                        display_name: next,
                        name: d.name ? d.name : toSlug(next),
                      }));
                    }}
                    placeholder="e.g., Restaurants"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name (Slug) *</Label>
                  <Input
                    id="name"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="e.g., restaurants"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    inputMode="numeric"
                    value={draft.sort_order}
                    onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
                    placeholder="e.g., 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Input
                    id="icon"
                    value={draft.icon}
                    onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))}
                    placeholder="e.g., utensils"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={draft.color}
                    onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
                    placeholder="e.g., #FF5733"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Active</div>
                  <div className="text-sm text-muted-foreground">Show this category for selection</div>
                </div>
                <Switch
                  checked={draft.is_active}
                  onCheckedChange={(checked) => setDraft((d) => ({ ...d, is_active: checked }))}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button variant="outline" onClick={closeModal} disabled={upsertMutation.isPending}>
                  Cancel
                </Button>
                <Button onClick={() => upsertMutation.mutate()} disabled={upsertMutation.isPending} className="gap-2">
                  <Save className="h-4 w-4" />
                  {editingCategory ? "Update" : "Create"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

