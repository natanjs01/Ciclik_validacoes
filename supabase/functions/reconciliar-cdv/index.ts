import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * ⚠️ FUNÇÃO DEPRECADA ⚠️
 * 
 * Esta função de reconciliação automática foi substituída pelo sistema UIB com reconciliação manual.
 * 
 * Novo fluxo:
 * 1. Impactos são registrados em impacto_bruto
 * 2. Motor UIB (motor-uib) processa e gera UIBs automaticamente
 * 3. Admin usa interface manual (AdminCDVReconciliationManual) para atribuir UIBs e gerar CDVs
 * 4. Função gerar-cdv-manual é chamada para criar CDVs
 * 
 * Esta função permanece ativa apenas para compatibilidade, mas retorna aviso de deprecação.
 */

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('⚠️ AVISO: reconciliar-cdv está DEPRECADA. Use o sistema UIB com reconciliação manual.');

  return new Response(
    JSON.stringify({
      success: false,
      deprecated: true,
      message: 'Esta função foi deprecada. O sistema agora utiliza UIBs com reconciliação manual.',
      alternative: {
        motor: 'motor-uib',
        manual: 'gerar-cdv-manual',
        interface: '/admin/cdv → aba Reconciliação'
      },
      instructions: [
        '1. Execute o Motor UIB para gerar UIBs a partir de impactos brutos',
        '2. Acesse Admin CDV → aba Reconciliação',
        '3. Selecione projeto e quota',
        '4. Clique em "Gerar CDV" para atribuir UIBs manualmente'
      ]
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 410 // Gone - indica recurso não mais disponível
    }
  );
});
