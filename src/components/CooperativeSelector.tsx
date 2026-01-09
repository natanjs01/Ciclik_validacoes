import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Loader2, Search, X, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { calculateDistance, formatDistance, sortByDistance } from '@/lib/distance';
import { useGeolocation } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

interface CooperativaWithDistance extends Cooperativa {
  distance: number | null;
}

interface CooperativeSelectorProps {
  cooperativas: Cooperativa[];
  selected: string;
  onSelect: (id: string) => void;
  className?: string;
}

export default function CooperativeSelector({
  cooperativas,
  selected,
  onSelect,
  className,
}: CooperativeSelectorProps) {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const {
    coordinates,
    loading: geoLoading,
    permissionDenied,
    source,
    requestBrowserLocation,
  } = useGeolocation();

  const handleOpenRoute = useCallback(async (
    e: React.MouseEvent,
    coopId: string,
    coopLat: number,
    coopLng: number
  ) => {
    e.stopPropagation();
    
    const url = coordinates
      ? `https://www.google.com/maps/dir/?api=1&origin=${coordinates.latitude},${coordinates.longitude}&destination=${coopLat},${coopLng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${coopLat},${coopLng}`;
    
    try {
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (newWindow) return;
    } catch {}
    
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(coopId);
      toast.success('Link copiado!');
      setTimeout(() => setCopiedId(null), 3000);
    } catch {
      toast.info('Copie o link:', { description: url, duration: 10000 });
    }
  }, [coordinates]);

  const cooperativasOrdenadas = useMemo((): CooperativaWithDistance[] => {
    const withDistances = cooperativas.map((coop) => {
      let distance: number | null = null;
      if (coordinates && coop.latitude && coop.longitude) {
        distance = calculateDistance(
          coordinates.latitude,
          coordinates.longitude,
          Number(coop.latitude),
          Number(coop.longitude)
        );
      }
      return { ...coop, distance };
    });
    return sortByDistance(withDistances);
  }, [cooperativas, coordinates]);

  const cooperativasFiltradas = useMemo(() => {
    if (!search.trim()) return cooperativasOrdenadas;
    const term = search.toLowerCase();
    return cooperativasOrdenadas.filter((coop) => {
      const nome = coop.nome_fantasia?.toLowerCase() || '';
      const cidade = coop.cidade?.toLowerCase() || '';
      const bairro = coop.bairro?.toLowerCase() || '';
      return nome.includes(term) || cidade.includes(term) || bairro.includes(term);
    });
  }, [cooperativasOrdenadas, search]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Location status */}
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          {geoLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Localizando...</span>
            </>
          ) : coordinates ? (
            <>
              <MapPin className="h-3.5 w-3.5 text-success" />
              <span>Ordenado por proximidade</span>
            </>
          ) : (
            <>
              <MapPin className="h-3.5 w-3.5" />
              <span>{permissionDenied ? 'GPS negado' : 'GPS desativado'}</span>
            </>
          )}
        </div>
        
        {!coordinates && !geoLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={requestBrowserLocation}
            className="h-7 px-2 text-xs"
          >
            <Navigation className="h-3.5 w-3.5 mr-1" />
            Ativar
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, cidade ou bairro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-8 h-10"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-1 max-h-[280px] overflow-y-auto -mx-1 px-1">
        <AnimatePresence mode="popLayout">
          {cooperativasFiltradas.map((coop, index) => {
            const isSelected = selected === coop.id;
            
            return (
              <motion.div
                key={coop.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(coop.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(coop.id);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-colors",
                    isSelected
                      ? "bg-primary/10"
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Radio indicator */}
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    )}>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 rounded-full bg-primary-foreground"
                        />
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {coop.nome_fantasia}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {coop.bairro && `${coop.bairro}, `}
                        {coop.cidade} - {coop.uf}
                      </p>
                    </div>
                  </div>
                  
                  {/* Distance + Route */}
                  <div className="flex items-center gap-2 shrink-0">
                    {coop.distance !== null && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatDistance(coop.distance)}
                      </span>
                    )}
                    
                    {coop.latitude && coop.longitude && (
                      <button
                        type="button"
                        onClick={(e) => handleOpenRoute(e, coop.id, Number(coop.latitude), Number(coop.longitude))}
                        className={cn(
                          "p-1.5 rounded-md transition-colors",
                          "text-muted-foreground hover:text-primary hover:bg-primary/10",
                          copiedId === coop.id && "text-success"
                        )}
                      >
                        {copiedId === coop.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {cooperativasFiltradas.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {search ? 'Nenhum resultado encontrado' : 'Nenhuma cooperativa disponível'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
