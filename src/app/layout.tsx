import './globals.css';

export const metadata = {
  title: 'Avarias Maia',
  description: 'Plataforma de registo de avarias',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
 return (
  <div
    style={{
      minHeight: '100vh',
      width: '100%',
      backgroundImage: "url('/parque-saude.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
      }}
    />

    <div
      style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255,255,255,0.92)',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '36px', margin: 0, color: '#0369a1' }}>MAIA SAÚDE</h1>
        <p style={{ marginTop: '10px', fontSize: '18px', fontWeight: 600 }}>
          Plataforma de Registo de Avarias
        </p>
        <p style={{ marginTop: '6px', color: '#475569' }}>
          Unidades de Saúde da Maia
        </p>
      </div>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px' }}>Palavra-passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {erro && (
          <div
            style={{
              marginBottom: '16px',
              background: '#fee2e2',
              color: '#b91c1c',
              padding: '10px 12px',
              borderRadius: '10px',
            }}
          >
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {loading ? 'A entrar...' : 'Entrar'}
        </button>
      </form>
    </div>
  </div>
);
