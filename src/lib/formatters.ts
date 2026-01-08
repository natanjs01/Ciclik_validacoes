/**
 * Formata números no padrão brasileiro (pt-BR)
 * Separador de milhar: ponto (.)
 * Separador decimal: vírgula (,)
 * Duas casas decimais por padrão
 */

export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${formatNumber(value, decimals)}%`;
};

export const formatWeight = (value: number, decimals: number = 2): string => {
  return `${formatNumber(value, decimals)} kg`;
};
