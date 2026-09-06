import { Construction } from 'lucide-react';

export default function PlaceholderPage({ title, subtitle }) {
  return (
    <div className="page">
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{
            width: 64, height: 64, background: 'var(--color-warning-light)',
            color: 'var(--color-warning)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-4)'
          }}>
            <Construction size={32} />
          </div>
          <h2 style={{ marginBottom: 8 }}>{title}</h2>
          <p className="text-muted">{subtitle || 'This page is coming soon.'}</p>
        </div>
      </div>
    </div>
  );
}
