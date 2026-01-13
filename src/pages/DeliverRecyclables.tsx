import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, QrCode, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

export default function DeliverRecyclables() {
  const { user } = useAuth();
  const [operadores, setOperadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [deliveryId, setDeliveryId] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    id_cooperativa: '',
  });

  useEffect(() => {
    loadOperadores();
  }, []);

  const loadOperadores = async () => {
    const { data } = await supabase
      .from('cooperativas')
      .select('*')
      .eq('status', 'aprovada');
    
    if (data) setOperadores(data);
  };

  const getTipoOperadorLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'cooperativa': 'Cooperativa',
      'rota_ciclik': 'Rota Ciclik',
      'operador_parceiro': 'Operador Parceiro'
    };
    return labels[tipo] || tipo;
  };

  const generateQRCode = async () => {
    if (!formData.id_cooperativa || !user) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione um operador logístico',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const qrcodeId = `CICLIK-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const { data, error } = await supabase
        .from('entregas_reciclaveis')
        .insert({
          id_usuario: user.id,
          id_cooperativa: formData.id_cooperativa,
          tipo_material: 'Não especificado',
          peso_estimado: null,
          qrcode_id: qrcodeId,
          status: 'gerada',
          data_geracao: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const qrDataUrl = await QRCode.toDataURL(qrcodeId, {
        width: 400,
        margin: 2,
        color: {
          dark: '#166534',
          light: '#ffffff'
        }
      });

      setQrCodeUrl(qrDataUrl);
      setDeliveryId(qrcodeId);

      toast({
        title: 'QR Code gerado!',
        description: 'Apresente este código na cooperativa',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qrcode-${deliveryId}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/user')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Entregar Recicláveis</h1>
            <p className="text-muted-foreground">Selecione o operador e gere seu QR Code</p>
          </div>
        </div>

        {!qrCodeUrl ? (
          <Card>
            <CardHeader>
              <CardTitle>Informações da Entrega</CardTitle>
              <CardDescription>
                Selecione o operador logístico para gerar o QR Code de entrega
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cooperativa">Operador Logístico *</Label>
                <Select
                  value={formData.id_cooperativa}
                  onValueChange={(value) => setFormData({ id_cooperativa: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o operador" />
                  </SelectTrigger>
                  <SelectContent>
                    {operadores.map((op) => (
                      <SelectItem key={op.id} value={op.id}>
                        {op.nome_fantasia} - {getTipoOperadorLabel(op.tipo_operador)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                <p>
                  ⏱️ O QR Code gerado terá validade de <strong>24 horas</strong> para que a entrega seja realizada no operador selecionado.
                </p>
              </div>

              <Button
                onClick={generateQRCode}
                disabled={loading}
                size="sm"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Gerar QR Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>QR Code Gerado</CardTitle>
              <CardDescription>
                Apresente este código no operador logístico selecionado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <img src={qrCodeUrl} alt="QR Code" className="w-full max-w-sm" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Código da entrega:</p>
                  <p className="font-mono font-bold">{deliveryId}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleDownloadQR} className="flex-1" variant="outline">
                  Baixar QR Code
                </Button>
                <Button onClick={() => {
                  setQrCodeUrl('');
                  setDeliveryId('');
                  setFormData({
                    id_cooperativa: '',
                  });
                }} className="flex-1">
                  Nova Entrega
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}