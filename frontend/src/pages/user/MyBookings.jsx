import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, BookOpen, Filter, X, CheckCircle, XCircle } from 'lucide-react';
import { bookingsApi } from '../../api/bookings.api';
import { format, parseISO, isPast, isToday } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

function statusBadge(code) {
  const map = {
    CONFIRMED: 'badge-success',
    PENDING: 'badge-warning',
    COMPLETED: 'badge-primary',
    CANCELLED: 'badge-error',
    IN_PROGRESS: 'badge-info'
  };
  return map[code] || 'badge-secondary';
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    bookingsApi.getAll({ status: status === 'all' ? undefined : status, page, limit: 10 })
      .then((res) => {
        // API returns { bookings, total, page, limit }
        const list = res.bookings || res || [];
        setBookings(list);
        const total = res.total || 0;
        const lim = res.limit || 10;
        setPagination({
          page: res.page || 1,
          totalPages: Math.ceil(total / lim) || 1
        });
      })
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [status, page]);

  return (
    <div className="page">
      <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1>My Bookings</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>
            View and manage all your hall bookings
          </p>
        </div>

        {/* Filter */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <Filter size={16} className="text-muted" />
            <span className="text-sm font-semibold">Filter by status:</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setStatus(opt.value); setPage(1); }}
                  className={`btn btn-sm ${status === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner spinner-lg" />
            <p>Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state card">
            <BookOpen size={48} />
            <h3>No bookings found</h3>
            <p>You don't have any {status !== 'all' ? status.toLowerCase() : ''} bookings yet.</p>
            <Link to="/book" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
              <Calendar size={16} /> Book a Hall
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Hall</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const startDate = b.start_time ? parseISO(b.start_time) : null;
                  const canCheckIn = startDate && !isPast(startDate) && (b.status_code === 'CONFIRMED' || b.status_code === 'PENDING');
                  return (
                    <tr key={b.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{b.event_name}</div>
                        <div className="text-xs text-muted">{b.event_type_label}</div>
                      </td>
                      <td>
                        <div>{b.hall_name || `Hall #${b.hall_id}`}</div>
                        {b.hall_location && <div className="text-xs text-muted">{b.hall_location}</div>}
                      </td>
                      <td>
                        {startDate ? (
                          <>
                            <div>{format(startDate, 'MMM d, yyyy')}</div>
                            <div className="text-xs text-muted">
                              {format(startDate, 'h:mm a')} – {b.end_time && format(parseISO(b.end_time), 'h:mm a')}
                            </div>
                          </>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={`badge ${statusBadge(b.status_code)}`}>
                          {b.status_label || b.status_code}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link to={`/bookings/${b.id}`} className="btn btn-outline btn-sm">View</Link>
                          {canCheckIn && (
                            <Link to={`/checkin/${b.id}`} className="btn btn-primary btn-sm">Check-in</Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 'var(--space-6)' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="text-sm text-muted" style={{ alignSelf: 'center' }}>
              Page {page} of {pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
