import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Package, TrendingUp, Users, Recycle, Clock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import CiclikHeader from "@/components/CiclikHeader";

interface Entrega {
  id: string;
  id_usuario: string;
  qrcode_id: string;
  hash_qrcode: string;
  status_promessa: string;
  peso_estimado: number;
  peso_validado: number | null;
  peso_rejeito_kg: number;
  data_geracao: string;
  conversa_iniciada_em: string | null;
  conversa_finalizada_em: string | null;
  cooperativas: {
    nome_fantasia: string;
  };
}

interface MaterialColetado {
  id: string;
  tipo_material: string;
  subtipo_material: string;
  peso_kg: number;
  registrado_em: string;
  entregas_reciclaveis: {
    id: string;
    id_usuario: string;
  };
  cooperativas: {
    nome_fantasia: string;
  };
}

interface ResumoStats {
  total_entregas: number;
  entregas_ativas: number;
  entregas_finalizadas: number;
  entregas_expiradas: number;
  peso_total_coletado: number;
  peso_rejeito_total: number;
}

const AdminDeliveryPromises = () => {
  const navigate = useNavigate();
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [materiaisColetados, setMateriaisColetados] = useState<MaterialColetado[]>([]);
  const [resumo, setResumo] = useState<ResumoStats>({
    total_entregas: 0,
    entregas_ativas: 0,
    entregas_finalizadas: 0,
    entregas_expiradas: 0,
    peso_total_coletado: 0,
    peso_rejeito_total: 0
  });
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar entregas
      const { data: entregasData, error: entregasError } = await supabase
        .from('entregas_reciclaveis')
        .select(`
          *,
          cooperativas(nome_fantasia)
        `)
        .order('data_geracao', { ascending: false });

      if (entregasError) throw entregasError;

      // Carregar materiais coletados
      const { data: materiaisData, error: materiaisError } = await supabase
        .from('materiais_coletados_detalhado')
        .select(`
          *,
          entregas_reciclaveis(
            id,
            id_usuario
          ),
          cooperativas(nome_fantasia)
        `)
        .order('registrado_em', { ascending: false })
        .limit(100);

      if (materiaisError) throw materiaisError;

      const entregasList = entregasData || [];
      const materiaisList = materiaisData || [];

      setEntregas(entregasList);
      setMateriaisColetados(materiaisList);

      const userIds = new Set<string>();
      entregasList.forEach((e: any) => {
        if (e.id_usuario) userIds.add(e.id_usuario);
      });
      materiaisList.forEach((m: any) => {
        const entregaUsuario = m.entregas_reciclaveis?.id_usuario;
        if (entregaUsuario) userIds.add(entregaUsuario);
      });

      if (userIds.size > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, nome')
          .in('id', Array.from(userIds));

        if (profilesError) throw profilesError;

        const map: Record<string, string> = {};
        profilesData?.forEach((p: any) => {
          if (p.id) map[p.id] = p.nome;
        });
        setProfilesMap(map);
      }

      // Calcular resumo
      const stats: ResumoStats = {
        total_entregas: entregasList.length,
        entregas_ativas: entregasList.filter((e: any) => e.status_promessa === 'ativa').length,
        entregas_finalizadas: entregasList.filter((e: any) => e.status_promessa === 'finalizada').length,
        entregas_expiradas: entregasList.filter((e: any) => e.status_promessa === 'expirada').length,
        peso_total_coletado: entregasList.reduce((acc: number, e: any) => acc + (e.peso_validado || 0), 0),
        peso_rejeito_total: entregasList.reduce((acc: number, e: any) => acc + (e.peso_rejeito_kg || 0), 0)
      };

      setResumo(stats);

    } catch (error: any) {
      toast.error('Erro ao carregar dados', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; icon: any; label: string }> = {
      ativa: { variant: 'default', icon: Clock, label: 'Ativa' },
      em_coleta: { variant: 'secondary', icon: Package, label: 'Em Coleta' },
      finalizada: { variant: 'default', icon: CheckCircle, label: 'Finalizada' },
      expirada: { variant: 'destructive', icon: XCircle, label: 'Expirada' },
      cancelada: { variant: 'outline', icon: XCircle, label: 'Cancelada' }
    };

    const config = badges[status] || badges.ativa;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const entregasFiltradas = entregas.filter(e => 
    filtroStatus === "todos" || e.status_promessa === filtroStatus
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CiclikHeader />
        <div className="container mx-auto p-6">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CiclikHeader />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Promessas de Entrega</h1>
              <p className="text-muted-foreground">
                Rastreamento completo de entregas via QR Code
              </p>
            </div>
          </div>
          <Button onClick={loadData}>Atualizar</Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Entregas</p>
                  <p className="text-2xl font-bold">{resumo.total_entregas}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Entregas Ativas</p>
                  <p className="text-2xl font-bold">{resumo.entregas_ativas}</p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Finalizadas</p>
                  <p className="text-2xl font-bold">{resumo.entregas_finalizadas}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Peso Total Coletado</p>
                  <p className="text-2xl font-bold">{resumo.peso_total_coletado.toFixed(2)} kg</p>
                </div>
                <Recycle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejeito Total</p>
                  <p className="text-2xl font-bold">{resumo.peso_rejeito_total.toFixed(2)} kg</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expiradas</p>
                  <p className="text-2xl font-bold">{resumo.entregas_expiradas}</p>
                </div>
                <XCircle className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="entregas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="entregas">Entregas</TabsTrigger>
            <TabsTrigger value="materiais">Materiais Coletados</TabsTrigger>
          </TabsList>

          <TabsContent value="entregas" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Histórico de Entregas</CardTitle>
                    <CardDescription>
                      Lista completa de todas as promessas de entrega
                    </CardDescription>
                  </div>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativa">Ativas</SelectItem>
                      <SelectItem value="em_coleta">Em Coleta</SelectItem>
                      <SelectItem value="finalizada">Finalizadas</SelectItem>
                      <SelectItem value="expirada">Expiradas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Cooperativa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Peso Est.</TableHead>
                        <TableHead>Peso Valid.</TableHead>
                        <TableHead>Rejeito</TableHead>
                        <TableHead>Data Geração</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entregasFiltradas.map((entrega) => (
                        <TableRow key={entrega.id}>
                          <TableCell className="font-mono text-xs">
                            {entrega.id.substring(0, 8)}
                          </TableCell>
                          <TableCell>{profilesMap[entrega.id_usuario] || "Usuário"}</TableCell>
                          <TableCell>{entrega.cooperativas?.nome_fantasia}</TableCell>
                          <TableCell>{getStatusBadge(entrega.status_promessa)}</TableCell>
                          <TableCell>{entrega.peso_estimado?.toFixed(2)} kg</TableCell>
                          <TableCell>
                            {entrega.peso_validado ? `${entrega.peso_validado.toFixed(2)} kg` : '-'}
                          </TableCell>
                          <TableCell>
                            {entrega.peso_rejeito_kg > 0 ? `${entrega.peso_rejeito_kg.toFixed(2)} kg` : '-'}
                          </TableCell>
                          <TableCell>
                            {new Date(entrega.data_geracao).toLocaleString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materiais" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Materiais Coletados Detalhados</CardTitle>
                <CardDescription>
                  Registro detalhado de todos os materiais e submateriais coletados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Cooperativa</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Submaterial</TableHead>
                        <TableHead>Peso (kg)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materiaisColetados.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell>
                            {new Date(material.registrado_em).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            {profilesMap[material.entregas_reciclaveis?.id_usuario || ""] || "Usuário"}
                          </TableCell>
                          <TableCell>{material.cooperativas?.nome_fantasia}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{material.tipo_material}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={material.subtipo_material === 'REJEITO' ? 'destructive' : 'secondary'}
                            >
                              {material.subtipo_material}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold">
                            {material.peso_kg.toFixed(2)} kg
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDeliveryPromises;
