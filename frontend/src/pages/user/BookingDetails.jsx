import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, Clock, User, MessageSquare, X, Star } from 'lucide-react';
import { bookingsApi, feedbackApi } from '../../api/bookings.api';
import { authStore } from '../../store/authStore';
import { useToast } from '../../components/common/Toast';
import { format, parseISO, differenceInMinutes, isPast } from 'date-fns';

function statusBadge(code) {
  const map = {
    CONFIRMED: 'badge-success', PENDING: 'badge-warning',
    COMPLETED: 'badge-primary', CANCELLED: 'badge-error', IN_PROGRESS: 'badge-info'
  };
  return map[code] || 'badge-secondary';
}

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const isAdmin = authStore.isAdmin();

  const [booking, setBooking] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    Promise.all([
      bookingsApi.getById(id).catch(() => null),
      feedbackApi.getByBooking(id).catch(() => null)
    ]).then(([b, f]) => {
      setBooking(b);
      setFeedback(f);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      addToast('Please provide a cancellation reason', 'error');
      return;
    }
    setCancelling(true);
    try {
      await bookingsApi.cancel(id, { reasonText: cancelReason });
      addToast('Booking cancelled', 'success');
      navigate('/bookings');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to cancel', 'error');
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg" />
        <p>Loading booking...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>Booking not found</h3>
          <Link to="/bookings" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Back to Bookings</Link>
        </div>
      </div>
    );
  }

  const startTime = booking.start_time ? parseISO(booking.start_time) : null;
  const endTime = booking.end_time ? parseISO(booking.end_time) : null;
  const canCancel = ['CONFIRMED', 'PENDING'].includes(booking.status_code) &&
    startTime && differenceInMinutes(startTime, new Date()) > 30;
  const canCheckIn = startTime && !isPast(startTime) && ['CONFIRMED', 'PENDING'].includes(booking.status_code);
  const canFeedback = booking.status_code === 'COMPLETED' && !feedback;

  return (
    <div className="page">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Back */}
        <Link to="/bookings" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-6)', color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={16} /> Back to Bookings
        </Link>

        {/* Header */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
            <div>
              <h1 style={{ marginBottom: 4 }}>{booking.event_name}</h1>
              <p className="text-muted">{booking.event_type_label}</p>
            </div>
            <span className={`badge ${statusBadge(booking.status_code)}`} style={{ fontSize: 'var(--font-size-sm)', padding: '6px 12px' }}>
              {booking.status_label || booking.status_code}
            </span>
          </div>

          <div className="divider" />

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <div className="text-xs text-muted" style={{ marginBottom: 2 }}>Hall</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={16} className="text-muted" />
                <span>{booking.hall_name || `Hall #${booking.hall_id}`}</span>
              </div>
              {booking.hall_location && <div className="text-sm text-muted" style={{ marginLeft: 22 }}>{booking.hall_location}</div>}
            </div>
            <div>
              <div className="text-xs text-muted" style={{ marginBottom: 2 }}>Booked by</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={16} className="text-muted" />
                <span>{booking.user_name || booking.full_name || '—'}</span>
              </div>
              {booking.user_email && <div className="text-sm text-muted" style={{ marginLeft: 22 }}>{booking.user_email}</div>}
            </div>
            <div>
              <div className="text-xs text-muted" style={{ marginBottom: 2 }}>Date</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={16} className="text-muted" />
                <span>{startTime ? format(startTime, 'EEEE, MMM d, yyyy') : '—'}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted" style={{ marginBottom: 2 }}>Time</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={16} className="text-muted" />
                <span>
                  {startTime ? format(startTime, 'h:mm a') : '—'} – {endTime ? format(endTime, 'h:mm a') : '—'}
                </span>
              </div>
              <div className="text-sm text-muted" style={{ marginLeft: 22 }}>
                Duration: {booking.duration_minutes ? `${booking.duration_minutes} min` : '—'}
              </div>
            </div>
          </div>

          {booking.description && (
            <>
              <div className="divider" />
              <div>
                <div className="text-xs text-muted" style={{ marginBottom: 4 }}>Description</div>
                <p style={{ color: 'var(--color-text-secondary)' }}>{booking.description}</p>
              </div>
            </>
          )}

          {booking.cancellation_reason && (
            <>
              <div className="divider" />
              <div className="alert alert-error">
                <strong>Cancelled:</strong> {booking.cancellation_reason}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {canCheckIn && (
            <Link to={`/checkin/${booking.id}`} className="btn btn-success btn-lg">
              Check In
            </Link>
          )}
          {canFeedback && (
            <Link to={`/feedback/${booking.id}`} className="btn btn-primary btn-lg">
              <Star size={16} /> Give Feedback
            </Link>
          )}
          {canCancel && (
            <button onClick={() => setShowCancelModal(true)} className="btn btn-danger btn-lg">
              <X size={16} /> Cancel Booking
            </button>
          )}
        </div>

        {/* Feedback */}
        {feedback && (
          <div className="card" style={{ marginTop: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Your Feedback</h3>
            <div className="star-rating" style={{ justifyContent: 'flex-start', marginBottom: 'var(--space-3)' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={20} className={s <= (feedback.overall_rating || 0) ? 'star filled' : 'star'} />
              ))}
            </div>
            {feedback.comment && <p className="text-secondary">{feedback.comment}</p>}
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cancel Booking</h3>
              <button onClick={() => setShowCancelModal(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-4)' }}>
              Are you sure you want to cancel <strong>{booking.event_name}</strong>? This action cannot be undone.
            </p>
            <div className="form-group">
              <label className="form-label">Reason for cancellation</label>
              <textarea
                className="form-input"
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason..."
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCancelModal(false)} className="btn btn-secondary">Keep Booking</button>
              <button onClick={handleCancel} className="btn btn-danger" disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
