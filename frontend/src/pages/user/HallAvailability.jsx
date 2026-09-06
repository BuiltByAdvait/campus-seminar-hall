import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, Users, MapPin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { hallsApi } from '../../api/halls.api';
import { bookingsApi } from '../../api/bookings.api';
import { constantsApi } from '../../api/dashboard.api';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { useToast } from '../../components/common/Toast';

const SLOT_DURATION_MINUTES = 30;

// Convert IST HH:MM:SS to minutes since midnight
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Generate time slot labels
function generateSlotLabels(openingTime, closingTime, intervalMinutes = 30) {
  const slots = [];
  const openMins = timeToMinutes(openingTime);
  const closeMins = timeToMinutes(closingTime);

  for (let m = openMins; m < closeMins; m += intervalMinutes) {
    const endM = Math.min(m + intervalMinutes, closeMins);
    const startHour = Math.floor(m / 60);
    const startMin = m % 60;
    const endHour = Math.floor(endM / 60);
    const endMin = endM % 60;

    slots.push({
      label: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
      endLabel: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
      startMinutes: m,
      endMinutes: endM,
      isClosed: false
    });
  }
  return slots;
}

// Check if a booking overlaps with a time range (minutes from midnight in IST)
// CRITICAL: getHours() must use IST (local timezone), not UTC
function bookingOverlaps(booking, slotMinutes, slotDuration, dateStr) {
  if (!booking) return false;

  // Parse the ISO datetime string and interpret it in local IST timezone
  // Since the system is IST (UTC+05:30), new Date(isoString) gives IST time
  const bStartIST = new Date(booking.start_time);
  const bEndIST = new Date(booking.end_time);

  // Format the date in local IST
  const bDate = format(bStartIST, 'yyyy-MM-dd');
  if (bDate !== dateStr) return false;

  // Get IST hours and minutes from the local Date object
  // This gives correct IST values since the system is in IST
  const bStartMins = bStartIST.getHours() * 60 + bStartIST.getMinutes();
  const bEndMins = bEndIST.getHours() * 60 + bEndIST.getMinutes();

  // Overlap: slotStart < bookingEnd AND slotEnd > bookingStart
  return slotMinutes < bEndMins && (slotMinutes + slotDuration) > bStartMins;
}

// Build IST datetime string with +05:30 timezone suffix from date + HH:MM
// MySQL expects: YYYY-MM-DDTHH:mm:ss+05:30
function toISTDateTime(dateStr, timeHHMM) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeHHMM.split(':').map(Number);
  // Create a Date in local (IST) context — this is the IST time we want to represent
  const d = new Date(year, month - 1, day, hour, minute, 0);
  // Format as ISO but with +05:30 suffix instead of Z (UTC)
  const iso = d.toISOString(); // e.g. "2026-09-10T02:30:00.000Z"
  // Replace Z with +05:30 so MySQL (connection timezone +05:30) interprets correctly
  return iso.replace('Z', '+05:30');
}

export default function HallAvailability() {
  const { hallId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const startBook = searchParams.get('book') === '1';
  const { addToast } = useToast();

  const [hall, setHall] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null); // { start, end } in HH:MM
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [constants, setConstants] = useState({ eventTypes: [] });

  // Booking form state
  const [showForm, setShowForm] = useState(startBook);
  const [form, setForm] = useState({
    eventName: '',
    eventTypeId: '',
    description: '',
    expectedAttendees: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Load constants (event types) once
  useEffect(() => {
    constantsApi.getAll()
      .then((data) => setConstants({ eventTypes: data.eventTypes || [] }))
      .catch(() => {});
  }, []);

  async function loadSlots(date) {
    setLoading(true);
    setSelectedSlot(null);
    setShowForm(false);
    const dateStr = format(date, 'yyyy-MM-dd');
    try {
      const data = await hallsApi.getAvailability(hallId, dateStr);
      setHall(data.hall || data);
      const bks = data.bookings || [];
      setBookings(bks);

      // Generate slot grid from operating hours
      const openTime = (data.hall?.openingTime || data.hall?.opening_time || '08:00:00').substring(0, 5);
      const closeTime = (data.hall?.closingTime || data.hall?.closing_time || '20:00:00').substring(0, 5);
      const generatedSlots = generateSlotLabels(openTime, closeTime, SLOT_DURATION_MINUTES);

      // Mark slots as booked if they overlap with a booking
      const markedSlots = generatedSlots.map((slot) => {
        const isBooked = bks.some((b) => bookingOverlaps(b, slot.startMinutes, SLOT_DURATION_MINUTES, dateStr));
        const booking = bks.find((b) => bookingOverlaps(b, slot.startMinutes, SLOT_DURATION_MINUTES, dateStr));
        return { ...slot, isBooked, booking };
      });

      setSlots(markedSlots);
    } catch (err) {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlots(selectedDate);
  }, [hallId]);

  const goToPrevDay = () => {
    const d = subDays(selectedDate, 1);
    setSelectedDate(d);
    loadSlots(d);
  };

  const goToNextDay = () => {
    const d = addDays(selectedDate, 1);
    setSelectedDate(d);
    loadSlots(d);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      addToast('Please select a time slot first', 'error');
      return;
    }
    if (!form.eventName.trim()) {
      addToast('Event name is required', 'error');
      return;
    }
    if (!form.eventTypeId) {
      addToast('Please select an event type', 'error');
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const attendees = parseInt(form.expectedAttendees, 10) || 0;
    if (hall && attendees > hall.capacity) {
      addToast(`Attendees (${attendees}) exceeds hall capacity (${hall.capacity})`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      await bookingsApi.create({
        hallId: parseInt(hallId, 10),
        eventName: form.eventName.trim(),
        eventTypeId: parseInt(form.eventTypeId, 10),
        eventDescription: form.description.trim() || undefined,
        expectedAttendees: attendees,
        startTime: toISTDateTime(dateStr, selectedSlot.start),
        endTime: toISTDateTime(dateStr, selectedSlot.end)
      });
      addToast('Booking created successfully!', 'success');
      navigate('/bookings');
    } catch (err) {
      addToast(err.response?.data?.error || 'Booking failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !hall) {
    return <div className="loading-container"><div className="spinner spinner-lg" /></div>;
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Link to="/book" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-6)', color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={16} /> Back to Halls
        </Link>

        {/* Hall info */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{
              width: 56, height: 56, background: 'var(--color-primary-light)',
              color: 'var(--color-primary)', borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Building2 size={28} />
            </div>
            <div>
              <h1 style={{ marginBottom: 2 }}>{hall?.name || `Hall #${hallId}`}</h1>
              <div className="text-muted" style={{ display: 'flex', gap: 'var(--space-4)' }}>
                {hall?.location && <span><MapPin size={12} style={{ marginRight: 4 }} />{hall.location}</span>}
                {hall?.capacity && <span><Users size={12} style={{ marginRight: 4 }} />Capacity: {hall.capacity}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Date navigation */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <button onClick={goToPrevDay} className="btn btn-ghost"><ChevronLeft size={20} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} className="text-muted" />
              <strong>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</strong>
            </div>
            <button onClick={goToNextDay} className="btn btn-ghost"><ChevronRight size={20} /></button>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-sm)' }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--color-success)' }} />
              Available
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-sm)' }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--color-error)' }} />
              Booked
            </div>
          </div>

          {/* Time slots — 30-minute grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <div className="spinner" />
            </div>
          ) : slots.length === 0 ? (
            <div className="empty-state"><p>No schedule data for this date</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 }}>
              {slots.map((slot, idx) => {
                const isSelected = selectedSlot &&
                  selectedSlot.start === slot.label &&
                  selectedSlot.end === slot.endLabel;
                const isClickable = !slot.isBooked;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isClickable) {
                        setSelectedSlot({ start: slot.label, end: slot.endLabel });
                        setShowForm(true);
                      }
                    }}
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected
                        ? 'var(--color-primary-light)'
                        : slot.isBooked
                        ? 'var(--color-error-light)'
                        : 'var(--color-success-light)',
                      border: `2px solid ${
                        isSelected ? 'var(--color-primary)' : slot.isBooked ? 'var(--color-error)' : 'var(--color-success)'
                      }`,
                      cursor: isClickable ? 'pointer' : 'not-allowed',
                      opacity: isClickable ? 1 : 0.7,
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: 1 }}>
                      {slot.label}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      – {slot.endLabel}
                    </div>
                    {slot.isBooked && slot.booking?.event_name && (
                      <div style={{ fontSize: 'var(--font-size-xs)', marginTop: 2, color: 'var(--color-error)', fontWeight: 500 }}>
                        {slot.booking.event_name.length > 18
                          ? slot.booking.event_name.substring(0, 18) + '…'
                          : slot.booking.event_name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Booking form */}
          {showForm && selectedSlot && (
            <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
              <h4 style={{ marginBottom: 'var(--space-4)' }}>
                Book {selectedSlot.label} – {selectedSlot.end} on {format(selectedDate, 'MMM d')}
              </h4>
              <form onSubmit={handleBook}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label">Event Name *</label>
                    <input
                      className="form-input"
                      value={form.eventName}
                      onChange={(e) => setForm({ ...form, eventName: e.target.value })}
                      placeholder="e.g. Department Seminar"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Event Type *</label>
                    <select
                      className="form-input"
                      value={form.eventTypeId}
                      onChange={(e) => setForm({ ...form, eventTypeId: e.target.value })}
                      required
                    >
                      <option value="">Select type...</option>
                      {constants.eventTypes.map((et) => (
                        <option key={et.id} value={et.id}>{et.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Expected Attendees
                      {hall?.capacity && <span className="form-hint"> (max {hall.capacity})</span>}
                    </label>
                    <input
                      className="form-input"
                      type="number"
                      min={0}
                      max={hall?.capacity || 10000}
                      value={form.expectedAttendees}
                      onChange={(e) => setForm({ ...form, expectedAttendees: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <textarea
                    className="form-input"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of the event..."
                    rows={2}
                  />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Booking...' : 'Confirm Booking'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setSelectedSlot(null); }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
