import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, UserPlus, PhoneCall, XCircle, MessageSquare, Filter, RefreshCw } from "lucide-react";

interface CDVLead {
  id: string;
  nome: string;
  email: string;
  empresa: string;
  telefone: string | null;
  origem: string;
  status: string;
  data_cadastro: string;
  data_contato: string | null;
  notas: string | null;
  id_investidor: string | null;
}

const statusColors: Record<string, string> = {
  novo: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  em_contato: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  convertido: "bg-green-500/10 text-green-600 border-green-500/20",
  descartado: "bg-red-500/10 text-red-600 border-red-500/20"
};

const statusLabels: Record<string, string> = {
  novo: "Novo",
  em_contato: "Em Contato",
  convertido: "Convertido",
  descartado: "Descartado"
};

const AdminCDVLeads = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [selectedLead, setSelectedLead] = useState<CDVLead | null>(null);
  const [notas, setNotas] = useState("");
  const [notasDialogOpen, setNotasDialogOpen] = useState(false);

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ["cdv-leads", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("cdv_leads")
        .select("*")
        .order("data_cadastro", { ascending: false });

      if (statusFilter !== "todos") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CDVLead[];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === "em_contato") {
        updateData.data_contato = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from("cdv_leads")
        .update(updateData)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cdv-leads"] });
      toast.success("Status atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    }
  });

  const updateNotasMutation = useMutation({
    mutationFn: async ({ id, notas }: { id: string; notas: string }) => {
      const { error } = await supabase
        .from("cdv_leads")
        .update({ notas })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cdv-leads"] });
      toast.success("Notas salvas");
      setNotasDialogOpen(false);
    },
    onError: () => {
      toast.error("Erro ao salvar notas");
    }
  });

  const convertToInvestorMutation = useMutation({
    mutationFn: async (lead: CDVLead) => {
      // Criar investidor
      const { data: investidor, error: investorError } = await supabase
        .from("cdv_investidores")
        .insert({
          razao_social: lead.empresa,
          cnpj: "00.000.000/0000-00", // Placeholder - admin deve atualizar
          nome_responsavel: lead.nome,
          email: lead.email,
          telefone: lead.telefone,
          id_user: (await supabase.auth.getUser()).data.user?.id, // Temporário
          status: "ativo"
        })
        .select()
        .single();
      
      if (investorError) throw investorError;

      // Atualizar lead
      const { error: leadError } = await supabase
        .from("cdv_leads")
        .update({ 
          status: "convertido",
          id_investidor: investidor.id
        })
        .eq("id", lead.id);
      
      if (leadError) throw leadError;

      return investidor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cdv-leads"] });
      queryClient.invalidateQueries({ queryKey: ["cdv-investidores"] });
      toast.success("Lead convertido para investidor!");
    },
    onError: () => {
      toast.error("Erro ao converter lead");
    }
  });

  const stats = {
    total: leads.length,
    novos: leads.filter(l => l.status === "novo").length,
    emContato: leads.filter(l => l.status === "em_contato").length,
    convertidos: leads.filter(l => l.status === "convertido").length
  };

  const openNotasDialog = (lead: CDVLead) => {
    setSelectedLead(lead);
    setNotas(lead.notas || "");
    setNotasDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Leads</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <UserPlus className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Novos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.novos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <PhoneCall className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Contato</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.emContato}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Convertidos</p>
                <p className="text-2xl font-bold text-green-600">{stats.convertidos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Leads de Investidores</CardTitle>
              <CardDescription>Interessados que preencheram o formulário da landing page</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="novo">Novos</SelectItem>
                  <SelectItem value="em_contato">Em Contato</SelectItem>
                  <SelectItem value="convertido">Convertidos</SelectItem>
                  <SelectItem value="descartado">Descartados</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum lead encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.nome}</TableCell>
                    <TableCell>{lead.empresa}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{lead.email}</p>
                        {lead.telefone && (
                          <p className="text-muted-foreground">{lead.telefone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[lead.status]}>
                        {statusLabels[lead.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(lead.data_cadastro), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {lead.status === "novo" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: lead.id, status: "em_contato" })}
                          >
                            <PhoneCall className="w-3 h-3 mr-1" />
                            Contatar
                          </Button>
                        )}
                        
                        {(lead.status === "novo" || lead.status === "em_contato") && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => convertToInvestorMutation.mutate(lead)}
                              disabled={convertToInvestorMutation.isPending}
                            >
                              <UserPlus className="w-3 h-3 mr-1" />
                              Converter
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateStatusMutation.mutate({ id: lead.id, status: "descartado" })}
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openNotasDialog(lead)}
                        >
                          <MessageSquare className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notas Dialog */}
      <Dialog open={notasDialogOpen} onOpenChange={setNotasDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notas - {selectedLead?.nome}</DialogTitle>
            <DialogDescription>
              Adicione observações sobre este lead
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Digite suas notas aqui..."
              rows={5}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNotasDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => selectedLead && updateNotasMutation.mutate({ id: selectedLead.id, notas })}
                disabled={updateNotasMutation.isPending}
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCDVLeads;
