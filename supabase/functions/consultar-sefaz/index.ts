import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SefazConsultaRequest {
  chaveAcesso: string;
  uf: string;
}

interface NotaFiscalData {
  success: boolean;
  data?: {
    numero: string;
    serie: string;
    dataEmissao: string;
    valorTotal: number;
    cnpj: string;
    razaoSocial: string;
    nomeFantasia?: string;
    itens?: Array<{
      descricao: string;
      quantidade: number;
      valorUnitario: number;
      valorTotal: number;
    }>;
  };
  fromCache?: boolean;
  error?: string;
}

// Mapeamento de UF para URLs base da SEFAZ
const SEFAZ_URLS: Record<string, string> = {
  '11': 'https://www.sefaz.ro.gov.br/nfce/consulta',
  '12': 'https://sistemas.sefaz.ac.gov.br/nfce/consulta',
  '13': 'https://sistemas.sefaz.am.gov.br/nfce/consulta',
  '14': 'https://sistemas.sefaz.rr.gov.br/nfce/consulta',
  '15': 'https://www.sefaz.pa.gov.br/nfce/consulta',
  '16': 'https://www.sefaz.ap.gov.br/nfce/consulta',
  '17': 'https://www.sefaz.to.gov.br/nfce/consulta',
  '21': 'https://www.sefaz.ma.gov.br/nfce/consulta',
  '22': 'https://www.sefaz.pi.gov.br/nfce/consulta',
  '23': 'https://www.sefaz.ce.gov.br/nfce/consulta',
  '24': 'https://www.sefaz.rn.gov.br/nfce/consulta',
  '25': 'https://www.sefaz.pb.gov.br/nfce/consulta',
  '26': 'https://www.sefaz.pe.gov.br/nfce/consulta',
  '27': 'https://www.sefaz.al.gov.br/nfce/consulta',
  '28': 'https://www.sefaz.se.gov.br/nfce/consulta',
  '29': 'https://www.sefaz.ba.gov.br/nfce/consulta',
  '31': 'http://www.fazenda.mg.gov.br/nfce/consulta',
  '32': 'https://www.sefaz.es.gov.br/nfce/consulta',
  '33': 'http://www.fazenda.rj.gov.br/nfce/consulta',
  '35': 'https://www.fazenda.sp.gov.br/nfce/consulta',
  '41': 'http://www.fazenda.pr.gov.br/nfce/consulta',
  '42': 'https://www.sef.sc.gov.br/nfce/consulta',
  '43': 'https://www.sefaz.rs.gov.br/nfce/consulta',
  '50': 'http://www.fazenda.ms.gov.br/nfce/consulta',
  '51': 'http://www.sefaz.mt.gov.br/nfce/consulta',
  '52': 'http://www.sefaz.go.gov.br/nfce/consulta',
  '53': 'http://www.sefaz.df.gov.br/nfce/consulta',
};

async function verificarCache(supabaseAdmin: any, chaveAcesso: string): Promise<NotaFiscalData | null> {
  console.log('Verificando cache para chave:', chaveAcesso);
  
  const { data, error } = await supabaseAdmin
    .from('cache_notas_fiscais')
    .select('*')
    .eq('chave_acesso', chaveAcesso)
    .gt('data_expiracao', new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error('Erro ao verificar cache:', error);
    return null;
  }

  if (data) {
    console.log('Dados encontrados em cache');
    return {
      success: true,
      fromCache: true,
      data: {
        numero: data.numero_nota,
        serie: data.serie,
        dataEmissao: data.data_emissao,
        valorTotal: parseFloat(data.valor_total || 0),
        cnpj: data.cnpj,
        razaoSocial: data.razao_social || '',
        nomeFantasia: data.nome_fantasia,
        itens: data.itens || [],
      },
    };
  }

  return null;
}

async function salvarCache(supabaseAdmin: any, chaveAcesso: string, dados: any, fonte: string) {
  console.log('Salvando em cache:', { chaveAcesso, fonte });
  
  const { error } = await supabaseAdmin
    .from('cache_notas_fiscais')
    .upsert({
      chave_acesso: chaveAcesso,
      numero_nota: dados.numero,
      serie: dados.serie,
      data_emissao: dados.dataEmissao,
      valor_total: dados.valorTotal,
      cnpj: dados.cnpj,
      razao_social: dados.razaoSocial,
      nome_fantasia: dados.nomeFantasia,
      itens: dados.itens,
      dados_completos: dados,
      fonte: fonte,
      data_consulta: new Date().toISOString(),
      data_expiracao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }, {
      onConflict: 'chave_acesso',
    });

  if (error) {
    console.error('Erro ao salvar cache:', error);
  }
}

async function consultarBrasilAPI(cnpj: string): Promise<any> {
  console.log('Consultando Brasil API para CNPJ:', cnpj);
  
  try {
    // Limpar CNPJ (remover pontuação)
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Ciclik-App/1.0',
      },
    });

    if (!response.ok) {
      console.error('Erro na Brasil API:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('Dados obtidos da Brasil API');
    
    return {
      razaoSocial: data.razao_social || data.nome_fantasia,
      nomeFantasia: data.nome_fantasia,
    };
  } catch (error) {
    console.error('Erro ao consultar Brasil API:', error);
    return null;
  }
}

async function extrairDadosSefazHTML(html: string): Promise<any> {
  console.log('Extraindo dados do HTML da SEFAZ');
  
  try {
    // Extrair valor total
    let valorTotal = 0;
    const valorMatch = html.match(/Valor Total[:\s]*R?\$?\s*([\d.,]+)/i) ||
                      html.match(/vNF[:\s]*(\d+[.,]\d+)/i);
    if (valorMatch) {
      valorTotal = parseFloat(valorMatch[1].replace(/\./g, '').replace(',', '.'));
    }

    // Extrair razão social
    let razaoSocial = '';
    const razaoMatch = html.match(/Razão Social[:\s]*([^<\n]+)/i) ||
                       html.match(/xNome[:\s]*([^<\n]+)/i);
    if (razaoMatch) {
      razaoSocial = razaoMatch[1].trim();
    }

    // Extrair itens (tentativa básica)
    const itens: any[] = [];
    const itemMatches = html.matchAll(/Produto[:\s]*([^<\n]+)[\s\S]*?Quantidade[:\s]*([\d.,]+)[\s\S]*?Valor[:\s]*R?\$?\s*([\d.,]+)/gi);
    
    for (const match of itemMatches) {
      itens.push({
        descricao: match[1].trim(),
        quantidade: parseFloat(match[2].replace(',', '.')),
        valorUnitario: 0,
        valorTotal: parseFloat(match[3].replace(/\./g, '').replace(',', '.')),
      });
    }

    return {
      valorTotal,
      razaoSocial,
      itens: itens.length > 0 ? itens : undefined,
    };
  } catch (error) {
    console.error('Erro ao extrair dados do HTML:', error);
    return {};
  }
}

async function consultarSefaz(chaveAcesso: string, uf: string): Promise<NotaFiscalData> {
  console.log(`Consultando SEFAZ para UF ${uf}, chave: ${chaveAcesso}`);
  
  const baseUrl = SEFAZ_URLS[uf];
  
  if (!baseUrl) {
    return {
      success: false,
      error: `UF ${uf} não suportada para consulta automática`,
    };
  }

  try {
    // Extrair dados básicos da chave de acesso
    const modelo = chaveAcesso.substring(20, 22);
    const serie = chaveAcesso.substring(22, 25);
    const numero = chaveAcesso.substring(25, 34).replace(/^0+/, '');
    const cnpj = chaveAcesso.substring(6, 20);
    const cnpjFormatado = cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    const aamm = chaveAcesso.substring(2, 6);
    const ano = '20' + aamm.substring(0, 2);
    const mes = aamm.substring(2, 4);
    
    // Tentar consultar SEFAZ para scraping
    const consultaUrl = `${baseUrl}?chNFe=${chaveAcesso}`;
    
    let dadosSefaz: any = {};
    
    try {
      console.log(`Tentando scraping em: ${consultaUrl}`);
      
      const response = await fetch(consultaUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (response.ok) {
        const html = await response.text();
        dadosSefaz = await extrairDadosSefazHTML(html);
        console.log('Dados extraídos via scraping:', dadosSefaz);
      }
    } catch (scrapError) {
      console.log('Scraping não disponível, continuando com dados básicos');
    }

    // Tentar enriquecer com Brasil API
    let dadosEmpresa: any = {};
    try {
      dadosEmpresa = await consultarBrasilAPI(cnpjFormatado) || {};
    } catch (apiError) {
      console.log('Brasil API não disponível');
    }

    // Combinar dados de todas as fontes
    const dadosCombinados = {
      numero: numero,
      serie: serie,
      dataEmissao: `${ano}-${mes}-01`,
      valorTotal: dadosSefaz.valorTotal || 0,
      cnpj: cnpjFormatado,
      razaoSocial: dadosSefaz.razaoSocial || dadosEmpresa.razaoSocial || '',
      nomeFantasia: dadosEmpresa.nomeFantasia || '',
      itens: dadosSefaz.itens,
    };

    return {
      success: true,
      data: dadosCombinados,
    };
  } catch (error) {
    console.error('Erro ao consultar SEFAZ:', error);
    
    // Fallback: extrair dados básicos da chave
    const numero = chaveAcesso.substring(25, 34).replace(/^0+/, '');
    const serie = chaveAcesso.substring(22, 25);
    const cnpj = chaveAcesso.substring(6, 20);
    const aamm = chaveAcesso.substring(2, 6);
    const ano = '20' + aamm.substring(0, 2);
    const mes = aamm.substring(2, 4);
    
    return {
      success: true,
      data: {
        numero: numero,
        serie: serie,
        dataEmissao: `${ano}-${mes}-01`,
        valorTotal: 0,
        cnpj: cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'),
        razaoSocial: '',
      },
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const { chaveAcesso, uf }: SefazConsultaRequest = await req.json();

    if (!chaveAcesso || !uf) {
      throw new Error('Chave de acesso e UF são obrigatórios');
    }

    if (chaveAcesso.length !== 44) {
      throw new Error('Chave de acesso deve ter 44 dígitos');
    }

    // 1. Verificar cache primeiro
    const dadosCache = await verificarCache(supabaseAdmin, chaveAcesso);
    if (dadosCache) {
      return new Response(JSON.stringify(dadosCache), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Consultar SEFAZ + APIs externas
    const resultado = await consultarSefaz(chaveAcesso, uf);

    // 3. Salvar em cache se sucesso
    if (resultado.success && resultado.data) {
      await salvarCache(supabaseAdmin, chaveAcesso, resultado.data, 'consulta_completa');
    }

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Erro no edge function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
