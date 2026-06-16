import React, { useState, useEffect } from 'react';
import {
  updateOnboarding,
  updateHandover,
  addComplianceDocument,
  deleteComplianceDocument,
  addMeter,
  deleteMeter,
  addMeterReading,
  getMeterReading,
  updateSignage,
  updateWorkflowStep,
  addCustomStep,
  deleteCustomStep,
  addTenantContact,
  deleteTenantContact,
  uploadFile,
  deleteFile,
  getFileUrl
} from '../utils/supabaseClient';
import { extractMeterReading } from '../utils/ocrService';
import { sendComplianceDocumentsEmail, sendUtilitiesInfoEmail, sendContactInfoRequestEmail } from '../utils/emailService';
import { generateSimpleOnboardingPDF } from '../utils/pdfService';
import { ChevronLeft, Upload, Plus, Trash2, Send, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';

function OnboardingPage({ onboarding: initialOnboarding, onBack, user }) {
  const [onboarding, setOnboarding] = useState(initialOnboarding);
  const [activeTab, setActiveTab] = useState('handover');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Handover state
  const [handoverData, setHandoverData] = useState(
    onboarding.handover_details ? { ...onboarding.handover_details } : {
      handover_date: '',
      keys_handed: 'na',
      codes_handed: '',
      access_restricted_to_tenant_only: false,
      gate_access_granted: false
    }
  );

  // Compliance documents state
  const [docType, setDocType] = useState('EICR');
  const [docDate, setDocDate] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [complianceDocs, setComplianceDocs] = useState(onboarding.compliance_documents || []);

  // Meters state
  const [meters, setMeters] = useState(onboarding.meters || []);
  const [newMeter, setNewMeter] = useState({
    meter_type: 'electricity',
    meter_number: '',
    supply_ref: '',
    meter_serial_nr: '',
    day_night_flag: false
  });
  const [meterReadings, setMeterReadings] = useState({});

  // Signage state
  const [signageData, setSignageData] = useState(
    onboarding.signage ? { ...onboarding.signage } : {
      directories_updated: null,
      postbox_labels_updated: null,
      parking_labels_updated: null,
      other_signage: '',
      notes: ''
    }
  );

  // Workflow state
  const [workflowSteps, setWorkflowSteps] = useState(onboarding.compliance_workflow_steps || []);
  const [customSteps, setCustomSteps] = useState(onboarding.custom_workflow_steps || []);
  const [newCustomStep, setNewCustomStep] = useState('');

  // Contacts state
  const [contacts, setContacts] = useState(onboarding.tenant_contacts || []);
  const [newContact, setNewContact] = useState({
    contact_type: 'principal',
    name: '',
    tel: '',
    email: ''
  });

  // Load meter readings on mount
  useEffect(() => {
    loadMeterReadings();
  }, [meters]);

  const loadMeterReadings = async () => {
    const readings = {};
    for (const meter of meters) {
      const { data } = await getMeterReading(meter.id);
      if (data) readings[meter.id] = data;
    }
    setMeterReadings(readings);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Handover handlers
  const handleSaveHandover = async () => {
    setSaving(true);
    const { error } = await updateHandover(onboarding.id, handoverData);
    setSaving(false);
    if (error) {
      showMessage('error', 'Failed to save handover details');
    } else {
      showMessage('success', 'Handover details saved');
    }
  };

  // Compliance document handlers
  const handleAddCompliance = async () => {
    if (!docDate || !docType) {
      showMessage('error', 'Date and document type required');
      return;
    }

    setSaving(true);
    let filePath = null;

    if (docFile) {
      const filename = `${onboarding.id}/${Date.now()}_${docFile.name}`;
      const { error: uploadError } = await uploadFile(docFile, 'onboarding-files', filename);
      if (uploadError) {
        showMessage('error', 'File upload failed');
        setSaving(false);
        return;
      }
      filePath = filename;
    }

    const { error } = await addComplianceDocument(
      onboarding.id,
      docType,
      docDate,
      docNotes,
      filePath || ''
    );

    setSaving(false);
    if (error) {
      showMessage('error', 'Failed to add document');
    } else {
      showMessage('success', 'Document added');
      setDocType('EICR');
      setDocDate('');
      setDocNotes('');
      setDocFile(null);
      // Reload
      const updatedOnboarding = { ...onboarding, compliance_documents: [...(onboarding.compliance_documents || []), { doc_type: docType, document_date: docDate, notes: docNotes }] };
      setOnboarding(updatedOnboarding);
    }
  };

  const handleDeleteCompliance = async (id) => {
    setSaving(true);
    const doc = complianceDocs.find(d => d.id === id);
    if (doc?.file_path) {
      await deleteFile('onboarding-files', doc.file_path);
    }
    const { error } = await deleteComplianceDocument(id);
    setSaving(false);
    if (!error) {
      setComplianceDocs(complianceDocs.filter(d => d.id !== id));
      showMessage('success', 'Document deleted');
    }
  };

  // Meter handlers
  const handleAddMeter = async () => {
    if (!newMeter.meter_number || !newMeter.meter_type) {
      showMessage('error', 'Meter type and number required');
      return;
    }

    setSaving(true);
    const { data, error } = await addMeter(
      onboarding.id,
      newMeter.meter_type,
      newMeter.meter_number,
      newMeter.supply_ref,
      newMeter.meter_serial_nr,
      newMeter.day_night_flag
    );
    setSaving(false);

    if (error) {
      showMessage('error', 'Failed to add meter');
    } else {
      setMeters([...meters, data[0]]);
      setNewMeter({
        meter_type: 'electricity',
        meter_number: '',
        supply_ref: '',
        meter_serial_nr: '',
        day_night_flag: false
      });
      showMessage('success', 'Meter added');
    }
  };

  const handleDeleteMeter = async (id) => {
    setSaving(true);
    const { error } = await deleteMeter(id);
    setSaving(false);
    if (!error) {
      setMeters(meters.filter(m => m.id !== id));
      showMessage('success', 'Meter deleted');
    }
  };

  // Meter reading handlers
  const handleMeterPhotoUpload = async (meterId, file) => {
    showMessage('info', 'Extracting reading from image...');

    const result = await extractMeterReading(file);

    if (result.success) {
      // Found reading via OCR
      const newReading = result.reading;
      const today = new Date().toISOString().split('T')[0];

      // Upload photo
      const filename = `${onboarding.id}/${meterId}/${Date.now()}_meter.jpg`;
      await uploadFile(file, 'onboarding-files', filename);

      // Save reading
      const { error } = await addMeterReading(meterId, today, newReading, filename, true);
      if (!error) {
        setMeterReadings({
          ...meterReadings,
          [meterId]: { meter_id: meterId, reading_date: today, reading_value: newReading, extracted_by_ocr: true }
        });
        showMessage('success', `Reading extracted: ${newReading}`);
      }
    } else {
      showMessage('error', result.error);
    }
  };

  const handleSaveReading = async (meterId, readingValue) => {
    if (!readingValue) {
      showMessage('error', 'Enter a reading value');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    setSaving(true);
    const { error } = await addMeterReading(meterId, today, parseFloat(readingValue), null, false);
    setSaving(false);

    if (!error) {
      setMeterReadings({
        ...meterReadings,
        [meterId]: { meter_id: meterId, reading_date: today, reading_value: parseFloat(readingValue) }
      });
      showMessage('success', 'Reading saved');
    }
  };

  // Workflow handlers
  const handleToggleWorkflow = async (stepId) => {
    const step = workflowSteps.find(s => s.id === stepId);
    setSaving(true);
    const { error } = await updateWorkflowStep(stepId, !step.is_complete);
    setSaving(false);

    if (!error) {
      setWorkflowSteps(workflowSteps.map(s =>
        s.id === stepId ? { ...s, is_complete: !s.is_complete } : s
      ));
    }
  };

  const handleAddCustomStep = async () => {
    if (!newCustomStep.trim()) return;
    setSaving(true);
    const { data, error } = await addCustomStep(onboarding.id, newCustomStep);
    setSaving(false);

    if (!error) {
      setCustomSteps([...customSteps, data[0]]);
      setNewCustomStep('');
      showMessage('success', 'Step added');
    }
  };

  const handleDeleteCustomStep = async (id) => {
    setSaving(true);
    const { error } = await deleteCustomStep(id);
    setSaving(false);

    if (!error) {
      setCustomSteps(customSteps.filter(s => s.id !== id));
      showMessage('success', 'Step deleted');
    }
  };

  // Contact handlers
  const handleAddContact = async () => {
    if (!newContact.name) {
      showMessage('error', 'Name required');
      return;
    }

    setSaving(true);
    const { data, error } = await addTenantContact(
      onboarding.id,
      newContact.contact_type,
      newContact.name,
      newContact.tel,
      newContact.email
    );
    setSaving(false);

    if (!error) {
      setContacts([...contacts, data[0]]);
      setNewContact({ contact_type: 'principal', name: '', tel: '', email: '' });
      showMessage('success', 'Contact added');
    }
  };

  const handleDeleteContact = async (id) => {
    setSaving(true);
    const { error } = await deleteTenantContact(id);
    setSaving(false);

    if (!error) {
      setContacts(contacts.filter(c => c.id !== id));
      showMessage('success', 'Contact deleted');
    }
  };

  // Email handlers
  const handleEmailCompliance = async () => {
    const principalContact = contacts.find(c => c.contact_type === 'principal');
    if (!principalContact?.email) {
      showMessage('error', 'No principal contact email found');
      return;
    }

    setSaving(true);
    const { success, error } = await sendComplianceDocumentsEmail(
      principalContact.email,
      principalContact.name,
      onboarding.properties?.name,
      onboarding.unit_reference,
      complianceDocs
    );
    setSaving(false);

    if (success) {
      showMessage('success', `Email sent to ${principalContact.email}`);
    } else {
      showMessage('error', `Email failed: ${error}`);
    }
  };

  const handleEmailUtilities = async () => {
    const principalContact = contacts.find(c => c.contact_type === 'principal');
    if (!principalContact?.email) {
      showMessage('error', 'No principal contact email found');
      return;
    }

    setSaving(true);
    const metersWithReadings = meters.map(m => ({
      ...m,
      reading: meterReadings[m.id]
    }));

    const { success, error } = await sendUtilitiesInfoEmail(
      principalContact.email,
      principalContact.name,
      onboarding.properties?.name,
      onboarding.unit_reference,
      metersWithReadings
    );
    setSaving(false);

    if (success) {
      showMessage('success', `Email sent to ${principalContact.email}`);
    } else {
      showMessage('error', `Email failed: ${error}`);
    }
  };

  const handleEmailContacts = async () => {
    const principalContact = contacts.find(c => c.contact_type === 'principal');
    if (!principalContact?.email) {
      showMessage('error', 'No principal contact email found');
      return;
    }

    setSaving(true);
    const { success, error } = await sendContactInfoRequestEmail(
      principalContact.email,
      principalContact.name,
      onboarding.properties?.name
    );
    setSaving(false);

    if (success) {
      showMessage('success', `Contact form sent to ${principalContact.email}`);
    } else {
      showMessage('error', `Email failed: ${error}`);
    }
  };

  // PDF export
  const handleExportPDF = () => {
    const result = generateSimpleOnboardingPDF(onboarding);
    if (result.success) {
      showMessage('success', 'PDF exported');
    } else {
      showMessage('error', `PDF export failed: ${result.error}`);
    }
  };

  const progressPercentage = workflowSteps.length > 0
    ? Math.round((workflowSteps.filter(s => s.is_complete).length / workflowSteps.length) * 100)
    : 0;

  return (
    <div className="onboarding-page">
      <div className="onboarding-header">
        <button className="btn btn-secondary" onClick={onBack}>
          <ChevronLeft size={20} /> Back
        </button>
        <div className="header-content">
          <h2>{onboarding.unit_reference}</h2>
          <p>{onboarding.properties?.name} • {onboarding.tenant_names}</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExportPDF}>
          <Download size={20} /> Export PDF
        </button>
      </div>

      <div className="progress-section">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <p className="progress-text">{progressPercentage}% Complete</p>
      </div>

      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.type === 'success' && <CheckCircle size={16} />}
          {message.type === 'error' && <AlertCircle size={16} />}
          {message.type === 'info' && <Clock size={16} />}
          {message.text}
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'handover' ? 'active' : ''}`}
          onClick={() => setActiveTab('handover')}
        >
          Handover
        </button>
        <button
          className={`tab ${activeTab === 'compliance' ? 'active' : ''}`}
          onClick={() => setActiveTab('compliance')}
        >
          Compliance
        </button>
        <button
          className={`tab ${activeTab === 'utilities' ? 'active' : ''}`}
          onClick={() => setActiveTab('utilities')}
        >
          Utilities
        </button>
        <button
          className={`tab ${activeTab === 'signage' ? 'active' : ''}`}
          onClick={() => setActiveTab('signage')}
        >
          Signage
        </button>
        <button
          className={`tab ${activeTab === 'workflow' ? 'active' : ''}`}
          onClick={() => setActiveTab('workflow')}
        >
          Workflow
        </button>
        <button
          className={`tab ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          Contacts
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'handover' && <HandoverSection handoverData={handoverData} setHandoverData={setHandoverData} onSave={handleSaveHandover} saving={saving} />}
        {activeTab === 'compliance' && <ComplianceSection complianceDocs={complianceDocs} docType={docType} setDocType={setDocType} docDate={docDate} setDocDate={setDocDate} docNotes={docNotes} setDocNotes={setDocNotes} docFile={docFile} setDocFile={setDocFile} onAdd={handleAddCompliance} onDelete={handleDeleteCompliance} saving={saving} />}
        {activeTab === 'utilities' && <UtilitiesSection meters={meters} newMeter={newMeter} setNewMeter={setNewMeter} onAddMeter={handleAddMeter} onDeleteMeter={handleDeleteMeter} meterReadings={meterReadings} onPhotoUpload={handleMeterPhotoUpload} onSaveReading={handleSaveReading} onEmailUtilities={handleEmailUtilities} saving={saving} />}
        {activeTab === 'signage' && <SignageSection signageData={signageData} setSignageData={setSignageData} onSave={async () => { setSaving(true); await updateSignage(onboarding.id, signageData); setSaving(false); showMessage('success', 'Signage saved'); }} saving={saving} />}
        {activeTab === 'workflow' && <WorkflowSection workflowSteps={workflowSteps} customSteps={customSteps} newCustomStep={newCustomStep} setNewCustomStep={setNewCustomStep} onToggleWorkflow={handleToggleWorkflow} onAddCustomStep={handleAddCustomStep} onDeleteCustomStep={handleDeleteCustomStep} saving={saving} />}
        {activeTab === 'contacts' && <ContactsSection contacts={contacts} newContact={newContact} setNewContact={setNewContact} onAdd={handleAddContact} onDelete={handleDeleteContact} onEmailCompliance={handleEmailCompliance} onEmailContacts={handleEmailContacts} saving={saving} />}
      </div>
    </div>
  );
}

// Sub-components for each section
function HandoverSection({ handoverData, setHandoverData, onSave, saving }) {
  return (
    <div className="section">
      <h3>Tenant Handover</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Handover Date</label>
          <input type="date" value={handoverData.handover_date || ''} onChange={(e) => setHandoverData({ ...handoverData, handover_date: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Keys Handed Over</label>
          <select value={handoverData.keys_handed || 'na'} onChange={(e) => setHandoverData({ ...handoverData, keys_handed: e.target.value })}>
            <option value="na">N/A</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Codes Handed Over</label>
          <input type="text" placeholder="e.g., Gate code: 1234" value={handoverData.codes_handed || ''} onChange={(e) => setHandoverData({ ...handoverData, codes_handed: e.target.value })} />
        </div>
      </div>
      <div className="checkbox-group">
        <label>
          <input type="checkbox" checked={handoverData.access_restricted_to_tenant_only || false} onChange={(e) => setHandoverData({ ...handoverData, access_restricted_to_tenant_only: e.target.checked })} />
          Access Restricted to Tenant Only
        </label>
        <label>
          <input type="checkbox" checked={handoverData.gate_access_granted || false} onChange={(e) => setHandoverData({ ...handoverData, gate_access_granted: e.target.checked })} />
          Gate Access Granted
        </label>
      </div>
      <button className="btn btn-primary" onClick={onSave} disabled={saving}>Save Handover</button>
    </div>
  );
}

function ComplianceSection({ complianceDocs, docType, setDocType, docDate, setDocDate, docNotes, setDocNotes, docFile, setDocFile, onAdd, onDelete, saving }) {
  return (
    <div className="section">
      <h3>Compliance Documents</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Document Type</label>
          <input type="text" placeholder="e.g., EICR, Gas Certificate, Air-Con Service" value={docType} onChange={(e) => setDocType(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label>Notes</label>
        <textarea placeholder="Optional notes" value={docNotes} onChange={(e) => setDocNotes(e.target.value)} rows="2"></textarea>
      </div>
      <div className="form-group">
        <label>Upload Document (optional)</label>
        <input type="file" onChange={(e) => setDocFile(e.target.files?.[0])} />
      </div>
      <button className="btn btn-primary" onClick={onAdd} disabled={saving}><Plus size={16} /> Add Document</button>

      {complianceDocs.length > 0 && (
        <div className="documents-list">
          {complianceDocs.map(doc => (
            <div key={doc.id} className="doc-item">
              <span>{doc.doc_type} ({doc.document_date})</span>
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(doc.id)} disabled={saving}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UtilitiesSection({ meters, newMeter, setNewMeter, onAddMeter, onDeleteMeter, meterReadings, onPhotoUpload, onSaveReading, onEmailUtilities, saving }) {
  const [readingInputs, setReadingInputs] = useState({});

  return (
    <div className="section">
      <h3>Utilities & Meters</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Meter Type</label>
          <select value={newMeter.meter_type} onChange={(e) => setNewMeter({ ...newMeter, meter_type: e.target.value })}>
            <option value="electricity">Electricity</option>
            <option value="gas">Gas</option>
            <option value="water">Water</option>
          </select>
        </div>
        <div className="form-group">
          <label>Meter Number</label>
          <input type="text" placeholder="e.g., 123456789" value={newMeter.meter_number} onChange={(e) => setNewMeter({ ...newMeter, meter_number: e.target.value })} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Supply Reference</label>
          <input type="text" value={newMeter.supply_ref} onChange={(e) => setNewMeter({ ...newMeter, supply_ref: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Meter Serial Number</label>
          <input type="text" value={newMeter.meter_serial_nr} onChange={(e) => setNewMeter({ ...newMeter, meter_serial_nr: e.target.value })} />
        </div>
      </div>
      {newMeter.meter_type === 'electricity' && (
        <label>
          <input type="checkbox" checked={newMeter.day_night_flag} onChange={(e) => setNewMeter({ ...newMeter, day_night_flag: e.target.checked })} />
          Day/Night Tariff
        </label>
      )}
      <button className="btn btn-primary" onClick={onAddMeter} disabled={saving}><Plus size={16} /> Add Meter</button>

      {meters.length > 0 && (
        <div className="meters-list">
          {meters.map(meter => {
            const reading = meterReadings[meter.id];
            return (
              <div key={meter.id} className="meter-item card">
                <div className="meter-header">
                  <h4>{meter.meter_type.toUpperCase()} - {meter.meter_number}</h4>
                  <button className="btn btn-danger btn-sm" onClick={() => onDeleteMeter(meter.id)} disabled={saving}><Trash2 size={14} /></button>
                </div>
                <p><small>{meter.supply_ref && `Supply Ref: ${meter.supply_ref}`}</small></p>

                <div className="reading-section">
                  <div className="form-group">
                    <label>Photo Upload (OCR)</label>
                    <input type="file" accept="image/*" onChange={(e) => onPhotoUpload(meter.id, e.target.files?.[0])} />
                  </div>

                  <div className="form-group">
                    <label>Reading Value {reading ? `(${reading.reading_date})` : ''}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={readingInputs[meter.id] || reading?.reading_value || ''}
                      onChange={(e) => setReadingInputs({ ...readingInputs, [meter.id]: e.target.value })}
                      placeholder="Enter meter reading"
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => onSaveReading(meter.id, readingInputs[meter.id] || '')} disabled={saving}>Save Reading</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button className="btn btn-primary" onClick={onEmailUtilities} disabled={saving}><Send size={16} /> Email Utilities Info</button>
    </div>
  );
}

function SignageSection({ signageData, setSignageData, onSave, saving }) {
  return (
    <div className="section">
      <h3>Signage Updated</h3>
      <div className="checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={signageData.directories_updated === true}
            onChange={(e) => setSignageData({ ...signageData, directories_updated: e.target.checked ? true : null })}
          />
          Directories Updated
        </label>
        <label>
          <input
            type="checkbox"
            checked={signageData.postbox_labels_updated === true}
            onChange={(e) => setSignageData({ ...signageData, postbox_labels_updated: e.target.checked ? true : null })}
          />
          Postbox Labels Updated
        </label>
        <label>
          <input
            type="checkbox"
            checked={signageData.parking_labels_updated === true}
            onChange={(e) => setSignageData({ ...signageData, parking_labels_updated: e.target.checked ? true : null })}
          />
          Parking Labels Updated
        </label>
      </div>
      <div className="form-group">
        <label>Other Signage Requirements</label>
        <textarea placeholder="e.g., Door numbering, directional signs" value={signageData.other_signage || ''} onChange={(e) => setSignageData({ ...signageData, other_signage: e.target.value })} rows="2"></textarea>
      </div>
      <div className="form-group">
        <label>Notes</label>
        <textarea value={signageData.notes || ''} onChange={(e) => setSignageData({ ...signageData, notes: e.target.value })} rows="2"></textarea>
      </div>
      <button className="btn btn-primary" onClick={onSave} disabled={saving}>Save Signage</button>
    </div>
  );
}

function WorkflowSection({ workflowSteps, customSteps, newCustomStep, setNewCustomStep, onToggleWorkflow, onAddCustomStep, onDeleteCustomStep, saving }) {
  return (
    <div className="section">
      <h3>Workflow Checklist</h3>

      {workflowSteps.length > 0 && (
        <div className="checklist">
          {workflowSteps.map(step => (
            <label key={step.id} className="checklist-item">
              <input type="checkbox" checked={step.is_complete} onChange={() => onToggleWorkflow(step.id)} disabled={saving} />
              <span>{step.step_name}</span>
              {step.is_complete && <CheckCircle size={16} className="check-icon" />}
            </label>
          ))}
        </div>
      )}

      <div className="custom-steps">
        <h4>Custom Steps</h4>
        {customSteps.length > 0 && (
          <div className="checklist">
            {customSteps.map(step => (
              <div key={step.id} className="custom-step-item">
                <label>
                  <input type="checkbox" checked={step.is_complete} onChange={() => onToggleWorkflow(step.id)} disabled={saving} />
                  <span>{step.step_name}</span>
                </label>
                <button className="btn btn-danger btn-sm" onClick={() => onDeleteCustomStep(step.id)} disabled={saving}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="form-group">
          <input type="text" placeholder="Add custom step" value={newCustomStep} onChange={(e) => setNewCustomStep(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={onAddCustomStep} disabled={saving}><Plus size={16} /> Add</button>
        </div>
      </div>
    </div>
  );
}

function ContactsSection({ contacts, newContact, setNewContact, onAdd, onDelete, onEmailCompliance, onEmailContacts, saving }) {
  return (
    <div className="section">
      <h3>Tenant Contacts</h3>

      <div className="form-row">
        <div className="form-group">
          <label>Contact Type</label>
          <select value={newContact.contact_type} onChange={(e) => setNewContact({ ...newContact, contact_type: e.target.value })}>
            <option value="principal">Principal</option>
            <option value="accounts">Accounts</option>
            <option value="facilities">Facilities</option>
            <option value="out-of-hours">Out of Hours</option>
          </select>
        </div>
        <div className="form-group">
          <label>Name *</label>
          <input type="text" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Phone</label>
          <input type="tel" value={newContact.tel} onChange={(e) => setNewContact({ ...newContact, tel: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} />
        </div>
      </div>

      <button className="btn btn-primary" onClick={onAdd} disabled={saving}><Plus size={16} /> Add Contact</button>

      {contacts.length > 0 && (
        <div className="contacts-list">
          {contacts.map(contact => (
            <div key={contact.id} className="contact-item">
              <div>
                <strong>{contact.name}</strong> ({contact.contact_type})
                {contact.tel && <p>{contact.tel}</p>}
                {contact.email && <p>{contact.email}</p>}
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(contact.id)} disabled={saving}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="email-buttons">
        <button className="btn btn-primary" onClick={onEmailCompliance} disabled={saving}><Send size={16} /> Email Compliance Docs</button>
        <button className="btn btn-primary" onClick={onEmailContacts} disabled={saving}><Send size={16} /> Request Contact Info</button>
      </div>
    </div>
  );
}

export default OnboardingPage;
