import { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, BookOpen, Save } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { authStore } from '../../store/authStore';
import { useToast } from '../../components/common/Toast';

export default function Profile() {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '',
    institute_name: '', department_name: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authApi.getProfile()
      .then((user) => {
        setForm({
          full_name: user.full_name || '',
          email: user.email || '',
          phone: user.phone || '',
          institute_name: user.institute_name || user.institute?.name || '',
          department_name: user.department_name || user.department?.name || ''
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateProfile({ full_name: form.full_name, phone: form.phone });
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 'var(--space-8)' }}>My Profile</h1>

        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <div className="avatar avatar-lg" style={{ width: 64, height: 64, fontSize: 'var(--font-size-xl)' }}>
              {form.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h3>{form.full_name}</h3>
              <p className="text-muted">{form.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  type="email"
                  value={form.email}
                  disabled
                />
              </div>
              <span className="form-hint">Email cannot be changed</span>
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">Institute</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    value={form.institute_name}
                    disabled
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <div style={{ position: 'relative' }}>
                  <BookOpen size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    value={form.department_name}
                    disabled
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
