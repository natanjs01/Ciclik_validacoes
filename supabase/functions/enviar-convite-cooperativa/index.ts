import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConviteCooperativaRequest {
  email: string;
  nomeFantasia: string;
  resetLink: string;
  idCooperativa?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let email = "";
  let nomeFantasia = "";
  let idCooperativa: string | undefined;
  const assunto = "Bem-vindo(a) ao Ciclik - Configure sua senha";

  try {
    const requestData: ConviteCooperativaRequest = await req.json();
    email = requestData.email;
    nomeFantasia = requestData.nomeFantasia;
    idCooperativa = requestData.idCooperativa;
    const resetLink = requestData.resetLink;

    console.log("Enviando convite para:", email);

    const emailResponse = await resend.emails.send({
      from: "Ciclik <onboarding@resend.dev>",
      to: [email],
      subject: "Bem-vindo(a) ao Ciclik - Configure sua senha",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Convite Ciclik</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Bem-vindo(a) ao Ciclik!</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                          Olá, <strong>${nomeFantasia}</strong>!
                        </p>
                        
                        <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                          Você foi cadastrado(a) como cooperativa parceira na plataforma Ciclik. Para começar a usar o sistema, você precisa definir sua senha de acesso.
                        </p>
                        
                        <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                          Clique no botão abaixo para criar sua senha e acessar o sistema:
                        </p>
                        
                        <!-- Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 0 0 30px;">
                              <a href="${resetLink}" 
                                 style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
                                Definir Senha
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px; margin: 0 0 30px; border-radius: 4px;">
                          <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
                            <strong>Seu email de acesso:</strong> ${email}
                          </p>
                        </div>
                        
                        <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                          Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
                        </p>
                        
                        <p style="margin: 0 0 30px; color: #10b981; font-size: 14px; line-height: 1.6; word-break: break-all;">
                          ${resetLink}
                        </p>
                        
                        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                          <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                            Este link é válido por 24 horas. Caso não tenha solicitado este cadastro, por favor ignore este email.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                        <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                          © ${new Date().getFullYear()} Ciclik. Todos os direitos reservados.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    console.log("Email enviado com sucesso:", emailResponse);

    // Registrar histórico de email se idCooperativa foi fornecido
    if (idCooperativa) {
      try {
        await supabase.from('emails_cooperativas').insert({
          id_cooperativa: idCooperativa,
          email_destino: email,
          tipo_email: 'convite',
          assunto: assunto,
          status_envio: 'enviado',
          metadata: {
            nome_fantasia: nomeFantasia
          }
        });
        console.log("Histórico de email registrado");
      } catch (dbError) {
        console.error("Erro ao registrar histórico:", dbError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Erro ao enviar email de convite:", error);
    
    // Registrar erro no histórico se idCooperativa foi fornecido
    if (idCooperativa) {
      try {
        await supabase.from('emails_cooperativas').insert({
          id_cooperativa: idCooperativa,
          email_destino: email,
          tipo_email: 'convite',
          assunto: assunto,
          status_envio: 'erro',
          mensagem_erro: error.message,
          metadata: {
            nome_fantasia: nomeFantasia
          }
        });
      } catch (dbError) {
        console.error("Erro ao registrar histórico de erro:", dbError);
      }
    }
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
