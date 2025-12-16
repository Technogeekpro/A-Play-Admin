import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import { X, Edit, MapPin } from "lucide-react";

interface EditBeachFormProps {
  beach: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditBeachForm({ beach, onClose, onSuccess }: EditBeachFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    cover_image: "",
    logo_url: "",
    phone: "",
    email: "",
    website: "",
    price_range: "",
    amenities: [] as string[],
    beach_type: "",
    water_activities: [] as string[],
    has_lifeguard: false,
    has_restaurant: false,
    has_parking: false,
    entry_fee: "",
  });

  const [amenityInput, setAmenityInput] = useState("");
  const [activityInput, setActivityInput] = useState("");

  useEffect(() => {
    if (beach) {
      setFormData({
        name: beach.name || "",
        description: beach.description || "",
        location: beach.location || "",
        cover_image: beach.cover_image || "",
        logo_url: beach.logo_url || "",
        phone: beach.phone || "",
        email: beach.email || "",
        website: beach.website || "",
        price_range: beach.price_range || "",
        amenities: beach.amenities || [],
        beach_type: beach.beach_type || "",
        water_activities: beach.water_activities || [],
        has_lifeguard: beach.has_lifeguard || false,
        has_restaurant: beach.has_restaurant || false,
        has_parking: beach.has_parking || false,
        entry_fee: beach.entry_fee || "",
      });
    }
  }, [beach]);

  const updateBeachMutation = useMutation({
    mutationFn: async (beachData: typeof formData) => {
      const { data, error } = await supabase
        .from("beaches")
        .update(beachData)
        .eq("id", beach.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-beaches"] });
      toast.success("Beach updated successfully!");
      onSuccess();
    },
    onError: (error) => {
      console.error("Error updating beach:", error);
      toast.error("Failed to update beach");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    updateBeachMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()],
      }));
      setAmenityInput("");
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((a) => a !== amenity),
    }));
  };

  const addActivity = () => {
    if (activityInput.trim() && !formData.water_activities.includes(activityInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        water_activities: [...prev.water_activities, activityInput.trim()],
      }));
      setActivityInput("");
    }
  };

  const removeActivity = (activity: string) => {
    setFormData((prev) => ({
      ...prev,
      water_activities: prev.water_activities.filter((a) => a !== activity),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8">
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Edit className="h-5 w-5" />
            Edit Beach
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
                <Label htmlFor="name">Beach Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter beach name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="beach_type">Beach Type</Label>
                <Select value={formData.beach_type} onValueChange={(value) => handleInputChange("beach_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select beach type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Public">Public</SelectItem>
                    <SelectItem value="Private">Private</SelectItem>
                    <SelectItem value="Resort">Resort</SelectItem>
                    <SelectItem value="Natural">Natural</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter beach description"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="Enter beach location"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+233 123 456 789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="contact@beach.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://beach.com"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_range">Price Range</Label>
                <Select value={formData.price_range} onValueChange={(value) => handleInputChange("price_range", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select price range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">$ (Budget)</SelectItem>
                    <SelectItem value="$$">$$ (Moderate)</SelectItem>
                    <SelectItem value="$$$">$$$ (Upscale)</SelectItem>
                    <SelectItem value="$$$$">$$$$ (Luxury)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entry_fee">Entry Fee</Label>
                <Input
                  id="entry_fee"
                  value={formData.entry_fee}
                  onChange={(e) => handleInputChange("entry_fee", e.target.value)}
                  placeholder="e.g., Free, GHS 50, $10"
                />
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-2">
              <Label>Amenities</Label>
              <div className="flex gap-2">
                <Input
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  placeholder="Add amenity (e.g., WiFi, Showers, Changing Rooms)"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAmenity();
                    }
                  }}
                />
                <Button type="button" onClick={addAmenity} variant="outline">
                  Add
                </Button>
              </div>
              {formData.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="bg-secondary px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      <span className="text-sm">{amenity}</span>
                      <button
                        type="button"
                        onClick={() => removeAmenity(amenity)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Water Activities */}
            <div className="space-y-2">
              <Label>Water Activities</Label>
              <div className="flex gap-2">
                <Input
                  value={activityInput}
                  onChange={(e) => setActivityInput(e.target.value)}
                  placeholder="Add activity (e.g., Swimming, Surfing, Jet Skiing)"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addActivity();
                    }
                  }}
                />
                <Button type="button" onClick={addActivity} variant="outline">
                  Add
                </Button>
              </div>
              {formData.water_activities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.water_activities.map((activity) => (
                    <div
                      key={activity}
                      className="bg-secondary px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      <span className="text-sm">{activity}</span>
                      <button
                        type="button"
                        onClick={() => removeActivity(activity)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="has_lifeguard">Has Lifeguard</Label>
                  <p className="text-sm text-muted-foreground">
                    Is there a lifeguard on duty at this beach?
                  </p>
                </div>
                <Switch
                  id="has_lifeguard"
                  checked={formData.has_lifeguard}
                  onCheckedChange={(checked) => handleInputChange("has_lifeguard", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="has_restaurant">Has Restaurant</Label>
                  <p className="text-sm text-muted-foreground">
                    Does this beach have a restaurant or food service?
                  </p>
                </div>
                <Switch
                  id="has_restaurant"
                  checked={formData.has_restaurant}
                  onCheckedChange={(checked) => handleInputChange("has_restaurant", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="has_parking">Has Parking</Label>
                  <p className="text-sm text-muted-foreground">
                    Is parking available at this beach?
                  </p>
                </div>
                <Switch
                  id="has_parking"
                  checked={formData.has_parking}
                  onCheckedChange={(checked) => handleInputChange("has_parking", checked)}
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <div>
                <Label>Cover Image</Label>
                <ImageUpload
                  value={formData.cover_image}
                  onChange={(url) => handleInputChange("cover_image", url)}
                  bucket="images"
                  folder="beaches"
                />
              </div>

              <div>
                <Label>Logo</Label>
                <ImageUpload
                  value={formData.logo_url}
                  onChange={(url) => handleInputChange("logo_url", url)}
                  bucket="images"
                  folder="beaches/logos"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={updateBeachMutation.isPending}
                className="flex-1 h-10 sm:h-9"
              >
                {updateBeachMutation.isPending ? "Updating..." : "Update Beach"}
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
