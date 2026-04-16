export default function RatingCircle({ label, value = 0, color = '#8b5cf6' }) {
  const pct = (value / 5) * 100;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
          <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="44" cy="44" r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.8s ease-out', filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold font-display text-white">{value > 0 ? value.toFixed(1) : '—'}</span>
          <span className="text-[10px] text-white/40">/5</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">{label}</span>
    </div>
  );
}
