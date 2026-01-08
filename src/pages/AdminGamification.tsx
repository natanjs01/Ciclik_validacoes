import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trophy, Save, RefreshCw, Target } from "lucide-react";
import { toast } from "sonner";

interface GamificationConfig {
  key: string;
  label: string;
  description: string;
  value: number;
  category: 'earning' | 'spending' | 'missions';
  // Metas por nível
  meta_semanal_basico?: number;
  meta_mensal_basico?: number;
  meta_semanal_intermediario?: number;
  meta_mensal_intermediario?: number;
  meta_semanal_avancado?: number;
  meta_mensal_avancado?: number;
}

const AdminGamification = () => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<GamificationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultConfigs: GamificationConfig[] = [
    {
      key: 'pontos_missao_completa',
      label: 'Missão Concluída',
      description: 'Pontos ganhos ao completar uma missão educacional',
      value: 10,
      category: 'earning',
      meta_semanal_basico: 3,
      meta_mensal_basico: 10,
      meta_semanal_intermediario: 5,
      meta_mensal_intermediario: 15,
      meta_semanal_avancado: 7,
      meta_mensal_avancado: 20
    },
    {
      key: 'pontos_nota_fiscal_validada',
      label: 'Nota Fiscal Validada',
      description: 'Pontos ganhos quando uma nota fiscal é validada',
      value: 50,
      category: 'earning',
      meta_semanal_basico: 1,
      meta_mensal_basico: 4,
      meta_semanal_intermediario: 2,
      meta_mensal_intermediario: 6,
      meta_semanal_avancado: 3,
      meta_mensal_avancado: 10
    },
    {
      key: 'pontos_material_cadastro_nota',
      label: 'Material Cadastrado (Nota Fiscal)',
      description: 'Pontos por cada material cadastrado via nota fiscal',
      value: 5,
      category: 'earning',
      meta_semanal_basico: 0,
      meta_mensal_basico: 0,
      meta_semanal_intermediario: 0,
      meta_mensal_intermediario: 0,
      meta_semanal_avancado: 0,
      meta_mensal_avancado: 0
    },
    {
      key: 'pontos_material_cadastro_manual',
      label: 'Material Cadastrado (Manual)',
      description: 'Pontos por cada material cadastrado manualmente',
      value: 10,
      category: 'earning',
      meta_semanal_basico: 0,
      meta_mensal_basico: 0,
      meta_semanal_intermediario: 0,
      meta_mensal_intermediario: 0,
      meta_semanal_avancado: 0,
      meta_mensal_avancado: 0
    },
    {
      key: 'pontos_indicacao_cadastro',
      label: 'Indicação - Cadastro',
      description: 'Pontos quando um indicado se cadastra no sistema',
      value: 40,
      category: 'earning',
      meta_semanal_basico: 0,
      meta_mensal_basico: 1,
      meta_semanal_intermediario: 0,
      meta_mensal_intermediario: 2,
      meta_semanal_avancado: 1,
      meta_mensal_avancado: 3
    },
    {
      key: 'pontos_indicacao_primeira_missao',
      label: 'Indicação - Primeira Missão',
      description: 'Pontos quando indicado completa sua primeira missão',
      value: 20,
      category: 'earning',
      meta_semanal_basico: 0,
      meta_mensal_basico: 0,
      meta_semanal_intermediario: 0,
      meta_mensal_intermediario: 0,
      meta_semanal_avancado: 0,
      meta_mensal_avancado: 0
    },
    {
      key: 'pontos_base_entrega_6kg',
      label: 'Base Entrega (6kg)',
      description: 'Pontos base para cada 6kg de material entregue',
      value: 20,
      category: 'earning',
      meta_semanal_basico: 1,
      meta_mensal_basico: 4,
      meta_semanal_intermediario: 2,
      meta_mensal_intermediario: 8,
      meta_semanal_avancado: 3,
      meta_mensal_avancado: 12
    },
  ];

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      
      // Buscar configurações existentes
      const { data: existingConfigs, error } = await supabase
        .from('configuracoes_sistema')
        .select('*')
        .or('chave.like.pontos_%,chave.like.nivel_%,chave.like.meta_%');

      if (error) throw error;

      // Mapear configs existentes
      const configMap = new Map(existingConfigs?.map(c => [c.chave, parseInt(c.valor)]) || []);

      // Mesclar com valores padrão incluindo metas
      const mergedConfigs = defaultConfigs.map(config => ({
        ...config,
        value: configMap.get(config.key) ?? config.value,
        meta_semanal_basico: configMap.get(`meta_semanal_basico_${config.key}`) ?? config.meta_semanal_basico,
        meta_mensal_basico: configMap.get(`meta_mensal_basico_${config.key}`) ?? config.meta_mensal_basico,
        meta_semanal_intermediario: configMap.get(`meta_semanal_intermediario_${config.key}`) ?? config.meta_semanal_intermediario,
        meta_mensal_intermediario: configMap.get(`meta_mensal_intermediario_${config.key}`) ?? config.meta_mensal_intermediario,
        meta_semanal_avancado: configMap.get(`meta_semanal_avancado_${config.key}`) ?? config.meta_semanal_avancado,
        meta_mensal_avancado: configMap.get(`meta_mensal_avancado_${config.key}`) ?? config.meta_mensal_avancado
      }));

      setConfigs(mergedConfigs);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações de gamificação');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key: string, newValue: string, field: string = 'value') => {
    const numValue = parseInt(newValue) || 0;
    setConfigs(configs.map(c => 
      c.key === key ? { ...c, [field]: numValue } : c
    ));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Salvar todas as configurações incluindo metas
      for (const config of configs) {
        // Salvar pontos/valor principal
        const { data: existing } = await supabase
          .from('configuracoes_sistema')
          .select('id')
          .eq('chave', config.key)
          .single();

        if (existing) {
          await supabase
            .from('configuracoes_sistema')
            .update({ 
              valor: config.value.toString(),
              updated_at: new Date().toISOString()
            })
            .eq('chave', config.key);
        } else {
          await supabase
            .from('configuracoes_sistema')
            .insert({
              chave: config.key,
              valor: config.value.toString(),
              descricao: config.description
            });
        }

        // Salvar metas se existirem
        const metas = [
          { key: `meta_semanal_basico_${config.key}`, value: config.meta_semanal_basico },
          { key: `meta_mensal_basico_${config.key}`, value: config.meta_mensal_basico },
          { key: `meta_semanal_intermediario_${config.key}`, value: config.meta_semanal_intermediario },
          { key: `meta_mensal_intermediario_${config.key}`, value: config.meta_mensal_intermediario },
          { key: `meta_semanal_avancado_${config.key}`, value: config.meta_semanal_avancado },
          { key: `meta_mensal_avancado_${config.key}`, value: config.meta_mensal_avancado }
        ];

        for (const meta of metas) {
          if (meta.value !== undefined) {
            const { data: existingMeta } = await supabase
              .from('configuracoes_sistema')
              .select('id')
              .eq('chave', meta.key)
              .single();

            if (existingMeta) {
              await supabase
                .from('configuracoes_sistema')
                .update({ 
                  valor: meta.value.toString(),
                  updated_at: new Date().toISOString()
                })
                .eq('chave', meta.key);
            } else {
              await supabase
                .from('configuracoes_sistema')
                .insert({
                  chave: meta.key,
                  valor: meta.value.toString(),
                  descricao: `Meta para ${config.label}`
                });
            }
          }
        }
      }

      toast.success('Configurações de gamificação salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfigs(defaultConfigs);
    toast.info('Valores resetados para padrão. Clique em Salvar para aplicar.');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  Gestão de Gamificação
                </CardTitle>
                <CardDescription>
                  Configure os pontos de cada atividade e as metas de missões por nível
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading || saving}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resetar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading || saving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando configurações...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Sistema de Níveis */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Sistema de Níveis Mensais
                    </CardTitle>
                    <CardDescription>
                      Os níveis são baseados nos pontos acumulados em um único mês. Usuários mudam de nível automaticamente ao atingir a faixa.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-2 border-primary/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg text-primary">Nível Básico</CardTitle>
                          <CardDescription>Embaixador Ciclik</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-primary">0 - 500</p>
                            <p className="text-sm text-muted-foreground mt-1">pontos mensais</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-success/30 bg-success/5">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg text-success">Nível Intermediário</CardTitle>
                          <CardDescription>Protetor Ciclik</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-success">501 - 1.000</p>
                            <p className="text-sm text-muted-foreground mt-1">pontos mensais</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-accent/30 bg-accent/5">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg text-accent">Nível Avançado</CardTitle>
                          <CardDescription>Guardião Ciclik</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-accent">1.001+</p>
                            <p className="text-sm text-muted-foreground mt-1">pontos mensais</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabela de Atividades e Metas */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Pontuação de Atividades e Metas por Nível
                  </h3>
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="min-w-[200px]">Atividade</TableHead>
                          <TableHead className="min-w-[250px]">Descrição</TableHead>
                          <TableHead className="text-center w-[100px]">Pontos</TableHead>
                          <TableHead className="text-center w-[80px] border-l">Semanal<br/><span className="text-xs font-normal">Básico</span></TableHead>
                          <TableHead className="text-center w-[80px]">Mensal<br/><span className="text-xs font-normal">Básico</span></TableHead>
                          <TableHead className="text-center w-[100px]">Pontos Proj.<br/><span className="text-xs font-normal">Básico</span></TableHead>
                          <TableHead className="text-center w-[80px] border-l">Semanal<br/><span className="text-xs font-normal">Interm.</span></TableHead>
                          <TableHead className="text-center w-[80px]">Mensal<br/><span className="text-xs font-normal">Interm.</span></TableHead>
                          <TableHead className="text-center w-[100px]">Pontos Proj.<br/><span className="text-xs font-normal">Interm.</span></TableHead>
                          <TableHead className="text-center w-[80px] border-l">Semanal<br/><span className="text-xs font-normal">Avan.</span></TableHead>
                          <TableHead className="text-center w-[80px]">Mensal<br/><span className="text-xs font-normal">Avan.</span></TableHead>
                          <TableHead className="text-center w-[100px]">Pontos Proj.<br/><span className="text-xs font-normal">Avan.</span></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {configs.filter(c => c.category === 'earning' && !c.key.includes('nivel_')).map((config) => (
                          <TableRow key={config.key}>
                            <TableCell className="font-medium">{config.label}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{config.description}</TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="0"
                                value={config.value}
                                onChange={(e) => handleValueChange(config.key, e.target.value, 'value')}
                                className="w-20 text-center mx-auto"
                              />
                            </TableCell>
                            <TableCell className="text-center border-l">
                              <Input
                                type="number"
                                min="0"
                                value={config.meta_semanal_basico ?? 0}
                                onChange={(e) => handleValueChange(config.key, e.target.value, 'meta_semanal_basico')}
                                className="w-16 text-center mx-auto"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="0"
                                value={config.meta_mensal_basico ?? 0}
                                onChange={(e) => handleValueChange(config.key, e.target.value, 'meta_mensal_basico')}
                                className="w-16 text-center mx-auto"
                              />
                            </TableCell>
                            <TableCell className="text-center bg-muted/30">
                              <div className="text-sm font-semibold text-primary">
                                {(config.meta_mensal_basico ?? 0) * config.value}
                              </div>
                            </TableCell>
                            <TableCell className="text-center border-l">
                              <Input
                                type="number"
                                min="0"
                                value={config.meta_semanal_intermediario ?? 0}
                                onChange={(e) => handleValueChange(config.key, e.target.value, 'meta_semanal_intermediario')}
                                className="w-16 text-center mx-auto"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="0"
                                value={config.meta_mensal_intermediario ?? 0}
                                onChange={(e) => handleValueChange(config.key, e.target.value, 'meta_mensal_intermediario')}
                                className="w-16 text-center mx-auto"
                              />
                            </TableCell>
                            <TableCell className="text-center bg-muted/30">
                              <div className="text-sm font-semibold text-primary">
                                {(config.meta_mensal_intermediario ?? 0) * config.value}
                              </div>
                            </TableCell>
                            <TableCell className="text-center border-l">
                              <Input
                                type="number"
                                min="0"
                                value={config.meta_semanal_avancado ?? 0}
                                onChange={(e) => handleValueChange(config.key, e.target.value, 'meta_semanal_avancado')}
                                className="w-16 text-center mx-auto"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="0"
                                value={config.meta_mensal_avancado ?? 0}
                                onChange={(e) => handleValueChange(config.key, e.target.value, 'meta_mensal_avancado')}
                                className="w-16 text-center mx-auto"
                              />
                            </TableCell>
                            <TableCell className="text-center bg-muted/30">
                              <div className="text-sm font-semibold text-primary">
                                {(config.meta_mensal_avancado ?? 0) * config.value}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {/* Linha de Totais */}
                        <TableRow className="bg-primary/10 font-bold border-t-2 border-primary/20">
                          <TableCell colSpan={3} className="text-right pr-4">
                            <div className="flex items-center justify-end gap-2">
                              <Trophy className="h-5 w-5 text-primary" />
                              <span className="text-lg">TOTAL MENSAL POR NÍVEL:</span>
                            </div>
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                          <TableCell className="text-center bg-primary/20">
                            <div className="text-lg font-bold text-primary">
                              {configs
                                .filter(c => c.category === 'earning' && !c.key.includes('nivel_'))
                                .reduce((sum, c) => sum + ((c.meta_mensal_basico ?? 0) * c.value), 0)
                                .toLocaleString('pt-BR')}
                            </div>
                            <div className="text-xs text-muted-foreground">pts Básico</div>
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                          <TableCell className="text-center bg-primary/20">
                            <div className="text-lg font-bold text-primary">
                              {configs
                                .filter(c => c.category === 'earning' && !c.key.includes('nivel_'))
                                .reduce((sum, c) => sum + ((c.meta_mensal_intermediario ?? 0) * c.value), 0)
                                .toLocaleString('pt-BR')}
                            </div>
                            <div className="text-xs text-muted-foreground">pts Intermediário</div>
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                          <TableCell className="text-center bg-primary/20">
                            <div className="text-lg font-bold text-primary">
                              {configs
                                .filter(c => c.category === 'earning' && !c.key.includes('nivel_'))
                                .reduce((sum, c) => sum + ((c.meta_mensal_avancado ?? 0) * c.value), 0)
                                .toLocaleString('pt-BR')}
                            </div>
                            <div className="text-xs text-muted-foreground">pts Avançado</div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">💡 Informações Importantes</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• As pontuações de missões específicas são configuradas individualmente em cada missão</li>
                    <li>• Pontos de entregas são calculados proporcionalmente ao peso validado</li>
                    <li>• Resgate de cupons deduz pontos baseado no valor configurado em cada cupom</li>
                    <li>• Alterações nas configurações afetam apenas transações futuras</li>
                    <li>• Metas de missões definem quantas missões os usuários devem completar por período em cada nível</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminGamification;
