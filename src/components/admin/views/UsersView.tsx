
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { 
  Users, 
  Search, 
  Crown, 
  Trophy, 
  Calendar, 
  Eye, 
  Edit, 
  Ban, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  UserCheck,
  UserX,
  Star
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function UsersView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const queryClient = useQueryClient();

  // Mutation for updating user roles
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string, updates: any }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(`User role updated successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to update user role: ${error.message}`);
    },
  });

  const { data: usersData, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ["admin-users", searchTerm, currentPage, pageSize],
    queryFn: async () => {
      // First, get total count
      let countQuery = supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (searchTerm) {
        countQuery = countQuery.or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      // Then get paginated profiles
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      const { data: profilesData, error: profilesError } = await query;
      
      if (profilesError) {
        throw profilesError;
      }

      if (!profilesData) {
        return [];
      }

      // Get all user points for these users
      const userIds = profilesData.map(p => p.id);
      const { data: pointsData, error: pointsError } = await supabase
        .from("user_points")
        .select("user_id, total_points, available_points")
        .in("user_id", userIds);

      // Combine profiles with their points (if any)
      const profilesWithPoints = profilesData.map(profile => ({
        ...profile,
        user_points: pointsData?.filter(p => p.user_id === profile.id) || []
      }));

      return {
        users: profilesWithPoints,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
    retry: 1,
  });

  const getUserInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: string | null, isPremium: boolean, isOrganizer: boolean) => {
    if (role === "admin") return <Badge className="bg-red-500 hover:bg-red-600">Admin</Badge>;
    if (isOrganizer) return <Badge className="bg-purple-500 hover:bg-purple-600"><Crown className="h-3 w-3 mr-1" />Organizer</Badge>;
    if (isPremium) return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Trophy className="h-3 w-3 mr-1" />Premium</Badge>;
    return <Badge variant="secondary">User</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Users Management</h1>
        </div>
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded mb-2 w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Users Management</h1>
        </div>
        <Card className="p-12 text-center border-destructive">
          <Users className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Users</h3>
          <p className="text-muted-foreground mb-4">
            {queryError instanceof Error ? queryError.message : 'An unknown error occurred'}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  const users = (usersData as any)?.users || [];
  const totalUsers = (usersData as any)?.total || 0;
  const totalPages = (usersData as any)?.totalPages || 0;

  const getUserStats = () => {
    if (!users) return { total: 0, admins: 0, organizers: 0, premium: 0, regular: 0 };
    
    const total = totalUsers; // Use total from database, not just current page
    const admins = users.filter(u => u.role === 'admin').length;
    const organizers = users.filter(u => u.is_organizer && u.role !== 'admin').length;
    const premium = users.filter(u => u.is_premium && !u.is_organizer && u.role !== 'admin').length;
    const regular = users.filter(u => !u.is_premium && !u.is_organizer && u.role !== 'admin').length;
    
    return { total, admins, organizers, premium, regular };
  };

  const stats = getUserStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">Manage all platform users and their permissions</p>
        </div>

      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
              </div>
              <Crown className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Organizers</p>
                <p className="text-2xl font-bold text-foreground">{stats.organizers}</p>
              </div>
              <Crown className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Premium</p>
                <p className="text-2xl font-bold text-foreground">{stats.premium}</p>
              </div>
              <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border-gray-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Regular</p>
                <p className="text-2xl font-bold text-foreground">{stats.regular}</p>
              </div>
              <Users className="h-5 w-5 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-4 items-center flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="pl-10"
            />
          </div>
          <Select value={pageSize.toString()} onValueChange={(value) => {
            setPageSize(Number(value));
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-32">
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
        <Badge variant="secondary">{totalUsers} Total Users</Badge>
      </div>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback>{getUserInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.full_name || "Anonymous User"}</div>
                      <div className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getRoleBadge(user.role, user.is_premium || false, user.is_organizer || false)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {user.phone && <div className="text-sm">{user.phone}</div>}
                    <div className="text-xs text-muted-foreground">
                      {user.is_approved ? "Approved" : "Pending"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.user_points && Array.isArray(user.user_points) && user.user_points[0] ? (
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{user.user_points[0].total_points}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No points</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(user.created_at), "MMM dd, yyyy")}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_approved ? "default" : "secondary"}>
                    {user.is_approved ? "Active" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="gap-1">
                      <Eye className="h-3 w-3" />
                    </Button>
                    
                    {/* Make Organizer Dialog */}
                    {!user.is_organizer && user.role !== 'admin' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="gap-1 text-purple-600 hover:text-purple-700">
                            <Star className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Make User an Organizer</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to make {user.full_name || "this user"} an organizer? 
                              This will give them permission to create and manage events.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => updateUserRole.mutate({ 
                                userId: user.id, 
                                updates: { is_organizer: true } 
                              })}
                            >
                              Make Organizer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {/* Remove Organizer */}
                    {user.is_organizer && user.role !== 'admin' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="gap-1 text-orange-600 hover:text-orange-700">
                            <UserX className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Organizer Status</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove organizer status from {user.full_name || "this user"}? 
                              They will no longer be able to create or manage events.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => updateUserRole.mutate({ 
                                userId: user.id, 
                                updates: { is_organizer: false } 
                              })}
                            >
                              Remove Status
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {/* Approve/Suspend User */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className={`gap-1 ${user.is_approved 
                            ? "text-red-600 hover:text-red-700" 
                            : "text-green-600 hover:text-green-700"
                          }`}
                        >
                          {user.is_approved ? <Ban className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {user.is_approved ? "Suspend User" : "Approve User"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to {user.is_approved ? "suspend" : "approve"} {user.full_name || "this user"}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => updateUserRole.mutate({ 
                              userId: user.id, 
                              updates: { is_approved: !user.is_approved } 
                            })}
                          >
                            {user.is_approved ? "Suspend" : "Approve"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              const isCurrentPage = pageNum === currentPage;
              return (
                <Button
                  key={pageNum}
                  variant={isCurrentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  disabled={isLoading}
                  className="w-8 h-8"
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="text-muted-foreground">...</span>
                <Button
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={isLoading}
                  className="w-8 h-8"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {users?.length === 0 && !isLoading && (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Try adjusting your search terms" : "No users have registered yet"}
          </p>
        </Card>
      )}
    </div>
  );
}
