import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  Building2, 
  CreditCard, 
  TrendingUp, 
  Trophy,
  MessageSquare,
  Gift,
  Star,
  UserCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface DashboardStats {
  totalUsers: number;
  premiumUsers: number;
  organizers: number;
  admins: number;
  totalEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  pastEvents: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  totalClubs: number;
  totalFeeds: number;
  totalConciergeRequests: number;
  activeSubscriptions: number;
}

// Monochromatic color scheme with primary color accents
const chartColors = {
  primary: '#FF4707',
  secondary: '#FF4707CC',
  accent1: '#FF470799', // Primary with opacity
  accent2: '#FF470766', // Primary with opacity
  accent3: '#FF470733', // Primary with opacity
  accent4: '#A1A1AA', // Neutral gray
  accent5: '#71717A', // Darker gray
  muted: '#6B7280'
};

const pieColors = [chartColors.primary, chartColors.accent1, chartColors.accent2, chartColors.accent3, chartColors.accent4];

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [chartData, setChartData] = useState({
    revenueData: [] as any[],
    bookingStatusData: [] as any[],
    userGrowthData: [] as any[],
    monthlyEventsData: [] as any[]
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user statistics
      const { data: userStats } = await supabase
        .from('profiles')
        .select('is_premium, is_organizer, role, created_at');

      // Fetch event statistics
      const { data: eventStats } = await supabase
        .from('events')
        .select('start_date, end_date, created_at');

      // Fetch booking statistics
      const { data: bookingStats } = await supabase
        .from('bookings')
        .select('status, amount, created_at, booking_date');

      // Fetch other counts
      const { count: clubCount } = await supabase
        .from('clubs')
        .select('*', { count: 'exact', head: true });

      const { count: feedCount } = await supabase
        .from('feeds')
        .select('*', { count: 'exact', head: true });

      const { count: conciergeCount } = await supabase
        .from('concierge_requests')
        .select('*', { count: 'exact', head: true });

      const { count: subscriptionCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch recent events
      const { data: recentEventsData } = await supabase
        .from('events')
        .select(`
          id,
          title,
          start_date,
          end_date,
          location,
          clubs(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent bookings with user and event details
      const { data: recentBookingsData } = await supabase
        .from('bookings')
        .select(`
          id,
          amount,
          status,
          booking_date,
          created_at,
          events(title),
          profiles:user_id(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Process statistics
      const now = new Date();
      const totalUsers = userStats?.length || 0;
      const premiumUsers = userStats?.filter(u => u.is_premium).length || 0;
      const organizers = userStats?.filter(u => u.is_organizer).length || 0;
      const admins = userStats?.filter(u => u.role === 'admin').length || 0;

      const totalEvents = eventStats?.length || 0;
      const upcomingEvents = eventStats?.filter(e => new Date(e.start_date) > now).length || 0;
      const ongoingEvents = eventStats?.filter(e => 
        new Date(e.start_date) <= now && new Date(e.end_date) >= now
      ).length || 0;
      const pastEvents = eventStats?.filter(e => new Date(e.end_date) < now).length || 0;

      const totalBookings = bookingStats?.length || 0;
      const confirmedBookings = bookingStats?.filter(b => b.status === 'confirmed').length || 0;
      const pendingBookings = bookingStats?.filter(b => b.status === 'pending').length || 0;
      const cancelledBookings = bookingStats?.filter(b => b.status === 'cancelled').length || 0;
      const totalRevenue = bookingStats?.reduce((sum, b) => sum + (parseFloat(b.amount?.toString() || '0') || 0), 0) || 0;

      setStats({
        totalUsers,
        premiumUsers,
        organizers,
        admins,
        totalEvents,
        upcomingEvents,
        ongoingEvents,
        pastEvents,
        totalBookings,
        confirmedBookings,
        pendingBookings,
        totalRevenue,
        totalClubs: clubCount || 0,
        totalFeeds: feedCount || 0,
        totalConciergeRequests: conciergeCount || 0,
        activeSubscriptions: subscriptionCount || 0
      });

      // Prepare chart data
      const revenueByMonth = generateRevenueData(bookingStats || []);
      const bookingStatusDistribution = [
        { name: 'Confirmed', value: confirmedBookings, color: chartColors.accent3 },
        { name: 'Pending', value: pendingBookings, color: chartColors.accent4 },
        { name: 'Cancelled', value: cancelledBookings, color: chartColors.accent5 }
      ];
      const userGrowthByMonth = generateUserGrowthData(userStats || []);
      const eventsPerMonth = generateEventsData(eventStats || []);

      setChartData({
        revenueData: revenueByMonth,
        bookingStatusData: bookingStatusDistribution,
        userGrowthData: userGrowthByMonth,
        monthlyEventsData: eventsPerMonth
      });

      setRecentEvents(recentEventsData || []);
      setRecentBookings(recentBookingsData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Generate revenue data for the last 6 months
  const generateRevenueData = (bookings: any[]) => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      const monthRevenue = bookings
        .filter(booking => {
          const bookingDate = new Date(booking.created_at);
          return bookingDate.getMonth() === date.getMonth() && 
                 bookingDate.getFullYear() === date.getFullYear() &&
                 booking.status === 'confirmed';
        })
        .reduce((sum, booking) => sum + (parseFloat(booking.amount?.toString() || '0') || 0), 0);

      months.push({
        month: monthName,
        revenue: monthRevenue,
        year: year
      });
    }
    return months;
  };

  // Generate user growth data for the last 6 months
  const generateUserGrowthData = (users: any[]) => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const newUsers = users.filter(user => {
        const userDate = new Date(user.created_at);
        return userDate.getMonth() === date.getMonth() && 
               userDate.getFullYear() === date.getFullYear();
      }).length;

      const totalUsers = users.filter(user => {
        const userDate = new Date(user.created_at);
        return userDate <= date;
      }).length;

      months.push({
        month: monthName,
        newUsers: newUsers,
        totalUsers: totalUsers
      });
    }
    return months;
  };

  // Generate events data for the last 6 months
  const generateEventsData = (events: any[]) => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthEvents = events.filter(event => {
        const eventDate = new Date(event.created_at);
        return eventDate.getMonth() === date.getMonth() && 
               eventDate.getFullYear() === date.getFullYear();
      }).length;

      months.push({
        month: monthName,
        events: monthEvents
      });
    }
    return months;
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

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getEventStatusColor = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > now) return 'text-blue-500';
    if (start <= now && end >= now) return 'text-green-500';
    return 'text-muted-foreground';
  };

  const getEventStatusText = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > now) return 'Upcoming';
    if (start <= now && end >= now) return 'Ongoing';
    return 'Past';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">A Play Admin Dashboard</h1>
        <Badge variant="outline" className="text-primary border-primary text-xs sm:text-sm self-start sm:self-auto">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })}
        </Badge>
      </div>

            {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-gradient-to-br from-muted/20 to-muted/30 border-muted/40 hover:border-primary/20 transition-colors">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground">{stats?.totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                  {stats?.premiumUsers} premium • {stats?.organizers} organizers
                </p>
              </div>
              <Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-muted-foreground self-end sm:self-auto" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-muted/20 to-muted/30 border-muted/40 hover:border-primary/20 transition-colors">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Events</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground">{stats?.totalEvents}</p>
                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                  {stats?.upcomingEvents} upcoming • {stats?.ongoingEvents} live
                </p>
              </div>
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-muted-foreground self-end sm:self-auto" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-muted/20 to-muted/30 border-muted/40 hover:border-primary/20 transition-colors">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Bookings</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground">{stats?.totalBookings}</p>
                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                  {stats?.confirmedBookings} confirmed • {stats?.pendingBookings} pending
                </p>
              </div>
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-muted-foreground self-end sm:self-auto" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/20 col-span-2 lg:col-span-1">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground">₵{stats?.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                  From {stats?.confirmedBookings} confirmed bookings
                </p>
              </div>
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary self-end sm:self-auto" />
            </div>
            </CardContent>
          </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="hidden sm:inline">Revenue Trends (6 Months)</span>
              <span className="sm:hidden">Revenue Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData.revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9CA3AF"
                  fontSize={10}
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={10}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `₵${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={chartColors.primary}
                  strokeWidth={3}
                  dot={{ fill: chartColors.primary, r: 6 }}
                  activeDot={{ r: 8, fill: chartColors.primary }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Booking Status Distribution */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <span className="hidden sm:inline">Booking Status Distribution</span>
              <span className="sm:hidden">Booking Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData.bookingStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.bookingStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
                          <p className="font-medium text-foreground">{payload[0].payload.name}</p>
                          <p className="text-sm text-primary">{payload[0].value} bookings</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => (
                    <span className="text-foreground text-sm">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <span className="hidden sm:inline">User Growth (6 Months)</span>
              <span className="sm:hidden">User Growth</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData.userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9CA3AF"
                  fontSize={10}
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={10}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="newUsers" 
                  stackId="1"
                  stroke={chartColors.accent2}
                  fill={chartColors.accent2}
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Events Chart */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <span className="hidden sm:inline">Events Created (6 Months)</span>
              <span className="sm:hidden">Events Created</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.monthlyEventsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9CA3AF"
                  fontSize={10}
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={10}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="events" 
                  fill={chartColors.accent3}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Clubs</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats?.totalClubs}</p>
              </div>
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Social Posts</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats?.totalFeeds}</p>
              </div>
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Concierge Requests</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats?.totalConciergeRequests}</p>
              </div>
              <Gift className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stats?.activeSubscriptions}</p>
              </div>
              <Star className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Events */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              Recent Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 pt-0">
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/30">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm sm:text-base truncate">{event.title}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{event.location}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {event.clubs?.name && `@ ${event.clubs.name}`}
                    </p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getEventStatusColor(event.start_date, event.end_date)}`}
                    >
                      {getEventStatusText(event.start_date, event.end_date)}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(event.start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No events found</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 pt-0">
            {recentBookings.length > 0 ? (
              recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/30">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm sm:text-base truncate">
                      {booking.events?.title || 'Unknown Event'}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {booking.profiles?.full_name || 'Anonymous User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.booking_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="font-bold text-primary text-sm sm:text-base">₵{parseFloat(booking.amount).toFixed(2)}</p>
                    <Badge 
                      variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                      className="mt-1 text-xs"
                    >
                      {booking.status}
                    </Badge>
                </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No bookings found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
