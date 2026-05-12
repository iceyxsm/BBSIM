import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { FeedControls } from '@qalgo/shared';

interface Props {
  token: string;
}

export function FeedControlsPanel({ token }: Props) {
  const [controls, setControls] = useState<FeedControls | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/feed-controls', token).then((res) => {
      if (res.success) setControls(res.data.controls);
    });
  }, [token]);

  const update = async (patch: Partial<FeedControls>) => {
    setSaving(true);
    const res = await api.patch('/api/feed-controls', patch, token);
    if (res.success) setControls(res.data);
    setSaving(false);
  };

  const toggle = () => update({ enabled: !controls?.enabled });

  if (!controls) return <div className="panel">Loading controls...</div>;

  return (
    <div className="panel feed-controls">
      <div className="panel-header">
        <h2>Feed Controls</h2>
        <button className={`btn-toggle ${controls.enabled ? 'active' : 'inactive'}`} onClick={toggle}>
          {controls.enabled ? 'ACTIVE' : 'OFF'}
        </button>
      </div>
      <div className="controls-grid">
        <div className="control-item">
          <label>Delay (ms)</label>
          <input
            type="number" min={0} step={50} value={controls.delayMs}
            onChange={(e) => update({ delayMs: Number(e.target.value) })}
            disabled={!controls.enabled}
          />
          <span className="hint">Latency before traders see ticks</span>
        </div>
        <div className="control-item">
          <label>Noise (%)</label>
          <input
            type="number" min={0} max={5} step={0.01} value={controls.noisePercent}
            onChange={(e) => update({ noisePercent: Number(e.target.value) })}
            disabled={!controls.enabled}
          />
          <span className="hint">Random price jitter</span>
        </div>
        <div className="control-item">
          <label>Spread Multiplier</label>
          <input
            type="number" min={0.1} max={10} step={0.1} value={controls.spreadMultiplier}
            onChange={(e) => update({ spreadMultiplier: Number(e.target.value) })}
            disabled={!controls.enabled}
          />
          <span className="hint">1 = normal, 2 = double spread</span>
        </div>
        <div className="control-item">
          <label>Price Offset (%)</label>
          <input
            type="number" min={-5} max={5} step={0.01} value={controls.priceOffsetPercent}
            onChange={(e) => update({ priceOffsetPercent: Number(e.target.value) })}
            disabled={!controls.enabled}
          />
          <span className="hint">Shift all prices up/down</span>
        </div>
        <div className="control-item">
          <label>Throttle (ms)</label>
          <input
            type="number" min={0} step={100} value={controls.throttleMs}
            onChange={(e) => update({ throttleMs: Number(e.target.value) })}
            disabled={!controls.enabled}
          />
          <span className="hint">Min time between ticks per symbol</span>
        </div>
        <div className="control-item">
          <label>Blackout Symbols</label>
          <input
            type="text" value={controls.blackoutSymbols.join(', ')}
            onChange={(e) => update({ blackoutSymbols: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            disabled={!controls.enabled}
            placeholder="BTC-USD, ETH-USD"
          />
          <span className="hint">Comma-separated, hidden from traders</span>
        </div>
      </div>
      {saving && <span className="saving">Saving...</span>}
    </div>
  );
}
