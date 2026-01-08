/**
 * Extrai o primeiro nome de um nome completo
 */
export function getPrimeiroNome(nomeCompleto: string): string {
  if (!nomeCompleto) return '';
  
  const primeiroNome = nomeCompleto.trim().split(' ')[0];
  return primeiroNome;
}

/**
 * Formata o nome para exibição (primeira letra maiúscula)
 */
export function formatarPrimeiroNome(nomeCompleto: string): string {
  const primeiro = getPrimeiroNome(nomeCompleto);
  if (!primeiro) return '';
  
  return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
}
