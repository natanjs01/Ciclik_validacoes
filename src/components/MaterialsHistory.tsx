import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, CheckCircle, Truck } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatWeight } from "@/lib/formatters";

interface Material {
  id: string;
  descricao: string;
  tipo_embalagem: string;
  percentual_reciclabilidade: number;
  status: string;
  data_cadastro: string;
  data_entrega: string | null;
  pontos_ganhos: number;
  origem_cadastro: string;
  peso_total_estimado_gramas: number | null;
  id_entrega: string | null;
  entregas_reciclaveis?: {
    data_geracao: string;
    status_promessa: string;
  } | null;
}

interface MaterialColetado {
  tipo_material: string;
  peso_kg: number;
}

const TIPO_MATERIAL_LABELS: Record<string, string> = {
  plastico: 'Plástico',
  papel: 'Papel',
  papelao: 'Papelão',
  vidro: 'Vidro',
  metal: 'Metal',
  aluminio: 'Alumínio',
  laminado: 'Laminado',
  misto: 'Misto',
  outros: 'Outros'
};

const MaterialsHistory = ({ userId }: { userId: string }) => {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [materiaisColetados, setMateriaisColetados] = useState<MaterialColetado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMateriais();
    
    const channel = supabase
      .channel('materiais-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'materiais_reciclaveis_usuario',
          filter: `id_usuario=eq.${userId}`
        },
        () => {
          loadMateriais();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadMateriais = async () => {
    try {
      // Carregar materiais do usuário para estatísticas
      const { data, error } = await supabase
        .from('materiais_reciclaveis_usuario')
        .select('*')
        .eq('id_usuario', userId)
        .order('data_cadastro', { ascending: false });

      if (error) throw error;
      
      // Se houver materiais com id_entrega, buscar os dados das entregas separadamente
      const materiaisComEntregas = data?.filter(m => m.id_entrega) || [];
      if (materiaisComEntregas.length > 0) {
        const entregaIds = [...new Set(materiaisComEntregas.map(m => m.id_entrega))];
        const { data: entregas } = await supabase
          .from('entregas_reciclaveis')
          .select('id, data_geracao, status_promessa')
          .in('id', entregaIds);
        
        // Mapear entregas para os materiais
        const materiaisComDados = data?.map(material => {
          if (material.id_entrega) {
            const entrega = entregas?.find(e => e.id === material.id_entrega);
            return {
              ...material,
              entregas_reciclaveis: entrega || null
            };
          }
          return material;
        });
        setMateriais(materiaisComDados || []);
      } else {
        setMateriais(data || []);
      }

      // Carregar materiais REAIS coletados das entregas finalizadas do usuário
      const { data: entregasFinalizadas, error: entregasError } = await supabase
        .from('entregas_reciclaveis')
        .select('id')
        .eq('id_usuario', userId)
        .eq('status_promessa', 'finalizada');

      if (entregasError) throw entregasError;

      if (entregasFinalizadas && entregasFinalizadas.length > 0) {
        const entregaIds = entregasFinalizadas.map(e => e.id);
        
        const { data: materiaisReais, error: materiaisError } = await supabase
          .from('materiais_coletados_detalhado')
          .select('tipo_material, peso_kg, subtipo_material')
          .in('id_entrega', entregaIds)
          .neq('subtipo_material', 'REJEITO'); // Excluir rejeito - não conta para pontuação

        if (materiaisError) throw materiaisError;
        setMateriaisColetados(materiaisReais || []);
      } else {
        setMateriaisColetados([]);
      }
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verifica se uma entrega está expirada (mais de 24h)
  const isEntregaExpirada = (material: Material): boolean => {
    if (material.status !== 'em_entrega' || !material.entregas_reciclaveis) return false;
    
    const entrega = material.entregas_reciclaveis;
    // Se já foi finalizada, não está expirada
    if (entrega.status_promessa === 'finalizada') return false;
    
    const dataGeracao = new Date(entrega.data_geracao);
    const agora = new Date();
    const horasDecorridas = (agora.getTime() - dataGeracao.getTime()) / (1000 * 60 * 60);
    
    return horasDecorridas > 24;
  };

  // Filtra materiais considerando entregas expiradas
  const filterByStatus = (status: string) => {
    return materiais.filter(m => {
      if (status === 'em_entrega') {
        // Só conta como "em_entrega" se a entrega não estiver expirada
        return m.status === 'em_entrega' && !isEntregaExpirada(m);
      }
      return m.status === status;
    });
  };

  const stats = {
    disponivel: filterByStatus('disponivel').length,
    em_entrega: filterByStatus('em_entrega').length,
    entregue: filterByStatus('entregue').length,
    total: materiais.length,
  };

  // Chart data usando dados REAIS de materiais_coletados_detalhado
  const materiaisPorTipo = materiaisColetados.reduce((acc, material) => {
    const tipo = material.tipo_material?.toLowerCase() || 'outros';
    if (!acc[tipo]) acc[tipo] = { tipo, peso: 0, quantidade: 0 };
    acc[tipo].peso += material.peso_kg || 0;
    acc[tipo].quantidade += 1;
    return acc;
  }, {} as Record<string, { tipo: string; peso: number; quantidade: number }>);

  const chartData = Object.values(materiaisPorTipo).map((item, index) => ({
    name: TIPO_MATERIAL_LABELS[item.tipo] || item.tipo,
    peso: item.peso,
    quantidade: item.quantidade,
    fill: `hsl(var(--chart-${(index % 5) + 1}))`
  }));

  const totalKgEntregues = chartData.reduce((sum, item) => sum + item.peso, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">Peso: {formatWeight(payload[0].value)}</p>
          <p className="text-sm text-muted-foreground">Registros: {payload[0].payload.quantidade}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Meus Materiais Recicláveis</CardTitle>
        <CardDescription className="text-xs">
          Resumo dos materiais cadastrados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl text-center bg-blue-500/10">
            <Package className="w-5 h-5 mx-auto text-blue-600 mb-1" />
            <p className="text-lg font-bold text-blue-600">{stats.disponivel}</p>
            <p className="text-[10px] text-blue-600/80">Disponíveis</p>
          </div>
          
          <div className="p-3 rounded-xl text-center bg-amber-500/10">
            <Truck className="w-5 h-5 mx-auto text-amber-600 mb-1" />
            <p className="text-lg font-bold text-amber-600">{stats.em_entrega}</p>
            <p className="text-[10px] text-amber-600/80">Em Entrega</p>
          </div>
          
          <div className="p-3 rounded-xl text-center bg-emerald-500/10">
            <CheckCircle className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-lg font-bold text-emerald-600">{stats.entregue}</p>
            <p className="text-[10px] text-emerald-600/80">Entregues</p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              Materiais Entregues por Tipo
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={45}
                      paddingAngle={2}
                      dataKey="peso"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xs font-bold text-foreground">{formatWeight(totalKgEntregues)}</p>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                {chartData.slice(0, 4).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-muted-foreground truncate max-w-[80px]">{item.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{formatWeight(item.peso)}</span>
                  </div>
                ))}
                {chartData.length > 4 && (
                  <p className="text-[10px] text-muted-foreground">+{chartData.length - 4} outros</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.total === 0 && (
          <div className="text-center py-6">
            <Package className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum material cadastrado ainda</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialsHistory;
