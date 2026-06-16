-- Tenant Onboarding App - Supabase Schema
-- Run this in your Supabase SQL editor (no parameter changes needed)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Properties table (pre-populated from Hornbeam Park list)
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert property names from Excel 'Known As' column
INSERT INTO properties (name) VALUES
('1 Hornbeam Square South'),
('2 Crimple House Cottages'),
('2 Montpellier Street'),
('21 James Street'),
('23-24 West Park'),
('23-27 James Street'),
('24 Oxford Street'),
('24-26 James Street'),
('25 West Park'),
('25A West Park'),
('26A West Park'),
('30 Robert Street'),
('32 Robert Street'),
('34 James Street'),
('36 James Street'),
('36A James Street'),
('36B James Street'),
('38 James Street'),
('4 North Park Road'),
('4-6 North Park Road'),
('40 James Street'),
('44-46 James Street'),
('48 James Street'),
('5 Cambridge Crescent'),
('5 Station Road'),
('6 North Park Road'),
('62 York Place'),
('7 Station Road'),
('9-24 Thirkill Park'),
('A1'),
('A2'),
('A3'),
('B1'),
('B2'),
('B3'),
('Building 1 Hookstone Park (B)'),
('Building 2 Hookstone Park (B)'),
('Building 3 Hookstone Park (B)'),
('C'),
('Car Park F'),
('D'),
('Gardner Garage'),
('Gardner House'),
('Gardner Lodge'),
('H2'),
('H4'),
('H5'),
('I1 Hornbeam Park Oval Car Park'),
('I2'),
('I3'),
('I4'),
('I5'),
('I6'),
('I7'),
('IMO Car Wash'),
('J3'),
('J5'),
('M1'),
('M2'),
('M3'),
('M4'),
('Milner Court'),
('Mitre House'),
('Office, Hookstone Park (A)'),
('One Sceptre House'),
('Sterling House'),
('Strayside House'),
('The Hamlet'),
('The Inspire'),
('The Lenz'),
('The Lodge'),
('The Tower'),
('Thirkill House'),
('Unit 1, Thirkill Park'),
('Unit 2, Thirkill Park'),
('Unit 3, Thirkill Park'),
('Unit 4, Thirkill Park'),
('Unit 5, Thirkill Park'),
('Unit 6, Thirkill Park'),
('Unit 7, Thirkill Park'),
('Unit 8, Thirkill Park'),
('Unit 9, Thirkill Park'),
('Unit 10, Thirkill Park'),
('Unit 11, Thirkill Park'),
('Unit 12, Thirkill Park'),
('Unit 13, Thirkill Park'),
('Unit 14, Thirkill Park'),
('Unit 15, Thirkill Park'),
('Unit 16, Thirkill Park'),
('Unit 17, Thirkill Park'),
('Unit 18, Thirkill Park'),
('Unit 19, Thirkill Park'),
('Unit 20, Thirkill Park'),
('Unit 21, Thirkill Park'),
('Unit 22, Thirkill Park'),
('Unit 23, Thirkill Park'),
('Unit 24, Thirkill Park'),
('Valley House'),
('Victoria Park House'),
('Warehouse, Hookstone Park (A)');

-- Onboarding table
CREATE TABLE onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id),
  unit_reference VARCHAR(100) NOT NULL,
  tenant_names TEXT NOT NULL,
  start_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'in-progress', 'completed')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Handover details
CREATE TABLE handover_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  onboarding_id UUID NOT NULL UNIQUE REFERENCES onboarding(id) ON DELETE CASCADE,
  handover_date DATE,
  keys_handed VARCHAR(10) DEFAULT 'na' CHECK (keys_handed IN ('yes', 'no', 'na')),
  codes_handed TEXT,
  access_restricted_to_tenant_only BOOLEAN DEFAULT FALSE,
  gate_access_granted BOOLEAN DEFAULT FALSE
);

-- Compliance documents
CREATE TABLE compliance_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  onboarding_id UUID NOT NULL REFERENCES onboarding(id) ON DELETE CASCADE,
  doc_type VARCHAR(100) NOT NULL,
  document_date DATE NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Meters
CREATE TABLE meters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  onboarding_id UUID NOT NULL REFERENCES onboarding(id) ON DELETE CASCADE,
  meter_type VARCHAR(50) NOT NULL CHECK (meter_type IN ('electricity', 'gas', 'water')),
  meter_number VARCHAR(100) NOT NULL,
  supply_ref VARCHAR(100),
  meter_serial_nr VARCHAR(100),
  day_night_flag BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Meter readings (one per meter)
CREATE TABLE meter_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meter_id UUID NOT NULL UNIQUE REFERENCES meters(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  reading_value NUMERIC(10,2) NOT NULL,
  photo_file_path VARCHAR(500),
  extracted_by_ocr BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Signage
CREATE TABLE signage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  onboarding_id UUID NOT NULL UNIQUE REFERENCES onboarding(id) ON DELETE CASCADE,
  directories_updated BOOLEAN,
  postbox_labels_updated BOOLEAN,
  parking_labels_updated BOOLEAN,
  other_signage TEXT,
  completed_date DATE,
  notes TEXT
);

-- Workflow steps (standard)
CREATE TABLE compliance_workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  onboarding_id UUID NOT NULL REFERENCES onboarding(id) ON DELETE CASCADE,
  step_name VARCHAR(100) NOT NULL,
  is_complete BOOLEAN DEFAULT FALSE,
  completed_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Custom workflow steps (one-off)
CREATE TABLE custom_workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  onboarding_id UUID NOT NULL REFERENCES onboarding(id) ON DELETE CASCADE,
  step_name VARCHAR(255) NOT NULL,
  is_complete BOOLEAN DEFAULT FALSE,
  completed_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tenant contacts
CREATE TABLE tenant_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  onboarding_id UUID NOT NULL REFERENCES onboarding(id) ON DELETE CASCADE,
  contact_type VARCHAR(50) NOT NULL CHECK (contact_type IN ('principal', 'accounts', 'facilities', 'out-of-hours')),
  name VARCHAR(255) NOT NULL,
  tel VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_onboarding_property ON onboarding(property_id);
CREATE INDEX idx_onboarding_created_by ON onboarding(created_by);
CREATE INDEX idx_compliance_docs_onboarding ON compliance_documents(onboarding_id);
CREATE INDEX idx_meters_onboarding ON meters(onboarding_id);
CREATE INDEX idx_meter_readings_meter ON meter_readings(meter_id);
CREATE INDEX idx_workflow_steps_onboarding ON compliance_workflow_steps(onboarding_id);
CREATE INDEX idx_custom_steps_onboarding ON custom_workflow_steps(onboarding_id);
CREATE INDEX idx_tenant_contacts_onboarding ON tenant_contacts(onboarding_id);

-- Row Level Security (basic - adjust per your needs)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Policy: users can see all properties
CREATE POLICY "Users can see properties" ON properties FOR SELECT USING (true);

-- Policy: users can see all onboarding records (adjust if you want per-user filtering)
CREATE POLICY "Users can see onboarding" ON onboarding FOR SELECT USING (true);

-- Note: You'll need to add more granular RLS policies based on your auth setup
-- For now, this is a permissive starting point
