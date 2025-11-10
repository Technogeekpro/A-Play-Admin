import { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";
import { deleteFile } from "@/lib/storage";
import type { Tables } from "@/integrations/supabase/types";

type Club = Tables<"clubs">;

interface ClubEditFormProps {
  club: Club;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ClubEditForm({ club, onClose, onSuccess }: ClubEditFormProps) {
  const [formData, setFormData] = useState({
    name: club.name,
    description: club.description,
    logo_url: club.logo_url || ""
  });
  const [previousLogoUrl, setPreviousLogoUrl] = useState(club.logo_url || "");
  const queryClient = useQueryClient();

  const updateClubMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("clubs")
        .update({
          name: data.name,
          description: data.description,
          logo_url: data.logo_url || null
        })
        .eq("id", club.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clubs"] });
      toast.success("Club updated successfully!");
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update club");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Club name is required");
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error("Club description is required");
      return;
    }

    // If logo was changed and there was a previous logo, delete the old one
    if (previousLogoUrl && formData.logo_url !== previousLogoUrl) {
      try {
        // Extract the file path from the URL
        const urlParts = previousLogoUrl.split('/');
        const bucketIndex = urlParts.findIndex(part => part === 'storage');
        if (bucketIndex !== -1 && bucketIndex + 3 < urlParts.length) {
          const bucket = urlParts[bucketIndex + 2];
          const filePath = urlParts.slice(bucketIndex + 3).join('/');
          await deleteFile(bucket, filePath);
        }
      } catch (error) {
        console.error("Failed to delete old logo:", error);
        // Continue with update even if deletion fails
      }
    }

    updateClubMutation.mutate(formData);
  };

  const handleImageChange = (url: string) => {
    setFormData(prev => ({ ...prev, logo_url: url }));
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, logo_url: "" }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold">Edit Club</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Club Logo */}
          <div className="space-y-2">
            <ImageUpload
              value={formData.logo_url}
              onChange={handleImageChange}
              onRemove={handleImageRemove}
              bucket="images"
              folder="clubs"
              maxSizeInMB={5}
              acceptedFileTypes={["image/jpeg", "image/png", "image/webp", "image/gif"]}
              placeholder="Upload club logo or enter URL"
            />
          </div>

          {/* Club Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Club Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter club name"
              required
            />
          </div>

          {/* Club Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter club description"
              rows={4}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={updateClubMutation.isPending}
              className="flex-1"
            >
              {updateClubMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateClubMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}