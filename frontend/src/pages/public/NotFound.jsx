import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-6)', background: 'var(--color-bg)'
    }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: 420, width: '100%' }}>
        <div style={{
          width: 64, height: 64, background: 'var(--color-warning-light)',
          color: 'var(--color-warning)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--space-4)'
        }}>
          <AlertCircle size={32} />
        </div>
        <h1 style={{ marginBottom: 'var(--space-2)' }}>404</h1>
        <h2 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-xl)' }}>Page Not Found</h2>
        <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary">
          <Home size={16} /> Back to Home
        </Link>
      </div>
    </div>
  );
}
