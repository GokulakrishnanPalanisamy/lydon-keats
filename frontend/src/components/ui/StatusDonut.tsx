export default function StatusDonut({ active, inactive }: { active: number; inactive: number }) {
  const total = active + inactive
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const activeLength = total === 0 ? 0 : (active / total) * circumference

  return (
    <div className="donut-chart">
      <svg viewBox="0 0 100 100" width="120" height="120" role="img" aria-label={`${active} active, ${inactive} inactive`}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border)" strokeWidth="12" />
        {total > 0 && (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#16a34a"
            strokeWidth="12"
            strokeDasharray={`${activeLength} ${circumference - activeLength}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        )}
        <text x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--text-h)">
          {total}
        </text>
      </svg>

      <div className="donut-legend">
        <div className="donut-legend-item">
          <span className="donut-legend-dot" style={{ background: '#16a34a' }} />
          Active ({active})
        </div>
        <div className="donut-legend-item">
          <span className="donut-legend-dot" style={{ background: 'var(--border)' }} />
          Inactive ({inactive})
        </div>
      </div>
    </div>
  )
}
