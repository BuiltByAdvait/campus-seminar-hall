import { useState } from 'react';
import { BarChart3, Calendar, Download, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { reportsApi } from '../../api/dashboard.api';
import { format, subDays, parseISO } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#4CAF50', '#FF9800', '#F44336', '#2196F3', '#9C27B0', '#607D8B'];

function StatCard({ label, value, icon: Icon, color = 'var(--color-primary)' }) {
  return (
    <div className="card" style={{ padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{
          width: 44, height: 44, background: `${color}20`, borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color
        }}>
          <Icon size={22} />
        </div>
        <div>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color }}>{value ?? 0}</div>
          <div className="text-xs text-muted">{label}</div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h4 style={{ marginBottom: 'var(--space-3)', marginTop: 'var(--space-6)' }}>{children}</h4>;
}

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });

  const generateReport = async () => {
    if (!selectedReport) return;
    setLoading(true);
    setError(null);
    setReportData(null);
    try {
      let data;
      switch (selectedReport) {
        case 'weekly':
          data = await reportsApi.getWeeklyReport(dateRange.from, dateRange.to);
          break;
        case 'monthly':
          data = await reportsApi.getMonthlyReport(format(new Date(), 'yyyy-MM'));
          break;
        case 'cancellations':
          data = await reportsApi.getCancellationReport(dateRange.from, dateRange.to);
          break;
        case 'overstay':
          data = await reportsApi.getOverstayReport(dateRange.from, dateRange.to);
          break;
        default:
          data = null;
      }
      setReportData(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for each report type
  const weeklyDayData = reportData?.dayBreakdown?.map(d => ({
    name: d.day_name?.substring(0, 3),
    bookings: d.bookings_count,
    minutes: d.total_minutes || 0
  })) || [];

  const weeklyHallData = reportData?.hallBreakdown?.map(d => ({
    name: d.hall_name?.length > 12 ? d.hall_name.substring(0, 12) + '…' : d.hall_name,
    bookings: d.bookings_count,
    minutes: d.total_minutes || 0
  })) || [];

  const monthlyHallData = reportData?.hallUtilization?.map(d => ({
    name: d.hall_name?.length > 12 ? d.hall_name.substring(0, 12) + '…' : d.hall_name,
    bookings: d.bookings_count || 0,
    minutes: d.total_minutes || 0,
    rating: d.avg_rating ? parseFloat(d.avg_rating).toFixed(1) : 'N/A'
  })) || [];

  const monthlyInstituteData = reportData?.instituteBreakdown?.map(d => ({
    name: d.institute_name?.length > 15 ? d.institute_name.substring(0, 15) + '…' : d.institute_name,
    bookings: d.bookings_count || 0,
    minutes: d.total_minutes || 0
  })) || [];

  const monthlyStatusData = reportData ? [
    { name: 'Completed', value: reportData.summary?.completed || 0 },
    { name: 'Cancelled', value: reportData.summary?.cancelled || 0 },
    { name: 'In Progress', value: reportData.summary?.in_progress || 0 },
    { name: 'Total', value: reportData.summary?.total_bookings || 0 }
  ] : [];

  const cancellationReasonData = reportData?.reasonBreakdown?.map(d => ({
    name: d.reason || 'Unknown',
    count: d.count
  })) || [];

  const overstayData = reportData?.topOverstays?.map(d => ({
    event: d.event_name?.length > 20 ? d.event_name.substring(0, 20) + '…' : d.event_name,
    hall: d.hall_name,
    user: d.user_name,
    minutes: d.overstay_minutes || 0,
    date: d.start_time ? format(parseISO(d.start_time), 'MMM d') : '—'
  })) || [];

  const isWeekly = selectedReport === 'weekly';
  const isMonthly = selectedReport === 'monthly';
  const isCancellation = selectedReport === 'cancellations';
  const isOverstay = selectedReport === 'overstay';

  return (
    <div className="page">
      <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1>Reports</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>Generate and view system reports</p>
        </div>

        {/* Report type selector */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>
            <BarChart3 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Select Report Type
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            {[
              { id: 'weekly', label: 'Weekly Report', desc: 'All bookings and usage for the past week' },
              { id: 'monthly', label: 'Monthly Report', desc: 'Monthly summary of hall utilization and trends' },
              { id: 'cancellations', label: 'Cancellation Report', desc: 'Analysis of cancelled bookings and reasons' },
              { id: 'overstay', label: 'Overstay Report', desc: 'Bookings where users overstayed their time' }
            ].map((r) => (
              <div
                key={r.id}
                onClick={() => { setSelectedReport(r.id); setReportData(null); setError(null); }}
                style={{
                  padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                  border: `2px solid ${selectedReport === r.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: selectedReport === r.id ? 'var(--color-primary-light)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)'
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.label}</div>
                <p className="text-sm text-muted">{r.desc}</p>
              </div>
            ))}
          </div>

          {selectedReport && (
            <>
              <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">From</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">To</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  />
                </div>
                <button onClick={generateReport} className="btn btn-primary" disabled={loading}>
                  {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <FileText size={16} />}
                  {loading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading-container card"><div className="spinner spinner-lg" /><p>Generating report...</p></div>
        )}

        {/* Error */}
        {error && (
          <div className="card" style={{ background: 'var(--color-error-light)', border: '1px solid var(--color-error)' }}>
            <p style={{ color: 'var(--color-error)', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Report Results */}
        {reportData && !loading && (
          <>
            {/* Weekly Report */}
            {isWeekly && (
              <>
                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                  <StatCard label="Total Bookings" value={reportData.summary?.total_bookings} icon={BookOpen} color="var(--color-primary)" />
                  <StatCard label="Completed" value={reportData.summary?.completed} icon={CheckCircle} color="#4CAF50" />
                  <StatCard label="Cancelled" value={reportData.summary?.cancelled} icon={X} color="#F44336" />
                  <StatCard label="Total Minutes" value={reportData.summary?.total_scheduled_minutes || 0} icon={Clock} color="#FF9800" />
                </div>

                {/* Day-wise chart */}
                {weeklyDayData.length > 0 ? (
                  <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <h4 style={{ marginBottom: 'var(--space-4)' }}>Bookings by Day</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={weeklyDayData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="bookings" fill="#4CAF50" name="Bookings" />
                        <Bar dataKey="minutes" fill="#2196F3" name="Minutes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="card" style={{ marginBottom: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No booking data for this period.
                  </div>
                )}

                {/* Hall-wise chart */}
                {weeklyHallData.length > 0 && (
                  <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <h4 style={{ marginBottom: 'var(--space-4)' }}>Bookings by Hall</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={weeklyHallData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="bookings" fill="#4CAF50" name="Bookings" />
                        <Bar dataKey="minutes" fill="#FF9800" name="Minutes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}

            {/* Monthly Report */}
            {isMonthly && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                  <StatCard label="Total Bookings" value={reportData.summary?.total_bookings} icon={BookOpen} color="var(--color-primary)" />
                  <StatCard label="Unique Users" value={reportData.summary?.unique_users} icon={Users} color="#9C27B0" />
                  <StatCard label="Avg Rating" value={reportData.summary?.avg_rating ? parseFloat(reportData.summary.avg_rating).toFixed(1) : 'N/A'} icon={Star} color="#FF9800" />
                  <StatCard label="Total Minutes" value={reportData.summary?.total_scheduled_minutes || 0} icon={Clock} color="#2196F3" />
                </div>

                {/* Status pie chart */}
                {monthlyStatusData.some(d => d.value > 0) && (
                  <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <h4 style={{ marginBottom: 'var(--space-4)' }}>Booking Status Distribution</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={monthlyStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={90}
                          dataKey="value"
                        >
                          {monthlyStatusData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Hall utilization */}
                {monthlyHallData.length > 0 && (
                  <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <h4 style={{ marginBottom: 'var(--space-4)' }}>Hall Utilization</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={monthlyHallData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="bookings" fill="#4CAF50" name="Bookings" />
                        <Bar dataKey="minutes" fill="#2196F3" name="Minutes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Institute breakdown */}
                {monthlyInstituteData.length > 0 && (
                  <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <h4 style={{ marginBottom: 'var(--space-4)' }}>Bookings by Institute</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={monthlyInstituteData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" fontSize={12} />
                        <YAxis dataKey="name" type="category" width={120} fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="bookings" fill="#9C27B0" name="Bookings" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}

            {/* Cancellation Report */}
            {isCancellation && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                  <StatCard label="Total Cancellations" value={reportData.summary?.total_cancellations} icon={X} color="#F44336" />
                  <StatCard label="With Reason" value={reportData.summary?.with_reason} icon={CheckCircle} color="#4CAF50" />
                  <StatCard label="Without Reason" value={reportData.summary?.without_reason} icon={AlertTriangle} color="#FF9800" />
                </div>

                {cancellationReasonData.length > 0 && (
                  <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <h4 style={{ marginBottom: 'var(--space-4)' }}>Cancellation Reasons</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={cancellationReasonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#F44336" name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {cancellationReasonData.length === 0 && (
                  <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No cancellation data for this period.
                  </div>
                )}
              </>
            )}

            {/* Overstay Report */}
            {isOverstay && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                  <StatCard label="Total Overstays" value={reportData.summary?.total_overstays} icon={Clock} color="#F44336" />
                  <StatCard label="Total Overstay Minutes" value={reportData.summary?.total_overstay_minutes || 0} icon={AlertTriangle} color="#FF9800" />
                  <StatCard label="Avg Overstay (min)" value={reportData.summary?.avg_overstay_minutes ? parseFloat(reportData.summary.avg_overstay_minutes).toFixed(1) : 0} icon={Clock} color="#9C27B0" />
                </div>

                {overstayData.length > 0 ? (
                  <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <h4 style={{ marginBottom: 'var(--space-4)' }}>Top Overstays</h4>
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Event</th>
                            <th>Hall</th>
                            <th>User</th>
                            <th>Date</th>
                            <th>Overstay (min)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overstayData.map((row, i) => (
                            <tr key={i}>
                              <td>{row.event}</td>
                              <td>{row.hall}</td>
                              <td>{row.user}</td>
                              <td>{row.date}</td>
                              <td><span style={{ color: '#F44336', fontWeight: 600 }}>+{row.minutes} min</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No overstay data for this period. 🎉
                  </div>
                )}
              </>
            )}

            {/* Raw JSON fallback */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h4>Raw Data</h4>
              </div>
              <pre style={{
                background: 'var(--color-bg)', padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)', overflow: 'auto',
                fontSize: 'var(--font-size-xs)', maxHeight: 300
              }}>
                {JSON.stringify(reportData, null, 2)}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Missing icon reference fix
function X({ size = 16 }) {
  return <span style={{ display: 'inline-block', width: size, height: size, position: 'relative' }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  </span>;
}

function Users({ size = 16 }) {
  return <span style={{ display: 'inline-block', width: size, height: size }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  </span>;
}

function Star({ size = 16 }) {
  return <span style={{ display: 'inline-block', width: size, height: size }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  </span>;
}
