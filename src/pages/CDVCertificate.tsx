import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Award, 
  Download, 
  ArrowLeft,
  Leaf,
  GraduationCap,
  Package,
  CheckCircle,
  Calendar,
  Shield,
  CloudOff,
  TreeDeciduous,
  Zap,
  Droplets,
  Users,
  TrendingUp,
  Globe
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { appUrl } from '@/lib/appUrl';
import { getAssetPath } from '@/utils/assetPath';
import { generateQRCodeWithLogo } from '@/utils/qrCodeWithLogo';

// Ícones oficiais das ODS da ONU
import ods08 from "@/assets/ods/ods-08.jpg";
import ods09 from "@/assets/ods/ods-09.jpg";
import ods10 from "@/assets/ods/ods-10.jpg";
import ods11 from "@/assets/ods/ods-11.jpg";
import ods12 from "@/assets/ods/ods-12.jpg";
import ods13 from "@/assets/ods/ods-13.jpg";

interface Certificate {
  id: string;
  numero_quota: string;
  data_compra: string;
  data_maturacao: string;
  created_at: string;
  kg_conciliados: number;
  horas_conciliadas: number;
  embalagens_conciliadas: number;
  meta_kg_residuos: number;
  meta_horas_educacao: number;
  meta_embalagens: number;
  investidor?: {
    razao_social: string;
    cnpj: string;
    nome_responsavel: string;
  };
  projeto?: {
    titulo: string;
  };
}

const CDVCertificate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCertificate();
  }, [id]);

  const fetchCertificate = async () => {
    try {
      const { data: quota, error } = await supabase
        .from("cdv_quotas")
        .select(`
          *,
          investidor:cdv_investidores(razao_social, cnpj, nome_responsavel),
          projeto:cdv_projetos(titulo)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      
      setCertificate(quota as Certificate);
      
      const validationUrl = appUrl(`/cdv/validate/${id}`);
      const qr = await generateQRCodeWithLogo({
        data: validationUrl,
        width: 200,
        margin: 2
      });
      setQrCodeUrl(qr);
      
    } catch (error: any) {
      toast({
        title: "Erro ao carregar certificado",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!certificateRef.current || !certificate) return;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      // A4 dimensions in mm
      const a4Width = 210;
      const a4Height = 297;
      
      // Esconder QR code temporariamente para captura html2canvas
      const qrContainer = certificateRef.current.querySelector('[data-qr-container]') as HTMLElement;
      if (qrContainer) {
        qrContainer.style.visibility = 'hidden';
      }
      
      // Aguardar renderização
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        logging: false,
      });
      
      // Restaurar visibilidade do QR code
      if (qrContainer) {
        qrContainer.style.visibility = 'visible';
      }
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = a4Width;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let yOffset = 0;
      let scaleFactor = 1;
      
      // Se a imagem for maior que A4, escalar para caber
      if (imgHeight > a4Height) {
        scaleFactor = a4Height / imgHeight;
        const scaledWidth = imgWidth * scaleFactor;
        const scaledHeight = a4Height;
        const xOffset = (a4Width - scaledWidth) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, 0, scaledWidth, scaledHeight);
      } else {
        yOffset = (a4Height - imgHeight) / 2;
        pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);
      }
      
      // Adicionar QR code diretamente no PDF (posição fixa)
      if (qrCodeUrl) {
        // Calcular posição do QR code baseado no layout
        const qrSize = 25; // tamanho do QR em mm
        const qrX = a4Width - 55; // posição X (direita)
        const qrY = imgHeight > a4Height 
          ? a4Height - 65 
          : yOffset + imgHeight - 65; // posição Y (próximo ao rodapé)
        
        pdf.addImage(qrCodeUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      }
      
      pdf.save(`Certificado_CDV_${certificate.numero_quota}.pdf`);
      
      toast({
        title: "Certificado baixado!",
        description: "O PDF foi salvo com sucesso."
      });
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: error.message,
        variant: "destructive"
      });
    }
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

  if (!certificate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-primary/5">
        <Card className="p-8 text-center border-primary/10">
          <img src={getAssetPath('ciclik-logo.png')} alt="Ciclik" className="h-12 mx-auto mb-4 opacity-50" />
          <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Certificado não encontrado</h2>
          <Button onClick={() => navigate("/cdv/investor")} className="font-display">Voltar</Button>
        </Card>
      </div>
    );
  }

  const emissionDate = new Date();
  const generationDate = certificate?.created_at ? new Date(certificate.created_at) : emissionDate;

  // Cálculos de impactos ambientais equivalentes
  const kgReciclados = certificate?.kg_conciliados || 0;
  const horasEducacao = certificate?.horas_conciliadas || 0;
  const embalagensMapeadas = certificate?.embalagens_conciliadas || 0;

  // Fórmulas de conversão baseadas em estudos ambientais
  const co2Evitado = (kgReciclados * 2.5).toFixed(0); // ~2.5kg CO2/kg reciclado
  const arvoresPreservadas = Math.ceil(kgReciclados / 200); // 1 árvore = ~200kg papel
  const energiaEconomizada = (kgReciclados * 4.5).toFixed(0); // ~4.5kWh/kg
  const aguaEconomizada = (kgReciclados * 90).toFixed(0); // ~90L/kg
  // FÓRMULA OFICIAL TRAVADA: (kg_reciclados / 3) + (horas_educacao * 10), sempre arredondando para cima
  const pessoasImpactadas = Math.ceil((kgReciclados / 3) + (horasEducacao * 10));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header com marca integrada */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={getAssetPath('ciclik-logo-full.png')} alt="Ciclik" className="h-9 object-contain" />
              <div className="h-6 w-px bg-border/50" />
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-display font-medium text-primary">Certificado</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate("/cdv/investor")} className="gap-2 font-display">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <Button size="sm" onClick={handleDownload} className="gap-2 font-display">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Baixar PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Certificado para PDF */}
        <div ref={certificateRef} className="bg-white rounded-2xl overflow-hidden shadow-lg">
          <Card className="border-0 overflow-hidden shadow-2xl bg-white">
            {/* Header Corporativo */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
              <div className="px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <img src={getAssetPath('logo-with-slogan.png')} alt="Ciclik" className="h-12 object-contain" />
                  </div>
                  <Badge className="bg-white/20 text-white border-0 px-4 py-2 backdrop-blur-sm">
                    <Shield className="w-4 h-4 mr-2" />
                    Certificado Oficial #{certificate.numero_quota}
                  </Badge>
                </div>
                
                <div className="text-center">
                  <h1 className="text-4xl font-display font-bold mb-2">
                    Certificado Digital Verde
                  </h1>
                  <p className="text-lg opacity-90">
                    Comprovação de Impacto Ambiental Mensurável
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-8 space-y-6">
              {/* Identificação Corporativa */}
              <div className="border-l-4 border-primary pl-6 py-4 bg-muted/30">
                <p className="text-sm text-muted-foreground font-body mb-2 uppercase tracking-wider">
                  Certificado emitido para
                </p>
                <h2 className="text-3xl font-display font-bold text-foreground mb-1">
                  {certificate.investidor?.razao_social || "Investidor"}
                </h2>
                <p className="text-muted-foreground font-body">
                  CNPJ: {certificate.investidor?.cnpj || "N/A"} • Responsável: {certificate.investidor?.nome_responsavel || "N/A"}
                </p>
              </div>

              {/* Métricas em Tabela */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-primary/5">
                    <tr>
                      <th className="text-left p-4 font-display font-semibold">Categoria de Impacto</th>
                      <th className="text-right p-4 font-display font-semibold">Valor Certificado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Leaf className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-display font-medium">Resíduos Reciclados</p>
                          <p className="text-xs text-muted-foreground font-body">Material desviado de aterros</p>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-2xl font-display font-bold text-primary">{certificate.kg_conciliados} kg</span>
                      </td>
                    </tr>
                    <tr className="border-t bg-muted/20">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-display font-medium">Educação Ambiental</p>
                          <p className="text-xs text-muted-foreground font-body">Horas de conscientização</p>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-2xl font-display font-bold text-primary">{certificate.horas_conciliadas}h</span>
                      </td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-display font-medium">Embalagens Mapeadas</p>
                          <p className="text-xs text-muted-foreground font-body">Rastreabilidade logística</p>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-2xl font-display font-bold text-primary">{certificate.embalagens_conciliadas}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Equivalências em Cards Compactos */}
              <div>
                <h3 className="text-sm font-display font-bold mb-3 text-muted-foreground uppercase tracking-wider">
                  Equivalência de Impacto Ambiental
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  <div className="bg-white border border-blue-200 rounded-lg p-3 text-center shadow-sm">
                    <CloudOff className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <p className="text-xl font-display font-bold text-blue-700">{Number(co2Evitado).toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-blue-600 uppercase">kg CO₂</p>
                  </div>
                  <div className="bg-white border border-green-200 rounded-lg p-3 text-center shadow-sm">
                    <TreeDeciduous className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <p className="text-xl font-display font-bold text-green-700">{arvoresPreservadas.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-green-600 uppercase">árvores</p>
                  </div>
                  <div className="bg-white border border-yellow-200 rounded-lg p-3 text-center shadow-sm">
                    <Zap className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                    <p className="text-xl font-display font-bold text-yellow-700">{Number(energiaEconomizada).toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-yellow-600 uppercase">kWh</p>
                  </div>
                  <div className="bg-white border border-cyan-200 rounded-lg p-3 text-center shadow-sm">
                    <Droplets className="w-6 h-6 text-cyan-600 mx-auto mb-1" />
                    <p className="text-xl font-display font-bold text-cyan-700">{Number(aguaEconomizada).toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-cyan-600 uppercase">litros</p>
                  </div>
                  <div className="bg-white border border-purple-200 rounded-lg p-3 text-center shadow-sm">
                    <Users className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                    <p className="text-xl font-display font-bold text-purple-700">{pessoasImpactadas.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-purple-600 uppercase">pessoas</p>
                  </div>
                </div>
              </div>

              {/* ODS Compacta */}
              <div className="border-t pt-6">
                <p className="text-xs text-muted-foreground font-body text-center mb-3 uppercase tracking-wider">
                  Contribuição ODS da ONU - Agenda 2030
                </p>
                <div className="flex justify-center gap-2">
                  <img src={ods08} alt="ODS 8" className="w-14 h-14 rounded-lg" />
                  <img src={ods09} alt="ODS 9" className="w-14 h-14 rounded-lg" />
                  <img src={ods10} alt="ODS 10" className="w-14 h-14 rounded-lg" />
                  <img src={ods11} alt="ODS 11" className="w-14 h-14 rounded-lg" />
                  <img src={ods12} alt="ODS 12" className="w-14 h-14 rounded-lg" />
                  <img src={ods13} alt="ODS 13" className="w-14 h-14 rounded-lg" />
                </div>
              </div>

              {/* Footer com QR Code */}
              <div className="grid grid-cols-3 gap-6 border-t pt-6 items-center" data-qr-container>
                <div>
                  <p className="text-xs text-muted-foreground font-body mb-1">Emitido em</p>
                  <p className="font-display font-semibold">{format(generationDate, "dd/MM/yyyy", { locale: ptBR })}</p>
                  <p className="text-xs text-muted-foreground font-body mt-2">Projeto</p>
                  <p className="font-display font-medium text-sm">{certificate.projeto?.titulo || "CDV"}</p>
                </div>
                <div className="flex justify-center">
                  {qrCodeUrl && (
                    <div className="relative">
                      <div className="w-28 h-28 bg-white rounded-xl border-2 border-muted p-2 shadow-sm">
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code de Validação" 
                          className="w-full h-full"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-body text-center mt-1">QR Code de Validação</p>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-body mb-1">Período de Validade</p>
                  <p className="font-display font-semibold text-sm">
                    {format(new Date(certificate.data_compra), "MMM/yy", { locale: ptBR })} - {format(new Date(certificate.data_maturacao), "MMM/yy", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground font-body mt-2">Verificável em</p>
                  <p className="font-display font-medium text-sm text-primary">ciclik.com.br</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CDVCertificate;
