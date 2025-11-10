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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  CreditCard, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  TrendingUp,
  User,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';

// Monochromatic chart colors with primary accent
const chartColors = {
  primary: '#FF4707',
  accent1: '#FF470799', // Primary with opacity
  accent2: '#FF470766', // Primary with opacity
  accent3: '#FF470733', // Primary with opacity
  accent4: '#A1A1AA', // Neutral gray
  accent5: '#71717A' // Darker gray
};

export function BookingsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const queryClient = useQueryClient();

  // Mutation for updating booking status
  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success("Booking status updated successfully");
    },
    onError: (error) => {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking status");
    },
  });

  const { data: bookingsData, isLoading, error: queryError } = useQuery({
    queryKey: ["admin-bookings", searchTerm, statusFilter, currentPage, pageSize],
    queryFn: async () => {
      // First, get total count with filters
      let countQuery = supabase
        .from("bookings")
        .select("*", { count: "exact", head: true });

      if (statusFilter !== "all") {
        countQuery = countQuery.eq("status", statusFilter);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      // Then get paginated bookings
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: bookingsData, error: bookingsError } = await query;
      if (bookingsError) throw bookingsError;

      if (!bookingsData) {
        return {
          bookings: [],
          total: 0,
          totalPages: 0,
          stats: { total: 0, confirmed: 0, pending: 0, cancelled: 0, totalRevenue: 0, avgBooking: 0 },
          chartData: { revenueData: [], dailyBookings: [] }
        };
      }

      // Get related data separately to avoid join issues
      const userIds = [...new Set(bookingsData.map(b => b.user_id))];
      const eventIds = [...new Set(bookingsData.map(b => b.event_id))];
      const zoneIds = [...new Set(bookingsData.map(b => b.zone_id))];

      // Get user profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, phone")
        .in("id", userIds);

      // Get events
      const { data: eventsData } = await supabase
        .from("events")
        .select("id, title, location")
        .in("id", eventIds);

      // Get zones
      const { data: zonesData } = await supabase
        .from("zones")
        .select("id, name, price")
        .in("id", zoneIds);

      // Get all bookings for statistics and charts
      const { data: allBookingsForStats } = await supabase
        .from("bookings")
        .select("status, amount, created_at, booking_date");

      const stats = {
        total: count || 0,
        confirmed: allBookingsForStats?.filter(b => b.status === 'confirmed').length || 0,
        pending: allBookingsForStats?.filter(b => b.status === 'pending').length || 0,
        cancelled: allBookingsForStats?.filter(b => b.status === 'cancelled').length || 0,
        totalRevenue: allBookingsForStats?.reduce((sum, b) => sum + (parseFloat(b.amount?.toString() || '0') || 0), 0) || 0,
        avgBooking: 0
      };
      stats.avgBooking = stats.total > 0 ? stats.totalRevenue / stats.total : 0;

      // Generate chart data
      const revenueData = generateRevenueChartData(allBookingsForStats || []);
      const dailyBookingsData = generateDailyBookingsData(allBookingsForStats || []);

      // Combine bookings with their related data
      const bookingsWithDetails = bookingsData.map(booking => ({
        ...booking,
        profiles: profilesData?.find(p => p.id === booking.user_id) || null,
        events: eventsData?.find(e => e.id === booking.event_id) || null,
        zones: zonesData?.find(z => z.id === booking.zone_id) || null
      }));

      // Apply search filter on combined data
      const filteredBookings = searchTerm
        ? bookingsWithDetails.filter(booking =>
            booking.events?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.zones?.name?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : bookingsWithDetails;

      return {
        bookings: filteredBookings,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        stats,
        chartData: {
          revenueData,
          dailyBookings: dailyBookingsData
        }
      };
    },
    retry: 1,
  });

  // Generate revenue chart data for the last 30 days
  const generateRevenueChartData = (bookings: any[]) => {
    const days = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayRevenue = bookings
        .filter(booking => {
          const bookingDate = new Date(booking.created_at);
          return bookingDate.toDateString() === date.toDateString() && 
                 booking.status === 'confirmed';
        })
        .reduce((sum, booking) => sum + (parseFloat(booking.amount?.toString() || '0') || 0), 0);

      days.push({
        day: dayName,
        revenue: dayRevenue,
        date: date.toISOString().split('T')[0]
      });
    }
    return days;
  };

  // Generate daily bookings data for the last 30 days
  const generateDailyBookingsData = (bookings: any[]) => {
    const days = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayBookings = {
        day: dayName,
        confirmed: bookings.filter(b => {
          const bookingDate = new Date(b.created_at);
          return bookingDate.toDateString() === date.toDateString() && b.status === 'confirmed';
        }).length,
        pending: bookings.filter(b => {
          const bookingDate = new Date(b.created_at);
          return bookingDate.toDateString() === date.toDateString() && b.status === 'pending';
        }).length,
        cancelled: bookings.filter(b => {
          const bookingDate = new Date(b.created_at);
          return bookingDate.toDateString() === date.toDateString() && b.status === 'cancelled';
        }).length
      };

      days.push(dayBookings);
    }
    return days;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.dataKey === 'revenue' ? '₵' : ''}${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const bookings = (bookingsData as any)?.bookings || [];
  const totalBookings = (bookingsData as any)?.total || 0;
  const totalPages = (bookingsData as any)?.totalPages || 0;
  const stats = (bookingsData as any)?.stats || { total: 0, confirmed: 0, pending: 0, cancelled: 0, totalRevenue: 0, avgBooking: 0 };
  const chartData = (bookingsData as any)?.chartData || { revenueData: [], dailyBookings: [] };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-3 w-3" />;
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'cancelled':
        return <XCircle className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
    }
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

  const handleStatusUpdate = (bookingId: string, status: string) => {
    updateBookingMutation.mutate({ bookingId, status });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Bookings Management</h1>
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
          <h1 className="text-3xl font-bold">Bookings Management</h1>
        </div>
        <Card className="p-12 text-center border-destructive">
          <CreditCard className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Bookings</h3>
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
        <h1 className="text-3xl font-bold">Bookings Management</h1>
          <p className="text-muted-foreground">Manage and track all event bookings</p>
        </div>
      </div>

      {/* Booking Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-muted/20 to-muted/30 border-muted/40 hover:border-primary/20 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-muted/20 to-muted/30 border-muted/40 hover:border-primary/20 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold text-foreground">{stats.confirmed}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-muted/20 to-muted/30 border-muted/40 hover:border-primary/20 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              </div>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-muted/20 to-muted/30 border-muted/40 hover:border-primary/20 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-foreground">{stats.cancelled}</p>
              </div>
              <XCircle className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">₵{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-muted/20 to-muted/30 border-muted/40 hover:border-primary/20 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Booking</p>
                <p className="text-2xl font-bold text-foreground">₵{stats.avgBooking.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue Trends (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="day" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => `₵${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={chartColors.primary}
                  fill={chartColors.primary}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Bookings Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Daily Bookings (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData.dailyBookings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="day" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="confirmed" 
                  stackId="a" 
                  fill={chartColors.accent3}
                  name="Confirmed"
                />
                <Bar 
                  dataKey="pending" 
                  stackId="a" 
                  fill={chartColors.accent4}
                  name="Pending"
                />
                <Bar 
                  dataKey="cancelled" 
                  stackId="a" 
                  fill={chartColors.accent5}
                  name="Cancelled"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-4 items-center flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
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
        <Badge variant="secondary">{totalBookings} Total Bookings</Badge>
      </div>

      {/* Bookings Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Zone & Qty</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Booking Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings?.map((booking) => (
              <TableRow key={booking.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={booking.profiles?.avatar_url || ""} />
                      <AvatarFallback>{getUserInitials(booking.profiles?.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{booking.profiles?.full_name || "Anonymous User"}</div>
                      <div className="text-sm text-muted-foreground">{booking.profiles?.phone || "No phone"}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{booking.events?.title || "Unknown Event"}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {booking.events?.location || "No location"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{booking.zones?.name || "N/A"}</div>
                    <div className="text-sm text-muted-foreground">Qty: {booking.quantity}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-primary text-lg">₵{parseFloat(booking.amount?.toString() || '0').toFixed(2)}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(booking.booking_date), "MMM dd, yyyy")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created: {format(new Date(booking.created_at), "h:mm a")}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(booking.status)} flex items-center gap-1 w-fit`}>
                    {getStatusIcon(booking.status)}
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    {/* View Details Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="gap-1">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Booking Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Customer</p>
                              <p className="font-medium">{booking.profiles?.full_name || "Anonymous"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Phone</p>
                              <p className="font-medium">{booking.profiles?.phone || "No phone"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Event</p>
                              <p className="font-medium">{booking.events?.title || "Unknown Event"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Zone</p>
                              <p className="font-medium">{booking.zones?.name || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Quantity</p>
                              <p className="font-medium">{booking.quantity}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Amount</p>
                              <p className="font-medium">₵{parseFloat(booking.amount?.toString() || '0').toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Status</p>
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Booking Date</p>
                              <p className="font-medium">{format(new Date(booking.booking_date), "MMM dd, yyyy")}</p>
                            </div>
                          </div>
                          
                          {booking.status === 'pending' && (
                            <div className="flex gap-2 pt-4 border-t">
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                disabled={updateBookingMutation.isPending}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                disabled={updateBookingMutation.isPending}
                                className="flex-1"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Quick Status Update Buttons */}
                    {booking.status === 'pending' && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="gap-1 text-green-600 hover:text-green-700">
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Booking</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to confirm this booking?
                                <br />
                                <br />
                                <strong>Customer:</strong> {booking.profiles?.full_name}
                                <br />
                                <strong>Event:</strong> {booking.events?.title}
                                <br />
                                <strong>Amount:</strong> ₵{parseFloat(booking.amount?.toString() || '0').toFixed(2)}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                disabled={updateBookingMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Confirm Booking
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="gap-1 text-red-600 hover:text-red-700">
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this booking? This action cannot be undone.
                                <br />
                                <br />
                                <strong>Customer:</strong> {booking.profiles?.full_name}
                                <br />
                                <strong>Event:</strong> {booking.events?.title}
                                <br />
                                <strong>Amount:</strong> ₵{parseFloat(booking.amount?.toString() || '0').toFixed(2)}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                disabled={updateBookingMutation.isPending}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Cancel Booking
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
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
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalBookings)} of {totalBookings} bookings
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
      
      {bookings?.length === 0 && !isLoading && (
      <Card className="p-12 text-center">
        <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
        <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "all" ? "Try adjusting your search terms or filters" : "No bookings have been made yet"}
        </p>
      </Card>
      )}
    </div>
  );
}
