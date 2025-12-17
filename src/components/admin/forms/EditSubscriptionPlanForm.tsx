import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { X, Crown, Plus, Minus } from "lucide-react";

interface EditSubscriptionPlanFormProps {
  plan: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditSubscriptionPlanForm({ plan, onClose, onSuccess }: EditSubscriptionPlanFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: plan.name || "",
    description: plan.description || "",
    price_monthly: plan.price_monthly?.toString() || "",
    price_yearly: plan.price_yearly?.toString() || "",
    tier_level: plan.tier_level?.toString() || "1",
    is_active: plan.is_active ?? true,
  });

  const [benefits, setBenefits] = useState<string[]>(
    Array.isArray(plan.benefits) ? plan.benefits : []
  );
  const [benefitInput, setBenefitInput] = useState("");

  // Convert existing features to array format
  const [features, setFeatures] = useState(() => {
    if (plan.features && typeof plan.features === 'object') {
      return Object.entries(plan.features).map(([key, value]) => {
        let type: "text" | "number" | "boolean" = "text";
        if (typeof value === 'boolean') type = "boolean";
        else if (typeof value === 'number') type = "number";

        return {
          key,
          value: value?.toString() || "",
          type,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        };
      });
    }
    return [];
  });

  const updatePlanMutation = useMutation({
    mutationFn: async (planData: any) => {
      // Convert features array to JSON object
      const featuresObject = features.reduce((acc, feature) => {
        let value: any = feature.value;
        if (feature.type === "boolean") {
          value = feature.value === "true" || feature.value === true;
        } else if (feature.type === "number") {
          value = parseInt(feature.value?.toString() || "0") || 0;
        }
        acc[feature.key] = value;
        return acc;
      }, {} as Record<string, any>);

      const { data, error } = await supabase
        .from("subscription_plans")
        .update({
          ...planData,
          features: featuresObject,
          benefits: benefits.filter(b => b.trim()),
          price_monthly: parseFloat(planData.price_monthly) || 0,
          price_yearly: parseFloat(planData.price_yearly) || 0,
          tier_level: parseInt(planData.tier_level) || 1,
        })
        .eq('id', plan.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Subscription plan updated successfully!");
      onSuccess();
    },
    onError: (error) => {
      console.error("Error updating plan:", error);
      toast.error("Failed to update subscription plan");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    updatePlanMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addBenefit = () => {
    if (benefitInput.trim() && !benefits.includes(benefitInput.trim())) {
      setBenefits([...benefits, benefitInput.trim()]);
      setBenefitInput("");
    }
  };

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const addFeature = () => {
    setFeatures([...features, { key: "", value: "", type: "text", label: "" }]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: string, value: string) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    setFeatures(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8">
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Crown className="h-5 w-5" />
            Edit Subscription Plan: {plan.name}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Premium, Pro, Enterprise"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tier_level">Tier Level</Label>
                <Input
                  id="tier_level"
                  type="number"
                  min="1"
                  value={formData.tier_level}
                  onChange={(e) => handleInputChange("tier_level", e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Brief description of what this plan offers"
                rows={3}
                required
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_monthly">Monthly Price (GH₵)</Label>
                <Input
                  id="price_monthly"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_monthly}
                  onChange={(e) => handleInputChange("price_monthly", e.target.value)}
                  placeholder="120.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_yearly">Yearly Price (GH₵)</Label>
                <Input
                  id="price_yearly"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_yearly}
                  onChange={(e) => handleInputChange("price_yearly", e.target.value)}
                  placeholder="1200.00"
                />
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <Label>Benefits</Label>
              <div className="flex gap-2">
                <Input
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  placeholder="Add benefit (e.g., Unlimited events)"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addBenefit();
                    }
                  }}
                />
                <Button type="button" onClick={addBenefit} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {benefits.length > 0 && (
                <div className="space-y-2 mt-2">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 bg-secondary p-2 rounded-lg">
                      <span className="flex-1 text-sm">{benefit}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBenefit(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Features</Label>
                <Button type="button" onClick={addFeature} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {features.map((feature, index) => (
                  <Card key={index} className="p-3">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={feature.label}
                          onChange={(e) => updateFeature(index, "label", e.target.value)}
                          placeholder="Feature name"
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Key</Label>
                        <Input
                          value={feature.key}
                          onChange={(e) => updateFeature(index, "key", e.target.value)}
                          placeholder="feature_key"
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Type</Label>
                        <select
                          value={feature.type}
                          onChange={(e) => updateFeature(index, "type", e.target.value)}
                          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        >
                          <option value="boolean">Boolean</option>
                          <option value="number">Number</option>
                          <option value="text">Text</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Value</Label>
                        {feature.type === "boolean" ? (
                          <select
                            value={feature.value?.toString()}
                            onChange={(e) => updateFeature(index, "value", e.target.value)}
                            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        ) : (
                          <Input
                            type={feature.type === "number" ? "number" : "text"}
                            value={feature.value}
                            onChange={(e) => updateFeature(index, "value", e.target.value)}
                            className="h-9"
                          />
                        )}
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFeature(index)}
                          className="h-9"
                        >
                          <Minus className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="is_active">Active Plan</Label>
                <p className="text-sm text-muted-foreground">
                  Make this plan available for users to subscribe
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange("is_active", checked)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={updatePlanMutation.isPending}
                className="flex-1"
              >
                {updatePlanMutation.isPending ? "Updating..." : "Update Plan"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
