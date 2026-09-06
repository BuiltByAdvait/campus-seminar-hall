import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Building2, Star, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { dashboardApi } from '../../api/dashboard.api';
import { format, parseISO } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getAdmin()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg" />
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  const { overall = {}, todayBookings = [], hallUtilization = [], recentActivity = [], bookingTrend = [] } = data || {};

  const trendData = bookingTrend.map((r) => ({
    date: format(parseISO(r.date), 'MMM d'),
    count: r.bookings_count
  }));

  return (
    <div className="page">
      <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1>Admin Dashboard</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>System overview and key metrics</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon={BookOpen} value={overall.total_bookings} label="Total Bookings" colorClass="stat-icon-primary" />
          <StatCard icon={CheckCircle} value={overall.completed} label="Completed" colorClass="stat-icon-success" />
          <StatCard icon={Clock} value={overall.upcoming} label="Upcoming" colorClass="stat-icon-info" />
          <StatCard icon={XCircle} value={overall.cancelled} label="Cancelled" colorClass="stat-icon-error" />
          <StatCard icon={Star} value={overall.avg_rating ? Number(overall.avg_rating).toFixed(1) : '—'} label="Avg Rating" colorClass="stat-icon-warning" />
          <StatCard icon={Users} value={overall.unique_users} label="Active Users" colorClass="stat-icon-primary" />
        </div>

        {/* Booking trend */}
        {trendData.length > 0 && (
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>
              <TrendingUp size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Bookings (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="var(--color-primary)" fill="var(--color-primary-light)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          {/* Today's bookings */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Today's Bookings</h3>
              <Link to="/admin/bookings" style={{ fontSize: 'var(--font-size-sm)' }}>View all →</Link>
            </div>
            {todayBookings.length === 0 ? (
              <p className="text-muted text-sm">No bookings today</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {todayBookings.slice(0, 5).map((b) => (
                  <div key={b.id} style={{
                    padding: 'var(--space-3)', background: 'var(--color-bg)',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)'
                  }}>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{b.event_name}</div>
                    <div className="text-xs text-muted">{b.hall_name} • {format(parseISO(b.start_time), 'h:mm a')} • {b.user_name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hall utilization */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Hall Utilization (30 days)</h3>
              <Link to="/admin/halls" style={{ fontSize: 'var(--font-size-sm)' }}>Manage →</Link>
            </div>
            {hallUtilization.length === 0 ? (
              <p className="text-muted text-sm">No data available</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {hallUtilization.map((h) => (
                  <div key={h.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{h.hall_name}</span>
                      <span className="text-sm text-muted">{h.bookings_count} bookings</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, (h.bookings_count / (Math.max(1, hallUtilization[0]?.bookings_count || 1)) * 100))}%`,
                        background: 'var(--color-primary)',
                        borderRadius: 'var(--radius-full)'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card" style={{ marginTop: 'var(--space-6)' }}>
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-muted text-sm">No recent activity</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Hall</th>
                    <th>User</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>{r.event_name}</td>
                      <td>{r.hall_name}</td>
                      <td>{r.user_name}</td>
                      <td>{format(parseISO(r.start_time), 'MMM d, h:mm a')}</td>
                      <td><span className={`badge badge-${r.status_code === 'COMPLETED' ? 'primary' : r.status_code === 'CONFIRMED' ? 'success' : r.status_code === 'CANCELLED' ? 'error' : 'secondary'}`}>{r.status_label}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
