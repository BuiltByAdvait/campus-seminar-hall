import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, BookOpen, CheckCircle, Clock, Star, ArrowRight, Building2 } from 'lucide-react';
import { dashboardApi } from '../../api/dashboard.api';
import { authStore } from '../../store/authStore';
import { format, parseISO } from 'date-fns';

function StatCard({ icon: Icon, value, label, colorClass }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${colorClass}`}><Icon size={22} /></div>
      <div>
        <div className="stat-value">{value ?? 0}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function BookingRow({ booking }) {
  const statusClass = {
    CONFIRMED: 'badge-success',
    PENDING: 'badge-warning',
    COMPLETED: 'badge-primary',
    CANCELLED: 'badge-error',
    IN_PROGRESS: 'badge-info'
  }[booking.status_code] || 'badge-secondary';

  return (
    <div className="booking-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="booking-event">{booking.event_name}</div>
          <div className="booking-meta" style={{ marginTop: 4 }}>
            <span><Building2 size={12} /> {booking.hall_name}</span>
            <span><Clock size={12} /> {format(parseISO(booking.start_time), 'MMM d, h:mm a')}</span>
          </div>
        </div>
        <span className={`badge ${statusClass}`}>{booking.status_label}</span>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = authStore.getUser();

  useEffect(() => {
    dashboardApi.getUser()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const { stats, todayBookings = [], upcomingBookings = [] } = data || {};

  return (
    <div className="page">
      <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1>Welcome back, {user?.full_name?.split(' ')[0] || 'User'} 👋</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>
            Here's an overview of your bookings
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon={BookOpen} value={stats?.total_bookings} label="Total Bookings" colorClass="stat-icon-primary" />
          <StatCard icon={Calendar} value={stats?.upcoming} label="Upcoming" colorClass="stat-icon-success" />
          <StatCard icon={CheckCircle} value={stats?.completed} label="Completed" colorClass="stat-icon-info" />
          <StatCard icon={Star} value={stats?.avg_rating ? Number(stats.avg_rating).toFixed(1) : '—'} label="Avg Rating" colorClass="stat-icon-warning" />
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <Link to="/book" className="btn btn-primary btn-lg">
            <Calendar size={18} /> Book a Hall
          </Link>
          <Link to="/bookings" className="btn btn-secondary btn-lg">
            <BookOpen size={18} /> My Bookings
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          {/* Today's bookings */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Today's Bookings</h3>
              {todayBookings.length > 0 && (
                <Link to="/bookings" style={{ fontSize: 'var(--font-size-sm)' }}>
                  View all <ArrowRight size={14} />
                </Link>
              )}
            </div>
            {todayBookings.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <Calendar size={40} />
                <p>No bookings for today</p>
              </div>
            ) : (
              todayBookings.map((b) => <BookingRow key={b.id} booking={b} />)
            )}
          </div>

          {/* Upcoming bookings */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Upcoming</h3>
              {upcomingBookings.length > 0 && (
                <Link to="/bookings" style={{ fontSize: 'var(--font-size-sm)' }}>
                  View all <ArrowRight size={14} />
                </Link>
              )}
            </div>
            {upcomingBookings.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <Clock size={40} />
                <p>No upcoming bookings</p>
                <Link to="/book" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-4)' }}>
                  Book now
                </Link>
              </div>
            ) : (
              upcomingBookings.map((b) => <BookingRow key={b.id} booking={b} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
