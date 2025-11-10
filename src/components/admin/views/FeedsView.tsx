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
  MessageSquare, 
  Search, 
  Heart, 
  Trash2, 
  AlertTriangle, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Image,
  TrendingUp,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function FeedsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const queryClient = useQueryClient();

  // Mutation for deleting feeds
  const deleteFeedMutation = useMutation({
    mutationFn: async (feedId: string) => {
      const { error } = await supabase
        .from("feeds")
        .delete()
        .eq("id", feedId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feeds"] });
      toast.success("Post deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting feed:", error);
      toast.error("Failed to delete post");
    },
  });

  const { data: feedsData, isLoading, error: queryError } = useQuery({
    queryKey: ["admin-feeds", searchTerm, currentPage, pageSize],
    queryFn: async () => {
      // First, get total count
      let countQuery = supabase
        .from("feeds")
        .select("*", { count: "exact", head: true });

      if (searchTerm) {
        countQuery = countQuery.ilike("content", `%${searchTerm}%`);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      // Then get paginated feeds with separate queries to avoid join issues
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("feeds")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (searchTerm) {
        query = query.ilike("content", `%${searchTerm}%`);
      }

      const { data: feedsData, error: feedsError } = await query;
      if (feedsError) throw feedsError;

      if (!feedsData) {
        return {
          feeds: [],
          total: 0,
          totalPages: 0
        };
      }

      // Get all user profiles for these feeds
      const userIds = feedsData.map(f => f.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      // Get all events for these feeds (if they have event_id)
      const eventIds = feedsData.filter(f => f.event_id).map(f => f.event_id);
      let eventsData = [];
      if (eventIds.length > 0) {
        const { data: eventsQuery, error: eventsError } = await supabase
          .from("events")
          .select("id, title")
          .in("id", eventIds);
        
        if (!eventsError) {
          eventsData = eventsQuery || [];
        }
      }

      // Combine feeds with their profiles and events
      const feedsWithDetails = feedsData.map(feed => ({
        ...feed,
        profiles: profilesData?.find(p => p.id === feed.user_id) || null,
        events: eventsData?.find(e => e.id === feed.event_id) || null
      }));

      return {
        feeds: feedsWithDetails,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
    retry: 1,
  });

  const feeds = (feedsData as any)?.feeds || [];
  const totalFeeds = (feedsData as any)?.total || 0;
  const totalPages = (feedsData as any)?.totalPages || 0;

  const getFeedStats = () => {
    if (!feeds) return { total: 0, withImages: 0, withEvents: 0, totalLikes: 0, totalComments: 0 };
    
    const total = totalFeeds; // Use total from database, not just current page
    const withImages = feeds.filter(f => f.image_url).length;
    const withEvents = feeds.filter(f => f.event_id).length;
    const totalLikes = feeds.reduce((sum, f) => sum + (f.like_count || 0), 0);
    const totalComments = feeds.reduce((sum, f) => sum + (f.comment_count || 0), 0);
    
    return { total, withImages, withEvents, totalLikes, totalComments };
  };

  const getUserInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDeleteFeed = (feedId: string) => {
    deleteFeedMutation.mutate(feedId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Social Feeds</h1>
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
          <h1 className="text-3xl font-bold">Social Feeds</h1>
        </div>
        <Card className="p-12 text-center border-destructive">
          <MessageSquare className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Social Feeds</h3>
          <p className="text-muted-foreground mb-4">
            {queryError instanceof Error ? queryError.message : 'An unknown error occurred'}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  const stats = getFeedStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Social Feeds</h1>
          <p className="text-muted-foreground">Manage user posts and social interactions</p>
        </div>
      </div>

      {/* Feed Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <MessageSquare className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">With Images</p>
                <p className="text-2xl font-bold text-foreground">{stats.withImages}</p>
              </div>
              <Image className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Event Posts</p>
                <p className="text-2xl font-bold text-foreground">{stats.withEvents}</p>
              </div>
              <Calendar className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Likes</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalLikes}</p>
              </div>
              <Heart className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Comments</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalComments}</p>
              </div>
              <MessageSquare className="h-5 w-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-4 items-center flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
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
        <Badge variant="secondary">{totalFeeds} Total Posts</Badge>
      </div>

      {/* Feeds Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Author</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead>Media</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feeds?.map((feed) => (
              <TableRow key={feed.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={feed.profiles?.avatar_url || ""} />
                      <AvatarFallback>{getUserInitials(feed.profiles?.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{feed.profiles?.full_name || "Anonymous User"}</div>
                      <div className="text-sm text-muted-foreground">ID: {feed.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="line-clamp-2 text-sm">
                    {feed.content}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Heart className="h-3 w-3 text-red-500" />
                      <span>{feed.like_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <MessageSquare className="h-3 w-3 text-blue-500" />
                      <span>{feed.comment_count || 0}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {feed.events ? (
                    <Badge variant="outline" className="text-xs">
                      {feed.events.title}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">No event</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(feed.created_at), "MMM dd, yyyy")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(feed.created_at), "h:mm a")}
                  </div>
                </TableCell>
                <TableCell>
                  {feed.image_url ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <Image className="h-4 w-4" />
                      <span className="text-sm">Image</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Text only</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="gap-1">
                      <Eye className="h-3 w-3" />
                    </Button>
                    
                    {/* Delete Post Dialog */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="gap-1 text-red-600 hover:text-red-700">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Post</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this post? This action cannot be undone.
                            <br />
                            <br />
                            <strong>Content:</strong> {feed.content.slice(0, 100)}...
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteFeed(feed.id)}
                            disabled={deleteFeedMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Post
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
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalFeeds)} of {totalFeeds} posts
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

      {feeds?.length === 0 && !isLoading && (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No social posts found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Try adjusting your search terms" : "No users have posted yet"}
          </p>
        </Card>
      )}
    </div>
  );
}
