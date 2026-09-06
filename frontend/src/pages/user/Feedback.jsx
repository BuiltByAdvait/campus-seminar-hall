import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, MessageSquare, Send } from 'lucide-react';
import { bookingsApi, feedbackApi } from '../../api/bookings.api';
import { useToast } from '../../components/common/Toast';

export default function Feedback() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [booking, setBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi.getById(id).then(setBooking).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      addToast('Please select a rating', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await feedbackApi.submit(id, { overall_rating: rating, comment });
      addToast('Thank you for your feedback!', 'success');
      navigate('/bookings');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to submit feedback', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner spinner-lg" /></div>;
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Link to="/bookings" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-6)', color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="card">
          <h1 style={{ marginBottom: 'var(--space-2)' }}>Rate Your Experience</h1>
          {booking && (
            <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>
              {booking.event_name} • {booking.hall_name}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Overall Rating *</label>
              <div className="star-rating" style={{ marginTop: 'var(--space-2)' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={36}
                    className={`star ${s <= (hover || rating) ? 'filled' : ''}`}
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    style={{ transition: 'transform 0.15s' }}
                  />
                ))}
              </div>
              <span className="form-hint" style={{ marginTop: 8, display: 'block' }}>
                {rating === 0 ? 'Click a star to rate' : `You rated: ${rating} ${rating === 1 ? 'star' : 'stars'}`}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">
                <MessageSquare size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Comments (optional)
              </label>
              <textarea
                className="form-input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Share your experience with the hall, facilities, etc..."
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting || rating === 0}>
                <Send size={16} />
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
              <Link to="/bookings" className="btn btn-secondary">Skip for now</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
