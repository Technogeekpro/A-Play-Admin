import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Mic,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  Star,
  Play,
  Calendar,
  Tag,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Archive,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface YoutubeContent {
  id: string;
  title: string;
  description?: string;
  youtube_url: string;
  thumbnail_url?: string;
  cover_image?: string;
  duration?: string;
  published_at?: string;
  category: string;
  tags: string[];
  is_featured: boolean;
  view_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface PodcastStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  featured: number;
}

export function PodcastView() {
  const [podcasts, setPodcasts] = useState<YoutubeContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedPodcast, setSelectedPodcast] = useState<YoutubeContent | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [stats, setStats] = useState<PodcastStats | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    youtube_url: "",
    thumbnail_url: "",
    cover_image: "",
    duration: "",
    published_at: "",
    category: "podcast",
    tags: "",
    is_featured: false,
    status: "published"
  });

  const categories = ["podcast", "interview", "tutorial", "discussion"];
  const statuses = ["draft", "published", "archived"];

  useEffect(() => {
    fetchPodcasts();
  }, []);

  const fetchPodcasts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("youtube_content")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPodcasts(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error("Error fetching podcasts:", error);
      toast.error("Failed to fetch podcasts");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: YoutubeContent[]) => {
    const stats = {
      total: data.length,
      published: data.filter(p => p.status === "published").length,
      draft: data.filter(p => p.status === "draft").length,
      archived: data.filter(p => p.status === "archived").length,
      featured: data.filter(p => p.is_featured).length
    };
    setStats(stats);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      youtube_url: "",
      thumbnail_url: "",
      cover_image: "",
      duration: "",
      published_at: "",
      category: "podcast",
      tags: "",
      is_featured: false,
      status: "published"
    });
    setCoverImageFile(null);
    setCoverImagePreview(null);
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadCoverImage = async (file: File): Promise<string | null> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload images');
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const fileName = `${user.id}/${timestamp}-${randomId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('podcast-cover-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload cover image');
        return null;
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('podcast-cover-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast.error('Failed to upload cover image');
      return null;
    }
  };

  const validateYouTubeUrl = (url: string) => {
    const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/;
    return youtubeRegex.test(url);
  };

  const handleCreate = async () => {
    try {
      if (!formData.title.trim()) {
        toast.error("Title is required");
        return;
      }

      if (!validateYouTubeUrl(formData.youtube_url)) {
        toast.error("Please enter a valid YouTube URL");
        return;
      }

      const tagsArray = formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag);
      
      let coverImagePath = null;
      if (coverImageFile) {
        coverImagePath = await uploadCoverImage(coverImageFile);
        if (!coverImagePath) {
          return; // Upload failed, error already shown
        }
      }

      const { error } = await supabase
        .from("youtube_content")
        .insert({
          title: formData.title,
          description: formData.description || null,
          youtube_url: formData.youtube_url,
          thumbnail_url: formData.thumbnail_url || null,
          cover_image: coverImagePath,
          duration: formData.duration || null,
          published_at: formData.published_at || null,
          category: formData.category,
          tags: tagsArray,
          is_featured: formData.is_featured,
          status: formData.status
        });

      if (error) throw error;

      toast.success("Podcast created successfully!");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchPodcasts();
    } catch (error) {
      console.error("Error creating podcast:", error);
      toast.error("Failed to create podcast");
    }
  };

  const handleEdit = async () => {
    try {
      if (!selectedPodcast) return;

      if (!formData.title.trim()) {
        toast.error("Title is required");
        return;
      }

      if (!validateYouTubeUrl(formData.youtube_url)) {
        toast.error("Please enter a valid YouTube URL");
        return;
      }

      const tagsArray = formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag);
      
      let coverImagePath = formData.cover_image; // Keep existing if no new file
      if (coverImageFile) {
        // Delete old cover image if exists
        if (selectedPodcast.cover_image) {
          // Extract file path from URL for deletion
          const urlParts = selectedPodcast.cover_image.split('/podcast-cover-images/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            await supabase.storage
              .from('podcast-cover-images')
              .remove([filePath]);
          }
        }
        
        coverImagePath = await uploadCoverImage(coverImageFile);
        if (!coverImagePath) {
          return; // Upload failed, error already shown
        }
      }

      const { error } = await supabase
        .from("youtube_content")
        .update({
          title: formData.title,
          description: formData.description || null,
          youtube_url: formData.youtube_url,
          thumbnail_url: formData.thumbnail_url || null,
          cover_image: coverImagePath,
          duration: formData.duration || null,
          published_at: formData.published_at || null,
          category: formData.category,
          tags: tagsArray,
          is_featured: formData.is_featured,
          status: formData.status
        })
        .eq("id", selectedPodcast.id);

      if (error) throw error;

      toast.success("Podcast updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedPodcast(null);
      resetForm();
      fetchPodcasts();
    } catch (error) {
      console.error("Error updating podcast:", error);
      toast.error("Failed to update podcast");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this podcast?")) return;

    try {
      // Find the podcast to get cover image URL
      const podcast = podcasts.find(p => p.id === id);
      
      // Delete cover image from storage if exists
      if (podcast?.cover_image) {
        const urlParts = podcast.cover_image.split('/podcast-cover-images/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage
            .from('podcast-cover-images')
            .remove([filePath]);
        }
      }

      const { error } = await supabase
        .from("youtube_content")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Podcast deleted successfully!");
      fetchPodcasts();
    } catch (error) {
      console.error("Error deleting podcast:", error);
      toast.error("Failed to delete podcast");
    }
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("youtube_content")
        .update({ is_featured: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Podcast ${!currentStatus ? 'featured' : 'unfeatured'} successfully!`);
      fetchPodcasts();
    } catch (error) {
      console.error("Error toggling featured status:", error);
      toast.error("Failed to update featured status");
    }
  };

  const openEditDialog = (podcast: YoutubeContent) => {
    setSelectedPodcast(podcast);
    setFormData({
      title: podcast.title,
      description: podcast.description || "",
      youtube_url: podcast.youtube_url,
      thumbnail_url: podcast.thumbnail_url || "",
      cover_image: podcast.cover_image || "",
      duration: podcast.duration || "",
      published_at: podcast.published_at ? new Date(podcast.published_at).toISOString().split('T')[0] : "",
      category: podcast.category,
      tags: podcast.tags ? podcast.tags.join(", ") : "",
      is_featured: podcast.is_featured,
      status: podcast.status
    });
    
    // Set cover image preview if exists
    setCoverImageFile(null);
    if (podcast.cover_image) {
      setCoverImagePreview(podcast.cover_image);
    } else {
      setCoverImagePreview(null);
    }
    
    setIsEditDialogOpen(true);
  };

  const filteredPodcasts = podcasts.filter(podcast => {
    const matchesSearch = podcast.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         podcast.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         podcast.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || podcast.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || podcast.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800 border-green-200";
      case "draft": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "archived": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "podcast": return "bg-blue-100 text-blue-800 border-blue-200";
      case "interview": return "bg-purple-100 text-purple-800 border-purple-200";
      case "tutorial": return "bg-orange-100 text-orange-800 border-orange-200";
      case "discussion": return "bg-teal-100 text-teal-800 border-teal-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Mic className="h-8 w-8 text-primary" />
            Podcast Management
          </h1>
          <p className="text-muted-foreground">Manage YouTube content and podcast episodes</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchPodcasts} disabled={loading} variant="outline">
            {loading ? "Loading..." : "Refresh"}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Podcast
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Podcast</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Enter podcast title"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="youtube_url">YouTube URL *</Label>
                    <Input
                      id="youtube_url"
                      value={formData.youtube_url}
                      onChange={(e) => setFormData({...formData, youtube_url: e.target.value})}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(status => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      placeholder="e.g., 45:30"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="published_at">Published Date</Label>
                    <Input
                      id="published_at"
                      type="date"
                      value={formData.published_at}
                      onChange={(e) => setFormData({...formData, published_at: e.target.value})}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                    <Input
                      id="thumbnail_url"
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="cover_image">Cover Image</Label>
                    <div className="space-y-2">
                      <Input
                        id="cover_image"
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageChange}
                        className="cursor-pointer"
                      />
                      {coverImagePreview && (
                        <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={coverImagePreview}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      placeholder="technology, startup, business"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Enter podcast description"
                      rows={3}
                    />
                  </div>
                  
                  <div className="col-span-2 flex items-center space-x-2">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({...formData, is_featured: checked})}
                    />
                    <Label htmlFor="is_featured">Featured Podcast</Label>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>
                    Create Podcast
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <Mic className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold text-foreground">{stats.published}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Draft</p>
                  <p className="text-2xl font-bold text-foreground">{stats.draft}</p>
                </div>
                <FileText className="h-6 w-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border-gray-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Archived</p>
                  <p className="text-2xl font-bold text-foreground">{stats.archived}</p>
                </div>
                <Archive className="h-6 w-6 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Featured</p>
                  <p className="text-2xl font-bold text-foreground">{stats.featured}</p>
                </div>
                <Star className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                placeholder="Search podcasts..."
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
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Podcasts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Podcasts ({filteredPodcasts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cover</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPodcasts.map((podcast) => (
                  <TableRow key={podcast.id}>
                    <TableCell>
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {podcast.cover_image ? (
                          <img
                            src={podcast.cover_image}
                            alt={podcast.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = '<svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>';
                            }}
                          />
                        ) : (
                          <Mic className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {podcast.thumbnail_url && (
                          <img
                            src={podcast.thumbnail_url}
                            alt={podcast.title}
                            className="w-12 h-8 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{podcast.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {podcast.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(podcast.category)}>
                        {podcast.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(podcast.status)}>
                        {podcast.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFeatured(podcast.id, podcast.is_featured)}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            podcast.is_featured ? "text-yellow-500 fill-yellow-500" : "text-gray-400"
                          }`}
                        />
                      </Button>
                    </TableCell>
                    <TableCell>{podcast.duration || "N/A"}</TableCell>
                    <TableCell>
                      {new Date(podcast.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(podcast.youtube_url, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(podcast)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(podcast.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredPodcasts.length === 0 && (
              <div className="text-center py-8">
                <Mic className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No podcasts found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Podcast</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit_title">Title *</Label>
                <Input
                  id="edit_title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter podcast title"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="edit_youtube_url">YouTube URL *</Label>
                <Input
                  id="edit_youtube_url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({...formData, youtube_url: e.target.value})}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              
              <div>
                <Label htmlFor="edit_category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit_status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit_duration">Duration</Label>
                <Input
                  id="edit_duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  placeholder="e.g., 45:30"
                />
              </div>
              
              <div>
                <Label htmlFor="edit_published_at">Published Date</Label>
                <Input
                  id="edit_published_at"
                  type="date"
                  value={formData.published_at}
                  onChange={(e) => setFormData({...formData, published_at: e.target.value})}
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="edit_thumbnail_url">Thumbnail URL</Label>
                <Input
                  id="edit_thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="edit_cover_image">Cover Image</Label>
                <Input
                  id="edit_cover_image"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="cursor-pointer"
                />
                {coverImagePreview && (
                  <div className="mt-2">
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="edit_tags">Tags (comma-separated)</Label>
                <Input
                  id="edit_tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="technology, startup, business"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter podcast description"
                  rows={3}
                />
              </div>
              
              <div className="col-span-2 flex items-center space-x-2">
                <Switch
                  id="edit_is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({...formData, is_featured: checked})}
                />
                <Label htmlFor="edit_is_featured">Featured Podcast</Label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit}>
                Update Podcast
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}