import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
  CreditCard, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Star,
  Crown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  BarChart3,
  Package,
  Zap,
  Award,
  Trash2,
  Save
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function SubscriptionsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    duration_days: 30,
    price: "",
    currency: "GHS",
    features: [
      { key: "ad_free", value: true, type: "boolean" as const },
      { key: "vip_support", value: true, type: "boolean" as const },
      { key: "max_bookings", value: 10, type: "number" as const },
      { key: "exclusive_events", value: true, type: "boolean" as const },
      { key: "priority_booking", value: true, type: "boolean" as const }
    ] as Array<{ key: string; value: string | number | boolean; type: "text" | "number" | "boolean" }>,
    is_active: true
  });
  const queryClient = useQueryClient();

  // Mutation for creating a new subscription plan
  const createPlanMutation = useMutation({
    mutationFn: async (planData: typeof newPlan) => {
      const featuresObject = planData.features.reduce((acc, feature) => {
        acc[feature.key] = feature.value;
        return acc;
      }, {} as Record<string, any>);

      const { error } = await supabase
        .from("subscription_plans")
        .insert({
          name: planData.name,
          description: planData.description,
          duration_days: planData.duration_days,
          price: parseFloat(planData.price),
          currency: planData.currency,
          features: featuresObject,
          is_active: planData.is_active
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      setIsCreatePlanOpen(false);
      setNewPlan({
        name: "",
        description: "",
        duration_days: 30,
        price: "",
        currency: "GHS",
        features: [
          { key: "ad_free", value: true, type: "boolean" as const },
          { key: "vip_support", value: true, type: "boolean" as const },
          { key: "max_bookings", value: 10, type: "number" as const },
          { key: "exclusive_events", value: true, type: "boolean" as const },
          { key: "priority_booking", value: true, type: "boolean" as const }
        ],
        is_active: true
      });
      toast.success("Subscription plan created successfully");
    },
    onError: (error) => {
      console.error("Error creating plan:", error);
      toast.error("Failed to create subscription plan");
    },
  });

  // Fetch subscription plans
  const { data: plansData } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user subscriptions with pagination
  const { data: subscriptionsData, isLoading, error: queryError } = useQuery({
    queryKey: ["user-subscriptions", searchTerm, statusFilter, currentPage, pageSize],
    queryFn: async () => {
      // First, get total count with filters
      let countQuery = supabase
        .from("user_subscriptions")
        .select("*", { count: "exact", head: true });

      if (statusFilter !== "all") {
        countQuery = countQuery.eq("status", statusFilter);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      // Then get paginated subscriptions
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("user_subscriptions")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: subscriptionsData, error: subscriptionsError } = await query;
      if (subscriptionsError) throw subscriptionsError;

      if (!subscriptionsData) {
        return {
          subscriptions: [],
          total: 0,
          totalPages: 0,
          stats: { total: 0, active: 0, expired: 0, cancelled: 0, totalRevenue: 0, avgRevenue: 0 }
        };
      }

      // Get user profiles for subscriptions
      const userIds = [...new Set(subscriptionsData.map(s => s.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, phone")
        .in("id", userIds);

      // Get overall statistics
      const { data: allSubscriptionsForStats } = await supabase
        .from("user_subscriptions")
        .select("status, amount");

      const stats = {
        total: count || 0,
        active: allSubscriptionsForStats?.filter(s => s.status === 'active').length || 0,
        expired: allSubscriptionsForStats?.filter(s => s.status === 'expired').length || 0,
        cancelled: allSubscriptionsForStats?.filter(s => s.status === 'cancelled').length || 0,
        totalRevenue: allSubscriptionsForStats?.reduce((sum, s) => sum + (parseFloat(String(s.amount || '0')) || 0), 0) || 0,
        avgRevenue: 0
      };
      stats.avgRevenue = stats.total > 0 ? stats.totalRevenue / stats.total : 0;

      // Combine subscriptions with their profile data
      const subscriptionsWithDetails = subscriptionsData.map(subscription => ({
        ...subscription,
        profiles: profilesData?.find(p => p.id === subscription.user_id) || null
      }));

      // Apply search filter on combined data
      const filteredSubscriptions = searchTerm
        ? subscriptionsWithDetails.filter(subscription =>
            subscription.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subscription.subscription_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subscription.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : subscriptionsWithDetails;

      return {
        subscriptions: filteredSubscriptions,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        stats
      };
    },
    retry: 1,
  });

  // Fetch payment analytics
  const { data: paymentsData } = useQuery({
    queryKey: ["subscription-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_payments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const subscriptions = (subscriptionsData as any)?.subscriptions || [];
  const totalSubscriptions = (subscriptionsData as any)?.total || 0;
  const totalPages = (subscriptionsData as any)?.totalPages || 0;
  const stats = (subscriptionsData as any)?.stats || { total: 0, active: 0, expired: 0, cancelled: 0, totalRevenue: 0, avgRevenue: 0 };

  const plans = plansData || [];
  const payments = paymentsData || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'expired':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-3 w-3" />;
      case 'expired':
        return <Clock className="h-3 w-3" />;
      case 'cancelled':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
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

  const addFeature = () => {
    setNewPlan(prev => ({
      ...prev,
      features: [...prev.features, { key: "", value: "", type: "text" as const }]
    }));
  };

  const removeFeature = (index: number) => {
    setNewPlan(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, field: "key" | "value" | "type", value: any) => {
    setNewPlan(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => 
        i === index ? { ...feature, [field]: value } : feature
      )
    }));
  };

  const handleCreatePlan = () => {
    if (!newPlan.name || !newPlan.description || !newPlan.price) {
      toast.error("Please fill in all required fields");
      return;
    }
    createPlanMutation.mutate(newPlan);
  };

  const getRevenueByMonth = () => {
    if (!payments.length) return [];
    
    const monthlyRevenue = payments.reduce((acc, payment) => {
      if (payment.payment_status === 'success') {
        const month = format(new Date(payment.payment_date), 'MMM yyyy');
        acc[month] = (acc[month] || 0) + parseFloat(String(payment.amount || '0'));
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue
    })).slice(-6); // Last 6 months
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Subscription Management</h1>
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
          <h1 className="text-3xl font-bold">Subscription Management</h1>
        </div>
        <Card className="p-12 text-center border-destructive">
          <CreditCard className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Subscriptions</h3>
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
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">Manage subscription plans, track user subscriptions, and analyze revenue</p>
        </div>
      </div>

      {/* Subscription Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Subscriptions</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-foreground">{stats.active}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-foreground">{stats.expired}</p>
              </div>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-foreground">{stats.cancelled}</p>
              </div>
              <XCircle className="h-5 w-5 text-red-500" />
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

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Revenue</p>
                <p className="text-2xl font-bold text-foreground">₵{stats.avgRevenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">User Subscriptions</TabsTrigger>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Active Subscription Plans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plans.filter(plan => plan.is_active).map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-sm text-muted-foreground">{plan.duration_days} days</div>
                      </div>
                      <div className="text-lg font-bold text-primary">₵{parseFloat(plan.price).toFixed(2)}</div>
                    </div>
                  ))}
                  {plans.filter(plan => plan.is_active).length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No active plans available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Recent Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                                                 <div className="font-medium">₵{parseFloat(String(payment.amount)).toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">{format(new Date(payment.payment_date), "MMM dd, yyyy")}</div>
                      </div>
                      <Badge className={payment.payment_status === 'success' 
                        ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                        : 'bg-red-500/10 text-red-600 border-red-500/20'
                      }>
                        {payment.payment_status}
                      </Badge>
                    </div>
                  ))}
                  {payments.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No recent payments</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex gap-4 items-center flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subscriptions..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
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
            <Badge variant="secondary">{totalSubscriptions} Total Subscriptions</Badge>
          </div>

          {/* User Subscriptions Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions?.map((subscription) => (
                  <TableRow key={subscription.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={subscription.profiles?.avatar_url || ""} />
                          <AvatarFallback>{getUserInitials(subscription.profiles?.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{subscription.profiles?.full_name || "Anonymous User"}</div>
                          <div className="text-sm text-muted-foreground">{subscription.profiles?.phone || "No phone"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <div>
                          <div className="font-medium">{subscription.subscription_type}</div>
                          <div className="text-sm text-muted-foreground">{subscription.currency}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                                             <div className="font-bold text-primary text-lg">₵{parseFloat(String(subscription.amount || '0')).toFixed(2)}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">
                          {format(new Date(subscription.start_date), "MMM dd, yyyy")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          to {format(new Date(subscription.end_date), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(subscription.status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(subscription.status)}
                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium">{subscription.payment_method}</div>
                        <div className="text-xs text-muted-foreground">{subscription.payment_reference?.slice(0, 20)}...</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="gap-1">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Subscription Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Customer</p>
                                  <p className="font-medium">{subscription.profiles?.full_name || "Anonymous"}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Phone</p>
                                  <p className="font-medium">{subscription.profiles?.phone || "No phone"}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Plan</p>
                                  <p className="font-medium">{subscription.subscription_type}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Amount</p>
                                  <p className="font-medium">₵{parseFloat(subscription.amount?.toString() || '0').toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Status</p>
                                  <Badge className={getStatusColor(subscription.status)}>
                                    {subscription.status}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Auto Renew</p>
                                  <p className="font-medium">{subscription.is_auto_renew ? "Yes" : "No"}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Start Date</p>
                                  <p className="font-medium">{format(new Date(subscription.start_date), "MMM dd, yyyy")}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">End Date</p>
                                  <p className="font-medium">{format(new Date(subscription.end_date), "MMM dd, yyyy")}</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
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
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalSubscriptions)} of {totalSubscriptions} subscriptions
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
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Subscription Plans</h3>
              <p className="text-muted-foreground">Manage available subscription plans and pricing</p>
            </div>
            <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Subscription Plan</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Basic Plan Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plan-name">Plan Name *</Label>
                      <Input
                        id="plan-name"
                        value={newPlan.name}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Premium Monthly"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plan-duration">Duration (Days) *</Label>
                      <Input
                        id="plan-duration"
                        type="number"
                        value={newPlan.duration_days}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 30 }))}
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan-description">Description *</Label>
                    <Textarea
                      id="plan-description"
                      value={newPlan.description}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the benefits and features of this plan..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plan-price">Price *</Label>
                      <Input
                        id="plan-price"
                        type="number"
                        step="0.01"
                        value={newPlan.price}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="49.99"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plan-currency">Currency</Label>
                      <Select value={newPlan.currency} onValueChange={(value) => setNewPlan(prev => ({ ...prev, currency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GHS">GHS (Ghanaian Cedi)</SelectItem>
                          <SelectItem value="USD">USD (US Dollar)</SelectItem>
                          <SelectItem value="EUR">EUR (Euro)</SelectItem>
                          <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Plan Features */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Plan Features</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addFeature} className="gap-1">
                        <Plus className="h-3 w-3" />
                        Add Feature
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {newPlan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="flex-1">
                            <Input
                              placeholder="Feature name (e.g., ad_free)"
                              value={feature.key}
                              onChange={(e) => updateFeature(index, "key", e.target.value)}
                            />
                          </div>
                          <div className="w-32">
                            <Select value={feature.type} onValueChange={(value) => {
                              updateFeature(index, "type", value);
                              // Reset value when type changes
                              if (value === "boolean") updateFeature(index, "value", true);
                              else if (value === "number") updateFeature(index, "value", 0);
                              else updateFeature(index, "value", "");
                            }}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="boolean">Boolean</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="text">Text</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-32">
                            {feature.type === "boolean" ? (
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={feature.value as boolean}
                                  onCheckedChange={(checked) => updateFeature(index, "value", checked)}
                                />
                                <span className="text-sm">{feature.value ? "Yes" : "No"}</span>
                              </div>
                            ) : feature.type === "number" ? (
                              <Input
                                type="number"
                                value={feature.value as number}
                                onChange={(e) => updateFeature(index, "value", parseInt(e.target.value) || 0)}
                                placeholder="0"
                              />
                            ) : (
                              <Input
                                value={feature.value as string}
                                onChange={(e) => updateFeature(index, "value", e.target.value)}
                                placeholder="Value"
                              />
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFeature(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plan Status */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newPlan.is_active}
                      onCheckedChange={(checked) => setNewPlan(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label>Make this plan active immediately</Label>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreatePlanOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePlan} 
                    disabled={createPlanMutation.isPending}
                    className="gap-2"
                  >
                    {createPlanMutation.isPending ? (
                      <>Creating...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Create Plan
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.is_active ? 'ring-2 ring-primary/20' : 'opacity-75'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {plan.name}
                    </CardTitle>
                    {plan.is_active && (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    ₵{parseFloat(plan.price).toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground">/{plan.duration_days} days</span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Features:</div>
                    {plan.features && typeof plan.features === 'object' && (
                      <div className="space-y-2">
                        {Object.entries(plan.features as Record<string, any>).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            {value === true ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : value === false ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <Zap className="h-4 w-4 text-blue-500" />
                            )}
                            <span>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {value.toString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button 
                      variant={plan.is_active ? "destructive" : "default"}
                      size="sm" 
                      className="flex-1"
                    >
                      {plan.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Revenue Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getRevenueByMonth().map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="font-medium">{item.month}</div>
                      <div className="text-lg font-bold text-primary">₵{item.revenue.toFixed(2)}</div>
                    </div>
                  ))}
                  {getRevenueByMonth().length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No revenue data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  Subscription Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">Active Rate</div>
                      <div className="text-sm text-muted-foreground">Percentage of active subscriptions</div>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">Churn Rate</div>
                      <div className="text-sm text-muted-foreground">Percentage of cancelled subscriptions</div>
                    </div>
                    <div className="text-lg font-bold text-red-600">
                      {stats.total > 0 ? ((stats.cancelled / stats.total) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">Monthly Revenue</div>
                      <div className="text-sm text-muted-foreground">Average monthly recurring revenue</div>
                    </div>
                    <div className="text-lg font-bold text-primary">
                      ₵{stats.active > 0 ? (stats.totalRevenue / Math.max(1, getRevenueByMonth().length)).toFixed(2) : '0.00'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {subscriptions?.length === 0 && !isLoading && activeTab === "subscriptions" && (
        <Card className="p-12 text-center">
          <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No subscriptions found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "all" ? "Try adjusting your search terms or filters" : "No users have subscribed yet"}
          </p>
        </Card>
      )}
    </div>
  );
}
