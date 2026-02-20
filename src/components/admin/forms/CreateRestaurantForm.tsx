import { useState } from "react";
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
import { X, Utensils, MapPin } from "lucide-react";

interface CreateRestaurantFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateRestaurantForm({ onClose, onSuccess }: CreateRestaurantFormProps) {
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
    cuisine_types: [] as string[],
    has_delivery: false,
    has_takeout: false,
    has_reservations: false,
  });

  const [amenityInput, setAmenityInput] = useState("");
  const [cuisineInput, setCuisineInput] = useState("");

  const createRestaurantMutation = useMutation({
    mutationFn: async (restaurantData: typeof formData) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("restaurants")
        .insert([{ ...restaurantData, created_by: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-restaurants"] });
      toast.success("Restaurant created successfully!");
      onSuccess();
    },
    onError: (error) => {
      console.error("Error creating restaurant:", error);
      toast.error("Failed to create restaurant");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    createRestaurantMutation.mutate(formData);
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

  const addCuisine = () => {
    if (cuisineInput.trim() && !formData.cuisine_types.includes(cuisineInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        cuisine_types: [...prev.cuisine_types, cuisineInput.trim()],
      }));
      setCuisineInput("");
    }
  };

  const removeCuisine = (cuisine: string) => {
    setFormData((prev) => ({
      ...prev,
      cuisine_types: prev.cuisine_types.filter((c) => c !== cuisine),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8">
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Utensils className="h-5 w-5" />
            Create New Restaurant
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 sm:h-9 sm:w-9">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Restaurant Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter restaurant name"
                  required
                />
              </div>

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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter restaurant description"
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
                  placeholder="Enter restaurant location"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <ImageUpload
              value={formData.cover_image}
              onChange={(url) => handleInputChange("cover_image", url)}
              bucket="images"
              folder="restaurants"
            />

            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                type="url"
                value={formData.logo_url}
                onChange={(e) => handleInputChange("logo_url", e.target.value)}
                placeholder="https://restaurant.com/logo.png"
              />
            </div>

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
                  placeholder="contact@restaurant.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://restaurant.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Amenities</Label>
              <div className="flex gap-2">
                <Input
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  placeholder="Add amenity (e.g., WiFi, Parking)"
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

            <div className="space-y-2">
              <Label>Cuisine Types</Label>
              <div className="flex gap-2">
                <Input
                  value={cuisineInput}
                  onChange={(e) => setCuisineInput(e.target.value)}
                  placeholder="Add cuisine (e.g., Italian, Ghanaian)"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCuisine();
                    }
                  }}
                />
                <Button type="button" onClick={addCuisine} variant="outline">
                  Add
                </Button>
              </div>
              {formData.cuisine_types.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.cuisine_types.map((cuisine) => (
                    <div
                      key={cuisine}
                      className="bg-secondary px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      <span className="text-sm">{cuisine}</span>
                      <button
                        type="button"
                        onClick={() => removeCuisine(cuisine)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Delivery</Label>
                  <div className="text-sm text-muted-foreground">Offers delivery</div>
                </div>
                <Switch
                  checked={formData.has_delivery}
                  onCheckedChange={(checked) => handleInputChange("has_delivery", checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Takeout</Label>
                  <div className="text-sm text-muted-foreground">Offers takeout</div>
                </div>
                <Switch
                  checked={formData.has_takeout}
                  onCheckedChange={(checked) => handleInputChange("has_takeout", checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Reservations</Label>
                  <div className="text-sm text-muted-foreground">Accepts reservations</div>
                </div>
                <Switch
                  checked={formData.has_reservations}
                  onCheckedChange={(checked) => handleInputChange("has_reservations", checked)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRestaurantMutation.isPending}>
                {createRestaurantMutation.isPending ? "Creating..." : "Create Restaurant"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

