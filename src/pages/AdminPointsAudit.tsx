import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, RefreshCw, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { formatNumber } from "@/lib/formatters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface UserAudit {
  id: string;
  nome: string;
  email: string;
  score_verde: number;
  pontos_esperados: number;
  discrepancia: number;
  percentual_discrepancia: number;
  detalhes: any;
}

interface AdjustmentHistory {
  id: string;
  id_usuario: string;
  nome_usuario: string;
  id_admin: string;
  nome_admin: string;
  pontos_antes: number;
  pontos_depois: number;
  diferenca: number;
  motivo: string;
  detalhes: string;
  created_at: string;
}

export default function AdminPointsAudit() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<UserAudit[]>([]);
  const [historico, setHistorico] = useState<AdjustmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculando, setRecalculando] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserAudit | null>(null);
  const [ajusteManualOpen, setAjusteManualOpen] = useState(false);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    loadAudit();
    loadHistorico();
  }, []);

  const loadAudit = async () => {
    try {
      setLoading(true);

      // Buscar todos os usuários
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome, email, score_verde")
        .order("nome");

      if (profilesError) throw profilesError;

      // Calcular pontos esperados para cada usuário
      const audits: UserAudit[] = [];
      
      for (const profile of profiles || []) {
        try {
          const { data, error } = await supabase.functions.invoke(
            "calcular-pontos-esperados",
            { body: { userId: profile.id } }
          );

          if (error) {
            console.error(`Erro ao calcular pontos para ${profile.nome}:`, error);
            continue;
          }

          const pontosEsperados = data.pontos_esperados || 0;
          const discrepancia = profile.score_verde - pontosEsperados;
          const percentual = pontosEsperados > 0 
            ? (discrepancia / pontosEsperados) * 100 
            : 0;

          audits.push({
            id: profile.id,
            nome: profile.nome,
            email: profile.email,
            score_verde: profile.score_verde,
            pontos_esperados: pontosEsperados,
            discrepancia,
            percentual_discrepancia: percentual,
            detalhes: data.detalhes
          });
        } catch (err) {
          console.error(`Erro ao processar ${profile.nome}:`, err);
        }
      }

      setUsuarios(audits);
    } catch (error: any) {
      console.error("Erro ao carregar auditoria:", error);
      toast.error("Erro ao carregar auditoria de pontos");
    } finally {
      setLoading(false);
    }
  };

  const loadHistorico = async () => {
    try {
      const { data, error } = await supabase
        .from("ajustes_pontos_manuais")
        .select(`
          *,
          usuario:id_usuario(nome),
          admin:id_admin(nome)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const historico = data.map((ajuste: any) => ({
        id: ajuste.id,
        id_usuario: ajuste.id_usuario,
        nome_usuario: ajuste.usuario?.nome || "Usuário removido",
        id_admin: ajuste.id_admin,
        nome_admin: ajuste.admin?.nome || "Admin removido",
        pontos_antes: ajuste.pontos_antes,
        pontos_depois: ajuste.pontos_depois,
        diferenca: ajuste.diferenca,
        motivo: ajuste.motivo,
        detalhes: ajuste.detalhes,
        created_at: ajuste.created_at
      }));

      setHistorico(historico);
    } catch (error: any) {
      console.error("Erro ao carregar histórico:", error);
    }
  };

  const recalcularPontos = async (user: UserAudit) => {
    if (!confirm(`Recalcular pontos para ${user.nome}?\n\nPontos atuais: ${user.score_verde}\nPontos esperados: ${user.pontos_esperados}\n\nEsta ação irá ajustar o score_verde e pontos mensais.`)) {
      return;
    }

    try {
      setRecalculando(user.id);

      const { data: adminData } = await supabase.auth.getUser();
      const adminId = adminData?.user?.id;

      if (!adminId) throw new Error("Admin não identificado");

      // Buscar mês atual
      const mesAtual = new Date().toISOString().slice(0, 7) + "-01";

      // Atualizar score_verde
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ score_verde: user.pontos_esperados })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Atualizar pontos mensais
      const { error: monthlyError } = await supabase
        .from("pontos_mensais_usuarios")
        .upsert({
          id_usuario: user.id,
          mes_referencia: mesAtual,
          pontos_acumulados: user.pontos_esperados,
          nivel_atingido: user.pontos_esperados >= 1001 ? "Guardiao Verde" : 
                         user.pontos_esperados >= 501 ? "Ativo" : "Iniciante"
        }, {
          onConflict: "id_usuario,mes_referencia"
        });

      if (monthlyError) throw monthlyError;

      // Registrar ajuste
      const { error: ajusteError } = await supabase
        .from("ajustes_pontos_manuais")
        .insert({
          id_usuario: user.id,
          id_admin: adminId,
          pontos_antes: user.score_verde,
          pontos_depois: user.pontos_esperados,
          diferenca: user.pontos_esperados - user.score_verde,
          motivo: "recalculo_automatico",
          detalhes: JSON.stringify({
            detalhes_calculo: user.detalhes,
            discrepancia_original: user.discrepancia
          })
        });

      if (ajusteError) throw ajusteError;

      toast.success(`Pontos de ${user.nome} recalculados com sucesso!`);
      await loadAudit();
      await loadHistorico();
    } catch (error: any) {
      console.error("Erro ao recalcular pontos:", error);
      toast.error("Erro ao recalcular pontos: " + error.message);
    } finally {
      setRecalculando(null);
    }
  };

  const ajusteManual = async () => {
    if (!selectedUser || !motivo.trim()) {
      toast.error("Preencha o motivo do ajuste");
      return;
    }

    try {
      const { data: adminData } = await supabase.auth.getUser();
      const adminId = adminData?.user?.id;

      if (!adminId) throw new Error("Admin não identificado");

      const mesAtual = new Date().toISOString().slice(0, 7) + "-01";

      // Atualizar score_verde
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ score_verde: selectedUser.pontos_esperados })
        .eq("id", selectedUser.id);

      if (updateError) throw updateError;

      // Atualizar pontos mensais
      const { error: monthlyError } = await supabase
        .from("pontos_mensais_usuarios")
        .upsert({
          id_usuario: selectedUser.id,
          mes_referencia: mesAtual,
          pontos_acumulados: selectedUser.pontos_esperados,
          nivel_atingido: selectedUser.pontos_esperados >= 1001 ? "Guardiao Verde" : 
                         selectedUser.pontos_esperados >= 501 ? "Ativo" : "Iniciante"
        }, {
          onConflict: "id_usuario,mes_referencia"
        });

      if (monthlyError) throw monthlyError;

      // Registrar ajuste
      const { error: ajusteError } = await supabase
        .from("ajustes_pontos_manuais")
        .insert({
          id_usuario: selectedUser.id,
          id_admin: adminId,
          pontos_antes: selectedUser.score_verde,
          pontos_depois: selectedUser.pontos_esperados,
          diferenca: selectedUser.pontos_esperados - selectedUser.score_verde,
          motivo: "ajuste_manual",
          detalhes: motivo
        });

      if (ajusteError) throw ajusteError;

      toast.success("Ajuste manual registrado com sucesso!");
      setAjusteManualOpen(false);
      setSelectedUser(null);
      setMotivo("");
      await loadAudit();
      await loadHistorico();
    } catch (error: any) {
      console.error("Erro ao registrar ajuste:", error);
      toast.error("Erro ao registrar ajuste: " + error.message);
    }
  };

  const getDiscrepanciaColor = (percentual: number) => {
    const abs = Math.abs(percentual);
    if (abs < 5) return "text-success";
    if (abs < 15) return "text-warning";
    return "text-destructive";
  };

  const getDiscrepanciaIcon = (discrepancia: number) => {
    if (Math.abs(discrepancia) < 3) return <CheckCircle className="h-4 w-4 text-success" />;
    if (Math.abs(discrepancia) < 10) return <AlertCircle className="h-4 w-4 text-warning" />;
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Auditoria de Pontos</h1>
            <p className="text-muted-foreground">
              Visualize discrepâncias e recalcule pontos dos usuários
            </p>
          </div>
        </div>
        <Button onClick={loadAudit} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Usuários</CardDescription>
            <CardTitle className="text-3xl">{usuarios.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Com Discrepância</CardDescription>
            <CardTitle className="text-3xl text-warning">
              {usuarios.filter(u => Math.abs(u.discrepancia) >= 3).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Críticas (&gt;10 pts)</CardDescription>
            <CardTitle className="text-3xl text-destructive">
              {usuarios.filter(u => Math.abs(u.discrepancia) >= 10).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabela de Auditoria */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Discrepâncias</CardTitle>
          <CardDescription>
            Comparação entre pontos reais e pontos calculados pelas regras de gamificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando auditoria...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="text-right">Pontos Reais</TableHead>
                  <TableHead className="text-right">Pontos Esperados</TableHead>
                  <TableHead className="text-right">Discrepância</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{getDiscrepanciaIcon(user.discrepancia)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.nome}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(user.score_verde, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(user.pontos_esperados, 0)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${getDiscrepanciaColor(user.percentual_discrepancia)}`}>
                      {user.discrepancia > 0 ? "+" : ""}
                      {formatNumber(user.discrepancia, 0)}
                    </TableCell>
                    <TableCell className={`text-right ${getDiscrepanciaColor(user.percentual_discrepancia)}`}>
                      {user.discrepancia > 0 ? "+" : ""}
                      {formatNumber(user.percentual_discrepancia, 1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.abs(user.discrepancia) >= 3 && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => recalcularPontos(user)}
                            disabled={recalculando === user.id}
                          >
                            {recalculando === user.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Recalcular
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setAjusteManualOpen(true);
                            }}
                          >
                            Ajuste Manual
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Ajustes */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ajustes</CardTitle>
          <CardDescription>Últimos 50 ajustes manuais realizados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead className="text-right">Antes</TableHead>
                <TableHead className="text-right">Depois</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historico.map((ajuste) => (
                <TableRow key={ajuste.id}>
                  <TableCell>
                    {new Date(ajuste.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </TableCell>
                  <TableCell>{ajuste.nome_usuario}</TableCell>
                  <TableCell>{ajuste.nome_admin}</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(ajuste.pontos_antes, 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(ajuste.pontos_depois, 0)}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${
                    ajuste.diferenca > 0 ? "text-success" : "text-destructive"
                  }`}>
                    {ajuste.diferenca > 0 ? "+" : ""}
                    {formatNumber(ajuste.diferenca, 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ajuste.motivo === "recalculo_automatico" ? "default" : "secondary"}>
                      {ajuste.motivo === "recalculo_automatico" ? "Recálculo" : "Ajuste Manual"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Ajuste Manual */}
      <Dialog open={ajusteManualOpen} onOpenChange={setAjusteManualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuste Manual de Pontos</DialogTitle>
            <DialogDescription>
              Registre o motivo do ajuste para {selectedUser?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Pontos Atuais:</span>
                <p className="font-semibold">{selectedUser?.score_verde}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Pontos Esperados:</span>
                <p className="font-semibold">{selectedUser?.pontos_esperados}</p>
              </div>
            </div>
            <Textarea
              placeholder="Descreva o motivo do ajuste manual..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAjusteManualOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={ajusteManual}>
              Confirmar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
