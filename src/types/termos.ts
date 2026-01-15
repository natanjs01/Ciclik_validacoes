// =====================================================
// TYPES: Sistema de Termos de Uso
// Data: 14/01/2026
// Descrição: Interfaces e tipos TypeScript
// =====================================================

// =====================================================
// ENUMS
// =====================================================

/**
 * Tipos de termos disponíveis no sistema
 */
export enum TipoTermo {
  TERMOS_USO = 'termos_uso',
  POLITICA_PRIVACIDADE = 'politica_privacidade',
  CONTRATO_COOPERADO = 'contrato_cooperado',
  CONTRATO_INVESTIDOR = 'contrato_investidor',
  TERMO_LGPD = 'termo_lgpd',
  OUTROS = 'outros',
}

/**
 * Roles que podem ter termos específicos
 * IMPORTANTE: Devem corresponder exatamente ao enum app_role do banco de dados
 */
export enum RoleUsuario {
  ADMIN = 'admin',
  USUARIO = 'usuario',
  COOPERATIVA = 'cooperativa',
  INVESTIDOR = 'investidor',
}

/**
 * Status do termo
 */
export enum StatusTermo {
  ATIVO = 'ativo',
  INATIVO = 'inativo',
  RASCUNHO = 'rascunho',
}

// =====================================================
// INTERFACES - BANCO DE DADOS
// =====================================================

/**
 * Estrutura da tabela termos_uso
 */
export interface TermoUso {
  id: string;
  tipo: TipoTermo;
  versao: string;
  titulo: string;
  pdf_url: string;
  pdf_path: string;
  conteudo_html: string | null;
  resumo: string | null;
  obrigatorio: boolean;
  roles_aplicaveis: RoleUsuario[] | null;
  ativo: boolean;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
}

/**
 * Estrutura da tabela aceites_termos
 */
export interface AceiteTermo {
  id: string;
  user_id: string;
  termo_id: string;
  tipo_termo: TipoTermo;
  versao_aceita: string;
  ip_aceite: string | null;
  user_agent: string | null;
  aceito_em: string;
}

// =====================================================
// INTERFACES - FORMULÁRIOS
// =====================================================

/**
 * Dados para criar/editar um termo (Admin)
 */
export interface FormTermoAdmin {
  tipo: TipoTermo;
  versao: string;
  titulo: string;
  arquivoPdf?: File;
  pdf_url?: string;
  pdf_path?: string;
  conteudo_html?: string;
  resumo?: string;
  obrigatorio: boolean;
  roles_aplicaveis: RoleUsuario[] | null;
  ativar_imediatamente: boolean;
}

/**
 * Dados para registrar aceite de termo
 */
export interface DadosAceite {
  termo_id: string;
  tipo_termo: TipoTermo;
  versao_aceita: string;
  ip_aceite?: string;
  user_agent?: string;
}

// =====================================================
// INTERFACES - EXIBIÇÃO
// =====================================================

/**
 * Termo formatado para exibição no modal
 */
export interface TermoParaExibicao {
  id: string;
  tipo: TipoTermo;
  tipoLabel: string;
  versao: string;
  titulo: string;
  pdf_url: string;
  conteudo_html: string | null;
  resumo: string | null;
  obrigatorio: boolean;
  aceito: boolean;
}

/**
 * Lista de termos pendentes de aceite
 */
export interface TermosPendentes {
  termos: TermoParaExibicao[];
  total: number;
  todos_aceitos: boolean;
}

// =====================================================
// INTERFACES - ADMIN
// =====================================================

/**
 * Estatísticas de aceites de um termo
 */
export interface EstatisticasAceite {
  total_usuarios: number;
  total_aceites: number;
  percentual_aceites: number;
  pendentes: number;
}

/**
 * Termo com estatísticas para listagem admin
 */
export interface TermoComEstatisticas extends TermoUso {
  estatisticas: EstatisticasAceite;
}

/**
 * Histórico de versões de um tipo de termo
 */
export interface HistoricoVersoes {
  tipo: TipoTermo;
  versoes: Array<{
    versao: string;
    titulo: string;
    ativo: boolean;
    criado_em: string;
    total_aceites: number;
  }>;
}

/**
 * Relatório de aceites para export
 */
export interface RelatorioAceite {
  usuario_id: string;
  usuario_nome: string;
  usuario_email: string;
  usuario_role: RoleUsuario;
  termo_tipo: TipoTermo;
  termo_versao: string;
  termo_titulo: string;
  aceito_em: string;
  ip_aceite: string | null;
}

// =====================================================
// INTERFACES - CRUD E SERVIÇOS
// =====================================================

/**
 * Dados para criar um novo termo
 */
export interface NovoTermo {
  tipo: TipoTermo;
  versao: string;
  titulo: string;
  descricao?: string;
  conteudo_html?: string;
  pdf_url: string;
  roles_aplicaveis: RoleUsuario[];
  obrigatorio?: boolean;
  ativo?: boolean;
}

/**
 * Dados para atualizar um termo existente
 */
export interface AtualizarTermo {
  titulo?: string;
  descricao?: string;
  conteudo_html?: string;
  pdf_url?: string;
  obrigatorio?: boolean;
  ativo?: boolean;
}

/**
 * Filtros para listagem de termos
 */
export interface FiltroTermos {
  tipo?: TipoTermo;
  ativo?: boolean;
  versao?: string;
  busca?: string;
}

/**
 * Resultado paginado genérico
 */
export interface ResultadoPaginado<T> {
  dados: T[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

// =====================================================
// INTERFACES - UPLOAD
// =====================================================

/**
 * Resultado do upload de PDF
 */
export interface ResultadoUploadPDF {
  success: boolean;
  pdf_path?: string;
  pdf_url?: string;
  error?: string;
}

/**
 * Validação de arquivo PDF
 */
export interface ValidacaoPDF {
  valido: boolean;
  erros: string[];
  tamanho_mb: number;
}

// =====================================================
// INTERFACES - PROPS DE COMPONENTES
// =====================================================

/**
 * Props do modal de termos
 */
export interface TermosModalProps {
  termos: TermoParaExibicao[];
  onAceitar: (termoIds: string[]) => Promise<void>;
  onLogout: () => void;
  loading: boolean;
  open: boolean;
}

/**
 * Props do visualizador de PDF
 */
export interface PDFViewerProps {
  pdfUrl: string;
  titulo: string;
  onDownload?: () => void;
}

/**
 * Props do checkbox de aceite
 */
export interface TermoCheckboxProps {
  termo: TermoParaExibicao;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Props do formulário admin
 */
export interface FormularioTermoProps {
  termo?: TermoUso;
  modo: 'criar' | 'editar';
  onSubmit: (dados: FormTermoAdmin) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

// =====================================================
// TYPES AUXILIARES
// =====================================================

/**
 * Retorno de funções RPC do Supabase
 */
export type BuscarTermosPendentesResponse = Pick<
  TermoUso,
  'id' | 'tipo' | 'versao' | 'titulo' | 'pdf_url' | 'conteudo_html' | 'resumo' | 'obrigatorio'
>[];

export type EstatisticasAceiteResponse = {
  total_usuarios: number;
  total_aceites: number;
  percentual_aceites: number;
  pendentes: number;
}[];

/**
 * Filtros para listagem de termos (Admin)
 */
export interface FiltrosListagemTermos {
  tipo?: TipoTermo;
  status?: 'ativo' | 'inativo' | 'todos';
  role?: RoleUsuario;
  busca?: string;
  ordenar_por?: 'criado_em' | 'titulo' | 'versao' | 'tipo';
  ordem?: 'asc' | 'desc';
}

/**
 * Filtros para relatório de aceites
 */
export interface FiltrosRelatorioAceites {
  termo_id?: string;
  tipo_termo?: TipoTermo;
  data_inicio?: string;
  data_fim?: string;
  role?: RoleUsuario;
  usuario_id?: string;
}

/**
 * Opções de paginação
 */
export interface OpcoesPaginacao {
  pagina: number;
  por_pagina: number;
  total?: number;
}

/**
 * Resposta paginada
 */
export interface RespostaPaginada<T> {
  dados: T[];
  paginacao: {
    pagina_atual: number;
    por_pagina: number;
    total_itens: number;
    total_paginas: number;
  };
}

// =====================================================
// LABELS E CONSTANTES
// =====================================================

/**
 * Labels dos tipos de termos
 */
export const LABELS_TIPO_TERMO: Record<TipoTermo, string> = {
  [TipoTermo.TERMOS_USO]: 'Termos de Uso',
  [TipoTermo.POLITICA_PRIVACIDADE]: 'Política de Privacidade',
  [TipoTermo.CONTRATO_COOPERADO]: 'Contrato de Cooperado',
  [TipoTermo.CONTRATO_INVESTIDOR]: 'Contrato de Investidor',
  [TipoTermo.TERMO_LGPD]: 'Termo LGPD',
  [TipoTermo.OUTROS]: 'Outros',
};

/**
 * Labels das roles
 */
export const LABELS_ROLE: Record<RoleUsuario, string> = {
  [RoleUsuario.ADMIN]: 'Administrador',
  [RoleUsuario.USUARIO]: 'Usuário',
  [RoleUsuario.COOPERATIVA]: 'Cooperativa',
  [RoleUsuario.INVESTIDOR]: 'Investidor',
};

/**
 * Constantes de validação
 */
export const VALIDACAO_TERMOS = {
  TAMANHO_MAX_PDF_MB: 10,
  TAMANHO_MAX_PDF_BYTES: 10 * 1024 * 1024,
  FORMATO_VERSAO_REGEX: /^[0-9]+\.[0-9]+$/,
  PDF_NAME_PATTERN: /^[a-zA-Z0-9_-]+\.pdf$/,
  MIN_LENGTH_TITULO: 5,
  MAX_LENGTH_TITULO: 255,
  MIN_LENGTH_VERSAO: 1,
  MAX_LENGTH_VERSAO: 20,
} as const;

/**
 * Mensagens de erro comuns
 */
export const MENSAGENS_ERRO = {
  PDF_TAMANHO_EXCEDIDO: `Arquivo PDF excede o tamanho máximo de ${VALIDACAO_TERMOS.TAMANHO_MAX_PDF_MB}MB`,
  PDF_FORMATO_INVALIDO: 'Apenas arquivos PDF são permitidos',
  VERSAO_FORMATO_INVALIDO: 'Versão deve estar no formato X.Y (ex: 1.0, 2.1)',
  TITULO_MUITO_CURTO: `Título deve ter no mínimo ${VALIDACAO_TERMOS.MIN_LENGTH_TITULO} caracteres`,
  TERMO_NAO_ENCONTRADO: 'Termo não encontrado',
  ACEITE_JA_REGISTRADO: 'Você já aceitou este termo',
  ERRO_UPLOAD_PDF: 'Erro ao fazer upload do PDF. Tente novamente.',
  ERRO_CARREGAR_TERMOS: 'Erro ao carregar termos. Recarregue a página.',
  ERRO_REGISTRAR_ACEITE: 'Erro ao registrar aceite. Tente novamente.',
} as const;

// =====================================================
// TYPE GUARDS
// =====================================================

/**
 * Verifica se é um tipo de termo válido
 */
export function isTipoTermo(value: string): value is TipoTermo {
  return Object.values(TipoTermo).includes(value as TipoTermo);
}

/**
 * Verifica se é uma role válida
 */
export function isRoleUsuario(value: string): value is RoleUsuario {
  return Object.values(RoleUsuario).includes(value as RoleUsuario);
}

/**
 * Verifica se termo é obrigatório para role
 */
export function isTermoObrigatorioParaRole(
  termo: TermoUso,
  role: RoleUsuario
): boolean {
  // Admin nunca precisa aceitar
  if (role === RoleUsuario.ADMIN) return false;
  
  // Se não é obrigatório, não precisa aceitar
  if (!termo.obrigatorio) return false;
  
  // Se roles_aplicaveis é null, aplica a todos
  if (termo.roles_aplicaveis === null) return true;
  
  // Verifica se role está na lista
  return termo.roles_aplicaveis.includes(role);
}

// =====================================================
// UTILITÁRIOS DE TIPO
// =====================================================

/**
 * Termo sem dados sensíveis (para log)
 */
export type TermoSemSensivel = Omit<TermoUso, 'conteudo_html'>;

/**
 * Aceite sem dados pessoais (para métricas)
 */
export type AceiteSemPessoal = Omit<AceiteTermo, 'user_id' | 'ip_aceite' | 'user_agent'>;

/**
 * Partial profundo (todos campos opcionais recursivamente)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// =====================================================
// EXPORT DEFAULT
// =====================================================

export default {
  TipoTermo,
  RoleUsuario,
  StatusTermo,
  LABELS_TIPO_TERMO,
  LABELS_ROLE,
  VALIDACAO_TERMOS,
  MENSAGENS_ERRO,
};
