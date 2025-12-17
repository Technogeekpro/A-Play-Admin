import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Trophy, 
  User, 
  Plus,
  Minus,
  TrendingUp,
  Star,
  Gift,
  Coins,
  Eye,
  Award,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  available_points: number;
  used_points: number;
  last_updated: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
  } | null;
}

interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
  metadata: any;
}

interface PointsStats {
  totalPointsIssued: number;
  totalPointsUsed: number;
  totalPointsAvailable: number;
  totalUsers: number;
  avgPointsPerUser: number;
  recentTransactions: number;
}

interface MembershipTier {
  id: string;
  name: string;
  min_points: number;
  max_points: number | null;
  benefits: string | null;
  created_at: string;
}

export function PointsView() {
  const [userPoints, setUserPoints] = useState<UserPoints[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [membershipTiers, setMembershipTiers] = useState<MembershipTier[]>([]);
  const [stats, setStats] = useState<PointsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserPoints | null>(null);
  const [isAddPointsOpen, setIsAddPointsOpen] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState(0);
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionType, setTransactionType] = useState("admin_credit");

  useEffect(() => {
    fetchPointsData();
  }, []);

  const fetchPointsData = async () => {
    try {
      setLoading(true);

      // Fetch user points with profiles
      const { data: userPointsData, error: userPointsError } = await supabase
        .from('user_points')
        .select(`
          id,
          user_id,
          total_points,
          available_points,
          used_points,
          last_updated,
          profiles:user_id (
            full_name,
            avatar_url,
            phone
          )
        `)
        .order('total_points', { ascending: false });

      if (userPointsError) throw userPointsError;

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('point_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (transactionsError) throw transactionsError;

      // Fetch membership tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from('membership_tiers')
        .select('*')
        .order('min_points');

      if (tiersError) throw tiersError;

             setUserPoints((userPointsData as unknown as UserPoints[]) || []);
      setTransactions(transactionsData || []);
      setMembershipTiers(tiersData || []);

      // Calculate statistics
      const totalPointsIssued = userPointsData?.reduce((sum, up) => sum + up.total_points, 0) || 0;
      const totalPointsUsed = userPointsData?.reduce((sum, up) => sum + up.used_points, 0) || 0;
      const totalPointsAvailable = userPointsData?.reduce((sum, up) => sum + up.available_points, 0) || 0;
      const totalUsers = userPointsData?.length || 0;
      const avgPointsPerUser = totalUsers > 0 ? totalPointsIssued / totalUsers : 0;
      const recentTransactions = transactionsData?.filter(t => 
        new Date(t.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length || 0;

      setStats({
        totalPointsIssued,
        totalPointsUsed,
        totalPointsAvailable,
        totalUsers,
        avgPointsPerUser,
        recentTransactions
      });

    } catch (error) {
      console.error('Error fetching points data:', error);
      toast.error('Failed to load points data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoints = async () => {
    if (!selectedUser || pointsToAdd === 0) return;

    try {
      // Add point transaction
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert({
          user_id: selectedUser.user_id,
          points: pointsToAdd,
          transaction_type: transactionType,
          description: transactionDescription || `Admin ${transactionType.replace('_', ' ')}`
        });

      if (transactionError) throw transactionError;

      // Update user points
      const newTotalPoints = selectedUser.total_points + (pointsToAdd > 0 ? pointsToAdd : 0);
      const newAvailablePoints = selectedUser.available_points + pointsToAdd;
      const newUsedPoints = pointsToAdd < 0 ? selectedUser.used_points + Math.abs(pointsToAdd) : selectedUser.used_points;

      const { error: updateError } = await supabase
        .from('user_points')
        .update({
          total_points: newTotalPoints,
          available_points: Math.max(0, newAvailablePoints),
          used_points: newUsedPoints,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', selectedUser.user_id);

      if (updateError) throw updateError;

      toast.success(`Successfully ${pointsToAdd > 0 ? 'added' : 'deducted'} ${Math.abs(pointsToAdd)} points`);
      setIsAddPointsOpen(false);
      setPointsToAdd(0);
      setTransactionDescription("");
      fetchPointsData(); // Refresh data
    } catch (error) {
      console.error('Error updating points:', error);
      toast.error('Failed to update points');
    }
  };

  const getUserMembershipTier = (points: number) => {
    const tier = membershipTiers.find(t => 
      points >= t.min_points && (t.max_points === null || points <= t.max_points)
    );
    return tier || { name: 'Bronze', min_points: 0 };
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'earned':
      case 'bonus':
      case 'admin_credit':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'spent':
      case 'admin_debit':
        return 'bg-red-500/10 text-red-600 border-red-200';
      case 'refund':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Points System</h1>
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
          <h1 className="text-3xl font-bold text-foreground">Points System Management</h1>
          <p className="text-muted-foreground">Manage user points, rewards, and membership tiers</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold text-foreground">{stats?.totalPointsIssued.toLocaleString()}</p>
              </div>
              <Coins className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-foreground">{stats?.totalPointsAvailable.toLocaleString()}</p>
              </div>
              <Trophy className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Used Points</p>
                <p className="text-2xl font-bold text-foreground">{stats?.totalPointsUsed.toLocaleString()}</p>
              </div>
              <Gift className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground">{stats?.totalUsers}</p>
              </div>
              <User className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg/User</p>
                <p className="text-2xl font-bold text-foreground">{Math.round(stats?.avgPointsPerUser || 0)}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Txns</p>
                <p className="text-2xl font-bold text-foreground">{stats?.recentTransactions}</p>
              </div>
              <Star className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Points Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Points Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              User Points Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Total Points</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userPoints.map((userPoint, index) => {
                    const tier = getUserMembershipTier(userPoint.total_points);
                    return (
                      <TableRow key={userPoint.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">#{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{userPoint.profiles?.full_name || 'Unknown User'}</p>
                              <p className="text-xs text-muted-foreground">{userPoint.profiles?.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            <Award className="h-3 w-3 mr-1" />
                            {tier.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-bold text-primary">{userPoint.total_points.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Used: {userPoint.used_points}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-green-600">{userPoint.available_points.toLocaleString()}</p>
                        </TableCell>
                        <TableCell>
                          <Dialog open={isAddPointsOpen && selectedUser?.id === userPoint.id} onOpenChange={setIsAddPointsOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(userPoint)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Manage Points - {selectedUser?.profiles?.full_name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                  <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">Total</p>
                                    <p className="text-lg font-bold">{selectedUser?.total_points}</p>
                                  </div>
                                  <div className="p-3 bg-green-500/10 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Available</p>
                                    <p className="text-lg font-bold text-green-600">{selectedUser?.available_points}</p>
                                  </div>
                                  <div className="p-3 bg-red-500/10 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Used</p>
                                    <p className="text-lg font-bold text-red-600">{selectedUser?.used_points}</p>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <Label htmlFor="transaction-type">Transaction Type</Label>
                                    <Select value={transactionType} onValueChange={setTransactionType}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="admin_credit">Admin Credit</SelectItem>
                                        <SelectItem value="admin_debit">Admin Debit</SelectItem>
                                        <SelectItem value="bonus">Bonus</SelectItem>
                                        <SelectItem value="adjustment">Adjustment</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label htmlFor="points">Points Amount</Label>
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPointsToAdd(Math.max(0, pointsToAdd - 10))}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <Input
                                        id="points"
                                        type="number"
                                        value={pointsToAdd}
                                        onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                                        className="text-center"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPointsToAdd(pointsToAdd + 10)}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  <div>
                                    <Label htmlFor="description">Description (optional)</Label>
                                    <Textarea
                                      id="description"
                                      value={transactionDescription}
                                      onChange={(e) => setTransactionDescription(e.target.value)}
                                      placeholder="Reason for this transaction..."
                                      rows={3}
                                    />
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddPointsOpen(false)}>
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={handleAddPoints}
                                  disabled={pointsToAdd === 0}
                                >
                                  {pointsToAdd > 0 ? 'Add' : 'Deduct'} {Math.abs(pointsToAdd)} Points
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {transaction.points > 0 ? '+' : ''}{transaction.points} points
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.description || transaction.transaction_type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
                  {transaction.transaction_type.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Membership Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Membership Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {membershipTiers.map((tier) => (
              <Card key={tier.id} className="bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <h3 className="font-bold text-lg">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tier.min_points.toLocaleString()} 
                      {tier.max_points ? ` - ${tier.max_points.toLocaleString()}` : '+'} points
                    </p>
                    {tier.benefits && (
                      <p className="text-xs text-muted-foreground">{tier.benefits}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
