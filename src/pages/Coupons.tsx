import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Gift, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Coupons() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadCoupons();
  }, [user]);

  const loadCoupons = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('cupons')
      .select('*')
      .eq('id_usuario_resgatou', user.id)
      .order('data_resgate', { ascending: false });
    
    if (data) setCoupons(data);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Código copiado!',
      description: 'O código do cupom foi copiado',
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/user')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Meus Cupons</h1>
            <p className="text-muted-foreground">Seus cupons resgatados</p>
          </div>
        </div>

        <div className="space-y-4">
          {coupons.map((coupon) => (
            <Card key={coupon.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-primary" />
                      {coupon.marketplace}
                    </CardTitle>
                    <CardDescription>
                      Valor: R$ {coupon.valor.toFixed(2)} | Mínimo: R$ {coupon.minimo_compra.toFixed(2)}
                    </CardDescription>
                  </div>
                  <Badge variant={coupon.status === 'usado' ? 'secondary' : 'default'}>
                    {coupon.status === 'usado' ? 'Usado' : 'Disponível'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-4 py-2 rounded font-mono">
                    {coupon.codigo}
                  </code>
                  <Button size="icon" variant="outline" onClick={() => copyCode(coupon.codigo)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {coupons.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Você ainda não resgatou cupons</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}