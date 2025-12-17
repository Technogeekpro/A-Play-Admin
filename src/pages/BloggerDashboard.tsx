import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PenTool, LogOut, Send, Image as ImageIcon, Heart, MessageCircle, Upload, X, Users } from "lucide-react";

interface Post {
  id: string;
  content: string;
  image_url?: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
    avatar_url?: string;
  };
  user_liked?: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url?: string;
  };
}

const BloggerDashboard = () => {
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'my-posts' | 'social-feed'>('social-feed');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", session.user.id)
        .single();

      if (profile?.role !== "blogger") {
        toast.error("Access denied. Blogger privileges required.");
        navigate("/");
        return;
      }

      setUser({ ...session.user, ...profile });
      loadPosts(session.user.id);
      loadAllPosts();
    };

    checkAuth();
  }, [navigate]);

  const loadPosts = async (userId: string) => {
    try {
      // First get the user's posts
      const { data: postsData, error: postsError } = await supabase
        .from("feeds")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Then get the profile for each post
      const postsWithProfiles = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", post.user_id)
            .single();
          
          return {
            ...post,
            profiles: profileData
          };
        })
      );

      setPosts(postsWithProfiles);
    } catch (error: any) {
      toast.error("Failed to load posts: " + error.message);
    }
  };

  const loadAllPosts = async () => {
    try {
      // First get the posts
      const { data: postsData, error: postsError } = await supabase
        .from("feeds")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      // Then get the profiles for each post
      const postsWithProfiles = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", post.user_id)
            .single();
          
          return {
            ...post,
            profiles: profileData
          };
        })
      );

      setAllPosts(postsWithProfiles);
    } catch (error: any) {
      toast.error("Failed to load social feed: " + error.message);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `post-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please enter some content for your post");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          toast.error("Failed to upload image. Post will be created without image.");
        }
      }

      const { data: newPost, error } = await supabase
        .from("feeds")
        .insert({
          user_id: session.user.id,
          content: content.trim(),
          image_url: imageUrl,
        })
        .select("*")
        .single();

      if (error) throw error;

      // Get the profile data separately
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", session.user.id)
        .single();

      // Combine the post with profile data
      const postWithProfile = {
        ...newPost,
        profiles: profileData
      };

      toast.success("Post created successfully!");
      setContent("");
      removeImage();
      
      // Add the new post to the beginning of both arrays
      setPosts(prev => [postWithProfile, ...prev]);
      setAllPosts(prev => [postWithProfile, ...prev]);
    } catch (error: any) {
      toast.error("Failed to create post: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // For now, just update the UI optimistically
      // In a real implementation, you would check if user already liked and toggle
      const updatePosts = (posts: Post[]) => 
        posts.map(post => 
          post.id === postId 
            ? { ...post, like_count: post.like_count + 1, user_liked: true }
            : post
        );
      
      setPosts(updatePosts);
      setAllPosts(updatePosts);
      toast.success("Post liked!");
    } catch (error: any) {
      toast.error("Failed to like post: " + error.message);
    }
  };

  const handleComment = async (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // For now, just update the UI optimistically
      const updatePosts = (posts: Post[]) => 
        posts.map(post => 
          post.id === postId 
            ? { ...post, comment_count: post.comment_count + 1 }
            : post
        );
      
      setPosts(updatePosts);
      setAllPosts(updatePosts);
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      toast.success("Comment added!");
    } catch (error: any) {
      toast.error("Failed to add comment: " + error.message);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error: any) {
      toast.error("Logout failed: " + error.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <PenTool className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Blogger Dashboard</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Welcome back, {user.full_name || 'User'}!</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm" className="self-end sm:self-auto">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === 'social-feed' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('social-feed')}
            className="flex-1 text-xs sm:text-sm"
          >
            <Users className="h-4 w-4 mr-1 sm:mr-2" />
            Social Feed
          </Button>
          <Button
            variant={activeTab === 'my-posts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('my-posts')}
            className="flex-1 text-xs sm:text-sm"
          >
            <PenTool className="h-4 w-4 mr-1 sm:mr-2" />
            My Posts ({posts.length})
          </Button>
        </div>

        {/* Create Post Form */}
        {activeTab === 'my-posts' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PenTool className="h-5 w-5" />
                <span className="text-base sm:text-lg">Create New Post</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="What's on your mind? Share your thoughts..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    className="min-h-[100px] sm:min-h-[120px] resize-none text-sm sm:text-base"
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {content.length}/1000 characters
                  </p>
                </div>
                
                {/* Image Upload Section */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <ImageIcon className="h-4 w-4" />
                    <span>Add Image</span>
                  </Label>
                  <div className="space-y-3">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Selected" 
                          className="w-full max-h-48 sm:max-h-64 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          onClick={removeImage}
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                      >
                        <Upload className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm sm:text-base text-muted-foreground">Click to upload an image</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={isLoading || !content.trim()} className="w-full text-sm sm:text-base">
                  {isLoading ? "Creating Post..." : "Create Post"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Posts Display */}
        <div className="space-y-4">
          {activeTab === 'social-feed' && (
            <>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Social Feed ({allPosts.length})</span>
              </h2>
              
              {allPosts.length === 0 ? (
                <Card>
                  <CardContent className="p-6 sm:p-8 text-center">
                    <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No posts in feed</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">Be the first to share something!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {allPosts.map((post) => (
                    <Card key={post.id} className="overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                      {/* Post Image */}
                      {post.image_url && (
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={post.image_url}
                            alt="Post image"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      <CardContent className="p-3 sm:p-4">
                        <div className="space-y-3">
                          {/* Author Info */}
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {post.profiles?.full_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                                {post.profiles?.full_name || 'Unknown User'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(post.created_at)}
                              </p>
                            </div>
                          </div>

                          {/* Post Content */}
                          <p className="text-xs sm:text-sm text-foreground leading-relaxed line-clamp-3">
                            {post.content}
                          </p>

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <div className="flex items-center space-x-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLike(post.id)}
                                className={`text-xs p-1 h-auto ${
                                  post.user_liked ? 'text-red-500' : 'text-muted-foreground'
                                }`}
                              >
                                <Heart
                                  className={`h-3 w-3 mr-1 ${
                                    post.user_liked ? 'fill-current' : ''
                                  }`}
                                />
                                {post.like_count || 0}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleComments(post.id)}
                                className="text-xs text-muted-foreground p-1 h-auto"
                              >
                                <MessageCircle className="h-3 w-3 mr-1" />
                                {post.comment_count || 0}
                              </Button>
                            </div>
                          </div>

                          {/* Comments Section */}
                          {expandedComments.has(post.id) && (
                            <div className="space-y-2 pt-2 border-t border-border">
                              <div className="flex space-x-2">
                                <Input
                                  placeholder="Write a comment..."
                                  value={commentInputs[post.id] || ''}
                                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  className="flex-1 text-xs px-2 py-1 h-auto"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleComment(post.id);
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleComment(post.id)}
                                  disabled={!commentInputs[post.id]?.trim()}
                                  className="text-xs px-2 py-1 h-auto"
                                >
                                  Post
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
          
          {activeTab === 'my-posts' && (
            <>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Your Posts ({posts.length})</h2>
              
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="p-6 sm:p-8 text-center">
                    <PenTool className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No posts yet</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">Create your first post above!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Card key={post.id} className="overflow-hidden">
                      <CardContent className="p-4 sm:p-6">
                        <div className="space-y-4">
                          <p className="text-sm sm:text-base text-foreground leading-relaxed">{post.content}</p>
                          
                          {post.image_url && (
                            <div className="rounded-lg overflow-hidden">
                              <img 
                                src={post.image_url} 
                                alt="Post image" 
                                className="w-full h-auto max-h-64 sm:max-h-96 object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-4 border-t border-border">
                            <div className="flex items-center space-x-4 text-xs sm:text-sm text-muted-foreground">
                              <span>Posted on {formatDate(post.created_at)}</span>
                              <div className="flex items-center space-x-4">
                                <span>❤️ {post.like_count}</span>
                                <span>💬 {post.comment_count}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BloggerDashboard;