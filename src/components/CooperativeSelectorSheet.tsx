import { useState, useEffect } from "react";
import { MapPin, ChevronDown, Check, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import CooperativeSelector from "@/components/CooperativeSelector";
import { cn } from "@/lib/utils";

interface Cooperativa {
  id: string;
  nome_fantasia: string;
  cidade: string | null;
  uf: string | null;
  logradouro?: string | null;
  bairro?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface CooperativeSelectorSheetProps {
  cooperativas: Cooperativa[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function CooperativeSelectorSheet({
  cooperativas,
  selected,
  onSelect,
}: CooperativeSelectorSheetProps) {
  const [open, setOpen] = useState(false);

  const selectedCooperativa = cooperativas.find((c) => c.id === selected);

  const handleSelect = (id: string) => {
    onSelect(id);
    // Close drawer after short delay for visual feedback
    setTimeout(() => setOpen(false), 200);
  };

  // Remove focus from trigger when opening drawer
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Remove focus from active element when opening
      (document.activeElement as HTMLElement)?.blur();
    }
    setOpen(newOpen);
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => handleOpenChange(true)}
        className={cn(
          "w-full justify-between h-auto py-3 px-4",
          "border-2 transition-all duration-200",
          selected
            ? "border-primary bg-primary/5 hover:bg-primary/10"
            : "border-dashed hover:border-primary/50"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            selected ? "bg-primary/20" : "bg-muted"
          )}>
            {selected ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Building2 className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          
          <div className="text-left">
            {selectedCooperativa ? (
              <>
                <p className="font-medium text-foreground">
                  {selectedCooperativa.nome_fantasia}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedCooperativa.bairro && `${selectedCooperativa.bairro} - `}
                  {selectedCooperativa.cidade}, {selectedCooperativa.uf}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-muted-foreground">
                  Escolher cooperativa
                </p>
                <p className="text-xs text-muted-foreground">
                  Toque para selecionar o ponto de entrega
                </p>
              </>
            )}
          </div>
        </div>
        
        <ChevronDown className={cn(
          "h-5 w-5 text-muted-foreground transition-transform",
          open && "rotate-180"
        )} />
      </Button>

      {/* Bottom Sheet */}
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left border-b pb-4">
            <DrawerTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Escolher Ponto de Entrega
            </DrawerTitle>
            <DrawerDescription>
              Selecione a cooperativa mais próxima para entregar seus materiais
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-100px)]">
            <CooperativeSelector
              cooperativas={cooperativas}
              selected={selected}
              onSelect={handleSelect}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
