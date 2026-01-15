import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import QRCode from "qrcode";
import { getAssetPath } from "@/utils/assetPath";

// Ícones oficiais das ODS da ONU
import ods08 from "@/assets/ods/ods-08.jpg";
import ods09 from "@/assets/ods/ods-09.jpg";
import ods10 from "@/assets/ods/ods-10.jpg";
import ods11 from "@/assets/ods/ods-11.jpg";
import ods12 from "@/assets/ods/ods-12.jpg";
import ods13 from "@/assets/ods/ods-13.jpg";

// Dados MOCKADOS para preview
const mockCertificate = {
  id: "preview-certificate-id",
  numero_quota: "CIC-0042",
  data_compra: "2025-06-15",
  data_maturacao: "2026-01-15",
  created_at: "2026-01-15T10:30:00",
  kg_conciliados: 256,
  horas_conciliadas: 48,
  embalagens_conciliadas: 1024,
  meta_kg_residuos: 256,
  meta_horas_educacao: 48,
  meta_embalagens: 1024,
  investidor: {
    razao_social: "Empresa Sustentável LTDA",
    cnpj: "12.345.678/0001-99",
    nome_responsavel: "João Silva"
  },
  projeto: {
    titulo: "Projeto Ciclik Digital Verde 2025"
  }
};

const CDVCertificatePreview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    try {
      const qr = await QRCode.toDataURL(`https://ciclik.com.br/cdv/validate/${mockCertificate.id}`, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qr);
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
    }
  };

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
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
      
      pdf.save(`certificado-cdv-preview.pdf`);
      
      toast({
        title: "PDF baixado com sucesso!",
        description: "Certificado de preview salvo."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar PDF",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const emissionDate = new Date();
  const generationDate = mockCertificate.created_at ? new Date(mockCertificate.created_at) : emissionDate;

  // Cálculos de impactos ambientais equivalentes
  const kgReciclados = mockCertificate.kg_conciliados || 0;
  const horasEducacao = mockCertificate.horas_conciliadas || 0;
  const embalagensMapeadas = mockCertificate.embalagens_conciliadas || 0;

  // Fórmulas de conversão baseadas em estudos ambientais
  const co2Evitado = (kgReciclados * 2.5).toFixed(0);
  const arvoresPreservadas = Math.ceil(kgReciclados / 200);
  const energiaEconomizada = (kgReciclados * 4.5).toFixed(0);
  const aguaEconomizada = (kgReciclados * 90).toFixed(0);
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
                <span className="text-sm font-display font-medium text-primary">Preview do Certificado</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2 font-display">
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

      {/* Aviso de Preview */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <h3 className="font-display font-semibold text-yellow-900 mb-1">
                🎨 Modo Preview - Visualização do Layout
              </h3>
              <p className="text-sm text-yellow-700 font-body">
                Este é um certificado de demonstração com dados fictícios. 
                O design e formatação são idênticos aos certificados reais emitidos para investidores.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Certificado para PDF */}
        <div ref={certificateRef} className="bg-white rounded-2xl overflow-hidden shadow-lg">
          <Card className="border-0 overflow-hidden">
            {/* Header do certificado - design compacto para A4 */}
            <div className="bg-gradient-to-r from-primary to-primary/85 text-white relative">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
                <div className="absolute top-1/2 right-[15%] w-32 h-32 rounded-full border border-white/10 -translate-y-1/2" />
              </div>
              
              <div className="relative z-10 px-6 py-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-xl font-display font-bold tracking-wide text-white/95">ciclik</span>
                  <Leaf className="w-4 h-4 text-ciclik-orange" />
                </div>
                
                <h1 className="text-2xl font-display font-bold mb-1 tracking-tight">
                  Certificado Digital Verde
                </h1>
                <p className="text-sm opacity-80 font-body">Impacto Ambiental Certificado</p>
              </div>
            </div>

            <CardContent className="p-5">
              {/* Identificação - compacto */}
              <div className="text-center mb-4">
                <Badge className="bg-primary/10 text-primary text-sm px-4 py-1.5 mb-2 font-display">
                  CDV #{mockCertificate.numero_quota}
                </Badge>
                <h2 className="text-xl font-display font-bold text-foreground mb-1">
                  {mockCertificate.investidor.razao_social}
                </h2>
                <p className="text-sm text-muted-foreground font-body">
                  CNPJ: {mockCertificate.investidor.cnpj}
                </p>
              </div>

              {/* Selo de Validação - compacto */}
              <div className="flex justify-center mb-4">
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 font-display font-semibold">Certificado Válido e Verificável</span>
                </div>
              </div>

              {/* Impactos Certificados - compacto */}
              <div className="mb-4">
                <h3 className="text-sm font-display font-bold text-center mb-3 text-foreground">Impactos Ambientais Certificados</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3 text-center">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-1">
                      <Leaf className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-lg font-display font-bold text-primary">{mockCertificate.kg_conciliados} kg</p>
                    <p className="text-xs text-muted-foreground font-body">Resíduos Reciclados</p>
                  </div>

                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3 text-center">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-1">
                      <GraduationCap className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-lg font-display font-bold text-primary">{mockCertificate.horas_conciliadas}h</p>
                    <p className="text-xs text-muted-foreground font-body">Educação Ambiental</p>
                  </div>

                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3 text-center">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-1">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-lg font-display font-bold text-primary">{mockCertificate.embalagens_conciliadas}</p>
                    <p className="text-xs text-muted-foreground font-body">Embalagens Mapeadas</p>
                  </div>
                </div>
              </div>

              {/* Impactos Ambientais Equivalentes - compacto */}
              <div className="mb-4">
                <h3 className="text-sm font-display font-bold text-center mb-2 text-foreground">Equivalência Ambiental</h3>
                <div className="grid grid-cols-5 gap-2">
                  <div className="bg-blue-50 border border-blue-200/50 rounded-lg p-2 text-center">
                    <CloudOff className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-sm font-display font-bold text-blue-700">{Number(co2Evitado).toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-blue-600/80 font-body">kg CO₂</p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200/50 rounded-lg p-2 text-center">
                    <TreeDeciduous className="w-4 h-4 text-green-600 mx-auto mb-1" />
                    <p className="text-sm font-display font-bold text-green-700">{arvoresPreservadas.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-green-600/80 font-body">árvores</p>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200/50 rounded-lg p-2 text-center">
                    <Zap className="w-4 h-4 text-yellow-600 mx-auto mb-1" />
                    <p className="text-sm font-display font-bold text-yellow-700">{Number(energiaEconomizada).toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-yellow-600/80 font-body">kWh</p>
                  </div>
                  
                  <div className="bg-cyan-50 border border-cyan-200/50 rounded-lg p-2 text-center">
                    <Droplets className="w-4 h-4 text-cyan-600 mx-auto mb-1" />
                    <p className="text-sm font-display font-bold text-cyan-700">{Number(aguaEconomizada).toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-cyan-600/80 font-body">litros</p>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200/50 rounded-lg p-2 text-center">
                    <Users className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                    <p className="text-sm font-display font-bold text-purple-700">{pessoasImpactadas.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-purple-600/80 font-body">pessoas</p>
                  </div>
                </div>
                
                {/* Nota sobre mudança de comportamento */}
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground font-body bg-muted/30 rounded py-1.5 px-3">
                  <TrendingUp className="w-3 h-3 text-primary" />
                  <span>Tendência: <strong className="text-foreground">{pessoasImpactadas}</strong> cidadãos em mudança de comportamento ambiental</span>
                </div>
              </div>

              {/* Seção ODS - compacta */}
              <div className="mb-4 border-t pt-4">
                <div className="text-center mb-3">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Globe className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-display font-bold text-foreground">Objetivos de Desenvolvimento Sustentável</h3>
                  </div>
                  <p className="text-xs text-muted-foreground font-body">
                    Contribuição direta para as ODS da ONU:
                  </p>
                </div>
                
                <div className="grid grid-cols-6 gap-2">
                  <img src={ods08} alt="ODS 8" className="w-full rounded shadow-sm" />
                  <img src={ods09} alt="ODS 9" className="w-full rounded shadow-sm" />
                  <img src={ods10} alt="ODS 10" className="w-full rounded shadow-sm" />
                  <img src={ods11} alt="ODS 11" className="w-full rounded shadow-sm" />
                  <img src={ods12} alt="ODS 12" className="w-full rounded shadow-sm" />
                  <img src={ods13} alt="ODS 13" className="w-full rounded shadow-sm" />
                </div>
                
                <p className="mt-2 text-[10px] text-center text-muted-foreground font-body">
                  Agenda 2030: Investimento em impacto ambiental verificável para a transformação sustentável
                </p>
              </div>

              {/* Informações e QR Code - compacto */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <Calendar className="w-4 h-4 text-primary" />
                    <div>
                      <span className="text-[10px] text-muted-foreground font-body block">Data de Geração</span>
                      <span className="text-xs font-display font-medium">{format(generationDate, "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <Award className="w-4 h-4 text-primary" />
                    <div>
                      <span className="text-[10px] text-muted-foreground font-body block">Projeto</span>
                      <span className="text-xs font-display font-medium">{mockCertificate.projeto.titulo}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <div>
                      <span className="text-[10px] text-muted-foreground font-body block">Período</span>
                      <span className="text-xs font-display font-medium">
                        {format(new Date(mockCertificate.data_compra), "MMM/yy", { locale: ptBR })} - {format(new Date(mockCertificate.data_maturacao), "MMM/yy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center" data-qr-container>
                  {qrCodeUrl && (
                    <div className="text-center">
                      <div className="p-2 bg-white rounded-lg shadow-sm border inline-block">
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code de Validação" 
                          className="w-20 h-20"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-body mt-1">
                        Escaneie para validar
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé compacto */}
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-body">
                  <div className="flex items-center gap-2">
                    <img src={getAssetPath('ciclik-logo.png')} alt="Ciclik" className="h-4 opacity-60" />
                    <span>Certificado de Impacto Ambiental</span>
                  </div>
                  <span>ciclik.com.br/validate/{mockCertificate.id.slice(0, 8)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações técnicas do layout */}
        <div className="mt-6 bg-muted/50 rounded-lg p-4">
          <h3 className="font-display font-bold text-sm mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Especificações Técnicas do Certificado
          </h3>
          <ul className="text-sm font-body space-y-1 text-muted-foreground">
            <li>📄 <strong>Formato:</strong> A4 (210mm x 297mm) otimizado para impressão</li>
            <li>🎨 <strong>Design:</strong> Responsivo e profissional com gradientes Ciclik</li>
            <li>✅ <strong>Validação:</strong> QR Code único para verificação pública</li>
            <li>📊 <strong>Métricas:</strong> 3 impactos diretos + 5 equivalências ambientais</li>
            <li>🌍 <strong>ODS:</strong> Alinhamento com 6 Objetivos de Desenvolvimento Sustentável da ONU</li>
            <li>🔒 <strong>Autenticidade:</strong> Selo de validação e informações rastreáveis</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CDVCertificatePreview;
