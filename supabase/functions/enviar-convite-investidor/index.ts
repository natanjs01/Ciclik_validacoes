import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConviteInvestidorRequest {
  email: string;
  razaoSocial: string;
  nomeResponsavel: string;
  cnpj?: string;
  idInvestidor: string;
  reenvio?: boolean;
  originUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Edge function enviar-convite-investidor chamada");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  let requestBody: ConviteInvestidorRequest | null = null;

  try {
    requestBody = await req.json();
    const { email, razaoSocial, nomeResponsavel, cnpj, idInvestidor, reenvio, originUrl } = requestBody!;

    console.log(`Processando convite para investidor: ${razaoSocial} (${email})`);
    console.log(`Reenvio: ${reenvio}, Origin URL: ${originUrl}`);

    // URL do app - usar a URL de origem do frontend
    const appUrl = originUrl || 'https://eco-champion-circle.lovable.app';
    // Redirecionar para /auth onde o investidor vai definir senha e ser logado
    const redirectUrl = `${appUrl}/auth?invited=true`;

    let userId: string | null = null;
    let userExisted = false;

    // Verificar se já existe um usuário auth com este EMAIL
    console.log("Verificando se existe usuário auth com email:", email);
    
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("Erro ao listar usuários:", listError);
      throw new Error(`Erro ao verificar usuários: ${listError.message}`);
    }

    const userWithEmail = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (userWithEmail) {
      // Usuário já existe - enviar link de login
      console.log("Usuário já existe com este email, ID:", userWithEmail.id);
      userId = userWithEmail.id;
      userExisted = true;
      
      // Atualizar o id_user do investidor
      await supabaseAdmin
        .from("cdv_investidores")
        .update({ id_user: userId })
        .eq("id", idInvestidor);

      // Garantir role de investidor
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: 'investidor' }, { onConflict: 'user_id,role' });

      // Gerar magic link para usuário existente
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: redirectUrl
        }
      });

      if (linkError) {
        console.error("Erro ao gerar magic link:", linkError);
        throw new Error(`Erro ao gerar link de acesso: ${linkError.message}`);
      }

      const actionLink = linkData?.properties?.action_link;
      
      if (!actionLink) {
        throw new Error("Falha ao gerar link de acesso");
      }

      console.log("Magic link gerado para usuário existente");

      // Atualizar status do investidor
      await supabaseAdmin
        .from("cdv_investidores")
        .update({
          convite_enviado: true,
          data_convite: new Date().toISOString(),
          status: "ativo"
        })
        .eq("id", idInvestidor);

      // Registrar histórico
      await supabaseAdmin
        .from("emails_investidores")
        .insert({
          id_investidor: idInvestidor,
          email_destino: email,
          tipo_email: reenvio ? "reenvio_convite" : "convite",
          assunto: "Acesso ao Dashboard - Ciclik Digital Verde",
          status_envio: "Enviado",
          metadata: { 
            metodo: "magic_link",
            user_existed: true,
            reenvio: reenvio || false
          }
        });

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Link de acesso gerado com sucesso",
        userId,
        accessLink: actionLink,
        userExisted: true
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } else {
      // Usuário não existe - usar inviteUserByEmail
      console.log("Criando convite para novo usuário...");
      
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo: redirectUrl,
          data: {
            nome: nomeResponsavel,
            tipo_pessoa: 'PJ',
            tipo_pj: 'Outro',
            cnpj: cnpj || '',
            cep: '00000-000',
            role: 'investidor'
          }
        }
      );

      if (inviteError) {
        console.error("Erro ao enviar convite:", inviteError);
        throw new Error(`Erro ao enviar convite: ${inviteError.message}`);
      }

      if (!inviteData?.user?.id) {
        throw new Error("Falha ao criar convite - resposta vazia");
      }

      userId = inviteData.user.id;
      console.log("Convite enviado com sucesso, User ID:", userId);

      // Atualizar id_user do investidor
      await supabaseAdmin
        .from("cdv_investidores")
        .update({ 
          id_user: userId,
          convite_enviado: true,
          data_convite: new Date().toISOString(),
          status: "ativo"
        })
        .eq("id", idInvestidor);

      // Atribuir role 'investidor'
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: 'investidor' }, { onConflict: 'user_id,role' });

      // Registrar histórico
      await supabaseAdmin
        .from("emails_investidores")
        .insert({
          id_investidor: idInvestidor,
          email_destino: email,
          tipo_email: reenvio ? "reenvio_convite" : "convite",
          assunto: "Convite - Ciclik Digital Verde",
          status_envio: "Enviado",
          metadata: { 
            metodo: "invite_user_by_email",
            user_existed: false,
            reenvio: reenvio || false,
            razao_social: razaoSocial,
            nome_responsavel: nomeResponsavel
          }
        });

      console.log("Processo de convite concluído com sucesso!");

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Convite enviado com sucesso! O investidor receberá um email para definir sua senha.",
        userId,
        userExisted: false
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

  } catch (error: any) {
    console.error("Erro ao processar convite:", error);

    // Registrar erro no histórico
    if (requestBody?.idInvestidor) {
      try {
        await supabaseAdmin
          .from("emails_investidores")
          .insert({
            id_investidor: requestBody.idInvestidor,
            email_destino: requestBody.email,
            tipo_email: requestBody.reenvio ? "reenvio_convite" : "convite",
            assunto: "Convite Ciclik Digital Verde",
            status_envio: "Erro",
            mensagem_erro: error.message
          });
      } catch (logError) {
        console.error("Erro ao registrar falha no histórico:", logError);
      }
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
