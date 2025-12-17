import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Gift, 
  User, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Filter,
  MessageSquare,
  Star,
  Bell
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConciergeRequest {
  id: string;
  user_id: string;
  category: string;
  service_name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  is_urgent: boolean | null;
  requested_at: string | null;
  additional_details: any;
  created_at: string | null;
  updated_at: string | null;
  profiles?: {
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
}

interface ConciergeStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  urgent: number;
}

export function ConciergeView() {
  const [requests, setRequests] = useState<ConciergeRequest[]>([]);
  const [stats, setStats] = useState<ConciergeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ConciergeRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchConciergeRequests();
  }, []);

  const fetchConciergeRequests = async () => {
    try {
      setLoading(true);

      // Fetch concierge requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('concierge_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        throw requestsError;
      }

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        setStats({
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0,
          urgent: 0
        });
        return;
      }

      // Fetch user profiles for the requests
      const userIds = [...new Set(requestsData.map(r => r.user_id))];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Profiles error:', profilesError);
        // Continue without profiles if there's an error
      }

      // Create a map of profiles by user_id
      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

      // Combine requests with profile data
      const requestsWithProfiles = requestsData.map(request => ({
        ...request,
        profiles: profilesMap.get(request.user_id) || null
      }));

      setRequests(requestsWithProfiles as ConciergeRequest[]);

      // Calculate statistics
      const total = requestsWithProfiles.length;
      const pending = requestsWithProfiles.filter(r => r.status === 'pending').length;
      const inProgress = requestsWithProfiles.filter(r => r.status === 'in_progress').length;
      const completed = requestsWithProfiles.filter(r => r.status === 'completed').length;
      const cancelled = requestsWithProfiles.filter(r => r.status === 'cancelled').length;
      const urgent = requestsWithProfiles.filter(r => r.is_urgent === true).length;

      setStats({
        total,
        pending,
        inProgress,
        completed,
        cancelled,
        urgent
      });

    } catch (error) {
      console.error('Error in fetchConciergeRequests:', error);
      toast.error(`Failed to load concierge requests: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('concierge_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(`Request ${newStatus.replace('_', ' ')} successfully`);
      fetchConciergeRequests(); // Refresh data
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Failed to update request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'dining': 'bg-orange-500/10 text-orange-600',
      'transportation': 'bg-blue-500/10 text-blue-600',
      'entertainment': 'bg-purple-500/10 text-purple-600',
      'accommodation': 'bg-green-500/10 text-green-600',
      'shopping': 'bg-pink-500/10 text-pink-600',
      'other': 'bg-gray-500/10 text-gray-600'
    };
    return colors[category.toLowerCase() as keyof typeof colors] || colors.other;
  };

  const filteredRequests = requests.filter(request => {
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || request.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch = searchTerm === "" || 
      request.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const uniqueCategories = [...new Set(requests.map(r => r.category))];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Concierge Services</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Concierge Services</h1>
          <p className="text-muted-foreground">Manage and track all concierge service requests</p>
        </div>
        <Button onClick={fetchConciergeRequests} disabled={loading}>
          {loading ? "Loading..." : "Refresh Data"}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-foreground">{stats?.total}</p>
              </div>
              <Gift className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{stats?.pending}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-foreground">{stats?.inProgress}</p>
              </div>
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">{stats?.completed}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-foreground">{stats?.cancelled}</p>
              </div>
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
      <div>
                <p className="text-sm font-medium text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold text-foreground">{stats?.urgent}</p>
              </div>
              <Bell className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by service, description, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category.toLowerCase()}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{request.profiles?.full_name || 'Unknown User'}</p>
                          <p className="text-xs text-muted-foreground">{request.profiles?.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.service_name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {request.description}
                        </p>
                        {request.is_urgent && (
                          <Badge variant="destructive" className="mt-1">
                            <Bell className="h-3 w-3 mr-1" />
                            Urgent
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(request.category)}>
                        {request.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          {request.status.replace('_', ' ')}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {new Date(request.requested_at || request.created_at || '').toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.requested_at || request.created_at || '').toLocaleTimeString()}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Request Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Customer</p>
                                <p className="font-medium">{selectedRequest?.profiles?.full_name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{selectedRequest?.profiles?.phone}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Service</p>
                                <p className="font-medium">{selectedRequest?.service_name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Category</p>
                                <Badge className={getCategoryColor(selectedRequest?.category || '')}>
                                  {selectedRequest?.category}
                                </Badge>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm text-muted-foreground">Description</p>
                              <div className="mt-1 p-3 bg-muted rounded-lg">
                                <p className="text-sm">{selectedRequest?.description}</p>
                              </div>
                            </div>

                            {selectedRequest?.additional_details && (
                              <div>
                                <p className="text-sm text-muted-foreground">Additional Details</p>
                                <div className="mt-1 p-3 bg-muted rounded-lg">
                                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                                    {JSON.stringify(selectedRequest.additional_details, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t">
                              <div>
                                <p className="text-sm text-muted-foreground">Current Status</p>
                                <Badge className={getStatusColor(selectedRequest?.status || '')}>
                                  {selectedRequest?.status?.replace('_', ' ')}
                                </Badge>
                              </div>
                              
                              {selectedRequest?.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateRequestStatus(selectedRequest.id, 'in_progress')}
                                  >
                                    Start
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => updateRequestStatus(selectedRequest.id, 'cancelled')}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              )}
                              
                              {selectedRequest?.status === 'in_progress' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateRequestStatus(selectedRequest.id, 'completed')}
                                  >
                                    Complete
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => updateRequestStatus(selectedRequest.id, 'cancelled')}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredRequests.length === 0 && (
              <div className="text-center py-8">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No concierge requests found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
