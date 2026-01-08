import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber, formatCurrency, formatPercentage, formatWeight } from '@/lib/formatters';

interface MetricComparisonProps {
  label: string;
  currentValue: number;
  previousValue?: number;
  format?: 'number' | 'percentage' | 'currency' | 'weight';
  icon?: React.ReactNode;
}

export function MetricComparison({ 
  label, 
  currentValue, 
  previousValue, 
  format = 'number',
  icon 
}: MetricComparisonProps) {
  const formatValue = (value: number) => {
    switch (format) {
      case 'percentage':
        return formatPercentage(value);
      case 'currency':
        return formatCurrency(value);
      case 'weight':
        return formatWeight(value, 0);
      default:
        return formatNumber(value, 0);
    }
  };

  const calculateVariation = () => {
    if (previousValue === undefined || previousValue === 0) return null;
    const variation = ((currentValue - previousValue) / previousValue) * 100;
    return variation;
  };

  const variation = calculateVariation();

  const getVariationColor = () => {
    if (variation === null) return 'text-muted-foreground';
    if (variation > 0) return 'text-success';
    if (variation < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getVariationIcon = () => {
    if (variation === null) return null;
    if (variation > 0) return <TrendingUp className="h-4 w-4" />;
    if (variation < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold">
          {formatValue(currentValue)}
        </div>
        {variation !== null && (
          <div className={cn("flex items-center gap-1 text-sm font-medium", getVariationColor())}>
            {getVariationIcon()}
            <span>{formatPercentage(Math.abs(variation))}</span>
          </div>
        )}
      </div>
      {previousValue !== undefined && (
        <div className="text-xs text-muted-foreground">
          Anterior: {formatValue(previousValue)}
        </div>
      )}
    </div>
  );
}
