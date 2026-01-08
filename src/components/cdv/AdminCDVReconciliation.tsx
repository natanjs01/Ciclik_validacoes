import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Play, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface Reconciliation {
  id: string;
  id_quota: string;
  tipo_impacto: string;
  quantidade_conciliada: number;
  data_conciliacao: string;
  processado_por: string;
  observacoes: string | null;
  cdv_quotas: {
    numero_quota: string;
    cdv_investidores: {
      razao_social: string;
    };
  };
}

const AdminCDVReconciliation = () => {
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReconciliations();
  }, []);

  const fetchReconciliations = async () => {
    try {
      const { data, error } = await supabase
        .from("cdv_conciliacoes")
        .select(`
          *,
          cdv_quotas (
            numero_quota,
            cdv_investidores (
              razao_social
            )
          )
        `)
        .order("data_conciliacao", { ascending: false })
        .limit(50);

      if (error) throw error;
      setReconciliations(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar reconciliações",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runReconciliation = async () => {
    setProcessing(true);
    try {
      // Call edge function to run reconciliation
      const { data, error } = await supabase.functions.invoke('reconciliar-cdv');

      if (error) throw error;

      toast({
        title: "✅ Reconciliação executada com sucesso!",
        description: `${data.reconciliations || 0} impactos atribuídos às quotas. ${data.quotas_processadas || 0} quotas processadas.`
      });

      // Refresh list
      await fetchReconciliations();
      
      // Trigger page reload to update all tabs
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Erro ao executar reconciliação",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getImpactIcon = (tipo: string) => {
    switch (tipo) {
      case 'residuos':
        return '🌱';
      case 'educacao':
        return '📚';
      case 'embalagens':
        return '📦';
      default:
        return '•';
    }
  };

  const formatQuantity = (tipo: string, quantidade: number) => {
    switch (tipo) {
      case 'residuos':
        return `${quantidade.toFixed(2)} kg`;
      case 'educacao':
        return `${quantidade.toFixed(1)} horas`;
      case 'embalagens':
        return `${quantidade} itens`;
      default:
        return quantidade.toString();
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Alert className="border-primary/50 bg-primary/5">
        <Clock className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">Reconciliação Automática de Impactos</AlertTitle>
        <AlertDescription>
          O processo de reconciliação atribui automaticamente os impactos disponíveis no estoque 
          (resíduos coletados, horas de educação ambiental e embalagens catalogadas) 
          às quotas CDV que ainda estão em geração, atualizando o progresso mensal de cada investidor 
          em direção à certificação completa (100% das metas atingidas).
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Executar Reconciliação Manual</CardTitle>
              <CardDescription>
                Processar impactos disponíveis e atribuir às quotas pendentes
              </CardDescription>
            </div>
            <Button 
              onClick={runReconciliation} 
              disabled={processing}
              className="gap-2"
            >
              {processing ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Executar Agora
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Reconciliações</CardTitle>
          <CardDescription>
            Últimas 50 reconciliações processadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reconciliations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma reconciliação registrada ainda</p>
              <p className="text-sm mt-2">Execute o processo para começar a atribuir impactos</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Quota</TableHead>
                  <TableHead>Investidor</TableHead>
                  <TableHead>Tipo de Impacto</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Processado Por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliations.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell>
                      {new Date(rec.data_conciliacao).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium">
                      #{rec.cdv_quotas?.numero_quota}
                    </TableCell>
                    <TableCell>
                      {rec.cdv_quotas?.cdv_investidores?.razao_social}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <span>{getImpactIcon(rec.tipo_impacto)}</span>
                        {rec.tipo_impacto}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatQuantity(rec.tipo_impacto, rec.quantidade_conciliada)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {rec.processado_por || 'Sistema'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCDVReconciliation;
