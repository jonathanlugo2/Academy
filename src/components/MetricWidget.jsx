import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function MetricWidget({ label, value, trend, trendValue }) {
  const renderTrendIcon = () => {
    if (trend === 'up') return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 mr-1" />;
    if (trend === 'down') return <ArrowDownRight className="w-3.5 h-3.5 text-red-500 dark:text-red-400 mr-1" />;
    return <Minus className="w-3.5 h-3.5 text-text-muted mr-1" />;
  };

  const trendColor = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-text-muted'
  }[trend || 'neutral'];

  return (
    <div className="metric-widget relative overflow-hidden group">
      {/* High-tech corner cut/accent */}
      <div className="absolute top-0 right-0 w-12 h-12 bg-bg-active border-l border-b border-border-active rounded-bl-xl -mr-4 -mt-4 transition-all group-hover:scale-110 duration-300"></div>
      
      <span className="metric-label font-mono">{label}</span>
      <div className="flex items-end justify-between mt-2 font-mono">
        <span className="metric-value text-shadow-sm">{value}</span>
        {trendValue && (
          <div className="flex items-center text-xs">
            {renderTrendIcon()}
            <span className={`${trendColor} font-bold`}>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}
