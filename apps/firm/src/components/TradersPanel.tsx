import { useState } from 'react';
import { api } from '../lib/api';

interface Props {
  traders: any[];
  token: string;
  onRefresh: () => void;
}

export function TradersPanel({ traders, token, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/api/auth/register', { name, email, password }, token);
    setShowAdd(false);
    setName(''); setEmail(''); setPassword('');
    onRefresh();
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await api.patch(`/api/traders/${id}`, { isActive: !isActive }, token);
    onRefresh();
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Traders</h2>
        <button className="btn-small" onClick={() => setShowAdd(!showAdd)}>+ Add</button>
      </div>
      {showAdd && (
        <form className="add-form" onSubmit={handleAdd}>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">Create</button>
        </form>
      )}
      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Max Pos</th><th>Max Loss</th><th>Active</th></tr>
        </thead>
        <tbody>
          {traders.map((t: any) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td>{t.email}</td>
              <td>{t.role}</td>
              <td>${Number(t.max_position_size).toLocaleString()}</td>
              <td>${Number(t.max_daily_loss).toLocaleString()}</td>
              <td>
                <button className={`btn-toggle ${t.is_active ? 'active' : 'inactive'}`} onClick={() => toggleActive(t.id, !!t.is_active)}>
                  {t.is_active ? 'ON' : 'OFF'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
