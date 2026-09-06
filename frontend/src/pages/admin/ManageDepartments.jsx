import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import api from '../../api/client';

export default function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/departments')
      .then((r) => setDepartments(r.data.data?.departments || []))
      .catch(() => setDepartments([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-container"><div className="spinner spinner-lg" /></div>;
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1>Manage Departments</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>Academic departments across institutes</p>
        </div>

        {departments.length === 0 ? (
          <div className="empty-state card"><BookOpen size={48} /><h3>No departments found</h3></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Institute</th>
                  <th>Code</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 500 }}>{d.name}</td>
                    <td>{d.institute_name || '—'}</td>
                    <td>{d.code || '—'}</td>
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
