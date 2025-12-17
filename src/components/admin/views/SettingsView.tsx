
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export function SettingsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure platform settings and preferences</p>
      </div>
      
      <Card className="p-12 text-center">
        <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Platform Settings</h3>
        <p className="text-muted-foreground">
          This section will contain platform configuration options
        </p>
      </Card>
    </div>
  );
}
