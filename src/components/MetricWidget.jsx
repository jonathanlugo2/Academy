import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function MetricWidget({ label, value, trend, trendValue }) {
  const renderTrendIcon = () => {
    if (trend === 'up') return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 mr-1" />;
    if (trend === 'down') return <ArrowDownRight className="w-3.5 h-3.5 text-red-400 mr-1" />;
    return <Minus className="w-3.5 h-3.5 text-slate-500 mr-1" />;
  };

  const trendColor = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-slate-500'
  }[trend || 'neutral'];

  return (
    <div className="metric-widget relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-16 h-16 bg-slate-700/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
      <span className="metric-label">{label}</span>
      <div className="flex items-end justify-between mt-2">
        <span className="metric-value">{value}</span>
        {trendValue && (
          <div className="flex items-center text-xs font-mono">
            {renderTrendIcon()}
            <span className={trendColor}>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}
