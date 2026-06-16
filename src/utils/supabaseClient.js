import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth Functions
export const signUp = async (username, email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  });
  return { data, error };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Onboarding Functions
export const createOnboarding = async (propertyId, unitRef, tenantNames, startDate, userId) => {
  const { data, error } = await supabase
    .from('onboarding')
    .insert([{
      property_id: propertyId,
      unit_reference: unitRef,
      tenant_names: tenantNames,
      start_date: startDate,
      created_by: userId,
      status: 'draft'
    }])
    .select();
  return { data, error };
};

export const getOnboarding = async (id) => {
  const { data, error } = await supabase
    .from('onboarding')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
};

export const getAllOnboardings = async () => {
  const { data, error } = await supabase
    .from('onboarding')
    .select(`
      *,
      properties(name),
      handover_details(*),
      compliance_documents(*),
      meters(*),
      compliance_workflow_steps(*),
      custom_workflow_steps(*),
      tenant_contacts(*)
    `)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const updateOnboarding = async (id, updates) => {
  const { data, error } = await supabase
    .from('onboarding')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', id)
    .select();
  return { data, error };
};

export const deleteOnboarding = async (id) => {
  const { error } = await supabase
    .from('onboarding')
    .delete()
    .eq('id', id);
  return { error };
};

// Properties
export const getProperties = async () => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('name');
  return { data, error };
};

export const addProperty = async (name) => {
  const { data, error } = await supabase
    .from('properties')
    .insert([{ name }])
    .select();
  return { data, error };
};

// Compliance Documents
export const addComplianceDocument = async (onboardingId, docType, docDate, notes, filePath) => {
  const { data, error } = await supabase
    .from('compliance_documents')
    .insert([{
      onboarding_id: onboardingId,
      doc_type: docType,
      document_date: docDate,
      file_path: filePath,
      notes
    }])
    .select();
  return { data, error };
};

export const deleteComplianceDocument = async (id) => {
  const { error } = await supabase
    .from('compliance_documents')
    .delete()
    .eq('id', id);
  return { error };
};

// Meters
export const addMeter = async (onboardingId, meterType, meterNumber, supplyRef, meterSerialNr, dayNightFlag) => {
  const { data, error } = await supabase
    .from('meters')
    .insert([{
      onboarding_id: onboardingId,
      meter_type: meterType,
      meter_number: meterNumber,
      supply_ref: supplyRef,
      meter_serial_nr: meterSerialNr,
      day_night_flag: dayNightFlag || false
    }])
    .select();
  return { data, error };
};

export const deleteMeter = async (id) => {
  const { error } = await supabase
    .from('meters')
    .delete()
    .eq('id', id);
  return { error };
};

// Meter Readings
export const addMeterReading = async (meterId, readingDate, readingValue, photoPath, extractedByOcr) => {
  const { data, error } = await supabase
    .from('meter_readings')
    .upsert([{
      meter_id: meterId,
      reading_date: readingDate,
      reading_value: readingValue,
      photo_file_path: photoPath,
      extracted_by_ocr: extractedByOcr || false
    }], { onConflict: 'meter_id' })
    .select();
  return { data, error };
};

export const getMeterReading = async (meterId) => {
  const { data, error } = await supabase
    .from('meter_readings')
    .select('*')
    .eq('meter_id', meterId)
    .single();
  return { data, error };
};

// Handover Details
export const updateHandover = async (onboardingId, handoverData) => {
  const existing = await supabase
    .from('handover_details')
    .select('id')
    .eq('onboarding_id', onboardingId)
    .single();

  if (existing.data) {
    const { data, error } = await supabase
      .from('handover_details')
      .update(handoverData)
      .eq('onboarding_id', onboardingId)
      .select();
    return { data, error };
  } else {
    const { data, error } = await supabase
      .from('handover_details')
      .insert([{ onboarding_id: onboardingId, ...handoverData }])
      .select();
    return { data, error };
  }
};

// Signage
export const updateSignage = async (onboardingId, signageData) => {
  const existing = await supabase
    .from('signage')
    .select('id')
    .eq('onboarding_id', onboardingId)
    .single();

  if (existing.data) {
    const { data, error } = await supabase
      .from('signage')
      .update(signageData)
      .eq('onboarding_id', onboardingId)
      .select();
    return { data, error };
  } else {
    const { data, error } = await supabase
      .from('signage')
      .insert([{ onboarding_id: onboardingId, ...signageData }])
      .select();
    return { data, error };
  }
};

// Workflow Steps
export const updateWorkflowStep = async (id, isComplete) => {
  const { data, error } = await supabase
    .from('compliance_workflow_steps')
    .update({
      is_complete: isComplete,
      completed_date: isComplete ? new Date().toISOString().split('T')[0] : null
    })
    .eq('id', id)
    .select();
  return { data, error };
};

export const addCustomStep = async (onboardingId, stepName) => {
  const { data, error } = await supabase
    .from('custom_workflow_steps')
    .insert([{
      onboarding_id: onboardingId,
      step_name: stepName,
      is_complete: false
    }])
    .select();
  return { data, error };
};

export const deleteCustomStep = async (id) => {
  const { error } = await supabase
    .from('custom_workflow_steps')
    .delete()
    .eq('id', id);
  return { error };
};

// Tenant Contacts
export const addTenantContact = async (onboardingId, contactType, name, tel, email) => {
  const { data, error } = await supabase
    .from('tenant_contacts')
    .insert([{
      onboarding_id: onboardingId,
      contact_type: contactType,
      name,
      tel,
      email
    }])
    .select();
  return { data, error };
};

export const deleteTenantContact = async (id) => {
  const { error } = await supabase
    .from('tenant_contacts')
    .delete()
    .eq('id', id);
  return { error };
};

// File Upload
export const uploadFile = async (file, bucket, path) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);
  return { data, error };
};

export const getFileUrl = (bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl;
};

export const deleteFile = async (bucket, path) => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return { error };
};
