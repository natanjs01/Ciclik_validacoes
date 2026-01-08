import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Award, 
  CheckCircle,
  XCircle,
  ArrowLeft,
  Leaf,
  GraduationCap,
  Package,
  Calendar,
  Building,
  QrCode,
  Shield
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import QRCode from "qrcode";

interface CertificateData {
  id: string;
  numero_quota: string;
  status: string;
  data_compra: string;
  data_maturacao: string;
  kg_conciliados: number;
  horas_conciliadas: number;
  embalagens_conciliadas: number;
  meta_kg_residuos: number;
  meta_horas_educacao: number;
  meta_embalagens: number;
  investidor?: {
    razao_social: string;
    cnpj: string;
  };
  projeto?: {
    titulo: string;
  };
}

const CDVValidate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    validateCertificate();
  }, [id]);

  const validateCertificate = async () => {
    try {
      const { data: quota, error } = await supabase
        .from("cdv_quotas")
        .select(`
          *,
          investidor:cdv_investidores(razao_social, cnpj),
          projeto:cdv_projetos(titulo)
        `)
        .eq("id", id)
        .single();

      if (error || !quota) {
        setIsValid(false);
        setLoading(false);
        return;
      }

      setCertificate(quota as CertificateData);
      setIsValid(quota.status === 'pronto' || quota.status === 'certificado_emitido');
      
      const validationUrl = `${window.location.origin}/cdv/validate/${id}`;
      const qr = await QRCode.toDataURL(validationUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qr);
      
    } catch (error) {
      setIsValid(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <img src="/ciclik-logo.png" alt="Ciclik" className="h-12 animate-pulse" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-destructive/5 p-4">
        {/* Header com marca */}
        <div className="absolute top-0 left-0 right-0 p-4">
          <div className="max-w-2xl mx-auto flex justify-center">
            <img src="/ciclik-logo-full.png" alt="Ciclik" className="h-10 object-contain opacity-60" />
          </div>
        </div>
        
        <Card className="max-w-md w-full text-center p-8 border-destructive/20">
          <XCircle className="w-20 h-20 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-destructive mb-2">Certificado Inválido</h2>
          <p className="text-muted-foreground font-body mb-6">
            Este código de certificado não foi encontrado em nosso sistema.
          </p>
          <Button onClick={() => navigate("/")} variant="outline" className="font-display">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header com marca integrada */}
      <header className="bg-white/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/ciclik-logo-full.png" alt="Ciclik" className="h-9 object-contain" />
              <div className="h-6 w-px bg-border/50" />
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-display font-medium text-primary">Validação</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 md:p-8">
        {/* Status de Validação */}
        <Card className={`mb-6 border-2 overflow-hidden ${isValid ? 'border-green-500' : 'border-yellow-500'}`}>
          <div className={`p-6 ${isValid ? 'bg-gradient-to-r from-green-50 to-green-100/50' : 'bg-gradient-to-r from-yellow-50 to-yellow-100/50'}`}>
            <div className="flex items-center gap-4">
              {isValid ? (
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              ) : (
                <div className="p-3 bg-yellow-100 rounded-full">
                  <XCircle className="w-10 h-10 text-yellow-600" />
                </div>
              )}
              <div>
                <h1 className={`text-2xl font-display font-bold ${isValid ? 'text-green-700' : 'text-yellow-700'}`}>
                  {isValid ? 'Certificado Válido' : 'Certificado em Geração'}
                </h1>
                <p className={`font-body ${isValid ? 'text-green-600' : 'text-yellow-600'}`}>
                  {isValid 
                    ? 'Este certificado foi verificado e é autêntico.' 
                    : 'Este certificado ainda está em processo de geração de impacto.'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Detalhes do Certificado */}
        <Card className="border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-display flex items-center gap-2">
                  <Award className="w-6 h-6 text-primary" />
                  CDV #{certificate.numero_quota}
                </CardTitle>
              </div>
              <Badge className={`font-display ${isValid ? 'bg-green-500' : 'bg-yellow-500'}`}>
                {isValid ? 'Certificado' : 'Em Geração'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Empresa */}
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
              <Building className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-display font-semibold text-foreground">{certificate.investidor?.razao_social}</p>
                <p className="text-sm text-muted-foreground font-body">CNPJ: {certificate.investidor?.cnpj}</p>
              </div>
            </div>

            {/* Projeto */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
              <Award className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground font-body">Projeto</p>
                <p className="font-display font-semibold">{certificate.projeto?.titulo || "Ciclik Digital Verde"}</p>
              </div>
            </div>

            {/* Período */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground font-body">Período de Maturação</p>
                <p className="font-display font-semibold">
                  {format(new Date(certificate.data_compra), "MMM/yyyy", { locale: ptBR })} - {format(new Date(certificate.data_maturacao), "MMM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Impactos */}
            <div>
              <h3 className="font-display font-semibold mb-4 text-foreground">Impactos Ambientais</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                  <Leaf className="w-7 h-7 text-primary mx-auto mb-2" />
                  <p className="text-xl font-display font-bold text-primary">{certificate.kg_conciliados}</p>
                  <p className="text-xs text-muted-foreground font-body">kg reciclados</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                  <GraduationCap className="w-7 h-7 text-primary mx-auto mb-2" />
                  <p className="text-xl font-display font-bold text-primary">{certificate.horas_conciliadas}</p>
                  <p className="text-xs text-muted-foreground font-body">horas educação</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                  <Package className="w-7 h-7 text-primary mx-auto mb-2" />
                  <p className="text-xl font-display font-bold text-primary">{certificate.embalagens_conciliadas}</p>
                  <p className="text-xs text-muted-foreground font-body">embalagens</p>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center pt-6 border-t">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-5 h-5 text-primary" />
                <span className="text-sm font-display font-medium text-foreground">QR Code de Validação</span>
              </div>
              {qrCodeUrl && (
                <div className="p-3 bg-white rounded-xl shadow-sm border">
                  <img src={qrCodeUrl} alt="QR Code" className="w-36 h-36" />
                </div>
              )}
              <p className="text-xs text-muted-foreground font-body mt-3 text-center">
                ID: {certificate.id}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={() => navigate("/")} className="font-display">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Button>
        </div>

        {/* Rodapé com marca */}
        <div className="text-center mt-8 pt-6 border-t border-border/50">
          <img src="/ciclik-logo.png" alt="Ciclik" className="h-7 mx-auto mb-3 opacity-60" />
          <p className="text-xs text-muted-foreground font-body">
            Verificado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
          <p className="text-xs text-muted-foreground font-body mt-1">
            © {new Date().getFullYear()} Ciclik - Digital Verde
          </p>
        </div>
      </div>
    </div>
  );
};

export default CDVValidate;
