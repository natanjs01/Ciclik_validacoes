import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async () => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Chamar a função para expirar cupons
    const { error } = await supabase.rpc('marcar_cupons_expirados');

    if (error) {
      console.error('Erro ao expirar cupons:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Cupons expirados marcados com sucesso');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Cupons expirados processados com sucesso'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err) {
    console.error('Erro inesperado:', err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
