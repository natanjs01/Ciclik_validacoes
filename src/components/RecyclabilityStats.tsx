import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Leaf, FileText, Truck, AlertTriangle, Sparkles, Target, Recycle, ArrowRight, FileBarChart } from 'lucide-react';
import { formatWeight } from '@/lib/formatters';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import EnvironmentalReportModal from './EnvironmentalReportModal';

interface ImpactoStats {
  totalNotasFiscais: number;
  pesoTotalNotas: number;
  totalEntregasFinalizadas: number;
  pesoTotalEntregue: number;
  pesoRejeito: number;
  pesoEstimadoPromessas: number;
  percentualEntregue: number;
}

const CircularProgress = ({ percentage, size = 180, strokeWidth = 12, color, children }: { 
  percentage: number; size?: number; strokeWidth?: number; color: string; children?: React.ReactNode;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};

const StatPill = ({ icon: Icon, label, value, color, delay = 0 }: { 
  icon: React.ElementType; label: string; value: string | number; color: "primary" | "success" | "destructive" | "warning"; delay?: number;
}) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success/10 text-success border-success/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    warning: "bg-warning/10 text-warning border-warning/20"
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.4 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-sm ${colorClasses[color]}`}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <div className="flex flex-col">
        <span className="text-xs font-medium opacity-80">{label}</span>
        <span className="text-lg font-bold">{value}</span>
      </div>
    </motion.div>
  );
};

export default function RecyclabilityStats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ImpactoStats>({ totalNotasFiscais: 0, pesoTotalNotas: 0, totalEntregasFinalizadas: 0, pesoTotalEntregue: 0, pesoRejeito: 0, pesoEstimadoPromessas: 0, percentualEntregue: 0 });
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => { if (user) loadImpactoStats(); }, [user]);

  const loadImpactoStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { count: totalNotas } = await supabase.from('notas_fiscais').select('id', { count: 'exact' }).eq('id_usuario', user.id);
      const { data: materiaisNotas } = await supabase.from('materiais_reciclaveis_usuario').select('peso_total_estimado_gramas, peso_unitario_gramas, quantidade').eq('id_usuario', user.id).not('id_nota_fiscal', 'is', null);
      const pesoTotalNotas = materiaisNotas?.reduce((acc, m) => acc + (m.peso_total_estimado_gramas || ((m.peso_unitario_gramas || 0) * (m.quantidade || 1))), 0) || 0;
      
      const { data: entregas } = await supabase.from('entregas_reciclaveis').select('id, peso_estimado').eq('id_usuario', user.id).eq('status_promessa', 'finalizada');
      
      // Calcular peso estimado total das promessas de entrega
      const pesoEstimadoPromessas = entregas?.reduce((acc, e) => acc + (e.peso_estimado || 0), 0) || 0;
      
      let pesoTotalEntregue = 0, pesoRejeito = 0;
      if (entregas && entregas.length > 0) {
        const entregaIds = entregas.map(e => e.id);
        const { data: materiaisColetados } = await supabase.from('materiais_coletados_detalhado').select('peso_kg').in('id_entrega', entregaIds).neq('subtipo_material', 'REJEITO');
        pesoTotalEntregue = materiaisColetados?.reduce((acc, m) => acc + (m.peso_kg || 0), 0) || 0;
        const { data: rejeitos } = await supabase.from('materiais_coletados_detalhado').select('peso_kg').in('id_entrega', entregaIds).eq('subtipo_material', 'REJEITO');
        pesoRejeito = rejeitos?.reduce((acc, m) => acc + (m.peso_kg || 0), 0) || 0;
      }
      const pesoNotasKg = Math.round((pesoTotalNotas / 1000) * 1000) / 1000;
      const pesoEntregueKg = Math.round(pesoTotalEntregue * 1000) / 1000;
      const pesoRejeitoKg = Math.round(pesoRejeito * 1000) / 1000;
      const pesoEstimadoKg = Math.round(pesoEstimadoPromessas * 1000) / 1000;
      
      // Lógica de cálculo: prioriza peso estimado das entregas, depois notas fiscais
      let pesoReferencia = pesoEstimadoKg;
      if (pesoReferencia === 0 && pesoNotasKg > 0) {
        pesoReferencia = pesoNotasKg;
      }
      
      const percentualEntregue = pesoReferencia > 0 ? Math.round((pesoEntregueKg / pesoReferencia) * 100) : 0;
      
      setStats({ totalNotasFiscais: totalNotas || 0, pesoTotalNotas: pesoNotasKg, totalEntregasFinalizadas: entregas?.length || 0, pesoTotalEntregue: pesoEntregueKg, pesoRejeito: pesoRejeitoKg, pesoEstimadoPromessas: pesoEstimadoKg, percentualEntregue });
    } catch (error) { console.error('Erro ao carregar estatísticas:', error); } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-success/5 via-background to-primary/5 p-6">
      <div className="flex items-center gap-3">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="p-3 rounded-2xl bg-success/20">
          <Leaf className="h-6 w-6 text-success" />
        </motion.div>
        <div><h3 className="font-semibold text-foreground">Impacto Ambiental</h3><p className="text-sm text-muted-foreground">Carregando...</p></div>
      </div>
    </div>
  );

  if (stats.totalNotasFiscais === 0 && stats.totalEntregasFinalizadas === 0) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl border-2 border-dashed border-muted p-8 text-center">
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
        <Leaf className="h-8 w-8 text-muted-foreground" />
      </motion.div>
      <h3 className="font-semibold text-foreground mb-2">Impacto Ambiental</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">Envie notas fiscais e finalize entregas para acompanhar seu impacto positivo</p>
    </motion.div>
  );

  const getProgressColor = () => stats.percentualEntregue >= 80 ? "hsl(var(--success))" : stats.percentualEntregue >= 50 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  const status = stats.percentualEntregue > 80 ? { title: "Excelente!", message: "Você está fazendo a diferença!", color: "success" as const } : stats.percentualEntregue >= 50 ? { title: "Bom trabalho!", message: "Continue assim!", color: "warning" as const } : { title: "Vamos melhorar!", message: "Entregue mais materiais", color: "destructive" as const };
  
  // Define qual peso usar como referência (prioriza peso estimado das entregas)
  const pesoReferencia = stats.pesoEstimadoPromessas > 0 ? stats.pesoEstimadoPromessas : stats.pesoTotalNotas;
  const labelReferencia = stats.pesoEstimadoPromessas > 0 ? "Prometido nas Entregas" : "Registrado em Notas";
  const diferencaPeso = pesoReferencia - stats.pesoTotalEntregue;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-success/10 via-background to-primary/10 border border-success/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-success/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div className="p-3 rounded-2xl bg-gradient-to-br from-success to-success/70 shadow-lg shadow-success/25" whileHover={{ scale: 1.05, rotate: 5 }}>
                <Leaf className="h-6 w-6 text-white" />
              </motion.div>
              <div><h2 className="text-xl font-bold text-foreground">Impacto Ambiental</h2><p className="text-sm text-muted-foreground">Seu ciclo de reciclagem</p></div>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReportOpen(true)}
                  className="rounded-full gap-1.5 border-success/30 text-success hover:bg-success/10 hover:text-success"
                >
                  <FileBarChart className="h-4 w-4" />
                  Relatório
                </Button>
              </motion.div>
              {stats.percentualEntregue > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.5 }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/20 text-success text-sm font-medium">
                  <Sparkles className="h-4 w-4" /><span>Ativo</span>
                </motion.div>
              )}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col items-center">
              <CircularProgress percentage={stats.percentualEntregue} color={getProgressColor()}>
                <div className="text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.8 }} className="text-4xl font-bold text-foreground">
                    {stats.percentualEntregue}%
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-1">Taxa de Entrega</p>
                </div>
              </CircularProgress>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
                className={`mt-4 px-4 py-2 rounded-full text-sm font-medium ${status.color === 'success' ? 'bg-success/20 text-success' : status.color === 'warning' ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'}`}>
                {status.title} {status.message}
              </motion.div>
            </div>
            <div className="space-y-3">
              <StatPill icon={FileText} label={labelReferencia} value={formatWeight(pesoReferencia)} color="primary" delay={0.2} />
              <StatPill icon={Truck} label="Entregue às Cooperativas" value={formatWeight(stats.pesoTotalEntregue)} color="success" delay={0.3} />
              {stats.pesoRejeito > 0 && <StatPill icon={AlertTriangle} label="Rejeito" value={formatWeight(stats.pesoRejeito)} color="destructive" delay={0.4} />}
              {diferencaPeso > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="flex flex-col gap-3 px-4 py-4 rounded-2xl border backdrop-blur-sm bg-warning/10 text-warning border-warning/20 cursor-pointer hover:bg-warning/20 transition-colors"
                  onClick={() => navigate('/select-materials')}
                >
                  <div className="flex items-center gap-3">
                    <Target className="h-6 w-6 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium opacity-80">Falta Entregar</span>
                      <span className="text-xl font-bold">{formatWeight(diferencaPeso)}</span>
                    </div>
                  </div>
                  <Button 
                    size="default" 
                    className="w-full rounded-full bg-warning hover:bg-warning/90 text-warning-foreground shadow-lg shadow-warning/25 gap-2 justify-center font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/select-materials');
                    }}
                  >
                    Entregar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-border/50">
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.6 }} className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-2">
                <FileText className="h-5 w-5 text-primary" />
              </motion.div>
              <p className="text-2xl font-bold text-foreground">{stats.totalNotasFiscais}</p>
              <p className="text-xs text-muted-foreground">Notas Fiscais</p>
            </div>
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.7 }} className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-success/10 mb-2">
                <Recycle className="h-5 w-5 text-success" />
              </motion.div>
              <p className="text-2xl font-bold text-foreground">{stats.totalEntregasFinalizadas}</p>
              <p className="text-xs text-muted-foreground">Entregas Finalizadas</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Modal de Relatório */}
      <EnvironmentalReportModal open={reportOpen} onOpenChange={setReportOpen} />
    </motion.div>
  );
}
