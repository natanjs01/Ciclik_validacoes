import { motion } from 'framer-motion';
import { Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/formatters';

interface Cupom {
  id: string;
  marketplace: string;
  valor_reais: number;
  pontos_necessarios: number;
  quantidade_disponivel: number;
  limite_alerta: number;
}

interface CouponGalleryProps {
  cupons: Cupom[];
  pontosUsuario: number;
  onResgatar: (cupomId: string) => void;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}

// Mapeamento de cores e ícones para marketplaces conhecidos
const marketplaceStyles: Record<string, { bg: string; text: string; gradient: string }> = {
  amazon: { bg: 'from-orange-500 to-amber-600', text: 'text-white', gradient: 'bg-gradient-to-br' },
  magalu: { bg: 'from-blue-600 to-blue-700', text: 'text-white', gradient: 'bg-gradient-to-br' },
  ifood: { bg: 'from-red-500 to-red-600', text: 'text-white', gradient: 'bg-gradient-to-br' },
  mercadolivre: { bg: 'from-yellow-400 to-yellow-500', text: 'text-black', gradient: 'bg-gradient-to-br' },
  casasbahia: { bg: 'from-blue-700 to-blue-800', text: 'text-white', gradient: 'bg-gradient-to-br' },
  aliexpress: { bg: 'from-red-600 to-orange-500', text: 'text-white', gradient: 'bg-gradient-to-br' },
  shopee: { bg: 'from-orange-500 to-red-500', text: 'text-white', gradient: 'bg-gradient-to-br' },
  kabum: { bg: 'from-orange-600 to-orange-700', text: 'text-white', gradient: 'bg-gradient-to-br' },
  uber: { bg: 'from-black to-gray-800', text: 'text-white', gradient: 'bg-gradient-to-br' },
  rappi: { bg: 'from-orange-500 to-red-500', text: 'text-white', gradient: 'bg-gradient-to-br' },
  default: { bg: 'from-primary to-primary/80', text: 'text-primary-foreground', gradient: 'bg-gradient-to-br' }
};

const getMarketplaceStyle = (marketplace: string) => {
  const key = marketplace.toLowerCase().replace(/[^a-z]/g, '');
  return marketplaceStyles[key] || marketplaceStyles.default;
};

const getMarketplaceInitial = (marketplace: string) => {
  return marketplace.charAt(0).toUpperCase();
};

export default function CouponGallery({ 
  cupons, 
  pontosUsuario, 
  onResgatar,
  isAdmin,
  onDelete 
}: CouponGalleryProps) {
  const podeResgatar = (cupom: Cupom) => pontosUsuario >= cupom.pontos_necessarios;
  const pontosFaltantes = (cupom: Cupom) => Math.max(0, cupom.pontos_necessarios - pontosUsuario);

  if (cupons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Gift className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Nenhum cupom disponível no momento</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
      {cupons.map((cupom, index) => {
        const style = getMarketplaceStyle(cupom.marketplace);
        const canRedeem = podeResgatar(cupom);
        const missing = pontosFaltantes(cupom);
        
        return (
          <motion.div
            key={cupom.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center group cursor-pointer"
            onClick={() => canRedeem && onResgatar(cupom.id)}
          >
            {/* Icon Container */}
            <motion.div 
              className={`
                relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${style.gradient} ${style.bg}
                shadow-lg group-hover:shadow-xl transition-shadow duration-300
                flex items-center justify-center overflow-hidden
              `}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              
              {/* Marketplace Initial */}
              <span className={`text-2xl sm:text-3xl font-bold ${style.text} relative z-10`}>
                {getMarketplaceInitial(cupom.marketplace)}
              </span>
              
              {/* Sparkle for redeemable */}
              {canRedeem && (
                <motion.div
                  className="absolute -top-1 -right-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Sparkles className="h-4 w-4 text-yellow-400 drop-shadow-lg" />
                </motion.div>
              )}

              {/* Low stock indicator */}
              {cupom.quantidade_disponivel <= cupom.limite_alerta && (
                <div className="absolute -bottom-1 -right-1 bg-destructive text-destructive-foreground 
                  text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                  {cupom.quantidade_disponivel}
                </div>
              )}
            </motion.div>
            
            {/* Marketplace Name */}
            <p className="mt-2 text-xs sm:text-sm font-medium text-center line-clamp-1 max-w-full px-1">
              {cupom.marketplace}
            </p>
            
            {/* Discount/Value */}
            <div className="flex flex-col items-center mt-1">
              <span className={`text-sm sm:text-base font-bold ${canRedeem ? 'text-primary' : 'text-muted-foreground'}`}>
                {formatCurrency(cupom.valor_reais)}
              </span>
              
              {/* Points info - with tooltip */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`text-[10px] sm:text-xs mt-0.5 cursor-help ${canRedeem ? 'text-primary/70' : 'text-muted-foreground'}`}>
                      {canRedeem ? `${cupom.pontos_necessarios} pts` : `-${missing} pts`}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs max-w-[180px]">
                    {canRedeem 
                      ? `Custo: ${cupom.pontos_necessarios} pontos` 
                      : `Faltam ${missing} pontos para resgatar este cupom`
                    }
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Redeem button for eligible */}
            {canRedeem && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 w-full"
              >
                <Button 
                  size="sm" 
                  className="w-full h-7 text-xs rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResgatar(cupom.id);
                  }}
                >
                  Resgatar
                </Button>
              </motion.div>
            )}

            {/* Admin delete */}
            {isAdmin && onDelete && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="mt-1 h-6 text-xs text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(cupom.id);
                }}
              >
                Remover
              </Button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
