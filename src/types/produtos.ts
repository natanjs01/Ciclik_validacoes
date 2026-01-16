export type TipoEmbalagem = 'vidro' | 'plastico' | 'papel' | 'papelao' | 'aluminio' | 'laminado' | 'misto';

export interface ProdutoCiclik {
  id: string;
  gtin: string;
  ncm: string;
  descricao: string;
  marca?: string; // ✅ NOVO - Marca do produto (da API)
  categoria_api?: string; // ✅ NOVO - Categoria original da API
  tipo_embalagem: TipoEmbalagem;
  reciclavel: boolean;
  percentual_reciclabilidade: number;
  peso_medio_gramas: number | null;
  observacoes?: string;
  imagem_url?: string; // ✅ NOVO - URL da imagem do produto
  data_cadastro: string;
  data_atualizacao: string;
}

export interface ItemNotaEnriquecido {
  // Dados da nota
  nome: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  gtin?: string;
  
  // Dados enriquecidos
  produto_cadastrado: boolean;
  produto_ciclik?: ProdutoCiclik;
  
  // Dados de peso
  peso_unitario_gramas?: number;
  peso_total_estimado_gramas?: number;
}

export const TIPOS_EMBALAGEM_LABELS: Record<TipoEmbalagem, string> = {
  vidro: 'Vidro',
  plastico: 'Plástico',
  papel: 'Papel',
  papelao: 'Papelão',
  aluminio: 'Alumínio',
  laminado: 'Laminado',
  misto: 'Misto'
};
