import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Save, ArrowLeft } from "lucide-react";

const AdminSettings = () => {
  const navigate = useNavigate();
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('valor')
        .eq('chave', 'whatsapp_ciclik')
        .single();

      if (error) throw error;
      setWhatsapp(data?.valor || "");
    } catch (error: any) {
      toast.error('Erro ao carregar configurações', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('configuracoes_sistema')
        .update({ valor: whatsapp })
        .eq('chave', 'whatsapp_ciclik');

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar configurações', {
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Configurações do Sistema
          </CardTitle>
          <CardDescription>
            Gerencie as configurações gerais do sistema Ciclik
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">
              WhatsApp para Atendimento de Cooperativas
            </Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="5511999999999"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Número no formato internacional (código do país + DDD + número)
              <br />
              Exemplo: 5511999999999 (Brasil, São Paulo)
            </p>
          </div>

          <Button onClick={saveSettings} disabled={saving} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
