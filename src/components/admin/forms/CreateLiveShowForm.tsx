import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import { X, Music, MapPin } from "lucide-react";

interface CreateLiveShowFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateLiveShowForm({ onClose, onSuccess }: CreateLiveShowFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    performer_name: "",
    venue_name: "",
    location: "",
    show_date: "",
    show_time: "",
    duration_minutes: "",
    cover_image: "",
    genre: [] as string[],
    ticket_price_min: "",
    ticket_price_max: "",
    ticket_url: "",
    capacity: "",
    age_restriction: "",
  });

  const [genreInput, setGenreInput] = useState("");

  const createLiveShowMutation = useMutation({
    mutationFn: async (liveShowData: typeof formData) => {
      const { data, error } = await supabase
        .from("live_shows")
        .insert([liveShowData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-live-shows"] });
      toast.success("Live Show created successfully!");
      onSuccess();
    },
    onError: (error) => {
      console.error("Error creating live show:", error);
      toast.error("Failed to create live show");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.performer_name || !formData.venue_name) {
      toast.error("Please fill in all required fields");
      return;
    }

    createLiveShowMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addGenre = () => {
    if (genreInput.trim() && !formData.genre.includes(genreInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        genre: [...prev.genre, genreInput.trim()],
      }));
      setGenreInput("");
    }
  };

  const removeGenre = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      genre: prev.genre.filter((g) => g !== genre),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8">
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Music className="h-5 w-5" />
            Create New Live Show
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 sm:h-9 sm:w-9">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Show Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter show title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="performer_name">Performer Name *</Label>
                <Input
                  id="performer_name"
                  value={formData.performer_name}
                  onChange={(e) => handleInputChange("performer_name", e.target.value)}
                  placeholder="Enter performer name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter show description"
                rows={3}
              />
            </div>

            {/* Venue Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="venue_name">Venue Name *</Label>
                <Input
                  id="venue_name"
                  value={formData.venue_name}
                  onChange={(e) => handleInputChange("venue_name", e.target.value)}
                  placeholder="Enter venue name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Enter location"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Date and Time Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="show_date">Show Date</Label>
                <Input
                  id="show_date"
                  type="datetime-local"
                  value={formData.show_date}
                  onChange={(e) => handleInputChange("show_date", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="show_time">Show Time</Label>
                <Input
                  id="show_time"
                  type="time"
                  value={formData.show_time}
                  onChange={(e) => handleInputChange("show_time", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => handleInputChange("duration_minutes", e.target.value)}
                  placeholder="e.g., 120"
                />
              </div>
            </div>

            {/* Genre */}
            <div className="space-y-2">
              <Label>Genre</Label>
              <div className="flex gap-2">
                <Input
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  placeholder="Add genre (e.g., Rock, Jazz, Hip-Hop)"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addGenre();
                    }
                  }}
                />
                <Button type="button" onClick={addGenre} variant="outline">
                  Add
                </Button>
              </div>
              {formData.genre.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.genre.map((genre) => (
                    <div
                      key={genre}
                      className="bg-secondary px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      <span className="text-sm">{genre}</span>
                      <button
                        type="button"
                        onClick={() => removeGenre(genre)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ticketing Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticket_price_min">Min Ticket Price</Label>
                <Input
                  id="ticket_price_min"
                  type="number"
                  step="0.01"
                  value={formData.ticket_price_min}
                  onChange={(e) => handleInputChange("ticket_price_min", e.target.value)}
                  placeholder="e.g., 50.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket_price_max">Max Ticket Price</Label>
                <Input
                  id="ticket_price_max"
                  type="number"
                  step="0.01"
                  value={formData.ticket_price_max}
                  onChange={(e) => handleInputChange("ticket_price_max", e.target.value)}
                  placeholder="e.g., 200.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket_url">Ticket URL</Label>
                <Input
                  id="ticket_url"
                  type="url"
                  value={formData.ticket_url}
                  onChange={(e) => handleInputChange("ticket_url", e.target.value)}
                  placeholder="https://tickets.com"
                />
              </div>
            </div>

            {/* Capacity and Age Restriction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange("capacity", e.target.value)}
                  placeholder="e.g., 500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age_restriction">Age Restriction</Label>
                <Select value={formData.age_restriction} onValueChange={(value) => handleInputChange("age_restriction", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age restriction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Ages">All Ages</SelectItem>
                    <SelectItem value="13+">13+</SelectItem>
                    <SelectItem value="16+">16+</SelectItem>
                    <SelectItem value="18+">18+</SelectItem>
                    <SelectItem value="21+">21+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <ImageUpload
                value={formData.cover_image}
                onChange={(url) => handleInputChange("cover_image", url)}
                bucket="images"
                folder="live_shows"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={createLiveShowMutation.isPending}
                className="flex-1 h-10 sm:h-9"
              >
                {createLiveShowMutation.isPending ? "Creating..." : "Create Live Show"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="h-10 sm:h-9 sm:w-auto">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
