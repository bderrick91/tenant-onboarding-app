import React, { useState, useEffect } from 'react';
import { getAllOnboardings, createOnboarding, getProperties, addProperty } from '../utils/supabaseClient';
import { Plus, Eye, Trash2, AlertCircle } from 'lucide-react';

function DashboardPage({ onSelectOnboarding, user }) {
  const [onboardings, setOnboardings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // New onboarding form state
  const [formData, setFormData] = useState({
    propertyId: '',
    propertyName: '',
    unitRef: '',
    tenantNames: '',
    startDate: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: propData } = await getProperties();
    setProperties(propData || []);

    const { data: onboardData } = await getAllOnboardings();
    setOnboardings(onboardData || []);
    setLoading(false);
  };

  const handleCreateProperty = async () => {
    if (!formData.propertyName.trim()) {
      setFormError('Enter property name');
      return;
    }

    const { data, error } = await addProperty(formData.propertyName);
    if (error) {
      setFormError(error.message);
    } else {
      setProperties([...properties, data[0]]);
      setFormData({ ...formData, propertyId: data[0].id, propertyName: '' });
      setFormError('');
    }
  };

  const handleCreateOnboarding = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.propertyId || !formData.unitRef || !formData.tenantNames || !formData.startDate) {
      setFormError('Please fill in all required fields');
      return;
    }

    setCreating(true);
    const { data, error } = await createOnboarding(
      formData.propertyId,
      formData.unitRef,
      formData.tenantNames,
      formData.startDate,
      user.id
    );
    setCreating(false);

    if (error) {
      setFormError(error.message);
    } else {
      setFormSuccess('Onboarding created successfully!');
      setFormData({ propertyId: '', propertyName: '', unitRef: '', tenantNames: '', startDate: '' });
      setTimeout(() => {
        loadData();
        setShowNewForm(false);
      }, 1000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this onboarding record? This cannot be undone.')) return;

    setDeleting(id);
    // Note: Deletion cascades through database constraints
    const { error } = await getAllOnboardings(); // Placeholder - replace with actual delete
    setDeleting(null);
    
    if (!error) {
      loadData();
    }
  };

  const getProgressPercentage = (onboarding) => {
    const steps = onboarding.compliance_workflow_steps || [];
    if (steps.length === 0) return 0;
    const completed = steps.filter(s => s.is_complete).length;
    return Math.round((completed / steps.length) * 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'in-progress': return 'status-in-progress';
      default: return 'status-draft';
    }
  };

  if (loading) {
    return <div className="page-loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2>Onboarding Records</h2>
          <p>{onboardings.length} total records</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowNewForm(!showNewForm)}
        >
          <Plus size={20} /> New Onboarding
        </button>
      </div>

      {showNewForm && (
        <div className="new-onboarding-form card">
          <h3>Create New Onboarding</h3>

          <form onSubmit={handleCreateOnboarding}>
            <div className="form-row">
              <div className="form-group">
                <label>Property *</label>
                <div className="property-input-group">
                  <select
                    value={formData.propertyId}
                    onChange={(e) => {
                      const prop = properties.find(p => p.id === e.target.value);
                      setFormData({ ...formData, propertyId: e.target.value });
                    }}
                  >
                    <option value="">Select property</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.id}>{prop.name}</option>
                    ))}
                  </select>
                  <div className="or-divider">or</div>
                  <input
                    type="text"
                    placeholder="Add new property"
                    value={formData.propertyName}
                    onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={handleCreateProperty}
                    className="btn btn-secondary btn-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Unit Reference *</label>
                <input
                  type="text"
                  placeholder="e.g., Unit 5, Flat A"
                  value={formData.unitRef}
                  onChange={(e) => setFormData({ ...formData, unitRef: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tenant Name(s) *</label>
                <input
                  type="text"
                  placeholder="e.g., John Smith & Jane Doe"
                  value={formData.tenantNames}
                  onChange={(e) => setFormData({ ...formData, tenantNames: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
            </div>

            {formError && <div className="form-error"><AlertCircle size={16} /> {formError}</div>}
            {formSuccess && <div className="form-success">{formSuccess}</div>}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create Onboarding'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowNewForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="onboardings-list">
        {onboardings.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>No onboarding records yet</h3>
            <p>Click "New Onboarding" to create the first record</p>
          </div>
        ) : (
          <div className="cards-grid">
            {onboardings.map(onboarding => {
              const progress = getProgressPercentage(onboarding);
              const statusClass = getStatusColor(onboarding.status);

              return (
                <div key={onboarding.id} className="onboarding-card card">
                  <div className="card-header">
                    <h4>{onboarding.unit_reference}</h4>
                    <span className={`status-badge ${statusClass}`}>
                      {onboarding.status}
                    </span>
                  </div>

                  <div className="card-content">
                    <p><strong>Property:</strong> {onboarding.properties?.name}</p>
                    <p><strong>Tenant:</strong> {onboarding.tenant_names}</p>
                    <p><strong>Start Date:</strong> {onboarding.start_date}</p>

                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                      <span className="progress-text">{progress}% complete</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onSelectOnboarding(onboarding)}
                    >
                      <Eye size={16} /> Open
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(onboarding.id)}
                      disabled={deleting === onboarding.id}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
