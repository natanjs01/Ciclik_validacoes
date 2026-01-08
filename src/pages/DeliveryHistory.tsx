import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Package, Truck, CheckCircle2, Clock, AlertTriangle, Recycle, Scale, Sparkles, TrendingUp, Target } from 'lucide-react';
import { format, isToday, isYesterday, differenceInHours, differenceInMinutes, getYear, getMonth, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import CiclikHeader from '@/components/CiclikHeader';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useEffect as useAnimationEffect } from 'react';

type FilterType = 'todos' | 'ativa' | 'em_coleta' | 'finalizada' | 'expirada';

const filterOptions: { value: FilterType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'todos', label: 'Todos', icon: <Package className="h-4 w-4" />, color: 'bg-muted hover:bg-muted/80 text-foreground' },
  { value: 'ativa', label: 'Aguardando', icon: <Clock className="h-4 w-4" />, color: 'bg-blue-100 hover:bg-blue-200 text-blue-700' },
  { value: 'em_coleta', label: 'Em Coleta', icon: <Truck className="h-4 w-4" />, color: 'bg-amber-100 hover:bg-amber-200 text-amber-700' },
  { value: 'finalizada', label: 'Finalizadas', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700' },
  { value: 'expirada', label: 'Expiradas', icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-red-100 hover:bg-red-200 text-red-700' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
  }
};

export default function DeliveryHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entregas, setEntregas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('todos');

  useEffect(() => {
    loadEntregas();
  }, []);

  const loadEntregas = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('entregas_reciclaveis')
        .select(`
          *,
          cooperativas:id_cooperativa(nome_fantasia)
        `)
        .eq('id_usuario', user.id)
        .order('data_geracao', { ascending: false });

      if (error) throw error;
      setEntregas(data || []);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (dataGeracao: string, statusPromessa: string, status: string) => {
    if (statusPromessa !== 'ativa' && status !== 'gerada') return false;
    const dataLimite = new Date(dataGeracao);
    dataLimite.setHours(dataLimite.getHours() + 24);
    return new Date() > dataLimite;
  };

  const getEffectiveStatus = (entrega: any) => {
    if (isExpired(entrega.data_geracao, entrega.status_promessa, entrega.status)) {
      return 'expirada';
    }
    return entrega.status_promessa || entrega.status;
  };

  const getTimeRemaining = (dataGeracao: string) => {
    const dataLimite = new Date(dataGeracao);
    dataLimite.setHours(dataLimite.getHours() + 24);
    const now = new Date();
    
    if (now > dataLimite) return null;
    
    const hoursLeft = differenceInHours(dataLimite, now);
    const minutesLeft = differenceInMinutes(dataLimite, now) % 60;
    
    if (hoursLeft > 0) {
      return `${hoursLeft}h ${minutesLeft}min restantes`;
    }
    return `${minutesLeft}min restantes`;
  };

  const isExpiring = (dataGeracao: string) => {
    const dataLimite = new Date(dataGeracao);
    dataLimite.setHours(dataLimite.getHours() + 24);
    const hoursLeft = differenceInHours(dataLimite, new Date());
    return hoursLeft <= 2 && hoursLeft >= 0;
  };

  // Calculate stats
  const stats = useMemo(() => {
    const counts = { ativa: 0, em_coleta: 0, finalizada: 0, expirada: 0 };
    let totalKg = 0;
    
    entregas.forEach(entrega => {
      const status = getEffectiveStatus(entrega);
      if (status in counts) {
        counts[status as keyof typeof counts]++;
      }
      if ((status === 'finalizada' || status === 'validada') && entrega.peso_validado) {
        totalKg += entrega.peso_validado;
      }
    });
    
    return { ...counts, totalKg, total: entregas.length };
  }, [entregas]);

  // Calculate projection for next month based on average monthly kg
  const projectedNextMonthKg = useMemo(() => {
    const now = new Date();
    const threeMonthsAgo = subMonths(now, 3);
    
    let totalKgLast3Months = 0;
    let monthsWithData = 0;
    
    entregas.forEach(entrega => {
      const date = new Date(entrega.data_geracao);
      const status = getEffectiveStatus(entrega);
      
      if (date >= threeMonthsAgo && (status === 'finalizada' || status === 'validada') && entrega.peso_validado) {
        totalKgLast3Months += entrega.peso_validado;
      }
    });
    
    // Count months with activity
    for (let i = 0; i < 3; i++) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      
      const hasActivity = entregas.some(e => {
        const date = new Date(e.data_geracao);
        return date >= monthStart && date <= monthEnd;
      });
      
      if (hasActivity) monthsWithData++;
    }
    
    if (monthsWithData === 0) return 15; // Default projection for new users
    
    // Calculate average and add 20% growth incentive
    const avgMonthly = totalKgLast3Months / monthsWithData;
    return Math.max(avgMonthly * 1.2, 10); // At least 10kg projection
  }, [entregas]);

  // Animated counter component
  const AnimatedCounter = ({ value }: { value: number }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => latest.toFixed(1));
    
    useAnimationEffect(() => {
      const controls = animate(count, value, { duration: 2, ease: 'easeOut' });
      return controls.stop;
    }, [value]);
    
    return <motion.span>{rounded}</motion.span>;
  };

  // Chart data by year and month
  const chartData = useMemo(() => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const yearlyData: { [year: number]: { month: string; prometidas: number; finalizadas: number; expiradas: number }[] } = {};
    
    entregas.forEach(entrega => {
      const date = new Date(entrega.data_geracao);
      const year = getYear(date);
      const month = getMonth(date);
      
      if (!yearlyData[year]) {
        yearlyData[year] = monthNames.map(m => ({ month: m, prometidas: 0, finalizadas: 0, expiradas: 0 }));
      }
      
      yearlyData[year][month].prometidas++;
      
      const status = getEffectiveStatus(entrega);
      if (status === 'finalizada' || status === 'validada') {
        yearlyData[year][month].finalizadas++;
      } else if (status === 'expirada') {
        yearlyData[year][month].expiradas++;
      }
    });
    
    // Get available years sorted descending
    const years = Object.keys(yearlyData).map(Number).sort((a, b) => b - a);
    
    return { yearlyData, years };
  }, [entregas]);

  const filteredEntregas = entregas.filter(entrega => {
    if (filter === 'todos') return true;
    return getEffectiveStatus(entrega) === filter;
  });

  // Group by date
  const groupedEntregas = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    
    filteredEntregas.forEach(entrega => {
      const date = new Date(entrega.data_geracao);
      let groupKey: string;
      
      if (isToday(date)) {
        groupKey = 'Hoje';
      } else if (isYesterday(date)) {
        groupKey = 'Ontem';
      } else {
        groupKey = format(date, "dd 'de' MMMM", { locale: ptBR });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(entrega);
    });
    
    return groups;
  }, [filteredEntregas]);

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string; icon: React.ReactNode }> = {
      finalizada: { 
        label: 'Entregue', 
        bgColor: 'bg-emerald-100', 
        textColor: 'text-emerald-700',
        borderColor: 'border-l-emerald-500',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />
      },
      em_coleta: { 
        label: 'Em Coleta', 
        bgColor: 'bg-amber-100', 
        textColor: 'text-amber-700',
        borderColor: 'border-l-amber-500',
        icon: <Truck className="h-3.5 w-3.5" />
      },
      ativa: { 
        label: 'Aguardando', 
        bgColor: 'bg-blue-100', 
        textColor: 'text-blue-700',
        borderColor: 'border-l-blue-500',
        icon: <Clock className="h-3.5 w-3.5" />
      },
      expirada: { 
        label: 'Expirada', 
        bgColor: 'bg-red-100', 
        textColor: 'text-red-700',
        borderColor: 'border-l-red-500',
        icon: <AlertTriangle className="h-3.5 w-3.5" />
      },
      validada: { 
        label: 'Validada', 
        bgColor: 'bg-emerald-100', 
        textColor: 'text-emerald-700',
        borderColor: 'border-l-emerald-500',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />
      },
      recebida: { 
        label: 'Recebida', 
        bgColor: 'bg-purple-100', 
        textColor: 'text-purple-700',
        borderColor: 'border-l-purple-500',
        icon: <Package className="h-3.5 w-3.5" />
      },
      gerada: { 
        label: 'Gerada', 
        bgColor: 'bg-gray-100', 
        textColor: 'text-gray-700',
        borderColor: 'border-l-gray-400',
        icon: <Package className="h-3.5 w-3.5" />
      },
    };
    return configs[status] || configs.gerada;
  };

  const getMaterialIcon = (status: string) => {
    if (status === 'finalizada' || status === 'validada') {
      return (
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="h-5 w-5 text-white" />
        </div>
      );
    }
    if (status === 'em_coleta') {
      return (
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Truck className="h-5 w-5 text-white" />
        </div>
      );
    }
    if (status === 'expirada') {
      return (
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
          <AlertTriangle className="h-5 w-5 text-white" />
        </div>
      );
    }
    return (
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
        <Clock className="h-5 w-5 text-white" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Standard Header */}
      <CiclikHeader showBackButton backTo="/user" title="Histórico de Entregas" />

      {/* Premium Stats Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground overflow-hidden"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>
        
        <div className="relative mx-auto max-w-lg px-4 py-6">

          {/* Hero Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20"
          >
            {/* Main Stats */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Recycle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <motion.p 
                    key={stats.total}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl font-bold"
                  >
                    {stats.total}
                  </motion.p>
                  <p className="text-sm text-white/70">entregas prometidas</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <Scale className="h-4 w-4 text-white/70" />
                  <motion.span 
                    key={stats.totalKg}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl font-bold"
                  >
                    {stats.totalKg.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </motion.span>
                  <span className="text-sm text-white/70">kg</span>
                </div>
                <p className="text-xs text-white/60">material entregue</p>
              </div>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'ativa', label: 'Aguardando', color: 'from-blue-400/30 to-blue-500/30', count: stats.ativa },
                { key: 'em_coleta', label: 'Em Coleta', color: 'from-amber-400/30 to-amber-500/30', count: stats.em_coleta },
                { key: 'finalizada', label: 'Finalizadas', color: 'from-emerald-400/30 to-emerald-500/30', count: stats.finalizada },
                { key: 'expirada', label: 'Expiradas', color: 'from-red-400/30 to-red-500/30', count: stats.expirada },
              ].map((item, index) => (
                <motion.button
                  key={item.key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(item.key as FilterType)}
                  className={`
                    relative p-2 rounded-xl bg-gradient-to-br ${item.color} backdrop-blur-sm
                    border border-white/10 transition-all
                    ${filter === item.key ? 'ring-2 ring-white/50' : ''}
                  `}
                >
                  <p className="text-xl font-bold">{item.count}</p>
                  <p className="text-[10px] text-white/70 truncate">{item.label}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="mx-auto max-w-lg px-4 pt-4 space-y-4">

        {/* Charts Section */}
        {!loading && chartData.years.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-4 border border-border/40"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Evolução por Ano</h3>
              </div>
              {chartData.years.length > 1 && (
                <div className="flex gap-1">
                  {chartData.years.map(year => (
                    <Button
                      key={year}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        const el = document.getElementById(`chart-${year}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }}
                    >
                      {year}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              {chartData.years.map(year => (
                <div key={year} id={`chart-${year}`}>
                  <p className="text-xs font-medium text-muted-foreground mb-2">{year}</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData.yearlyData[year]} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar 
                          yAxisId="left"
                          dataKey="prometidas" 
                          name="Prometidas"
                          fill="hsl(var(--primary))" 
                          opacity={0.7}
                          radius={[4, 4, 0, 0]}
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="finalizadas" 
                          name="Finalizadas"
                          stroke="#10b981" 
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="expiradas" 
                          name="Expiradas"
                          stroke="#ef4444" 
                          strokeWidth={2.5}
                          strokeDasharray="5 5"
                          dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-emerald-600 p-6 text-primary-foreground"
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
              }}
              className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"
            />
            <motion.div 
              animate={{ 
                rotate: -360,
                x: [0, 20, 0],
                y: [0, -10, 0]
              }}
              transition={{ 
                rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
                x: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
                y: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
              }}
              className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"
            />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/2 right-1/4 w-3 h-3 bg-white/30 rounded-full"
            />
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-white/20 rounded-full"
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0"
              >
                <Recycle className="h-7 w-7 text-white" />
              </motion.div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">
                  Continue reciclando!
                </h3>
                <p className="text-sm text-white/80 leading-relaxed mb-3">
                  Cada entrega faz a diferença para o planeta e gera pontos para você trocar por benefícios.
                </p>
                
                {/* Animated Goal Counter */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: 'spring' }}
                  className="bg-white/15 backdrop-blur-sm rounded-xl p-3 mb-4 border border-white/20"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center"
                    >
                      <Target className="h-5 w-5 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-xs text-white/70 mb-0.5">Meta para próximo mês</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white">
                          <AnimatedCounter value={projectedNextMonthKg} />
                        </span>
                        <span className="text-sm text-white/80">kg</span>
                        <motion.span
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                          className="ml-1 text-xs text-emerald-200"
                        >
                          ↑ +20%
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => navigate('/deliver-recyclables')}
                    className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 rounded-xl px-6 py-2.5 font-semibold shadow-lg shadow-black/10 gap-2"
                  >
                    <motion.span
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="h-4 w-4" />
                    </motion.span>
                    Nova entrega
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      →
                    </motion.span>
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
