import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import { X, Calendar, MapPin, Edit, Plus, Minus } from "lucide-react";

interface Zone {
  id: string;
  name: string;
  price: string;
  capacity: string;
  isExisting?: boolean;
  dbId?: string;
}

interface EditEventFormProps {
  event: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditEventForm({ event, onClose, onSuccess }: EditEventFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start_date: "",
    end_date: "",
    club_id: "",
    cover_image: ""
  });

  const [zones, setZones] = useState<Zone[]>([]);
  const [originalZones, setOriginalZones] = useState<Zone[]>([]);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        location: event.location || "",
        start_date: event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : "",
        end_date: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : "",
        club_id: event.club_id || "",
        cover_image: event.cover_image || ""
      });
    }
  }, [event]);

  // Load existing zones for the event
  const { data: existingZones } = useQuery({
    queryKey: ["event-zones", event?.id],
    queryFn: async () => {
      if (!event?.id) return [];
      const { data, error } = await supabase
        .from("zones")
        .select("*")
        .eq("event_id", event.id)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!event?.id,
  });

  useEffect(() => {
    if (existingZones) {
      const mappedZones = existingZones.map(zone => ({
        id: crypto.randomUUID(),
        dbId: zone.id,
        name: zone.name,
        price: zone.price.toString(),
        capacity: zone.capacity.toString(),
        isExisting: true
      }));
      setZones(mappedZones.length > 0 ? mappedZones : [{ id: crypto.randomUUID(), name: "", price: "", capacity: "" }]);
      setOriginalZones(mappedZones);
    }
  }, [existingZones]);

  const { data: clubs } = useQuery({
    queryKey: ["clubs-for-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clubs")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (eventData: typeof formData) => {
      // First, update the event
      const { data: updatedEvent, error: eventError } = await supabase
        .from("events")
        .update(eventData)
        .eq("id", event.id)
        .select()
        .single();
      
      if (eventError) throw eventError;

      // Handle zones
      const validZones = zones.filter(zone => 
        zone.name.trim() && zone.price.trim() && zone.capacity.trim()
      );

      if (validZones.length === 0) {
        throw new Error("Please add at least one zone for the event");
      }

      // Get zones to delete (existing zones not in current zones)
      const zonesToDelete = originalZones.filter(originalZone => 
        !validZones.some(zone => zone.dbId === originalZone.dbId)
      );

      // Delete removed zones
      if (zonesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("zones")
          .delete()
          .in("id", zonesToDelete.map(zone => zone.dbId));
        
        if (deleteError) throw deleteError;
      }

      // Update existing zones and insert new ones
      for (const zone of validZones) {
        const zoneData = {
          event_id: event.id,
          name: zone.name.trim(),
          price: parseFloat(zone.price),
          capacity: parseInt(zone.capacity)
        };

        if (zone.isExisting && zone.dbId) {
          // Update existing zone
          const { error: updateError } = await supabase
            .from("zones")
            .update(zoneData)
            .eq("id", zone.dbId);
          
          if (updateError) throw updateError;
        } else {
          // Insert new zone
          const { error: insertError } = await supabase
            .from("zones")
            .insert([zoneData]);
          
          if (insertError) throw insertError;
        }
      }

      return updatedEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["event-zones", event.id] });
      toast.success("Event updated successfully!");
      onSuccess();
    },
    onError: (error) => {
      console.error("Error updating event:", error);
      toast.error(error.message || "Failed to update event");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.club_id || !formData.start_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate zones
    const validZones = zones.filter(zone => 
      zone.name.trim() && zone.price.trim() && zone.capacity.trim()
    );

    if (validZones.length === 0) {
      toast.error("Please add at least one zone for the event");
      return;
    }

    // Validate zone data
    const invalidZones = validZones.filter(zone => {
      const price = parseFloat(zone.price);
      const capacity = parseInt(zone.capacity);
      return isNaN(price) || price < 0 || isNaN(capacity) || capacity <= 0;
    });

    if (invalidZones.length > 0) {
      toast.error("Please ensure all zones have valid price and capacity values");
      return;
    }

    updateEventMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addZone = () => {
    setZones(prev => [...prev, { id: crypto.randomUUID(), name: "", price: "", capacity: "" }]);
  };

  const removeZone = (id: string) => {
    if (zones.length > 1) {
      setZones(prev => prev.filter(zone => zone.id !== id));
    }
  };

  const updateZone = (id: string, field: keyof Omit<Zone, 'id' | 'isExisting' | 'dbId'>, value: string) => {
    setZones(prev => prev.map(zone => 
      zone.id === id ? { ...zone, [field]: value } : zone
    ));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Edit className="h-5 w-5" />
            Edit Event
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 sm:h-9 sm:w-9">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="club">Club *</Label>
                <Select value={formData.club_id} onValueChange={(value) => handleInputChange("club_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a club" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs?.map((club) => (
                      <SelectItem key={club.id} value={club.id}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter event description"
                rows={3}
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
                  placeholder="Enter event location"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date & Time *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange("start_date", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date & Time</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange("end_date", e.target.value)}
                />
              </div>
            </div>

            <ImageUpload
              value={formData.cover_image}
              onChange={(url) => handleInputChange("cover_image", url)}
              bucket="images"
              folder="events"
            />

            {/* Zones Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Event Zones *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addZone}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Zone
                </Button>
              </div>
              
              <div className="space-y-3">
                {zones.map((zone) => (
                  <Card key={zone.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`zone-name-${zone.id}`}>Zone Name</Label>
                          <Input
                            id={`zone-name-${zone.id}`}
                            value={zone.name}
                            onChange={(e) => updateZone(zone.id, "name", e.target.value)}
                            placeholder="e.g., VIP, General, Premium"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`zone-price-${zone.id}`}>Price</Label>
                          <Input
                            id={`zone-price-${zone.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={zone.price}
                            onChange={(e) => updateZone(zone.id, "price", e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`zone-capacity-${zone.id}`}>Capacity</Label>
                          <Input
                            id={`zone-capacity-${zone.id}`}
                            type="number"
                            min="1"
                            value={zone.capacity}
                            onChange={(e) => updateZone(zone.id, "capacity", e.target.value)}
                            placeholder="100"
                          />
                        </div>
                      </div>
                      {zones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeZone(zone.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={updateEventMutation.isPending}
                className="flex-1 h-10 sm:h-9"
              >
                {updateEventMutation.isPending ? "Updating..." : "Update Event"}
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