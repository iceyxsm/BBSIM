interface Props {
  stats: any;
}

export function RiskOverview({ stats }: Props) {
  if (!stats) return <div className="panel">Loading...</div>;

  return (
    <div className="panel risk-overview">
      <h2>Risk Overview</h2>
      <div className="risk-grid">
        <div className="risk-card">
          <span className="risk-label">Open Positions</span>
          <span className="risk-value">{stats.total_positions}</span>
        </div>
        <div className="risk-card">
          <span className="risk-label">Total Exposure</span>
          <span className="risk-value">${Number(stats.total_exposure).toLocaleString()}</span>
        </div>
        <div className="risk-card">
          <span className="risk-label">Unrealized P&L</span>
          <span className={`risk-value ${stats.total_unrealized >= 0 ? 'profit' : 'loss'}`}>
            {stats.total_unrealized >= 0 ? '+' : ''}${Number(stats.total_unrealized).toFixed(2)}
          </span>
        </div>
        <div className="risk-card">
          <span className="risk-label">Realized P&L</span>
          <span className={`risk-value ${stats.total_realized >= 0 ? 'profit' : 'loss'}`}>
            {stats.total_realized >= 0 ? '+' : ''}${Number(stats.total_realized).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
