import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import api from '../../api/client';

export default function ManageInstitutes() {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/institutes')
      .then((r) => setInstitutes(r.data.data?.institutes || []))
      .catch(() => setInstitutes([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-container"><div className="spinner spinner-lg" /></div>;
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1>Manage Institutes</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>Campus institutes that book halls</p>
        </div>

        {institutes.length === 0 ? (
          <div className="empty-state card"><Building2 size={48} /><h3>No institutes found</h3></div>
        ) : (
          <div className="grid grid-cols-3" style={{ gap: 'var(--space-4)' }}>
            {institutes.map((i) => (
              <div key={i.id} className="card">
                <h4 style={{ marginBottom: 4 }}>{i.name}</h4>
                {i.code && <p className="text-sm text-muted">{i.code}</p>}
                {i.address && <p className="text-sm text-muted" style={{ marginTop: 4 }}>{i.address}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
