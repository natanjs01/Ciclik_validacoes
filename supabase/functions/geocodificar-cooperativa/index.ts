import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { cooperativaId } = await req.json();

    if (!cooperativaId) {
      throw new Error("cooperativaId é obrigatório");
    }

    // Cliente Supabase com service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log(`📍 Geocodificando cooperativa: ${cooperativaId}`);

    // Buscar cooperativa
    const { data: cooperativa, error: fetchError } = await supabaseClient
      .from("cooperativas")
      .select("id, nome_fantasia, logradouro, numero, bairro, cidade, uf, cep, latitude, longitude")
      .eq("id", cooperativaId)
      .single();

    if (fetchError || !cooperativa) {
      throw new Error("Cooperativa não encontrada");
    }

    // Verificar se já tem coordenadas
    if (cooperativa.latitude && cooperativa.longitude) {
      console.log(`✅ Cooperativa já tem coordenadas: ${cooperativa.latitude}, ${cooperativa.longitude}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Cooperativa já possui coordenadas",
          latitude: cooperativa.latitude,
          longitude: cooperativa.longitude,
          cached: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Montar endereço completo para geocodificação
    const enderecoPartes = [
      cooperativa.logradouro,
      cooperativa.numero,
      cooperativa.bairro,
      cooperativa.cidade,
      cooperativa.uf,
      cooperativa.cep,
      "Brasil",
    ].filter(Boolean);

    const enderecoCompleto = enderecoPartes.join(", ");
    console.log(`🔍 Buscando coordenadas para: ${enderecoCompleto}`);

    // Tentar com endereço completo primeiro
    let latitude: number | null = null;
    let longitude: number | null = null;
    let precision = "unknown";

    // Tentativa 1: Endereço completo
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      enderecoCompleto
    )}&limit=1`;

    const response = await fetch(geocodeUrl, {
      headers: {
        "User-Agent": "Ciclik-App/1.0 (contato@ciclik.com.br)",
        Accept: "application/json",
      },
    });

    const results = await response.json();

    if (results.length > 0) {
      latitude = parseFloat(results[0].lat);
      longitude = parseFloat(results[0].lon);
      precision = "address";
      console.log(`✅ Coordenadas encontradas (endereço completo): ${latitude}, ${longitude}`);
    } else {
      // Tentativa 2: Cidade + UF (fallback)
      console.log("⚠️ Endereço completo não encontrado, tentando cidade + UF");
      const enderecoSimples = `${cooperativa.cidade}, ${cooperativa.uf}, Brasil`;
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        enderecoSimples
      )}&limit=1`;

      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          "User-Agent": "Ciclik-App/1.0 (contato@ciclik.com.br)",
          Accept: "application/json",
        },
      });

      const fallbackResults = await fallbackResponse.json();

      if (fallbackResults.length > 0) {
        latitude = parseFloat(fallbackResults[0].lat);
        longitude = parseFloat(fallbackResults[0].lon);
        precision = "city";
        console.log(`✅ Coordenadas encontradas (cidade): ${latitude}, ${longitude}`);
      } else {
        throw new Error(
          `Não foi possível encontrar coordenadas para: ${cooperativa.cidade}, ${cooperativa.uf}`
        );
      }
    }

    // Atualizar cooperativa com coordenadas
    const { error: updateError } = await supabaseClient
      .from("cooperativas")
      .update({
        latitude,
        longitude,
      })
      .eq("id", cooperativaId);

    if (updateError) {
      throw new Error(`Erro ao atualizar coordenadas: ${updateError.message}`);
    }

    console.log(`✅ Cooperativa atualizada com sucesso!`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Coordenadas adicionadas com sucesso",
        cooperativa: cooperativa.nome_fantasia,
        latitude,
        longitude,
        precision,
        endereco: enderecoCompleto,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Erro:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
