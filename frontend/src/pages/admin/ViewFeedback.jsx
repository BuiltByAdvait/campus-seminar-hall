import { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import api from '../../api/client';
import { format, parseISO } from 'date-fns';

export default function ViewFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/feedback')
      .then((r) => setFeedback(r.data.data?.feedback || r.data.data || []))
      .catch(() => setFeedback([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-container"><div className="spinner spinner-lg" /></div>;
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1>Feedback</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>All user feedback and ratings</p>
        </div>

        {feedback.length === 0 ? (
          <div className="empty-state card"><MessageSquare size={48} /><h3>No feedback yet</h3></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {feedback.map((f) => (
              <div key={f.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{f.event_name || `Booking #${f.booking_id}`}</div>
                    <div className="text-sm text-muted">{f.hall_name} • {f.user_name}</div>
                  </div>
                  <div className="text-xs text-muted">
                    {f.created_at && format(parseISO(f.created_at), 'MMM d, yyyy')}
                  </div>
                </div>
                <div className="star-rating" style={{ marginBottom: 'var(--space-2)' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={16} className={s <= (f.overall_rating || 0) ? 'star filled' : 'star'} />
                  ))}
                </div>
                {f.comment && <p className="text-sm text-secondary">{f.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
