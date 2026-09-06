import { useState, useEffect } from 'react';
import { Building2, Users, MapPin, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { hallsApi } from '../../api/halls.api';
import { institutesApi } from '../../api/institutes.api';
import { useToast } from '../../components/common/Toast';

const DEFAULT_FORM = {
  name: '',
  code: '',
  shortName: '',
  description: '',
  capacity: 100,
  location: '',
  floor: '',
  facilities: [],
  openingTime: '08:00:00',
  closingTime: '20:00:00',
  requiresApproval: false,
  instituteId: ''
};

const FACILITY_OPTIONS = [
  'Projector', 'Sound System', 'Whiteboard', 'Laptop Port',
  'Microphone', 'WiFi', 'AC', 'Heating', 'Video Conferencing',
  'Smart Board', 'Podium', 'Chairs', 'Tables'
];

export default function ManageHalls() {
  const [halls, setHalls] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [facilityInput, setFacilityInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [hallsData, institutesData] = await Promise.all([
        hallsApi.getAll(),
        institutesApi.getAll()
      ]);
      setHalls(Array.isArray(hallsData) ? hallsData : []);
      setInstitutes(Array.isArray(institutesData) ? institutesData : []);
    } catch (err) {
      addToast('Failed to load data', 'error');
      setHalls([]);
      setInstitutes([]);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingId(null);
    setForm({ ...DEFAULT_FORM });
    setErrors({});
    setShowForm(true);
  }

  function openEdit(hall) {
    setEditingId(hall.id);
    setForm({
      name: hall.name || '',
      code: hall.code || '',
      shortName: hall.short_name || '',
      description: hall.description || '',
      capacity: hall.capacity || 100,
      location: hall.location || '',
      floor: hall.floor || '',
      facilities: Array.isArray(hall.facilities) ? hall.facilities : [],
      openingTime: hall.opening_time ? hall.opening_time.substring(0, 8) : '08:00:00',
      closingTime: hall.closing_time ? hall.closing_time.substring(0, 8) : '20:00:00',
      requiresApproval: hall.requires_approval || false,
      instituteId: hall.institute_id || ''
    });
    setErrors({});
    setShowForm(true);
  }

  function toggleFacility(facility) {
    setForm(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  }

  function addCustomFacility() {
    const trimmed = facilityInput.trim();
    if (trimmed && !form.facilities.includes(trimmed)) {
      setForm(prev => ({ ...prev, facilities: [...prev.facilities, trimmed] }));
    }
    setFacilityInput('');
  }

  function validateForm() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.code.trim()) errs.code = 'Code is required';
    else if (!/^[A-Z0-9_]+$/.test(form.code)) errs.code = 'Code must be uppercase letters, numbers, and underscores only';
    if (!form.instituteId) errs.instituteId = 'Institute is required';
    if (!form.capacity || form.capacity < 1) errs.capacity = 'Capacity must be at least 1';
    if (!form.openingTime) errs.openingTime = 'Opening time is required';
    if (!form.closingTime) errs.closingTime = 'Closing time is required';
    if (form.openingTime >= form.closingTime) errs.openingTime = 'Opening time must be before closing time';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setErrors({});

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      shortName: form.shortName.trim() || undefined,
      description: form.description.trim() || undefined,
      capacity: parseInt(form.capacity, 10),
      location: form.location.trim() || undefined,
      floor: form.floor.trim() || undefined,
      facilities: form.facilities,
      openingTime: form.openingTime,
      closingTime: form.closingTime,
      requiresApproval: !!form.requiresApproval,
      instituteId: parseInt(form.instituteId, 10)
    };

    try {
      if (editingId) {
        await hallsApi.update(editingId, payload);
        addToast('Hall updated successfully', 'success');
      } else {
        await hallsApi.create(payload);
        addToast('Hall created successfully', 'success');
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      const msg = err.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} hall`;
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(hall) {
    if (!confirm(`Are you sure you want to deactivate "${hall.name}"?`)) return;
    try {
      await hallsApi.remove(hall.id);
      addToast('Hall deactivated', 'success');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to deactivate hall', 'error');
    }
  }

  if (loading) {
    return <div className="loading-container"><div className="spinner spinner-lg" /></div>;
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
          <div>
            <h1>Manage Halls</h1>
            <p className="text-muted" style={{ marginTop: 4 }}>{halls.length} halls total</p>
          </div>
          <button onClick={openAdd} className="btn btn-primary">
            <Plus size={16} /> Add Hall
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3>{editingId ? 'Edit Hall' : 'Add New Hall'}</h3>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Institute *</label>
                  <select
                    className={`form-input ${errors.instituteId ? 'form-input-error' : ''}`}
                    value={form.instituteId}
                    onChange={e => setForm({ ...form, instituteId: e.target.value })}
                  >
                    <option value="">Select institute...</option>
                    {institutes.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                  {errors.instituteId && <span className="form-error">{errors.instituteId}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Hall Code *</label>
                  <input
                    className={`form-input ${errors.code ? 'form-input-error' : ''}`}
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. DEGREE_SEM_HALL_2"
                    maxLength={20}
                  />
                  {errors.code && <span className="form-error">{errors.code}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Main Seminar Hall"
                    maxLength={150}
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Short Name</label>
                  <input
                    className="form-input"
                    value={form.shortName}
                    onChange={e => setForm({ ...form, shortName: e.target.value })}
                    placeholder="e.g. Main Hall"
                    maxLength={50}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Capacity *</label>
                  <input
                    className={`form-input ${errors.capacity ? 'form-input-error' : ''}`}
                    type="number"
                    min={1}
                    max={10000}
                    value={form.capacity}
                    onChange={e => setForm({ ...form, capacity: e.target.value })}
                  />
                  {errors.capacity && <span className="form-error">{errors.capacity}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    className="form-input"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Building A, 2nd Floor"
                    maxLength={255}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Floor</label>
                  <input
                    className="form-input"
                    value={form.floor}
                    onChange={e => setForm({ ...form, floor: e.target.value })}
                    placeholder="e.g. 1st Floor"
                    maxLength={20}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={form.requiresApproval}
                      onChange={e => setForm({ ...form, requiresApproval: e.target.checked })}
                      style={{ marginRight: 6 }}
                    />
                    Requires Admin Approval
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Opening Time *</label>
                  <input
                    type="time"
                    className={`form-input ${errors.openingTime ? 'form-input-error' : ''}`}
                    value={form.openingTime}
                    onChange={e => setForm({ ...form, openingTime: e.target.value + ':00' })}
                  />
                  {errors.openingTime && <span className="form-error">{errors.openingTime}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Closing Time *</label>
                  <input
                    type="time"
                    className={`form-input ${errors.closingTime ? 'form-input-error' : ''}`}
                    value={form.closingTime}
                    onChange={e => setForm({ ...form, closingTime: e.target.value + ':00' })}
                  />
                  {errors.closingTime && <span className="form-error">{errors.closingTime}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the hall..."
                  rows={2}
                  maxLength={1000}
                />
              </div>

              {/* Facilities */}
              <div className="form-group">
                <label className="form-label">Facilities</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {FACILITY_OPTIONS.map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleFacility(f)}
                      className={`btn btn-sm ${form.facilities.includes(f) ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {form.facilities.includes(f) && <Check size={12} />}
                      {f}
                    </button>
                  ))}
                </div>
                {form.facilities.length > 0 && (
                  <div className="text-xs text-muted" style={{ marginBottom: 6 }}>
                    Selected: {form.facilities.join(', ')}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="form-input"
                    value={facilityInput}
                    onChange={e => setFacilityInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomFacility(); } }}
                    placeholder="Add custom facility..."
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={addCustomFacility} className="btn btn-secondary btn-sm">Add</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingId ? 'Update Hall' : 'Create Hall')}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Halls Grid */}
        {halls.length === 0 ? (
          <div className="empty-state card">
            <Building2 size={48} />
            <h3>No halls found</h3>
            <p>Add your first hall to get started.</p>
            <button onClick={openAdd} className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
              <Plus size={16} /> Add Hall
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3" style={{ gap: 'var(--space-4)' }}>
            {halls.map(h => (
              <div key={h.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                  <div style={{
                    width: 40, height: 40, background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)', borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Building2 size={20} />
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span className={`badge ${h.is_active ? 'badge-success' : 'badge-secondary'}`}>
                      {h.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {h.requires_approval === 1 && (
                      <span className="badge badge-warning" style={{ fontSize: 10 }}>Approval</span>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 2 }}>
                  {h.code}
                </div>
                <h4 style={{ marginBottom: 4 }}>{h.name}</h4>
                <div className="text-sm text-muted" style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 'var(--space-3)' }}>
                  {h.institute_name && <span style={{ fontSize: 'var(--font-size-xs)' }}>{h.institute_name}</span>}
                  {h.location && <span><MapPin size={11} style={{ marginRight: 4 }} />{h.location}</span>}
                  <span><Users size={11} style={{ marginRight: 4 }} />Capacity: {h.capacity}</span>
                  {h.opening_time && h.closing_time && (
                    <span style={{ fontSize: 'var(--font-size-xs)' }}>
                      Hours: {h.opening_time.substring(0,5)} – {h.closing_time.substring(0,5)}
                    </span>
                  )}
                </div>
                {h.facilities && Array.isArray(h.facilities) && h.facilities.length > 0 && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {h.facilities.slice(0, 3).map((f, i) => (
                      <span key={i} className="badge badge-secondary" style={{ fontSize: 10 }}>{f}</span>
                    ))}
                    {h.facilities.length > 3 && (
                      <span className="badge badge-secondary" style={{ fontSize: 10 }}>+{h.facilities.length - 3}</span>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(h)} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => handleDelete(h)} className="btn btn-danger btn-sm" style={{ flex: 1 }}>
                    <Trash2 size={12} /> Disable
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
