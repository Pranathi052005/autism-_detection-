export default function ScoreBar({ label, score = 0 }) {
  // Pastel safe colors for children's app instead of harsh alerts
  let colorClass = 'bio-glass bio-glow-teal';
  let textLabel = 'Low Likelihood';
  let badgeColor = 'text-bio-teal bio-glass bio-glow-teal border-bio-teal';

  if (score > 65) {
    colorClass = 'bio-glass bio-glow-rose';
    textLabel = 'High Likelihood';
    badgeColor = 'text-bio-rose bio-glass bio-glow-rose border-bio-rose';
  } else if (score >= 35) {
    colorClass = 'bio-glass bio-glow-amber';
    textLabel = 'Moderate';
    badgeColor = 'text-amber-400 bio-glass bio-glow-amber border-amber-400';
  }

  return (
    <div className="mb-5 group">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[15px] font-display font-bold text-bio-text-secondary group-hover:text-bio-rose transition-colors">{label}</span>
        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${badgeColor} shadow-sm hidden sm:block`}>
            {textLabel}
          </span>
          <span className="text-sm font-body font-semibold text-bio-text-primary w-10 text-right bg-bio-glass-50 px-2 py-0.5 rounded-bio border border-bio-glass-100">{score}%</span>
        </div>
      </div>
      <div className="w-full bg-bio-glass-50/80 rounded-full h-4 overflow-hidden border border-bio-glass-100 shadow-inner relative p-0.5">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass} relative`} 
          style={{ width: `${score}%` }}
        >
          {/* Shine effect inside the bar */}
          <div className="absolute top-0 left-0 w-full h-1/3 bg-bio-glass/30 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
