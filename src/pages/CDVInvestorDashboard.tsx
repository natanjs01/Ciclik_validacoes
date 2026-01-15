import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Award, 
  Calendar, 
  Download, 
  Leaf, 
  Package, 
  GraduationCap,
  TrendingUp,
  ArrowLeft,
  QrCode,
  LogOut
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getAssetPath } from "@/utils/assetPath";

interface Quota {
  id: string;
  numero_quota: string;
  status: string;
  data_compra: string;
  data_maturacao: string;
  valor_pago: number;
  kg_conciliados: number;
  horas_conciliadas: number;
  embalagens_conciliadas: number;
  meta_kg_residuos: number;
  meta_horas_educacao: number;
  meta_embalagens: number;
}

const CDVInvestorDashboard = () => {
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [loading, setLoading] = useState(true);
  const [investorName, setInvestorName] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuotas();
  }, []);

  const fetchQuotas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Remover .single() para evitar erro 400 e usar array
      const { data: investidores, error: investidorError } = await supabase
        .from("cdv_investidores")
        .select("id, razao_social, status")
        .eq("id_user", user.id);

      if (investidorError) {
        throw investidorError;
      }

      if (!investidores || investidores.length === 0) {
        toast({
          title: "Erro",
          description: "Investidor não encontrado. Entre em contato com o suporte.",
          variant: "destructive"
        });
        return;
      }

      // Pegar o primeiro investidor se houver múltiplos (não deveria acontecer)
      const investidor = investidores[0];

      setInvestorName(investidor.razao_social || "");

      const { data, error } = await supabase
        .from("cdv_quotas")
        .select("*")
        .eq("id_investidor", investidor.id)
        .order("data_compra", { ascending: false });

      if (error) throw error;
      setQuotas(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar quotas",
        description: error.message || "Ocorreu um erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const calculateProgress = (conciliado: number, meta: number) => {
    return Math.min((conciliado / meta) * 100, 100);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      em_geracao: { label: "Em Geração", className: "bg-blue-500" },
      pronto: { label: "Pronto", className: "bg-green-500" },
      certificado_emitido: { label: "Certificado Emitido", className: "bg-purple-500" }
    };

    const variant = variants[status] || variants.em_geracao;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <img src={getAssetPath('ciclik-logo.png')} alt="Ciclik" className="h-12 animate-pulse" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header com marca integrada */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={getAssetPath('ciclik-logo-full.png')} 
                alt="Ciclik - Recicle e Ganhe" 
                className="h-16 md:h-20 object-contain"
              />
              <div className="hidden md:block h-8 w-px bg-border/50" />
              <Badge variant="outline" className="hidden md:flex bg-primary/5 text-primary border-primary/20 font-display">
                Digital Verde
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/cdv")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Título com branding sutil */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-8 bg-gradient-to-b from-primary to-ciclik-orange rounded-full" />
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Meu Portfólio CDV
            </h1>
          </div>
          <p className="text-muted-foreground font-body ml-5">
            {investorName ? `Olá, ${investorName}! ` : ""}Acompanhe seus investimentos e certificados verdes
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-body">Total de Quotas</CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold text-foreground">{quotas.length}</div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-body">Investimento</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold text-foreground">
                R$ {(quotas.reduce((sum, q) => sum + q.valor_pago, 0)).toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-body">Prontos</CardTitle>
              <Award className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold text-green-600">
                {quotas.filter(q => q.status === 'pronto' || q.status === 'certificado_emitido').length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-body">Em Geração</CardTitle>
              <Leaf className="h-4 w-4 text-ciclik-orange" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold text-ciclik-orange">
                {quotas.filter(q => q.status === 'em_geracao').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quotas List */}
        <div className="space-y-6">
          {quotas.map((quota) => {
            const progressKg = calculateProgress(quota.kg_conciliados, quota.meta_kg_residuos);
            const progressHoras = calculateProgress(quota.horas_conciliadas, quota.meta_horas_educacao);
            const progressEmbalagens = calculateProgress(quota.embalagens_conciliadas, quota.meta_embalagens);
            const progressTotal = (progressKg + progressHoras + progressEmbalagens) / 3;

            return (
              <Card key={quota.id} className="overflow-hidden border-primary/10 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-display">Quota #{quota.numero_quota}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2 font-body">
                        <Calendar className="w-4 h-4" />
                        Maturação em {formatDistanceToNow(new Date(quota.data_maturacao), { locale: ptBR, addSuffix: true })}
                      </CardDescription>
                    </div>
                    {getStatusBadge(quota.status)}
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium font-body">Progresso Total</span>
                      <span className="text-sm font-display font-bold text-primary">{progressTotal.toFixed(1)}%</span>
                    </div>
                    <Progress value={progressTotal} className="h-3" />
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Resíduos */}
                    <div className="p-4 bg-primary/5 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Leaf className="w-5 h-5 text-primary" />
                        <span className="font-display font-semibold">Resíduos</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-body">
                          <span className="text-muted-foreground">Meta</span>
                          <span className="font-medium">{quota.meta_kg_residuos} kg</span>
                        </div>
                        <div className="flex justify-between text-sm font-body">
                          <span className="text-muted-foreground">Conciliado</span>
                          <span className="font-medium text-primary">{quota.kg_conciliados} kg</span>
                        </div>
                        <Progress value={progressKg} className="h-2" />
                      </div>
                    </div>

                    {/* Educação */}
                    <div className="p-4 bg-primary/5 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <GraduationCap className="w-5 h-5 text-primary" />
                        <span className="font-display font-semibold">Educação</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-body">
                          <span className="text-muted-foreground">Meta</span>
                          <span className="font-medium">{quota.meta_horas_educacao} horas</span>
                        </div>
                        <div className="flex justify-between text-sm font-body">
                          <span className="text-muted-foreground">Conciliado</span>
                          <span className="font-medium text-primary">{quota.horas_conciliadas} horas</span>
                        </div>
                        <Progress value={progressHoras} className="h-2" />
                      </div>
                    </div>

                    {/* Embalagens */}
                    <div className="p-4 bg-primary/5 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="w-5 h-5 text-primary" />
                        <span className="font-display font-semibold">Embalagens</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-body">
                          <span className="text-muted-foreground">Meta</span>
                          <span className="font-medium">{quota.meta_embalagens} itens</span>
                        </div>
                        <div className="flex justify-between text-sm font-body">
                          <span className="text-muted-foreground">Conciliado</span>
                          <span className="font-medium text-primary">{quota.embalagens_conciliadas} itens</span>
                        </div>
                        <Progress value={progressEmbalagens} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {(quota.status === 'pronto' || quota.status === 'certificado_emitido') && (
                    <div className="flex gap-4 mt-6 pt-6 border-t">
                      <Button 
                        className="flex-1 gap-2 font-display"
                        onClick={() => navigate(`/cdv/certificate/${quota.id}`)}
                      >
                        <Download className="w-4 h-4" />
                        Baixar Certificado
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 gap-2 font-display"
                        onClick={() => navigate(`/cdv/validate/${quota.id}`)}
                      >
                        <QrCode className="w-4 h-4" />
                        Ver QR Code
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {quotas.length === 0 && (
            <Card className="border-primary/10">
              <CardContent className="p-12 text-center">
                <img src={getAssetPath('ciclik-logo.png')} alt="Ciclik" className="h-16 mx-auto mb-6 opacity-50" />
                <h3 className="text-xl font-display font-bold mb-2">Nenhuma quota adquirida</h3>
                <p className="text-muted-foreground font-body mb-6">
                  Comece seu investimento ambiental adquirindo sua primeira quota CDV
                </p>
                <Button onClick={() => navigate("/cdv")} className="font-display">
                  Conhecer CDV
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer com marca */}
        <footer className="mt-16 pt-8 border-t border-border/50 text-center">
          <img src={getAssetPath('ciclik-logo.png')} alt="Ciclik" className="h-8 mx-auto mb-3 opacity-60" />
          <p className="text-xs text-muted-foreground font-body">
            © {new Date().getFullYear()} Ciclik - Digital Verde. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default CDVInvestorDashboard;
