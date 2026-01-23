import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  FileText, 
  Package, 
  Truck, 
  Gift, 
  UserPlus, 
  Settings,
  Leaf,
  CalendarIcon,
  Sparkles,
  Filter,
  X
} from "lucide-react";
import { format, isToday, isYesterday, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { formatNumber } from "@/lib/formatters";
import { motion, AnimatePresence } from "framer-motion";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import CiclikHeader from "@/components/CiclikHeader";

interface PointTransaction {
  date: string;
  type: 'missao' | 'nota_fiscal' | 'material_cadastro' | 'entrega_validada' | 'cupom_resgate' | 'indicacao_cadastro' | 'indicacao_primeira_missao';
  points: number;
  description: string;
  details?: string;
}

interface GroupedTransactions {
  label: string;
  transactions: PointTransaction[];
}

const PointsStatement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [extratoTotal, setExtratoTotal] = useState(0);
  const [totalGanhos, setTotalGanhos] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allTransactions: PointTransaction[] = [];

      const { data: configs } = await supabase
        .from('configuracoes_sistema')
        .select('chave, valor')
        .like('chave', 'pontos_%');

      const pontosConfig: Record<string, number> = {};
      configs?.forEach(config => {
        pontosConfig[config.chave] = parseInt(config.valor);
      });

      // 1. Missões concluídas
      const { data: missoes } = await supabase
        .from('missoes_usuarios')
        .select(`data_conclusao, missoes (titulo, pontos)`)
        .eq('id_usuario', user.id)
        .order('data_conclusao', { ascending: false });

      missoes?.forEach(missao => {
        if (missao.data_conclusao) {
          const missaoData = missao.missoes as any;
          allTransactions.push({
            date: missao.data_conclusao,
            type: 'missao',
            points: pontosConfig['pontos_missao_completa'] ?? 0,
            description: 'Missão Concluída',
            details: missaoData?.titulo || 'Missão'
          });
        }
      });

      // 2. Notas fiscais validadas
      const { data: notas } = await supabase
        .from('notas_fiscais')
        .select('data_envio, numero_nota')
        .eq('id_usuario', user.id)
        .eq('status_validacao', 'validada')
        .order('data_envio', { ascending: false });

      const pontosNotaFiscal = pontosConfig['pontos_nota_fiscal_validada'] ?? 0;
      notas?.forEach(nota => {
        if (nota.data_envio) {
          allTransactions.push({
            date: nota.data_envio,
            type: 'nota_fiscal',
            points: pontosNotaFiscal,
            description: 'Nota Fiscal Validada',
            details: nota.numero_nota ? `NF ${nota.numero_nota}` : undefined
          });
        }
      });

      // 3. Materiais cadastrados
      const { data: materiais } = await supabase
        .from('materiais_reciclaveis_usuario')
        .select('data_cadastro, descricao, origem_cadastro')
        .eq('id_usuario', user.id)
        .order('data_cadastro', { ascending: false });

      const pontosMaterialNota = pontosConfig['pontos_material_cadastro_nota'] ?? 0;
      const pontosMaterialManual = pontosConfig['pontos_material_cadastro_manual'] ?? 0;

      materiais?.forEach(material => {
        if (material.data_cadastro) {
          const pontosAtual = material.origem_cadastro === 'nota_fiscal' ? pontosMaterialNota : pontosMaterialManual;
          allTransactions.push({
            date: material.data_cadastro,
            type: 'material_cadastro',
            points: pontosAtual,
            description: material.origem_cadastro === 'nota_fiscal' ? 'Material (NF)' : 'Material (Manual)',
            details: material.descricao
          });
        }
      });

      // 4. Entregas validadas - calcular usando fórmula oficial CORRIGIDA
      const { data: entregas } = await supabase
        .from('entregas_reciclaveis')
        .select('data_validacao, peso_validado, tipo_material')
        .eq('id_usuario', user.id)
        .eq('status', 'validada')
        .order('data_validacao', { ascending: false });

      const pontosEntregaPor6Kg = pontosConfig['pontos_base_entrega_6kg'] ?? 20;

      // ✅ CORREÇÃO: Agregar peso total ANTES de calcular pontos
      // Fórmula correta: (soma_pesos / 6) * pontos - MANTÉM DECIMAIS
      if (entregas && entregas.length > 0) {
        const pesoTotalValidado = entregas.reduce((acc, e) => acc + (e.peso_validado || 0), 0);
        const pontosTotaisEntregas = Math.round((pesoTotalValidado / 6) * pontosEntregaPor6Kg);
        
        // Adicionar transação consolidada de entregas
        const dataUltimaEntrega = entregas[0]?.data_validacao;
        if (dataUltimaEntrega && pontosTotaisEntregas > 0) {
          allTransactions.push({
            date: dataUltimaEntrega,
            type: 'entrega_validada',
            points: pontosTotaisEntregas,
            description: 'Entregas Validadas',
            details: `${pesoTotalValidado.toFixed(2)}kg total (${entregas.length} ${entregas.length === 1 ? 'entrega' : 'entregas'})`
          });
        }
      }

      // 5. Cupons resgatados
      const { data: cupons } = await supabase
        .from('cupons_resgates')
        .select(`data_resgate, pontos_utilizados, cupons (marketplace, valor_reais)`)
        .eq('id_usuario', user.id)
        .order('data_resgate', { ascending: false });

      cupons?.forEach(cupom => {
        if (cupom.data_resgate) {
          allTransactions.push({
            date: cupom.data_resgate,
            type: 'cupom_resgate',
            points: -cupom.pontos_utilizados,
            description: 'Cupom Resgatado',
            details: `${(cupom.cupons as any)?.marketplace}`
          });
        }
      });

      // 6. Indicações
      const { data: indicacoes } = await supabase
        .from('indicacoes')
        .select(`data_indicacao, pontos_cadastro_concedidos, pontos_primeira_missao_concedidos, profiles!indicacoes_id_indicado_fkey (nome)`)
        .eq('id_indicador', user.id)
        .order('data_indicacao', { ascending: false });

      const pontosIndicacaoCadastro = pontosConfig['pontos_indicacao_cadastro'] ?? 0;
      const pontosIndicacaoPrimeiraMissao = pontosConfig['pontos_indicacao_primeira_missao'] ?? 0;

      indicacoes?.forEach(indicacao => {
        if (indicacao.data_indicacao && indicacao.pontos_cadastro_concedidos) {
          allTransactions.push({
            date: indicacao.data_indicacao,
            type: 'indicacao_cadastro',
            points: pontosIndicacaoCadastro,
            description: 'Indicação',
            details: `${(indicacao.profiles as any)?.nome?.split(' ')[0]} se cadastrou`
          });
        }
        if (indicacao.pontos_primeira_missao_concedidos) {
          allTransactions.push({
            date: indicacao.data_indicacao,
            type: 'indicacao_primeira_missao',
            points: pontosIndicacaoPrimeiraMissao,
            description: 'Bônus Indicação',
            details: `${(indicacao.profiles as any)?.nome?.split(' ')[0]} completou missão`
          });
        }
      });

      // NOTA: Ajustes manuais NÃO são exibidos no extrato - são registros de auditoria apenas

      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(allTransactions);
      
      const total = allTransactions.reduce((sum, t) => sum + t.points, 0);
      const ganhos = allTransactions.filter(t => t.points > 0).reduce((sum, t) => sum + t.points, 0);
      const gastos = allTransactions.filter(t => t.points < 0).reduce((sum, t) => sum + Math.abs(t.points), 0);
      
      setExtratoTotal(total);
      setTotalGanhos(ganhos);
      setTotalGastos(gastos);

    } catch (error) {
      console.error('Erro ao carregar extrato:', error);
      toast.error('Erro ao carregar extrato de pontos');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: PointTransaction['type']) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'missao': return <Trophy className={iconClass} />;
      case 'nota_fiscal': return <FileText className={iconClass} />;
      case 'material_cadastro': return <Package className={iconClass} />;
      case 'entrega_validada': return <Truck className={iconClass} />;
      case 'cupom_resgate': return <Gift className={iconClass} />;
      case 'indicacao_cadastro':
      case 'indicacao_primeira_missao': return <UserPlus className={iconClass} />;
      default: return <Sparkles className={iconClass} />;
    }
  };

  const getTypeColor = (type: PointTransaction['type'], points: number) => {
    if (points < 0) return 'bg-rose-500/15 text-rose-600 dark:text-rose-400';
    switch (type) {
      case 'missao': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
      case 'nota_fiscal': return 'bg-blue-500/15 text-blue-600 dark:text-blue-400';
      case 'material_cadastro': return 'bg-violet-500/15 text-violet-600 dark:text-violet-400';
      case 'entrega_validada': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
      case 'cupom_resgate': return 'bg-rose-500/15 text-rose-600 dark:text-rose-400';
      case 'indicacao_cadastro':
      case 'indicacao_primeira_missao': return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  // Filter transactions by date range
  const filteredTransactions = dateRange?.from 
    ? transactions.filter(t => {
        const txDate = new Date(t.date);
        const start = startOfDay(dateRange.from!);
        const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
        return isWithinInterval(txDate, { start, end });
      })
    : transactions;

  // Calculate filtered totals
  const filteredGanhos = filteredTransactions.filter(t => t.points > 0).reduce((sum, t) => sum + t.points, 0);
  const filteredGastos = filteredTransactions.filter(t => t.points < 0).reduce((sum, t) => sum + Math.abs(t.points), 0);

  // Agrupar transações por data
  const groupTransactionsByDate = (): GroupedTransactions[] => {
    const groups: { [key: string]: PointTransaction[] } = {};
    
    filteredTransactions.forEach(t => {
      const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });

    return Object.entries(groups).map(([date, txs]) => ({
      label: getDateLabel(date),
      transactions: txs
    }));
  };

  const groupedTransactions = groupTransactionsByDate();

  const clearFilter = () => {
    setDateRange(undefined);
    setIsFilterOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      {/* Fixed Header */}
      <CiclikHeader showBackButton backTo="/user" title="Extrato de Pontos" />

      {/* Balance Section */}
      <motion.div 
        className="relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Background with mesh gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-emerald-600" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative mx-auto max-w-lg px-4 pt-4 pb-6">
          {/* Balance Card */}
          <motion.div 
            className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          >
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 mb-3">
                <Leaf className="h-4 w-4 text-emerald-300" />
                <span className="text-xs font-medium text-white/90">Saldo Disponível</span>
              </div>
              <motion.p 
                className="text-5xl font-bold text-white tracking-tight"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                {formatNumber(extratoTotal, 0)}
              </motion.p>
              <p className="text-sm text-white/60 mt-1">pontos verdes</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div 
                className="bg-emerald-400/20 rounded-2xl p-3"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-400/30 flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
                  </div>
                  <span className="text-[11px] font-medium text-white/80">Ganhos</span>
                </div>
                <p className="text-xl font-bold text-white">+{formatNumber(dateRange?.from ? filteredGanhos : totalGanhos, 0)}</p>
              </motion.div>
              
              <motion.div 
                className="bg-rose-400/20 rounded-2xl p-3"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-rose-400/30 flex items-center justify-center">
                    <TrendingDown className="h-3.5 w-3.5 text-rose-300" />
                  </div>
                  <span className="text-[11px] font-medium text-white/80">Resgatados</span>
                </div>
                <p className="text-xl font-bold text-white">-{formatNumber(dateRange?.from ? filteredGastos : totalGastos, 0)}</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Transaction List Container */}
      <div className="mx-auto max-w-lg px-4 -mt-2">
        <div className="bg-card rounded-t-3xl shadow-xl border border-border/50 min-h-[50vh]">
          {/* Filter Section */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Histórico</span>
                <Badge variant="secondary" className="text-[10px] h-5">
                  {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transação' : 'transações'}
                </Badge>
              </div>
              
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateRange?.from ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-8 gap-2 text-xs rounded-xl",
                      dateRange?.from && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    {dateRange?.from ? (
                      <>
                        {format(dateRange.from, "dd/MM", { locale: ptBR })}
                        {dateRange.to && ` - ${format(dateRange.to, "dd/MM", { locale: ptBR })}`}
                      </>
                    ) : (
                      "Filtrar"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-3 border-b border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Período</span>
                      {dateRange?.from && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilter}
                          className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Limpar
                        </Button>
                      )}
                    </div>
                  </div>
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Active Filter Indicator */}
            <AnimatePresence>
              {dateRange?.from && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-xl text-xs">
                    <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-foreground">
                      Exibindo: {format(dateRange.from, "dd 'de' MMMM", { locale: ptBR })}
                      {dateRange.to && dateRange.to !== dateRange.from && (
                        <> até {format(dateRange.to, "dd 'de' MMMM", { locale: ptBR })}</>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilter}
                      className="h-5 w-5 p-0 ml-auto hover:bg-primary/20"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Transaction List */}
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-muted/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <Leaf className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {dateRange?.from ? 'Nenhuma transação no período' : 'Nenhuma transação'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dateRange?.from 
                    ? 'Tente selecionar outro período' 
                    : 'Complete missões e entregue recicláveis para ganhar pontos!'
                  }
                </p>
                {dateRange?.from && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilter}
                    className="mt-4"
                  >
                    Limpar filtro
                  </Button>
                )}
              </motion.div>
            ) : (
              <AnimatePresence>
                {groupedTransactions.map((group, groupIndex) => (
                  <motion.div 
                    key={group.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIndex * 0.05 }}
                    className="mb-5"
                  >
                    {/* Date label */}
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.label}
                      </span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>

                    {/* Transactions */}
                    <div className="space-y-2">
                      {group.transactions.map((transaction, index) => (
                        <motion.div
                          key={`${transaction.date}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-border/50"
                        >
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getTypeColor(transaction.type, transaction.points)}`}>
                            {getIcon(transaction.type)}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {transaction.description}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {transaction.details || format(new Date(transaction.date), "HH:mm", { locale: ptBR })}
                            </p>
                          </div>

                          {/* Points */}
                          <div className={`text-right flex-shrink-0 ${transaction.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            <p className="text-sm font-bold">
                              {transaction.points > 0 ? '+' : ''}{transaction.points}
                            </p>
                            <p className="text-[10px] opacity-60">pts</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsStatement;
