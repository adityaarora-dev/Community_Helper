-- ==============================================================================
-- Intelligent Community Resource Chatbot - Database Initialization DDL & Seed
-- ==============================================================================

-- 1. CLEANUP PREVIOUS TABLES (Ordered for Foreign Key Dependencies)
DROP TABLE IF EXISTS scheme_notifications;
DROP TABLE IF EXISTS citizen_sessions;
DROP TABLE IF EXISTS user_interactions;
DROP TABLE IF EXISTS eligibility_rules;
DROP TABLE IF EXISTS govt_schemes;
DROP TABLE IF EXISTS service_centers;
DROP TABLE IF EXISTS users;

-- ==============================================================================
-- 2. TABLES DEFINITION
-- ==============================================================================

-- USERS TABLE
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  annual_income NUMERIC CHECK (annual_income >= 0),
  family_size INT CHECK (family_size > 0),
  location_zone VARCHAR(100),
  age INT CHECK (age >= 0 AND age <= 120),
  gender VARCHAR(50),
  occupation VARCHAR(100),
  social_category VARCHAR(50),
  disability_status BOOLEAN DEFAULT FALSE,
  landholding_acres NUMERIC DEFAULT 0 CHECK (landholding_acres >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GOVERNMENT SCHEMES TABLE
CREATE TABLE govt_schemes (
  scheme_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL, -- e.g., 'Housing', 'Agriculture', 'Healthcare', 'Education'
  total_benefit_value NUMERIC NOT NULL,
  required_documents TEXT,        -- Comma-separated or descriptive list of required documents
  official_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ELIGIBILITY RULES TABLE (Core relational filtering table)
CREATE TABLE eligibility_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id UUID NOT NULL REFERENCES govt_schemes(scheme_id) ON DELETE CASCADE,
  max_income NUMERIC,                        -- NULL = no upper income ceiling
  min_age INT DEFAULT 0,
  max_age INT DEFAULT 120,
  target_gender VARCHAR(50),                 -- NULL = open to all genders
  min_family_size INT DEFAULT 1,
  target_occupation VARCHAR(100),            -- NULL = all occupations eligible
  target_social_category VARCHAR(50),        -- NULL = all categories eligible
  requires_disability BOOLEAN DEFAULT FALSE,
  max_landholding NUMERIC                    -- NULL = no ceiling on landholding
);

-- SERVICE CENTERS TABLE (Facilitation & help centers)
CREATE TABLE service_centers (
  center_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  location_zone VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(50),
  operating_hours VARCHAR(100)
);

-- USER INTERACTIONS TABLE (Tracks chatbot extraction & matched schemes)
CREATE TABLE user_interactions (
  interaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  raw_query TEXT NOT NULL,
  extracted_payload JSONB NOT NULL,
  matched_scheme_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. PERFORMANCE INDEXES
-- ==============================================================================

-- B-tree indexes on eligibility_rules for fast relational filtering queries
CREATE INDEX idx_eligibility_rules_scheme_id ON eligibility_rules(scheme_id);
CREATE INDEX idx_eligibility_rules_income ON eligibility_rules(max_income);
CREATE INDEX idx_eligibility_rules_age ON eligibility_rules(min_age, max_age);
CREATE INDEX idx_eligibility_rules_gender ON eligibility_rules(target_gender);
CREATE INDEX idx_eligibility_rules_occupation ON eligibility_rules(target_occupation);
CREATE INDEX idx_eligibility_rules_social_category ON eligibility_rules(target_social_category);
CREATE INDEX idx_eligibility_rules_disability ON eligibility_rules(requires_disability);

-- B-tree index on service centers by zone for geolocation filtering
CREATE INDEX idx_service_centers_zone ON service_centers(location_zone);

-- User interactions tracking index
CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_created_at ON user_interactions(created_at);

-- ==============================================================================
-- 4. REALISTIC CIVIC & WELFARE SCHEME SEED DATA
-- ==============================================================================

-- Scheme 1: PM Kisan Samman Nidhi
INSERT INTO govt_schemes (scheme_name, description, category, total_benefit_value, required_documents, official_url)
VALUES (
  'PM Kisan Samman Nidhi',
  'Financial support of ₹6,000 per year in three equal installments directly transferred to farmer bank accounts.',
  'Agriculture',
  6000,
  'Aadhaar Card, Landholding Ownership Records (Khata/Khatoni), Bank Account Passbook',
  'https://pmkisan.gov.in'
);

INSERT INTO eligibility_rules (scheme_id, max_income, min_age, max_age, target_gender, min_family_size, target_occupation, target_social_category, requires_disability, max_landholding)
SELECT scheme_id, 300000, 18, 120, NULL, 1, 'Farmer', NULL, FALSE, 5.0
FROM govt_schemes
WHERE scheme_name = 'PM Kisan Samman Nidhi';

-- Scheme 2: Pradhan Mantri Awas Yojana (PMAY Housing)
INSERT INTO govt_schemes (scheme_name, description, category, total_benefit_value, required_documents, official_url)
VALUES (
  'Pradhan Mantri Awas Yojana (PMAY Housing)',
  'Financial assistance and interest subsidies up to ₹2.5 Lakh for low-income families constructing their first pucca house.',
  'Housing',
  250000,
  'Aadhaar Card, Income Certificate, BPL/Ration Card, Bank Statement, Affidavit of No Pucca House',
  'https://pmaymis.gov.in'
);

INSERT INTO eligibility_rules (scheme_id, max_income, min_age, max_age, target_gender, min_family_size, target_occupation, target_social_category, requires_disability, max_landholding)
SELECT scheme_id, 300000, 18, 120, NULL, 2, NULL, NULL, FALSE, NULL
FROM govt_schemes
WHERE scheme_name = 'Pradhan Mantri Awas Yojana (PMAY Housing)';

-- Scheme 3: Ayushman Bharat (PM-JAY Health Protection)
INSERT INTO govt_schemes (scheme_name, description, category, total_benefit_value, required_documents, official_url)
VALUES (
  'Ayushman Bharat - PM-JAY',
  'Annual health coverage up to ₹5,00,000 per family for secondary and tertiary cashless healthcare hospitalization.',
  'Healthcare',
  500000,
  'Aadhaar Card, Ration Card (SECC Listed), Proof of Family Identity',
  'https://nha.gov.in/PM-JAY'
);

INSERT INTO eligibility_rules (scheme_id, max_income, min_age, max_age, target_gender, min_family_size, target_occupation, target_social_category, requires_disability, max_landholding)
SELECT scheme_id, 250000, 0, 120, NULL, 1, NULL, NULL, FALSE, NULL
FROM govt_schemes
WHERE scheme_name = 'Ayushman Bharat - PM-JAY';

-- Scheme 4: Sukanya Samriddhi Yojana (Girl Child Savings)
INSERT INTO govt_schemes (scheme_name, description, category, total_benefit_value, required_documents, official_url)
VALUES (
  'Sukanya Samriddhi Yojana',
  'Government-backed savings scheme for girl children with high interest rates and tax exemptions to secure higher education.',
  'Education',
  150000,
  'Birth Certificate of Girl Child, Parents Aadhaar Card, Address Proof, Passport Photos',
  'https://www.indiapost.gov.in'
);

INSERT INTO eligibility_rules (scheme_id, max_income, min_age, max_age, target_gender, min_family_size, target_occupation, target_social_category, requires_disability, max_landholding)
SELECT scheme_id, NULL, 0, 10, 'Female', 1, NULL, NULL, FALSE, NULL
FROM govt_schemes
WHERE scheme_name = 'Sukanya Samriddhi Yojana';

-- Scheme 5: National Disability Pension Scheme
INSERT INTO govt_schemes (scheme_name, description, category, total_benefit_value, required_documents, official_url)
VALUES (
  'National Disability Pension Scheme',
  'Monthly pension support providing ₹1,000 to ₹2,000 per month for persons with severe disabilities living below poverty line.',
  'Healthcare',
  18000,
  'Disability Certificate (>40% disability), Aadhaar Card, BPL Card, Bank Account Details',
  'https://nsap.nic.in'
);

INSERT INTO eligibility_rules (scheme_id, max_income, min_age, max_age, target_gender, min_family_size, target_occupation, target_social_category, requires_disability, max_landholding)
SELECT scheme_id, 200000, 18, 120, NULL, 1, NULL, NULL, TRUE, NULL
FROM govt_schemes
WHERE scheme_name = 'National Disability Pension Scheme';

-- Scheme 6: PM SVANidhi (Micro-Credit for Street Vendors)
INSERT INTO govt_schemes (scheme_name, description, category, total_benefit_value, required_documents, official_url)
VALUES (
  'PM SVANidhi (Street Vendor Loan)',
  'Collateral-free working capital micro-loans of ₹10,000 to ₹50,000 with 7% interest subsidy for urban street vendors.',
  'Financial Inclusion',
  50000,
  'Aadhaar Card, Certificate of Vending/Vendor ID Card from Municipality, Bank Passbook',
  'https://pmsvanidhi.mohua.gov.in'
);

INSERT INTO eligibility_rules (scheme_id, max_income, min_age, max_age, target_gender, min_family_size, target_occupation, target_social_category, requires_disability, max_landholding)
SELECT scheme_id, 350000, 18, 120, NULL, 1, 'Street Vendor', NULL, FALSE, NULL
FROM govt_schemes
WHERE scheme_name = 'PM SVANidhi (Street Vendor Loan)';

-- Scheme 7: Post-Matric Scholarship for SC/ST/OBC Students
INSERT INTO govt_schemes (scheme_name, description, category, total_benefit_value, required_documents, official_url)
VALUES (
  'Post-Matric Scholarship for SC/ST/OBC',
  '100% compulsory non-refundable fees reimbursement and annual maintenance allowance for marginalized students in higher education.',
  'Education',
  35000,
  'Caste/Community Certificate, Income Certificate, Previous Year Marksheets, Aadhaar Card, College Fee Receipt',
  'https://scholarships.gov.in'
);

INSERT INTO eligibility_rules (scheme_id, max_income, min_age, max_age, target_gender, min_family_size, target_occupation, target_social_category, requires_disability, max_landholding)
SELECT scheme_id, 250000, 15, 30, NULL, 1, 'Student', 'SC/ST/OBC', FALSE, NULL
FROM govt_schemes
WHERE scheme_name = 'Post-Matric Scholarship for SC/ST/OBC';

-- ==============================================================================
-- 5. REALISTIC SERVICE CENTERS SEED DATA
-- ==============================================================================
INSERT INTO service_centers (name, address, location_zone, contact_phone, operating_hours)
VALUES
  (
    'Central Civic Facilitation Center (Seva Kendra)',
    'Ground Floor, Block B, Civic Center, Connaught Circle',
    'Central Zone',
    '+91 11 2345 6789',
    '09:00 AM - 05:30 PM (Mon-Sat)'
  ),
  (
    'North District Public Welfare Helpdesk',
    'Plot 44, Civil Lines, Near Metro Gate 3, Sector 5',
    'North Zone',
    '+91 11 8765 4321',
    '09:30 AM - 05:00 PM (Mon-Fri)'
  ),
  (
    'South Zone Citizen Service Hub & Aadhaar Kendra',
    '88 Green Park Extension, Main Market Complex',
    'South Zone',
    '+91 11 4567 8901',
    '08:30 AM - 06:00 PM (Mon-Sat)'
  ),
  (
    'East Sub-Divisional Public Assistance Center',
    '21 Vikas Marg, Preet Vihar Community Center',
    'East Zone',
    '+91 11 3456 7890',
    '09:00 AM - 05:00 PM (Mon-Fri)'
  ),
  (
    'West Community Welfare & Enrollment Center',
    '105 Shivaji Enclave, Rajouri Garden Administrative Block',
    'West Zone',
    '+91 11 5678 1234',
    '09:00 AM - 05:30 PM (Mon-Sat)'
  );
