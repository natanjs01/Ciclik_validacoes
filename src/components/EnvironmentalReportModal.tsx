import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAssetPath } from '@/utils/assetPath';
import { supabase } from '@/integrations/supabase/client';
import { getAssetPath } from '@/utils/assetPath';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Minus, 
  Leaf, Recycle, FileText, Truck,
  TreePine, Droplets, Zap, CloudOff, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAssetPath } from '@/utils/assetPath';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getAssetPath } from '@/utils/assetPath';
import { formatWeight } from '@/lib/formatters';
import { getAssetPath } from '@/utils/assetPath';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface MonthlyData {
  notas: number;
  entregas: number;
  kgEntregue: number;
  kgNotas: number;
}

interface GrowthMetric {
  label: string;
  current: number;
  previous: number;
  growth: number;
  unit: string;
  icon: React.ElementType;
}

interface EnvironmentalImpact {
  co2Avoided: number;
  waterSaved: number;
  energySaved: number;
  treesSaved: number;
}

interface EnvironmentalReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Fatores de impacto ambiental por kg de material reciclado
const IMPACT_FACTORS = {
  co2PerKg: 1.5,
  waterPerKg: 15,
  energyPerKg: 3.5,
  treesPerTon: 17,
};

export default function EnvironmentalReportModal({ open, onOpenChange }: EnvironmentalReportModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<MonthlyData>({ notas: 0, entregas: 0, kgEntregue: 0, kgNotas: 0 });
  const [previousMonth, setPreviousMonth] = useState<MonthlyData>({ notas: 0, entregas: 0, kgEntregue: 0, kgNotas: 0 });
  const [totalStats, setTotalStats] = useState({ totalKg: 0, totalNotas: 0, totalEntregas: 0 });
  const [userName, setUserName] = useState('');
  // Gera certificado digital no formato Instagram (1080x1080)
  const generateCertificate = async () => {
    setGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas não suportado');
      }

      // Formato Instagram Card (1080x1080)
      canvas.width = 1080;
      canvas.height = 1080;

      // Fundo branco
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Borda decorativa
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 12;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

      // Carregar logo
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.src = '/ciclik-logo-full.png';
      
      await new Promise<void>((resolve, reject) => {
        logo.onload = () => resolve();
        logo.onerror = () => reject(new Error('Erro ao carregar logo'));
      });

      // Logo no topo (mais para cima)
      const logoWidth = 280;
      const logoHeight = (logo.height / logo.width) * logoWidth;
      ctx.drawImage(logo, (canvas.width - logoWidth) / 2, 45, logoWidth, logoHeight);

      // Título principal
      ctx.fillStyle = '#166534';
      ctx.font = 'bold 42px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CERTIFICADO DE IMPACTO', canvas.width / 2, 250);

      // Nome do usuário
      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 36px Arial, sans-serif';
      ctx.fillText(userName || 'Guardião Verde', canvas.width / 2, 310);

      // Linha decorativa
      ctx.beginPath();
      ctx.moveTo(200, 350);
      ctx.lineTo(880, 350);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Métricas principais em grid 2x2 - totalmente centralizado
      const metrics = [
        { icon: '♻️', value: formatWeight(totalStats.totalKg), label: 'Reciclados' },
        { icon: '📄', value: `${totalStats.totalNotas}`, label: 'Notas Fiscais' },
        { icon: '🚚', value: `${totalStats.totalEntregas}`, label: 'Entregas' },
        { icon: '🌍', value: `${(totalStats.totalKg * IMPACT_FACTORS.co2PerKg).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}kg`, label: 'CO₂ Evitado' },
      ];

      const startY = 400;
      const colWidth = 300;
      const rowHeight = 140;
      
      // Posições centralizadas para cada coluna
      const col1X = canvas.width / 2 - colWidth / 2 - 100;
      const col2X = canvas.width / 2 + colWidth / 2 - 50;

      metrics.forEach((metric, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const baseX = col === 0 ? col1X : col2X;
        const y = startY + row * rowHeight;

        // Ícone emoji
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(metric.icon, baseX, y);

        // Valor
        ctx.fillStyle = '#166534';
        ctx.font = 'bold 40px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(metric.value, baseX + 120, y);

        // Label
        ctx.fillStyle = '#4ade80';
        ctx.font = '22px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(metric.label, baseX + 120, y + 30);
      });

      // Impactos ambientais - centralizado
      ctx.textAlign = 'center';
      ctx.fillStyle = '#166534';
      ctx.font = 'bold 28px Arial, sans-serif';
      ctx.fillText('IMPACTO AMBIENTAL GERADO', canvas.width / 2, 720);

      const impacts = [
        `💧 ${(totalStats.totalKg * IMPACT_FACTORS.waterPerKg).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}L água economizada`,
        `⚡ ${(totalStats.totalKg * IMPACT_FACTORS.energyPerKg).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}kWh energia economizada`,
        `🌳 ${((totalStats.totalKg / 1000) * IMPACT_FACTORS.treesPerTon).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} árvores preservadas`,
      ];

      ctx.fillStyle = '#15803d';
      ctx.font = '26px Arial, sans-serif';
      ctx.textAlign = 'center';
      impacts.forEach((impact, i) => {
        ctx.fillText(impact, canvas.width / 2, 770 + i * 40);
      });

      // Rodapé - centralizado
      ctx.textAlign = 'center';
      ctx.fillStyle = '#86efac';
      ctx.font = '20px Arial, sans-serif';
      ctx.fillText(`Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, canvas.width / 2, 930);

      // Hashtags
      ctx.fillStyle = '#22c55e';
      ctx.font = '22px Arial, sans-serif';
      ctx.fillText('#Ciclik #Sustentabilidade #RecicleEGanhe', canvas.width / 2, 970);

      // Marca d'água (logo central bem transparente)
      ctx.globalAlpha = 0.05;
      const watermarkSize = 400;
      ctx.drawImage(logo, (canvas.width - watermarkSize) / 2, (canvas.height - watermarkSize) / 2, watermarkSize, watermarkSize);
      ctx.globalAlpha = 1;

      // Download da imagem
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `certificado-ciclik-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = dataUrl;
      link.click();

      toast.success('Certificado gerado! Compartilhe nas redes sociais.');
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
      toast.error('Erro ao gerar certificado');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (open && user) {
      loadReportData();
    }
  }, [open, user]);

  const loadReportData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const prevMonthStart = startOfMonth(subMonths(now, 1));
      const prevMonthEnd = endOfMonth(subMonths(now, 1));

      // Get user name
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserName(profile.nome.split(' ')[0]);
      }

      // Dados do mês atual
      const [currentNotasResult, currentEntregasResult] = await Promise.all([
        supabase.from('notas_fiscais').select('id', { count: 'exact' })
          .eq('id_usuario', user.id)
          .gte('data_envio', currentMonthStart.toISOString())
          .lte('data_envio', currentMonthEnd.toISOString()),
        supabase.from('entregas_reciclaveis').select('id')
          .eq('id_usuario', user.id)
          .eq('status_promessa', 'finalizada')
          .gte('data_validacao', currentMonthStart.toISOString())
          .lte('data_validacao', currentMonthEnd.toISOString()),
      ]);

      // Dados do mês anterior
      const [prevNotasResult, prevEntregasResult] = await Promise.all([
        supabase.from('notas_fiscais').select('id', { count: 'exact' })
          .eq('id_usuario', user.id)
          .gte('data_envio', prevMonthStart.toISOString())
          .lte('data_envio', prevMonthEnd.toISOString()),
        supabase.from('entregas_reciclaveis').select('id')
          .eq('id_usuario', user.id)
          .eq('status_promessa', 'finalizada')
          .gte('data_validacao', prevMonthStart.toISOString())
          .lte('data_validacao', prevMonthEnd.toISOString())
      ]);

      // Dados totais
      const [totalNotasResult, totalEntregasResult] = await Promise.all([
        supabase.from('notas_fiscais').select('id', { count: 'exact' }).eq('id_usuario', user.id),
        supabase.from('entregas_reciclaveis').select('id').eq('id_usuario', user.id).eq('status_promessa', 'finalizada')
      ]);

      // Calcular kg por período
      const currentEntregaIds = currentEntregasResult.data?.map(e => e.id) || [];
      const prevEntregaIds = prevEntregasResult.data?.map(e => e.id) || [];
      const totalEntregaIds = totalEntregasResult.data?.map(e => e.id) || [];

      let currentKg = 0, prevKg = 0, totalKg = 0;

      if (currentEntregaIds.length > 0) {
        const { data } = await supabase.from('materiais_coletados_detalhado')
          .select('peso_kg').in('id_entrega', currentEntregaIds).neq('subtipo_material', 'REJEITO');
        currentKg = data?.reduce((acc, m) => acc + (m.peso_kg || 0), 0) || 0;
      }

      if (prevEntregaIds.length > 0) {
        const { data } = await supabase.from('materiais_coletados_detalhado')
          .select('peso_kg').in('id_entrega', prevEntregaIds).neq('subtipo_material', 'REJEITO');
        prevKg = data?.reduce((acc, m) => acc + (m.peso_kg || 0), 0) || 0;
      }

      if (totalEntregaIds.length > 0) {
        const { data } = await supabase.from('materiais_coletados_detalhado')
          .select('peso_kg').in('id_entrega', totalEntregaIds).neq('subtipo_material', 'REJEITO');
        totalKg = data?.reduce((acc, m) => acc + (m.peso_kg || 0), 0) || 0;
      }

      setCurrentMonth({
        notas: currentNotasResult.count || 0,
        entregas: currentEntregasResult.data?.length || 0,
        kgEntregue: currentKg,
        kgNotas: 0
      });

      setPreviousMonth({
        notas: prevNotasResult.count || 0,
        entregas: prevEntregasResult.data?.length || 0,
        kgEntregue: prevKg,
        kgNotas: 0
      });

      setTotalStats({
        totalKg,
        totalNotas: totalNotasResult.count || 0,
        totalEntregas: totalEntregasResult.data?.length || 0
      });

    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const growthMetrics: GrowthMetric[] = useMemo(() => [
    {
      label: 'Notas Fiscais',
      current: currentMonth.notas,
      previous: previousMonth.notas,
      growth: calculateGrowth(currentMonth.notas, previousMonth.notas),
      unit: '',
      icon: FileText,
    },
    {
      label: 'Entregas',
      current: currentMonth.entregas,
      previous: previousMonth.entregas,
      growth: calculateGrowth(currentMonth.entregas, previousMonth.entregas),
      unit: '',
      icon: Truck,
    },
    {
      label: 'Kg Reciclados',
      current: currentMonth.kgEntregue,
      previous: previousMonth.kgEntregue,
      growth: calculateGrowth(currentMonth.kgEntregue, previousMonth.kgEntregue),
      unit: 'kg',
      icon: Recycle,
    }
  ], [currentMonth, previousMonth]);

  const environmentalImpacts: EnvironmentalImpact = useMemo(() => ({
    co2Avoided: totalStats.totalKg * IMPACT_FACTORS.co2PerKg,
    waterSaved: totalStats.totalKg * IMPACT_FACTORS.waterPerKg,
    energySaved: totalStats.totalKg * IMPACT_FACTORS.energyPerKg,
    treesSaved: (totalStats.totalKg / 1000) * IMPACT_FACTORS.treesPerTon
  }), [totalStats.totalKg]);

  const currentMonthName = format(new Date(), 'MMMM yyyy', { locale: ptBR });

  const GrowthBadge = ({ growth }: { growth: number }) => {
    if (growth > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-xs font-semibold">
          <TrendingUp className="h-3 w-3" />
          +{growth}%
        </span>
      );
    } else if (growth < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-semibold">
          <TrendingDown className="h-3 w-3" />
          {growth}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
        <Minus className="h-3 w-3" />
        0%
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] p-0 bg-white border-0 shadow-2xl overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-24 bg-white flex-shrink-0">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            >
              <Leaf className="h-10 w-10 text-[#22c55e]" />
            </motion.div>
          </div>
        ) : (
          <div className="bg-white flex flex-col max-h-[90vh] relative">
            {/* Watermark - Logo Ciclik grande e centralizada */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
              <img 
                src={getAssetPath('ciclik-logo.png')} 
                alt="" 
                className="w-72 h-72 opacity-[0.04] object-contain"
              />
            </div>

            {/* Header Padrão */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex-shrink-0 relative z-20">
              <div className="flex items-center gap-3">
                <img 
                  src={getAssetPath('ciclik-logo.png')} 
                  alt="Ciclik" 
                  className="h-10 w-10"
                />
                <div className="flex-1">
                  <h1 className="text-lg font-bold text-gray-900">
                    Relatório de Impacto
                  </h1>
                  <p className="text-xs text-gray-500">
                    {userName ? `Olá ${userName}, veja seu impacto ambiental` : 'Seu impacto ambiental'}
                  </p>
                </div>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider bg-gray-100 px-2.5 py-1 rounded-full">
                  {format(new Date(), 'MMM yyyy', { locale: ptBR })}
                </span>
              </div>
            </div>

            {/* Conteúdo Principal - Scrollable */}
            <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1 relative z-10">
              
              {/* Totais do Período - Cards Horizontais */}
              <div>
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Seus números totais
                </h3>
                <div className="flex gap-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex-1 bg-gray-50 rounded-2xl p-4 text-center"
                  >
                    <div className="w-10 h-10 bg-[#22c55e]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <FileText className="h-5 w-5 text-[#22c55e]" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{totalStats.totalNotas}</p>
                    <p className="text-[11px] text-gray-500 font-medium">Notas</p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex-1 bg-gray-50 rounded-2xl p-4 text-center"
                  >
                    <div className="w-10 h-10 bg-[#22c55e]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Truck className="h-5 w-5 text-[#22c55e]" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{totalStats.totalEntregas}</p>
                    <p className="text-[11px] text-gray-500 font-medium">Entregas</p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex-1 bg-gray-50 rounded-2xl p-4 text-center"
                  >
                    <div className="w-10 h-10 bg-[#22c55e]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Recycle className="h-5 w-5 text-[#22c55e]" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatWeight(totalStats.totalKg)}</p>
                    <p className="text-[11px] text-gray-500 font-medium">Reciclados</p>
                  </motion.div>
                </div>
              </div>

              {/* Crescimento Mensal - Lista Compacta */}
              <div>
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Evolução mensal
                </h3>
                <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100">
                  {growthMetrics.map((metric, index) => (
                    <motion.div
                      key={metric.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + index * 0.05 }}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <metric.icon className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{metric.label}</p>
                          <p className="text-xs text-gray-500">
                            {metric.current}{metric.unit} <span className="text-gray-300">•</span> ant. {metric.previous}{metric.unit}
                          </p>
                        </div>
                      </div>
                      <GrowthBadge growth={metric.growth} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Impactos Ambientais - Grid 2x2 */}
              <div>
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Impacto ambiental gerado
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-100"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <CloudOff className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {environmentalImpacts.co2Avoided.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      <span className="text-sm font-medium text-gray-500 ml-1">kg</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">CO₂ evitado</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.45 }}
                    className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Droplets className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {environmentalImpacts.waterSaved.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      <span className="text-sm font-medium text-gray-500 ml-1">L</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Água economizada</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-100"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Zap className="h-4 w-4 text-amber-600" />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {environmentalImpacts.energySaved.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      <span className="text-sm font-medium text-gray-500 ml-1">kWh</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Energia economizada</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.55 }}
                    className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-4 border border-green-100"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <TreePine className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {environmentalImpacts.treesSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Árvores preservadas</p>
                  </motion.div>
                </div>
              </div>

              {/* Footer com botão único de certificado - moderno e animado */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="pt-4 space-y-3"
              >
                <motion.button
                  onClick={generateCertificate}
                  disabled={generating}
                  whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(34, 197, 94, 0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full h-16 rounded-2xl bg-gradient-to-r from-[#8BC34A] via-[#7CB342] to-[#689F38] text-white font-semibold text-lg shadow-xl shadow-[#8BC34A]/30 flex items-center justify-center gap-3 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                  />
                  
                  {/* Glow pulse */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-green-400/20"
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  <span className="relative flex items-center gap-3">
                    {generating ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Leaf className="h-6 w-6" />
                      </motion.div>
                    ) : (
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                      >
                        <Award className="h-6 w-6" />
                      </motion.div>
                    )}
                    <span>{generating ? 'Gerando...' : 'Gerar Certificado'}</span>
                  </span>
                </motion.button>
                <p className="text-center text-[10px] text-gray-400">
                  Gera uma imagem para compartilhar no Instagram e WhatsApp
                </p>
              </motion.div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
