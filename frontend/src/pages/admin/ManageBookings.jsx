import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Filter, Check, X, AlertCircle } from 'lucide-react';
import { bookingsApi } from '../../api/bookings.api';
import { format, parseISO } from 'date-fns';
import { useToast } from '../../components/common/Toast';

const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REJECTED', label: 'Rejected' }
];

function statusBadge(code) {
  const map = {
    CONFIRMED: 'badge-success',
    PENDING: 'badge-warning',
    IN_PROGRESS: 'badge-info',
    COMPLETED: 'badge-primary',
    CANCELLED: 'badge-error',
    REJECTED: 'badge-error'
  };
  return map[code] || 'badge-secondary';
}

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [actionLoading, setActionLoading] = useState({});
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    setLoading(true);
    bookingsApi.getAll({ status: status === 'all' ? undefined : status, page, limit: 20 })
      .then((res) => {
        const list = res.bookings || res || [];
        setBookings(list);
        const total = res.total || 0;
        const lim = res.limit || 20;
        setPagination({ page: res.page || 1, totalPages: Math.ceil(total / lim) || 1 });
      })
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [status, page]);

  async function handleApprove(booking) {
    if (!confirm(`Approve "${booking.event_name}" by ${booking.user_name}?`)) return;
    setActionLoading(prev => ({ ...prev, [booking.id]: 'approving' }));
    try {
      await bookingsApi.approve(booking.id);
      addToast('Booking approved', 'success');
      // Refresh list
      const res = await bookingsApi.getAll({ status: status === 'all' ? undefined : status, page, limit: 20 });
      setBookings(res.bookings || res || []);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to approve booking', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [booking.id]: null }));
    }
  }

  async function handleReject() {
    if (!rejectModal) return;
    setActionLoading(prev => ({ ...prev, [rejectModal.id]: 'rejecting' }));
    try {
      await bookingsApi.reject(rejectModal.id, rejectNotes);
      addToast('Booking rejected', 'success');
      setRejectModal(null);
      setRejectNotes('');
      const res = await bookingsApi.getAll({ status: status === 'all' ? undefined : status, page, limit: 20 });
      setBookings(res.bookings || res || []);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to reject booking', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [rejectModal.id]: null }));
    }
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1>Manage Bookings</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>All bookings across the system</p>
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <Filter size={16} className="text-muted" />
            <span className="text-sm font-semibold">Status:</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {STATUSES.map((opt) => (
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
          <div className="loading-container"><div className="spinner spinner-lg" /></div>
        ) : bookings.length === 0 ? (
          <div className="empty-state card">
            <BookOpen size={48} />
            <h3>No bookings found</h3>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>User</th>
                  <th>Hall</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const startDate = b.start_time ? parseISO(b.start_time) : null;
                  const isPending = b.status_code === 'PENDING';
                  const isLoading = !!actionLoading[b.id];
                  return (
                    <tr key={b.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{b.event_name}</div>
                        <div className="text-xs text-muted">{b.event_type_label}</div>
                      </td>
                      <td>
                        <div>{b.user_name || '—'}</div>
                        <div className="text-xs text-muted">{b.user_email}</div>
                      </td>
                      <td>
                        <div>{b.hall_name || `Hall #${b.hall_id}`}</div>
                        {b.hall_location && <div className="text-xs text-muted">{b.hall_location}</div>}
                      </td>
                      <td>
                        {startDate ? (
                          <>
                            <div>{format(startDate, 'MMM d, yyyy')}</div>
                            <div className="text-xs text-muted">{format(startDate, 'h:mm a')} – {b.end_time && format(parseISO(b.end_time), 'h:mm a')}</div>
                          </>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={`badge ${statusBadge(b.status_code)}`}>
                          {b.status_label || b.status_code}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Link to={`/bookings/${b.id}`} className="btn btn-outline btn-sm">View</Link>
                          {isPending && (
                            <>
                              <button
                                className="btn btn-sm"
                                style={{ background: 'var(--color-success)', color: 'white', border: 'none' }}
                                onClick={() => handleApprove(b)}
                                disabled={isLoading}
                                title="Approve"
                              >
                                {actionLoading[b.id] === 'approving' ? (
                                  <div className="spinner" style={{ width: 12, height: 12 }} />
                                ) : (
                                  <Check size={12} />
                                )}
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => { setRejectModal(b); setRejectNotes(''); }}
                                disabled={isLoading}
                                title="Reject"
                              >
                                {actionLoading[b.id] === 'rejecting' ? (
                                  <div className="spinner" style={{ width: 12, height: 12 }} />
                                ) : (
                                  <X size={12} />
                                )}
                              </button>
                            </>
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
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span className="text-sm text-muted" style={{ alignSelf: 'center' }}>Page {page} of {pagination.totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page === pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 480, margin: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
                <AlertCircle size={20} style={{ color: 'var(--color-error)' }} />
                <h3 style={{ margin: 0 }}>Reject Booking</h3>
              </div>
              <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-4)' }}>
                Reject <strong>{rejectModal.event_name}</strong> by {rejectModal.user_name}?
              </p>
              <div className="form-group">
                <label className="form-label">Reason / Notes (optional)</label>
                <textarea
                  className="form-input"
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                  placeholder="Reason for rejection..."
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={!!actionLoading[rejectModal.id]}
                >
                  {actionLoading[rejectModal.id] === 'rejecting' ? 'Rejecting...' : 'Reject Booking'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => { setRejectModal(null); setRejectNotes(''); }}
                  disabled={!!actionLoading[rejectModal.id]}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
