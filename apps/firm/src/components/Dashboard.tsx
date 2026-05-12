interface Props {
  user: any;
  token: string;
  onLogout: () => void;
}

export function Dashboard({ user, token, onLogout }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#08080f', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>QALGO</h1>
        <p>Logged in as {user.name} ({user.email})</p>
        <button onClick={onLogout} style={{ marginTop: '16px', padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </div>
  );
}
