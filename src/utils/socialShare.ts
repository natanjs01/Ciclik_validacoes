// Utilitários para compartilhamento social

export type ShareEventType = 
  | 'missao_concluida'
  | 'entrega_validada'
  | 'cupom_resgatado'
  | 'progresso_geral';

export interface ShareData {
  type: ShareEventType;
  // Para missão concluída
  titulo_missao?: string;
  // Para entrega validada
  tipo_material?: string;
  peso_validado?: number;
  // Para cupom resgatado
  valor_cupom?: number;
  // Para progresso geral
  score_verde?: number;
  missoes_concluidas?: number;
  peso_total_entregue?: number;
}

/**
 * Gera o texto de compartilhamento baseado no tipo de conquista
 */
export function gerarTextoCompartilhamento(data: ShareData, nomeUsuario?: string): string {
  const { type } = data;

  switch (type) {
    case 'missao_concluida':
      return `Acabei de completar a missão "${data.titulo_missao}" no app Ciclik – Recicle e Ganhe, com mais de 80% de acerto.
Estou acumulando pontos verdes enquanto aprendo sobre sustentabilidade e consumo consciente.
#Ciclik #Sustentabilidade #EducaçãoAmbiental #RecicleEGanhe`;

    case 'entrega_validada':
      return `Minha última entrega de recicláveis foi validada pela cooperativa parceira da Ciclik:
• Material: ${data.tipo_material}
• Peso validado: ${data.peso_validado?.toFixed(1)} kg
Cada entrega ajuda a fortalecer a reciclagem e a gerar impacto socioambiental real.
#Ciclik #Reciclagem #ImpactoPositivo #RecicleEGanhe`;

    case 'cupom_resgatado':
      return `Acabei de resgatar um cupom de R$ ${data.valor_cupom} no app Ciclik – Recicle e Ganhe, estudando sobre sustentabilidade, enviando notas fiscais e entregando recicláveis.
Aprendo, gero impacto e ainda ganho benefícios.
#Ciclik #ConsumoConsciente #RecompensaVerde #RecicleEGanhe`;

    case 'progresso_geral':
      return `Já acumulei ${data.score_verde} pontos verdes na Ciclik, concluindo ${data.missoes_concluidas} missões e entregando ${data.peso_total_entregue?.toFixed(1)} kg de recicláveis.
Pequenas ações, grandes impactos.
#Ciclik #ESG #MeuImpactoVerde #RecicleEGanhe`;

    default:
      return 'Compartilhando minha conquista no Ciclik – Recicle e Ganhe! #Ciclik #Sustentabilidade';
  }
}

/**
 * Copia texto para área de transferência
 */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (error) {
    console.error('Erro ao copiar texto:', error);
    return false;
  }
}

/**
 * Abre LinkedIn no navegador/app
 */
export function abrirLinkedIn(): void {
  window.open('https://www.linkedin.com', '_blank');
}

/**
 * Abre Instagram no navegador/app
 */
export function abrirInstagram(): void {
  window.open('https://www.instagram.com/accounts/login/', '_blank');
}

/**
 * Gera uma imagem de conquista
 */
export function getImagemConquista(): string {
  return '/ciclik-logo-full.png';
}
