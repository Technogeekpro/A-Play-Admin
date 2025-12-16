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

interface EditPubFormProps {
  pub: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditPubForm({ pub, onClose, onSuccess }: EditPubFormProps) {
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
    has_live_music: false,
    has_sports_viewing: false,
  });

  const [amenityInput, setAmenityInput] = useState("");
  const [cuisineInput, setCuisineInput] = useState("");

  useEffect(() => {
    if (pub) {
      setFormData({
        name: pub.name || "",
        description: pub.description || "",
        location: pub.location || "",
        cover_image: pub.cover_image || "",
        logo_url: pub.logo_url || "",
        phone: pub.phone || "",
        email: pub.email || "",
        website: pub.website || "",
        price_range: pub.price_range || "",
        amenities: pub.amenities || [],
        cuisine_types: pub.cuisine_types || [],
        has_live_music: pub.has_live_music || false,
        has_sports_viewing: pub.has_sports_viewing || false,
      });
    }
  }, [pub]);

  const updatePubMutation = useMutation({
    mutationFn: async (pubData: typeof formData) => {
      const { data, error } = await supabase
        .from("pubs")
        .update(pubData)
        .eq("id", pub.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pubs"] });
      toast.success("Pub updated successfully!");
      onSuccess();
    },
    onError: (error) => {
      console.error("Error updating pub:", error);
      toast.error("Failed to update pub");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    updatePubMutation.mutate(formData);
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
            <Edit className="h-5 w-5" />
            Edit Pub
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
                <Label htmlFor="name">Pub Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter pub name"
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
                placeholder="Enter pub description"
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
                  placeholder="Enter pub location"
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
                  placeholder="contact@pub.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://pub.com"
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
                  placeholder="Add amenity (e.g., WiFi, Parking, Air Conditioning)"
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

            {/* Cuisine Types */}
            <div className="space-y-2">
              <Label>Cuisine Types</Label>
              <div className="flex gap-2">
                <Input
                  value={cuisineInput}
                  onChange={(e) => setCuisineInput(e.target.value)}
                  placeholder="Add cuisine type (e.g., American, British, International)"
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

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="has_live_music">Has Live Music</Label>
                  <p className="text-sm text-muted-foreground">
                    Does this pub feature live music performances?
                  </p>
                </div>
                <Switch
                  id="has_live_music"
                  checked={formData.has_live_music}
                  onCheckedChange={(checked) => handleInputChange("has_live_music", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="has_sports_viewing">Has Sports Viewing</Label>
                  <p className="text-sm text-muted-foreground">
                    Does this pub have screens for watching sports?
                  </p>
                </div>
                <Switch
                  id="has_sports_viewing"
                  checked={formData.has_sports_viewing}
                  onCheckedChange={(checked) => handleInputChange("has_sports_viewing", checked)}
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
                  folder="pubs"
                />
              </div>

              <div>
                <Label>Logo</Label>
                <ImageUpload
                  value={formData.logo_url}
                  onChange={(url) => handleInputChange("logo_url", url)}
                  bucket="images"
                  folder="pubs/logos"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={updatePubMutation.isPending}
                className="flex-1 h-10 sm:h-9"
              >
                {updatePubMutation.isPending ? "Updating..." : "Update Pub"}
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
