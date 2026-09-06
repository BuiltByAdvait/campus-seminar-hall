import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, ArrowRight, Search, MapPin } from 'lucide-react';
import { hallsApi } from '../../api/halls.api';

export default function BookHall() {
  const navigate = useNavigate();
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, active

  useEffect(() => {
    hallsApi.getAll()
      .then(setHalls)
      .catch(() => setHalls([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = halls.filter((h) => {
    if (filter === 'active' && h.is_active !== 1) return false;
    if (search && !`${h.name || ''} ${h.location || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg" />
        <p>Loading halls...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1>Book a Hall</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>
            Select a seminar hall to view availability and book
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search by name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="form-input" style={{ width: 160 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Halls</option>
            <option value="active">Active Only</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state card">
            <Building2 size={48} />
            <h3>No halls found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-3" style={{ gap: 'var(--space-6)' }}>
            {filtered.map((hall) => (
              <div key={hall.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  width: 48, height: 48,
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 'var(--space-4)'
                }}>
                  <Building2 size={24} />
                </div>
                <h3 style={{ marginBottom: 'var(--space-2)' }}>{hall.name}</h3>
                <div className="text-muted text-sm" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 'var(--space-4)', flex: 1 }}>
                  <span><MapPin size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />{hall.location || 'No location'}</span>
                  <span><Users size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Capacity: {hall.capacity}</span>
                  {hall.facilities && (
                    <span style={{ fontSize: 'var(--font-size-xs)' }}>
                      {Array.isArray(hall.facilities)
                        ? hall.facilities.slice(0, 3).join(', ')
                        : typeof hall.facilities === 'string'
                        ? hall.facilities.split(',').slice(0, 3).join(', ')
                        : 'Amenities available'}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    onClick={() => navigate(`/availability/${hall.id}`)}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                  >
                    Availability
                  </button>
                  <button
                    onClick={() => navigate(`/availability/${hall.id}?book=1`)}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    Book <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
