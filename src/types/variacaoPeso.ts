export interface VariacaoPesoEntrega {
  id: string;
  id_entrega: string;
  id_usuario: string;
  peso_estimado_kg: number;
  peso_validado_kg: number;
  variacao_percentual: number;
  variacao_absoluta_kg: number;
  dentro_margem: boolean;
  fator_pontuacao: number;
  pontos_base: number;
  pontos_aplicados: number;
  observacoes?: string;
  created_at: string;
}

export interface MaterialReciclavel {
  id: string;
  id_usuario: string;
  id_nota_fiscal?: string;
  id_entrega?: string;
  gtin?: string;
  descricao: string;
  tipo_embalagem?: string;
  reciclavel: boolean;
  percentual_reciclabilidade: number;
  quantidade: number;
  peso_unitario_gramas: number | null;
  peso_total_estimado_gramas: number | null;
  origem_cadastro: string;
  status: string;
  pontos_ganhos: number;
  data_cadastro: string;
  data_entrega?: string;
}
