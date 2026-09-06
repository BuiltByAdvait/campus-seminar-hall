import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import api from '../../api/client';
import { format, parseISO } from 'date-fns';

function statusBadge(code) {
  const map = { ACTIVE: 'badge-success', INACTIVE: 'badge-error', SUSPENDED: 'badge-warning' };
  return map[code] || 'badge-secondary';
}

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users')
      .then((r) => setUsers(r.data.data?.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1>Manage Users</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>All registered users in the system</p>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner spinner-lg" /></div>
        ) : users.length === 0 ? (
          <div className="empty-state card"><Users size={48} /><h3>No users found</h3></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Institute</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td><span className="badge badge-secondary">{u.user_type_code || u.user_type?.code || '—'}</span></td>
                    <td>{u.institute_name || u.institute?.name || '—'}</td>
                    <td>{u.created_at ? format(parseISO(u.created_at), 'MMM d, yyyy') : '—'}</td>
                    <td><span className={`badge ${statusBadge(u.status_code || u.status?.code)}`}>{u.status_code || u.status?.code || 'ACTIVE'}</span></td>
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
