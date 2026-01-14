/**
 * Serviço para gerenciamento de PDFs no Storage
 * Responsável por upload, download e gerenciamento de arquivos
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ResultadoUploadPDF,
  ValidacaoPDF,
  TipoTermo
} from '@/types/termos';
import { VALIDACAO_TERMOS } from '@/types/termos';

/**
 * Valida um arquivo PDF antes do upload
 */
export function validarPDF(arquivo: File): ValidacaoPDF {
  const erros: string[] = [];
  const tamanho_mb = arquivo.size / (1024 * 1024);

  // Validar tipo de arquivo
  if (arquivo.type !== 'application/pdf') {
    erros.push('O arquivo deve ser um PDF');
  }

  // Validar tamanho
  if (tamanho_mb > VALIDACAO_TERMOS.TAMANHO_MAX_PDF_MB) {
    erros.push(`O arquivo deve ter no máximo ${VALIDACAO_TERMOS.TAMANHO_MAX_PDF_MB}MB`);
  }

  // Validar nome do arquivo
  if (!VALIDACAO_TERMOS.PDF_NAME_PATTERN.test(arquivo.name)) {
    erros.push('Nome do arquivo inválido. Use apenas letras, números, hífens e underscores');
  }

  return {
    valido: erros.length === 0,
    erros,
    tamanho_mb
  };
}

/**
 * Gera o path correto para o PDF no storage
 * Formato: v{versao}/{tipo}-v{versao}.pdf
 */
export function gerarPathPDF(tipo: TipoTermo, versao: string): string {
  const versaoLimpa = versao.replace(/[^0-9.]/g, '');
  const tipoFormatado = tipo.replace(/_/g, '-');
  return `v${versaoLimpa}/${tipoFormatado}-v${versaoLimpa}.pdf`;
}

/**
 * Faz upload de um PDF para o storage
 * Retorna o path e URL assinada do arquivo
 */
export async function uploadPDF(
  arquivo: File,
  tipo: TipoTermo,
  versao: string
): Promise<ResultadoUploadPDF> {
  try {
    // Verificar se usuário é admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      };
    }

    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole.role !== 'admin') {
      return {
        success: false,
        error: 'Apenas administradores podem fazer upload de PDFs'
      };
    }

    // Validar arquivo
    const validacao = validarPDF(arquivo);
    if (!validacao.valido) {
      return {
        success: false,
        error: validacao.erros.join(', ')
      };
    }

    // Gerar path
    const path = gerarPathPDF(tipo, versao);

    // Fazer upload
    const { error: uploadError } = await supabase.storage
      .from('termos-uso')
      .upload(path, arquivo, {
        cacheControl: '3600',
        upsert: true, // Substituir se já existir
        contentType: 'application/pdf'
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      
      if (uploadError.message.includes('Bucket not found')) {
        return {
          success: false,
          error: 'Bucket de storage não encontrado. Configure o storage primeiro.'
        };
      }
      
      return {
        success: false,
        error: `Erro ao fazer upload: ${uploadError.message}`
      };
    }

    // Gerar URL assinada (válida por 1 ano)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('termos-uso')
      .createSignedUrl(path, 31536000); // 1 ano em segundos

    if (urlError) {
      console.error('Erro ao gerar URL:', urlError);
      return {
        success: false,
        error: 'PDF enviado, mas erro ao gerar URL de acesso'
      };
    }

    return {
      success: true,
      pdf_path: path,
      pdf_url: urlData.signedUrl
    };
  } catch (error) {
    console.error('Erro em uploadPDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido no upload'
    };
  }
}

/**
 * Gera uma nova URL assinada para um PDF existente
 * URLs assinadas expiram e precisam ser renovadas
 */
export async function gerarURLAssinada(
  path: string,
  expiresIn: number = 31536000 // 1 ano em segundos
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('termos-uso')
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Erro ao gerar URL assinada:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Erro em gerarURLAssinada:', error);
    return null;
  }
}

/**
 * Busca URL pública de um PDF
 * Nota: Bucket é privado, então precisa usar URL assinada
 */
export async function buscarURLPDF(path: string): Promise<string | null> {
  return gerarURLAssinada(path);
}

/**
 * Deleta um PDF do storage (admin only)
 */
export async function deletarPDF(path: string): Promise<boolean> {
  try {
    // Verificar se usuário é admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole.role !== 'admin') {
      throw new Error('Apenas administradores podem deletar PDFs');
    }

    // Deletar arquivo
    const { error } = await supabase.storage
      .from('termos-uso')
      .remove([path]);

    if (error) {
      console.error('Erro ao deletar PDF:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro em deletarPDF:', error);
    return false;
  }
}

/**
 * Lista todos os arquivos no bucket (admin only)
 */
export async function listarArquivos(): Promise<Array<{
  name: string;
  path: string;
  size: number;
  created_at: string;
}>> {
  try {
    // Verificar se usuário é admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole.role !== 'admin') {
      throw new Error('Apenas administradores podem listar arquivos');
    }

    // Listar arquivos recursivamente
    const { data, error } = await supabase.storage
      .from('termos-uso')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Erro ao listar arquivos:', error);
      throw new Error('Não foi possível listar os arquivos');
    }

    return data.map(file => ({
      name: file.name,
      path: file.name,
      size: file.metadata?.size || 0,
      created_at: file.created_at
    }));
  } catch (error) {
    console.error('Erro em listarArquivos:', error);
    throw error;
  }
}

/**
 * Faz download de um PDF
 * Retorna Blob do arquivo para download pelo navegador
 */
export async function downloadPDF(path: string): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage
      .from('termos-uso')
      .download(path);

    if (error) {
      console.error('Erro ao fazer download:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro em downloadPDF:', error);
    return null;
  }
}

/**
 * Verifica se um arquivo existe no storage
 */
export async function arquivoExiste(path: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from('termos-uso')
      .list(path.split('/')[0], {
        limit: 1,
        search: path.split('/')[1]
      });

    if (error) {
      console.error('Erro ao verificar arquivo:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Erro em arquivoExiste:', error);
    return false;
  }
}

/**
 * Copia um PDF para um novo path (útil para duplicar versões)
 */
export async function copiarPDF(
  pathOrigem: string,
  pathDestino: string
): Promise<boolean> {
  try {
    // Verificar se usuário é admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole.role !== 'admin') {
      throw new Error('Apenas administradores podem copiar PDFs');
    }

    // Fazer download do original
    const blob = await downloadPDF(pathOrigem);
    if (!blob) {
      throw new Error('Não foi possível baixar o arquivo original');
    }

    // Fazer upload da cópia
    const { error: uploadError } = await supabase.storage
      .from('termos-uso')
      .upload(pathDestino, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf'
      });

    if (uploadError) {
      console.error('Erro ao copiar arquivo:', uploadError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro em copiarPDF:', error);
    return false;
  }
}
