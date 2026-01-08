import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessarCodigoRequest {
  codigo: string;
  origem_leitura?: 'barcode' | 'qrcode';
}

interface ProcessarCodigoResponse {
  chave_acesso: string | null;
  valida: boolean;
  motivo_invalidez: string;
  modelo: '55' | '65' | '59' | 'desconhecido';
  tipo_entrada: 'numerica_44_digitos' | 'url' | 'texto_livre';
  origem_leitura: 'barcode' | 'qrcode' | 'desconhecida';
  entrada_bruta: string;
}

function extrairChaveAcesso(codigo: string): string | null {
  // Procura por sequência de exatamente 44 dígitos numéricos
  const regex = /\d{44}/;
  const match = codigo.match(regex);
  return match ? match[0] : null;
}

function validarChave(chave: string | null): { valida: boolean; motivo: string } {
  if (!chave) {
    return { valida: false, motivo: 'nenhuma sequência de 44 dígitos encontrada' };
  }

  if (chave.length !== 44) {
    return { valida: false, motivo: 'comprimento diferente de 44 dígitos' };
  }

  if (!/^\d{44}$/.test(chave)) {
    return { valida: false, motivo: 'contém caracteres não numéricos' };
  }

  return { valida: true, motivo: '' };
}

function identificarModelo(chave: string | null): '55' | '65' | '59' | 'desconhecido' {
  if (!chave || chave.length !== 44) {
    return 'desconhecido';
  }

  // Posições 21 e 22 (índices 20 e 21 em zero-based)
  const modelo = chave.substring(20, 22);

  switch (modelo) {
    case '55':
      return '55'; // NF-e
    case '65':
      return '65'; // NFC-e
    case '59':
      return '59'; // NFP (Nota Fiscal Eletrônica de Produtor Rural)
    default:
      return 'desconhecido';
  }
}

function classificarTipoEntrada(codigo: string): 'numerica_44_digitos' | 'url' | 'texto_livre' {
  // Verifica se é URL
  if (codigo.includes('http://') || codigo.includes('https://')) {
    return 'url';
  }

  // Verifica se é praticamente só números (pode ter espaços)
  const somenteNumeros = codigo.replace(/\s/g, '');
  if (/^\d{44}$/.test(somenteNumeros)) {
    return 'numerica_44_digitos';
  }

  // Qualquer outro caso
  return 'texto_livre';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { codigo, origem_leitura }: ProcessarCodigoRequest = await req.json();

    console.log('Processando código:', { codigo, origem_leitura });

    if (!codigo || typeof codigo !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Código não fornecido ou inválido' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extrai a chave de acesso
    const chaveAcesso = extrairChaveAcesso(codigo);
    console.log('Chave extraída:', chaveAcesso);

    // Valida a chave
    const { valida, motivo } = validarChave(chaveAcesso);
    console.log('Validação:', { valida, motivo });

    // Identifica o modelo
    const modelo = identificarModelo(chaveAcesso);
    console.log('Modelo identificado:', modelo);

    // Classifica o tipo de entrada
    const tipoEntrada = classificarTipoEntrada(codigo);
    console.log('Tipo de entrada:', tipoEntrada);

    const resultado: ProcessarCodigoResponse = {
      chave_acesso: chaveAcesso,
      valida,
      motivo_invalidez: motivo,
      modelo,
      tipo_entrada: tipoEntrada,
      origem_leitura: origem_leitura || 'desconhecida',
      entrada_bruta: codigo,
    };

    console.log('Resultado final:', resultado);

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao processar código:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar código',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
