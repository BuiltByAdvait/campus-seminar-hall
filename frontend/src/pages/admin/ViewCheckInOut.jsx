import { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut } from 'lucide-react';
import api from '../../api/client';
import { format, parseISO } from 'date-fns';

export default function ViewCheckInOut() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/check-in-out')
      .then((r) => setRecords(r.data.data?.records || r.data.data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-container"><div className="spinner spinner-lg" /></div>;
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1>Check-in / Check-out Records</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>Monitor hall usage and overstays</p>
        </div>

        {records.length === 0 ? (
          <div className="empty-state card"><Clock size={48} /><h3>No check-in records yet</h3></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>User</th>
                  <th>Hall</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>#{r.booking_id}</td>
                    <td>{r.user_name || '—'}</td>
                    <td>{r.hall_name || '—'}</td>
                    <td>
                      {r.check_in_time ? (
                        <>
                          <LogIn size={11} style={{ marginRight: 4, color: 'var(--color-success)' }} />
                          {format(parseISO(r.check_in_time), 'MMM d, h:mm a')}
                        </>
                      ) : '—'}
                    </td>
                    <td>
                      {r.check_out_time ? (
                        <>
                          <LogOut size={11} style={{ marginRight: 4, color: 'var(--color-info)' }} />
                          {format(parseISO(r.check_out_time), 'MMM d, h:mm a')}
                        </>
                      ) : '—'}
                    </td>
                    <td>
                      {r.check_out_time ? (
                        <span className="badge badge-primary">Completed</span>
                      ) : r.check_in_time ? (
                        <span className="badge badge-warning">In Progress</span>
                      ) : (
                        <span className="badge badge-secondary">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
