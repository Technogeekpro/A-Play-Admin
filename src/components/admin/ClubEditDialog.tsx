import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ClubEditForm } from "./ClubEditForm";
import type { Tables } from "@/integrations/supabase/types";

type Club = Tables<"clubs">;

interface ClubEditDialogProps {
  club: Club;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ClubEditDialog({ 
  club, 
  children, 
  open, 
  onOpenChange 
}: ClubEditDialogProps) {
  const handleClose = () => {
    onOpenChange?.(false);
  };

  const handleSuccess = () => {
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <ClubEditForm 
          club={club} 
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}