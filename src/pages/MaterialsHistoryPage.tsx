import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, CheckCircle, Truck, ArrowLeft, Filter } from "lucide-react";
import { TIPOS_EMBALAGEM_LABELS } from "@/types/produtos";
import { formatWeight } from "@/lib/formatters";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
}

type StatusFilter = 'todos' | 'disponivel' | 'em_entrega' | 'entregue';

const STATUS_CONFIG = {
  todos: { label: 'Todos os Materiais', icon: Package },
  disponivel: { label: 'Disponíveis', icon: Package },
  em_entrega: { label: 'Em Entrega', icon: Truck },
  entregue: { label: 'Entregues', icon: CheckCircle },
};

export default function MaterialsHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('todos');

  useEffect(() => {
    if (user) loadMateriais();
  }, [user]);

  const loadMateriais = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('materiais_reciclaveis_usuario')
        .select('*')
        .eq('id_usuario', user.id)
        .order('data_cadastro', { ascending: false });

      if (error) throw error;
      setMateriais(data || []);
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByStatus = (status: string) => materiais.filter(m => m.status === status);

  const getFilteredMaterials = () => {
    if (selectedStatus === 'todos') return materiais;
    return filterByStatus(selectedStatus);
  };

  const stats = {
    disponivel: filterByStatus('disponivel').length,
    em_entrega: filterByStatus('em_entrega').length,
    entregue: filterByStatus('entregue').length,
    total: materiais.length,
  };

  // Chart data
  const materiaisEntregues = materiais.filter(m => m.status === 'entregue');
  const materiaisPorTipo = materiaisEntregues.reduce((acc, material) => {
    const tipo = material.tipo_embalagem || 'outros';
    const pesoKg = (material.peso_total_estimado_gramas || 0) / 1000;
    if (!acc[tipo]) acc[tipo] = { tipo, peso: 0, quantidade: 0 };
    acc[tipo].peso += pesoKg;
    acc[tipo].quantidade += 1;
    return acc;
  }, {} as Record<string, { tipo: string; peso: number; quantidade: number }>);

  const chartData = Object.values(materiaisPorTipo).map((item, index) => ({
    name: TIPOS_EMBALAGEM_LABELS[item.tipo as keyof typeof TIPOS_EMBALAGEM_LABELS] || item.tipo,
    peso: item.peso,
    quantidade: item.quantidade,
    fill: `hsl(var(--chart-${(index % 5) + 1}))`
  }));

  const totalKgEntregues = chartData.reduce((sum, item) => sum + item.peso, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponivel':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">Disponível</Badge>;
      case 'em_entrega':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">Em Entrega</Badge>;
      case 'entregue':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Entregue</Badge>;
      default:
        return null;
    }
  };

  const renderMaterial = (material: Material, index: number) => (
    <motion.div
      key={material.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.03 }}
    >
      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
        <div className={`p-2 rounded-lg ${
          material.status === 'entregue' ? 'bg-emerald-500/10' : 
          material.status === 'em_entrega' ? 'bg-amber-500/10' : 'bg-blue-500/10'
        }`}>
          {material.status === 'entregue' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          ) : material.status === 'em_entrega' ? (
            <Truck className="w-4 h-4 text-amber-600" />
          ) : (
            <Package className="w-4 h-4 text-blue-600" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm text-foreground truncate">{material.descricao}</p>
            {getStatusBadge(material.status)}
          </div>
          
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-[10px] h-5">
              {TIPOS_EMBALAGEM_LABELS[material.tipo_embalagem as keyof typeof TIPOS_EMBALAGEM_LABELS]}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {material.percentual_reciclabilidade}% reciclável
            </span>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">
              {material.data_entrega 
                ? `Entregue em ${new Date(material.data_entrega).toLocaleDateString('pt-BR')}`
                : new Date(material.data_cadastro).toLocaleDateString('pt-BR')
              }
            </span>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
              +{material.pontos_ganhos} pts
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">Peso: {formatWeight(payload[0].value)}</p>
          <p className="text-sm text-muted-foreground">Itens: {payload[0].payload.quantidade}</p>
        </div>
      );
    }
    return null;
  };

  const filteredMaterials = getFilteredMaterials();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/user')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Meus Materiais Recicláveis</h1>
            <p className="text-sm text-muted-foreground">Histórico completo de materiais cadastrados</p>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedStatus('disponivel')}
                className={`p-4 rounded-xl text-center transition-all ${
                  selectedStatus === 'disponivel' 
                    ? 'bg-blue-500/20 ring-2 ring-blue-500/50' 
                    : 'bg-blue-500/10 hover:bg-blue-500/15'
                }`}
              >
                <Package className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                <p className="text-2xl font-bold text-blue-600">{stats.disponivel}</p>
                <p className="text-xs text-blue-600/80">Disponíveis</p>
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedStatus('em_entrega')}
                className={`p-4 rounded-xl text-center transition-all ${
                  selectedStatus === 'em_entrega' 
                    ? 'bg-amber-500/20 ring-2 ring-amber-500/50' 
                    : 'bg-amber-500/10 hover:bg-amber-500/15'
                }`}
              >
                <Truck className="w-6 h-6 mx-auto text-amber-600 mb-1" />
                <p className="text-2xl font-bold text-amber-600">{stats.em_entrega}</p>
                <p className="text-xs text-amber-600/80">Em Entrega</p>
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedStatus('entregue')}
                className={`p-4 rounded-xl text-center transition-all ${
                  selectedStatus === 'entregue' 
                    ? 'bg-emerald-500/20 ring-2 ring-emerald-500/50' 
                    : 'bg-emerald-500/10 hover:bg-emerald-500/15'
                }`}
              >
                <CheckCircle className="w-6 h-6 mx-auto text-emerald-600 mb-1" />
                <p className="text-2xl font-bold text-emerald-600">{stats.entregue}</p>
                <p className="text-xs text-emerald-600/80">Entregues</p>
              </motion.button>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    Materiais Entregues por Tipo
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
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
                        <div className="text-center">
                          <p className="text-sm font-bold text-foreground">{formatWeight(totalKgEntregues)}</p>
                          <p className="text-[10px] text-muted-foreground">total</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {chartData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.fill }}
                            />
                            <span className="text-muted-foreground">{item.name}</span>
                          </div>
                          <span className="font-medium text-foreground">{formatWeight(item.peso)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filter and List */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as StatusFilter)}>
                      <SelectTrigger className="w-[180px] h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            <span>Todos ({stats.total})</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="disponivel">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span>Disponíveis ({stats.disponivel})</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="em_entrega">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-amber-600" />
                            <span>Em Entrega ({stats.em_entrega})</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="entregue">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>Entregues ({stats.entregue})</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {filteredMaterials.length} {filteredMaterials.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {filteredMaterials.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8"
                      >
                        <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">
                          {selectedStatus === 'todos' 
                            ? 'Nenhum material cadastrado ainda'
                            : `Nenhum material ${STATUS_CONFIG[selectedStatus].label.toLowerCase()}`
                          }
                        </p>
                      </motion.div>
                    ) : (
                      filteredMaterials.map((material, index) => renderMaterial(material, index))
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
