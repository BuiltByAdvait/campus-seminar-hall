import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, LogIn, LogOut, MapPin, Clock } from 'lucide-react';
import { checkInOutApi, bookingsApi } from '../../api/bookings.api';
import { useToast } from '../../components/common/Toast';
import { format, parseISO, differenceInMinutes } from 'date-fns';

export default function CheckInOut() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [booking, setBooking] = useState(null);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    Promise.all([
      bookingsApi.getById(id).catch(() => null),
      checkInOutApi.getByBooking(id).catch(() => null)
    ]).then(([b, r]) => {
      setBooking(b);
      setRecord(r);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleCheckIn = async () => {
    setSubmitting(true);
    try {
      const res = await checkInOutApi.checkIn(id, { notes });
      setRecord(res.data?.data?.record || res.data?.record || res.data);
      addToast('Checked in successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Check-in failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setSubmitting(true);
    try {
      const res = await checkInOutApi.checkOut(id, { notes });
      setRecord(res.data?.data?.record || res.data?.record || res.data);
      addToast('Checked out successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Check-out failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner spinner-lg" /></div>;
  }

  if (!booking) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>Booking not found</h3>
          <Link to="/bookings" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Back</Link>
        </div>
      </div>
    );
  }

  const startTime = parseISO(booking.start_time);
  const endTime = parseISO(booking.end_time);
  const now = new Date();
  const minutesToStart = differenceInMinutes(startTime, now);
  const isCheckedIn = record?.check_in_time;
  const isCheckedOut = record?.check_out_time;
  const canCheckIn = !isCheckedIn && booking.status_code !== 'CANCELLED';
  const canCheckOut = isCheckedIn && !isCheckedOut;

  return (
    <div className="page">
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Link to={`/bookings/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-6)', color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={16} /> Back to Booking
        </Link>

        <div className="card">
          <h1 style={{ marginBottom: 'var(--space-2)' }}>{booking.event_name}</h1>
          <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>{booking.hall_name}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <div>
              <div className="text-xs text-muted">Date</div>
              <div style={{ fontWeight: 500 }}>{format(startTime, 'MMM d, yyyy')}</div>
            </div>
            <div>
              <div className="text-xs text-muted">Time</div>
              <div style={{ fontWeight: 500 }}>{format(startTime, 'h:mm a')} – {format(endTime, 'h:mm a')}</div>
            </div>
          </div>

          <div className="divider" />

          {/* Timeline */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Check-in Status</h3>
            <div className="timeline">
              <div className="timeline-slot booked">
                <div style={{ marginLeft: 'var(--space-2)' }}>
                  <div style={{ fontWeight: 600 }}>Booking Confirmed</div>
                  <div className="text-sm text-muted">
                    <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {format(startTime, 'MMM d, h:mm a')}
                  </div>
                </div>
              </div>
              <div className={`timeline-slot ${isCheckedIn ? 'booked' : 'available'}`}>
                <div style={{ marginLeft: 'var(--space-2)' }}>
                  <div style={{ fontWeight: 600 }}>{isCheckedIn ? 'Checked In' : 'Awaiting Check-in'}</div>
                  {isCheckedIn ? (
                    <div className="text-sm text-muted">
                      <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      {format(parseISO(record.check_in_time), 'MMM d, h:mm a')}
                    </div>
                  ) : (
                    <div className="text-sm text-muted">
                      {minutesToStart > 0 ? `Starts in ${minutesToStart} min` : 'Booking in progress'}
                    </div>
                  )}
                </div>
              </div>
              <div className={`timeline-slot ${isCheckedOut ? 'booked' : isCheckedIn ? 'available' : 'available'}`}>
                <div style={{ marginLeft: 'var(--space-2)' }}>
                  <div style={{ fontWeight: 600 }}>{isCheckedOut ? 'Checked Out' : 'Check-out'}</div>
                  {isCheckedOut ? (
                    <div className="text-sm text-muted">
                      <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      {format(parseISO(record.check_out_time), 'MMM d, h:mm a')}
                    </div>
                  ) : (
                    <div className="text-sm text-muted">Ends at {format(endTime, 'h:mm a')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any notes for this check-in/out..."
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            {canCheckIn && (
              <button onClick={handleCheckIn} className="btn btn-success" disabled={submitting}>
                <LogIn size={16} />
                {submitting ? 'Processing...' : 'Check In'}
              </button>
            )}
            {canCheckOut && (
              <button onClick={handleCheckOut} className="btn btn-primary" disabled={submitting}>
                <LogOut size={16} />
                {submitting ? 'Processing...' : 'Check Out'}
              </button>
            )}
            {isCheckedOut && (
              <div className="alert alert-success" style={{ flex: 1, marginBottom: 0 }}>
                <strong>Session complete.</strong> You can now provide feedback.
              </div>
            )}
          </div>

          {isCheckedOut && (
            <button onClick={() => navigate(`/feedback/${id}`)} className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
              Leave Feedback
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
