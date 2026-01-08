import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Processing OCR for fiscal receipt');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em extrair dados de notas fiscais brasileiras. Retorne apenas um JSON válido com os campos: valor_total (número), cnpj_estabelecimento (string), data_compra (formato YYYY-MM-DD), numero_nota (string), itens (array de objetos com nome, quantidade, preco_unitario, preco_total, reciclavel boolean). Se não conseguir extrair algum dado, use null. Para o campo reciclavel, analise cada produto e determine se é reciclável (true) ou não (false).'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extraia os seguintes dados desta nota fiscal: valor total, CNPJ do estabelecimento, data da compra, número da nota, e lista de todos os produtos com seus respectivos preços e quantidades. Para cada produto, determine se é reciclável ou não. Retorne apenas um JSON válido.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente mais tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Erro ao processar OCR');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    console.log('OCR response:', content);

    // Parse JSON from response
    let extractedData;
    try {
      // Remove markdown code blocks if present
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse JSON:', content);
      throw new Error('Não foi possível extrair dados da nota fiscal');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          valor_total: extractedData.valor_total || null,
          cnpj_estabelecimento: extractedData.cnpj_estabelecimento || null,
          data_compra: extractedData.data_compra || null,
          numero_nota: extractedData.numero_nota || null,
          itens: extractedData.itens || [],
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ocr-nota-fiscal:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
