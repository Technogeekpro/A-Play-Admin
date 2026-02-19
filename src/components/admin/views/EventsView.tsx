import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/use-debounce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2,
  TrendingUp,
  Upload,
  Image as ImageIcon,
  Settings,
  Star,
  StarOff
} from "lucide-react";
import { format } from "date-fns";
import { CreateEventForm } from "../forms/CreateEventForm";
import { EditEventForm } from "../forms/EditEventForm";
import { toast } from "sonner";

export function EventsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const queryClient = useQueryClient();
  
  // Debounce search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Reset current page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, featuredFilter]);

  const { data: eventsData, isLoading, error: queryError } = useQuery({
    queryKey: ["admin-events", debouncedSearchTerm, statusFilter, featuredFilter, currentPage, pageSize],
    queryFn: async () => {
      // First, get total count with filters
      let countQuery = supabase
        .from("events")
        .select("*", { count: "exact", head: true });

      if (debouncedSearchTerm) {
        countQuery = countQuery.or(`title.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%,location.ilike.%${debouncedSearchTerm}%`);
      }

      if (statusFilter !== "all") {
        const now = new Date().toISOString();
        if (statusFilter === "upcoming") {
          countQuery = countQuery.gt("start_date", now);
        } else if (statusFilter === "ongoing") {
          countQuery = countQuery.lte("start_date", now).gte("end_date", now);
        } else if (statusFilter === "past") {
          countQuery = countQuery.lt("end_date", now);
        }
      }

      if (featuredFilter !== "all") {
        countQuery = countQuery.eq("is_featured", featuredFilter === "featured");
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      // Then get paginated events
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("events")
        .select(`
          *,
          clubs (
            id,
            name,
            logo_url
          ),
          zones (
            id,
            name,
            capacity,
            price
          )
        `)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (debouncedSearchTerm) {
        query = query.or(`title.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%,location.ilike.%${debouncedSearchTerm}%`);
      }

      if (statusFilter !== "all") {
        const now = new Date().toISOString();
        if (statusFilter === "upcoming") {
          query = query.gt("start_date", now);
        } else if (statusFilter === "ongoing") {
          query = query.lte("start_date", now).gte("end_date", now);
        } else if (statusFilter === "past") {
          query = query.lt("end_date", now);
        }
      }

      if (featuredFilter !== "all") {
        query = query.eq("is_featured", featuredFilter === "featured");
      }

      const { data: eventsData, error: eventsError } = await query;
      if (eventsError) throw eventsError;

      if (!eventsData) {
        return {
          events: [],
          total: 0,
          totalPages: 0,
          stats: { total: 0, upcoming: 0, ongoing: 0, past: 0 }
        };
      }

      // Get all events for statistics
      const { data: allEventsForStats } = await supabase
        .from("events")
        .select("start_date, end_date");

      const now = new Date();
      const stats = {
        total: count || 0,
        upcoming: allEventsForStats?.filter(e => new Date(e.start_date) > now).length || 0,
        ongoing: allEventsForStats?.filter(e => 
          new Date(e.start_date) <= now && new Date(e.end_date) >= now
        ).length || 0,
        past: allEventsForStats?.filter(e => new Date(e.end_date) < now).length || 0,
      };

      // Apply search filter on combined data
      const filteredEvents = debouncedSearchTerm
        ? eventsData.filter(event =>
            event.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            event.location?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            event.clubs?.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          )
        : eventsData;

      return {
        events: filteredEvents,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        stats
      };
    },
    retry: 1,
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success("Event deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ eventId, isFeatured }: { eventId: string; isFeatured: boolean }) => {
      const { error } = await supabase
        .from("events")
        .update({ is_featured: !isFeatured })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success("Event featured status updated successfully");
    },
    onError: (error) => {
      console.error("Error updating featured status:", error);
      toast.error("Failed to update featured status");
    },
  });

  const events = (eventsData as any)?.events || [];
  const totalEvents = (eventsData as any)?.total || 0;
  const totalPages = (eventsData as any)?.totalPages || 0;
  const stats = (eventsData as any)?.stats || { total: 0, upcoming: 0, ongoing: 0, past: 0 };

  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > now) return 'upcoming';
    if (start <= now && end >= now) return 'ongoing';
    return 'past';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'ongoing':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'past':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="h-3 w-3" />;
      case 'ongoing':
        return <TrendingUp className="h-3 w-3" />;
      case 'past':
        return <Calendar className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy 'at' h:mm a");
  };

  const formatDateShort = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEventMutation.mutate(eventId);
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
  };

  const handleViewEvent = (event: any) => {
    setSelectedEvent(event);
  };

  const handleQuickImageEdit = (event: any) => {
    setEditingEvent(event);
    toast.info("Opening image editor for " + event.title);
  };

  const handleToggleFeatured = (event: any) => {
    toggleFeaturedMutation.mutate({ eventId: event.id, isFeatured: event.is_featured });
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const clearSelection = () => {
    setSelectedEvents([]);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Events Management</h1>
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
          <h1 className="text-3xl font-bold">Events Management</h1>
        </div>
        <Card className="p-12 text-center border-destructive">
          <Calendar className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Events</h3>
          <p className="text-muted-foreground mb-4">
            {queryError instanceof Error ? queryError.message : 'An unknown error occurred'}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Events Management</h1>
          <p className="text-muted-foreground">Manage and track all events</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4" />
          <span className="sm:inline">Create Event</span>
        </Button>
      </div>

      {/* Event Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-muted/20 to-muted/30 border-muted/40 hover:border-primary/20 transition-colors">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-muted/20 to-muted/30 border-muted/40 hover:border-primary/20 transition-colors">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Upcoming</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.upcoming}</p>
              </div>
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Ongoing</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.ongoing}</p>
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-muted/20 to-muted/30 border-muted/40 hover:border-primary/20 transition-colors">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Past Events</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.past}</p>
              </div>
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by title, description, or location..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 h-10 sm:h-9"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="h-10 sm:h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
          <Select value={featuredFilter} onValueChange={(value) => {
            setFeaturedFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="h-10 sm:h-9">
              <SelectValue placeholder="Featured" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="not-featured">Not Featured</SelectItem>
            </SelectContent>
          </Select>
          <Select value={pageSize.toString()} onValueChange={(value) => {
            setPageSize(Number(value));
            setCurrentPage(1);
          }}>
            <SelectTrigger className="h-10 sm:h-9">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center justify-center">
            <Badge variant="secondary" className="text-xs">{totalEvents} Total</Badge>
          </div>
        </div>
      </div>

      {/* Event Management Tools */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Event Management Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="h-4 w-4" />
              Create New Event
            </Button>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
               <div className="flex items-center gap-2">
                 <ImageIcon className="h-4 w-4" />
                 Click on event images to quickly edit or upload new images
               </div>
               <div className="flex items-center gap-2">
                 <Upload className="h-4 w-4" />
                 Use the upload button for quick image uploads
               </div>
               <div className="flex items-center gap-2">
                 <Edit className="h-4 w-4" />
                 Edit button opens full event editor with all features
               </div>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid - Desktop Table, Mobile Cards */}
      <div className="space-y-4">
        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <Card>
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">Event</TableHead>
                    <TableHead className="min-w-[150px]">Club</TableHead>
                    <TableHead className="min-w-[180px]">Date & Time</TableHead>
                    <TableHead className="min-w-[120px]">Location</TableHead>
                    <TableHead className="min-w-[100px]">Capacity</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[80px]">Featured</TableHead>
                    <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events?.map((event) => {
                    const status = getEventStatus(event.start_date, event.end_date);
                    const totalCapacity = event.zones?.reduce((total: number, zone: any) => total + (zone.capacity || 0), 0) || 0;
                    
                    return (
                      <TableRow key={event.id} className="hover:bg-muted/50">
                        <TableCell className="min-w-[250px]">
                          <div className="flex items-center gap-3">
                            <div className="relative group">
                              <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarImage 
                                  src={event.cover_image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=200&h=200&q=80"} 
                                />
                                <AvatarFallback>{event.title?.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer" onClick={() => handleEditEvent(event)}>
                                <ImageIcon className="h-4 w-4 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium truncate flex-1" title={event.title}>{event.title}</div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-6 px-2 text-xs gap-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                                  onClick={() => handleEditEvent(event)}
                                  title="Edit Event"
                                >
                                  <Edit className="h-3 w-3" />
                                  Edit
                                </Button>
                              </div>
                              <div className="text-sm text-muted-foreground line-clamp-1" title={event.description || "No description"}>
                                {event.description || "No description"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarImage src={event.clubs?.logo_url} />
                              <AvatarFallback>
                                <Building2 className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate" title={event.clubs?.name || "No club"}>
                              {event.clubs?.name || "No club"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[180px]">
                          <div>
                            <div className="font-medium whitespace-nowrap">{formatDateShort(event.start_date)}</div>
                            <div className="text-sm text-muted-foreground whitespace-nowrap">
                              {format(new Date(event.start_date), "h:mm a")}
                              {event.end_date && ` - ${format(new Date(event.end_date), "h:mm a")}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate" title={event.location || "TBA"}>
                              {event.location || "TBA"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <div className="flex items-center gap-1 text-sm whitespace-nowrap">
                            <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            {totalCapacity} seats
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {event.zones?.length || 0} zones
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <Badge className={`${getStatusColor(status)} flex items-center gap-1 w-fit whitespace-nowrap`}>
                            {getStatusIcon(status)}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[80px]">
                          <Button
                            size="sm"
                            variant={event.is_featured ? "default" : "outline"}
                            className={`h-8 w-8 p-0 ${event.is_featured ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'hover:bg-yellow-50 hover:text-yellow-600'}`}
                            onClick={() => handleToggleFeatured(event)}
                            title={event.is_featured ? "Remove from featured" : "Add to featured"}
                          >
                            {event.is_featured ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right min-w-[120px]">
                          <div className="flex gap-1 justify-end">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="gap-1" onClick={() => handleViewEvent(event)} title="View Event Details">
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Event Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="relative group">
                                    <img
                                      src={event.cover_image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80"}
                                      alt={event.title}
                                      className="w-full h-48 object-cover rounded-lg"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="secondary"
                                        className="gap-2"
                                        onClick={() => handleEditEvent(event)}
                                      >
                                        <ImageIcon className="h-4 w-4" />
                                        Change Image
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="secondary"
                                        className="gap-2"
                                        onClick={() => handleEditEvent(event)}
                                      >
                                        <Edit className="h-4 w-4" />
                                        Edit Event
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Event Title</p>
                                      <p className="font-medium">{event.title}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Club</p>
                                      <p className="font-medium">{event.clubs?.name || "No club"}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Category</p>
                                      <p className="font-medium">{event.category || "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Start Date</p>
                                      <p className="font-medium">{formatDate(event.start_date)}</p>
                                    </div>
                                    {event.end_date && (
                                      <div>
                                        <p className="text-sm text-muted-foreground">End Date</p>
                                        <p className="font-medium">{formatDate(event.end_date)}</p>
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-sm text-muted-foreground">Location</p>
                                      <p className="font-medium">{event.location || "TBA"}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Status</p>
                                      <Badge className={getStatusColor(status)}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                      </Badge>
                                    </div>
                                  </div>
                                  {event.description && (
                                    <div>
                                      <p className="text-sm text-muted-foreground">Description</p>
                                      <p className="font-medium">{event.description}</p>
                                    </div>
                                  )}
                                  {event.zones && event.zones.length > 0 && (
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-2">Zones</p>
                                      <div className="grid grid-cols-1 gap-2">
                                        {event.zones.map((zone: any) => (
                                          <div key={zone.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                                            <span className="font-medium">{zone.name}</span>
                                            <div className="flex gap-4 text-sm text-muted-foreground">
                                              <span>{zone.capacity} seats</span>
                                              <span>₵{zone.price}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="gap-1" 
                              onClick={() => handleEditEvent(event)}
                              title="Edit Event & Upload Images"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>

                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="gap-1" 
                              onClick={() => handleQuickImageEdit(event)}
                              title="Quick Image Upload"
                            >
                              <Upload className="h-3 w-3" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="gap-1 text-destructive hover:text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this event? This action cannot be undone.
                                    <br />
                                    <br />
                                    <strong>Event:</strong> {event.title}
                                    <br />
                                    <strong>Date:</strong> {formatDate(event.start_date)}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteEvent(event.id)}
                                    disabled={deleteEventMutation.isPending}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete Event
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {events?.map((event) => {
            const status = getEventStatus(event.start_date, event.end_date);
            const totalCapacity = event.zones?.reduce((total: number, zone: any) => total + (zone.capacity || 0), 0) || 0;
            
            return (
              <Card key={event.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  {/* Header with image and title */}
                  <div className="flex gap-3">
                    <Avatar className="h-16 w-16 rounded-lg flex-shrink-0">
                      <AvatarImage 
                        src={event.cover_image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=200&h=200&q=80"} 
                        alt={event.title} 
                        className="object-cover" 
                      />
                      <AvatarFallback className="rounded-lg bg-muted">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{event.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{event.clubs?.name || "No club"}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {event.is_featured && (
                            <Badge variant="secondary" className="text-xs px-1">
                              <Star className="h-3 w-3" />
                            </Badge>
                          )}
                          <Badge className={`${getStatusColor(status)} text-xs`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event details */}
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground line-clamp-2">{event.description || "No description"}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{formatDateShort(event.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{format(new Date(event.start_date), "h:mm a")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{event.location || "TBA"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{totalCapacity} seats</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleFeatured(event)}
                      className="flex-1 gap-1 h-8"
                      title={event.is_featured ? "Remove from featured" : "Add to featured"}
                    >
                      {event.is_featured ? (
                        <StarOff className="h-3 w-3" />
                      ) : (
                        <Star className="h-3 w-3" />
                      )}
                      <span className="text-xs">{event.is_featured ? "Unfeature" : "Feature"}</span>
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="flex-1 gap-1 h-8">
                          <Eye className="h-3 w-3" />
                          <span className="text-xs">View</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Event Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="relative group">
                            <img
                              src={event.cover_image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80"}
                              alt={event.title}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                              <Button 
                                size="sm" 
                                variant="secondary"
                                className="gap-2"
                                onClick={() => handleEditEvent(event)}
                              >
                                <ImageIcon className="h-4 w-4" />
                                Change Image
                              </Button>
                              <Button 
                                size="sm" 
                                variant="secondary"
                                className="gap-2"
                                onClick={() => handleEditEvent(event)}
                              >
                                <Edit className="h-4 w-4" />
                                Edit Event
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-semibold mb-2">Event Information</h3>
                              <div className="space-y-2 text-sm">
                                <div><strong>Title:</strong> {event.title}</div>
                                <div><strong>Description:</strong> {event.description || "No description"}</div>
                                <div><strong>Club:</strong> {event.clubs?.name || "No club"}</div>
                                <div><strong>Location:</strong> {event.location || "TBA"}</div>
                                <div><strong>Capacity:</strong> {totalCapacity} seats</div>
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">Schedule & Status</h3>
                              <div className="space-y-2 text-sm">
                                <div><strong>Start:</strong> {formatDate(event.start_date)}</div>
                                {event.end_date && (
                                  <div><strong>End:</strong> {formatDate(event.end_date)}</div>
                                )}
                                <div><strong>Status:</strong> 
                                  <Badge className={`ml-2 ${getStatusColor(status)}`}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </Badge>
                                </div>
                                <div><strong>Featured:</strong> {event.is_featured ? "Yes" : "No"}</div>
                              </div>
                            </div>
                          </div>
                          {event.zones && event.zones.length > 0 && (
                            <div>
                              <h3 className="font-semibold mb-2">Zones ({event.zones.length})</h3>
                              <div className="grid grid-cols-1 gap-2">
                                {event.zones.map((zone: any) => (
                                  <div key={zone.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                                    <span className="font-medium">{zone.name}</span>
                                    <div className="flex gap-4 text-sm text-muted-foreground">
                                      <span>{zone.capacity} seats</span>
                                      <span>₵{zone.price}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 pt-4">
                          <Button
                            onClick={() => handleQuickImageEdit(event)}
                            variant="outline"
                            className="gap-2 flex-1"
                          >
                            <Upload className="h-4 w-4" />
                            Change Image
                          </Button>
                          <Button
                            onClick={() => setEditingEvent(event)}
                            className="gap-2 flex-1"
                          >
                            <Edit className="h-4 w-4" />
                            Edit Event
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingEvent(event)}
                      className="flex-1 gap-1 h-8"
                    >
                      <Edit className="h-3 w-3" />
                      <span className="text-xs">Edit</span>
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="gap-1 text-destructive hover:text-destructive h-8 px-2">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[95vw]">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Event</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this event? This action cannot be undone.
                            <br /><br />
                            <strong>Event:</strong> {event.title}<br />
                            <strong>Date:</strong> {formatDate(event.start_date)}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteEvent(event.id)}
                            disabled={deleteEventMutation.isPending}
                            className="bg-destructive hover:bg-destructive/90 w-full sm:w-auto"
                          >
                            Delete Event
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalEvents)} of {totalEvents} events
        </div>
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || isLoading}
            className="h-9 px-3 sm:h-8 sm:px-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Previous</span>
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              const isCurrentPage = pageNum === currentPage;
              return (
                <Button
                  key={pageNum}
                  variant={isCurrentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  disabled={isLoading}
                  className="w-9 h-9 sm:w-8 sm:h-8 text-sm"
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 3 && (
              <>
                <span className="text-muted-foreground px-1">...</span>
                <Button
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={isLoading}
                  className="w-9 h-9 sm:w-8 sm:h-8 text-sm"
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
            className="h-9 px-3 sm:h-8 sm:px-2"
          >
            <span className="hidden sm:inline mr-1">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {events?.length === 0 && !isLoading && (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "all" ? "Try adjusting your search terms or filters" : "Get started by creating your first event"}
          </p>
        </Card>
      )}

      {showCreateForm && (
        <CreateEventForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            queryClient.invalidateQueries({ queryKey: ["admin-events"] });
          }}
        />
      )}

      {editingEvent && (
        <EditEventForm
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSuccess={() => {
            setEditingEvent(null);
            queryClient.invalidateQueries({ queryKey: ["admin-events"] });
          }}
        />
      )}
    </div>
  );
}
