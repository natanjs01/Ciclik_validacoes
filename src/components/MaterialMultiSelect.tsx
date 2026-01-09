import { useState } from "react";
import { Check, ChevronDown, Package, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Material {
  id: string;
  descricao: string;
  tipo_embalagem: string;
  peso_gramas: number;
  origem_cadastro: string;
}

interface MaterialMultiSelectProps {
  materials: Material[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

const MaterialMultiSelect = ({
  materials,
  selectedIds,
  onToggle,
  onDelete,
  onSelectAll,
  onClearAll,
}: MaterialMultiSelectProps) => {
  const [open, setOpen] = useState(false);

  const formatWeight = (gramas: number) => {
    if (gramas >= 1000) {
      return `${(gramas / 1000).toFixed(2).replace(".", ",")} kg`;
    }
    return `${gramas.toFixed(0)} g`;
  };

  const selectedMaterials = materials.filter((m) => selectedIds.has(m.id));
  const allSelected = materials.length > 0 && selectedIds.size === materials.length;

  return (
    <div className="space-y-3">
      {/* Dropdown Trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-12 text-left font-normal"
          >
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>
                {selectedIds.size === 0
                  ? "Selecionar materiais..."
                  : `${selectedIds.size} ${selectedIds.size === 1 ? "material selecionado" : "materiais selecionados"}`}
              </span>
            </div>
            <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
          </Button>
        </PopoverTrigger>

        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-background border shadow-lg" 
          align="start"
          sideOffset={4}
          style={{ zIndex: 9999 }}
        >
          {/* Header Actions */}
          <div className="flex items-center justify-between p-3 border-b">
            <span className="text-sm font-medium text-muted-foreground">
              {materials.length} {materials.length === 1 ? "disponível" : "disponíveis"}
            </span>
            <div className="flex gap-2">
              {selectedIds.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearAll();
                  }}
                  className="h-7 text-xs"
                >
                  Limpar
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (allSelected) {
                    onClearAll();
                  } else {
                    onSelectAll();
                  }
                }}
                className="h-7 text-xs"
              >
                {allSelected ? "Desmarcar todos" : "Selecionar todos"}
              </Button>
            </div>
          </div>

          {/* Materials List */}
          <ScrollArea className="max-h-[280px]">
            {materials.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Nenhum material disponível
              </div>
            ) : (
              <div className="p-1">
                {materials.map((material) => {
                  const isSelected = selectedIds.has(material.id);
                  const needsWeighing = !material.peso_gramas && material.origem_cadastro === "manual";

                  return (
                    <div
                      key={material.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors group",
                        isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                      )}
                      onClick={() => onToggle(material.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggle(material.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {material.descricao}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {material.tipo_embalagem}
                          {material.peso_gramas > 0 && ` · ${formatWeight(material.peso_gramas)}`}
                          {needsWeighing && " · A pesar"}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(material.id);
                        }}
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Selected Chips */}
      <AnimatePresence mode="popLayout">
        {selectedMaterials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {selectedMaterials.map((material) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                layout
              >
                <Badge
                  variant="secondary"
                  className="pl-2 pr-1 py-1 gap-1 text-xs font-normal max-w-[180px]"
                >
                  <span className="truncate">{material.descricao}</span>
                  <button
                    onClick={() => onToggle(material.id)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MaterialMultiSelect;
